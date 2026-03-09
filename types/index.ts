export type {
  Database,
  MaritalStatus,
  SubscriptionType,
  ComplexStatus,
  SupplyType,
  EligibilityStatus,
  NotificationType,
  EligibilityReason,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Complex,
  ComplexInsert,
  ComplexUpdate,
  SupplyTypeRow,
  SupplyTypeInsert,
  EligibilityRule,
  EligibilityRuleInsert,
  EligibilityResult,
  EligibilityResultInsert,
  Bookmark,
  BookmarkInsert,
  Notification,
  NotificationInsert,
} from './database';

export type { DomainGlossary } from './glossary';

export type {
  ValueGrade,
  ValueFactor,
  ValueAnalysis,
  ConfidenceLevel,
  PredictionResult,
  ProtectionSignal,
  SignalReason,
  ProtectionResult,
  SubscriptionPlan,
  PlanLimits,
  ReportType,
  ReportMeta,
} from './plus-features';

/** 통일 API 응답 포맷 */
export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

/** 페이지네이션 응답 포맷 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** 가점 항목별 상세 */
export interface ScoreDetail {
  score: number;
  max: number;
  detail: string;
}

/** 84점 가점 산출 결과 */
export interface ScoreBreakdown {
  homelessPeriod: ScoreDetail;
  dependents: ScoreDetail;
  subscriptionPeriod: ScoreDetail;
  total: number;
}

/** 단지 + 공급유형 조인 결과 */
export interface ComplexWithSupplyTypes {
  complex: import('./database').Complex;
  supplyTypes: import('./database').SupplyTypeRow[];
}

/** 판정 실행 요청 파라미터 */
export interface EvaluateRequest {
  complexId: string;
  supplyTypes?: import('./database').SupplyType[];
}

/** 판정 실행 응답 */
export interface EvaluateResponse {
  results: import('./database').EligibilityResult[];
  score: ScoreBreakdown | null;
  evaluatedAt: string;
}
