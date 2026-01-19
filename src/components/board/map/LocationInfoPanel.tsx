'use client';

import { useMemo, useEffect, useState } from 'react';
import { AccidentData } from '@/features/acc_calculate/types';
import { calculateAggregatedRiskScore } from '@/features/acc_calculate/utils';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function scoreLevel(score: number, kind: 'risk' | 'safety') {
  const s = clamp(score, 0, 100);
  if (kind === 'risk') {
    if (s >= 80) return { label: '매우 높음', tone: 'red' as const };
    if (s >= 60) return { label: '높음', tone: 'red' as const };
    if (s >= 40) return { label: '보통', tone: 'orange' as const };
    if (s >= 20) return { label: '낮음', tone: 'gray' as const };
    return { label: '매우 낮음', tone: 'gray' as const };
  } else {
    if (s >= 80) return { label: '매우 좋음', tone: 'blue' as const };
    if (s >= 60) return { label: '좋음', tone: 'blue' as const };
    if (s >= 40) return { label: '보통', tone: 'gray' as const };
    if (s >= 20) return { label: '낮음', tone: 'orange' as const };
    return { label: '매우 낮음', tone: 'red' as const };
  }
}

function toneClasses(tone: 'red' | 'orange' | 'blue' | 'gray') {
  switch (tone) {
    case 'red':
      return {
        chip: 'bg-red-50 border-red-200 text-red-800',
        bar: 'bg-red-500',
        text: 'text-red-700',
        strip: 'bg-red-500',
      };
    case 'orange':
      return {
        chip: 'bg-orange-50 border-orange-200 text-orange-800',
        bar: 'bg-orange-500',
        text: 'text-orange-700',
        strip: 'bg-orange-500',
      };
    case 'blue':
      return {
        chip: 'bg-blue-50 border-blue-200 text-blue-800',
        bar: 'bg-blue-500',
        text: 'text-blue-700',
        strip: 'bg-blue-500',
      };
    default:
      return {
        chip: 'bg-gray-50 border-gray-200 text-gray-800',
        bar: 'bg-gray-500',
        text: 'text-gray-700',
        strip: 'bg-gray-500',
      };
  }
}

function StatPill(props: { label: string; value: string; tone?: 'red' | 'orange' | 'blue' | 'gray' }) {
  const tone = toneClasses(props.tone ?? 'gray');
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs', tone.chip)}>
      <span className="opacity-90">{props.label}</span>
      <b className={cx('font-semibold', tone.text)}>{props.value}</b>
    </span>
  );
}

function ProgressCard(props: {
  title: string;
  score: number;
  kind: 'risk' | 'safety';
  subtitle?: React.ReactNode;
}) {
  const s = clamp(props.score, 0, 100);
  const lv = scoreLevel(s, props.kind);
  const tone = toneClasses(lv.tone);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">{props.title}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">{s.toFixed(1)}</div>
          </div>
        </div>
        <div className='flex flex-col'>
          <div className={cx('h-2 w-16 rounded-full', 'bg-gray-100')}>
            <div className={cx('h-2 rounded-full', tone.bar)} style={{ width: `${s}%` }} />
          </div>
          <span className={cx('text-xs font-medium mt-6 ml-1', tone.text)}>{lv.label}</span>
        </div>
      </div>
      {props.subtitle ? <div className="mt-1 text-xs text-gray-500">{props.subtitle}</div> : null}
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div className={cx('h-2 rounded-full', tone.bar)} style={{ width: `${s}%` }} />
      </div>
    </div>
  );
}

interface LocationInfoPanelProps {
  lat: number | null;
  lon: number | null;
  address: string;
  onPriorityScoreCalculated?: (score: number) => void;
}

export default function LocationInfoPanel({ lat, lon, address, onPriorityScoreCalculated }: LocationInfoPanelProps) {
  const [nearbyAccidents, setNearbyAccidents] = useState<AccidentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주변 사고 데이터 가져오기
  useEffect(() => {
    if (!lat || !lon) {
      setNearbyAccidents([]);
      return;
    }

    const fetchNearbyAccidents = async () => {
      setLoading(true);
      setError(null);
      try {
        // 반경 약 500m를 위도/경도로 변환 (대략 0.005도)
        const delta = 0.005;
        const bounds = `${lat - delta},${lon - delta},${lat + delta},${lon + delta}`;
        
        // console.log('[LocationInfoPanel] Fetching accidents with bounds:', bounds);
        
        const response = await fetch(
          `/api/map/acc_hotspots?bounds=${encodeURIComponent(bounds)}&limit=1000`
        );
        
        // console.log('[LocationInfoPanel] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          // console.log('[LocationInfoPanel] API Response:', data);
          
          // API가 배열을 직접 반환하는 경우
          if (Array.isArray(data)) {
            setNearbyAccidents(data);
          }
          // API가 { success: true, data: [] } 형식으로 반환하는 경우
          else if (data?.success && Array.isArray(data.data)) {
            setNearbyAccidents(data.data);
          }
          else {
            setNearbyAccidents([]);
          }
        } else {
          const errorText = await response.text();
          console.error('[LocationInfoPanel] Error response:', errorText);
          setError('사고 데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('[LocationInfoPanel] 사고 데이터 조회 실패:', err);
        setError('사고 데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyAccidents();
  }, [lat, lon]);

  // 위험 지수 계산 (= 우선순위 점수)
  const riskScore = useMemo(() => {
    if (!lat || !lon || nearbyAccidents.length === 0) return 0;
    return clamp(calculateAggregatedRiskScore(nearbyAccidents, lat, lon), 0, 100);
  }, [nearbyAccidents, lat, lon]);

  // 우선순위 점수는 위험 지수와 동일
  useEffect(() => {
    if (onPriorityScoreCalculated && lat && lon) {
      // console.log('[LocationInfoPanel] Priority score (= risk score):', riskScore);
      onPriorityScoreCalculated(riskScore);
    }
  }, [riskScore, lat, lon, onPriorityScoreCalculated]);

  // 100m 내 사고다발지역 개수
  const nearbyHotspots = useMemo(() => {
    if (!lat || !lon) return 0;
    
    // 간단한 거리 계산 (정확하지 않지만 대략적인 필터링용)
    const nearby = nearbyAccidents.filter(acc => {
      const latDiff = Math.abs(acc.accidentLat - lat);
      const lonDiff = Math.abs(acc.accidentLon - lon);
      // 대략 100m = 0.001도
      return latDiff <= 0.001 && lonDiff <= 0.001;
    });
    
    return new Set(nearby.map(a => a.accidentId)).size;
  }, [nearbyAccidents, lat, lon]);

  // 사고 통계
  const accidentStats = useMemo(() => {
    // console.log('[LocationInfoPanel] Calculating accident stats from:', nearbyAccidents.length, 'accidents');
    
    const sum = (k: keyof AccidentData) =>
      nearbyAccidents.reduce((acc, cur) => {
        const value = Number(cur[k]) || 0;
        // console.log(`[LocationInfoPanel] ${k}:`, cur[k], '-> value:', value);
        return acc + value;
      }, 0);

    const stats = {
      accidents: sum('accidentCount'),
      casualties: sum('casualtyCount'),
      deaths: sum('fatalityCount'),
    };
    
    // console.log('[LocationInfoPanel] Calculated stats:', stats);
    return stats;
  }, [nearbyAccidents]);

  if (!lat || !lon) {
    return (
      <div className="rounded-xl border bg-gray-50 p-4">
        <div className="text-center text-gray-500 text-sm">
          지도에서 위치를 선택하면 해당 지점의 위험 지수와 주변 사고 정보가 표시됩니다.
        </div>
      </div>
    );
  }

  const headerStripTone = scoreLevel(riskScore, 'risk').tone;
  const strip = toneClasses(headerStripTone).strip;
  const riskLevel = scoreLevel(riskScore, 'risk');
  const riskTone = toneClasses(riskLevel.tone);

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* 상단 스트립 */}
      <div className={cx('h-1 w-full', strip)} />

      <div className="p-4">
        {/* 위험 지수 (= 우선순위 점수) */}
        <div className="flex items-center gap-3 p-4 bg-linear-to-r from-gray-50 to-white rounded-lg mb-4 border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium text-gray-700">위험 지수 (우선순위 점수)</div>
              <span className={cx('text-xs px-2 py-0.5 rounded-full font-medium', riskTone.chip)}>
                {riskLevel.label}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">{riskScore.toFixed(1)}</span>
              <span className="text-sm text-gray-500">/ 100</span>
            </div>
            <div className="mt-3 h-3 w-full rounded-full bg-gray-200 overflow-hidden">
              <div 
                className={cx('h-3 rounded-full transition-all duration-500', riskTone.bar)} 
                style={{ width: `${riskScore}%` }} 
              />
            </div>
          </div>
          <div className={cx('h-16 w-16 rounded-full flex items-center justify-center shadow-sm', riskTone.chip)}>
            <div className={cx('h-12 w-12 rounded-full', riskTone.bar)} />
          </div>
        </div>

        {/* 사고 요약 및 안내 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t">
          {/* 사고 요약 */}
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-2">주변 사고 요약 (반경 500m)</div>
            {loading ? (
              <div className="flex gap-4">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="text-gray-700">
                  사고 <b className="text-gray-900">{accidentStats.accidents}</b>건
                </span>
                <span className="text-gray-700">
                  사상자 <b className="text-gray-900">{accidentStats.casualties}</b>명
                </span>
                <span className="text-gray-700">
                  사망 <b className="text-red-600">{accidentStats.deaths}</b>명
                </span>
                <span className={cx('text-xs px-2 py-1 rounded-full font-medium', 
                  nearbyHotspots >= 5 ? 'bg-red-100 text-red-700' : 
                  nearbyHotspots >= 2 ? 'bg-orange-100 text-orange-700' : 
                  'bg-gray-100 text-gray-700')}>
                  사고다발 {nearbyHotspots}곳
                </span>
              </div>
            )}
          </div>

          {/* 안내 */}
          <div className="text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
            <span className="font-medium text-blue-900">💡 </span>
            위험 지수가 높을수록 개선이 시급합니다
          </div>

          {/* 로딩/에러 상태 */}
          {loading && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-400" />
              로딩 중
            </span>
          )}
          {error && (
            <span className="text-xs text-red-600">⚠️ 데이터 오류</span>
          )}
        </div>
      </div>
    </div>
  );
}
