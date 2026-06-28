// AXIS LMS v1.2 - RoleRoute
// 역할별 진입 경로 결정 및 가드.
// RBAC(권한 제어)와 분리 — 이 파일은 "어떤 포털로 이동하는가"만 담당.

import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { AccountType } from '@/lib/rbac';

// ─────────────────────────────────────────────
// 역할별 기본 진입 경로
// ─────────────────────────────────────────────
export const ROLE_HOME: Record<AccountType, string> = {
  SUPER_ADMIN: '/admin',
  DIRECTOR:    '/admin',
  STAFF:       '/admin',
  TEACHER:     '/teacher',
  STUDENT:     '/student',
  GUARDIAN:    '/parent',
};

/** 현재 로그인 사용자의 기본 홈 경로 반환 */
export function useRoleHome(): string {
  const { currentUser } = useAuth();
  return ROLE_HOME[currentUser.accountType] ?? '/admin';
}

// ─────────────────────────────────────────────
// RoleRoute: 특정 accountType만 허용, 아니면 역할 홈으로 리다이렉트
// ─────────────────────────────────────────────
interface RoleRouteProps {
  allow: AccountType[];
  children: React.ReactNode;
}

export function RoleRoute({ allow, children }: RoleRouteProps) {
  const { currentUser } = useAuth();
  if (allow.includes(currentUser.accountType)) {
    return <>{children}</>;
  }
  const home = ROLE_HOME[currentUser.accountType] ?? '/admin';
  return <Redirect to={home} />;
}

// ─────────────────────────────────────────────
// RootRedirect: / 접근 시 역할 홈으로 자동 이동
// ─────────────────────────────────────────────
export function RootRedirect() {
  const home = useRoleHome();
  return <Redirect to={home} />;
}
