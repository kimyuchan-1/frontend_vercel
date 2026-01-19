import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendClient } from "@/lib/backendClient";
import { transformSortParameter } from "@/lib/sortTransform";

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const { searchParams } = new URL(request.url);

    const page = parseIntSafe(searchParams.get("page"), 1);
    const size = parseIntSafe(searchParams.get("size"), 10);
    const search = (searchParams.get("search") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();
    const type = (searchParams.get("type") ?? "").trim();
    const region = (searchParams.get("region") ?? "").trim();
    const sortBy = (searchParams.get("sortBy") ?? "latest").trim();

    // 백엔드 API 호출
    const params: Record<string, any> = {
      page: page - 1, // Spring은 0-based
      size,
      sort: transformSortParameter(sortBy),
    };

    if (status && status !== "ALL") params.status = status;
    if (type && type !== "ALL") params.type = type;
    if (region && region !== "ALL") params.region = region;
    if (search) params.search = search;

    const response = await backendClient.get("/api/suggestions", {
      params,
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    const data = response.data;

    // Spring Page 응답을 프론트엔드 형식으로 변환
    const content = (data.content ?? []).map((item: any) => {
      // Extract sido and sigungu from address
      // 주소 형식: "서울특별시 중구 소공동 태평로2가 세종대로19길"
      const addressParts = (item.address ?? "").split(" ");
      const sido = addressParts[0] ?? "";
      const sigungu = addressParts[1] ?? "";

      return {
        id: item.id,
        title: item.title,
        content: item.content,
        location_lat: item.locationLat,
        location_lon: item.locationLon,
        address: item.address,
        sido: sido,
        sigungu: sigungu,
        suggestion_type: item.suggestionType,
        status: item.status,
        priority_score: item.priorityScore ?? 0.0,
        like_count: item.likeCount ?? 0,
        view_count: item.viewCount ?? 0,
        comment_count: item.commentCount ?? 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        user_id: item.userId,
        user: item.user ? { id: item.user.id, name: item.user.name, picture: item.user.picture ?? null } : null,
      };
    });

    return NextResponse.json({
      content,
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      currentPage: page,
      size,
    });
  } catch (error: any) {
    console.error("Suggestions API error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, suggestion_type, location_lat, location_lon, address, priority_score, sido_code, sigungu_code } = body;

    if (!title || !content || !suggestion_type || location_lat == null || location_lon == null || !address) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    // 백엔드 API 호출 (camelCase로 변환)
    const payload = {
      title,
      content,
      suggestionType: suggestion_type,
      locationLat: location_lat,
      locationLon: location_lon,
      address,
      priorityScore: priority_score != null ? priority_score : 0.0, // Double로 전달
      sidoCode: sido_code ?? null,
      sigunguCode: sigungu_code ?? null,
    };

    // console.log('[Suggestions API] Creating suggestion with payload:', payload);

    const response = await backendClient.post("/api/suggestions", payload, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    const item = response.data;

    // Cache invalidation strategy for CREATE operations:
    // - Invalidate board list cache to show new post immediately
    // - New post will appear when user navigates back to /board
    // - Graceful error handling: creation succeeds even if cache invalidation fails
    try {
      revalidatePath('/board', 'page');
      console.log('Cache invalidated for /board after post creation');
    } catch (revalidateError) {
      // Log error but don't fail the request
      console.error('Cache revalidation error:', revalidateError);
    }

    // 응답을 프론트엔드 형식으로 변환
    const result = {
      id: item.id,
      title: item.title,
      content: item.content,
      location_lat: item.locationLat,
      location_lon: item.locationLon,
      address: item.address,
      sido_code: item.sidoCode,
      sigungu_code: item.sigunguCode,
      suggestion_type: item.suggestionType,
      status: item.status,
      priority_score: item.priorityScore ?? 0.0,
      like_count: item.likeCount ?? 0,
      view_count: item.viewCount ?? 0,
      comment_count: item.commentCount ?? 0,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      user_id: item.userId,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Suggestions POST error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
