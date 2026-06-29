// AXIS LMS v1.2 — University Analysis Adapter Spec v1
//
// 목적: LMS 내부 데이터와 axis-university-analysis-engine-phase5.1 사이의
//       어댑터 명세(타입 + placeholder 함수)를 정의한다.
//
// ❌ 실제 엔진 import 금지
// ❌ 외부 LMS 파일 import 금지
// ❌ phase5.1 코드 직접 복사 금지
// ❌ 대학명 / 학과명 / 합격 가능성 / 추천 순위 타입 포함 금지
// ✅ 타입/문서/placeholder 수준 명세만
//
// 사용 예정:
//   - UniversityAnalysisInput은 StudentDetail.tsx 또는 별도 리포트 화면에서
//     LMS 데이터를 조합해 생성한 뒤, 엔진 연동 시 전달한다.
//   - 실제 변환 함수(buildUniversityAnalysisInput 등)는 엔진 연동 단계에서 구현한다.

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
 *
 * TODO: 실제 엔진 연동 시 getUniversityRecommendationReadiness() 결과를
 *       이 타입으로 변환하는 어댑터 함수로 교체한다.
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
 * UniversityAnalysisInput 어댑터 페이로드를 조립한다.
 *
 * TODO: 실제 엔진 연동 시 아래 파라미터를 LMS 컨텍스트 데이터에서
 *       직접 생성하는 로직으로 교체한다.
 *   - readiness: getUniversityRecommendationReadiness() 결과 변환
 *   - internalGrades: Student.internalScores 변환
 *   - mockSummaries: getMockAccumulationSummary() 결과 변환
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
