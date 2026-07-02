// AXIS LMS v1.2 — Phase 3D v3-r15: 내신 대비 운영 가이드 엔진(Exam Prep Guide Engine) 타입
//
// ⚠ 절대 규칙(지시서 §3 그대로):
//   - AI가 계산하지 않는다 — 이 파일이 정의하는 구조는 전부 examPrepGuideEngine.ts의
//     규칙 기반 순수 함수가 채운다. AI API 호출(fetch 기반 요약/추천 등)은 포함하지 않는다.
//   - 문제은행은 이번 MVP에서 실제 연결하지 않는다 — recommendedProblemSetIds /
//     levelPolicy / questionBankReady는 추후 연동을 위한 placeholder 필드로만 존재한다.
//   - 자동 생성 결과는 선생님이 확인/수정/승인해야 한다 — status가 'approved'가 되기
//     전까지는 어떤 화면(학생/보호자 포함)에도 노출하지 않는다. 이번 MVP는 애초에
//     시험/성적관리(관리자·교사) 화면에만 붙으며 학생/보호자 화면에는 이 데이터를
//     연결하지 않는다(§ Opinion for Lead Developer 참고).

// ────────────────────────────────────────────────────────────
// 입력 — 지시서 §4-2 필수 입력값 그대로
// ────────────────────────────────────────────────────────────
export interface ExamPrepGuideInput {
  school: string;                    // 학교
  grade: string;                     // 학년
  className: string;                 // 반
  examName: string;                  // 시험명
  examDate: string;                  // 시험일 (YYYY-MM-DD)
  examScope: string;                 // 시험범위
  supplementaryBookName: string;     // 부교재명
  supplementaryBookScope: string;    // 부교재 범위
  weeklySessionCount: number;        // 주당 수업 횟수
  actualRemainingSessions: number;   // 실제 남은 수업 회차 — 날짜 기반 추정치보다 이 값을 신뢰한다(휴원일/보강 반영은 선생님 몫).
  teacherInCharge: string;           // 담당 선생님
  assessmentMethod: string;          // 평가 방식(자유 서술 — 예: "객관식+서술형 혼합, 30문항")
  supplementCriteria: string;        // 보충 기준(자유 서술 — 예: "70점 미만 대상 보충")
}

export function emptyExamPrepGuideInput(seed?: Partial<ExamPrepGuideInput>): ExamPrepGuideInput {
  return {
    school: '',
    grade: '',
    className: '',
    examName: '',
    examDate: '',
    examScope: '',
    supplementaryBookName: '',
    supplementaryBookScope: '',
    weeklySessionCount: 2,
    actualRemainingSessions: 0,
    teacherInCharge: '',
    assessmentMethod: '',
    supplementCriteria: '',
    ...seed,
  };
}

// ────────────────────────────────────────────────────────────
// 산출 — 지시서 §4-3 계산 항목 + §4-4 화면 구성에 대응
// ────────────────────────────────────────────────────────────

/** 회차별 진도 계획표의 한 행. phase가 그 회차의 성격(진도/평가/실전모의/오답보완/최종복습)을 나타낸다. */
export type ExamPrepSessionPhase = 'progress' | 'assessment' | 'mockExam' | 'wrongAnswerReview' | 'finalReview';

export interface ExamPrepGuideSessionPlanItem {
  sessionNo: number;          // 회차(1..N)
  estimatedDate: string;      // 회차 예상일(YYYY-MM-DD) — 비례 배분 추정치(§Opinion 참고, 실제 반 시간표 미연동)
  phase: ExamPrepSessionPhase;
  focus: string;              // 이 회차의 진도/활동 내용(자동 생성 초안 — 선생님이 자유롭게 수정)
}

export interface ExamPrepGuideHomeworkPlanItem {
  sessionNo: number;
  description: string;        // 숙제 배치 내용(자동 생성 초안 — 선생님이 자유롭게 수정)
}

/** 회차 구간(시작~끝) — 평가/실전모의/오답보완/최종복습처럼 특정 구간에 걸치는 일정에 사용 */
export interface ExamPrepSessionRange {
  startSessionNo: number;
  endSessionNo: number;
  startDate: string;
  endDate: string;
}

export interface ExamPrepGuideMilestone {
  label: string;    // 예: "부교재 완료 목표일", "실전모의고사"
  date: string;      // YYYY-MM-DD
  note?: string;
}

export interface ExamPrepGuideSchedule {
  generatedAt: string;                 // 생성 시각(ISO)
  daysUntilExam: number;                // 시험일까지 남은 일수
  weeksUntilExam: number;               // 시험일까지 남은 주차
  totalRemainingSessions: number;       // 남은 수업 횟수(= actualRemainingSessions 그대로 신뢰)
  estimatedSessionsByDate: number;      // 주당 수업 횟수 × 남은 주차로 추정한 참고치(교차검증용)

  progressPlan: ExamPrepGuideSessionPlanItem[];   // 회차별 진도 계획표(전체 N회차)
  homeworkPlan: ExamPrepGuideHomeworkPlanItem[];  // 숙제 배치 계획

  supplementaryBookTargetDate: string | null;     // 부교재 완료 목표일
  assessmentSessions: number[];                    // 평가 배치 회차 목록
  mockExamSession: number | null;                  // 실전모의 배치 회차(없으면 null)
  wrongAnswerReviewPeriod: ExamPrepSessionRange | null;  // 오답 보완 기간
  finalReviewPeriod: ExamPrepSessionRange | null;        // 최종 복습 기간

  milestones: ExamPrepGuideMilestone[];  // 위 계산 결과를 날짜순으로 모아 요약 표시하는 용도
  warnings: string[];                    // 입력값 부족/모순에 대한 경고(예: 남은 회차 과소, 날짜 역전)
}

// ────────────────────────────────────────────────────────────
// 저장 레코드 — 시험(Exam) 1건당 최대 1개(examPrepGuideStore.ts가 examId로 관리)
// ────────────────────────────────────────────────────────────
export type ExamPrepGuideStatus = 'draft' | 'generated' | 'approved';

export interface ExamPrepGuideRecord {
  id: string;
  examId: string;             // 연결된 시험(Exam.id) — 시험/성적관리 밖에서 독립적으로 존재하지 않는다.
  input: ExamPrepGuideInput;
  schedule: ExamPrepGuideSchedule | null;   // '자동 생성' 전에는 null
  // 마지막으로 '자동 생성'을 실행했을 때의 입력값 스냅샷 — 현재 input과 다르면(JSON 비교)
  // 화면에서 "입력값이 바뀌었습니다 — 다시 생성해주세요" 경고를 띄우는 데 쓴다(재생성 강제는
  // 하지 않는다 — 선생님이 검토 후 판단하도록 경고만 표시).
  generatedFromInput: ExamPrepGuideInput | null;
  status: ExamPrepGuideStatus;

  // ─── 문제은행 연동 placeholder(§4-7) — 이번 MVP에서는 실제 연결하지 않는다 ───
  recommendedProblemSetIds: string[];  // 항상 빈 배열(실제 추천 로직 없음)
  levelPolicy: string | null;          // 항상 null(정책 필드만 예약)
  questionBankReady: false;            // 항상 false — 문제은행 준비 여부를 나타내는 향후 플래그

  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export function newDraftExamPrepGuide(examId: string, input: ExamPrepGuideInput, createdBy: string): ExamPrepGuideRecord {
  const now = new Date().toISOString();
  return {
    id: `epg-${examId}-${Date.now()}`,
    examId,
    input,
    schedule: null,
    generatedFromInput: null,
    status: 'draft',
    recommendedProblemSetIds: [],
    levelPolicy: null,
    questionBankReady: false,
    createdBy,
    createdAt: now,
  };
}

// ────────────────────────────────────────────────────────────
// 화면 표기 라벨
// ────────────────────────────────────────────────────────────
export const EXAM_PREP_GUIDE_STATUS_LABEL: Record<ExamPrepGuideStatus, string> = {
  draft: '초안',
  generated: '자동 생성됨 (검토 필요)',
  approved: '승인 완료',
};

export const EXAM_PREP_SESSION_PHASE_LABEL: Record<ExamPrepSessionPhase, string> = {
  progress: '진도',
  assessment: '평가',
  mockExam: '실전모의',
  wrongAnswerReview: '오답 보완',
  finalReview: '최종 복습',
};
