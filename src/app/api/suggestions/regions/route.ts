import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // District 테이블에서 available = 1인 지역 목록 조회
    const { data, error } = await supabase
      .from("District")
      .select("district_name")
      .eq("available", 1)
      .order("district_name", { ascending: true });

    if (error) {
      console.error("Regions query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // district_name만 추출하여 배열로 반환
    const regions = (data ?? []).map((row: any) => row.district_name);

    // 중복 제거
    const uniqueRegions = Array.from(new Set(regions));

    return NextResponse.json(uniqueRegions);
  } catch (error: any) {
    console.error("Regions API error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
