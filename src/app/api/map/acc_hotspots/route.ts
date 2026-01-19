import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

type MapBounds = { south: number; west: number; north: number; east: number };

function parseBounds(str: string | null): MapBounds | null {
  if (!str) return null;
  const [south, west, north, east] = str.split(",").map(Number);
  if ([south, west, north, east].some(Number.isNaN)) return null;
  if (south > north || west > east) return null;
  return { south, west, north, east };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boundsStr = searchParams.get("bounds");
  const limit = searchParams.get("limit") ?? "1000";

  const bound = parseBounds(boundsStr);
  if (!bound) {
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  }

  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // ACC_Hotspot 테이블에서 사고 데이터 조회
    const { data: accidents, error: accErr } = await supabase
      .from("ACC_Hotspot")
      .select(`
        accident_id,
        district_code,
        year,
        accident_count,
        casualty_count,
        fatality_count,
        serious_injury_count,
        minor_injury_count,
        reported_injury_count,
        accident_lon,
        accident_lat
      `)
      .gte("accident_lat", bound.south)
      .lte("accident_lat", bound.north)
      .gte("accident_lon", bound.west)
      .lte("accident_lon", bound.east)
      .limit(Number(limit));

    if (accErr) {
      console.error("[Accidents API] Supabase error:", accErr);
      return NextResponse.json({ error: accErr.message }, { status: 500 });
    }

    if (!accidents?.length) {
      return NextResponse.json([]);
    }

    // 데이터 형식 변환 (snake_case -> camelCase)
    const formattedAccidents = accidents
      .map((acc) => {
        const lat = Number(acc.accident_lat);
        const lon = Number(acc.accident_lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return {
          accidentId: acc.accident_id,
          districtCode: acc.district_code,
          year: acc.year,
          accidentCount: Number(acc.accident_count) || 0,
          casualtyCount: Number(acc.casualty_count) || 0,
          fatalityCount: Number(acc.fatality_count) || 0,
          seriousInjuryCount: Number(acc.serious_injury_count) || 0,
          minorInjuryCount: Number(acc.minor_injury_count) || 0,
          reportedInjuryCount: Number(acc.reported_injury_count) || 0,
          accidentLat: lat,
          accidentLon: lon
        };
      })
      .filter((acc): acc is NonNullable<typeof acc> => acc !== null);

    return NextResponse.json(formattedAccidents);

  } catch (error: any) {
    console.error("[Accidents API] Unexpected error:", error);
    const message = error?.message ?? "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
