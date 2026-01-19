import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";

function intParam(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(req: Request) {
  try {
    // 인증된 사용자 ID 가져오기
    const user_id = await getCurrentUserId();
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다", data: null },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const page = intParam(url.searchParams.get("page"), 1);
    const pageSize = intParam(url.searchParams.get("pageSize"), 10);
    const status = url.searchParams.get("status") ?? "ALL";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = await getSupabaseServerClient();

    // 내 글 조회
    let q = supabase
      .from("suggestions")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status !== "ALL") {
      q = q.eq("status", status);
    }

    const { data, count, error } = await q;
    
    if (error) {
      console.error("My suggestions query error:", error);
      return NextResponse.json(
        { success: false, message: "DB error", data: { detail: error.message } },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations (camelCase)
    const items = (data ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      suggestionType: item.suggestion_type,
      createdAt: item.created_at,
      likeCount: item.like_count ?? 0,
      viewCount: item.view_count ?? 0,
    }));

    return NextResponse.json({
      items,
      page,
      pageSize,
      total: count ?? 0,
    });
  } catch (err: any) {
    console.error("My suggestions error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
