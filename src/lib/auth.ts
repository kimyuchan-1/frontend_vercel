import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 현재 인증된 사용자의 ID를 가져옵니다.
 * @returns 사용자 ID (users 테이블의 id) 또는 null
 */
export async function getCurrentUserId(): Promise<number | null> {
  try {
    const supabase = await getSupabaseServerClient();

    // Supabase Auth에서 현재 사용자 확인
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return null;
    }

    // users 테이블에서 실제 ID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (userError || !userData) {
      return null;
    }

    return userData.id;
  } catch (err) {
    console.error("getCurrentUserId error:", err);
    return null;
  }
}

/**
 * 현재 인증된 사용자 정보를 가져옵니다.
 * @returns 사용자 정보 또는 null
 */
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, picture, role, created_at")
      .eq("email", user.email)
      .maybeSingle();

    if (userError || !userData) {
      return null;
    }

    return userData;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}
