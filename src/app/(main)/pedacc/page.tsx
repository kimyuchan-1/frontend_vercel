import { Suspense } from "react";
import PedAccClient from "./PedAccClient";
import { cookies } from "next/headers";

// Enable ISR with 2 minutes revalidation
export const revalidate = 120;

interface PageProps {
  searchParams: Promise<{
    region?: string;
  }>;
}

async function getAccidentData(region?: string) {
  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const params = new URLSearchParams();
    if (region && region.trim()) {
      params.set('region', region.trim());
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/pedacc/summary${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();

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
    console.error("Failed to fetch accident data:", error?.message);
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/district/provinces`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    return data ?? [];
  } catch (error: any) {
    console.error("Failed to fetch provinces:", error?.message);
    return [];
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const region = params.region;

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
