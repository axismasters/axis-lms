// AXIS LMS v1.2 — University Analysis Phase 5.1 Client (API Fetch Connection v1)
//
// 목적: LMS와 axis-university-analysis-engine-phase5.1 사이의 API 호출 경계 및
//       응답 타입 계약을 정의한다.
//
// 현재 단계(API Fetch Connection v1):
//   - callPhase51AnalyzeApi를 실제 fetch 기반으로 교체
//   - API base URL: VITE_PHASE51_API_URL 환경변수 (Phase51ImportMetaEnv 로컬 타입으로 안전하게 접근)
//   - POST ${baseUrl}/analyze — body: JSON.stringify(draft)
//   - 엔진 본체 import 없음
//   - LMS 내부에서 합격 가능성·추천 순위·대학명을 계산하지 않는다
//
// 다음 단계:
//   - Stage 4: LMS UI에 응답 표시 (GradesTab 내부 조건부 렌더)
//
// ❌ 엔진 본체 직접 import 금지
// ❌ LMS 내부에서 합격 가능성 / 추천 순위 / 대학명 생성 금지
// ❌ PDF Export 금지
// ✅ Phase51AnalyzeRequestDraft import 허용 (입력 타입 참조 전용)

import type { Phase51AnalyzeRequestDraft } from '@/lib/universityAnalysisAdapter';

// ────────────────────────────────────────────────────────────
// 로컬 env 타입 — vite-env.d.ts / vite/client 없이 안전하게 접근
// ────────────────────────────────────────────────────────────

/**
 * vite/client reference 없이 import.meta.env를 안전하게 캐스팅하기 위한 로컬 타입.
 * 이 타입은 universityAnalysisClient.ts 전용이며 외부에 export하지 않는다.
 */
interface Phase51ImportMetaEnv {
  env?: {
    VITE_PHASE51_API_URL?: string;
  };
}

// ────────────────────────────────────────────────────────────
// Phase 5.1 API 상태
// ────────────────────────────────────────────────────────────

/**
 * Phase 5.1 API 호출 상태.
 *
 * Stage 3 실제 API 연결 시 GradesTab 내부 state 타입으로 사용 예정.
 * - 'idle'    : 호출 전 초기 상태
 * - 'pending' : 호출 중 (로딩)
 * - 'success' : 호출 성공 — Phase51AnalyzeResponse 수신
 * - 'error'   : 호출 실패 — 에러 메시지 표시
 */
export type Phase51ApiStatus = 'idle' | 'pending' | 'success' | 'error';

// ────────────────────────────────────────────────────────────
// Phase 5.1 AnalyzeResponse 서브타입
// Phase 5.1 docs/API_CONTRACT.md 기준. LMS에서 계산하지 않는다.
// ────────────────────────────────────────────────────────────

/**
 * 엔진이 입력으로 인식한 현재 성적 요약.
 * 엔진이 반환하는 값이며, LMS에서 계산하지 않는다.
 */
export interface Phase51CurrentScoreSummary {
  suneungRounds: number;
  latestMockDate?: string;
  mathAvgPercentile: number | null;
  koreanAvgPercentile: number | null;
  englishAvgGrade: number | null;
  internalAvgGrade: number | null;
}

/**
 * 추천 밴드 단일 항목.
 * univName / deptName 은 엔진이 생성한다. LMS에서 생성하지 않는다.
 */
export interface Phase51RecommendationEntry {
  univId: string;
  univName: string;
  deptName: string;
  band: 'reach' | 'target' | 'safety';
  admissionType?: string;
}

/**
 * 엔진이 산출한 추천 대학/학과 밴드 전체.
 * LMS는 이 값을 표시할 뿐이며, 직접 계산하지 않는다.
 */
export interface Phase51RecommendationBand {
  items: Phase51RecommendationEntry[];
  summary: string;
}

/**
 * 목표대학 대비 현재 점수 갭 단일 항목.
 */
export interface Phase51TargetGapEntry {
  univId: string;
  univName: string;
  deptName: string;
  gapSummary: string;
  mathGapPercentile: number | null;
  koreanGapPercentile: number | null;
}

/**
 * 과목별 취약점 단일 항목.
 */
export interface Phase51SubjectWeaknessItem {
  subject: string;
  percentile: number | null;
  grade: number | null;
  note: string;
}

/**
 * 수학 점수 향상 시나리오의 추천 영향 분석.
 * improvementScenario 입력이 있을 때만 엔진이 반환한다.
 */
export interface Phase51MathImpact {
  currentPercentile: number | null;
  projectedPercentile: number | null;
  bandImpactSummary: string;
}

/**
 * IF 개선 시나리오 적용 시 추천 결과 변화.
 * improvementScenario 입력이 있을 때만 엔진이 반환한다.
 */
export interface Phase51ImprovementScenarioResult {
  scenarioApplied: boolean;
  projectedBandChange: string;
  confidence: number;
}

// ────────────────────────────────────────────────────────────
// Phase 5.1 AnalyzeResponse 메인 타입
// ────────────────────────────────────────────────────────────

/**
 * axis-university-analysis-engine-phase5.1 /analyze 엔드포인트 응답 타입.
 *
 * Phase 5.1 docs/API_CONTRACT.md 기준. LMS는 이 타입의 값을 표시만 한다.
 * 합격 가능성 / 추천 순위 / 대학명은 엔진이 계산하며 LMS는 생성하지 않는다.
 */
export interface Phase51AnalyzeResponse {
  /** 분석 보고서 고유 식별자 */
  reportId: string;
  /** 분석 생성 시각 (ISO 8601) */
  generatedAt: string;
  /** 엔진이 인식한 현재 성적 요약 */
  currentScoreSummary: Phase51CurrentScoreSummary;
  /** 엔진이 산출한 추천 대학/학과 밴드 (reach / target / safety) */
  recommendationBand: Phase51RecommendationBand;
  /** 목표대학 대비 현재 점수 갭 목록 */
  targetGap: Phase51TargetGapEntry[];
  /** 과목별 취약점 목록 */
  subjectWeakness: Phase51SubjectWeaknessItem[];
  /** 수학 향상 시나리오 영향 (improvementScenario 입력 시에만 존재) */
  mathImpact?: Phase51MathImpact;
  /** IF 시나리오 추천 결과 변화 (improvementScenario 입력 시에만 존재) */
  improvementScenarioResult?: Phase51ImprovementScenarioResult;
  /** 상담용 코멘트 (상담사가 활용하는 자연어 텍스트) */
  counselingComment: string;
  /** 보고서 요약 (학생/학부모 열람용) */
  reportSummary: string;
  /** 데이터 신뢰도 (0~1) */
  dataConfidence: number;
  /** 분석 결과 면책 문구 */
  disclaimer: string;
  /** 분석 데이터 출처 식별자 */
  analysisSource: string;
  /** 분석에서 제외된 대학 ID 목록 */
  excludedUnivIds: string[];
}

// ────────────────────────────────────────────────────────────
// Phase 5.1 API client
// ────────────────────────────────────────────────────────────

/** POST /analyze 요청 타임아웃 (ms). 초과 시 AbortController로 중단. */
const PHASE51_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Phase 5.1 /analyze 엔드포인트 호출 함수.
 *
 * VITE_PHASE51_API_URL 환경변수가 설정되어 있어야 한다.
 * 설정되지 않으면 즉시 에러를 던진다.
 *
 * PHASE51_REQUEST_TIMEOUT_MS(30초) 이내에 응답이 없으면 AbortController로 요청을 취소한다.
 *
 * LMS는 응답 값을 표시만 하며, 합격 가능성·추천 순위·대학명을 내부에서 계산하지 않는다.
 *
 * @param draft Phase51AnalyzeRequestDraft — 엔진에 전달할 요청 payload
 * @throws Error VITE_PHASE51_API_URL 미설정 시
 * @throws Error 타임아웃 시 (`Phase 5.1 API request timed out.`)
 * @throws Error 응답 상태가 !res.ok 일 때 (`Phase 5.1 API error: ${res.status}`)
 */
export async function callPhase51AnalyzeApi(
  draft: Phase51AnalyzeRequestDraft,
): Promise<Phase51AnalyzeResponse> {
  const baseUrl = (import.meta as unknown as Phase51ImportMetaEnv).env?.VITE_PHASE51_API_URL;
  if (!baseUrl) {
    throw new Error('VITE_PHASE51_API_URL is not set.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PHASE51_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Phase 5.1 API error: ${res.status}`);
    }

    return res.json() as Promise<Phase51AnalyzeResponse>;
  } catch (e) {
    const errorName = typeof e === 'object' && e !== null && 'name' in e
      ? String((e as { name?: unknown }).name)
      : '';
    if (errorName === 'AbortError') {
      throw new Error('Phase 5.1 API request timed out.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
