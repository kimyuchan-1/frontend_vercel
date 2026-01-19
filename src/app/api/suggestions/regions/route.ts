import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // suggestions 테이블에서 모든 address 조회
    const { data, error } = await supabase
      .from("suggestions")
      .select("address");

    if (error) {
      console.error("Regions query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // address를 공백으로 split하여 첫 번째 단어(시도)만 추출
    const regions = (data ?? [])
      .map((row: any) => {
        const address = row.address || "";
        const parts = address.split(" ");
        return parts[0] || ""; // 첫 번째 단어 (예: "서울특별시", "경기도" 등)
      })
      .filter((region: string) => region.length > 0); // 빈 문자열 제거

    // Set을 사용하여 중복 제거 후 정렬
    const uniqueRegions = Array.from(new Set(regions)).sort((a, b) => 
      a.localeCompare(b, "ko")
    );

    return NextResponse.json(uniqueRegions);
  } catch (error: any) {
    console.error("Regions API error:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
