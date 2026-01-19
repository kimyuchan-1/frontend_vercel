'use client'

import KPICard from '@/components/dashboard/KPICard';
import { useState, useMemo } from 'react';
import { FaInfoCircle } from "react-icons/fa";
import dynamic from 'next/dynamic';

import { SelectedCrosswalkPanel } from '@/components/dashboard/map/SelectedCrosswalkPanel';
import { useCrosswalkDetails, convertToEnhancedCrosswalk } from '@/hooks/useCrosswalkDetails';
import type { Crosswalk } from '@/features/acc_calculate/types';

import DistrictSelectors from '@/components/dashboard/DistrictSelectors';
import IndexExplain from "./IndexExplain";
import type { KPIData } from './page';
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface DashboardClientProps {
  initialKpiData: KPIData;
}

export default function DashboardClient({ initialKpiData }: DashboardClientProps) {
  const [openExplain, setOpenExplain] = useState(false);
  const [selectedCrosswalk, setSelectedCrosswalk] = useState<Crosswalk | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

  const selectedCrosswalkId = selectedCrosswalk?.cw_uid ?? null;

  const enhancedSelected = useMemo(() => {
    return selectedCrosswalk ? convertToEnhancedCrosswalk(selectedCrosswalk) : null;
  }, [selectedCrosswalk]);

  const {
    nearbyAccidents,
    loading: loadingDetails,
    error: detailsError,
  } = useCrosswalkDetails({
    crosswalk: enhancedSelected,
    enabled: !!enhancedSelected,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              횡단보도 신호등 설치 현황
            </h2>
            <Button
              type="button"
              onClick={() => setOpenExplain(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FaInfoCircle />
              지수 정보
            </Button>
          </div>
        </div>

        <Modal
          isOpen={openExplain}
          onClose={() => setOpenExplain(false)}
          title="지수 산정 기준"
          size="xl"
        >
          <IndexExplain />
        </Modal>

        {/* KPI 대시보드 - Server-rendered data */}
        <div className="mb-4">
          <div className="grid grid-cols-5 md:grid-cols-5 gap-4 min-w-0">
            <KPICard
              title="전체 횡단보도"
              content={initialKpiData.totalCrosswalks.toLocaleString()}
              caption="개소"
              color="gray"
            />
            <KPICard
              title="신호등 설치율"
              content={`${initialKpiData.signalInstallationRate}%`}
              caption="전체 횡단보도 대비"
              color="green"
            />
            <KPICard
              title="안전 지수"
              content={`${Math.round(initialKpiData.safetyIndex * 100) / 100}점`}
              caption="100점 만점"
              color="blue"
            />
            <KPICard
              title="위험 지수"
              content={`${Math.round(initialKpiData.riskIndex * 100) / 100}점`}
              caption="100점 만점"
              color="red"
            />
            <div className='py-5 flex flex-col items-end'>
              <div className="text-md font-medium text-gray-500 mb-2">
                지역 선택
              </div>
              <DistrictSelectors onMove={setMoveTo} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border relative overflow-hidden h-105 sm:h-130 lg:h-160">
              <MapView
                selectedCrosswalkId={selectedCrosswalkId}
                onSelectCrosswalk={setSelectedCrosswalk}
                moveTo={moveTo}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-auto pb-4">
              <SelectedCrosswalkPanel
                selected={enhancedSelected}
                nearbyAccidents={nearbyAccidents ?? []}
                loading={loadingDetails}
                error={detailsError}
                onClose={() => setSelectedCrosswalk(null)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
