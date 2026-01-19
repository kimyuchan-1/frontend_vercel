import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function prefixRange(prefix2: string) {
  const p = Number(prefix2);
  const base = p * 100_000_000; // 10^8
  const next = (p + 1) * 100_000_000;
  return { gte: base, lt: next };
}

export async function GET() {
  try {
    // Use service client to bypass RLS
    const supabase = getSupabaseServiceClient();

    // 1) ACC에서 sido_code prefix(2자리) 유니크
    const { data: accRows, error: accErr } = await supabase.from("ACC").select("sido_code");
    
    if (accErr) {
      console.error("[PedAcc Provinces API] Supabase error:", accErr);
      console.error("[PedAcc Provinces API] Error details:", {
        message: accErr.message,
        details: (accErr as any).details,
        hint: (accErr as any).hint,
        code: (accErr as any).code,
      });
      // Return empty array instead of error
      return NextResponse.json([]);
    }

    const prefixes = uniq(
      (accRows ?? [])
        .map((r: any) => String(r.sido_code ?? ""))
        .filter((s) => s.length >= 2)
        .map((s) => s.slice(0, 2))
    ).sort();

    if (prefixes.length === 0) return NextResponse.json([]);

    // 2) 대표 시도 코드(prefix + 00000000)
    const wantSidoIds = prefixes.map((p) => Number(`${p}00000000`));

    const { data: d1, error: d1Err } = await supabase
      .from("District")
      .select("district_id, district_name")
      .in("district_id", wantSidoIds);

    if (d1Err) {
      console.error("[PedAcc Provinces API] District query error:", d1Err);
      // Return empty array instead of error
      return NextResponse.json([]);
    }

    // 3) fallback(세종 등): 숫자 범위로 조회
    const fallbackByPrefix = new Map<string, { name: string }>();

    for (const p of prefixes) {
      const target = Number(`${p}00000000`);
      const already = (d1 ?? []).some((r: any) => Number(r.district_id) === target);
      if (already) continue;

      const { gte, lt } = prefixRange(p);
      const { data: fb, error: fbErr } = await supabase
        .from("District")
        .select("district_id, district_name")
        .gte("district_id", gte)
        .lt("district_id", lt)
        .order("district_id", { ascending: true })
        .limit(50);

      if (fbErr) {
        console.error("[PedAcc Provinces API] Fallback query error:", fbErr);
        // Continue instead of returning error
        continue;
      }

      // "서울특별시 종로구" 같은 공백 포함 말고, "서울특별시"처럼 공백 없는 시도명 우선
      const best = (fb ?? []).find((r: any) => !String(r.district_name ?? "").includes(" "));
      if (best) fallbackByPrefix.set(p, { name: String(best.district_name) });
    }

    // 4) 최종 provinces: { code: "11", name: "서울특별시" }
    const byPrefix = new Map<string, { code: string; name: string }>();

    (d1 ?? []).forEach((r: any) => {
      const idStr = String(r.district_id ?? "");
      const name = String(r.district_name ?? "");
      if (idStr.length < 2) return;
      const p = idStr.slice(0, 2);
      if (!byPrefix.has(p)) byPrefix.set(p, { code: p, name });
    });

    for (const p of prefixes) {
      if (byPrefix.has(p)) continue;
      const fb = fallbackByPrefix.get(p);
      if (fb) byPrefix.set(p, { code: p, name: fb.name });
      else byPrefix.set(p, { code: p, name: p }); // 최후 fallback
    }

    const result = Array.from(byPrefix.values()).sort((a, b) => a.name.localeCompare(b.name, "ko"));
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[PedAcc Provinces API] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}