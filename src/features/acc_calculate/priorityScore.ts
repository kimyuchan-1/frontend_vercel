/**
 * 우선순위 점수 계산 유틸리티
 * 
 * 우선순위 점수 = (위험 지수 × 0.8) + (안전 지수 역수 × 0.2)
 * - 위험 지수: 0-100 (높을수록 위험)
 * - 안전 지수: 0-100 (높을수록 안전)
 * - 안전 지수 역수: 100 - 안전 지수 (낮을수록 개선 필요)
 */

export interface PriorityScoreInput {
  riskScore: number;      // 위험 지수 (0-100)
  safetyScore?: number;   // 안전 지수 (0-100, 선택적)
}

export interface PriorityScoreWeights {
  risk: number;    // 위험 지수 가중치 (기본: 0.8)
  safety: number;  // 안전 지수 가중치 (기본: 0.2)
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityScoreWeights = {
  risk: 0.8,
  safety: 0.2,
};

/**
 * 우선순위 점수 계산
 * @param input 위험 지수와 안전 지수
 * @param weights 가중치 (선택적)
 * @returns 우선순위 점수 (0-100)
 */
export function calculatePriorityScore(
  input: PriorityScoreInput,
  weights: PriorityScoreWeights = DEFAULT_PRIORITY_WEIGHTS
): number {
  const { riskScore, safetyScore } = input;
  
  // 위험 지수 정규화 (0-100)
  const normalizedRisk = Math.max(0, Math.min(100, riskScore));
  
  // 안전 지수가 없으면 위험 지수만 사용
  if (safetyScore === undefined || safetyScore === null) {
    return Math.round(normalizedRisk * 100) / 100;
  }
  
  // 안전 지수 정규화 (0-100)
  const normalizedSafety = Math.max(0, Math.min(100, safetyScore));
  
  // 안전 지수 역수 (낮을수록 개선 필요)
  const safetyInverse = 100 - normalizedSafety;
  
  // 가중치 합 계산
  const priorityScore = 
    (normalizedRisk * weights.risk) + 
    (safetyInverse * weights.safety);
  
  // 0-100 범위로 정규화하고 소수점 2자리까지 반올림
  return Math.round(Math.max(0, Math.min(100, priorityScore)) * 100) / 100;
}

/**
 * 우선순위 레벨 판정
 * @param score 우선순위 점수 (0-100)
 * @returns 우선순위 레벨 정보
 */
export function getPriorityLevel(score: number): {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { level: 'CRITICAL', label: '매우 높음', color: 'red' };
  } else if (score >= 60) {
    return { level: 'HIGH', label: '높음', color: 'orange' };
  } else if (score >= 40) {
    return { level: 'MEDIUM', label: '보통', color: 'yellow' };
  } else if (score >= 20) {
    return { level: 'LOW', label: '낮음', color: 'blue' };
  } else {
    return { level: 'MINIMAL', label: '매우 낮음', color: 'gray' };
  }
}
