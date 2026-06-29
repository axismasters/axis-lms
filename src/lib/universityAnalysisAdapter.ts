// AXIS LMS v1.2 — University Analysis Adapter (Input Bridge v1)
//
// 목적: LMS 내부 데이터와 axis-university-analysis-engine-phase5.1 사이의
//       어댑터 명세(타입 + 변환 bridge 함수)를 정의한다.
//
// ❌ 실제 엔진(phase5.1) import 금지
// ❌ phase5.1 코드 직접 복사 금지
// ❌ 대학명 / 학과명 / 합격 가능성 / 추천 순위 타입 포함 금지
// ✅ Input Bridge v1: LMS 내부 타입 import 허용 (bridge 함수 전용)
// ✅ 타입 / 변환 helper / placeholder 수준 명세
//
// 사용 예정:
//   - adaptReadinessFromLms / adaptInternalGradesFromLms / adaptMockSummaryFromLms:
//     LMS 데이터를 어댑터 타입으로 변환해 safeAssembleUniversityAnalysisInput에 전달한다.
//   - safeAssembleUniversityAnalysisInput:
//     null/undefined 입력에도 안전하게 UniversityAnalysisInput을 조립한다.
//   - 실제 엔진 호출은 phase5.1 직접 통합 단계에서 별도 구현한다.

// ── LMS 내부 타입 import (Input Bridge v1에서만 허용) ──────
import type { InternalScore } from '@/lib/dummyData';
import type {
  UniversityRecommendationReadiness,
  MockAccumulationSummary,
} from '@/lib/assessmentData';

// ────────────────────────────────────────────────────────────
// 어댑터 상태 — 입력 데이터가 엔진을 실행하기에 충분한지 판단
// ────────────────────────────────────────────────────────────

/**
 * 어댑터 준비 상태.
 * - 'not-ready' : 필수 데이터(수능실전모의 또는 내신)가 전혀 없음
 * - 'partial'   : 일부 데이터가 있지만 충분하지 않음
 * - 'ready'     : 엔진 실행에 충분한 데이터 갖춤
 */
export type UniversityAnalysisAdapterStatus = 'not-ready' | 'partial' | 'ready';

// ────────────────────────────────────────────────────────────
// 내신 성적 스냅샷
// ────────────────────────────────────────────────────────────

/**
 * LMS의 Student.internalScores에서 추출한 내신 성적 스냅샷.
 * 엔진 입력에서 내신 계열 전형 분석에 사용될 예정이다.
 */
export interface UniversityAnalysisInternalGradeSnapshot {
  hasData: boolean;           // 내신 데이터 존재 여부
  latestYear?: string;        // 최근 학년도 (예: '2024')
  latestSemester?: string;    // 최근 학기 (예: '1학기')
  latestSubject?: string;     // 최근 과목
  latestRawScore?: number;    // 최근 원점수
  latestGrade?: number;       // 최근 등급 (1~9)
}

// ────────────────────────────────────────────────────────────
// 모의고사 / 수능실전모의 요약 스냅샷
// ────────────────────────────────────────────────────────────

/**
 * 특정 카테고리(mock-school / mock-suneung)에 대한 공개 결과 누적 요약.
 * getMockAccumulationSummary()의 결과를 어댑터 형태로 표현한다.
 */
export interface UniversityAnalysisMockSummary {
  categoryId: 'mock-suneung' | 'mock-school';
  rounds: number;              // 공개 응시 회차 수
  latestPct: number | null;    // 최근 회차 백분율 (0-100)
  bestPct: number | null;      // 최고 백분율
  avgPct: number | null;       // 전체 평균 백분율
  last3AvgPct: number | null;  // 최근 3회 평균 백분율
  firstToLastDelta: number | null; // 첫 회차 대비 점수 변화량
}

// ────────────────────────────────────────────────────────────
// 준비 상태 스냅샷
// ────────────────────────────────────────────────────────────

/**
 * getUniversityRecommendationReadiness() 결과를 어댑터 형태로 표현한다.
 * 어댑터 상태 판단(checkAdapterStatus)과 엔진 입력 조립에 사용한다.
 */
export interface UniversityAnalysisReadinessSnapshot {
  adapterStatus: UniversityAnalysisAdapterStatus;
  suneungRounds: number;      // mock-suneung 공개 응시 회차
  hasRecentScore: boolean;    // 최근 실전모의 점수 존재 여부
  hasCumulativeAvg: boolean;  // 누적 평균 산출 가능 여부 (2회 이상)
  hasLast3Avg: boolean;       // 최근 3회 평균 산출 가능 여부 (3회 이상)
  hasInternalGrades: boolean; // 내신 성적 데이터 존재 여부
  hasMockScores: boolean;     // 모의고사 데이터 존재 여부 (Student.mockExamScores 기준)
}

// ────────────────────────────────────────────────────────────
// 엔진 입력 타입 (메인 어댑터 인터페이스)
// ────────────────────────────────────────────────────────────

/**
 * axis-university-analysis-engine-phase5.1에 전달할 입력 페이로드 명세.
 *
 * 포함 항목:
 *   - 학생 식별 정보
 *   - 준비 상태 스냅샷
 *   - 내신 성적 스냅샷
 *   - 모의고사 카테고리별 요약 목록
 *
 * 명시적으로 포함하지 않는 항목:
 *   - 대학명 / 학과명 / 합격 가능성 / 추천 순위
 *   (이 항목들은 엔진 출력(output) 영역이며 이 어댑터 명세의 범위 밖이다)
 */
export interface UniversityAnalysisInput {
  studentId: string;
  studentName: string;
  readiness: UniversityAnalysisReadinessSnapshot;
  internalGrades: UniversityAnalysisInternalGradeSnapshot;
  /** mock-suneung / mock-school 각각 최대 1개씩, 데이터가 있는 카테고리만 포함 */
  mockSummaries: UniversityAnalysisMockSummary[];
  /** 어댑터 페이로드 생성 시각 (ISO 8601) */
  snapshotAt: string;
}

// ────────────────────────────────────────────────────────────
// 어댑터 상태 판단 헬퍼
// ────────────────────────────────────────────────────────────

/**
 * UniversityAnalysisReadinessSnapshot을 기반으로 어댑터 상태를 판단한다.
 *
 * 기준:
 * - 'ready'     : mock-suneung 3회 이상 + 내신 데이터 존재
 * - 'partial'   : mock-suneung 1회 이상 또는 내신 데이터 존재 (둘 다는 아님)
 * - 'not-ready' : 둘 다 없음
 */
export function checkAdapterStatus(
  snapshot: Pick<UniversityAnalysisReadinessSnapshot, 'suneungRounds' | 'hasInternalGrades' | 'hasMockScores'>,
): UniversityAnalysisAdapterStatus {
  const hasSuneung = snapshot.suneungRounds > 0;
  if (!hasSuneung && !snapshot.hasInternalGrades && !snapshot.hasMockScores) return 'not-ready';
  if (snapshot.suneungRounds >= 3 && snapshot.hasInternalGrades) return 'ready';
  return 'partial';
}

// ────────────────────────────────────────────────────────────
// 빈 스냅샷 팩토리 (placeholder)
// ────────────────────────────────────────────────────────────

/**
 * 데이터가 없는 빈 내신 스냅샷을 반환한다.
 * 학생에게 내신 데이터가 없는 경우의 기본값으로 사용한다.
 */
export function emptyInternalGradeSnapshot(): UniversityAnalysisInternalGradeSnapshot {
  return { hasData: false };
}

/**
 * 준비 상태 스냅샷 기본값을 반환한다.
 * 아직 readiness 계산이 수행되지 않은 경우의 placeholder.
 */
export function emptyReadinessSnapshot(): UniversityAnalysisReadinessSnapshot {
  return {
    adapterStatus: 'not-ready',
    suneungRounds: 0,
    hasRecentScore: false,
    hasCumulativeAvg: false,
    hasLast3Avg: false,
    hasInternalGrades: false,
    hasMockScores: false,
  };
}

/**
 * UniversityAnalysisInput 어댑터 페이로드를 조립한다. (Spec v1 placeholder — 유지)
 *
 * 실제 LMS 데이터에서 안전하게 조립할 때는 safeAssembleUniversityAnalysisInput을 사용한다.
 */
export function buildUniversityAnalysisInput(
  studentId: string,
  studentName: string,
  readiness: UniversityAnalysisReadinessSnapshot,
  internalGrades: UniversityAnalysisInternalGradeSnapshot,
  mockSummaries: UniversityAnalysisMockSummary[],
): UniversityAnalysisInput {
  return {
    studentId,
    studentName,
    readiness,
    internalGrades,
    mockSummaries,
    snapshotAt: new Date().toISOString(),
  };
}

// ────────────────────────────────────────────────────────────
// Input Bridge v1 — LMS 데이터 → 어댑터 타입 변환 헬퍼
// ────────────────────────────────────────────────────────────

/**
 * LMS UniversityRecommendationReadiness → UniversityAnalysisReadinessSnapshot 변환.
 *
 * assessmentData.ts의 getUniversityRecommendationReadiness() 반환값과
 * 학생 레코드에서 파생한 두 boolean 플래그를 받아 어댑터 스냅샷을 만든다.
 *
 * @param r              getUniversityRecommendationReadiness() 결과
 * @param hasInternalGrades Student.internalScores.length > 0 여부
 * @param hasMockScores     Student.mockExamScores.length > 0 여부
 */
export function adaptReadinessFromLms(
  r: UniversityRecommendationReadiness,
  hasInternalGrades: boolean,
  hasMockScores: boolean,
): UniversityAnalysisReadinessSnapshot {
  const partial: Omit<UniversityAnalysisReadinessSnapshot, 'adapterStatus'> = {
    suneungRounds:    r.suneungRounds,
    hasRecentScore:   r.hasRecentScore,
    hasCumulativeAvg: r.hasCumulativeAvg,
    hasLast3Avg:      r.hasLast3Avg,
    hasInternalGrades,
    hasMockScores,
  };
  return { ...partial, adapterStatus: checkAdapterStatus(partial) };
}

/**
 * Student.internalScores → UniversityAnalysisInternalGradeSnapshot 변환.
 *
 * 내신 성적이 없으면 emptyInternalGradeSnapshot()을 반환한다.
 * 가장 최신 기록은 학년도(year) 내림차순 → 학기(semester) 내림차순 기준으로 결정한다.
 *
 * @param scores Student.internalScores 배열 (빈 배열 안전)
 */
export function adaptInternalGradesFromLms(
  scores: InternalScore[],
): UniversityAnalysisInternalGradeSnapshot {
  if (scores.length === 0) return emptyInternalGradeSnapshot();

  // year 내림차순 → semester 내림차순 ('2학기' > '1학기' 사전 순)
  const sorted = [...scores].sort((a, b) => {
    const yCmp = b.year.localeCompare(a.year);
    if (yCmp !== 0) return yCmp;
    return b.semester.localeCompare(a.semester);
  });
  const latest = sorted[0];

  return {
    hasData:        true,
    latestYear:     latest.year,
    latestSemester: latest.semester,
    latestSubject:  latest.subject,
    latestRawScore: latest.rawScore,
    latestGrade:    latest.grade,
  };
}

/**
 * getMockAccumulationSummary() 결과 → UniversityAnalysisMockSummary 변환.
 *
 * getMockAccumulationSummary는 오름차순 정렬된 StudentExamResult[]를 받으므로,
 * 호출 전 결과를 오름차순(examDate asc)으로 정렬해서 전달해야 한다.
 * rounds === 0인 경우(응시 기록 없음)도 안전하게 처리한다.
 *
 * @param categoryId  'mock-suneung' | 'mock-school'
 * @param summary     getMockAccumulationSummary() 반환값
 */
export function adaptMockSummaryFromLms(
  categoryId: 'mock-suneung' | 'mock-school',
  summary: MockAccumulationSummary,
): UniversityAnalysisMockSummary {
  return {
    categoryId,
    rounds:           summary.totalRounds,
    latestPct:        summary.latestPct,
    bestPct:          summary.bestPct,
    avgPct:           summary.avgPct,
    last3AvgPct:      summary.last3AvgPct,
    firstToLastDelta: summary.firstToLastDelta,
  };
}

/**
 * null/undefined 입력에도 안전하게 UniversityAnalysisInput을 조립한다.
 *
 * - readiness / internalGrades 가 null 또는 undefined 이면 empty 기본값으로 대체한다.
 * - mockSummaries 가 null 또는 undefined 이면 빈 배열로 대체한다.
 * - studentId / studentName 은 trim() 처리 후 그대로 사용한다.
 * - snapshotAt 은 호출 시각의 ISO 8601 문자열로 생성한다.
 *
 * 실제 호출 흐름 예시 (엔진 연동 단계에서 구현):
 *   const readiness = adaptReadinessFromLms(lmsReadiness, hasInternal, hasMock);
 *   const grades    = adaptInternalGradesFromLms(student.internalScores);
 *   const suneung   = adaptMockSummaryFromLms('mock-suneung', suneungSummary);
 *   const input     = safeAssembleUniversityAnalysisInput(
 *                       student.id, student.name, readiness, grades, [suneung],
 *                     );
 *
 * @param studentId      학생 ID
 * @param studentName    학생 이름
 * @param readiness      UniversityAnalysisReadinessSnapshot (nullable)
 * @param internalGrades UniversityAnalysisInternalGradeSnapshot (nullable)
 * @param mockSummaries  UniversityAnalysisMockSummary[] (nullable)
 */
export function safeAssembleUniversityAnalysisInput(
  studentId: string,
  studentName: string,
  readiness?: UniversityAnalysisReadinessSnapshot | null,
  internalGrades?: UniversityAnalysisInternalGradeSnapshot | null,
  mockSummaries?: UniversityAnalysisMockSummary[] | null,
): UniversityAnalysisInput {
  return {
    studentId:     studentId.trim(),
    studentName:   studentName.trim(),
    readiness:     readiness     ?? emptyReadinessSnapshot(),
    internalGrades: internalGrades ?? emptyInternalGradeSnapshot(),
    mockSummaries: mockSummaries  ?? [],
    snapshotAt:    new Date().toISOString(),
  };
}

// ────────────────────────────────────────────────────────────
// Data Quality Bridge v1 — 입력 품질 판단 헬퍼
// ────────────────────────────────────────────────────────────

/**
 * UniversityAnalysisInput에서 누락되거나 불충분한 항목을 식별하는 태그 타입.
 *
 * - 'no-internal-grades'          : 내신 성적이 전혀 없음
 * - 'no-suneung-results'          : 수능실전모의 응시 기록이 없음
 * - 'insufficient-suneung-rounds' : 수능실전모의가 1~2회로 3회 미만
 * - 'no-mock-summaries'           : 모의고사 요약(mock-suneung/mock-school) 없음
 */
export type UniversityAnalysisMissingField =
  | 'no-internal-grades'
  | 'no-suneung-results'
  | 'insufficient-suneung-rounds'
  | 'no-mock-summaries';

/**
 * UniversityAnalysisInput 품질 평가 결과.
 *
 * 실제 추천 계산 결과를 포함하지 않으며,
 * 엔진에 전달하기 전 입력 데이터의 충분성을 점검하는 용도로만 사용한다.
 */
export interface UniversityAnalysisInputQuality {
  /**
   * 전반적인 입력 상태 — input.readiness.adapterStatus 와 동일.
   * Quality 객체만으로 전체 상태를 판단할 수 있도록 포함한다.
   */
  overallStatus: UniversityAnalysisAdapterStatus;
  /** 누락되거나 불충분한 항목 목록 (없으면 빈 배열) */
  missingFields: UniversityAnalysisMissingField[];
  /** 사람이 읽을 수 있는 경고 메시지 목록 — 한국어, 없으면 빈 배열 */
  warnings: string[];
}

/**
 * UniversityAnalysisInput을 검사해 입력 품질 평가 결과를 반환한다.
 *
 * 판단 기준:
 * - 내신 성적 없음           → 'no-internal-grades'
 * - 수능실전모의 0회          → 'no-suneung-results'
 * - 수능실전모의 1~2회        → 'insufficient-suneung-rounds'
 * - 모의고사 요약 목록 없음   → 'no-mock-summaries'
 *
 * 반환값에는 대학명 / 합격 가능성 / 추천 순위가 포함되지 않는다.
 *
 * @param input safeAssembleUniversityAnalysisInput() 결과
 */
export function getUniversityAnalysisInputQuality(
  input: UniversityAnalysisInput,
): UniversityAnalysisInputQuality {
  const missingFields: UniversityAnalysisMissingField[] = [];
  const warnings: string[] = [];

  if (!input.internalGrades.hasData) {
    missingFields.push('no-internal-grades');
    warnings.push('내신 성적이 입력되지 않았습니다.');
  }

  if (input.readiness.suneungRounds === 0) {
    missingFields.push('no-suneung-results');
    warnings.push('수능실전모의 데이터가 없습니다.');
  } else if (input.readiness.suneungRounds < 3) {
    missingFields.push('insufficient-suneung-rounds');
    warnings.push(
      `수능실전모의가 ${input.readiness.suneungRounds}회입니다. 3회 이상이면 누적 평균 산출이 가능합니다.`,
    );
  }

  if (input.mockSummaries.length === 0) {
    missingFields.push('no-mock-summaries');
    warnings.push('모의고사 요약 데이터가 없습니다.');
  }

  return {
    overallStatus: input.readiness.adapterStatus,
    missingFields,
    warnings,
  };
}

/**
 * UniversityAnalysisInput에서 누락/불충분 항목 목록만 반환하는 편의 함수.
 *
 * getUniversityAnalysisInputQuality(input).missingFields 의 단축 형태다.
 *
 * @param input safeAssembleUniversityAnalysisInput() 결과
 */
export function getMissingUniversityAnalysisFields(
  input: UniversityAnalysisInput,
): UniversityAnalysisMissingField[] {
  return getUniversityAnalysisInputQuality(input).missingFields;
}

// ────────────────────────────────────────────────────────────
// Payload Preview Bridge v1 — 엔진 전달 전 payload 요약 미리보기
// ────────────────────────────────────────────────────────────

/**
 * 실제 엔진 호출 전에 확인할 수 있는 payload 요약 미리보기 타입.
 *
 * UniversityAnalysisInput과 품질 평가 결과를 한 객체로 압축한다.
 * 대학명 / 합격 가능성 / 추천 순위는 포함하지 않으며,
 * 입력 데이터의 상태·항목 수·경고만 담는다.
 */
export interface UniversityAnalysisPayloadPreview {
  /** 학생 식별 정보 */
  studentId: string;
  studentName: string;
  /** 어댑터 입력 상태 (input.readiness.adapterStatus와 동일) */
  adapterStatus: UniversityAnalysisAdapterStatus;
  /** 내신 데이터 존재 여부 */
  hasInternalGrades: boolean;
  /** 수능실전모의 공개 응시 회차 */
  suneungRounds: number;
  /** 포함된 모의 요약 카테고리 수 (0~2: mock-suneung / mock-school) */
  mockSummaryCount: number;
  /** 누락/불충분 항목 목록 */
  missingFields: UniversityAnalysisMissingField[];
  /** 사람이 읽을 수 있는 경고 목록 */
  warnings: string[];
  /** 원본 페이로드(UniversityAnalysisInput)의 snapshotAt 그대로 전달 */
  snapshotAt: string;
}

/**
 * UniversityAnalysisInput과 품질 평가 결과를 합쳐
 * UniversityAnalysisPayloadPreview를 생성한다.
 *
 * - 내부에서 getUniversityAnalysisInputQuality()를 호출해 missingFields / warnings를 채운다.
 * - snapshotAt은 원본 input의 값을 그대로 유지한다.
 * - 반환값에 대학명 / 합격 가능성 / 추천 순위가 포함되지 않는다.
 *
 * 사용 흐름 예시:
 *   const input   = safeAssembleUniversityAnalysisInput(...);
 *   const preview = buildUniversityAnalysisPayloadPreview(input);
 *   // preview.adapterStatus, preview.warnings 로 UI에 입력 구성 상태 표시
 *
 * @param input safeAssembleUniversityAnalysisInput() 결과
 */
export function buildUniversityAnalysisPayloadPreview(
  input: UniversityAnalysisInput,
): UniversityAnalysisPayloadPreview {
  const quality = getUniversityAnalysisInputQuality(input);
  return {
    studentId:        input.studentId,
    studentName:      input.studentName,
    adapterStatus:    quality.overallStatus,
    hasInternalGrades: input.internalGrades.hasData,
    suneungRounds:    input.readiness.suneungRounds,
    mockSummaryCount: input.mockSummaries.length,
    missingFields:    quality.missingFields,
    warnings:         quality.warnings,
    snapshotAt:       input.snapshotAt,
  };
}

// ────────────────────────────────────────────────────────────
// Handoff Gate Bridge v1 — 엔진 연동 준비 가능 여부 판단
// ────────────────────────────────────────────────────────────

/**
 * 엔진 연동 준비 가능 여부 상태.
 *
 * - 'ready'      : 입력 데이터가 충분해 연동 준비 조건을 충족한 상태
 * - 'needs-data' : 일부 데이터가 있으나 보완이 필요한 상태
 * - 'blocked'    : 필수 데이터가 없어 연동 준비를 시작할 수 없는 상태
 */
export type UniversityAnalysisHandoffGateStatus = 'blocked' | 'needs-data' | 'ready';

/**
 * 엔진 연동 준비 가능 여부 판단 결과.
 *
 * 실제 엔진 실행 / 대학명 / 합격 가능성 / 추천 순위를 포함하지 않으며,
 * 연동 준비 조건을 충족했는지만 판단한다.
 */
export interface UniversityAnalysisHandoffGate {
  /** 연동 준비 가능 여부 상태 */
  status: UniversityAnalysisHandoffGateStatus;
  /**
   * 엔진 연동 준비 조건을 충족한 상태인지.
   * status === 'ready' 일 때만 true.
   */
  canPrepareHandoff: boolean;
  /** 상태 판단 근거 — 한국어 목록. 준비 완료 시 확인 메시지, 아닐 경우 보완 안내 */
  reasons: string[];
  /** 원본 payload preview의 missingFields 그대로 전달 */
  missingFields: UniversityAnalysisMissingField[];
  /** 원본 payload preview의 snapshotAt 그대로 전달 */
  snapshotAt: string;
}

/**
 * UniversityAnalysisPayloadPreview를 기반으로 엔진 연동 준비 가능 여부를 판단한다.
 *
 * status 판단 기준:
 * - adapterStatus === 'ready'     → 'ready'      (canPrepareHandoff: true)
 * - adapterStatus === 'partial'   → 'needs-data' (canPrepareHandoff: false)
 * - adapterStatus === 'not-ready' → 'blocked'    (canPrepareHandoff: false)
 *
 * reasons:
 * - 'ready' 시: 확인 메시지 1건
 * - 그 외: preview.warnings를 그대로 전달
 *
 * 반환값에 대학명 / 합격 가능성 / 추천 순위가 포함되지 않는다.
 *
 * @param preview buildUniversityAnalysisPayloadPreview() 결과
 */
export function getUniversityAnalysisHandoffGate(
  preview: UniversityAnalysisPayloadPreview,
): UniversityAnalysisHandoffGate {
  let status: UniversityAnalysisHandoffGateStatus;
  if (preview.adapterStatus === 'ready') {
    status = 'ready';
  } else if (preview.adapterStatus === 'partial') {
    status = 'needs-data';
  } else {
    status = 'blocked';
  }

  const canPrepareHandoff = status === 'ready';

  const reasons: string[] =
    status === 'ready'
      ? ['내신 성적과 수능실전모의 데이터가 충분합니다.']
      : [...preview.warnings];

  return {
    status,
    canPrepareHandoff,
    reasons,
    missingFields: preview.missingFields,
    snapshotAt:    preview.snapshotAt,
  };
}

// ────────────────────────────────────────────────────────────
// Request Draft Adapter Spec v1 — Phase 5.1 AnalyzeRequest draft
// ────────────────────────────────────────────────────────────

/**
 * Phase 5.1 AnalyzeRequest.gradeLevel 대응 draft 타입.
 * 실제 Phase 5.1 계약은 1 | 2 | 3 숫자 학년을 사용한다.
 */
export type Phase51GradeLevel = 1 | 2 | 3;

/**
 * Phase 5.1 AnalyzeRequest.track 대응 draft 타입.
 * 실제 Phase 5.1 계약은 "인문" | "자연" | "통합"을 사용한다.
 */
export type Phase51Track = '인문' | '자연' | '통합';

export type Phase51KoreanSubjectType = '화작' | '언매';
export type Phase51MathSubjectType = '확통' | '미적분' | '기하';
export type Phase51InquiryArea = '사탐' | '과탐' | '직탐';

/**
 * Phase 5.1 SchoolRecordInput 대응 draft 타입.
 *
 * 실제 계약:
 * - avgGrade / koreanGrade / mathGrade 는 number | null
 * - note 는 선택 필드
 */
export interface Phase51SchoolRecordInputDraft {
  avgGrade: number | null;
  koreanGrade: number | null;
  mathGrade: number | null;
  note?: string;
}

/**
 * Phase 5.1 MockExamRecord 대응 draft 타입.
 *
 * 실제 Phase 5.1 계약은 koreanPercentile, mathPercentile, englishGrade,
 * inquiry1Percentile을 필수로 요구한다. 다만 LMS 준비 단계에서는 아직
 * 과목별 원자료가 부족할 수 있으므로 draft에서는 null을 허용해
 * 부족 항목을 명시적으로 표현한다.
 */
export interface Phase51MockExamRecordDraft {
  examLabel: string;
  year: number;
  koreanStdScore?: number;
  koreanPercentile: number | null;
  koreanGrade?: number;
  koreanSubjectType?: Phase51KoreanSubjectType;
  mathStdScore?: number;
  mathPercentile: number | null;
  mathGrade?: number;
  mathSubjectType?: Phase51MathSubjectType;
  englishGrade: number | null;
  inquiry1Name?: string;
  inquiry1Area?: Phase51InquiryArea;
  inquiry1StdScore?: number;
  inquiry1Percentile: number | null;
  inquiry1Grade?: number;
  inquiry2Name?: string;
  inquiry2Area?: Phase51InquiryArea;
  inquiry2StdScore?: number;
  inquiry2Percentile?: number | null;
  inquiry2Grade?: number;
  koreanHistoryGrade?: number;
}

/**
 * Phase 5.1 TargetUniversityInput 대응 draft 타입.
 *
 * 이 값은 추천 결과가 아니라 사용자가 분석 대상으로 지정한 목표대학 입력이다.
 * 실제 추천 대학/학과 산출은 이 draft의 범위가 아니다.
 */
export interface Phase51TargetUniversityInputDraft {
  univId: string;
  univName: string;
  deptName: string;
}

/**
 * Phase 5.1 ImprovementScenarioInput 대응 draft 타입.
 */
export interface Phase51ImprovementScenarioInputDraft {
  mathStdScoreDelta?: number;
  mathPercentileDelta?: number;
  mathGradeUp?: number;
}

/**
 * Phase 5.1 AnalyzeRequest 대응 LMS 내부 draft 타입.
 *
 * 실제 Phase 5.1 타입을 import하지 않고, API_CONTRACT.md / src/api/types.ts
 * 기준으로 LMS 내부에서만 사용하는 draft 계약을 정의한다.
 *
 * gradeLevel / track 은 실제 계약과 동일한 값으로만 채울 수 있지만,
 * 현재 LMS adapter에는 아직 이 정보가 없으므로 null을 허용한다.
 */
export interface Phase51AnalyzeRequestDraft {
  studentId: string;
  studentName: string;
  gradeLevel: Phase51GradeLevel | null;
  track: Phase51Track | null;
  schoolRecord: Phase51SchoolRecordInputDraft | null;
  mockExamRecords: Phase51MockExamRecordDraft[];
  targetUniversities: Phase51TargetUniversityInputDraft[];
  improvementScenario?: Phase51ImprovementScenarioInputDraft;
  draftCreatedAt: string;
  sourceAdapterSnapshotAt: string;
}

/**
 * UniversityAnalysisInput에서 Phase51AnalyzeRequestDraft의 골격을 조립한다.
 *
 * 이 함수는 Phase 5.1 직접 통합 전 placeholder다.
 * 현재 UniversityAnalysisInput만으로는 gradeLevel, track, 과목별 mockExamRecords,
 * targetUniversities를 만들 수 없으므로 null 또는 빈 배열로 둔다.
 *
 * Phase 5.1 직접 통합 전 별도 bridge에서 Student.internalScores 전체,
 * Student.mockExamScores 과목별 원자료, 목표대학 선택값을 받아 보강해야 한다.
 */
export function buildPhase51AnalyzeRequestDraft(
  input: UniversityAnalysisInput,
): Phase51AnalyzeRequestDraft {
  return {
    studentId:                input.studentId,
    studentName:              input.studentName,
    gradeLevel:               null,
    track:                    null,
    schoolRecord:             null,
    mockExamRecords:          [],
    targetUniversities:       [],
    draftCreatedAt:           new Date().toISOString(),
    sourceAdapterSnapshotAt:  input.snapshotAt,
  };
}
