// AXIS LMS v1.2 - 성적관리(Assessment Engine) 데이터 구조
// 시험 종류는 고정 union이 아니라 카탈로그(EXAM_CATEGORIES) 구조로 두어, 추후 무제한 생성 가능하게 한다.
// 채점은 문항 단위 혼합 채점(자동/수동)을 기본으로 하며, 성적 수정은 직접 수정이 아니라
// "정정(correction)" 처리 구조로 이력을 남긴다.
//
// 이번 단계 범위: 시험관리/성적관리 MVP(관리자 화면). 문제은행 연동, 실제 AI 분석,
// Notification Engine 실제 API 연동, 재무관리 연결, 학생/보호자 화면은 포함하지 않는다.

// ────────────────────────────────────────────────────────────
// 시험 종류 카탈로그 — 고정 union이 아닌 배열 구조로 추후 무제한 생성 가능하게 한다.
// ────────────────────────────────────────────────────────────
export interface ExamCategoryDef {
  id: string;
  label: string;
}

export const EXAM_CATEGORIES: ExamCategoryDef[] = [
  { id: 'entrance-test', label: '입학테스트' },
  { id: 'unit-eval', label: '단원평가' },
  { id: 'certification', label: '인증평가' },
  { id: 'mock-school', label: '내신대비모의고사' },
  { id: 'mock-suneung', label: '수능실전모의고사' },
];

export function categoryLabel(categoryId: string): string {
  return EXAM_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

// ────────────────────────────────────────────────────────────
// 문항 — 문항 단위 혼합 채점(자동/수동)을 위한 타입 구분
// ────────────────────────────────────────────────────────────
export type QuestionType = '객관식' | 'OX' | '단답형' | '서술형' | '증명형' | '풀이형';

export const AUTO_GRADED_TYPES: QuestionType[] = ['객관식', 'OX', '단답형'];
export const MANUAL_GRADED_TYPES: QuestionType[] = ['서술형', '증명형', '풀이형'];

export function isAutoGraded(type: QuestionType): boolean {
  return AUTO_GRADED_TYPES.includes(type);
}

export interface ExamQuestionDef {
  id: string;
  no: number;              // 문항 번호
  type: QuestionType;
  points: number;          // 배점
  correctAnswer?: string;  // 자동채점 대상(객관식/OX/단답형)의 정답. 수동채점 문항은 비워둔다.
}

// ────────────────────────────────────────────────────────────
// 시험
// ────────────────────────────────────────────────────────────
export type ExamStatus = '준비중' | '응시중' | '채점중' | '공개완료';

export interface Exam {
  id: string;
  title: string;
  categoryId: string;     // EXAM_CATEGORIES 참조(string — 카탈로그가 늘어나도 타입 변경 불필요)
  classId?: string;       // 특정 반 대상이면 반 id, 비우면 학원 전체 대상
  subject?: string;       // 과목명(예: '수학', '영어', '국어') — classId가 없는 학원 전체 시험에서 명시적으로 사용
  examDate: string;       // YYYY-MM-DD
  totalScore: number;     // 만점(문항 배점 합)
  questions: ExamQuestionDef[];
  status: ExamStatus;
  createdBy: string;
  createdAt: string;
  publishedBy?: string;
  publishedAt?: string;
}

// ────────────────────────────────────────────────────────────
// 응시자별 답안/채점 — 문항 단위로 자동/수동 채점 결과를 함께 보관한다.
// ────────────────────────────────────────────────────────────
export interface AnswerRecord {
  questionId: string;
  studentAnswer?: string;  // 학생 제출 답안(자동채점 문항은 이 값을 정답과 비교해 자동 판정)
  isCorrect?: boolean;     // 정오(자동채점은 시스템이, 수동채점은 채점자가 결정)
  score?: number;          // 문항별 획득 점수. 미입력(undefined)이면 아직 채점 전.
  gradedBy?: string;       // 채점자 — 자동채점 문항은 'SYSTEM'
  gradedAt?: string;
}

export type SubmissionStatus = '응시예정' | '결석' | '채점중' | '채점완료';

// 정정 처리 이력 — 채점완료 후 점수를 바꿀 때는 값을 직접 덮어쓰지 않고 이 이력을 남긴다.
export interface ScoreCorrectionLog {
  id: string;
  questionId?: string;     // 특정 문항 정정이면 문항 id, 총점 단위 정정이면 undefined
  previousScore: number;
  newScore: number;
  reason: string;          // 정정 사유(필수)
  correctedBy: string;
  correctedAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  status: SubmissionStatus;
  answers: AnswerRecord[];
  totalScore?: number;             // 모든 문항 채점 완료 시 합산 점수
  corrections: ScoreCorrectionLog[]; // 정정 이력(비어있으면 정정된 적 없음)
  teacherNote?: string;            // 강사 채점 코멘트 (강사 포털 채점 시 입력)
}

// 응시자(submission)가 채점 완료 상태인지 판별 — 공개 가능 여부 판단에 사용
// 문항별 채점 경로: answers.every(a.score !== undefined)
// 강사 총점 직접 채점 경로: status='채점완료' && totalScore !== undefined
// 결석: 항상 처리 완료 취급
export function isSubmissionGraded(sub: ExamSubmission): boolean {
  if (sub.status === '결석') return true; // 결석은 채점 대상 자체가 없으므로 "처리 완료" 취급
  // 강사 총점 직접 채점(gradeSubmissionByTeacher): 문항별 breakdown 없이 totalScore가 확정되면 완료
  if (sub.status === '채점완료' && sub.totalScore !== undefined) return true;
  // 기존 문항별 채점 경로
  return sub.answers.every((a) => a.score !== undefined);
}

// 시험 전체가 공개 가능한 상태인지 — 미채점 응시자가 한 명이라도 있으면 공개 불가(AXIS 확정 정책)
export function canPublishExam(submissions: ExamSubmission[]): boolean {
  if (submissions.length === 0) return false;
  return submissions.every(isSubmissionGraded);
}

// ────────────────────────────────────────────────────────────
// 반 단위 시험 / 학원 전체 시험의 공개(반영) 흐름 분리
// ────────────────────────────────────────────────────────────
// AXIS 확정 기준: 반 단위 시험(classId 있음)은 채점 완료되면 별도 "공개" 액션 없이 내부적으로
// 성적조회에 반영 가능하다. 학원 전체 시험(classId 없음)만 명시적 "공개" 버튼을 거쳐야 하고,
// 미채점 인원이 있으면 공개할 수 없다.
//
// AXIS 확정 기준(시험 상태 관리 축소): 관리자가 직접 운영하는 상태("준비중/응시중/채점중") 개념은
// 화면에서 제거하고, 공개 여부(publishedAt/publishedBy)와 채점 완료 여부로만 판단한다.
// Exam.status 필드 자체(ExamStatus)는 더미 시드 호환을 위해 남겨두지만, 화면(AssessmentList.tsx/
// AssessmentDetail.tsx)에서는 이 필드를 직접 노출하지 않고 아래 파생 함수만 사용한다.

export function isAcademyWideExam(exam: Pick<Exam, 'classId'>): boolean {
  return !exam.classId;
}

// 이 시험이 "공개" 액션 자체를 필요로 하는지 — 학원 전체 시험만 해당한다.
export function requiresPublishAction(exam: Pick<Exam, 'classId'>): boolean {
  return isAcademyWideExam(exam);
}

// 화면에 보여줄 파생 진행 단계 — 상태 카드/필터를 대체한다.
export type ExamPhase = '미채점 있음' | '채점 완료' | '공개 완료';

export function getExamPhase(exam: Pick<Exam, 'classId' | 'publishedAt'>, submissions: ExamSubmission[]): ExamPhase {
  const allGraded = canPublishExam(submissions);
  if (isAcademyWideExam(exam)) {
    if (exam.publishedAt) return '공개 완료';
    return allGraded ? '채점 완료' : '미채점 있음';
  }
  // 반 단위 시험: "채점 완료" = 반영 가능 상태(별도 공개 절차 없음)이므로 '공개 완료'라는 표현 대신
  // '채점 완료'까지만 표시한다(반 단위 시험에는 "공개"라는 개념 자체가 없다).
  return allGraded ? '채점 완료' : '미채점 있음';
}

// 이 시험의 이 학생 결과를 학생 상세 성적조회 탭에 노출해도 되는지 판단.
// 결석/미채점이면 항상 false. 반 단위 시험은 채점 완료 시 true. 학원 전체 시험은 공개(publishedAt) 후에만 true.
export function isResultVisibleForStudent(exam: Pick<Exam, 'classId' | 'publishedAt'>, submission: ExamSubmission): boolean {
  if (submission.status === '결석') return false;
  if (submission.totalScore === undefined) return false;
  if (isAcademyWideExam(exam)) return !!exam.publishedAt;
  return true; // 반 단위 시험은 채점 완료(totalScore 확정) 시 즉시 반영 가능
}

// 문항별 자동채점 적용 — 자동채점 대상 문항에 한해 studentAnswer를 correctAnswer와 비교해 점수를 매긴다.
// 수동채점 문항(서술형/증명형/풀이형)은 건드리지 않는다(채점자가 별도로 score를 입력해야 함).
export function applyAutoGrading(sub: ExamSubmission, questions: ExamQuestionDef[]): ExamSubmission {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const answers = sub.answers.map((a) => {
    const q = qMap.get(a.questionId);
    if (!q || !isAutoGraded(q.type)) return a; // 수동채점 문항은 그대로 둔다
    const trimmed = (a.studentAnswer ?? '').trim();
    if (!trimmed) {
      // 답안이 비어 있거나(미응답) 입력했던 답안을 지운 경우 — 이전에 매겨졌던 점수/정오/채점자 정보가
      // 그대로 남아있으면 안 되므로 명확히 정리한다(자동채점 답안 삭제 시 점수 잔존 버그 수정).
      return { questionId: a.questionId, studentAnswer: undefined, score: undefined, isCorrect: undefined, gradedBy: undefined, gradedAt: undefined };
    }
    const correct = trimmed === (q.correctAnswer ?? '').trim();
    return { ...a, studentAnswer: trimmed, isCorrect: correct, score: correct ? q.points : 0, gradedBy: 'SYSTEM', gradedAt: new Date().toISOString() };
  });
  return { ...sub, answers };
}

// 모든 문항이 채점되었으면 총점을 합산한다(부분 채점 상태에서는 totalScore를 매기지 않음 — 미채점 인원 판별과 일관성 유지)
// 결석은 "처리 완료"로 취급되어 isSubmissionGraded()가 true를 반환하지만, 결석 학생의 점수는
// 성적 계산(평균/최고/최저, 학생 성적조회 반영)에서 항상 제외되어야 하므로 totalScore를 명확히
// undefined로 둔다(이전에는 결석으로 바뀌기 전 채점된 answers.score가 그대로 합산되어 totalScore에
// 남는 문제가 있었다 — 결석 처리 시 점수 잔존 버그).
export function recalcTotalScore(sub: ExamSubmission): ExamSubmission {
  if (sub.status === '결석') return { ...sub, totalScore: undefined };

  // 강사 총점 직접 채점 경로 보호:
  // 문항별 채점이 완료되지 않았지만 status='채점완료'이고 totalScore가 직접 지정된 경우,
  // answers 합산으로 totalScore를 덮어쓰지 않는다.
  // 문항별 채점이 모두 완료되면 아래 regular path에서 answers 합산으로 자연히 교체된다.
  const allAnswersGraded = sub.answers.length > 0 && sub.answers.every(a => a.score !== undefined);
  if (!allAnswersGraded && sub.status === '채점완료' && sub.totalScore !== undefined) {
    return sub; // 강사 직접 채점 totalScore 보존
  }

  const graded = isSubmissionGraded(sub);
  if (!graded) return { ...sub, totalScore: undefined };
  const total = sub.answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
  return { ...sub, totalScore: total };
}

// ────────────────────────────────────────────────────────────
// 학생 상세 성적조회 탭 반영용 — StudentDetail.tsx가 이 함수만 호출해서 사용한다.
// ────────────────────────────────────────────────────────────
export interface StudentExamResult {
  examId: string;
  title: string;
  categoryId: string;     // EXAM_CATEGORIES 참조 — 호출부에서 카테고리별 자동 분류에 사용
  examDate: string;
  totalPoints: number;    // 만점
  earnedScore: number;    // 획득 점수(totalScore — isResultVisibleForStudent를 통과했으므로 항상 number)
  classId?: string;
}

// exams/submissions 전체에서 특정 학생에게 "지금 보여줘도 되는" 결과만 추려서 반환한다.
// isResultVisibleForStudent()가 공개되지 않은(학원 전체 시험의 공개 전) 결과와 결석/미채점 결과를
// 걸러내므로, 이 함수가 반환하는 목록은 항상 안전하게 그대로 화면에 표시할 수 있다.
export function getPublishedResultsForStudent(exams: Exam[], submissions: ExamSubmission[], studentId: string): StudentExamResult[] {
  const results: StudentExamResult[] = [];
  exams.forEach((exam) => {
    const sub = submissions.find((s) => s.examId === exam.id && s.studentId === studentId);
    if (!sub) return;
    if (!isResultVisibleForStudent(exam, sub)) return;
    results.push({
      examId: exam.id,
      title: exam.title,
      categoryId: exam.categoryId,
      examDate: exam.examDate,
      totalPoints: exam.totalScore,
      earnedScore: sub.totalScore!, // isResultVisibleForStudent가 undefined가 아님을 보장
      classId: exam.classId,
    });
  });
  return results.sort((a, b) => b.examDate.localeCompare(a.examDate));
}

// ────────────────────────────────────────────────────────────
// 수능실전 주간 루틴 누적 요약 헬퍼 — Senior Mock Accumulation Bridge v1
// StudentWeeklyMocks / ParentWeeklyMocks 화면에서 사용한다.
// 대학추천 / 등급 / 백분위 / 표준점수는 포함하지 않는다.
// ────────────────────────────────────────────────────────────
export interface MockAccumulationSummary {
  totalRounds: number;          // 응시 회차 수
  latestPct: number | null;     // 최근 점수 (백분율)
  bestPct: number | null;       // 최고 점수 (백분율)
  avgPct: number | null;        // 전체 평균 점수 (백분율)
  last3AvgPct: number | null;   // 최근 3회 평균 (백분율)
  firstToLastDelta: number | null; // 첫 회차 대비 점수 변화량 (점수 단위)
}

/**
 * results: mock-suneung 카테고리로 필터된 뒤 examDate 오름차순 정렬된 목록을 전달한다.
 * (StudentWeeklyMocks / ParentWeeklyMocks의 weeklyResults 배열을 그대로 사용)
 */
export function getMockAccumulationSummary(results: StudentExamResult[]): MockAccumulationSummary {
  if (results.length === 0) {
    return { totalRounds: 0, latestPct: null, bestPct: null, avgPct: null, last3AvgPct: null, firstToLastDelta: null };
  }

  const pcts = results.map((r) =>
    r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0
  );
  const last3 = pcts.slice(-3);
  const first = results[0];
  const latest = results[results.length - 1];

  return {
    totalRounds: results.length,
    latestPct: pcts[pcts.length - 1],
    bestPct: Math.max(...pcts),
    avgPct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    last3AvgPct: Math.round(last3.reduce((a, b) => a + b, 0) / last3.length),
    firstToLastDelta: latest.earnedScore - first.earnedScore,
  };
}

// ────────────────────────────────────────────────────────────
// 더미 데이터
// ────────────────────────────────────────────────────────────
function q(no: number, type: QuestionType, points: number, correctAnswer?: string): ExamQuestionDef {
  return { id: `q-${no}-${Math.random().toString(36).slice(2, 7)}`, no, type, points, correctAnswer };
}

// 더미 시험 1: 단원평가(cls-001 대상, 채점완료·공개완료) — 정상적으로 공개까지 마친 사례
const exam1Questions: ExamQuestionDef[] = [
  q(1, '객관식', 10, '3'),
  q(2, '객관식', 10, '1'),
  q(3, 'OX', 10, 'O'),
  q(4, '단답형', 10, '12'),
  q(5, '서술형', 20),
];

// 더미 시험 2: 입학테스트(학원 전체 대상, 채점중) — 일부만 채점되어 "미채점 인원 있어 공개 불가" 시연
const exam2Questions: ExamQuestionDef[] = [
  q(1, '객관식', 20, '2'),
  q(2, '객관식', 20, '4'),
  q(3, '단답형', 20, '36'),
  q(4, '풀이형', 40),
];

// 더미 시험 3: 수능실전모의고사(학원 전체 대상, 준비중) — 아직 응시 전
const exam3Questions: ExamQuestionDef[] = [
  q(1, '객관식', 25, '1'),
  q(2, '객관식', 25, '3'),
  q(3, '증명형', 50),
];

// 더미 시험 4: 내신대비모의고사 (학원 전체, 공개완료) — Mock Exam Result Foundation v1
const exam4Questions: ExamQuestionDef[] = [
  q(1, '객관식', 25, '2'),
  q(2, '객관식', 25, '3'),
  q(3, '객관식', 25, '1'),
  q(4, '객관식', 25, '4'),
];

// 더미 시험 5: 수능실전모의고사 (학원 전체, 공개완료) — Mock Exam Result Foundation v1
const exam5Questions: ExamQuestionDef[] = [
  q(1, '객관식', 20, '3'),
  q(2, '객관식', 20, '1'),
  q(3, '객관식', 20, '4'),
  q(4, '객관식', 20, '2'),
  q(5, '객관식', 20, '3'),
];

// 더미 시험 6~8: 고3 수능실전 주간 루틴 (공개완료) — Senior Weekly Mock Routine Foundation v1
// 매주 같은 형식, 점수 추이 시연용 (stu-001 상승 추이)
const weeklyMockQuestions: ExamQuestionDef[] = [
  q(1, '객관식', 20, '1'),
  q(2, '객관식', 20, '2'),
  q(3, '객관식', 20, '3'),
  q(4, '객관식', 20, '4'),
  q(5, '객관식', 20, '1'),
];

export const DUMMY_EXAMS: Exam[] = [
  {
    id: 'exam-001',
    title: '1학기 1차 단원평가 (수학)',
    categoryId: 'unit-eval',
    classId: 'cls-001',
    subject: '수학',
    examDate: '2024-05-20',
    totalScore: exam1Questions.reduce((s, q) => s + q.points, 0),
    questions: exam1Questions,
    status: '채점중', // 반 단위 시험은 "공개" 개념이 없다 — 전원 채점완료 시 별도 액션 없이 성적조회에 반영된다(getExamPhase가 파생 판단).
    createdBy: '한태준',
    createdAt: '2024-05-10T10:00:00',
  },
  {
    id: 'exam-002',
    title: '2024 신입생 입학테스트',
    categoryId: 'entrance-test',
    classId: undefined,
    subject: '수학',
    examDate: '2024-06-15',
    totalScore: exam2Questions.reduce((s, q) => s + q.points, 0),
    questions: exam2Questions,
    status: '채점중',
    createdBy: '한태준',
    createdAt: '2024-06-01T09:00:00',
  },
  {
    id: 'exam-003',
    title: '6월 수능실전모의고사',
    categoryId: 'mock-suneung',
    classId: undefined,
    subject: '수학',
    examDate: '2024-06-28',
    totalScore: exam3Questions.reduce((s, q) => s + q.points, 0),
    questions: exam3Questions,
    status: '준비중',
    createdBy: '원장님',
    createdAt: '2024-06-20T11:00:00',
  },
  // exam-004: 내신대비모의고사 (학원 전체, 공개완료) — Mock Exam Result Foundation v1
  {
    id: 'exam-004',
    title: '3월 전국연합 대비 내신모의고사 (수학)',
    categoryId: 'mock-school',
    classId: undefined,
    subject: '수학',
    examDate: '2024-03-15',
    totalScore: exam4Questions.reduce((s, q) => s + q.points, 0),
    questions: exam4Questions,
    status: '공개완료',
    createdBy: '원장님',
    createdAt: '2024-03-01T09:00:00',
    publishedBy: '원장님',
    publishedAt: '2024-03-20T14:00:00',
  },
  // exam-005: 수능실전모의고사 (학원 전체, 공개완료) — Mock Exam Result Foundation v1
  {
    id: 'exam-005',
    title: '4월 수능실전모의고사 (수학)',
    categoryId: 'mock-suneung',
    classId: undefined,
    subject: '수학',
    examDate: '2024-04-20',
    totalScore: exam5Questions.reduce((s, q) => s + q.points, 0),
    questions: exam5Questions,
    status: '공개완료',
    createdBy: '한태준',
    createdAt: '2024-04-05T09:00:00',
    publishedBy: '한태준',
    publishedAt: '2024-04-25T16:00:00',
  },
  // exam-006~008: 고3 수능실전 주간 루틴 (공개완료) — Senior Weekly Mock Routine Foundation v1
  {
    id: 'exam-006',
    title: '고3 수능실전 1주차',
    categoryId: 'mock-suneung',
    classId: undefined,
    subject: '수학',
    examDate: '2024-03-02',
    totalScore: weeklyMockQuestions.reduce((s, q) => s + q.points, 0),
    questions: weeklyMockQuestions,
    status: '공개완료',
    createdBy: '한태준',
    createdAt: '2024-02-25T09:00:00',
    publishedBy: '한태준',
    publishedAt: '2024-03-04T15:00:00',
  },
  {
    id: 'exam-007',
    title: '고3 수능실전 2주차',
    categoryId: 'mock-suneung',
    classId: undefined,
    subject: '수학',
    examDate: '2024-03-09',
    totalScore: weeklyMockQuestions.reduce((s, q) => s + q.points, 0),
    questions: weeklyMockQuestions,
    status: '공개완료',
    createdBy: '한태준',
    createdAt: '2024-03-04T09:00:00',
    publishedBy: '한태준',
    publishedAt: '2024-03-11T15:00:00',
  },
  {
    id: 'exam-008',
    title: '고3 수능실전 3주차',
    categoryId: 'mock-suneung',
    classId: undefined,
    subject: '수학',
    examDate: '2024-03-16',
    totalScore: weeklyMockQuestions.reduce((s, q) => s + q.points, 0),
    questions: weeklyMockQuestions,
    status: '공개완료',
    createdBy: '한태준',
    createdAt: '2024-03-11T09:00:00',
    publishedBy: '한태준',
    publishedAt: '2024-03-18T15:00:00',
  },
];

// 더미 응시자/채점 데이터 — Exam.classId가 있으면 그 반 수강생, 없으면 학원 전체 재원생 일부를 대상으로 한다.
// (실제 화면에서는 ClassContext.getClassStudents()/StudentContext.students로 동적 매칭하지만,
//  더미 시드는 고정 학생 id를 사용해 결과가 항상 같게 만든다.)
function makeGradedAnswers(qs: ExamQuestionDef[], score: 'high' | 'mid' | 'low'): AnswerRecord[] {
  return qs.map((qq) => {
    const ratio = score === 'high' ? 1 : score === 'mid' ? 0.6 : 0.3;
    const earned = Math.round(qq.points * ratio);
    return {
      questionId: qq.id,
      studentAnswer: isAutoGraded(qq.type) ? (qq.correctAnswer ?? '') : undefined,
      isCorrect: earned >= qq.points * 0.99,
      score: earned,
      gradedBy: isAutoGraded(qq.type) ? 'SYSTEM' : '김민준',
      gradedAt: '2024-05-21T15:00:00',
    };
  });
}

const RAW_SUBMISSIONS: ExamSubmission[] = [
  // exam-001 (cls-001, 공개완료) — 전원 채점완료
  { id: 'sub-001', examId: 'exam-001', studentId: 'stu-001', status: '채점완료', answers: makeGradedAnswers(exam1Questions, 'high'), totalScore: undefined, corrections: [] },
  { id: 'sub-002', examId: 'exam-001', studentId: 'stu-002', status: '채점완료', answers: makeGradedAnswers(exam1Questions, 'mid'), totalScore: undefined, corrections: [] },
  { id: 'sub-003', examId: 'exam-001', studentId: 'stu-003', status: '채점완료', answers: makeGradedAnswers(exam1Questions, 'low'), totalScore: undefined, corrections: [] },

  // exam-002 (학원 전체, 채점중) — 일부만 채점 완료, 일부는 미채점(자동채점 문항만 채점되고 풀이형은 비어있음)
  {
    id: 'sub-004', examId: 'exam-002', studentId: 'stu-001', status: '채점중',
    answers: [
      { questionId: exam2Questions[0].id, studentAnswer: '2', isCorrect: true, score: 20, gradedBy: 'SYSTEM', gradedAt: '2024-06-16T10:00:00' },
      { questionId: exam2Questions[1].id, studentAnswer: '3', isCorrect: false, score: 0, gradedBy: 'SYSTEM', gradedAt: '2024-06-16T10:00:00' },
      { questionId: exam2Questions[2].id, studentAnswer: '36', isCorrect: true, score: 20, gradedBy: 'SYSTEM', gradedAt: '2024-06-16T10:00:00' },
      { questionId: exam2Questions[3].id }, // 풀이형 — 아직 미채점
    ],
    totalScore: undefined,
    corrections: [],
  },
  {
    id: 'sub-005', examId: 'exam-002', studentId: 'stu-005', status: '채점완료',
    answers: [
      { questionId: exam2Questions[0].id, studentAnswer: '2', isCorrect: true, score: 20, gradedBy: 'SYSTEM', gradedAt: '2024-06-16T10:00:00' },
      { questionId: exam2Questions[1].id, studentAnswer: '4', isCorrect: true, score: 20, gradedBy: 'SYSTEM', gradedAt: '2024-06-16T10:00:00' },
      { questionId: exam2Questions[2].id, studentAnswer: '40', isCorrect: false, score: 0, gradedBy: 'SYSTEM', gradedAt: '2024-06-16T10:00:00' },
      { questionId: exam2Questions[3].id, score: 32, gradedBy: '이서연', gradedAt: '2024-06-18T11:00:00' },
    ],
    totalScore: undefined,
    corrections: [],
  },
  { id: 'sub-006', examId: 'exam-002', studentId: 'stu-006', status: '응시예정', answers: exam2Questions.map((qq) => ({ questionId: qq.id })), totalScore: undefined, corrections: [] },

  // exam-003 (준비중) — 응시 전이라 제출 데이터 없음(응시예정 상태만)
  { id: 'sub-007', examId: 'exam-003', studentId: 'stu-001', status: '응시예정', answers: exam3Questions.map((qq) => ({ questionId: qq.id })), totalScore: undefined, corrections: [] },
  { id: 'sub-008', examId: 'exam-003', studentId: 'stu-002', status: '응시예정', answers: exam3Questions.map((qq) => ({ questionId: qq.id })), totalScore: undefined, corrections: [] },

  // exam-004 (내신대비모의고사, 공개완료) — Mock Exam Result Foundation v1
  { id: 'sub-009', examId: 'exam-004', studentId: 'stu-001', status: '채점완료', answers: makeGradedAnswers(exam4Questions, 'high'), totalScore: undefined, corrections: [] },
  { id: 'sub-010', examId: 'exam-004', studentId: 'stu-002', status: '채점완료', answers: makeGradedAnswers(exam4Questions, 'mid'),  totalScore: undefined, corrections: [] },
  { id: 'sub-011', examId: 'exam-004', studentId: 'stu-003', status: '채점완료', answers: makeGradedAnswers(exam4Questions, 'low'),  totalScore: undefined, corrections: [] },

  // exam-005 (수능실전모의고사, 공개완료) — Mock Exam Result Foundation v1
  { id: 'sub-012', examId: 'exam-005', studentId: 'stu-001', status: '채점완료', answers: makeGradedAnswers(exam5Questions, 'mid'),  totalScore: undefined, corrections: [] },
  { id: 'sub-013', examId: 'exam-005', studentId: 'stu-002', status: '채점완료', answers: makeGradedAnswers(exam5Questions, 'high'), totalScore: undefined, corrections: [] },
  { id: 'sub-014', examId: 'exam-005', studentId: 'stu-003', status: '채점완료', answers: makeGradedAnswers(exam5Questions, 'low'),  totalScore: undefined, corrections: [] },

  // exam-006 (고3 수능실전 1주차, 공개완료) — Senior Weekly Mock Routine Foundation v1
  // stu-001: 저점수 → 이후 상승 추이 시연
  { id: 'sub-015', examId: 'exam-006', studentId: 'stu-001', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'low'),  totalScore: undefined, corrections: [] },
  { id: 'sub-016', examId: 'exam-006', studentId: 'stu-002', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'high'), totalScore: undefined, corrections: [] },
  { id: 'sub-017', examId: 'exam-006', studentId: 'stu-003', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'mid'),  totalScore: undefined, corrections: [] },

  // exam-007 (고3 수능실전 2주차, 공개완료)
  { id: 'sub-018', examId: 'exam-007', studentId: 'stu-001', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'mid'),  totalScore: undefined, corrections: [] },
  { id: 'sub-019', examId: 'exam-007', studentId: 'stu-002', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'mid'),  totalScore: undefined, corrections: [] },
  { id: 'sub-020', examId: 'exam-007', studentId: 'stu-003', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'mid'),  totalScore: undefined, corrections: [] },

  // exam-008 (고3 수능실전 3주차, 공개완료)
  { id: 'sub-021', examId: 'exam-008', studentId: 'stu-001', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'high'), totalScore: undefined, corrections: [] },
  { id: 'sub-022', examId: 'exam-008', studentId: 'stu-002', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'low'),  totalScore: undefined, corrections: [] },
  { id: 'sub-023', examId: 'exam-008', studentId: 'stu-003', status: '채점완료', answers: makeGradedAnswers(weeklyMockQuestions, 'high'), totalScore: undefined, corrections: [] },
];

export const DUMMY_SUBMISSIONS: ExamSubmission[] = RAW_SUBMISSIONS.map((sub) => recalcTotalScore(sub));
