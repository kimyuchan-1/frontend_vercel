import { AccidentData, RiskWeights, DEFAULT_RISK_WEIGHTS, SafetyWeights, Crosswalk, DEFAULT_SAFETY_WEIGHTS, DEFAULT_DISTANCE_WEIGHTS } from "./types";

function distanceWeightPiecewise(distanceM: number, w = DEFAULT_DISTANCE_WEIGHTS) {
  if (distanceM <= 50) return w.d50;
  if (distanceM <= 100) return w.d100;
  if (distanceM <= 300) return w.d300;
  if (distanceM <= 500) return w.d500;
  return w.dInf;
}

// 거리 계산 함수(m)
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}


// 거리 미적용, 위험 지표 원점수
export function calcSeverityRaw(accident: AccidentData, weights: RiskWeights = DEFAULT_RISK_WEIGHTS): number {
  const severity =
    accident.fatalityCount * weights.fatality +
    accident.seriousInjuryCount * weights.serious +
    accident.minorInjuryCount * weights.minor +
    accident.accidentCount * weights.accident +
    accident.reportedInjuryCount * weights.reported;

  return severity;
}

// 위험 지표 점수 계산
export function calculateAggregatedRiskScore(
  hotspots: AccidentData[],
  cwLat: number,
  cwLon: number,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
) {
  let sumWeighted = 0;
  let sumW = 0;

  for (const h of hotspots) {
    const d = haversineMeters(cwLat, cwLon, h.accidentLat, h.accidentLon);
    const wDist = distanceWeightPiecewise(d);
    if (wDist <= 0) continue;

    const raw = calcSeverityRaw(h, weights);
    sumWeighted += raw * wDist;
    sumW += wDist;
  }

  const avgWeighted = sumW > 0 ? (sumWeighted / sumW) : 0;

  // 지수 압축 파라미터
  const K = 80;

  const risk = 100 * (1 - Math.exp(-avgWeighted / Math.max(K, 1e-6)));
  return Math.round(Math.max(0, Math.min(100, risk))*100)/100;

}


export function calculateSafetyScore(
  crosswalk: Crosswalk,
  weights: SafetyWeights = DEFAULT_SAFETY_WEIGHTS
): number {
  let score = 0;

  if (crosswalk.hasSignal) score += weights.hasSignal;
  if (crosswalk.hasPedButton) score += weights.hasButton;
  if (crosswalk.hasPedSound) score += weights.hasSound;
  if (crosswalk.isHighland) score += weights.isHighland;
  if (crosswalk.hasBump) score += weights.hasBump;
  if (crosswalk.hasBrailleBlock) score += weights.hasBraille;
  if (crosswalk.hasSpotlight) score += weights.hasSpotlight;

  const maxScore =
    weights.hasSignal +
    weights.hasButton +
    weights.hasSound +
    weights.isHighland +
    weights.hasBump +
    weights.hasBraille +
    weights.hasSpotlight;

  const normalized = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return Math.round(Math.max(0, Math.min(100, normalized))*100)/100;
}