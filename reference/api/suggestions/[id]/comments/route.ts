import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

type DbCommentRow = {
  id: number;
  content: string | null;
  user_id: number | null;
  suggestion_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  parent_id: number | null;
  user: { id: number; name: string | null; picture?: string | null } | null;
};

type ApiComment = {
  id: number;
  suggestion_id: number;
  content: string;
  created_at: string;
  user: { id: number; name: string | null; picture?: string | null } | null;
  parent_id: number | null;
  replies: ApiComment[];
};

function buildCommentTree(rows: DbCommentRow[], suggestionId: number): ApiComment[] {
  const byId = new Map<number, ApiComment>();
  const roots: ApiComment[] = [];

  // 1) 노드 만들기
  for (const r of rows) {
    const node: ApiComment = {
      id: r.id,
      suggestion_id: suggestionId,
      content: (r.content ?? "").toString(),
      created_at: r.created_at ?? new Date().toISOString(),
      user: r.user ? { id: r.user.id, name: r.user.name, picture: (r.user as any).picture ?? null } : null,
      parent_id: r.parent_id ?? null,
      replies: [],
    };
    byId.set(node.id, node);
  }

  // 2) parent_id로 트리 구성
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  // 3) 정렬(작성시간 오름차순: 오래된 댓글이 위)
  const sortByCreatedAt = (a: ApiComment, b: ApiComment) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

  const sortRecursive = (list: ApiComment[]) => {
    list.sort(sortByCreatedAt);
    for (const item of list) sortRecursive(item.replies);
  };
  sortRecursive(roots);

  return roots;
}

/**
 * 댓글 목록 조회 (GET)
 * - DB: suggestion_comments
 * - user join: users
 * - 반환: dummy 구조(roots + replies)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const supabase = getSupabaseServerClient();

    // ✅ user embed: FK 중복 해결했다고 했으니 그냥 users(...) 가능
    const { data, error } = await supabase
      .from("suggestion_comments")
      .select(
        `
        id,
        content,
        user_id,
        suggestion_id,
        created_at,
        updated_at,
        parent_id,
        user:users (
          id,
          name,
          picture
        )
      `
      )
      .eq("suggestion_id", suggestionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as DbCommentRow[];
    const tree = buildCommentTree(rows, suggestionId);

    return NextResponse.json(tree);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

/**
 * 댓글 작성 (POST)
 * - parent_id 있으면 대댓글
 * - user_id는 임시로 1 고정(로그인 붙이면 세션에서 가져오기)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const body = await request.json();
    const contentRaw = body?.content;
    const parent_id = body?.parent_id ?? null;

    const content = typeof contentRaw === "string" ? contentRaw.trim() : "";
    if (!content) return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    if (content.length > 1000) return NextResponse.json({ error: "댓글은 1000자 이내로 작성해주세요." }, { status: 400 });

    const supabase = getSupabaseServerClient();

    // TODO: 나중에 auth 붙이면 여기서 user_id를 세션/토큰에서 꺼내기
    const user_id = 1;

    // parent_id가 있으면 같은 suggestion인지 검증(안 하면 다른 글에 달리는 이상한 대댓글 가능)
    if (parent_id !== null) {
      const { data: parentRow, error: parentErr } = await supabase
        .from("suggestion_comments")
        .select("id, suggestion_id")
        .eq("id", parent_id)
        .maybeSingle();

      if (parentErr) {
        console.error("Supabase parent check error:", parentErr);
        return NextResponse.json({ error: parentErr.message }, { status: 500 });
      }
      if (!parentRow) return NextResponse.json({ error: "원댓글을 찾을 수 없습니다." }, { status: 400 });
      if (Number(parentRow.suggestion_id) !== suggestionId) {
        return NextResponse.json({ error: "다른 게시글의 댓글에는 답글을 달 수 없습니다." }, { status: 400 });
      }
    }

    // insert
    const { data, error } = await supabase
      .from("suggestion_comments")
      .insert({
        suggestion_id: suggestionId,
        user_id,
        content,
        parent_id,
      })
      .select(
        `
        id,
        content,
        user_id,
        suggestion_id,
        created_at,
        updated_at,
        parent_id,
        user:users (
          id,
          name,
          picture
        )
      `
      )
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = data as unknown as DbCommentRow;

    // 더미와 동일한 단일 댓글 응답 형태
    const newComment: ApiComment = {
      id: row.id,
      suggestion_id: suggestionId,
      content: (row.content ?? "").toString(),
      created_at: row.created_at ?? new Date().toISOString(),
      user: row.user ? { id: row.user.id, name: row.user.name, picture: (row.user as any).picture ?? null } : null,
      parent_id: row.parent_id ?? null,
      replies: [],
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
