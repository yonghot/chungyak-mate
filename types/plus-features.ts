/**
 * 청약플러스 신규 기능 타입 정의
 *
 * +가치(ValueAnalysis), +예측(Prediction), +보호(Protection),
 * 구독 플랜, 리포트 관련 타입을 정의한다.
 */

/* ─── +가치: 물건 가치 분석 ─── */

/** 가치 등급 (A~F 6단계) */
export type ValueGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** 가치 분석 항목별 점수 */
export interface ValueFactor {
  factor: string;
  score: number;
  maxScore: number;
  description: string;
}

/** 단지 가치 분석 결과 */
export interface ValueAnalysis {
  complexId: string;
  grade: ValueGrade;
  totalScore: number;
  maxScore: number;
  factors: ValueFactor[];
  analyzedAt: string;
}

/* ─── +예측: 경쟁률 예측 ─── */

/** 예측 신뢰도 수준 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** 경쟁률 예측 결과 */
export interface PredictionResult {
  complexId: string;
  supplyType: string;
  predictedRate: number;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  historicalAvg: number | null;
  predictedAt: string;
}

/* ─── +보호: 청약 기회 보호 ─── */

/** 보호 시그널 (GO / WAIT / SKIP) */
export type ProtectionSignal = 'GO' | 'WAIT' | 'SKIP';

/** 보호 판단 근거 */
export interface SignalReason {
  key: string;
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

/** 보호 시그널 결과 */
export interface ProtectionResult {
  complexId: string;
  signal: ProtectionSignal;
  reasons: SignalReason[];
  winProbability: number;
  evaluatedAt: string;
}

/* ─── 구독 플랜 ─── */

/** 구독 플랜 타입 */
export type SubscriptionPlan = 'free' | 'plus' | 'plus_pro';

/** 플랜별 기능 제한 */
export interface PlanLimits {
  plan: SubscriptionPlan;
  maxValueAnalysis: number;
  maxPrediction: number;
  protectionEnabled: boolean;
  reportEnabled: boolean;
  compareLimit: number;
  simulationEnabled: boolean;
}

/* ─── 리포트 ─── */

/** 리포트 타입 */
export type ReportType = 'eligibility' | 'value' | 'comprehensive';

/** 리포트 메타데이터 */
export interface ReportMeta {
  id: string;
  userId: string;
  complexId: string;
  type: ReportType;
  generatedAt: string;
  downloadUrl: string | null;
}
