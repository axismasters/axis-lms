// AXIS LMS v1.2 - RoleRoute
// 역할별 진입 경로 결정 및 가드.
// RBAC(권한 제어)와 분리 — 이 파일은 "어떤 포털로 이동하는가"만 담당.
//
// Phase 3D v2:
//   - 비인증 상태(isAuthenticated === false)면 어떤 포털 경로든 무조건 "/"로 보낸다.
//     App.tsx의 "/" 라우트는 RootRedirect가 담당하는데, RootRedirect 자체가 비인증 시
//     로그인 페이지를 렌더링하도록 바뀌었으므로 이것으로 "첫 화면 = 로그인" 요구사항과
//     "직접 URL로 들어와도 로그인 없이는 어떤 포털도 볼 수 없다"가 함께 만족된다.
//   - 원장/부원장이 activeMode를 TEACHER_MODE로 전환한 경우, accountType은 여전히
//     DIRECTOR(또는 STAFF)이지만 /teacher/** 접근을 허용한다(하나의 계정으로 관리자모드/
//     강사모드를 오간다는 요구사항 — 별도 강사 계정을 만들지 않는다).

import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { AccountType } from '@/lib/rbac';
import LoginPage from '@/pages/LoginPage';

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
  const { currentUser, isAuthenticated, activeMode } = useAuth();

  // 비인증 상태 — 로그인 페이지(= "/")로 보낸다.
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // 원장/부원장이 TEACHER_MODE인 동안은 /teacher/** 접근을 예외적으로 허용한다.
  const directorActingAsTeacher =
    (currentUser.position === 'DIRECTOR' || currentUser.position === 'VICE_DIRECTOR') &&
    activeMode === 'TEACHER_MODE' &&
    allow.includes('TEACHER');

  if (allow.includes(currentUser.accountType) || directorActingAsTeacher) {
    return <>{children}</>;
  }
  const home = ROLE_HOME[currentUser.accountType] ?? '/admin';
  return <Redirect to={home} />;
}

// ─────────────────────────────────────────────
// RootRedirect: / 접근 시 역할 홈으로 자동 이동(비인증이면 로그인 화면)
// ─────────────────────────────────────────────
export function RootRedirect() {
  const { isAuthenticated } = useAuth();
  const home = useRoleHome();

  if (!isAuthenticated) {
    // App.tsx(불변)를 건드리지 않고 "/" 경로에서 첫 화면을 로그인 페이지로 만드는 유일한 지점이다.
    return <LoginPage />;
  }

  return <Redirect to={home} />;
}
