// AXIS LMS v1.2 - RBAC Foundation
// 계정유형 / 데이터 범위 / permission key / 기본 권한 매트릭스의 단일 소스.

// ────────────────────────────────────────────────────────────
// 계정 유형
// ────────────────────────────────────────────────────────────
export type AccountType =
  | 'SUPER_ADMIN'  // 최고관리자
  | 'DIRECTOR'     // 원장
  | 'STAFF'        // 행정
  | 'TEACHER'      // 강사
  | 'STUDENT'      // 학생
  | 'GUARDIAN';    // 보호자

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  SUPER_ADMIN: '최고관리자',
  DIRECTOR: '원장',
  STAFF: '행정',
  TEACHER: '강사',
  STUDENT: '학생',
  GUARDIAN: '보호자',
};

// ────────────────────────────────────────────────────────────
// 데이터 접근 범위
// ────────────────────────────────────────────────────────────
export type DataScope =
  | 'ALL_ACADEMY'       // 학원 전체
  | 'ASSIGNED_CLASSES'  // 배정된 반
  | 'ASSIGNED_STUDENTS' // 배정된 학생
  | 'OWN_DATA'          // 본인 데이터만
  | 'CHILDREN_ONLY'     // 연결된 자녀만
  | 'NONE';             // 없음

// ────────────────────────────────────────────────────────────
// Permission Key (전체 목록 — 단일 소스)
// ────────────────────────────────────────────────────────────
export const PERMISSION_KEYS = [
  // 학생
  'student.view', 'student.create', 'student.update', 'student.withdraw', 'student.passwordReset',
  // 직원
  'employee.view', 'employee.create', 'employee.update', 'employee.resign', 'employee.passwordReset',
  // 반
  'class.view', 'class.create', 'class.update', 'class.assignTeacher',
  // 출결
  'attendance.view', 'attendance.check', 'attendance.update', 'attendance.viewAll',
  // 평가/시험
  'assessment.view', 'assessment.create', 'assessment.grade', 'assessment.publish', 'assessment.resultView', 'assessment.resultCorrect',
  // 재무
  'finance.view', 'finance.paymentCreate', 'finance.refundRequest', 'finance.refundApprove', 'finance.receiptIssue', 'finance.settlementConfirm', 'finance.settingUpdate',
  // 시스템
  'system.logoUpdate', 'system.permissionView', 'system.permissionUpdate', 'system.passwordReset',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

// ────────────────────────────────────────────────────────────
// 직급(Position) / 권한그룹(PermissionGroup)
// ────────────────────────────────────────────────────────────
// AXIS 확정 원칙: 직급과 권한은 분리한다.
// AccountType은 계정의 "큰 유형"(로그인 분기, dataScope 기본값 등에 사용)이고,
// 실제 권한설정 UI(권한설정 메뉴)는 이 Position(직급) 기준 permissionGroup으로 관리한다.
// 한 AccountType 안에도 여러 직급이 존재할 수 있다(예: STAFF 계열 안에 부원장/실장/팀장/행정).
export type Position =
  | 'SUPER_ADMIN'   // 최고관리자
  | 'DIRECTOR'      // 원장
  | 'VICE_DIRECTOR' // 부원장
  | 'HEAD_MANAGER'  // 실장
  | 'TEAM_LEAD'     // 팀장
  | 'TEACHER'       // 강사
  | 'STAFF'         // 행정
  | 'STUDENT'       // 학생 (Back Office 운영 권한그룹 아님 — 향후 포털 조회용)
  | 'GUARDIAN';     // 보호자 (Back Office 운영 권한그룹 아님 — 향후 포털 조회용)

export const POSITION_LABEL: Record<Position, string> = {
  SUPER_ADMIN: '최고관리자',
  DIRECTOR: '원장',
  VICE_DIRECTOR: '부원장',
  HEAD_MANAGER: '실장',
  TEAM_LEAD: '팀장',
  TEACHER: '강사',
  STAFF: '행정',
  STUDENT: '학생',
  GUARDIAN: '보호자',
};

// 권한설정 메뉴(직급별 권한설정)에 노출되는 Back Office 운영 직급 순서.
// 학생/보호자는 현재 Admin Back Office 운영 권한그룹이 아니라 향후 포털용 조회 권한으로만 별도 분리한다(PORTAL_ONLY_POSITIONS).
export const POSITIONS: Position[] = [
  'SUPER_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'HEAD_MANAGER', 'TEAM_LEAD', 'TEACHER', 'STAFF',
];
export const PORTAL_ONLY_POSITIONS: Position[] = ['STUDENT', 'GUARDIAN'];

/** Position → AccountType 매핑(로그인/dataScope 분기에는 AccountType을 그대로 사용) */
export const POSITION_TO_ACCOUNT_TYPE: Record<Position, AccountType> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DIRECTOR: 'DIRECTOR',
  VICE_DIRECTOR: 'STAFF',
  HEAD_MANAGER: 'STAFF',
  TEAM_LEAD: 'STAFF',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
  GUARDIAN: 'GUARDIAN',
};

/**
 * 권한그룹: 기본은 직급 1:1(isDefault=true)이지만, 향후 "권한 복사"로 파생된
 * 커스텀 그룹(예: '강사(선임)')도 같은 구조로 표현할 수 있도록 설계한다.
 * TODO(권한그룹 확장): 커스텀 그룹 생성/복사 UI, 그룹별 변경 이력(누가/언제/무엇을 바꿨는지)은
 *                     이번 단계 범위 밖이며 PermissionSettings.tsx에 placeholder로만 존재한다.
 */
export interface PermissionGroup {
  id: string;             // 권한그룹 고유 id (예: 'TEACHER_DEFAULT', 'TEACHER_SENIOR')
  label: string;          // 화면 표시명 (예: '강사', '강사(선임)')
  basePosition: Position; // 어떤 직급의 기본값을 베이스로 하는지(권한 복사 출처 추적용)
  permissions: PermissionKey[];
  isDefault: boolean;     // 직급 기본 권한그룹이면 true (그룹 자체 삭제는 불가, 권한 항목은 편집 가능)
}

// ────────────────────────────────────────────────────────────
// 인증 사용자
// ────────────────────────────────────────────────────────────
export type AccountStatus = '활성' | '비활성' | '정지';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  accountType: AccountType;     // 계정의 큰 유형 (로그인 분기 / dataScope 기본값)
  position: Position;           // 직급 — 권한설정(직급별 권한설정)의 기준 단위. AXIS 확정: 직급과 권한은 분리.
  permissionGroupId: string;    // 실제 적용되는 권한그룹 id (편집 가능). 기본은 직급 기본 권한그룹 id
  permissions: PermissionKey[]; // 실제 부여된 권한 (권한그룹 기준 — 개별 사용자 오버라이드는 TODO)
  dataScope: DataScope;
  assignedClassIds: string[];   // TEACHER 배정 반
  assignedStudentIds: string[]; // TEACHER 배정 학생 / STUDENT 본인 / GUARDIAN 자녀
  status: AccountStatus;
}

// ────────────────────────────────────────────────────────────
// 기본 데이터 범위
// ────────────────────────────────────────────────────────────
export const DEFAULT_DATA_SCOPE: Record<AccountType, DataScope> = {
  SUPER_ADMIN: 'ALL_ACADEMY',
  DIRECTOR: 'ALL_ACADEMY',
  STAFF: 'ALL_ACADEMY',
  TEACHER: 'ASSIGNED_CLASSES',
  STUDENT: 'OWN_DATA',
  GUARDIAN: 'CHILDREN_ONLY',
};

// ────────────────────────────────────────────────────────────
// 기본 권한 매트릭스 (직급별 권한설정에서 편집 가능한 기본값)
// ────────────────────────────────────────────────────────────
// AXIS 확정 원칙 4: 시험 생성 권한(assessment.create)은 최고관리자와 원장만 가진다.
// AXIS 확정 원칙 5/6/7: 강사는 본인 담당 학생/반/시험 범위만 조회·관리하며, 비밀번호 초기화는
//                       본인 담당 학생 한정(student.passwordReset)만 가능 — 직원/보호자/최고관리자 초기화 불가.
const ALL: PermissionKey[] = [...PERMISSION_KEYS];

const DIRECTOR_PERMS: PermissionKey[] = [
  'student.view', 'student.create', 'student.update', 'student.withdraw', 'student.passwordReset',
  'employee.view', 'employee.create', 'employee.update', 'employee.resign', 'employee.passwordReset',
  'class.view', 'class.create', 'class.update', 'class.assignTeacher',
  'attendance.view', 'attendance.check', 'attendance.update', 'attendance.viewAll',
  'assessment.view', 'assessment.create', 'assessment.grade', 'assessment.publish', 'assessment.resultView', 'assessment.resultCorrect',
  'finance.view', 'finance.paymentCreate', 'finance.refundRequest', 'finance.refundApprove', 'finance.receiptIssue', 'finance.settlementConfirm', 'finance.settingUpdate',
  'system.logoUpdate', 'system.permissionView', 'system.passwordReset',
  // 비포함: system.permissionUpdate (권한 매트릭스 편집은 최고관리자 전용)
];

// 부원장: 원장 직무 대부분을 위임받되, 시험 생성(assessment.create)·환불 승인·권한 매트릭스 조회는 기본값에서 제외(필요 시 권한설정에서 개별 부여)
const VICE_DIRECTOR_PERMS: PermissionKey[] = [
  'student.view', 'student.create', 'student.update', 'student.withdraw', 'student.passwordReset',
  'employee.view', 'employee.create', 'employee.update', 'employee.passwordReset',
  'class.view', 'class.create', 'class.update', 'class.assignTeacher',
  'attendance.view', 'attendance.check', 'attendance.update', 'attendance.viewAll',
  'assessment.view', 'assessment.grade', 'assessment.resultView', 'assessment.resultCorrect',
  'finance.view', 'finance.paymentCreate', 'finance.refundRequest', 'finance.receiptIssue',
  'system.passwordReset',
  // 비포함: assessment.create/publish(원칙 4 — 최고관리자/원장 전용), employee.resign, finance.refundApprove/settlementConfirm/settingUpdate, system.permissionView/Update, system.logoUpdate
];

// 실장: 운영 관리 중심 — 학생/출결/시험 운영 권한, 직원 관리·재무 승인은 제외
const HEAD_MANAGER_PERMS: PermissionKey[] = [
  'student.view', 'student.create', 'student.update', 'student.withdraw', 'student.passwordReset',
  'employee.view',
  'class.view', 'class.create', 'class.update',
  'attendance.view', 'attendance.check', 'attendance.update', 'attendance.viewAll',
  'assessment.view', 'assessment.grade', 'assessment.resultView', 'assessment.resultCorrect',
  'finance.view', 'finance.paymentCreate', 'finance.refundRequest', 'finance.receiptIssue',
  'system.passwordReset',
  // 비포함: assessment.create/publish(원칙 4), employee.create/update/resign/passwordReset, class.assignTeacher, finance.refundApprove 이상, system.permissionView/Update, system.logoUpdate
];

// 팀장: 실장보다 좁은 범위 — 학생/출결 운영, 시험 결과 조회 위주
const TEAM_LEAD_PERMS: PermissionKey[] = [
  'student.view', 'student.update', 'student.passwordReset',
  'class.view',
  'attendance.view', 'attendance.check', 'attendance.update', 'attendance.viewAll',
  'assessment.view', 'assessment.grade', 'assessment.resultView', 'assessment.resultCorrect',
  'finance.view',
  // 비포함: assessment.create/publish(원칙 4), student.create/withdraw, employee.*, finance.paymentCreate 이상, system.*
];

const STAFF_PERMS: PermissionKey[] = [
  'student.view', 'student.create', 'student.update', 'student.withdraw', 'student.passwordReset',
  'employee.view',
  'class.view',
  'attendance.view', 'attendance.check', 'attendance.update', 'attendance.viewAll',
  'assessment.view', 'assessment.grade', 'assessment.resultView',
  'finance.view', 'finance.paymentCreate', 'finance.refundRequest', 'finance.receiptIssue',
  'system.passwordReset', 'system.permissionView',
  // 비포함: finance.refundApprove/settlementConfirm/settingUpdate, assessment.create/publish(원칙 4), system.permissionUpdate/logoUpdate
];

// 강사: 본인 담당 학생/반/시험 범위만(원칙 5). assessment.create/publish 제외(원칙 4 — 최고관리자/원장 전용).
//       student.passwordReset은 본인 담당 학생 한정이며, 보호자/타 강사·직원/최고관리자 초기화는 canResetPassword에서 차단(원칙 6/7/9).
const TEACHER_PERMS: PermissionKey[] = [
  'student.view', 'student.update', 'student.passwordReset',
  'class.view',
  'attendance.view', 'attendance.check', 'attendance.update', // 본인 반 (viewAll 없음)
  'assessment.view', 'assessment.grade', 'assessment.resultView', 'assessment.resultCorrect',
  // 비포함: assessment.create, assessment.publish — 시험 생성/발행 권한은 최고관리자·원장만(원칙 4)
  // 비포함: 모든 finance.*, attendance.viewAll
];

// 학생/보호자: 현재 Admin Back Office 운영 권한그룹이 아니라 향후 포털용 조회 권한으로만 존재(원칙 10).
const STUDENT_PERMS: PermissionKey[] = [
  'student.view', 'attendance.view', 'assessment.resultView',
];

const GUARDIAN_PERMS: PermissionKey[] = [
  'student.view', 'attendance.view', 'assessment.resultView', 'finance.view',
];

/** 직급별 기본 권한 (단일 소스) */
export const DEFAULT_PERMISSIONS_BY_POSITION: Record<Position, PermissionKey[]> = {
  SUPER_ADMIN: ALL,
  DIRECTOR: DIRECTOR_PERMS,
  VICE_DIRECTOR: VICE_DIRECTOR_PERMS,
  HEAD_MANAGER: HEAD_MANAGER_PERMS,
  TEAM_LEAD: TEAM_LEAD_PERMS,
  TEACHER: TEACHER_PERMS,
  STAFF: STAFF_PERMS,
  STUDENT: STUDENT_PERMS,
  GUARDIAN: GUARDIAN_PERMS,
};

/** 직급 기본 권한그룹 id 규칙: `${Position}_DEFAULT` */
export function defaultPermissionGroupId(position: Position): string {
  return `${position}_DEFAULT`;
}

/** 직급별 기본 권한그룹 목록 — PermissionSettings.tsx(직급별 권한설정)의 초기 데이터 */
export const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [...POSITIONS, ...PORTAL_ONLY_POSITIONS].map((p) => ({
  id: defaultPermissionGroupId(p),
  label: POSITION_LABEL[p],
  basePosition: p,
  permissions: [...DEFAULT_PERMISSIONS_BY_POSITION[p]],
  isDefault: true,
}));

// ────────────────────────────────────────────────────────────
// 하위호환 — AccountType 기준 매트릭스(혼합 직급을 갖는 STAFF 계열은 '행정' 직급값으로 대표)
// ────────────────────────────────────────────────────────────
// TODO(account-type-default): STAFF AccountType 안에 여러 직급(부원장/실장/팀장/행정)이 존재하므로,
//                             AccountType만으로 기본 권한을 결정하는 이 매핑은 데모 계정 시딩 등
//                             "직급이 아직 없는" 경우의 폴백 용도로만 남겨둔다. 실제 권한 판단은
//                             항상 AuthUser.permissions(권한그룹에서 해석된 결과)를 사용해야 한다.
export const DEFAULT_PERMISSIONS: Record<AccountType, PermissionKey[]> = {
  SUPER_ADMIN: DEFAULT_PERMISSIONS_BY_POSITION.SUPER_ADMIN,
  DIRECTOR: DEFAULT_PERMISSIONS_BY_POSITION.DIRECTOR,
  STAFF: DEFAULT_PERMISSIONS_BY_POSITION.STAFF,
  TEACHER: DEFAULT_PERMISSIONS_BY_POSITION.TEACHER,
  STUDENT: DEFAULT_PERMISSIONS_BY_POSITION.STUDENT,
  GUARDIAN: DEFAULT_PERMISSIONS_BY_POSITION.GUARDIAN,
};

/** Back Office 내부 사용자(운영메모 등 내부 기록 열람 대상) */
export function isBackOfficeType(t: AccountType): boolean {
  return t === 'SUPER_ADMIN' || t === 'DIRECTOR' || t === 'STAFF';
}
