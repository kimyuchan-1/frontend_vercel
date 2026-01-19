import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const supabase = getSupabaseServerClient();

    const { error: rpcErr } = await supabase.rpc("inc_suggestion_view_count", { sid: suggestionId });
    if (rpcErr) {
      console.error("Supabase rpc error:", rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    // 2) 상세 조회 + user 조인
    const { data, error } = await supabase
      .from("suggestions")
      .select(`
    id, title, content, location_lat, location_lon, address,
    sido_code, sigungu_code, suggestion_type, status,
    like_count, view_count, comment_count, created_at, updated_at, user_id,
    user:users ( id, name, picture )
  `)
      .eq("id", suggestionId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }

    // 4) 좋아요 여부 (좋아요 테이블 붙이기 전까지는 false)
    const is_liked = false;

    const comment_count_num = data.comment_count != null ? Number(data.comment_count) : 0;

    return NextResponse.json({
      ...data,
      comment_count_num,
      is_liked,
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const body = await request.json();
    const { title, content, suggestion_type } = body ?? {};

    if (!title || !content || !suggestion_type) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 1) 상태 확인 (PENDING만 수정 가능)
    const { data: cur, error: curErr } = await supabase
      .from("suggestions")
      .select("id, status")
      .eq("id", suggestionId)
      .maybeSingle();

    if (curErr) {
      console.error("Supabase error:", curErr);
      return NextResponse.json({ error: curErr.message }, { status: 500 });
    }
    if (!cur) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }
    if (cur.status !== "PENDING") {
      return NextResponse.json({ error: "접수 상태의 건의사항만 수정할 수 있습니다." }, { status: 400 });
    }

    // 2) 업데이트 + 반환(유저 조인 포함)
    const { data, error } = await supabase
      .from("suggestions")
      .update({
        title,
        content,
        suggestion_type,
        updated_at: new Date().toISOString(), // 컬럼이 timestamp면 서버에서 문자열 넣어도 캐스팅됨
      })
      .eq("id", suggestionId)
      .select(
        `
        id,
        title,
        content,
        location_lat,
        location_lon,
        address,
        sido_code,
        sigungu_code,
        suggestion_type,
        status,
        like_count,
        view_count,
        comment_count,
        created_at,
        updated_at,
        user_id,
        user:users (
          id,
          name,
          picture
        )
      `
      )
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const supabase = getSupabaseServerClient();

    // 1) 상태 확인 (PENDING만 삭제 가능)
    const { data: cur, error: curErr } = await supabase
      .from("suggestions")
      .select("id, status")
      .eq("id", suggestionId)
      .maybeSingle();

    if (curErr) {
      console.error("Supabase error:", curErr);
      return NextResponse.json({ error: curErr.message }, { status: 500 });
    }
    if (!cur) {
      return NextResponse.json({ error: "건의사항을 찾을 수 없습니다." }, { status: 404 });
    }
    if (cur.status !== "PENDING") {
      return NextResponse.json({ error: "접수 상태의 건의사항만 삭제할 수 있습니다." }, { status: 400 });
    }

    // 2) 삭제 (댓글은 FK on delete cascade면 같이 삭제됨)
    const { error } = await supabase.from("suggestions").delete().eq("id", suggestionId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "건의사항이 삭제되었습니다." });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
