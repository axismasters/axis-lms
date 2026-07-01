// AXIS LMS v1.2 - AuthContext (Account Engine + RBAC Foundation)
// ViewerContext(임시 role placeholder)를 대체한다.
//
// Phase 3D v2: 첫 화면 로그인 페이지 + 원장/부원장 관리자모드/강사모드 전환 추가.
//   - 실제 백엔드 인증 서버는 없으므로, DEV_USERS를 계정 원천으로 그대로 사용하되
//     login(phone, password)로 휴대폰번호 + 데모 비밀번호(휴대폰 뒤 4자리) 검증을 거치게 했다.
//     TODO(auth): 실제 로그인 연동 시 login()의 검증 로직만 실제 인증 서버 호출로 교체하면 되고,
//     나머지 세션/모드 상태 관리 구조는 그대로 재사용 가능하도록 설계했다.
//   - loginAs(dev 전용 즉시 전환)는 그대로 유지 — AdminLayout/DevRoleSwitcher가 이미 사용 중이며,
//     운영 첫 화면(로그인 페이지)에는 노출되지 않으므로 안전하다.

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import {
  AccountType, DataScope, Position, PermissionKey, AuthUser,
  DEFAULT_DATA_SCOPE, DEFAULT_PERMISSIONS_BY_POSITION, defaultPermissionGroupId,
  POSITION_TO_ACCOUNT_TYPE,
} from '@/lib/rbac';
import { Student } from '@/lib/dummyData';
import { studentIdsInClasses } from '@/lib/studentDerived';

// ────────────────────────────────────────────────────────────
// DEV/테스트 시드 계정 — 운영 배포 시 실제 로그인 세션으로 교체
// ────────────────────────────────────────────────────────────
function makeUser(partial: Omit<AuthUser, 'permissions' | 'dataScope' | 'permissionGroupId' | 'accountType'> & { position: Position; permissions?: PermissionKey[] }): AuthUser {
  const { position } = partial;
  return {
    ...partial,
    accountType: POSITION_TO_ACCOUNT_TYPE[position],
    permissionGroupId: defaultPermissionGroupId(position),
    permissions: partial.permissions ?? DEFAULT_PERMISSIONS_BY_POSITION[position],
    dataScope: DEFAULT_DATA_SCOPE[POSITION_TO_ACCOUNT_TYPE[position]],
  };
}

export const DEV_USERS: AuthUser[] = [
  makeUser({ id: 'u-super', name: '한태준', phone: '010-0000-0001', position: 'SUPER_ADMIN', assignedClassIds: [], assignedStudentIds: [], status: '활성' }),
  makeUser({ id: 'u-director', name: '원장님', phone: '010-0000-0002', position: 'DIRECTOR', assignedClassIds: [], assignedStudentIds: [], status: '활성' }),
  makeUser({ id: 'u-vice-director', name: '부원장님', phone: '010-0000-0007', position: 'VICE_DIRECTOR', assignedClassIds: [], assignedStudentIds: [], status: '활성' }),
  makeUser({ id: 'u-staff', name: '행정 담당', phone: '010-0000-0003', position: 'STAFF', assignedClassIds: [], assignedStudentIds: [], status: '활성' }),
  makeUser({
    id: 'u-teacher', name: '김민준', phone: '010-0000-0004', position: 'TEACHER',
    assignedClassIds: ['cls-001', 'cls-002'], assignedStudentIds: ['stu-001', 'stu-002', 'stu-003'], status: '활성',
  }),
  makeUser({
    id: 'u-student', name: '학생 데모', phone: '010-0000-0005', position: 'STUDENT',
    assignedClassIds: [], assignedStudentIds: ['stu-001'], status: '활성',
  }),
  makeUser({
    id: 'u-guardian', name: '보호자 데모', phone: '010-0000-0006', position: 'GUARDIAN',
    assignedClassIds: [], assignedStudentIds: ['stu-001', 'stu-003'], status: '활성',
  }),
];

// 기본 로그인 사용자: 안전한 기본값(가장 낮은 권한). 실제 로그인 전 화면이 과노출되지 않도록 STUDENT로 둔다.
const FALLBACK_USER: AuthUser = DEV_USERS.find((u) => u.position === 'STUDENT')!;

// ────────────────────────────────────────────────────────────
// 세션 저장(데모) — "로그인 상태 유지" 체크 시 localStorage, 아니면 sessionStorage.
// ────────────────────────────────────────────────────────────
const SESSION_KEY = 'axis_lms_session_user_id';

function readPersistedUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writePersistedUserId(userId: string, remember: boolean) {
  try {
    if (remember) {
      localStorage.setItem(SESSION_KEY, userId);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, userId);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch { /* noop — storage 비활성 환경에서도 로그인 자체는 동작해야 함 */ }
}

function clearPersistedUserId() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* noop */ }
}

/** 데모 비밀번호 규칙: 휴대폰번호 숫자만 남긴 뒤 마지막 4자리. 실제 인증 서버 도입 전까지만 사용. */
function demoPasswordFor(phone: string): string {
  return phone.replace(/[^0-9]/g, '').slice(-4);
}

// ────────────────────────────────────────────────────────────
// 관리자/강사 모드 (원장·부원장 전용 — 하나의 계정으로 두 화면을 오간다)
// ────────────────────────────────────────────────────────────
export type ActiveMode = 'ADMIN_MODE' | 'TEACHER_MODE';

function canSwitchModeFor(position: Position): boolean {
  return position === 'DIRECTOR' || position === 'VICE_DIRECTOR';
}

// ────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────
interface AuthContextType {
  currentUser: AuthUser;
  isAuthenticated: boolean;
  login: (phone: string, password: string, remember: boolean) => boolean; // 성공 여부 반환
  logout: () => void;

  devUsers: AuthUser[];          // DEV 전환용 — 운영 배포 시 노출 제거
  loginAs: (userId: string) => void; // DEV 전용 임시 전환. TODO(auth): 실제 로그인으로 교체.

  activeMode: ActiveMode;
  canSwitchMode: boolean;        // 현재 계정이 관리자모드/강사모드 전환이 가능한지(원장·부원장)
  setActiveMode: (mode: ActiveMode) => void;

  can: (key: PermissionKey) => boolean;
  canAccessStudent: (studentId: string) => boolean;
  canAccessClass: (classId: string) => boolean;
  canAccessExam: (examId: string, examClassId?: string) => boolean;
  canResetPassword: (targetAccountId: string, targetAccountType: AccountType, targetStudentId?: string) => boolean;
  canViewFinance: (studentId: string) => boolean;
  canPublishExamResult: (examId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, initialUserId, students }: { children: ReactNode; initialUserId?: string; students?: Student[] }) {
  // 로그인 전(비인증) 상태는 userId === null로 표현한다.
  const [userId, setUserId] = useState<string | null>(() => initialUserId ?? readPersistedUserId());
  const [activeMode, setActiveModeState] = useState<ActiveMode>('ADMIN_MODE');

  const isAuthenticated = userId !== null;

  const currentUser = useMemo(() => {
    const base = (userId && DEV_USERS.find((u) => u.id === userId)) || FALLBACK_USER;
    // 강사: assignedStudentIds = 본인 명시 배정 학생 ∪ assignedClassIds에 현재 수강중인 학생 (반 배정이 기준의 원천)
    if (base.accountType === 'TEACHER' && students) {
      const fromClasses = studentIdsInClasses(students, base.assignedClassIds);
      const merged = Array.from(new Set([...base.assignedStudentIds, ...fromClasses]));
      return { ...base, assignedStudentIds: merged };
    }
    return base;
  }, [userId, students]);

  const canSwitchMode = canSwitchModeFor(currentUser.position);

  const login = (phone: string, password: string, remember: boolean): boolean => {
    const found = DEV_USERS.find((u) => u.phone === phone.trim());
    if (!found || found.status !== '활성') return false;
    if (password !== demoPasswordFor(found.phone)) return false;
    setUserId(found.id);
    setActiveModeState('ADMIN_MODE'); // 원장은 기본 ADMIN_MODE(요구사항)
    writePersistedUserId(found.id, remember);
    return true;
  };

  const logout = () => {
    setUserId(null);
    setActiveModeState('ADMIN_MODE');
    clearPersistedUserId();
  };

  const setActiveMode = (mode: ActiveMode) => {
    if (!canSwitchModeFor(currentUser.position)) return; // 원장/부원장 외에는 전환 무시
    setActiveModeState(mode);
  };

  const can = (key: PermissionKey) => currentUser.status === '활성' && currentUser.permissions.includes(key);

  // dataScope 기준 학생 접근 판별
  const canAccessStudent = (studentId: string): boolean => {
    if (currentUser.status !== '활성') return false;
    switch (currentUser.dataScope) {
      case 'ALL_ACADEMY': return true;
      case 'ASSIGNED_CLASSES': return currentUser.assignedStudentIds.includes(studentId); // 반 배정은 학생관리 쪽에서 assignedStudentIds로 사전 집계됨
      case 'ASSIGNED_STUDENTS': return currentUser.assignedStudentIds.includes(studentId);
      case 'OWN_DATA': return currentUser.assignedStudentIds.includes(studentId); // 학생 본인 id
      case 'CHILDREN_ONLY': return currentUser.assignedStudentIds.includes(studentId); // 보호자의 자녀 목록
      case 'NONE': default: return false;
    }
  };

  const canAccessClass = (classId: string): boolean => {
    if (currentUser.status !== '활성') return false;
    switch (currentUser.dataScope) {
      case 'ALL_ACADEMY': return true;
      case 'ASSIGNED_CLASSES': return currentUser.assignedClassIds.includes(classId);
      default: return false; // 학생/보호자/ASSIGNED_STUDENTS 범위는 반 단위 접근 없음
    }
  };

  // 시험 접근: 전체 범위면 통과, 반 한정 범위면 해당 시험이 속한 반(examClassId)이 배정 범위인지 확인
  const canAccessExam = (_examId: string, examClassId?: string): boolean => {
    if (currentUser.status !== '활성') return false;
    if (currentUser.dataScope === 'ALL_ACADEMY') return true;
    if (currentUser.dataScope === 'ASSIGNED_CLASSES') return examClassId ? currentUser.assignedClassIds.includes(examClassId) : false;
    return false;
  };

  // 비밀번호 초기화 — 절대 전체/일괄 초기화 없음. 대상 1건 + 권한 + 범위를 모두 통과해야 함.
  // AXIS 확정 원칙 6/7/9:
  //   - STUDENT 대상: targetStudentId가 반드시 있어야 하고, canAccessStudent(targetStudentId)를 통과해야 한다.
  //     targetStudentId가 없으면(식별 불가) 무조건 false — "범위 체크를 건너뛰고 통과"되는 구멍을 차단한다.
  //   - GUARDIAN 대상: system.passwordReset 권한 + ALL_ACADEMY 범위를 모두 가진 경우만 허용한다.
  //     강사의 student.passwordReset 권한으로는 보호자 계정을 초기화할 수 없다.
  //   - 그 외(직원 계열: DIRECTOR/STAFF 등) 대상: employee.passwordReset 또는 system.passwordReset 권한 +
  //     ALL_ACADEMY 범위를 가진 경우만 허용한다(동료 직원을 강사가 초기화할 수 없음).
  //   - SUPER_ADMIN 대상: 타인이 초기화할 수 없으므로 항상 false를 유지한다.
  const canResetPassword = (_targetAccountId: string, targetAccountType: AccountType, targetStudentId?: string): boolean => {
    if (currentUser.status !== '활성') return false;
    if (targetAccountType === 'SUPER_ADMIN') return false; // 최고관리자 계정은 타인이 초기화할 수 없음(절대 금지)

    if (targetAccountType === 'STUDENT') {
      if (!targetStudentId) return false; // 대상 학생 식별자가 없으면 범위 확인이 불가능하므로 항상 거부
      const hasPerm = can('student.passwordReset') || can('system.passwordReset');
      if (!hasPerm) return false;
      return canAccessStudent(targetStudentId);
    }

    if (targetAccountType === 'GUARDIAN') {
      // 보호자 계정 초기화는 system.passwordReset 보유자 + 전체범위(ALL_ACADEMY)일 때만 허용한다.
      return can('system.passwordReset') && currentUser.dataScope === 'ALL_ACADEMY';
    }

    // 직원 계열(DIRECTOR/STAFF 등): 전체범위(ALL_ACADEMY) 보유자만 (강사가 동료 직원 비번 초기화는 불가)
    const hasStaffPerm = can('employee.passwordReset') || can('system.passwordReset');
    if (!hasStaffPerm) return false;
    return currentUser.dataScope === 'ALL_ACADEMY';
  };

  // 재무 조회: finance.view 권한 + 해당 학생 접근 범위를 모두 통과해야 함
  const canViewFinance = (studentId: string): boolean => can('finance.view') && canAccessStudent(studentId);

  const canPublishExamResult = (examId: string): boolean => can('assessment.publish') && canAccessExam(examId);

  return (
    <AuthContext.Provider value={{
      currentUser, isAuthenticated, login, logout,
      devUsers: DEV_USERS, loginAs: setUserId,
      activeMode, canSwitchMode, setActiveMode,
      can, canAccessStudent, canAccessClass, canAccessExam, canResetPassword, canViewFinance, canPublishExamResult,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Provider 누락 시에도 안전한 기본값으로 동작(최소 권한)
    const fallback: AuthContextType = {
      currentUser: FALLBACK_USER, isAuthenticated: false, login: () => false, logout: () => {},
      devUsers: DEV_USERS, loginAs: () => {},
      activeMode: 'ADMIN_MODE', canSwitchMode: false, setActiveMode: () => {},
      can: () => false, canAccessStudent: () => false, canAccessClass: () => false,
      canAccessExam: () => false, canResetPassword: () => false, canViewFinance: () => false, canPublishExamResult: () => false,
    };
    return fallback;
  }
  return ctx;
}
