import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("v_kpi_summary_json")
      .select("data")
      .single();

    if (error) {
      console.error("Supabase query error:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      
      // Return fallback data instead of error
      return NextResponse.json({
        totalCrosswalks: 0,
        totalAccidents: 0,
        totalCasualties: 0,
        avgSafetyIndex: 0,
        _fallback: true
      }, { status: 200 });
    }

    return NextResponse.json(data?.data ?? {}, { status: 200 });
  } catch (error: any) {
    console.error("[Dashboard KPI API] Error:", error.message);
    
    // Return fallback data instead of error
    return NextResponse.json({
      totalCrosswalks: 0,
      totalAccidents: 0,
      totalCasualties: 0,
      avgSafetyIndex: 0,
      _fallback: true
    }, { status: 200 });
  }
}
