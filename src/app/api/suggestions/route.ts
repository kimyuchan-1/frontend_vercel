import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";

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

async function resolveRegionCodes(regionRaw: string, supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
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
  if (!data?.district_id) return { sido_code: null, sigungu_code: null };

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
    const sortBy = (searchParams.get("sortBy") ?? "latest").trim();

    const supabase = await getSupabaseServerClient();

    // region → codes
    const { sido_code, sigungu_code } = await resolveRegionCodes(region, supabase);

    const from = Math.max(0, (page - 1) * size);
    const to = from + size - 1;

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
          name,
          picture
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
    if (sortBy === "popular") {
      q = q.order("like_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (sortBy === "status") {
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

    // 프론트엔드 형식으로 변환
    const content = (data ?? []).map((row: any) => {
      // Extract sido and sigungu from address
      const addressParts = (row.address ?? "").split(" ");
      const sido = addressParts[0] ?? "";
      const sigungu = addressParts[1] ?? "";

      return {
        id: row.id,
        title: row.title,
        content: row.content,
        location_lat: row.location_lat,
        location_lon: row.location_lon,
        address: row.address,
        sido: sido,
        sigungu: sigungu,
        suggestion_type: row.suggestion_type,
        status: row.status,
        priority_score: 0.0,
        like_count: row.like_count ?? 0,
        view_count: row.view_count ?? 0,
        comment_count: row.comment_count ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_id: row.user_id,
        user: row.users ? { id: row.users.id, name: row.users.name, picture: row.users.picture ?? null } : null,
      };
    });

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
    console.error("Suggestions API error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, suggestion_type, location_lat, location_lon, address, priority_score, sido_code, sigungu_code } = body;

    if (!title || !content || !suggestion_type || location_lat == null || location_lon == null || !address) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const payload = {
      title,
      content,
      suggestion_type,
      location_lat,
      location_lon,
      address,
      sido_code: Number.isFinite(Number(sido_code)) ? Number(sido_code) : null,
      sigungu_code: Number.isFinite(Number(sigungu_code)) ? Number(sigungu_code) : null,
      status: "PENDING",
      like_count: 0,
      view_count: 0,
      comment_count: "0",
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

    // Cache invalidation strategy for CREATE operations:
    // - Invalidate board list cache to show new post immediately
    // - New post will appear when user navigates back to /board
    // - Graceful error handling: creation succeeds even if cache invalidation fails
    try {
      revalidatePath('/board', 'page');
    } catch (revalidateError) {
      // Log error but don't fail the request
      console.error('Cache revalidation error:', revalidateError);
    }

    // 응답을 프론트엔드 형식으로 변환
    const result = {
      id: data.id,
      title: data.title,
      content: data.content,
      location_lat: data.location_lat,
      location_lon: data.location_lon,
      address: data.address,
      sido_code: data.sido_code,
      sigungu_code: data.sigungu_code,
      suggestion_type: data.suggestion_type,
      status: data.status,
      priority_score: priority_score ?? 0.0,
      like_count: data.like_count ?? 0,
      view_count: data.view_count ?? 0,
      comment_count: data.comment_count ?? 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Suggestions POST error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
