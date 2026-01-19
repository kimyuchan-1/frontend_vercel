import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();

    // Supabase Auth 로그아웃
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signOut error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // 홈으로 리다이렉트
    const url = new URL("/", req.url);
    return NextResponse.redirect(url, { status: 303 });
  } catch (err: any) {
    console.error("SignOut error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
