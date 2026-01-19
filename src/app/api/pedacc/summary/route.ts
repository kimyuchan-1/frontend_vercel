import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") ?? "").trim();

  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const params: Record<string, string> = {};
    if (region) {
      params.region = region;
    }

    const response = await backendClient.get("/api/pedacc/summary", {
      params,
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    const data = response.data;

    // 백엔드 응답을 프론트엔드 형식으로 변환 (camelCase -> snake_case)
    const yearly = (data.yearly ?? []).map((item: any) => ({
      year: item.year,
      accident_count: item.accidentCount ?? 0,
      casualty_count: item.casualtyCount ?? 0,
      fatality_count: item.fatalityCount ?? 0,
      serious_injury_count: item.seriousInjuryCount ?? 0,
      minor_injury_count: item.minorInjuryCount ?? 0,
      reported_injury_count: item.reportedInjuryCount ?? 0,
    }));

    const monthly = (data.monthly ?? []).map((item: any) => ({
      year: item.year,
      month: item.month,
      accident_count: item.accidentCount ?? 0,
      casualty_count: item.casualtyCount ?? 0,
      fatality_count: item.fatalityCount ?? 0,
      serious_injury_count: item.seriousInjuryCount ?? 0,
      minor_injury_count: item.minorInjuryCount ?? 0,
      reported_injury_count: item.reportedInjuryCount ?? 0,
    }));

    return NextResponse.json(
      {
        region: data.region ?? null,
        regionType: data.regionType ?? "NATION",
        yearly,
        monthly,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("PedAcc summary API error:", error?.response?.data ?? error.message);
    
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Failed to fetch accident summary";
    
    return NextResponse.json({ error: message }, { status });
  }
}
