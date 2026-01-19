/**
 * Utility functions for KPI data fetching and validation
 * Extracted for testability
 */

export interface KPIData {
  totalCrosswalks: number;
  signalInstallationRate: number;
  riskIndex: number;
  safetyIndex: number;
}

export function coerceNumber(v: unknown, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeKpiPayload(payload: any): KPIData {
  const timestamp = new Date().toISOString();
  const src = payload || {};
  
  // Required fields for KPI data
  const requiredFields = [
    'totalCrosswalks',
    'signalInstallationRate',
    'riskIndex',
    'safetyIndex'
  ] as const;

  // Validate and normalize each field
  const normalizedData: KPIData = {
    totalCrosswalks: 0,
    signalInstallationRate: 0,
    riskIndex: 0,
    safetyIndex: 0,
  };

  for (const field of requiredFields) {
    const originalValue = src[field];
    const normalizedValue = coerceNumber(originalValue, 0);
    normalizedData[field] = normalizedValue;

    // Log when field is missing
    if (originalValue === undefined || originalValue === null) {
      console.warn(
        `[${timestamp}] [Dashboard KPI] Field normalization: "${field}" is missing, using fallback value 0`
      );
    }
    // Log when field is invalid (NaN, Infinity, or wrong type)
    else if (normalizedValue !== originalValue) {
      const reason = 
        typeof originalValue !== 'number' ? 'wrong type' :
        Number.isNaN(originalValue) ? 'NaN' :
        !Number.isFinite(originalValue) ? 'Infinity' :
        'invalid';
      
      console.warn(
        `[${timestamp}] [Dashboard KPI] Field normalization: "${field}" has invalid value (${reason}: ${originalValue}), replaced with fallback value ${normalizedValue}`
      );
    }
  }

  return normalizedData;
}

export function getFallbackKPIData(): KPIData {
  return {
    totalCrosswalks: 0,
    signalInstallationRate: 0,
    riskIndex: 0,
    safetyIndex: 0,
  };
}

export async function getKPIData(): Promise<KPIData> {
  const timestamp = new Date().toISOString();
  
  try {
    // Import Supabase service client
    const { getSupabaseServiceClient } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServiceClient();

    // Try to get data from view first
    const { data: viewData, error: viewError } = await supabase
      .from("v_kpi_summary_json")
      .select("data")
      .single();

    // If view exists and has data, return it
    if (!viewError && viewData?.data) {
      return normalizeKpiPayload(viewData.data);
    }

    // If view doesn't exist, calculate KPI data manually
    console.warn(`[${timestamp}] [Dashboard KPI] View not found, calculating manually`);

    // Get crosswalk count
    const { count: crosswalkCount } = await supabase
      .from("crosswalks")
      .select("*", { count: 'exact', head: true });

    // Get accident data for risk calculation
    const { data: accidents } = await supabase
      .from("ACC")
      .select("deaths, serious_injuries, minor_injuries, reported_injuries")
      .limit(1000);

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
      signalInstallationRate: 0.75,
      riskIndex: Math.round(riskIndex * 100) / 100,
      safetyIndex: Math.round(safetyIndex * 100) / 100,
    };

    return normalizeKpiPayload(kpiData);

  } catch (error: any) {
    console.error(`[${timestamp}] [Dashboard KPI] Error fetching KPI data`);
    console.error(`  Details: ${error?.message || String(error)}`);

    // Always return fallback data on error
    return getFallbackKPIData();
  }
}
