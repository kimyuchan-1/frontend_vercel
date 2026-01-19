import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendClient } from "@/lib/backendClient";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

function transformSuggestion(item: any) {
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
    sido_code: item.sidoCode,
    sigungu_code: item.sigunguCode,
    suggestion_type: item.suggestionType,
    status: item.status,
    priority_score: item.priorityScore ?? 0.0,
    like_count: item.likeCount ?? 0,
    view_count: item.viewCount ?? 0,
    comment_count: item.commentCount ?? 0,
    comment_count_num: item.commentCount ?? 0,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    processed_at: item.processedAt,
    admin_response: item.adminResponse,
    user_id: item.userId,
    user: item.user ? { id: item.user.id, name: item.user.name, picture: item.user.picture ?? null } : null,
    is_liked: item.isLiked ?? false,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const response = await backendClient.get(`/api/suggestions/${suggestionId}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    const item = response.data;

    if (!item) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(transformSuggestion(item));
  } catch (error: any) {
    console.error("Suggestion GET error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, suggestion_type, location_lat, location_lon, address } = body ?? {};

    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용은 필수입니다." }, { status: 400 });
    }

    const payload = {
      title,
      content,
      suggestion_type,
      location_lat,
      location_lon,
      address,
    };

    const response = await backendClient.put(`/api/suggestions/${suggestionId}`, payload, {
      headers: { Cookie: cookieHeader },
    });

    const item = response.data;

    if (!item) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }

    // Cache invalidation strategy for UPDATE operations:
    // - Invalidate detail page cache to show updated content immediately
    // - Invalidate board list cache to reflect changes in list view
    // - Graceful error handling: log errors but don't block the user operation
    // - If cache invalidation fails, ISR will still revalidate after 60 seconds
    try {
      revalidatePath(`/board/${id}`);
      revalidatePath('/board');
      console.log(`Cache invalidated for /board/${id} and /board`);
    } catch (revalidateError) {
      // Log error but don't fail the request
      console.error('Cache revalidation error:', revalidateError);
    }

    return NextResponse.json(transformSuggestion(item));
  } catch (error: any) {
    console.error("Suggestion PUT error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    await backendClient.delete(`/api/suggestions/${suggestionId}`, {
      headers: { Cookie: cookieHeader },
    });

    // Cache invalidation strategy for DELETE operations:
    // - Call revalidatePath with 'page' type to invalidate all route segments
    // - Invalidate both board list and detail page caches
    // - Graceful error handling: deletion succeeds even if cache invalidation fails
    // - Client-side uses cache-busting query parameter for additional safety
    try {
      revalidatePath('/board', 'page');
      revalidatePath(`/board/${id}`, 'page');
      console.log(`Cache invalidated for /board and /board/${id}`);
    } catch (revalidateError) {
      // Log error but don't fail the request
      console.error('Cache revalidation error:', revalidateError);
    }

    return NextResponse.json({ message: "건의사항이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Suggestion DELETE error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
