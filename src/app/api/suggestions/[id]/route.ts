import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

function transformSuggestion(item: any) {
  // Extract sido and sigungu from address
  const addressParts = (item.address ?? "").split(" ");
  const sido = addressParts[0] ?? "";
  const sigungu = addressParts[1] ?? "";

  return {
    id: item.id,
    title: item.title,
    content: item.content,
    location_lat: item.location_lat,
    location_lon: item.location_lon,
    address: item.address,
    sido: sido,
    sigungu: sigungu,
    sido_code: item.sido_code,
    sigungu_code: item.sigungu_code,
    suggestion_type: item.suggestion_type,
    status: item.status,
    priority_score: 0.0,
    like_count: item.like_count ?? 0,
    view_count: item.view_count ?? 0,
    comment_count: item.comment_count ?? 0,
    comment_count_num: item.comment_count != null ? Number(item.comment_count) : 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
    user_id: item.user_id,
    user: item.user ? { id: item.user.id, name: item.user.name, picture: item.user.picture ?? null } : null,
    is_liked: item.is_liked ?? false,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const supabase = await getSupabaseServerClient();

    // 1) 조회수 증가
    const { error: rpcErr } = await supabase.rpc("inc_suggestion_view_count", { sid: suggestionId });
    if (rpcErr) {
      console.error("Supabase rpc error:", rpcErr);
      // 조회수 증가 실패해도 조회는 계속 진행
    }

    // 캐시 무효화 - 조회수 즉시 반영
    try {
      revalidatePath(`/board/${id}`);
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }

    // 2) 상세 조회 + user 조인
    const { data, error } = await supabase
      .from("suggestions")
      .select(`
        id, title, content, location_lat, location_lon, address,
        sido_code, sigungu_code, suggestion_type, status,
        like_count, view_count, comment_count, created_at, updated_at, user_id,
        user:users ( id, name, picture )
      `)
      .eq("id", suggestionId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }

    // TODO: 좋아요 여부 확인 (인증 구현 후)
    const is_liked = false;

    return NextResponse.json(transformSuggestion({ ...data, is_liked }));
  } catch (error: any) {
    console.error("Suggestion GET error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const body = await request.json();
    const { title, content, suggestion_type, location_lat, location_lon, address } = body ?? {};

    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용은 필수입니다." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 1) 상태 및 권한 확인 (PENDING이고 본인 글만 수정 가능)
    const { data: cur, error: curErr } = await supabase
      .from("suggestions")
      .select("id, status, user_id")
      .eq("id", suggestionId)
      .maybeSingle();

    if (curErr) {
      console.error("Supabase error:", curErr);
      return NextResponse.json({ error: curErr.message }, { status: 500 });
    }
    if (!cur) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }
    if (cur.user_id !== user_id) {
      return NextResponse.json({ error: "본인의 건의사항만 수정할 수 있습니다." }, { status: 403 });
    }
    if (cur.status !== "PENDING") {
      return NextResponse.json({ error: "접수 상태의 건의사항만 수정할 수 있습니다." }, { status: 400 });
    }

    // 2) 업데이트
    const { data, error } = await supabase
      .from("suggestions")
      .update({
        title,
        content,
        suggestion_type,
        location_lat,
        location_lon,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq("id", suggestionId)
      .select(`
        id, title, content, location_lat, location_lon, address,
        sido_code, sigungu_code, suggestion_type, status,
        like_count, view_count, comment_count, created_at, updated_at, user_id,
        user:users ( id, name, picture )
      `)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }

    // Cache invalidation strategy for UPDATE operations:
    // - Invalidate detail page cache to show updated content immediately
    // - Invalidate board list cache to reflect changes in list view
    // - Graceful error handling: log errors but don't block the user operation
    try {
      revalidatePath(`/board/${id}`);
      revalidatePath('/board');
    } catch (revalidateError) {
      console.error('Cache revalidation error:', revalidateError);
    }

    return NextResponse.json(transformSuggestion(data));
  } catch (error: any) {
    console.error("Suggestion PUT error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const supabase = await getSupabaseServerClient();

    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 1) 상태 및 권한 확인 (PENDING이고 본인 글만 삭제 가능)
    const { data: cur, error: curErr } = await supabase
      .from("suggestions")
      .select("id, status, user_id")
      .eq("id", suggestionId)
      .maybeSingle();

    if (curErr) {
      console.error("Supabase error:", curErr);
      return NextResponse.json({ error: curErr.message }, { status: 500 });
    }
    if (!cur) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }
    if (cur.user_id !== user_id) {
      return NextResponse.json({ error: "본인의 건의사항만 삭제할 수 있습니다." }, { status: 403 });
    }
    if (cur.status !== "PENDING") {
      return NextResponse.json({ error: "접수 상태의 건의사항만 삭제할 수 있습니다." }, { status: 400 });
    }

    // 2) 삭제
    const { error } = await supabase.from("suggestions").delete().eq("id", suggestionId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cache invalidation strategy for DELETE operations:
    // - Call revalidatePath with 'page' type to invalidate all route segments
    // - Invalidate both board list and detail page caches
    // - Graceful error handling: deletion succeeds even if cache invalidation fails
    try {
      revalidatePath('/board', 'page');
      revalidatePath(`/board/${id}`, 'page');
    } catch (revalidateError) {
      console.error('Cache revalidation error:', revalidateError);
    }

    return NextResponse.json({ message: "건의사항이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Suggestion DELETE error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
