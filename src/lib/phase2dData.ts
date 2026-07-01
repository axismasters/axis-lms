// AXIS LMS v1.2 — Phase 2D: Student Academic Results Restructure
// 학생 성적 화면 재구조화 데이터 레이어
//
// 시험 유형 분류:
//   기존 AssessmentContext 데이터 (unit-eval, certification, mock-school, mock-suneung)
//   + Phase 2D 신규 데이터 (school-record, national-mock)
//   실제내신성적(school-record)/전국모의고사(national-mock)는 문항 기반 Exam이 아니라
//   teacherSchoolRecordInput.ts/teacherMockExamInput.ts의 "성적 입력" 자료를 그대로
//   학생 성적 탭에 반영한 것이며, AssessmentFormModal(시험지 생성)의 대상이 아니다.
//   [교사 화면 시험 구조 정리] weekly-suneung(수능실전주간루틴)은 실제 시험 데이터가
//   없던 미사용 카테고리라 제거했다 — "수능실전 주간 루틴"은 mock-suneung 결과를
//   회차순으로 누적 조회하는 별도 화면(StudentWeeklyMocks.tsx 등)일 뿐, 시험 종류가 아니다.
//
// 학생 화면 숨김 정책:
//   - entrance-test (입학테스트): 학생 화면 완전 숨김
//   - 관리자 화면은 기존 그대로 유지

// ─── 학생 화면 숨김 카테고리 ───────────────────────────────────────
export const STUDENT_HIDDEN_CATEGORY_IDS = ['entrance-test'] as const;
export type StudentHiddenCategoryId = typeof STUDENT_HIDDEN_CATEGORY_IDS[number];

export function isHiddenFromStudent(categoryId: string): boolean {
  return (STUDENT_HIDDEN_CATEGORY_IDS as readonly string[]).includes(categoryId);
}

// ─── 탭 구조 정의 ────────────────────────────────────────────────────
export interface GradeTab {
  id: string;
  label: string;
  description: string;
  categoryIds: string[];    // 이 탭에 속하는 categoryId 목록
  color: string;
  accentColor: string;
}

export const GRADE_TABS: GradeTab[] = [
  {
    id: 'academy',
    label: '학원평가',
    description: '단원평가, 인증평가 등 학원 내부 평가 결과',
    categoryIds: ['unit-eval', 'certification'],
    color: 'oklch(0.511 0.262 276.966)',
    accentColor: '#EEF2FF',
  },
  {
    id: 'school-prep',
    label: '내신대비',
    description: '내신 시험 대비 학원 모의고사 결과',
    categoryIds: ['mock-school'],
    color: 'oklch(0.45 0.15 160)',
    accentColor: '#D1FAE5',
  },
  {
    id: 'school-record',
    label: '실제내신',
    description: '학교 중간/기말 시험 실제 성적',
    categoryIds: ['school-record'],
    color: 'oklch(0.55 0.15 80)',
    accentColor: '#FEF3C7',
  },
  {
    id: 'national',
    label: '전국모의',
    description: '전국연합, 학평, 교육청, 평가원 모의고사',
    categoryIds: ['national-mock'],
    color: 'oklch(0.55 0.2 27)',
    accentColor: '#FEE2E2',
  },
  {
    id: 'suneung',
    label: '수능실전',
    description: '학원 수능실전모의고사',
    categoryIds: ['mock-suneung'],
    color: '#7C3AED',
    accentColor: '#EDE9FE',
  },
];

// ─── 시험 유형 분류표 ─────────────────────────────────────────────────
export interface ExamTypeInfo {
  categoryId: string;
  label: string;
  tabId: string;
  showToStudent: boolean;
  description: string;
}

export const EXAM_TYPE_MAP: ExamTypeInfo[] = [
  { categoryId: 'unit-eval',      label: '단원평가',        tabId: 'academy',       showToStudent: true,  description: '학원 단원별 내부 평가' },
  { categoryId: 'certification',  label: '인증평가',        tabId: 'academy',       showToStudent: true,  description: '학원 수준 인증 평가' },
  { categoryId: 'mock-school',    label: '내신대비모의고사', tabId: 'school-prep',  showToStudent: true,  description: '학교 시험 대비 학원 모의고사' },
  { categoryId: 'school-record',  label: '실제내신',        tabId: 'school-record', showToStudent: true,  description: '학교 중간/기말 실제 성적' },
  { categoryId: 'national-mock',  label: '전국모의고사',    tabId: 'national',      showToStudent: true,  description: '전국연합/학평/교육청/평가원' },
  { categoryId: 'mock-suneung',   label: '수능실전모의',    tabId: 'suneung',       showToStudent: true,  description: '학원 수능실전모의고사' },
  { categoryId: 'entrance-test',  label: '입학테스트',      tabId: '',              showToStudent: false, description: '배치/상담/진단용 내부 자료 — 학생 화면 미표시' },
];

export function getExamTypeInfo(categoryId: string): ExamTypeInfo | undefined {
  return EXAM_TYPE_MAP.find(t => t.categoryId === categoryId);
}

export function getTabForCategory(categoryId: string): GradeTab | undefined {
  return GRADE_TABS.find(tab => tab.categoryIds.includes(categoryId));
}

// ─── 등급/성취도 계산 ─────────────────────────────────────────────────
export function getAcademyGrade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'A (최우수)', color: '#059669' };
  if (pct >= 80) return { label: 'B (우수)',   color: '#0284C7' };
  if (pct >= 70) return { label: 'C (양호)',   color: '#CA8A04' };
  if (pct >= 60) return { label: 'D (미흡)',   color: '#EA580C' };
  return              { label: 'E (노력 요함)', color: '#DC2626' };
}

export function getNationalGrade(percentile: number): number {
  if (percentile >= 96) return 1;
  if (percentile >= 89) return 2;
  if (percentile >= 77) return 3;
  if (percentile >= 60) return 4;
  if (percentile >= 40) return 5;
  if (percentile >= 23) return 6;
  if (percentile >= 11) return 7;
  if (percentile >= 4)  return 8;
  return 9;
}

export function getPerformanceComment(myScore: number, totalPoints: number, classAvg: number): string {
  const pct = totalPoints > 0 ? Math.round((myScore / totalPoints) * 100) : 0;
  const diff = Math.round(myScore - classAvg);
  if (diff > 15) return `평균보다 ${diff}점 높습니다. 매우 우수한 결과입니다!`;
  if (diff > 5)  return `평균보다 ${diff}점 높습니다. 우수한 성취입니다.`;
  if (diff >= -5) return `평균 수준의 성취입니다. 꾸준한 노력이 필요합니다.`;
  if (diff >= -15) return `평균보다 ${Math.abs(diff)}점 낮습니다. 복습이 필요한 단원을 확인해보세요.`;
  return `평균보다 ${Math.abs(diff)}점 낮습니다. 학원 상담을 통해 개선 계획을 세워보세요.`;
}

export function getSchoolGradeLabel(grade: number): string {
  const labels: Record<number, string> = {
    1: '1등급', 2: '2등급', 3: '3등급', 4: '4등급', 5: '5등급',
    6: '6등급', 7: '7등급', 8: '8등급', 9: '9등급',
  };
  return labels[grade] ?? `${grade}등급`;
}

export function getSchoolGradeColor(grade: number): string {
  if (grade <= 2) return '#059669';
  if (grade <= 4) return '#0284C7';
  if (grade <= 6) return '#CA8A04';
  return '#DC2626';
}

// ─── Phase 2D 신규 데이터 타입 ──────────────────────────────────────────

// 실제 내신 성적 (학교 공식 성적)
export interface SchoolRecord {
  id: string;
  studentId: string;
  title: string;             // "2024년 1학기 중간고사"
  semester: string;          // "2024-1"
  examType: '중간' | '기말';
  subject: string;
  rawScore: number;          // 원점수
  maxScore: number;          // 만점
  classAverage: number;      // 반 평균
  classMax: number;          // 반 최고점
  totalStudents: number;     // 응시 인원
  myRank: number;            // 내 등수
  grade: number;             // 등급 (1-9)
  achievementLevel: '수' | '우' | '미' | '양' | '가';
  recordedAt: string;
}

// 전국 단위 모의고사 결과
export interface NationalMockResult {
  id: string;
  studentId: string;
  title: string;             // "2024년 3월 전국연합학력평가"
  examDate: string;
  organizer: string;         // "교육청" | "평가원"
  subject: string;
  rawScore: number;
  maxScore: number;
  standardScore: number;     // 표준점수
  percentile: number;        // 백분위
  grade: number;             // 등급 (1-9)
  // ─── Phase 2E-1 추가 필드 ─────────────────────────────────────────
  averageScore?: number;     // 전국 평균 원점수
  highestScore?: number;     // 전국 최고 원점수 (=만점)
  participantCount?: number; // 응시인원
  myRank?: number;           // 내 등수 (표준점수 기준 상위)
}

// ─── Phase 2D Mock 데이터 ────────────────────────────────────────────────
// stu-001 기준 데이터 (학생 포털 DEV 데모용)

export const PHASE2D_SCHOOL_RECORDS: SchoolRecord[] = [
  {
    id: 'sr-001',
    studentId: 'stu-001',
    title: '2024학년도 1학기 중간고사',
    semester: '2024-1',
    examType: '중간',
    subject: '수학',
    rawScore: 88,
    maxScore: 100,
    classAverage: 70.3,
    classMax: 98,
    totalStudents: 28,
    myRank: 5,
    grade: 2,
    achievementLevel: '우',
    recordedAt: '2024-05-10',
  },
  {
    id: 'sr-002',
    studentId: 'stu-001',
    title: '2024학년도 1학기 기말고사',
    semester: '2024-1',
    examType: '기말',
    subject: '수학',
    rawScore: 91,
    maxScore: 100,
    classAverage: 72.8,
    classMax: 96,
    totalStudents: 28,
    myRank: 4,
    grade: 2,
    achievementLevel: '수',
    recordedAt: '2024-07-10',
  },
  {
    id: 'sr-003',
    studentId: 'stu-001',
    title: '2024학년도 2학기 중간고사',
    semester: '2024-2',
    examType: '중간',
    subject: '수학',
    rawScore: 94,
    maxScore: 100,
    classAverage: 69.5,
    classMax: 99,
    totalStudents: 28,
    myRank: 3,
    grade: 1,
    achievementLevel: '수',
    recordedAt: '2024-10-12',
  },
];

export const PHASE2D_NATIONAL_MOCKS: NationalMockResult[] = [
  {
    id: 'nm-001',
    studentId: 'stu-001',
    title: '2024년 3월 전국연합학력평가',
    examDate: '2024-03-28',
    organizer: '교육청',
    subject: '수학',
    rawScore: 80,
    maxScore: 100,
    standardScore: 124,
    percentile: 79,
    grade: 3,
    averageScore: 54.2,
    highestScore: 100,
    participantCount: 421530,
    myRank: 87864,
  },
  {
    id: 'nm-002',
    studentId: 'stu-001',
    title: '2024년 6월 모의평가',
    examDate: '2024-06-04',
    organizer: '평가원',
    subject: '수학',
    rawScore: 88,
    maxScore: 100,
    standardScore: 133,
    percentile: 87,
    grade: 2,
    averageScore: 58.1,
    highestScore: 100,
    participantCount: 463219,
    myRank: 60219,
  },
  {
    id: 'nm-003',
    studentId: 'stu-001',
    title: '2024년 9월 모의평가',
    examDate: '2024-09-04',
    organizer: '평가원',
    subject: '수학',
    rawScore: 92,
    maxScore: 100,
    standardScore: 138,
    percentile: 92,
    grade: 2,
    averageScore: 59.8,
    highestScore: 100,
    participantCount: 467304,
    myRank: 37384,
  },
];

// stu-002, stu-003 데이터 (다른 학생용)
export const PHASE2D_SCHOOL_RECORDS_ALL: SchoolRecord[] = [
  ...PHASE2D_SCHOOL_RECORDS,
  {
    id: 'sr-004',
    studentId: 'stu-002',
    title: '2024학년도 1학기 중간고사',
    semester: '2024-1',
    examType: '중간',
    subject: '수학',
    rawScore: 72,
    maxScore: 100,
    classAverage: 70.3,
    classMax: 98,
    totalStudents: 28,
    myRank: 13,
    grade: 4,
    achievementLevel: '미',
    recordedAt: '2024-05-10',
  },
];

export const PHASE2D_NATIONAL_MOCKS_ALL: NationalMockResult[] = [
  ...PHASE2D_NATIONAL_MOCKS,
  {
    id: 'nm-004',
    studentId: 'stu-002',
    title: '2024년 3월 전국연합학력평가',
    examDate: '2024-03-28',
    organizer: '교육청',
    subject: '수학',
    rawScore: 64,
    maxScore: 100,
    standardScore: 109,
    percentile: 62,
    grade: 4,
    averageScore: 54.2,
    highestScore: 100,
    participantCount: 421530,
    myRank: 160181,
  },
];

// ─── Phase 2D 헬퍼 함수 ────────────────────────────────────────────────
export function getSchoolRecordsForStudent(studentId: string): SchoolRecord[] {
  return PHASE2D_SCHOOL_RECORDS_ALL
    .filter(r => r.studentId === studentId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export function getNationalMocksForStudent(studentId: string): NationalMockResult[] {
  return PHASE2D_NATIONAL_MOCKS_ALL
    .filter(r => r.studentId === studentId)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
}
