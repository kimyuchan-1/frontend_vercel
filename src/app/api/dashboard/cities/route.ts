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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");

  if (!province || !province.trim()) {
    return NextResponse.json({ error: "province is required" }, { status: 400 });
  }

  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // province로 시작하는 bjd_nm만 가져오면 데이터가 훨씬 줄어듦
    const { data, error } = await supabase
      .from("District_with_lat_lon")
      .select("bjd_nm, center_lati, center_long")
      .like("bjd_nm", `${province.trim()} %`)
      .limit(100000);

    if (error) {
      console.error("[Dashboard Cities API] Supabase error:", error);
      console.error("[Dashboard Cities API] Error details:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }

    const rows = (data ?? []) as Row[];

    // city(시군구) 단위로 centroid
    const acc = new Map<string, { sumLat: number; sumLon: number; n: number }>();

    for (const r of rows) {
      const { province: prov, city } = tokens2(r.bjd_nm);
      if (prov !== province.trim()) continue;
      if (!city) continue;

      const lat = Number(r.center_lati);
      const lon = Number(r.center_long);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      if (!acc.has(city)) acc.set(city, { sumLat: 0, sumLon: 0, n: 0 });
      const a = acc.get(city)!;
      a.sumLat += lat;
      a.sumLon += lon;
      a.n += 1;
    }

    const out = Array.from(acc.entries())
      .map(([city, a]) => ({
        city,
        lat: a.sumLat / a.n,
        lon: a.sumLon / a.n,
        // 드롭다운 key로 쓰기 좋게 province+city를 결합
        key: `${province.trim()}|${city}`,
      }))
      .sort((x, y) => x.city.localeCompare(y.city, "ko"));

    return NextResponse.json(out);

  } catch (error: any) {
    console.error("[Dashboard Cities API] Error:", error.message);
    
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
