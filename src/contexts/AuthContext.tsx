// AXIS LMS v1.2 - AuthContext (Account Engine + RBAC Foundation)
// ViewerContext(임시 role placeholder)를 대체한다. 실제 로그인 연동 전까지는
// DEV/테스트용 사용자 전환만 제공하며, 기본 로그인 사용자는 "비활성/최소권한"으로 안전하게 설정한다.
//
// TODO(auth): 실제 로그인 연동 시 loginAs를 세션 발급 로직으로 교체하고,
//             DEV 전환 UI(있다면)는 운영 배포 전 제거할 것.

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
// Context
// ────────────────────────────────────────────────────────────
interface AuthContextType {
  currentUser: AuthUser;
  devUsers: AuthUser[];          // DEV 전환용 — 운영 배포 시 노출 제거
  loginAs: (userId: string) => void; // DEV 전용 임시 전환. TODO(auth): 실제 로그인으로 교체.

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
  const [userId, setUserId] = useState(initialUserId ?? FALLBACK_USER.id);

  const currentUser = useMemo(() => {
    const base = DEV_USERS.find((u) => u.id === userId) ?? FALLBACK_USER;
    // 강사: assignedStudentIds = 본인 명시 배정 학생 ∪ assignedClassIds에 현재 수강중인 학생 (반 배정이 기준의 원천)
    if (base.accountType === 'TEACHER' && students) {
      const fromClasses = studentIdsInClasses(students, base.assignedClassIds);
      const merged = Array.from(new Set([...base.assignedStudentIds, ...fromClasses]));
      return { ...base, assignedStudentIds: merged };
    }
    return base;
  }, [userId, students]);

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
      currentUser, devUsers: DEV_USERS, loginAs: setUserId,
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
      currentUser: FALLBACK_USER, devUsers: DEV_USERS, loginAs: () => {},
      can: () => false, canAccessStudent: () => false, canAccessClass: () => false,
      canAccessExam: () => false, canResetPassword: () => false, canViewFinance: () => false, canPublishExamResult: () => false,
    };
    return fallback;
  }
  return ctx;
}
