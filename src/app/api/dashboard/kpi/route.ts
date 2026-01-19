import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // Try to get data from view first
    const { data: viewData, error: viewError } = await supabase
      .from("v_kpi_summary_json")
      .select("data")
      .single();

    // If view exists and has data, return it
    if (!viewError && viewData?.data) {
      return NextResponse.json(viewData.data, { status: 200 });
    }

    // If view doesn't exist, calculate KPI data manually
    console.warn("[Dashboard KPI API] View not found, calculating manually");

    // Get crosswalk count
    const { count: crosswalkCount, error: crosswalkError } = await supabase
      .from("crosswalks")
      .select("*", { count: 'exact', head: true });

    if (crosswalkError) {
      console.error("Crosswalk count error:", crosswalkError);
    }

    // Get accident data for risk calculation
    const { data: accidents, error: accError } = await supabase
      .from("ACC")
      .select("deaths, serious_injuries, minor_injuries, reported_injuries")
      .limit(1000);

    if (accError) {
      console.error("Accident data error:", accError);
    }

    // Calculate risk index from accident data
    let riskIndex = 0;
    if (accidents && accidents.length > 0) {
      const totalDeaths = accidents.reduce((sum, acc) => sum + (Number(acc.deaths) || 0), 0);
      const totalSerious = accidents.reduce((sum, acc) => sum + (Number(acc.serious_injuries) || 0), 0);
      const totalMinor = accidents.reduce((sum, acc) => sum + (Number(acc.minor_injuries) || 0), 0);
      
      const weightedScore = totalDeaths * 10 + totalSerious * 5 + totalMinor * 2;
      riskIndex = Math.min(10, Math.log10(weightedScore + 1) * 2);
    }

    // Calculate safety index (inverse of risk)
    const safetyIndex = Math.max(0, 10 - riskIndex);

    // Return calculated KPI data
    const kpiData = {
      totalCrosswalks: crosswalkCount || 0,
      signalInstallationRate: 0.75, // Default value, can be calculated if needed
      riskIndex: Math.round(riskIndex * 100) / 100,
      safetyIndex: Math.round(safetyIndex * 100) / 100,
      _calculated: true // Flag to indicate this was calculated, not from view
    };

    return NextResponse.json(kpiData, { status: 200 });

  } catch (error: any) {
    console.error("[Dashboard KPI API] Error:", error.message);
    console.error("[Dashboard KPI API] Stack:", error.stack);
    
    // Return fallback data
    return NextResponse.json({
      totalCrosswalks: 0,
      signalInstallationRate: 0,
      riskIndex: 0,
      safetyIndex: 0,
      _fallback: true,
      _error: error.message
    }, { status: 200 });
  }
}
