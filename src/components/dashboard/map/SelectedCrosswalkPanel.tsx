'use client';

import { useMemo } from 'react';
import { Crosswalk, AccidentData } from '@/features/acc_calculate/types';
import { calculateAggregatedRiskScore, calculateSafetyScore } from '@/features/acc_calculate/utils';
import { CrosswalkFeatureIcons } from './CrosswalkFeatures';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function scoreLevel(score: number, kind: 'risk' | 'safety') {
  const s = clamp(score, 0, 100);
  // 기준은 프로젝트 상황에 맞게 추후 조정 가능
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
            <div className="text-2xl font-bold text-gray-900">{s}</div>
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

function SkeletonLine({ w = 'w-full' }: { w?: string }) {
  return <div className={cx('h-3 animate-pulse rounded bg-gray-100', w)} />;
}


export function SelectedCrosswalkPanel(props: {
  selected: Crosswalk | null;
  nearbyAccidents: AccidentData[];
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const { selected, nearbyAccidents, onClose, loading = false, error = null } = props;

  if (!selected) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-700 font-medium">선택된 횡단보도 정보</div>
        <div className="mt-1 text-sm text-gray-600">
          지도에서 횡단보도를 클릭하면 KPI 아래에 상세 정보가 표시돼.
        </div>
      </div>
    );
  }

  const safetyScore = useMemo(() => clamp(calculateSafetyScore(selected), 0, 100), [selected]);

  const uniqueHotspots = useMemo(
    () => new Set(nearbyAccidents.map((h) => String((h as any).accidentId))).size,
    [nearbyAccidents]
  );

  const accidentAgg = useMemo(() => {
    // 필드명이 어떤 형태로 와도 최대한 합산되도록 방어적으로 처리
    const sum = (k: string) =>
      nearbyAccidents.reduce((acc, cur: any) => acc + (Number(cur?.[k]) || 0), 0);

    const accidents = sum('accidentCount');
    const casualties = sum('casualtyCount');
    const deaths = sum('fatalityCount');

    // year 범위 표시 (있으면)
    const years = nearbyAccidents
      .map((d: any) => Number(d?.year))
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => a - b);

    const yearText =
      years.length > 0 ? `${years[0]}–${years[years.length - 1]}` : '최근';

    return { accidents, casualties, deaths, yearText };
  }, [nearbyAccidents]);

  const totalRiskScore = useMemo(() => {
    return clamp(
      calculateAggregatedRiskScore(nearbyAccidents, selected.crosswalk_lat, selected.crosswalk_lon),
      0,
      100
    );
  }, [nearbyAccidents, selected.crosswalk_lat, selected.crosswalk_lon]);

  const headerStripTone = scoreLevel(totalRiskScore, 'risk').tone;
  const strip = toneClasses(headerStripTone).strip;

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden h-full flex flex-col">
      {/* 상단 얇은 스트립(상태 강조) */}
      <div className={cx('h-1.5 w-full', strip)} />

      <div className="shrink p-4 border-b">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">선택된 횡단보도</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 wrap-break-word">
              {selected.address}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <StatPill
                label="신호"
                value={selected.hasSignal ? '있음' : '없음'}
                tone={selected.hasSignal ? 'blue' : 'red'}
              />
              <StatPill
                label="사고다발"
                value={`${uniqueHotspots}곳`}
                tone={uniqueHotspots >= 5 ? 'red' : uniqueHotspots >= 2 ? 'orange' : 'gray'}
              />
              {loading ? (
                <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs bg-gray-50 text-gray-700">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-400" />
                  주변 사고 불러오는 중…
                </span>
              ) : null}
              {error ? (
                <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs bg-red-50 border-red-200 text-red-800">
                  데이터 오류
                </span>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs bg-white hover:bg-gray-50"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto py-4">
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
            <ProgressCard
              title="위험 지수"
              score={totalRiskScore}
              kind="risk"
              subtitle={
                <>
                  {accidentAgg.yearText}
                  <br />
                  반경 500m 기준
                </>
              }
            />

            <ProgressCard
              title="안전 지수"
              score={safetyScore}
              kind="safety"
              subtitle={
                <>
                  <br />
                  시설 기반 산정
                  <br />
                </>
              }
            />

            <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700 lg:col-span-2">
              {loading ? (
                <div className="space-y-2">
                  <SkeletonLine />
                  <SkeletonLine w="w-2/3" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">
                        사고 요약&nbsp;
                        <span className="text-xs text-gray-500">{accidentAgg.yearText} 기준</span>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border bg-white px-2 py-1 text-xs text-gray-600">
                      사고다발 {uniqueHotspots}곳
                    </span>
                  </div>

                  <div className="lg:mt-2 mt-10 text-sm leading-5 flex justify-center items-center">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        사고 <b>{accidentAgg.accidents.toLocaleString()}</b>건
                      </span>
                      <span className="text-gray-400">·</span>
                      <span>
                        사상자 <b>{accidentAgg.casualties.toLocaleString()}</b>명
                      </span>
                      <span className="text-gray-400">·</span>
                      <span>
                        사망 <b>{accidentAgg.deaths.toLocaleString()}</b>명
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">시설</div>
            <div className="text-xs text-gray-500">아이콘으로 빠르게 스캔</div>
          </div>
          <div className="mt-3">
            <CrosswalkFeatureIcons crosswalk={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
