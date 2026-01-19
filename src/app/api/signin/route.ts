import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SignInBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as SignInBody | null;

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { success: false, message: "이메일과 비밀번호가 필요합니다.", data: null },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Supabase Auth로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      console.error("Supabase signIn error:", error);
      return NextResponse.json(
        { success: false, message: error.message, data: null },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "로그인에 실패했습니다.", data: null },
        { status: 401 }
      );
    }

    // users 테이블에서 추가 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, picture, role, created_at")
      .eq("email", data.user.email)
      .maybeSingle();

    if (userError) {
      console.error("User lookup error:", userError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "로그인에 성공했습니다.",
        data: {
          user: userData || {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || null,
            picture: data.user.user_metadata?.picture || null,
            role: "user",
            created_at: data.user.created_at,
          },
          session: {
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            expires_at: data.session?.expires_at,
          },
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("SignIn error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
