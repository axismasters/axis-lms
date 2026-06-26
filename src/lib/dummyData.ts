// AXIS LMS v1.2 - 학생관리 더미 데이터
// 현재 상태: 더미 데이터 (DB 미연동)
//
// 주의: 이 파일은 받은 AXIS LMS v1.2 수정 파일들(StudentDetail.tsx, StudentList.tsx, StudentNew.tsx,
// AuthContext.tsx, studentDerived.ts)이 실제로 import/사용하는 타입과 필드를 기준으로 재구성한
// 최소 mock data입니다. 새로운 필드, 새로운 엔진, 새로운 권한 구조는 추가하지 않았습니다.

export type StudentStatus = '재원' | '휴원' | '퇴원' | '대기';

export interface Guardian {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  schedule: string;
  startDate: string;
  endDate?: string;
  endReason?: string;
  status: '수강중' | '수강완료' | '수강취소';
}

export interface AttendanceRecord {
  date: string;
  status: '출석' | '지각' | '결석' | '조퇴';
  note?: string;
}

export interface ConsultRecord {
  id: string;
  date: string;
  type: '입학상담' | '학습상담' | '생활상담' | '성적상담' | '퇴원상담' | '기타';
  reason: string;
  content: string;
  consultant: string;
  createdAt: string;
}

export interface OperationMemo {
  id: string;
  date: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface InternalScore {
  id: string;
  year: string;
  semester: '1학기' | '2학기';
  subject: string;
  examType: '중간' | '기말';
  grade: number;
  rawScore: number;
  note?: string;
}

// AXIS Sprint 1 Revision(별도 진행 중) 대비: 모의고사 카테고리 구분 필드.
// StudentDetail.tsx의 성적조회 탭이 examCategory 기준으로 필터링한다.
export type MockExamCategory = '전국연합모의고사' | '내신대비모의고사' | '수능실전모의고사';

export interface MockExamScore {
  id: string;
  examName: string;
  examDate: string;
  examCategory?: MockExamCategory;
  grade: string;
  korean: { score: number; grade: number; percentile: number; standardScore: number } | null;
  math: { score: number; grade: number; percentile: number; standardScore: number } | null;
  english: { score: number; grade: number; percentile: number; standardScore: number } | null;
  inquiry1: { subject: string; score: number; grade: number; percentile: number; standardScore: number } | null;
  inquiry2: { subject: string; score: number; grade: number; percentile: number; standardScore: number } | null;
  history: { score: number; grade: number } | null;
  totalScore?: number;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  status: StudentStatus;
  guardians: Guardian[];
  classes: ClassInfo[];
  recentAttendance?: AttendanceRecord;
  recentExam?: string;
  internalScores: InternalScore[];
  mockExamScores: MockExamScore[];
  consultRecords: ConsultRecord[];
  operationMemos: OperationMemo[];
  registeredAt: string;
  withdrawnAt?: string;
  statusChangedAt?: string;
  familyGroupId?: string;
}

// 반 목록 (학생의 classes 필드에서 참조하는 형태와 동일한 ClassInfo 모양의 더미 반)
export const CLASSES: ClassInfo[] = [
  { id: 'cls-001', name: '고3 수학 심화반', subject: '수학', teacher: '김민준', schedule: '월수금 18:00-20:00', startDate: '2024-03-01', status: '수강중' },
  { id: 'cls-002', name: '고2 영어 독해반', subject: '영어', teacher: '이서연', schedule: '화목 17:00-19:00', startDate: '2024-03-01', status: '수강중' },
  { id: 'cls-003', name: '고1 국어 문학반', subject: '국어', teacher: '박지훈', schedule: '토 10:00-13:00', startDate: '2024-03-01', status: '수강중' },
];

// 학생 더미 데이터 (최소 6명 — 화면 확인용)
export const STUDENTS: Student[] = [
  {
    id: 'stu-001',
    name: '김지수',
    phone: '010-3421-5678',
    status: '재원',
    familyGroupId: 'fam-001',
    guardians: [
      { id: 'g-001', name: '김영희', relation: '어머니', phone: '010-1234-5678' },
      { id: 'g-002', name: '김철수', relation: '아버지', phone: '010-9876-5432' },
    ],
    classes: [
      { ...CLASSES[0], status: '수강중' },
      { ...CLASSES[1], status: '수강중' },
    ],
    recentAttendance: { date: '2024-06-20', status: '출석' },
    recentExam: '2024 6월 모의고사',
    internalScores: [
      { id: 'is-001', year: '2024', semester: '1학기', subject: '수학', examType: '중간', grade: 1, rawScore: 96, note: '최고점' },
    ],
    mockExamScores: [
      {
        id: 'me-001', examName: '2024 6월 모의고사', examDate: '2024-06-04', examCategory: '전국연합모의고사', grade: '고3',
        korean: { score: 88, grade: 2, percentile: 89, standardScore: 128 },
        math: { score: 96, grade: 1, percentile: 97, standardScore: 145 },
        english: { score: 91, grade: 2, percentile: 91, standardScore: 0 },
        inquiry1: { subject: '생명과학I', score: 45, grade: 2, percentile: 88, standardScore: 65 },
        inquiry2: { subject: '화학I', score: 42, grade: 3, percentile: 79, standardScore: 62 },
        history: { score: 50, grade: 1 },
        totalScore: 362,
      },
    ],
    consultRecords: [
      { id: 'cr-001', date: '2024-06-15', type: '학습상담', reason: '수학 성적 향상 방안', content: '취약 단원 보완 필요.', consultant: '원장', createdAt: '2024-06-15T14:30:00' },
    ],
    operationMemos: [
      { id: 'om-001', date: '2024-06-20', content: '학부모 전화 - 여름방학 특강 문의.', author: '관리자', createdAt: '2024-06-20T10:15:00' },
    ],
    registeredAt: '2023-03-02',
  },
  {
    id: 'stu-002',
    name: '이준혁',
    phone: '010-5678-1234',
    status: '재원',
    familyGroupId: 'fam-002',
    guardians: [
      { id: 'g-003', name: '이미영', relation: '어머니', phone: '010-2345-6789' },
    ],
    classes: [
      { ...CLASSES[0], status: '수강중' },
    ],
    recentAttendance: { date: '2024-06-20', status: '지각' },
    recentExam: '2024 6월 모의고사',
    internalScores: [
      { id: 'is-010', year: '2024', semester: '1학기', subject: '국어', examType: '중간', grade: 3, rawScore: 76, note: '' },
    ],
    mockExamScores: [],
    consultRecords: [],
    operationMemos: [],
    registeredAt: '2023-09-01',
  },
  {
    id: 'stu-003',
    name: '박서윤',
    phone: '010-4567-8901',
    status: '재원',
    familyGroupId: 'fam-001',
    guardians: [
      { id: 'g-004', name: '김영희', relation: '어머니', phone: '010-1234-5678' },
    ],
    classes: [
      { ...CLASSES[2], status: '수강중' },
    ],
    recentAttendance: { date: '2024-06-19', status: '출석' },
    recentExam: undefined,
    internalScores: [],
    mockExamScores: [],
    consultRecords: [],
    operationMemos: [],
    registeredAt: '2023-03-02',
  },
  {
    id: 'stu-004',
    name: '최민서',
    phone: '010-7777-8888',
    status: '휴원',
    guardians: [
      { id: 'g-005', name: '최영수', relation: '아버지', phone: '010-8888-9999' },
    ],
    classes: [],
    recentAttendance: { date: '2024-05-30', status: '결석' },
    recentExam: '2024 4월 모의고사',
    internalScores: [],
    mockExamScores: [],
    consultRecords: [
      { id: 'cr-030', date: '2024-05-20', type: '생활상담', reason: '휴원 사유 확인', content: '개인 사정으로 6월 한 달 휴원.', consultant: '원장', createdAt: '2024-05-20T11:30:00' },
    ],
    operationMemos: [],
    registeredAt: '2022-09-05',
  },
  {
    id: 'stu-005',
    name: '정하은',
    phone: '010-2345-6780',
    status: '대기',
    guardians: [
      { id: 'g-007', name: '정미선', relation: '어머니', phone: '010-6789-0123' },
    ],
    classes: [],
    recentAttendance: undefined,
    recentExam: undefined,
    internalScores: [],
    mockExamScores: [],
    consultRecords: [],
    operationMemos: [],
    registeredAt: '2024-06-18',
  },
  {
    id: 'stu-006',
    name: '한도윤',
    phone: '010-8765-4321',
    status: '퇴원',
    guardians: [
      { id: 'g-008', name: '한상철', relation: '아버지', phone: '010-7890-1234' },
    ],
    classes: [],
    recentAttendance: { date: '2024-02-28', status: '출석' },
    recentExam: '2023 수능',
    internalScores: [],
    mockExamScores: [],
    consultRecords: [
      { id: 'cr-050', date: '2024-02-20', type: '퇴원상담', reason: '졸업', content: '대학 합격 후 퇴원 처리 완료.', consultant: '원장', createdAt: '2024-02-20T14:00:00' },
    ],
    operationMemos: [],
    registeredAt: '2021-03-03',
    withdrawnAt: '2024-02-29',
    statusChangedAt: '2024-02-29',
  },
];

// 가족 연결 감지용 — 기존 보호자 번호 목록 (StudentNew.tsx의 checkGuardianPhone에서 활용)
export const EXISTING_GUARDIAN_PHONES: Record<string, { studentId: string; studentName: string; relation: string; guardianName: string }[]> = {
  '010-1234-5678': [
    { studentId: 'stu-001', studentName: '김지수', relation: '어머니', guardianName: '김영희' },
    { studentId: 'stu-003', studentName: '박서윤', relation: '어머니', guardianName: '김영희' },
  ],
  '010-2345-6789': [
    { studentId: 'stu-002', studentName: '이준혁', relation: '어머니', guardianName: '이미영' },
  ],
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  '재원': '재원',
  '휴원': '휴원',
  '퇴원': '퇴원',
  '대기': '대기',
};

export const RELATION_OPTIONS = ['어머니', '아버지', '할머니', '할아버지', '형', '누나', '오빠', '언니', '기타'];
