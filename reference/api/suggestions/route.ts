import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SortKey = "latest" | "popular" | "status";

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isNumericString(v: string) {
  return v.trim() !== "" && Number.isFinite(Number(v));
}

function districtIdToCodes(districtId: number) {
  const sido_code = Math.floor(districtId / 100000000);
  const sigungu_code = Math.floor(districtId / 100000);
  return { sido_code, sigungu_code };
}

async function resolveRegionCodes(regionRaw: string, supabase: ReturnType<typeof getSupabaseServerClient>) {
  const region = (regionRaw ?? "").trim();
  if (!region || region === "ALL") return { sido_code: null as number | null, sigungu_code: null as number | null };

  if (isNumericString(region)) {
    return { sido_code: Number(region), sigungu_code: null };
  }

  const { data, error } = await supabase
    .from("District")
    .select("district_id")
    .eq("district_name", region)
    .eq("available", 1)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.district_id) return { sido_code: null, sigungu_code: null }; // 지역명이 DB에 없으면 필터 안 걸리게

  const { sido_code, sigungu_code } = districtIdToCodes(Number(data.district_id));

  const isSigunguLevel = region.split(" ").length >= 2;

  return {
    sido_code,
    sigungu_code: isSigunguLevel ? sigungu_code : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseIntSafe(searchParams.get("page"), 1);
    const size = parseIntSafe(searchParams.get("size"), 10);
    const search = (searchParams.get("search") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();
    const type = (searchParams.get("type") ?? "").trim();
    const region = (searchParams.get("region") ?? "").trim();
    const sort = ((searchParams.get("sort") ?? "latest").trim() as SortKey) || "latest";

    const supabase = getSupabaseServerClient();

    // region → codes
    const { sido_code, sigungu_code } = await resolveRegionCodes(region, supabase);

    const from = Math.max(0, (page - 1) * size);
    const to = from + size - 1;

    // ✅ user join: users 테이블을 관계로 가져오기
    // FK: suggestions.user_id -> users.id 가 잡혀 있어야 "users(...)"가 동작함
    let q = supabase
      .from("suggestions")
      .select(
        `
        id,
        title,
        content,
        location_lat,
        location_lon,
        address,
        sido_code,
        sigungu_code,
        suggestion_type,
        status,
        like_count,
        view_count,
        comment_count,
        created_at,
        updated_at,
        user_id,
        users:users (
          id,
          name
        )
      `,
        { count: "exact" }
      );

    // 검색
    if (search) {
      const esc = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      q = q.or(`title.ilike.%${esc}%,content.ilike.%${esc}%,address.ilike.%${esc}%`);
    }

    // 필터
    if (status && status !== "ALL") q = q.eq("status", status);
    if (type && type !== "ALL") q = q.eq("suggestion_type", type);

    if (sido_code !== null) q = q.eq("sido_code", sido_code);
    if (sigungu_code !== null) q = q.eq("sigungu_code", sigungu_code);

    // 정렬
    if (sort === "popular") {
      q = q.order("like_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "status") {
      q = q.order("status", { ascending: true }).order("created_at", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    // 페이징
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ 더미 형태로 맞추고 싶으면 변환
    const content = (data ?? []).map((row: any) => ({
      ...row,
      // dummy와 동일하게 user 객체로 내려주기
      user: row.users ? { id: row.users.id, name: row.users.name, picture: row.users.picture ?? null } : null,
      // 내부 조인 결과 키 제거(원하면)
      users: undefined,
      // comment_count가 text라면 숫자형으로도 하나 만들어줄 수 있음
      comment_count_num: row.comment_count != null ? Number(row.comment_count) : 0,
    }));

    const totalElements = count ?? 0;
    const totalPages = Math.ceil(totalElements / size);

    return NextResponse.json({
      content,
      totalElements,
      totalPages,
      currentPage: page,
      size,
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, suggestion_type, location_lat, location_lon, address, sido_code, sigungu_code } = body;

    if (!title || !content || !suggestion_type || location_lat == null || location_lon == null || !address) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // TODO: 실제 로그인 붙이면 user_id는 세션에서 가져오기
    const user_id = 1;

    const payload = {
      title,
      content,
      suggestion_type,
      location_lat,
      location_lon,
      address,
      // 프론트가 코드로 보내는 걸 추천. 없으면 null로 둠
      sido_code: Number.isFinite(Number(sido_code)) ? Number(sido_code) : null,
      sigungu_code: Number.isFinite(Number(sigungu_code)) ? Number(sigungu_code) : null,
      status: "PENDING",
      like_count: 0,
      view_count: 0,
      comment_count: "0", // 현재 컬럼이 text라면 "0" (권장은 bigint)
      user_id,
    };

    const { data, error } = await supabase
      .from("suggestions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
