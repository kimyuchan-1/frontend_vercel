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

    // 1) 좋아요 존재 여부 확인
    const { data: existingLike, error: checkError } = await supabase
      .from("suggestion_likes")
      .select("id")
      .eq("suggestion_id", suggestionId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (checkError) {
      console.error("Like check error:", checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let liked: boolean;

    if (existingLike) {
      // 2a) 좋아요 취소 (삭제)
      const { error: deleteError } = await supabase
        .from("suggestion_likes")
        .delete()
        .eq("suggestion_id", suggestionId)
        .eq("user_id", user_id);

      if (deleteError) {
        console.error("Like delete error:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      liked = false;
    } else {
      // 2b) 좋아요 추가 (삽입)
      const { error: insertError } = await supabase
        .from("suggestion_likes")
        .insert({
          suggestion_id: suggestionId,
          user_id: user_id,
        });

      if (insertError) {
        console.error("Like insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      liked = true;
    }

    // 3) 좋아요 개수 조회
    const { count, error: countError } = await supabase
      .from("suggestion_likes")
      .select("*", { count: 'exact', head: true })
      .eq("suggestion_id", suggestionId);

    if (countError) {
      console.error("Like count error:", countError);
    }

    const likeCount = count || 0;

    // 4) suggestions 테이블의 like_count 업데이트
    const { error: updateError } = await supabase
      .from("suggestions")
      .update({ like_count: likeCount })
      .eq("id", suggestionId);

    if (updateError) {
      console.error("Like count update error:", updateError);
    }

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
