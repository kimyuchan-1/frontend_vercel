import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

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
  user: { id: number; name: string | null; picture?: string | null } | null;
  parent_id: number | null;
  replies: ApiComment[];
};

function transformComment(item: any, suggestionId: number): ApiComment {
  return {
    id: item.id,
    suggestion_id: suggestionId,
    content: item.content ?? "",
    created_at: item.createdAt ?? new Date().toISOString(),
    user: item.user ? { id: item.user.id, name: item.user.name, picture: item.user.picture ?? null } : null,
    parent_id: item.parentId ?? null,
    replies: (item.replies ?? []).map((r: any) => transformComment(r, suggestionId)),
  };
}

function buildCommentTree(items: any[], suggestionId: number): ApiComment[] {
  const byId = new Map<number, ApiComment>();
  const roots: ApiComment[] = [];

  // 1) 노드 만들기
  for (const item of items) {
    const node = transformComment(item, suggestionId);
    node.replies = []; // 트리 구성 시 다시 채움
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

  // 3) 정렬(작성시간 오름차순)
  const sortByCreatedAt = (a: ApiComment, b: ApiComment) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

  const sortRecursive = (list: ApiComment[]) => {
    list.sort(sortByCreatedAt);
    for (const item of list) sortRecursive(item.replies);
  };
  sortRecursive(roots);

  return roots;
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

    const response = await backendClient.get(`/api/suggestions/${suggestionId}/comments`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    const items = response.data ?? [];

    // 백엔드가 이미 트리 구조로 반환하면 그대로 변환, 아니면 트리 구성
    const isAlreadyTree = items.length > 0 && Array.isArray(items[0]?.replies);
    
    if (isAlreadyTree) {
      const tree = items.map((item: any) => transformComment(item, suggestionId));
      return NextResponse.json(tree);
    } else {
      const tree = buildCommentTree(items, suggestionId);
      return NextResponse.json(tree);
    }
  } catch (error: any) {
    console.error("Comments GET error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
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
    const contentRaw = body?.content;
    const parent_id = body?.parent_id ?? null;

    const content = typeof contentRaw === "string" ? contentRaw.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: "댓글은 1000자 이내로 작성해주세요." }, { status: 400 });
    }

    const payload = {
      content,
      parentId: parent_id,
    };

    const response = await backendClient.post(`/api/suggestions/${suggestionId}/comments`, payload, {
      headers: { Cookie: cookieHeader },
    });

    const item = response.data;

    const newComment: ApiComment = {
      id: item.id,
      suggestion_id: suggestionId,
      content: item.content ?? "",
      created_at: item.createdAt ?? new Date().toISOString(),
      user: item.user ? { id: item.user.id, name: item.user.name, picture: item.user.picture ?? null } : null,
      parent_id: item.parentId ?? null,
      replies: [],
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("Comments POST error:", error?.response?.data ?? error.message);
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
    
    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");
    
    if (!commentId) {
      return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
    }

    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const content = body?.content;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    const response = await backendClient.put(
      `/api/suggestions/${suggestionId}/comments/${commentId}`,
      { content },
      { headers: { Cookie: cookieHeader } }
    );

    const item = response.data;

    const updatedComment: ApiComment = {
      id: item.id,
      suggestion_id: suggestionId,
      content: item.content ?? "",
      created_at: item.createdAt ?? new Date().toISOString(),
      user: item.user ? { id: item.user.id, name: item.user.name, picture: item.user.picture ?? null } : null,
      parent_id: item.parentId ?? null,
      replies: [],
    };

    return NextResponse.json(updatedComment);
  } catch (error: any) {
    console.error("Comments PUT error:", error?.response?.data ?? error.message);
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
    
    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");
    
    if (!commentId) {
      return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
    }

    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    await backendClient.delete(
      `/api/suggestions/${suggestionId}/comments/${commentId}`,
      { headers: { Cookie: cookieHeader } }
    );

    return NextResponse.json({ message: "댓글이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Comments DELETE error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
