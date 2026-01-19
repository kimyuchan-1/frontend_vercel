import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
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

    const supabase = await getSupabaseServerClient();

    // toggle_suggestion_like RPC 호출
    const { data, error } = await supabase
      .rpc("toggle_suggestion_like", {
        sid: suggestionId,
        uid: user_id,
      })
      .single();

    if (error) {
      console.error("Like toggle error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // RPC 함수가 { liked: boolean, new_count: integer } 반환
    const result = data as { liked: boolean; new_count: number } | null;
    const liked = result?.liked ?? false;
    const likeCount = result?.new_count ?? 0;

    return NextResponse.json({
      liked,
      like_count: likeCount,
      message: liked ? "좋아요를 추가했습니다." : "좋아요를 취소했습니다.",
    });
  } catch (error: any) {
    console.error("Like POST error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
