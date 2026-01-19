import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function prefixRange(prefix2: string) {
  const p = Number(prefix2);
  const base = p * 100_000_000;
  const next = (p + 1) * 100_000_000;
  return { gte: base, lt: next };
}

function rangeFromDistrict5(d5: number) {
  const from = d5 * 100_000;        // d5 × 10^5
  const toExcl = (d5 + 1) * 100_000;
  return { from, toExcl };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") ?? "").trim(); // "" | "11" | "1111000000" | "11110"

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // ✅ 여기서는 원본 row를 다 끌고와서 JS 합산할 수도 있고,
  // 이전에 만든 RPC 방식으로 바꿔도 됨. 일단 "정책 분기"만 정확히.
  let q = supabase
    .from("ACC")
    .select(
      "year, month, accident_count, casualty_count, fatality_count, serious_injury_count, minor_injury_count, reported_injury_count, sigungu_code"
    );

  if (region) {
    if (/^\d{2}$/.test(region)) {
      const { gte, lt } = prefixRange(region);
      q = q.gte("sigungu_code", gte).lt("sigungu_code", lt);

    } else if (/^\d{10}$/.test(region)) {
      q = q.eq("sigungu_code", Number(region));

    } else if (/^\d{5}$/.test(region)) {
      const { from, toExcl } = rangeFromDistrict5(Number(region));
      q = q.gte("sigungu_code", from).lt("sigungu_code", toExcl);

    } else {
      return NextResponse.json({ error: "Invalid region" }, { status: 400 });
    }
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // yearly/monthly 합산(기존 로직 그대로 두면 됨)
  const byYear = new Map<number, any>();
  for (const r of rows) {
    const y = Number(r.year);
    const cur =
      byYear.get(y) ?? {
        year: y,
        accident_count: 0,
        casualty_count: 0,
        fatality_count: 0,
        serious_injury_count: 0,
        minor_injury_count: 0,
        reported_injury_count: 0,
      };

    cur.accident_count += Number(r.accident_count ?? 0);
    cur.casualty_count += Number(r.casualty_count ?? 0);
    cur.fatality_count += Number(r.fatality_count ?? 0);
    cur.serious_injury_count += Number(r.serious_injury_count ?? 0);
    cur.minor_injury_count += Number(r.minor_injury_count ?? 0);
    cur.reported_injury_count += Number(r.reported_injury_count ?? 0);
    byYear.set(y, cur);
  }

  const yearly = Array.from(byYear.values()).sort((a, b) => a.year - b.year);

  const byMonth = new Map<number, any>();
  for (const r of rows) {
    const y = Number(r.year);
    const m = Number(r.month);
    const key = y * 100 + m;

    const cur =
      byMonth.get(key) ?? {
        year: y,
        month: m,
        accident_count: 0,
        casualty_count: 0,
        fatality_count: 0,
        serious_injury_count: 0,
        minor_injury_count: 0,
        reported_injury_count: 0,
      };

    cur.accident_count += Number(r.accident_count ?? 0);
    cur.casualty_count += Number(r.casualty_count ?? 0);
    cur.fatality_count += Number(r.fatality_count ?? 0);
    cur.serious_injury_count += Number(r.serious_injury_count ?? 0);
    cur.minor_injury_count += Number(r.minor_injury_count ?? 0);
    cur.reported_injury_count += Number(r.reported_injury_count ?? 0);
    byMonth.set(key, cur);
  }

  const monthly = Array.from(byMonth.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month
  );

  return NextResponse.json(
  {
    region: region || null,
    regionType: !region
      ? "NATION"
      : /^\d{2}$/.test(region)
      ? "SIDO_PREFIX2"
      : /^\d{5}$/.test(region)
      ? "DISTRICT5"
      : "SIGUNGU10",
    yearly,
    monthly,
  },
  { headers: { "Cache-Control": "no-store" } }
);
}
