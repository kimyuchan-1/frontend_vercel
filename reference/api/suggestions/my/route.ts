import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function intParam(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = intParam(sp.get("page"), 1);
  const pageSize = intParam(sp.get("pageSize"), 10);
  const status = sp.get("status") ?? "ALL";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseServerClient();

  // 1) 로그인 사용자 확인
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 2) 내 글 조회
  let q = supabase
    .from("suggestions")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "ALL") q = q.eq("status", status);

  const { data, count, error } = await q;
  if (error) {
    return NextResponse.json({ message: "DB error", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}
