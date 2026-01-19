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
import WarningBanner from '@/components/dashboard/WarningBanner';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface DashboardClientProps {
  initialKpiData: KPIData;
}

/**
 * Detects if the provided KPI data is fallback data (all zeros)
 * @param data - KPI data to check
 * @returns true if all KPI values are zero (fallback data), false otherwise
 */
function isFallbackData(data: KPIData): boolean {
  return (
    data.totalCrosswalks === 0 &&
    data.signalInstallationRate === 0 &&
    data.riskIndex === 0 &&
    data.safetyIndex === 0
  );
}

export default function DashboardClient({ initialKpiData }: DashboardClientProps) {
  const [openExplain, setOpenExplain] = useState(false);
  const [selectedCrosswalk, setSelectedCrosswalk] = useState<Crosswalk | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);
  
  // State for retry functionality
  const [kpiData, setKpiData] = useState<KPIData>(initialKpiData);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const showWarning = isFallbackData(kpiData);

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

  /**
   * Handles retry of KPI data fetching from the API route
   * Shows loading state during fetch, updates KPI data on success,
   * or shows error message on failure while keeping fallback data
   */
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await fetch('/api/dashboard/kpi');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update KPI data state with fetched data
      setKpiData(data);
      
      // Clear any previous error
      setRetryError(null);
    } catch (error) {
      // Show error message but keep fallback data
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setRetryError(errorMessage);
      console.error('[Dashboard KPI Retry] Failed to fetch KPI data:', error);
    } finally {
      setIsRetrying(false);
    }
  };

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
              className="flex items-center gap-2 hover:cursor-pointer hover:bg-gray-200"
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

        {/* Warning Banner - shown when fallback data is displayed */}
        {showWarning && (
          <WarningBanner onRetry={handleRetry} isRetrying={isRetrying} />
        )}

        {/* Retry Error Message */}
        {retryError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-md shadow-sm">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Retry Failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{retryError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI 대시보드 - Server-rendered data */}
        <div className="mb-4">
          <div className="grid grid-cols-5 md:grid-cols-5 gap-4 min-w-0">
            <KPICard
              title="전체 횡단보도"
              content={kpiData.totalCrosswalks.toLocaleString()}
              caption="개소"
              color="gray"
            />
            <KPICard
              title="신호등 설치율"
              content={`${kpiData.signalInstallationRate}%`}
              caption="전체 횡단보도 대비"
              color="green"
            />
            <KPICard
              title="안전 지수"
              content={`${Math.round(kpiData.safetyIndex * 100) / 100}점`}
              caption="100점 만점"
              color="blue"
            />
            <KPICard
              title="위험 지수"
              content={`${Math.round(kpiData.riskIndex * 100) / 100}점`}
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
