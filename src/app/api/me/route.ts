import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request) {
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

    // users 테이블에서 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, picture, role, created_at")
      .eq("email", user.email)
      .maybeSingle();

    if (userError) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { success: false, message: userError.message, data: null },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, message: "사용자 정보를 찾을 수 없습니다", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "사용자 정보 조회 성공",
        data: userData,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/me error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const { name, picture } = body;

    // 업데이트할 필드만 포함
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (picture !== undefined) updates.picture = picture;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "수정할 정보가 없습니다", data: null },
        { status: 400 }
      );
    }

    // users 테이블 업데이트
    const { data: userData, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("email", user.email)
      .select("id, email, name, picture, role, created_at")
      .single();

    if (updateError) {
      console.error("User update error:", updateError);
      return NextResponse.json(
        { success: false, message: updateError.message, data: null },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "프로필이 수정되었습니다",
        data: userData,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH /api/me error:", err?.message ?? err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}

