// AXIS LMS v1.2 - 반 관리 데이터
// 현재 상태: 더미 데이터 (DB 미연동)

export type ClassStatus = '운영중' | '종강' | '개설예정';
export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';
export type SubjectType = '국어' | '수학' | '영어' | '과학' | '사회' | '한국사' | '탐구' | '기타';

export interface TimeSlot {
  id: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface ClassRoom {
  id: string;
  name: string;           // 반 이름
  subject: SubjectType;   // 과목
  teacher: string;        // 담당 강사
  level: string;          // 수준 (고1/고2/고3/전체)
  description?: string;   // 반 설명
  capacity: number;       // 정원
  enrolledCount: number;  // 현재 수강생 수
  status: ClassStatus;
  timeSlots: TimeSlot[];  // 시간표 (복수)
  startDate: string;      // 개강일
  endDate?: string;       // 종강일
  room?: string;          // 강의실
  fee?: number;           // 수강료 (원)
  createdAt: string;
}

// 더미 반 데이터
export const DUMMY_CLASSES: ClassRoom[] = [
  {
    id: 'cls-001',
    name: '고3 수학 심화반',
    subject: '수학',
    teacher: '김민준',
    level: '고3',
    description: '수능 수학 고득점을 목표로 하는 심화 과정. 킬러 문항 집중 훈련.',
    capacity: 15,
    enrolledCount: 8,
    status: '운영중',
    timeSlots: [
      { id: 'ts-001', day: '월', startTime: '18:00', endTime: '20:00' },
      { id: 'ts-002', day: '수', startTime: '18:00', endTime: '20:00' },
      { id: 'ts-003', day: '금', startTime: '18:00', endTime: '20:00' },
    ],
    startDate: '2024-03-01',
    room: '101호',
    fee: 350000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-002',
    name: '고2 영어 독해반',
    subject: '영어',
    teacher: '이서연',
    level: '고2',
    description: '수능 영어 독해 및 어법 집중 학습.',
    capacity: 20,
    enrolledCount: 14,
    status: '운영중',
    timeSlots: [
      { id: 'ts-010', day: '화', startTime: '17:00', endTime: '19:00' },
      { id: 'ts-011', day: '목', startTime: '17:00', endTime: '19:00' },
    ],
    startDate: '2024-03-01',
    room: '102호',
    fee: 280000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-003',
    name: '고1 국어 문학반',
    subject: '국어',
    teacher: '박지훈',
    level: '고1',
    description: '문학 작품 분석 및 감상 능력 향상.',
    capacity: 18,
    enrolledCount: 11,
    status: '운영중',
    timeSlots: [
      { id: 'ts-020', day: '토', startTime: '10:00', endTime: '13:00' },
    ],
    startDate: '2024-03-01',
    room: '103호',
    fee: 260000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-004',
    name: '고3 국어 비문학반',
    subject: '국어',
    teacher: '박지훈',
    level: '고3',
    description: '비문학 독해 속도와 정확도 향상. 실전 모의 문제 풀이.',
    capacity: 15,
    enrolledCount: 12,
    status: '운영중',
    timeSlots: [
      { id: 'ts-030', day: '월', startTime: '19:00', endTime: '21:00' },
      { id: 'ts-031', day: '수', startTime: '19:00', endTime: '21:00' },
    ],
    startDate: '2024-03-01',
    room: '103호',
    fee: 300000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-005',
    name: '고2 수학 기초반',
    subject: '수학',
    teacher: '최수아',
    level: '고2',
    description: '수학 기초 개념 정립 및 유형별 문제 풀이.',
    capacity: 20,
    enrolledCount: 7,
    status: '운영중',
    timeSlots: [
      { id: 'ts-040', day: '화', startTime: '16:00', endTime: '18:00' },
      { id: 'ts-041', day: '목', startTime: '16:00', endTime: '18:00' },
      { id: 'ts-042', day: '토', startTime: '14:00', endTime: '16:00' },
    ],
    startDate: '2024-03-01',
    room: '101호',
    fee: 280000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-006',
    name: '고3 영어 수능반',
    subject: '영어',
    teacher: '이서연',
    level: '고3',
    description: '수능 영어 1등급 목표. EBS 연계 집중 분석.',
    capacity: 15,
    enrolledCount: 15,
    status: '운영중',
    timeSlots: [
      { id: 'ts-050', day: '월', startTime: '20:00', endTime: '22:00' },
      { id: 'ts-051', day: '수', startTime: '20:00', endTime: '22:00' },
      { id: 'ts-052', day: '금', startTime: '20:00', endTime: '22:00' },
    ],
    startDate: '2024-03-01',
    room: '102호',
    fee: 350000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-007',
    name: '고1 수학 개념반',
    subject: '수학',
    teacher: '최수아',
    level: '고1',
    description: '고등 수학 개념 완성. 내신 대비 기초 다지기.',
    capacity: 20,
    enrolledCount: 9,
    status: '운영중',
    timeSlots: [
      { id: 'ts-060', day: '화', startTime: '15:00', endTime: '17:00' },
      { id: 'ts-061', day: '목', startTime: '15:00', endTime: '17:00' },
    ],
    startDate: '2024-03-01',
    room: '101호',
    fee: 250000,
    createdAt: '2024-02-15',
  },
  {
    id: 'cls-008',
    name: '고3 수학 파이널반',
    subject: '수학',
    teacher: '김민준',
    level: '고3',
    description: '수능 D-100 파이널 정리. 실전 모의고사 집중 풀이.',
    capacity: 12,
    enrolledCount: 0,
    status: '개설예정',
    timeSlots: [
      { id: 'ts-070', day: '토', startTime: '09:00', endTime: '12:00' },
      { id: 'ts-071', day: '일', startTime: '09:00', endTime: '12:00' },
    ],
    startDate: '2024-08-01',
    room: '101호',
    fee: 400000,
    createdAt: '2024-06-01',
  },
  {
    id: 'cls-009',
    name: '고2 국어 비문학반',
    subject: '국어',
    teacher: '박지훈',
    level: '고2',
    description: '비문학 독해 기초반. 지문 분석 훈련.',
    capacity: 18,
    enrolledCount: 18,
    status: '종강',
    timeSlots: [
      { id: 'ts-080', day: '화', startTime: '19:00', endTime: '21:00' },
      { id: 'ts-081', day: '목', startTime: '19:00', endTime: '21:00' },
    ],
    startDate: '2023-09-01',
    endDate: '2024-02-29',
    room: '103호',
    fee: 280000,
    createdAt: '2023-08-20',
  },
];

// 강사 목록
export const TEACHERS = ['김민준', '이서연', '박지훈', '최수아', '정현우', '한지민'];

// 강의실 목록
export const ROOMS = ['101호', '102호', '103호', '104호', '세미나실', '대강의실'];

// 수준 옵션
export const LEVEL_OPTIONS = ['고1', '고2', '고3', '전체', 'N수'];

// 요일 순서
export const DAY_ORDER: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

// 시간 옵션 (30분 단위)
export const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

// 수강생 - 반 매핑 (더미)
// Enrollment Foundation(lib/enrollmentData.ts)의 활성 수강 더미와 일치시켰다 — 반에 수강 등록된
// 학생만 출결체크/시험 대상자로 인식되어야 하므로, 두 더미가 서로 다른 학생을 가리키면 안 된다.
// (기존 값에는 dummyData.ts에 존재하지 않는 학생 ID(stu-007/008)도 섞여 있었다 — 이번에 함께 정리)
export const CLASS_STUDENT_MAP: Record<string, string[]> = {
  'cls-001': ['stu-001', 'stu-002'],
  'cls-002': ['stu-001'],
  'cls-003': ['stu-003'],
  'cls-004': [],
  'cls-005': [],
  'cls-006': [],
  'cls-007': [],
  'cls-008': [],
  'cls-009': [],
};
