// AXIS LMS v1.2 - Enrollment Foundation (수강 연결) 데이터 구조
// classData.ts/attendanceData.ts/assessmentData.ts와 동일한 "타입 + 더미 데이터 + 순수 헬퍼 함수"
// 파일 구조 패턴을 따른다.
//
// AXIS 확정 원칙: 재무관리는 학생 기준이 아니라 수강(Enrollment) 기준으로 관리한다.
// 학생 1명은 여러 반을 동시에 수강할 수 있고, 반 이동은 자유롭게 허용한다(별도의 대기자/재수강/
// 반 변경 이력 전용 엔진은 만들지 않음 — 이력은 학생 상세의 수강이력에서 확인).
//
// 이번 단계 범위: Enrollment 데이터 구조와 Finance Engine 연동 준비(helper 함수)까지.
// 실제 청구서 생성, 일할 계산, 수납, 환불, 미납 관리는 다루지 않는다. tuitionAmount는 Finance Engine이
// 나중에 사용할 "수강료 준비값"으로만 존재하며, 이 단계에서는 그 값으로 어떤 계산도 수행하지 않는다.

export type EnrollmentStatus = '수강중' | '종료' | '퇴원';

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: EnrollmentStatus;
  startDate: string;       // YYYY-MM-DD
  endDate?: string;        // 종료/퇴원일 (수강중이면 없음)
  tuitionAmount?: number;  // Finance Engine 준비용 값 — 이 단계에서는 표시만 하고 계산하지 않음
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────
// 조회 헬퍼 — Finance Engine을 포함한 다른 엔진이 그대로 재사용할 수 있도록 순수 함수로 둔다.
// ────────────────────────────────────────────────────────────
export function getEnrollmentsByStudent(enrollments: Enrollment[], studentId: string): Enrollment[] {
  return enrollments.filter((e) => e.studentId === studentId);
}

export function getEnrollmentsByClass(enrollments: Enrollment[], classId: string): Enrollment[] {
  return enrollments.filter((e) => e.classId === classId);
}

export function getActiveEnrollmentsByStudent(enrollments: Enrollment[], studentId: string): Enrollment[] {
  return enrollments.filter((e) => e.studentId === studentId && e.status === '수강중');
}

export function getActiveEnrollmentsByClass(enrollments: Enrollment[], classId: string): Enrollment[] {
  return enrollments.filter((e) => e.classId === classId && e.status === '수강중');
}

// 학생이 특정 반에 이미 "수강중"인지 — 반 등록 모달의 중복 등록 방지에 사용
export function isStudentActivelyEnrolled(enrollments: Enrollment[], studentId: string, classId: string): boolean {
  return enrollments.some((e) => e.studentId === studentId && e.classId === classId && e.status === '수강중');
}

// ────────────────────────────────────────────────────────────
// 더미 데이터 — classData.ts의 CLASS_STUDENT_MAP(반→학생ID 매핑, Attendance/Assessment Engine이
// 실제로 참조하는 데이터)과 동일한 관계를 그대로 재현한다. 이렇게 해야 기존 출결/성적 엔진의
// 더미 시나리오(특정 반의 응시자/출결 대상 학생)와 이번 Enrollment 더미가 서로 어긋나지 않는다.
// ────────────────────────────────────────────────────────────
function makeEnrollment(
  id: string, studentId: string, classId: string, startDate: string, tuitionAmount?: number
): Enrollment {
  return {
    id, studentId, classId, status: '수강중', startDate, tuitionAmount,
    createdAt: `${startDate}T09:00:00`, updatedAt: `${startDate}T09:00:00`,
  };
}

// 활성 수강(상태: 수강중) — 재원 중인 학생(stu-001/002/003)만 부여한다.
// 휴원(stu-004)/대기(stu-005)/퇴원(stu-006)은 dummyData.ts의 기존 student.classes가 이미 빈 배열로
// 정확하게 표현하고 있던 상태이므로(현재 활성 수강이 없는 것이 맞는 데이터), 이번 Enrollment 더미도
// 그 학생들에게는 활성 수강을 부여하지 않는다 — 대신 과거 종료/퇴원 이력만 일부 부여한다.
// stu-001은 cls-001 + cls-002 두 반을 동시 수강 — "학생 1명은 여러 반을 동시에 수강할 수 있다"는
// AXIS 확정 원칙 2를 그대로 보여주는 사례다.
export const DUMMY_ENROLLMENTS: Enrollment[] = [
  makeEnrollment('enr-001', 'stu-001', 'cls-001', '2024-03-01', 320000),
  makeEnrollment('enr-002', 'stu-001', 'cls-002', '2024-03-01', 280000),
  makeEnrollment('enr-003', 'stu-002', 'cls-001', '2024-03-01', 320000),
  makeEnrollment('enr-004', 'stu-003', 'cls-003', '2024-03-01', 250000),

  // 과거 수강이력 더미(종료/퇴원 사례) — 수강이력 탭의 "과거 수강이력"이 비어보이지 않도록 한다.
  {
    id: 'enr-101', studentId: 'stu-004', classId: 'cls-005', status: '종료',
    startDate: '2023-09-01', endDate: '2024-05-30', tuitionAmount: 260000,
    memo: '휴원으로 수강 종료', createdAt: '2023-09-01T09:00:00', updatedAt: '2024-05-30T18:00:00',
  },
  {
    id: 'enr-102', studentId: 'stu-006', classId: 'cls-001', status: '퇴원',
    startDate: '2023-10-01', endDate: '2024-01-15', tuitionAmount: 320000,
    memo: '개인 사정으로 수강 중단', createdAt: '2023-10-01T09:00:00', updatedAt: '2024-01-15T17:00:00',
  },
];
