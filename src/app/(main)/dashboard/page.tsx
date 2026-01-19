import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: '대시보드 | 보행자 교통안전 분석',
  description: '횡단보도 신호등 설치 현황 및 안전 지수 분석 대시보드',
};

export interface KPIData {
  totalCrosswalks: number;
  signalInstallationRate: number;
  riskIndex: number;
  accidentReductionRate: number;
  safetyIndex: number;
}

function coerceNumber(v: unknown, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeKpiPayload(payload: any): KPIData {
  const src = payload;

  return {
    totalCrosswalks: coerceNumber(src.totalCrosswalks),
    signalInstallationRate: coerceNumber(src.signalInstallationRate),
    riskIndex: coerceNumber(src.riskIndex),
    accidentReductionRate: coerceNumber(src.accidentReductionRate),
    safetyIndex: coerceNumber(src.safetyIndex),
  };
}

async function getKPIData(): Promise<KPIData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resp = await fetch(`${baseUrl}/api/dashboard/kpi`, {
      next: { revalidate: 60 }, // ISR: Cache for 60 seconds
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) {
      console.error('KPI fetch failed:', resp.status);
      return {
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        accidentReductionRate: 0,
        safetyIndex: 0,
      };
    }

    const payload = await resp.json();
    return normalizeKpiPayload(payload);
  } catch (err) {
    console.error('KPI fetch error:', err);
    return {
      totalCrosswalks: 0,
      signalInstallationRate: 0,
      riskIndex: 0,
      accidentReductionRate: 0,
      safetyIndex: 0,
    };
  }
}

export default async function DashboardPage() {
  const kpiData = await getKPIData();

  return <DashboardClient initialKpiData={kpiData} />;
}
