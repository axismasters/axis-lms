// AXIS LMS v1.2 — University Analysis Phase 5.1 Client Boundary (Stub v1)
//
// 목적: LMS와 axis-university-analysis-engine-phase5.1 사이의 API 호출 경계를 정의한다.
//
// 현재 단계(Stub v1):
//   - 실제 fetch 호출 없음
//   - 엔진 본체 import 없음
//   - callPhase51AnalyzeApi는 항상 명시적 에러를 던진다
//   - 타입/함수 이름/import 경로를 이 단계에서 확정한다
//
// 다음 단계:
//   - Stage 2: Phase51AnalyzeResponse 타입 완성 (Phase 5.1 API_CONTRACT.md 기준)
//   - Stage 3: callPhase51AnalyzeApi를 실제 fetch로 교체 (VITE_PHASE51_API_URL 환경변수)
//   - Stage 4: LMS UI에 응답 표시 (GradesTab 내부 조건부 렌더)
//
// ❌ 엔진 본체 직접 import 금지
// ❌ 실제 fetch 호출 금지
// ❌ 합격 가능성 / 추천 순위 / 대학명 생성 금지
// ❌ PDF Export 금지
// ✅ Phase51AnalyzeRequestDraft import 허용 (입력 타입 참조 전용)

import type { Phase51AnalyzeRequestDraft } from '@/lib/universityAnalysisAdapter';

// ────────────────────────────────────────────────────────────
// Phase 5.1 API 상태
// ────────────────────────────────────────────────────────────

/**
 * Phase 5.1 API 호출 상태.
 *
 * LMS UI에서 분석 요청의 진행 상태를 표현하는 데 사용한다.
 * Stage 3 실제 API 연결 시 GradesTab 내부 state 타입으로 사용 예정.
 *
 * - 'idle'    : 호출 전 초기 상태
 * - 'pending' : 호출 중 (로딩)
 * - 'success' : 호출 성공 — Phase51AnalyzeResponse 수신
 * - 'error'   : 호출 실패 — 에러 메시지 표시
 */
export type Phase51ApiStatus = 'idle' | 'pending' | 'success' | 'error';

// ────────────────────────────────────────────────────────────
// Phase 5.1 AnalyzeResponse 타입 placeholder
// ────────────────────────────────────────────────────────────

/**
 * axis-university-analysis-engine-phase5.1 /analyze 엔드포인트 응답 타입 placeholder.
 *
 * 현재 단계(Stub v1):
 *   - reportId / generatedAt 두 필드만 선언
 *   - 나머지 필드는 Stage 2에서 Phase 5.1 docs/API_CONTRACT.md 기준으로 완성한다
 *
 * Stage 2에서 추가 예정인 필드:
 *   currentScoreSummary, recommendationBand, targetGap, subjectWeakness,
 *   mathImpact?, improvementScenarioResult?, counselingComment, reportSummary,
 *   dataConfidence, disclaimer, analysisSource, excludedUnivIds
 *
 * 이 타입에 대학명 / 합격 가능성 / 추천 순위를 LMS에서 직접 생성하지 않는다.
 * 엔진 응답을 그대로 표시하는 용도로만 사용한다.
 */
export interface Phase51AnalyzeResponse {
  reportId: string;
  generatedAt: string;
  // TODO(Stage 2): Phase 5.1 docs/API_CONTRACT.md 기준 전체 응답 필드 추가
}

// ────────────────────────────────────────────────────────────
// Phase 5.1 API client (stub)
// ────────────────────────────────────────────────────────────

/**
 * Phase 5.1 /analyze 엔드포인트 호출 함수 (Stub v1).
 *
 * 현재 단계에서는 항상 에러를 던진다. 실제 fetch 연결은 Stage 3에서 진행한다.
 *
 * Stage 3에서는 VITE_PHASE51_API_URL 환경변수를 사용해 실제 /analyze
 * 엔드포인트 호출 구현으로 교체한다. 이 파일에는 Stub v1 단계에서
 * 실제 네트워크 호출 코드를 두지 않는다.
 *
 * @param _draft Phase51AnalyzeRequestDraft — 엔진에 전달할 요청 payload
 * @throws Error 항상 — Stub 단계이므로 실제 호출하지 않음
 */
export async function callPhase51AnalyzeApi(
  _draft: Phase51AnalyzeRequestDraft,
): Promise<Phase51AnalyzeResponse> {
  throw new Error('Phase 5.1 API not yet connected. Stub only.');
}
