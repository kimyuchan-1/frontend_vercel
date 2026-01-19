import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function prefixRange(prefix2: string) {
  const p = Number(prefix2);
  const base = p * 100_000_000; // 11 -> 1100000000
  const next = (p + 1) * 100_000_000;
  return { gte: base, lt: next };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const province = (searchParams.get("province") ?? "").trim(); // "11"

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
  }

  if (!/^\d{2}$/.test(province)) return NextResponse.json([]);

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1) ACC에서 해당 prefix 시도 범위의 sigungu_code만 추출
  const { gte, lt } = prefixRange(province);

  const { data: accRows, error: accErr } = await supabase
    .from("ACC")
    .select("sigungu_code, sido_code")
    .gte("sido_code", gte)
    .lt("sido_code", lt);

  if (accErr) return NextResponse.json({ error: accErr.message }, { status: 500 });

  const sigungu10 = uniq(
    (accRows ?? [])
      .map((r: any) => String(r.sigungu_code ?? "").trim())
      .filter((s) => /^\d{10}$/.test(s))
  );

  const district5 = uniq(sigungu10.map((s) => s.slice(0, 5))); // ✅ 5자리 문자열

  const { data: dRows } = await supabase
    .from("District")
    .select("district_code, district_short_name, district_name")
    .in("district_code", district5.map(Number));

  const nameBy5 = new Map<string, string>();
  (dRows ?? []).forEach((r: any) => {
    const code5 = String(r.district_code);
    const shortName = String(r.district_short_name ?? "").trim();
    const fullName = String(r.district_name ?? "").trim();
    nameBy5.set(code5, shortName || fullName || code5);
  });

  return NextResponse.json(
    district5.map((code5) => ({ code: code5, name: nameBy5.get(code5) ?? code5 }))
  );
}
