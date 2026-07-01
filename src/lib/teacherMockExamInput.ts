// AXIS LMS v1.2 — Phase 3A-1+: teacherMockExamInput.ts
// 전국연합/수능실전 모의고사 입력 데이터 구조 (성적표 형식)
//
// 정책:
//   - 실제 수능 성적표 구조와 동일한 형식으로 고정
//   - 선생님이 칸만 채움 (과목 구조 자유 입력 아님)
//   - source: 'TEACHER_INPUT', status: 'TEACHER_CONFIRMED'

export type MockExamType = '전국연합' | '교육청' | '평가원' | '수능실전' | '학원실전';
export type ExploreTrack = '사회탐구' | '과학탐구' | '직업탐구';

// ─── 사회탐구 과목 목록 ──────────────────────────────────────────────
export const SOCIAL_SUBJECTS = [
  '생활과 윤리', '윤리와 사상', '한국지리', '세계지리',
  '동아시아사', '세계사', '경제', '정치와 법', '사회문화',
];

// ─── 과학탐구 과목 목록 ──────────────────────────────────────────────
export const SCIENCE_SUBJECTS = [
  '물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ',
  '물리학Ⅱ', '화학Ⅱ', '생명과학Ⅱ', '지구과학Ⅱ',
];

// ─── 직업탐구 과목 목록 ──────────────────────────────────────────────
export const VOCATIONAL_SUBJECTS = [
  '성공적인 직업생활', '농업 기초 기술', '공업 일반', '상업 경제', '수산·해운 산업 기초',
];

// ─── 제2외국어/한문 과목 목록 ────────────────────────────────────────
export const SECOND_LANGUAGE_SUBJECTS = [
  '독일어Ⅰ', '프랑스어Ⅰ', '스페인어Ⅰ', '중국어Ⅰ', '일본어Ⅰ',
  '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ', '한문Ⅰ',
];

// ─── 과목별 점수 기본 타입 ──────────────────────────────────────────
export interface StandardScore {
  rawScore?: number;
  standardScore?: number;
  percentile?: number;
  grade?: number; // 1-9
}

// ─── 국어 ────────────────────────────────────────────────────────────
export type KoreanOptSubject = '화법과작문' | '언어와매체';
export interface KoreanScore {
  optSubject?: KoreanOptSubject;
  rawScore?: number;
  standardScore?: number;
  percentile?: number;
  grade?: number;
}

// ─── 수학 ────────────────────────────────────────────────────────────
export type MathOptSubject = '확률과통계' | '미적분' | '기하';
export interface MathScore {
  optSubject?: MathOptSubject;
  rawScore?: number;
  standardScore?: number;
  percentile?: number;
  grade?: number;
}

// ─── 탐구 영역 ───────────────────────────────────────────────────────
export interface ExploreScore {
  track?: ExploreTrack;
  subjectName?: string;
  rawScore?: number;
  standardScore?: number;
  percentile?: number;
  grade?: number;
}

// ─── 제2외국어/한문 ──────────────────────────────────────────────────
export interface SecondLangScore {
  subjectName?: string;
  rawScore?: number;
  grade?: number;
}

// ─── 모의고사 성적 레코드 (성적표 구조) ──────────────────────────────
export interface TeacherMockExamInput {
  id: string;
  studentId: string;
  teacherId: string;
  examYear: string;              // '2024'
  examMonth: number;             // 3, 6, 9, 11 등
  examType: MockExamType;
  gradeLevel: '고1' | '고2' | '고3';
  track: '인문' | '자연' | '통합';

  // ─── 과목별 성적 ────────────────────────────────────────────────
  korean: KoreanScore;
  math: MathScore;
  english: { rawScore?: number; grade?: number };
  history: { rawScore?: number; grade?: number };   // 한국사
  explore1: ExploreScore;
  explore2: ExploreScore;
  secondLang: SecondLangScore;

  // ─── 전체 통계 ──────────────────────────────────────────────────
  totalParticipants?: number;
  myOverallRank?: number;
  classAverage?: number;         // 반 평균 또는 학원 평균
  classHighest?: number;         // 반 최고점 또는 학원 최고점
  memo?: string;

  source: 'TEACHER_INPUT';
  status: 'TEACHER_CONFIRMED';
  createdAt: string;
}

// ─── 빈 레코드 생성 ──────────────────────────────────────────────────
export function createEmptyMockExamInput(
  studentId: string, teacherId: string
): TeacherMockExamInput {
  return {
    id: `me-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    studentId, teacherId,
    examYear: String(new Date().getFullYear()),
    examMonth: 9,
    examType: '전국연합',
    gradeLevel: '고3',
    track: '자연',
    korean: {}, math: {}, english: {}, history: {},
    explore1: {}, explore2: {}, secondLang: {},
    source: 'TEACHER_INPUT',
    status: 'TEACHER_CONFIRMED',
    createdAt: new Date().toISOString(),
  };
}

// ─── localStorage 저장 ──────────────────────────────────────────────
const STORAGE_KEY = (studentId: string) => `axis_teacher_mock_exam_${studentId}`;

export function saveMockExamInput(record: TeacherMockExamInput): void {
  try {
    const key = STORAGE_KEY(record.studentId);
    const existing: TeacherMockExamInput[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    const updated = [record, ...existing.filter(r => r.id !== record.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function loadMockExamInputs(studentId: string): TeacherMockExamInput[] {
  try {
    const key = STORAGE_KEY(studentId);
    return JSON.parse(localStorage.getItem(key) ?? '[]') as TeacherMockExamInput[];
  } catch { return []; }
}

// ─── Mock 데이터 ─────────────────────────────────────────────────────
export const MOCK_EXAM_RECORDS: TeacherMockExamInput[] = [
  {
    id: 'mme-001', studentId: 'stu-001', teacherId: 'u-teacher',
    examYear: '2024', examMonth: 9, examType: '평가원',
    gradeLevel: '고3', track: '자연',
    korean: { optSubject: '언어와매체', rawScore: 89, standardScore: 132, percentile: 91, grade: 2 },
    math: { optSubject: '미적분', rawScore: 92, standardScore: 138, percentile: 92, grade: 2 },
    english: { rawScore: 91, grade: 2 },
    history: { rawScore: 46, grade: 2 },
    explore1: { track: '과학탐구', subjectName: '물리학Ⅰ', rawScore: 48, standardScore: 68, percentile: 93, grade: 1 },
    explore2: { track: '과학탐구', subjectName: '화학Ⅰ', rawScore: 46, standardScore: 65, percentile: 89, grade: 2 },
    secondLang: {},
    totalParticipants: 467304, myOverallRank: 35000, classAverage: 68.2, classHighest: 99,
    source: 'TEACHER_INPUT', status: 'TEACHER_CONFIRMED', createdAt: '2024-09-05',
  },
  {
    id: 'mme-002', studentId: 'stu-001', teacherId: 'u-teacher',
    examYear: '2024', examMonth: 6, examType: '평가원',
    gradeLevel: '고3', track: '자연',
    korean: { optSubject: '언어와매체', rawScore: 82, standardScore: 124, percentile: 84, grade: 3 },
    math: { optSubject: '미적분', rawScore: 88, standardScore: 133, percentile: 87, grade: 2 },
    english: { rawScore: 88, grade: 2 },
    history: { rawScore: 43, grade: 3 },
    explore1: { track: '과학탐구', subjectName: '물리학Ⅰ', rawScore: 44, standardScore: 63, percentile: 85, grade: 2 },
    explore2: { track: '과학탐구', subjectName: '화학Ⅰ', rawScore: 42, standardScore: 61, percentile: 80, grade: 2 },
    secondLang: {},
    totalParticipants: 463219, myOverallRank: 58000, classAverage: 65.1, classHighest: 98,
    source: 'TEACHER_INPUT', status: 'TEACHER_CONFIRMED', createdAt: '2024-06-05',
  },
];

export function getMockExamRecordsForStudent(studentId: string): TeacherMockExamInput[] {
  const stored = loadMockExamInputs(studentId);
  const mock = studentId === 'stu-001' ? MOCK_EXAM_RECORDS : [];
  const storedIds = new Set(stored.map(r => r.id));
  return [...stored, ...mock.filter(m => !storedIds.has(m.id))].sort((a, b) =>
    (b.examYear + String(b.examMonth).padStart(2, '0')).localeCompare(a.examYear + String(a.examMonth).padStart(2, '0'))
  );
}

// ─── 시험 표시 레이블 ────────────────────────────────────────────────
export function getMockExamLabel(record: TeacherMockExamInput): string {
  return `${record.examYear}년 ${record.examMonth}월 ${record.examType} (${record.gradeLevel})`;
}

// ─── 수능실전 레코드 필터 ────────────────────────────────────────────
export function getSuneungRecordsForStudent(studentId: string): TeacherMockExamInput[] {
  return getMockExamRecordsForStudent(studentId).filter(r => r.examType === '수능실전' || r.examType === '학원실전');
}

export function getNationalMockRecordsForStudent(studentId: string): TeacherMockExamInput[] {
  return getMockExamRecordsForStudent(studentId).filter(r => r.examType !== '수능실전' && r.examType !== '학원실전');
}
