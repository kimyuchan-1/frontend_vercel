import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();

    // Supabase는 자동으로 refresh token을 관리하므로
    // 현재 세션을 확인하고 필요시 자동 갱신
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return NextResponse.json(
        { success: false, message: "세션이 만료되었습니다", data: null },
        { status: 401 }
      );
    }

    // 세션이 유효하면 새로운 토큰 정보 반환
    return NextResponse.json(
      {
        success: true,
        message: "토큰이 갱신되었습니다",
        data: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Token refresh error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
