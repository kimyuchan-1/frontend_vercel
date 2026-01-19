import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AccidentData, MapBounds } from "@/features/acc_calculate/types";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);


function parseBounds(str: string | null): MapBounds | null {
    if (!str) return null;
    const [south, west, north, east] = str.split(",").map(Number);
    if ([south, west, north, east].some(Number.isNaN)) return null;
    return { south, west, north, east };
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const bound = parseBounds(searchParams.get("bounds"));

    if (!bound) {
        return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
    }

    try {
        // ACC 테이블에서 사고 데이터 조회
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
            .limit(1000); // 일단 전체 데이터 가져오기 (나중에 최적화)

        if (accErr) {
            console.error("[Accidents API] Supabase error:", accErr);
            return NextResponse.json({ error: accErr.message }, { status: 500 });
        }

        if (!accidents?.length) {
            console.log("[Accidents API] No accidents data found");
            return NextResponse.json([]);
        }

        // 데이터 형식 변환 및 좌표 추정
        const formattedAccidents = accidents
            .map((acc) => {
                const lat = Number(acc.accident_lat);
                const lon = Number(acc.accident_lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                
                return {
                    accident_id: acc.accident_id,
                    district_code: acc.district_code,
                    year: acc.year,
                    accident_count: Number(acc.accident_count) || 0,
                    casualty_count: Number(acc.casualty_count) || 0,
                    fatality_count: Number(acc.fatality_count) || 0,
                    serious_injury_count: Number(acc.serious_injury_count) || 0,
                    minor_injury_count: Number(acc.minor_injury_count) || 0,
                    reported_injury_count: Number(acc.reported_injury_count) || 0,
                    accident_lat: lat,
                    accident_lon: lon
                };
            })
            .filter((acc): acc is NonNullable<typeof acc> => acc !== null)
            .filter(acc => {
                // 좌표가 있고 범위 내에 있는 데이터만 필터링
                return acc.accident_lat && acc.accident_lon &&
                    acc.accident_lat >= bound.south &&
                    acc.accident_lat <= bound.north &&
                    acc.accident_lon >= bound.west &&
                    acc.accident_lon <= bound.east;
            });

        return NextResponse.json(formattedAccidents);

    } catch (error) {
        console.error("[Accidents API] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}