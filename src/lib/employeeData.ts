// AXIS LMS v1.2 - 직원관리 데이터 구조
// HR & RBAC Stabilization v1
//
// AXIS 확정 원칙:
//  - 직급과 권한은 분리. 직급은 인사 정보, 권한은 RBAC 접근 권한.
//  - 조교 직급 없음.
//  - 직원 등록 시 휴대폰번호 기반 계정이 자동 생성 (Account Engine — 현재 mock).
//  - 계정 생성 메뉴는 별도로 만들지 않는다.
//  - 급여/인사평가 기능 없음 (복잡한 인사 기능 제외).

import {
  Position, POSITIONS, POSITION_LABEL, AccountStatus,
  DEFAULT_PERMISSIONS_BY_POSITION, defaultPermissionGroupId,
  POSITION_TO_ACCOUNT_TYPE,
} from '@/lib/rbac';

// ────────────────────────────────────────────────────────────
// 직원 타입
// ────────────────────────────────────────────────────────────
export type EmployeeStatus = '재직' | '휴직' | '퇴직';

export interface Employee {
  id: string;
  name: string;
  phone: string;             // 휴대폰번호 — 계정 식별자
  position: Position;        // 직급 (인사 정보)
  status: EmployeeStatus;
  joinDate: string;          // 입사일 (YYYY-MM-DD)
  leaveDate?: string;        // 퇴직일
  memo?: string;             // 내부 메모
  // 계정 연동 (Account Engine 연동 전 mock)
  accountStatus: AccountStatus;  // '활성' | '비활성' | '정지'
  accountId: string;         // DEV_USERS id와 연동 (TODO: 실제 계정 시스템 연동)
  permissionGroupId: string; // 기본: 직급별 기본 권한그룹 (rbac.ts defaultPermissionGroupId)
}

// ────────────────────────────────────────────────────────────
// 권한 변경 이력
// 삭제 없음 — append-only
// ────────────────────────────────────────────────────────────
export interface PermissionChangeLog {
  id: string;
  targetPosition: Position;
  changedAt: string;         // ISO timestamp
  changedBy: string;         // 변경자 이름
  addedKeys: string[];       // 추가된 permission key
  removedKeys: string[];     // 제거된 permission key
  note?: string;             // 사유 (선택)
  sourcePosition?: Position; // 권한 복사 시 출처 직급
}

// ────────────────────────────────────────────────────────────
// 직급 표시용 — Back Office 운영 직급만 (STUDENT/GUARDIAN 제외)
// ────────────────────────────────────────────────────────────
export const EMPLOYEE_POSITIONS: Position[] = POSITIONS; // SUPER_ADMIN 포함 전체 운영 직급

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  재직: '재직',
  휴직: '휴직',
  퇴직: '퇴직',
};

export const EMPLOYEE_STATUS_COLOR: Record<EmployeeStatus, { bg: string; text: string; border: string }> = {
  재직:  { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.35 0.12 160)', border: 'oklch(0.82 0.1 160)' },
  휴직:  { bg: 'oklch(0.96 0.04 80)',  text: 'oklch(0.45 0.1 80)',   border: 'oklch(0.88 0.08 80)' },
  퇴직:  { bg: 'oklch(0.94 0.01 250)', text: 'oklch(0.5 0.015 250)', border: 'oklch(0.85 0.01 250)' },
};

// ────────────────────────────────────────────────────────────
// 더미 직원 데이터
// DEV_USERS(AuthContext)와 id 연동. 운영 배포 시 실제 직원 마스터 데이터로 교체.
// ────────────────────────────────────────────────────────────
export const DUMMY_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: '한태준',
    phone: '010-0000-0001',
    position: 'SUPER_ADMIN',
    status: '재직',
    joinDate: '2020-03-01',
    accountStatus: '활성',
    accountId: 'u-super',
    permissionGroupId: defaultPermissionGroupId('SUPER_ADMIN'),
    memo: '시스템 최고관리자',
  },
  {
    id: 'emp-002',
    name: '원장님',
    phone: '010-0000-0002',
    position: 'DIRECTOR',
    status: '재직',
    joinDate: '2020-03-01',
    accountStatus: '활성',
    accountId: 'u-director',
    permissionGroupId: defaultPermissionGroupId('DIRECTOR'),
  },
  {
    id: 'emp-003',
    name: '행정 담당',
    phone: '010-0000-0003',
    position: 'STAFF',
    status: '재직',
    joinDate: '2021-09-01',
    accountStatus: '활성',
    accountId: 'u-staff',
    permissionGroupId: defaultPermissionGroupId('STAFF'),
  },
  {
    id: 'emp-004',
    name: '김민준',
    phone: '010-0000-0004',
    position: 'TEACHER',
    status: '재직',
    joinDate: '2022-03-02',
    accountStatus: '활성',
    accountId: 'u-teacher',
    permissionGroupId: defaultPermissionGroupId('TEACHER'),
    memo: '수학 담당 강사 (cls-001, cls-002)',
  },
  {
    id: 'emp-005',
    name: '박지혜',
    phone: '010-1234-5678',
    position: 'TEACHER',
    status: '재직',
    joinDate: '2023-03-06',
    accountStatus: '활성',
    accountId: 'u-teacher-2',
    permissionGroupId: defaultPermissionGroupId('TEACHER'),
    memo: '영어 담당 강사',
  },
  {
    id: 'emp-006',
    name: '이수진',
    phone: '010-9876-5432',
    position: 'STAFF',
    status: '재직',
    joinDate: '2022-09-01',
    accountStatus: '활성',
    accountId: 'u-staff-2',
    permissionGroupId: defaultPermissionGroupId('STAFF'),
  },
  {
    id: 'emp-007',
    name: '정현우',
    phone: '010-5555-6666',
    position: 'VICE_DIRECTOR',
    status: '재직',
    joinDate: '2021-03-01',
    accountStatus: '활성',
    accountId: 'u-vicedirector',
    permissionGroupId: defaultPermissionGroupId('VICE_DIRECTOR'),
    memo: '부원장',
  },
  {
    id: 'emp-008',
    name: '최영미',
    phone: '010-7777-8888',
    position: 'TEACHER',
    status: '휴직',
    joinDate: '2021-09-01',
    accountStatus: '비활성',
    accountId: 'u-teacher-3',
    permissionGroupId: defaultPermissionGroupId('TEACHER'),
    memo: '육아휴직 중',
  },
  {
    id: 'emp-009',
    name: '윤도현',
    phone: '010-3333-4444',
    position: 'TEACHER',
    status: '퇴직',
    joinDate: '2020-09-01',
    leaveDate: '2023-08-31',
    accountStatus: '비활성',
    accountId: 'u-teacher-4',
    permissionGroupId: defaultPermissionGroupId('TEACHER'),
  },
];

// ────────────────────────────────────────────────────────────
// 초기 권한 변경 이력 더미
// ────────────────────────────────────────────────────────────
export const DUMMY_PERMISSION_LOGS: PermissionChangeLog[] = [
  {
    id: 'log-001',
    targetPosition: 'STAFF',
    changedAt: '2024-03-15T10:23:00Z',
    changedBy: '한태준',
    addedKeys: ['notification.send'],
    removedKeys: [],
    note: '행정 담당 알림 발송 권한 추가',
  },
  {
    id: 'log-002',
    targetPosition: 'TEACHER',
    changedAt: '2024-05-20T14:05:00Z',
    changedBy: '한태준',
    addedKeys: [],
    removedKeys: [],
    note: '강사 권한 검토 완료 (변경 없음)',
  },
  {
    id: 'log-003',
    targetPosition: 'VICE_DIRECTOR',
    changedAt: '2024-09-01T09:00:00Z',
    changedBy: '한태준',
    addedKeys: [],
    removedKeys: [],
    sourcePosition: 'DIRECTOR',
    note: '부원장 권한 — 원장 권한 기반 초안 생성 후 조정',
  },
];

// ────────────────────────────────────────────────────────────
// 유틸리티
// ────────────────────────────────────────────────────────────

/** 직원 계정 Account Status → AccountStatus 매핑 */
export function employeeAccountStatus(emp: Employee): AccountStatus {
  return emp.accountStatus;
}

/** 직급 기본 권한 가져오기 */
export function getDefaultPermsForPosition(position: Position) {
  return DEFAULT_PERMISSIONS_BY_POSITION[position];
}

/** 다음 직원 ID 생성 (mock) */
export function nextEmployeeId(employees: Employee[]): string {
  const nums = employees.map((e) => parseInt(e.id.replace('emp-', ''), 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `emp-${String(max + 1).padStart(3, '0')}`;
}

/** 다음 직원 accountId 생성 (mock — 실제 Account Engine 연동 전) */
export function nextAccountId(employees: Employee[]): string {
  const nums = employees
    .map((e) => {
      const m = e.accountId.match(/u-emp-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `u-emp-${String(max + 1).padStart(3, '0')}`;
}
