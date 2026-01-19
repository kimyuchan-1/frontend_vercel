import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

type ApiComment = {
  id: number;
  suggestion_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  user: { id: number; name: string | null; picture?: string | null } | null;
  parent_id: number | null;
  replies: ApiComment[];
};

function transformComment(item: any, suggestionId: number): ApiComment {
  return {
    id: item.id,
    suggestion_id: suggestionId,
    content: item.content ?? "",
    created_at: item.created_at ?? new Date().toISOString(),
    updated_at: item.updated_at,
    user: item.users ? { id: item.users.id, name: item.users.name, picture: item.users.picture ?? null } : null,
    parent_id: item.parent_id ?? null,
    replies: [],
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

    const { data, error } = await supabase
      .from("suggestion_comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user_id,
        users:users (
          id,
          name,
          picture
        )
      `)
      .eq("suggestion_id", suggestionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allComments = (data ?? []).map((item: any) => transformComment(item, suggestionId));

    // 대댓글 구조화: parent_id가 null인 것만 최상위 댓글로
    const commentMap = new Map<number, ApiComment>();
    const rootComments: ApiComment[] = [];

    // 1단계: 모든 댓글을 Map에 저장
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 2단계: 대댓글을 부모 댓글의 replies에 추가
    allComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id === null) {
        // 최상위 댓글
        rootComments.push(commentWithReplies);
      } else {
        // 대댓글
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        } else {
          // 부모를 찾을 수 없으면 최상위로 처리
          rootComments.push(commentWithReplies);
        }
      }
    });

    return NextResponse.json(rootComments);
  } catch (error: any) {
    console.error("Comments GET error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const contentRaw = body?.content;
    const parent_id = body?.parent_id ?? null;

    const content = typeof contentRaw === "string" ? contentRaw.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: "댓글은 1000자 이내로 작성해주세요." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // parent_id 유효성 검사
    if (parent_id !== null) {
      const { data: parentComment, error: parentError } = await supabase
        .from("suggestion_comments")
        .select("id, suggestion_id")
        .eq("id", parent_id)
        .eq("suggestion_id", suggestionId)
        .maybeSingle();

      if (parentError) {
        console.error("Parent comment check error:", parentError);
        return NextResponse.json({ error: "부모 댓글 확인 중 오류가 발생했습니다." }, { status: 500 });
      }

      if (!parentComment) {
        return NextResponse.json({ error: "존재하지 않는 댓글에 답글을 달 수 없습니다." }, { status: 400 });
      }
    }

    // 1) 댓글 생성
    const { data, error } = await supabase
      .from("suggestion_comments")
      .insert({
        suggestion_id: suggestionId,
        user_id,
        content,
        parent_id,
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user_id,
        users:users (
          id,
          name,
          picture
        )
      `)
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2) 댓글 카운트 증가
    const { error: rpcErr } = await supabase.rpc("inc_suggestion_comment_count", { sid: suggestionId });
    if (rpcErr) {
      console.error("Comment count increment error:", rpcErr);
      // 카운트 증가 실패해도 댓글 생성은 성공으로 처리
    }

    // 3) 캐시 무효화 - 댓글 개수 즉시 반영
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath(`/board/${suggestionId}`);
      revalidatePath('/board');
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }

    const newComment = transformComment(data, suggestionId);

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("Comments POST error:", error?.message ?? error);
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
    
    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");
    
    if (!commentId) {
      return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
    }

    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const content = body?.content;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // 1) 권한 확인 (본인 댓글인지)
    const { data: existing, error: checkErr } = await supabase
      .from("suggestion_comments")
      .select("id, user_id")
      .eq("id", Number(commentId))
      .eq("suggestion_id", suggestionId)
      .maybeSingle();

    if (checkErr) {
      console.error("Supabase query error:", checkErr);
      return NextResponse.json({ error: checkErr.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (existing.user_id !== user_id) {
      return NextResponse.json({ error: "본인의 댓글만 수정할 수 있습니다." }, { status: 403 });
    }

    // 2) 댓글 수정
    const { data, error } = await supabase
      .from("suggestion_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(commentId))
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user_id,
        users:users (
          id,
          name,
          picture
        )
      `)
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updatedComment = transformComment(data, suggestionId);

    return NextResponse.json(updatedComment);
  } catch (error: any) {
    console.error("Comments PUT error:", error?.message ?? error);
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
    
    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");
    
    if (!commentId) {
      return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
    }

    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // 1) 권한 확인 (본인 댓글인지)
    const { data: existing, error: checkErr } = await supabase
      .from("suggestion_comments")
      .select("id, user_id")
      .eq("id", Number(commentId))
      .eq("suggestion_id", suggestionId)
      .maybeSingle();

    if (checkErr) {
      console.error("Supabase query error:", checkErr);
      return NextResponse.json({ error: checkErr.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (existing.user_id !== user_id) {
      return NextResponse.json({ error: "본인의 댓글만 삭제할 수 있습니다." }, { status: 403 });
    }

    // 2) 댓글 삭제
    const { error } = await supabase
      .from("suggestion_comments")
      .delete()
      .eq("id", Number(commentId));

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3) 댓글 카운트 감소
    const { error: rpcErr } = await supabase.rpc("dec_suggestion_comment_count", { sid: suggestionId });
    if (rpcErr) {
      console.error("Comment count decrement error:", rpcErr);
      // 카운트 감소 실패해도 댓글 삭제는 성공으로 처리
    }

    // 4) 캐시 무효화 - 댓글 개수 즉시 반영
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath(`/board/${suggestionId}`);
      revalidatePath('/board');
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }

    return NextResponse.json({ message: "댓글이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Comments DELETE error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
