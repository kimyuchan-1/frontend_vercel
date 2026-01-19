import { Suspense } from "react";
import PedAccClient from "./PedAccClient";
import { backendClient } from "@/lib/backendClient";
import { cookies } from "next/headers";

// Enable ISR with 2 minutes revalidation
export const revalidate = 120;

interface PageProps {
  searchParams: {
    region?: string;
  };
}

async function getAccidentData(region?: string) {
  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const params: Record<string, string> = {};
    if (region && region.trim()) {
      params.region = region.trim();
    }

    const response = await backendClient.get("/api/pedacc/summary", {
      params,
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    const data = response.data;

    // Transform backend response to frontend format
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

    return {
      region: data.region ?? null,
      regionType: data.regionType ?? "NATION",
      yearly,
      monthly,
    };
  } catch (error: any) {
    console.error("Failed to fetch accident data:", error?.response?.data ?? error.message);
    // Return empty data on error
    return {
      region: null,
      regionType: "NATION",
      yearly: [],
      monthly: [],
    };
  }
}

async function getProvinces() {
  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const response = await backendClient.get("/api/district/provinces", {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    return response.data ?? [];
  } catch (error: any) {
    console.error("Failed to fetch provinces:", error?.message);
    return [];
  }
}

export default async function Page({ searchParams }: PageProps) {
  const region = searchParams.region;

  // Fetch initial data on server in parallel
  const [accidentData, provinces] = await Promise.all([
    getAccidentData(region),
    getProvinces(),
  ]);

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PedAccClient 
        initialData={accidentData}
        initialProvinces={provinces}
        initialRegion={region}
      />
    </Suspense>
  );
}
