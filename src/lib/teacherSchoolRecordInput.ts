// AXIS LMS v1.2 — Phase 3A-1+: teacherSchoolRecordInput.ts
// 내신성적 입력 데이터 구조 (과목별 고정 테이블 방식)
//
// 정책:
//   - 선생님이 입력, 학생은 조회만
//   - 과목명은 기본 목록에서 고정 표시 (자유 입력 아님)
//   - source: 'TEACHER_INPUT', status: 'TEACHER_CONFIRMED'

export type SubjectCategory = 'common' | 'social' | 'science' | 'elective';

// 'relative'(상대평가·석차등급 중심) | 'absolute'(성취평가제·절대평가·성취도 중심)
// 한국사/통합사회/통합과학은 성취평가제 과목이라 석차등급이 존재하지 않는다.
export type EvaluationType = 'relative' | 'absolute';

export interface SchoolSubjectDef {
  id: string;
  name: string;
  category: SubjectCategory;
  requiredForUniv?: boolean; // 대학 반영 기본값
  evaluationType: EvaluationType;
}

// ─── 과목 목록 (고정) ─────────────────────────────────────────────────
export const SCHOOL_SUBJECTS: SchoolSubjectDef[] = [
  // 공통
  { id: 'korean',       name: '국어',        category: 'common',   requiredForUniv: true,  evaluationType: 'relative' },
  { id: 'math',         name: '수학',        category: 'common',   requiredForUniv: true,  evaluationType: 'relative' },
  { id: 'english',      name: '영어',        category: 'common',   requiredForUniv: true,  evaluationType: 'relative' },
  { id: 'history_kr',   name: '한국사',      category: 'common',   requiredForUniv: true,  evaluationType: 'absolute' },
  // 사회
  { id: 'soc_unified',  name: '통합사회',    category: 'social',   requiredForUniv: false, evaluationType: 'absolute' },
  { id: 'geo_kr',       name: '한국지리',    category: 'social',   evaluationType: 'relative' },
  { id: 'geo_world',    name: '세계지리',    category: 'social',   evaluationType: 'relative' },
  { id: 'history_w',    name: '세계사',      category: 'social',   evaluationType: 'relative' },
  { id: 'history_ea',   name: '동아시아사',  category: 'social',   evaluationType: 'relative' },
  { id: 'economics',    name: '경제',        category: 'social',   evaluationType: 'relative' },
  { id: 'politics_law', name: '정치와 법',   category: 'social',   evaluationType: 'relative' },
  { id: 'soc_culture',  name: '사회문화',    category: 'social',   evaluationType: 'relative' },
  { id: 'ethics_life',  name: '생활과 윤리', category: 'social',   evaluationType: 'relative' },
  { id: 'ethics_idea',  name: '윤리와 사상', category: 'social',   evaluationType: 'relative' },
  // 과학
  { id: 'sci_unified',  name: '통합과학',    category: 'science',  requiredForUniv: false, evaluationType: 'absolute' },
  { id: 'physics1',     name: '물리학Ⅰ',    category: 'science',  evaluationType: 'relative' },
  { id: 'chemistry1',   name: '화학Ⅰ',      category: 'science',  evaluationType: 'relative' },
  { id: 'bio1',         name: '생명과학Ⅰ',  category: 'science',  evaluationType: 'relative' },
  { id: 'earth1',       name: '지구과학Ⅰ',  category: 'science',  evaluationType: 'relative' },
  { id: 'physics2',     name: '물리학Ⅱ',    category: 'science',  evaluationType: 'relative' },
  { id: 'chemistry2',   name: '화학Ⅱ',      category: 'science',  evaluationType: 'relative' },
  { id: 'bio2',         name: '생명과학Ⅱ',  category: 'science',  evaluationType: 'relative' },
  { id: 'earth2',       name: '지구과학Ⅱ',  category: 'science',  evaluationType: 'relative' },
  // 선택/기타
  { id: 'info',         name: '정보',        category: 'elective', evaluationType: 'absolute' },
  { id: 'lang2',        name: '제2외국어',   category: 'elective', evaluationType: 'relative' },
  { id: 'chinese_cls',  name: '한문',        category: 'elective', evaluationType: 'relative' },
];

export const CATEGORY_LABELS: Record<SubjectCategory, string> = {
  common:   '공통 과목',
  social:   '사회 계열',
  science:  '과학 계열',
  elective: '선택/기타',
};

// ─── 과목별 입력 레코드 ──────────────────────────────────────────────
export interface SubjectGradeEntry {
  subjectId: string;
  rawScore?: number;          // 원점수
  subjectAverage?: number;    // 과목 평균
  stdDev?: number;            // 표준편차
  gradeRank?: number;         // 석차등급 (1-9)
  achievementLevel?: string;  // 성취도 A/B/C/D/E
  enrolledCount?: number;     // 수강자 수
  creditUnit?: number;        // 단위수
  includeInPayload: boolean;  // 대학추천 반영 여부
}

// ─── 내신 성적 레코드 ────────────────────────────────────────────────
export interface TeacherSchoolRecordInput {
  id: string;
  studentId: string;
  teacherId: string;
  academicYear: string;       // '2024'
  gradeLevel: '고1' | '고2' | '고3';
  semester: '1학기' | '2학기';
  examType: '중간' | '기말' | '수행' | '학기말';
  track: '인문' | '자연' | '통합';
  subjectGrades: SubjectGradeEntry[];
  customSubjects?: { name: string; gradeRank?: number; creditUnit?: number }[];
  source: 'TEACHER_INPUT';
  status: 'TEACHER_CONFIRMED';
  createdAt: string;
}

// ─── 빈 SubjectGradeEntry 생성 ──────────────────────────────────────
export function createEmptySubjectEntry(subjectId: string, requiredForUniv = false): SubjectGradeEntry {
  return {
    subjectId,
    rawScore: undefined,
    subjectAverage: undefined,
    stdDev: undefined,
    gradeRank: undefined,
    achievementLevel: undefined,
    enrolledCount: undefined,
    creditUnit: undefined,
    includeInPayload: requiredForUniv,
  };
}

// ─── 빈 내신 레코드 생성 ────────────────────────────────────────────
export function createEmptySchoolRecord(
  studentId: string,
  teacherId: string,
  academicYear: string
): TeacherSchoolRecordInput {
  return {
    id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    studentId,
    teacherId,
    academicYear,
    gradeLevel: '고3',
    semester: '1학기',
    examType: '중간',
    track: '자연',
    subjectGrades: SCHOOL_SUBJECTS.map(s => createEmptySubjectEntry(s.id, s.requiredForUniv)),
    source: 'TEACHER_INPUT',
    status: 'TEACHER_CONFIRMED',
    createdAt: new Date().toISOString(),
  };
}

// ─── localStorage 저장 ──────────────────────────────────────────────
const STORAGE_KEY = (studentId: string) => `axis_teacher_school_record_${studentId}`;

export function saveSchoolRecord(record: TeacherSchoolRecordInput): void {
  try {
    const key = STORAGE_KEY(record.studentId);
    const existing: TeacherSchoolRecordInput[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    const updated = [record, ...existing.filter(r => r.id !== record.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function loadSchoolRecords(studentId: string): TeacherSchoolRecordInput[] {
  try {
    const key = STORAGE_KEY(studentId);
    return JSON.parse(localStorage.getItem(key) ?? '[]') as TeacherSchoolRecordInput[];
  } catch { return []; }
}

// ─── Mock 데이터 ─────────────────────────────────────────────────────
export const MOCK_SCHOOL_RECORD: TeacherSchoolRecordInput = {
  id: 'msr-001', studentId: 'stu-001', teacherId: 'u-teacher',
  academicYear: '2024', gradeLevel: '고3', semester: '1학기',
  examType: '중간', track: '자연',
  subjectGrades: [
    { subjectId: 'korean',      rawScore: 90, subjectAverage: 72.3, stdDev: 14.2, gradeRank: 1, achievementLevel: 'A', enrolledCount: 28, creditUnit: 2, includeInPayload: true },
    { subjectId: 'math',        rawScore: 95, subjectAverage: 68.1, stdDev: 18.5, gradeRank: 1, achievementLevel: 'A', enrolledCount: 28, creditUnit: 4, includeInPayload: true },
    { subjectId: 'english',     rawScore: 88, subjectAverage: 74.6, stdDev: 12.8, gradeRank: 2, achievementLevel: 'A', enrolledCount: 28, creditUnit: 2, includeInPayload: true },
    { subjectId: 'history_kr',  rawScore: 84, subjectAverage: 70.2, stdDev: 11.3, gradeRank: 2, achievementLevel: 'A', enrolledCount: 28, creditUnit: 1, includeInPayload: true },
    { subjectId: 'physics1',    rawScore: 91, subjectAverage: 65.4, stdDev: 16.2, gradeRank: 1, achievementLevel: 'A', enrolledCount: 24, creditUnit: 3, includeInPayload: true },
    { subjectId: 'chemistry1',  rawScore: 87, subjectAverage: 67.8, stdDev: 15.1, gradeRank: 2, achievementLevel: 'A', enrolledCount: 24, creditUnit: 3, includeInPayload: true },
    ...SCHOOL_SUBJECTS.filter(s => !['korean','math','english','history_kr','physics1','chemistry1'].includes(s.id))
      .map(s => createEmptySubjectEntry(s.id, s.requiredForUniv)),
  ],
  source: 'TEACHER_INPUT', status: 'TEACHER_CONFIRMED', createdAt: '2024-04-20',
};

export function getSchoolRecordsForStudentAll(studentId: string): TeacherSchoolRecordInput[] {
  const stored = loadSchoolRecords(studentId);
  const mock = studentId === 'stu-001' ? [MOCK_SCHOOL_RECORD] : [];
  const storedIds = new Set(stored.map(r => r.id));
  return [...stored, ...mock.filter(m => !storedIds.has(m.id))];
}
