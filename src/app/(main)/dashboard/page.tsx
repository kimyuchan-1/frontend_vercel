import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';
import { getKPIData } from '@/features/kpi/kpi-utils';
import type { KPIData } from '@/features/kpi/kpi-utils';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: '대시보드 | 보행자 교통안전 분석',
  description: '횡단보도 신호등 설치 현황 및 안전 지수 분석 대시보드',
};

export type { KPIData };

export default async function DashboardPage() {
  const kpiData = await getKPIData();

  return <DashboardClient initialKpiData={kpiData} />;
}
