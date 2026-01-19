import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

type Bounds = { south: number; west: number; north: number; east: number };

function parseBounds(str: string | null): Bounds | null {
  if (!str) return null;
  const [south, west, north, east] = str.split(",").map(Number);
  if ([south, west, north, east].some(Number.isNaN)) return null;
  if (south > north || west > east) return null;
  return { south, west, north, east };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bound = parseBounds(searchParams.get("bounds"));
    const limit = searchParams.get("limit") ?? "5000";

    if (!bound) {
      return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
    }

    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    const { data: crosswalks, error: cwErr } = await supabase
      .from("CW")
      .select(`
        cw_uid,
        crosswalk_lat,
        crosswalk_lon,
        address,
        has_ped_signal,
        is_highland,
        has_ped_button,
        has_ped_sound,
        has_bump,
        has_braille_block,
        has_spotlight,
        CW_SG!left(cw_uid)
      `)
      .gte("crosswalk_lat", bound.south)
      .lte("crosswalk_lat", bound.north)
      .gte("crosswalk_lon", bound.west)
      .lte("crosswalk_lon", bound.east)
      .limit(Number(limit));

    if (cwErr) {
      console.error("Supabase query error:", cwErr);
      return NextResponse.json({ error: cwErr.message }, { status: 500 });
    }

    if (!crosswalks?.length) return NextResponse.json([]);

    const out = crosswalks.map((cw) => {
      // 신호등 유무 판단 로직
      let hasSignal = false;

      // 1. has_ped_signal이 1이면 신호등 있음
      if (cw.has_ped_signal === 1) {
        hasSignal = true;
      }
      // 2. has_ped_signal이 null 또는 0이면 CW_SG 테이블 확인
      else if ((cw.has_ped_signal === null || cw.has_ped_signal === 0) && cw.CW_SG && cw.CW_SG.length > 0) {
        hasSignal = true;
      }

      return {
        cw_uid: cw.cw_uid,
        crosswalk_lat: Number(cw.crosswalk_lat),
        crosswalk_lon: Number(cw.crosswalk_lon),
        address: cw.address,
        hasSignal: hasSignal,
        isHighland: cw.is_highland,
        hasPedButton: cw.has_ped_button,
        hasPedSound: cw.has_ped_sound,
        hasBump: cw.has_bump,
        hasBrailleBlock: cw.has_braille_block,
        hasSpotlight: cw.has_spotlight,
        signalSource: cw.has_ped_signal === 1 ? 'direct' : hasSignal ? 'mapped' : 'none'
      };
    });

    return NextResponse.json(out);
  } catch (e) {
    console.error("API Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
