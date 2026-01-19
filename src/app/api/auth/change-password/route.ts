import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();

    // 현재 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다", data: null },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => null)) as ChangePasswordBody | null;

    if (!body?.currentPassword || !body?.newPassword) {
      return NextResponse.json(
        { success: false, message: "현재 비밀번호와 새 비밀번호가 필요합니다", data: null },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "새 비밀번호는 최소 6자 이상이어야 합니다", data: null },
        { status: 400 }
      );
    }

    // 1) 현재 비밀번호 확인 (재인증)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: body.currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, message: "현재 비밀번호가 올바르지 않습니다", data: null },
        { status: 401 }
      );
    }

    // 2) 새 비밀번호로 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: body.newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { success: false, message: updateError.message, data: null },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "비밀번호가 변경되었습니다",
        data: null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Change password error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
