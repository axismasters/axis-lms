// AXIS LMS v1.2 — Phase 3D v3-r9: IF Analysis Engine 계약(Contract)
//
// 목적: "IF 채점"을 화면마다 흩어진 기능이 아니라 하나의 엔진 경계로 정리한다.
// 실제 계산 로직은 이미 studentIfAnalysis.ts(계산)와 studentIfRecord.ts(저장/누적)에
// 구현되어 있다 — 이 파일은 그 둘을 다시 구현하지 않고, 미래에 다른 엔진
// (문제은행/엠블럼/라이벌/학부모 브리핑/추천 엔진)이 IF 데이터를 가져다 쓸 때
// 참조할 "단일 진입점 + 계약 타입"만 정리한다.
//
// ⚠ 절대 규칙(이번 Phase 재확인, 변경 없음):
//   - IF 이유는 계산 실수 / 개념 부족 / 시간 부족 3개만 사용한다(IF_REASONS 그대로).
//   - IF는 "테스트" 성적표 상세 안에서만 노출한다 — 별도 메뉴로 분리하지 않는다.
//   - 학생 성적 직접 입력 기능이 아니다 — 이미 채점된 시험의 "놓친 이유 회고"만 다룬다.
//   - 학부모는 조회만 가능하다 — 이 엔진 출력은 학부모 화면에서 읽기 전용으로만 소비된다.
//   - 이 엔진은 외부 AI API를 호출하지 않는다 — 모든 출력은 studentIfAnalysis.ts의
//     결정적 계산 함수(사칙연산 + 템플릿 문장)로만 만들어진다.
//
// ── 계약(Contract) ─────────────────────────────────────────────────────
// 입력:
//   1) 시험 결과(StudentExamResult — assessmentData.ts): 만점/획득점수/시험 메타
//   2) 오답 문항(WrongQuestionInfo[] — assessmentData.ts): 문항ID/번호/배점
//   3) 학생이 선택한 IF 이유(문항별, 아직 다 고르지 않아도 됨)
// 출력:
//   1) IF 요약(IfEngineSummary): 실제점수/IF점수/놓친점수/상승가능성 + 동기부여 문장
//   2) 사유별 비중(IfReasonBreakdownEntry[]): 계산실수/개념부족/시간부족 각각 문항수·점수
//   3) 예상 보완 포인트(IfEngineImprovementPoint): 가장 비중이 큰 사유 + 그에 맞는
//      다음 행동 제안 한 줄(다른 엔진이 그대로 상담 카드 등에 얹을 수 있는 짧은 텍스트)
//   4) 엠블럼/성장 엔진 연결용 이벤트(IfEngineGrowthEvent): GrowthContext.onIfAnalysisResult
//      가 그대로 받는 형태 — 이 엔진은 이벤트 "객체"만 만들고, 실제로 언제 발사할지
//      (오답 전체 회고 완료 시 1회)는 지금처럼 화면(StudentGrades.tsx)의 useEffect가 결정한다.
//      판단 로직 자체(레코드 저장/완료 여부 계산)는 studentIfRecord.saveIfRecord가 이미
//      전담하므로 여기서 다시 만들지 않는다.

import {
  IF_REASONS,
  calcIfAnalysis,
  getIfMotivationComment,
  calcIfAnalysisFromQuestions,
  getIfMotivationCommentFromQuestions,
  type IfReason,
  type IfAnalysisInput,
  type IfAnalysisResult,
  type IfQuestionEntry,
  type IfAnalysisQuestionResult,
  type IfReasonBreakdownEntry,
} from './studentIfAnalysis';
import {
  saveIfRecord,
  getIfRecordForExam,
  markIfRecordGrowthLinked,
  loadIfRecords,
  toGrowthIfFlags,
  getIfCumulativeSummary,
  type StudentIfRecord,
  type IfQuestionSelectionSaved,
  type IfCumulativeSummary,
} from './studentIfRecord';

// ─── 재노출(re-export) — 다른 엔진/화면은 이 파일 하나만 import하면 된다 ───────
// (studentIfAnalysis.ts / studentIfRecord.ts를 직접 import하지 않아도 되도록
//  계산·저장·조회 함수 전체를 이 엔진 경계에서 재노출한다.)
export {
  IF_REASONS,
  calcIfAnalysis,               // legacy fallback(문항별 데이터 없는 시험 전용)
  getIfMotivationComment,       // legacy fallback용 동기부여 문장
  calcIfAnalysisFromQuestions,
  getIfMotivationCommentFromQuestions,
  saveIfRecord,
  getIfRecordForExam,
  markIfRecordGrowthLinked,
  loadIfRecords,
  getIfCumulativeSummary,
};
export type {
  IfReason, IfAnalysisInput, IfAnalysisResult,
  IfQuestionEntry, IfAnalysisQuestionResult, IfReasonBreakdownEntry,
  StudentIfRecord, IfQuestionSelectionSaved, IfCumulativeSummary,
};

// ─── 예상 보완 포인트 ────────────────────────────────────────────────
export interface IfEngineImprovementPoint {
  topReason: IfReason | null;
  points: number;         // topReason으로 회복 가능한 점수
  suggestion: string;     // 다른 엔진(상담 브리핑 등)이 그대로 붙여 쓸 수 있는 한 줄 제안
}

const IMPROVEMENT_SUGGESTION: Record<IfReason, string> = {
  '계산 실수': '풀이 과정을 한 번 더 검산하는 습관을 우선 잡아주세요.',
  '개념 부족': '해당 단원 개념 복습을 다음 시험 전 우선순위로 두세요.',
  '시간 부족': '시간 배분 연습(단원평가 반복 풀이)을 우선 권장합니다.',
};

export function buildImprovementPoint(result: IfAnalysisQuestionResult): IfEngineImprovementPoint {
  if (!result.topReason) {
    return { topReason: null, points: 0, suggestion: '아직 IF 회고가 없어 보완 포인트를 계산할 수 없습니다.' };
  }
  const entry = result.reasonBreakdown[result.topReason];
  return {
    topReason: result.topReason,
    points: entry.points,
    suggestion: IMPROVEMENT_SUGGESTION[result.topReason],
  };
}

// ─── [Phase 3D v3-r10] 누적 IF 요약 → "최근 개선 포인트" 한 줄 ──────────────
// 목적: IF 결과가 학생의 성장 기록(성장 진열장)에 "보완 포인트"로 자연스럽게 이어지도록
// getIfCumulativeSummary(studentIfRecord.ts)의 누적 사유 비율을 사람이 읽는 한 줄로
// 변환한다. 외부 AI 호출 없이 IMPROVEMENT_SUGGESTION 템플릿만 재사용하는 결정적 함수다.
// 화면 컴포넌트(StudentGrowthShowcase 등)는 이 함수 하나만 호출하면 되고, 판단 로직을
// 컴포넌트 안에 직접 넣지 않아도 된다.
export function buildCumulativeImprovementNote(summary: IfCumulativeSummary): string | null {
  if (summary.totalRecordsAnalyzed === 0) return null;
  const top = summary.reasonRatios.find((r) => r.count > 0);
  if (!top) return null;
  const base = `최근 IF 회고 기준 "${top.reason}"으로 놓친 문제 비중이 가장 큽니다(${top.pct}%). `;
  return base + IMPROVEMENT_SUGGESTION[top.reason];
}

// ─── 성장 엔진 연결용 이벤트 ──────────────────────────────────────────
export interface IfEngineGrowthEvent {
  studentId: string;
  examId: string;
  ifFlags: {
    calculationError: boolean;
    conceptLack: boolean;
    timeShortage: boolean;
    carelessMistake: boolean;
  };
}

/** studentIfRecord의 완료 레코드로부터 GrowthContext.onIfAnalysisResult 입력 형식을 만든다. */
export function buildGrowthEvent(studentId: string, examId: string, record: StudentIfRecord): IfEngineGrowthEvent {
  return { studentId, examId, ifFlags: toGrowthIfFlags(record) };
}

// ─── 통합 엔진 출력 (단일 시험 기준) ──────────────────────────────────
export interface IfEngineOutput {
  result: IfAnalysisQuestionResult;
  motivationComment: string;
  improvementPoint: IfEngineImprovementPoint;
}

/**
 * 문항별 IF 데이터를 받아 요약/사유별비중/보완포인트를 한 번에 계산한다.
 * (화면 컴포넌트는 이 함수 하나만 호출하면 되고, 판단 로직을 컴포넌트 안에 직접
 * 넣지 않아도 된다 — StudentGrades.tsx의 IF 채점 블록이 이 계약을 그대로 따른다.)
 */
export function runIfAnalysisEngine(input: {
  examId: string;
  examTitle: string;
  actualScore: number;
  totalPoints: number;
  questions: IfQuestionEntry[];
}): IfEngineOutput {
  const result = calcIfAnalysisFromQuestions(input);
  return {
    result,
    motivationComment: getIfMotivationCommentFromQuestions(result),
    improvementPoint: buildImprovementPoint(result),
  };
}

// ─── 누적 IF 잠재력 추정 (교사 성장 요약 카드용) ───────────────────────
// 문항별 IF 레코드가 아직 없는 시험까지 포함한 "대략적" 상승 잠재력 추정치.
// 정식 문항별 분석이 있는 시험은 getIfCumulativeSummary(studentIfRecord.ts)의
// avgImprovementPct가 더 정확하므로, 그 값이 있으면 그쪽을 우선 사용해야 한다.
// 이 함수는 문항별 기록이 아예 없는 학생(신규 학생 등)을 위한 최소 fallback이다.
export function estimateIfPotentialFromAveragePct(avgAchievedPct: number | null, capPct = 20): number | null {
  if (avgAchievedPct === null) return null;
  return Math.max(0, Math.min(100 - avgAchievedPct, capPct));
}

// ─── 확장 방향 (Phase 3D v3-r9 기준, 구현 아님 — 계약만 미리 남겨둔다) ────
//
// 이 엔진은 아래 엔진들과 다음과 같이 연결될 예정이다. 지금은 구현하지 않고
// 인터페이스 경계만 명시한다(연결을 막지 않는 "열린" 구조 유지).
//
//  ┌─────────────────────┐   시험 템플릿/오답 문항 데이터 제공
//  │ Question Bank Engine │─────────────────────────────┐
//  └─────────────────────┘                              ▼
//  ┌─────────────────────┐   시험 정의/제출 데이터   ┌───────────────────┐
//  │ Test Template Engine │──────────────────────▶ │ Assessment Engine  │
//  └─────────────────────┘                          └─────────┬─────────┘
//                                                              │ StudentExamResult
//                                                              │ + WrongQuestionInfo[]
//                                                              ▼
//                                                    ┌───────────────────┐
//                                                    │ IF Analysis Engine │ ◀── 이 파일
//                                                    └─────────┬─────────┘
//                                        IfEngineGrowthEvent   │  IfEngineImprovementPoint
//                              ┌─────────────────────────────┬─┴───────────────────┐
//                              ▼                             ▼                     ▼
//                    ┌──────────────────┐        ┌──────────────────┐  ┌────────────────────┐
//                    │  Emblem Engine    │        │   Rival Engine    │  │ Parent Briefing     │
//                    │ (GrowthContext.   │        │ (GrowthContext.   │  │ Engine (이미 존재:   │
//                    │  onIfAnalysisResult)│      │  rivalWins 등)     │  │ studentBriefingEngine)│
//                    └──────────────────┘        └──────────────────┘  └────────────────────┘
//                                                                                  │
//                                                                                  ▼
//                                                                     ┌────────────────────┐
//                                                                     │ Recommendation Engine│
//                                                                     │ (universityAnalysis   │
//                                                                     │  Adapter — 불변 파일)  │
//                                                                     └────────────────────┘
//
// 각 엔진의 역할(요약):
//   - Question Bank Engine: 문제/보기/정답 원천 데이터 관리(아직 없음).
//   - Test Template Engine: 시험 구성(카테고리/문항 배치) 관리(아직 없음, TeacherExams 등이 임시 대행).
//   - Assessment Engine: 채점·제출 데이터의 단일 진실 소스(AssessmentContext가 사실상 이 역할).
//   - IF Analysis Engine: 이 파일 — 오답 회고 계산 + 성장 이벤트 생성.
//   - Emblem Engine: GrowthContext의 엠블럼 지급 로직(이미 존재, onIfAnalysisResult 소비).
//   - Rival Engine: GrowthContext의 라이벌 승패 로직(이미 존재).
//   - Parent Briefing Engine: studentBriefingEngine.ts(이미 존재) — IF 요약을 상담 카드에 반영.
//   - Recommendation Engine: universityAnalysisAdapter.ts(불변 파일) — IF 데이터를 직접
//     입력받지 않고, 실제내신/전국모의 등 공식 성적만 사용(IF는 학원 자체 시험 회고이므로
//     대학추천 계산에는 섞지 않는다 — 대학추천의 "성적"과 테스트의 "IF"는 서로 다른 데이터
//     계열임을 명확히 구분해야 한다).
