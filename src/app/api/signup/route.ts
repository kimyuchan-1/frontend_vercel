import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SignUpBody = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as SignUpBody | null;

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { success: false, message: "이메일과 비밀번호가 필요합니다.", data: null },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, message: "비밀번호는 최소 6자 이상이어야 합니다.", data: null },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // 1) Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name || null,
        },
        emailRedirectTo: undefined, // 이메일 확인 리다이렉트 비활성화
      },
    });

    if (authError) {
      console.error("Supabase signUp error:", authError);
      return NextResponse.json(
        { success: false, message: authError.message, data: null },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: "회원가입에 실패했습니다.", data: null },
        { status: 400 }
      );
    }

    // 2) users 테이블에 사용자 정보 저장
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email: body.email,
        name: body.name || null,
        picture: null,
      })
      .select("id, email, name, picture, role, created_at")
      .single();

    if (userError) {
      console.error("User insert error:", userError);
      // Auth는 생성되었지만 users 테이블 삽입 실패
      // 실제 운영에서는 Auth 사용자도 삭제하거나 재시도 로직 필요
      return NextResponse.json(
        { success: false, message: "사용자 정보 저장에 실패했습니다.", data: null },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "회원가입에 성공했습니다.",
        data: {
          user: userData,
          session: {
            access_token: authData.session?.access_token,
            refresh_token: authData.session?.refresh_token,
            expires_at: authData.session?.expires_at,
          },
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("SignUp error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
