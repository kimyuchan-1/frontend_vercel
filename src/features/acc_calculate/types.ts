// 사고 데이터 타입 정의 (실제 ACC 테이블 구조 기반)

export interface AccidentData {
  accidentId: number;
  districtCode: string;
  year: number;
  accidentCount: number;
  casualtyCount: number;
  fatalityCount: number;
  seriousInjuryCount: number;
  minorInjuryCount: number;
  reportedInjuryCount: number;
  accidentLon: number;
  accidentLat: number;
}

export type AccidentDataWithDistance = AccidentData & { distance: number };

type DistanceBandWeights = {
  d50: number;   // <=50m
  d100: number;  // 50-100m
  d300: number;  // 100-300m
  d500: number;  // 300-500m
  dInf: number;  // >500m
};

export const DEFAULT_DISTANCE_WEIGHTS: DistanceBandWeights = {
  d50: 1.0,
  d100: 0.7,
  d300: 0.4,
  d500: 0.1,
  dInf: 0.0,
};

const DEFAULT_SEVERITY_P95 = 40;

// 위험 지표 계산용 가중치
export interface RiskWeights {
  reported: number;      // 보고된 부상자 가중치
  fatality: number;      // 사망자 가중치
  serious: number;       // 중상자 가중치  
  minor: number;         // 경상자 가중치
  accident: number;      // 사고 건수 가중치
}

// 안전 지표 계산용 가중치 (횡단보도/신호등 기능 기반)
export interface SafetyWeights {
  hasSignal: number;           // 신호등 유무
  hasButton: number;           // 보행자작동신호기
  hasSound: number;            // 음향신호기 (시각장애인용)
  hasRemainTime: number;       // 잔여시간표시기
  isHighland: number;          // 고원식 횡단보도
  hasBump: number;             // 보도턱낮춤
  hasBraille: number;          // 점자블록
  hasSpotlight: number;        // 집중조명시설
}

// 기본 가중치 설정
export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  reported: 0.5,   // 보고된 부상자 1명 = 0.5점
  fatality: 10,    // 사망자 1명 = 10점
  serious: 5,      // 중상자 1명 = 5점  
  minor: 2,        // 경상자 1명 = 2점
  accident: 1      // 사고 1건 = 1점
};

export const DEFAULT_SAFETY_WEIGHTS: SafetyWeights = {
  hasSignal: 30,        // 신호등 있으면 +30점
  hasButton: 10,        // 보행자 버튼 +10점
  hasSound: 15,         // 음향신호기 +15점 (접근성 중요)
  hasRemainTime: 10,    // 잔여시간 표시 +10점
  isHighland: 20,       // 고원식 +20점 (속도 저감)
  hasBump: 8,           // 보도턱낮춤 +8점
  hasBraille: 12,       // 점자블록 +12점
  hasSpotlight: 15,     // 집중조명 +15점 (야간 안전)
};

// 히트맵용 데이터 타입
export interface HeatmapPoint {
  lat: number;
  lon: number;
  riskScore: number;     // 위험 지표 (0-100, 높을수록 위험)
  safetyScore: number;   // 안전 지표 (0-100, 높을수록 안전)
  combinedScore: number; // 종합 지표 (safetyScore - riskScore)
}

// 확장된 횡단보도 데이터 (안전 지표 계산용)
export interface Crosswalk {
  cw_uid: string;
  address: string;
  crosswalk_lat: number;
  crosswalk_lon: number;
  hasSignal: boolean;
  // 추가 안전 기능들 (metadata에서 확인된 필드들)
  crosswalk_width?: number;
  isHighland?: boolean;           // 고원식 적용 여부
  hasPedButton?: boolean;             // 보행자작동신호기유무
  hasPedSound?: boolean;       // 음향신호기설치유무
  hasBump?: boolean;               // 보도턱낮춤여부
  hasBrailleBlock?: boolean;      // 점자블록유무
  hasSpotlight?: boolean;          // 집중조명시설유무
}

// API 응답 타입
export interface AccidentsApiResponse extends Array<AccidentData> { }

// 지도 범위 타입 (기존 crosswalks API와 동일)
export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

// 지역별 좌표 매핑 타입
export interface DistrictCoordinate {
  lat: number;
  lon: number;
}

