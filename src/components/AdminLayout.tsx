// AXIS LMS v1.2 - Admin Back Office Layout
// Design: Structured Authority - Slate-900 sidebar + Slate-50 main area
// 메뉴 노출은 RBAC(AuthContext.can)을 따른다. 시스템설정 하위: 학원정보관리 / 권한설정 / 비밀번호 초기화 관리.

import { Link, useLocation } from 'wouter';
import {
  Users, BookOpen, BarChart2, Settings, ChevronRight, CalendarCheck,
  Building2, ShieldCheck, KeyRound, GraduationCap, Bell, Wallet, Trophy, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionKey, POSITION_LABEL, canAccessGrowth, canManageEmblems, canManageRivals } from '@/lib/rbac';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requires?: PermissionKey; // 최상위 메뉴 노출에 필요한 권한(없으면 항상 노출 — 하위 children이 개별 게이트)
  /** PermissionKey 기반이 아닌 AccountType 기반 가시성 판단이 필요할 때 사용 */
  requiresFn?: (can: (k: PermissionKey) => boolean, accountType: string) => boolean;
  children?: { label: string; path: string; icon?: React.ReactNode; requires?: PermissionKey }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: '학생관리',
    path: '/students',
    icon: <Users size={16} />,
    requires: 'student.view',
    children: [
      { label: '학생 등록', path: '/students/new', requires: 'student.create' },
      { label: '학생 목록', path: '/students', requires: 'student.view' },
    ],
  },
  {
    label: '직원관리',
    path: '/employees',
    icon: <Briefcase size={16} />,
    requires: 'employee.view',
    children: [
      { label: '직원 등록', path: '/employees?new=1', requires: 'employee.create' },
      { label: '직원 목록', path: '/employees', requires: 'employee.view' },
    ],
  },
  {
    label: '반관리',
    path: '/classes',
    icon: <BookOpen size={16} />,
    requires: 'class.view',
    children: [
      { label: '반 등록', path: '/classes?new=1', requires: 'class.create' },
      { label: '반 목록', path: '/classes', requires: 'class.view' },
    ],
  },
  {
    label: '출결관리',
    path: '/attendance',
    icon: <CalendarCheck size={16} />,
    requires: 'attendance.view',
    children: [
      { label: '출결체크', path: '/attendance/check', requires: 'attendance.check' },
      { label: '출결현황', path: '/attendance', requires: 'attendance.view' },
    ],
  },
  {
    label: '성적관리',
    path: '/scores',
    icon: <BarChart2 size={16} />,
    requires: 'assessment.view',
  },
  {
    label: '재무관리',
    path: '/finance',
    icon: <Wallet size={16} />,
    requires: 'finance.view', // SUPER_ADMIN/DIRECTOR/STAFF만 보유 — 부원장/실장/팀장/강사/학생/보호자는 메뉴 자체가 노출되지 않음
    children: [
      { label: '수납관리', path: '/finance/payments', requires: 'finance.view' },
      { label: '환불관리', path: '/finance/refunds', requires: 'finance.view' },
      { label: '미납관리', path: '/finance/unpaid', requires: 'finance.view' },
      { label: '정산관리', path: '/finance/settlements', requires: 'finance.view' },
      { label: '통계', path: '/finance/statistics', requires: 'finance.view' },
    ],
  },
  {
    label: '성장관리',
    path: '/growth',
    icon: <Trophy size={16} />,
    // PermissionKey가 아닌 AccountType 기반 권한 — canAccessGrowth 사용
    requiresFn: (_can, accountType) => canAccessGrowth(accountType as import('@/lib/rbac').AccountType),
    children: [
      { label: '성장현황', path: '/growth/overview' },
      { label: '엠블럼관리', path: '/growth/emblems' },
      { label: '라이벌관리', path: '/growth/rivals' },
    ],
  },
  {
    label: '알림관리',
    path: '/notifications',
    icon: <Bell size={16} />,
    requires: 'notification.view', // SUPER_ADMIN/DIRECTOR/STAFF만 보유 — TEACHER/STUDENT/GUARDIAN은 메뉴 노출 안 됨
    children: [
      { label: '발송이력', path: '/notifications/history', requires: 'notification.view' },
      { label: '템플릿관리', path: '/notifications/templates', requires: 'notification.view' },
      { label: '알림설정', path: '/notifications/settings', requires: 'notification.view' },
    ],
  },
  {
    label: '시스템설정',
    path: '/settings',
    icon: <Settings size={16} />,
    // 최상위는 하위 중 하나라도 권한이 있으면 노출(아래 filter 로직에서 처리)
    children: [
      { label: '학원정보관리', path: '/settings/academy', icon: <Building2 size={13} />, requires: 'system.logoUpdate' },
      { label: '권한설정', path: '/settings/permissions', icon: <ShieldCheck size={13} />, requires: 'system.permissionView' },
      { label: '비밀번호 초기화 관리', path: '/settings/password-reset', icon: <KeyRound size={13} />, requires: 'system.passwordReset' },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

export default function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [location] = useLocation();
  const { can, currentUser, loginAs, devUsers } = useAuth();

  // 메뉴 가시성: children이 있으면 "하위 중 권한 보유 항목이 1개 이상"일 때 상위 노출.
  // children이 없고 requires만 있으면 그 권한 보유 시 노출.
  // map 콜백의 반환 타입을 명시적으로 `NavItem | null`로 고정한다 — 이게 없으면 `{ ...item, children: visibleChildren }`의
  // children이 TS에 의해 "옵셔널이 아닌 필드"로 추론되어 NavItem(children이 옵셔널)과 구조적으로 어긋나고,
  // 아래 filter의 타입 단정(`x is NavItem`)이 TS2677로 거부되며 이후 모든 item 접근에 TS18047이 연쇄된다.
  const visibleNav = NAV_ITEMS
    .map((item): NavItem | null => {
      const visibleChildren = item.children?.filter((c) => !c.requires || can(c.requires));
      let visible: boolean;
      if (item.requiresFn) {
        visible = item.requiresFn(can, currentUser.accountType);
      } else if (item.children) {
        visible = !!(visibleChildren && visibleChildren.length > 0);
      } else {
        visible = !item.requires || can(item.requires);
      }
      return visible ? { ...item, children: visibleChildren } : null;
    })
    .filter((x): x is NavItem => x !== null);

  const isActive = (path: string) => {
    if (path === '/students') return location === '/students' || location.startsWith('/students/');
    if (path === '/employees') return location === '/employees' || location.startsWith('/employees/');
    if (path === '/classes') return location === '/classes' || location.startsWith('/classes/');
    if (path === '/attendance') return location === '/attendance' || location.startsWith('/attendance/');
    if (path === '/settings') return location.startsWith('/settings');
    if (path === '/growth') return location.startsWith('/growth');
    return location.startsWith(path);
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.984 0.003 247)' }}>
      {/* Sidebar */}
      <aside className="axis-sidebar flex flex-col fixed left-0 top-0 h-full z-30" style={{ width: 240 }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'oklch(0.22 0.02 250)', minHeight: 56 }}>
          <div className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, background: 'oklch(0.511 0.262 276.966)' }}>
            <GraduationCap size={18} color="white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide">AXIS LMS</div>
            <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>v1.2 관리자</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.45 0.015 250)' }}>
              메뉴
            </span>
          </div>
          {visibleNav.map((item) => (
            <div key={item.path}>
              <Link href={item.path}>
                <div
                  className={cn(
                    'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer',
                    isActive(item.path)
                      ? 'text-white'
                      : 'hover:text-white'
                  )}
                  style={{
                    background: isActive(item.path) ? 'oklch(0.511 0.262 276.966)' : 'transparent',
                    color: isActive(item.path) ? 'white' : 'oklch(0.7 0.015 250)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.path)) {
                      (e.currentTarget as HTMLElement).style.background = 'oklch(0.2 0.025 250)';
                      (e.currentTarget as HTMLElement).style.color = 'white';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.path)) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'oklch(0.7 0.015 250)';
                    }
                  }}
                >
                  <span style={{ opacity: isActive(item.path) ? 1 : 0.7 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
              {/* Sub items */}
              {item.children && isActive(item.path) && (
                <div className="ml-5 mt-0.5 mb-1">
                  {item.children.map(child => (
                    <Link key={child.path} href={child.path}>
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all duration-150 cursor-pointer"
                        style={{
                          color: location === child.path ? 'white' : 'oklch(0.55 0.015 250)',
                          background: location === child.path ? 'oklch(0.22 0.025 250)' : 'transparent',
                        }}
                        onMouseEnter={e => {
                          if (location !== child.path) {
                            (e.currentTarget as HTMLElement).style.color = 'oklch(0.85 0.01 250)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (location !== child.path) {
                            (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.015 250)';
                          }
                        }}
                      >
                        <ChevronRight size={10} />
                        {child.label}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer — 현재 로그인 사용자(AuthContext.currentUser) */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'oklch(0.22 0.02 250)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{currentUser.name}</div>
              <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{POSITION_LABEL[currentUser.position]}</div>
            </div>
          </div>
          {/* ⚠ DEV/TEST ONLY: 계정 전환 — 운영 배포 시 실제 로그인 세션으로 교체하고 이 셀렉터는 제거할 것. */}
          <label className="flex items-center gap-1.5 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'oklch(0.7 0.18 80)', color: 'oklch(0.2 0.02 250)' }}>DEV</span>
            <select
              value={currentUser.id}
              onChange={(e) => loginAs(e.target.value)}
              className="flex-1 text-xs rounded px-1.5 py-1 bg-transparent"
              style={{ border: '1px solid oklch(0.3 0.02 250)', color: 'oklch(0.8 0.01 250)' }}
            >
              {devUsers.map((u) => <option key={u.id} value={u.id} style={{ color: 'black' }}>{POSITION_LABEL[u.position]} · {u.name}</option>)}
            </select>
          </label>
        </div>
      </aside>

      {/* Main Content */}
      <div className="axis-main flex flex-col" style={{ marginLeft: 240 }}>
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-6" style={{ height: 56, borderColor: 'oklch(0.9 0.008 250)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>
            {breadcrumbs ? (
              breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight size={12} />}
                  {b.path ? (
                    <Link href={b.path}>
                      <span className="hover:text-primary cursor-pointer transition-colors" style={{ color: i === breadcrumbs.length - 1 ? 'oklch(0.2 0.02 250)' : undefined }}>
                        {b.label}
                      </span>
                    </Link>
                  ) : (
                    <span style={{ color: i === breadcrumbs.length - 1 ? 'oklch(0.2 0.02 250)' : undefined, fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>
                      {b.label}
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{title}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md transition-colors hover:bg-slate-100">
              <Bell size={16} style={{ color: 'oklch(0.5 0.015 250)' }} />
            </button>
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
