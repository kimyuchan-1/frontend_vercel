import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

type Row = {
  bjd_nm: string;
  center_lati: number;
  center_long: number;
};

function tokens2(name: string) {
  const t = String(name ?? "").trim().split(/\s+/);
  return { province: t[0] ?? "", city: t[1] ?? "" };
}

export async function GET() {
  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // 필요한 컬럼만 가져오기
    const { data, error } = await supabase
      .from("District_with_lat_lon")
      .select("bjd_nm, center_lati, center_long")
      .limit(100000);

    if (error) {
      console.error("[Dashboard Provinces API] Supabase error:", error);
      console.error("[Dashboard Provinces API] Error details:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }

    const rows = (data ?? []) as Row[];

    // province -> {sumLat,sumLon,n}
    const acc = new Map<string, { sumLat: number; sumLon: number; n: number }>();

    for (const r of rows) {
      const { province } = tokens2(r.bjd_nm);
      const lat = Number(r.center_lati);
      const lon = Number(r.center_long);
      if (!province) continue;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      if (!acc.has(province)) acc.set(province, { sumLat: 0, sumLon: 0, n: 0 });
      const a = acc.get(province)!;
      a.sumLat += lat;
      a.sumLon += lon;
      a.n += 1;
    }

    const out = Array.from(acc.entries())
      .map(([province, a]) => ({
        province,
        lat: a.sumLat / a.n,
        lon: a.sumLon / a.n,
      }))
      .sort((x, y) => x.province.localeCompare(y.province, "ko"));

    return NextResponse.json(out, { status: 200 });
  } catch (error: any) {
    console.error("[Dashboard Provinces API] Error:", error.message);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
