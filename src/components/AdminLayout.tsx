// AXIS LMS v1.2 - Admin Back Office Layout
// [Phase 3D v3-r7-r1] Design: AXIS 밝은 프리미엄 브랜드 톤 — Navy(#040D1E) 사이드바
// 내비게이션 레일 + Ivory/Warm White 메인 콘텐츠 영역. 화면 전체를 다크 테마로 만들지
// 않는다(메인 콘텐츠는 항상 밝은 배경).
// Mobile/App Optimization Readiness v1: 모바일 폭에서 collapsible sidebar 대응
// Role Separation v1: 모든 관리자 경로 /admin/** 기준으로 업데이트.

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Users, BookOpen, BarChart2, Settings, ChevronRight, CalendarCheck,
  Building2, ShieldCheck, KeyRound, GraduationCap, Bell, Wallet, Trophy, Briefcase,
  Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionKey, POSITION_LABEL, canAccessGrowth, canExportAcademyWideScores } from '@/lib/rbac';
import { AxisMark } from '@/components/brand/AxisMark';
import { isFinanceEnabled, isRivalEnabled } from '@/lib/systemFeatureFlags';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requires?: PermissionKey;
  requiresFn?: (can: (k: PermissionKey) => boolean, accountType: string) => boolean;
  children?: {
    label: string;
    path: string;
    icon?: React.ReactNode;
    requires?: PermissionKey;
    requiresFn?: (can: (k: PermissionKey) => boolean, accountType: string) => boolean;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: '학생관리',
    path: '/admin/students',
    icon: <Users size={16} />,
    requires: 'student.view',
    children: [
      { label: '학생 등록', path: '/admin/students/new', requires: 'student.create' },
      { label: '학생 목록', path: '/admin/students', requires: 'student.view' },
    ],
  },
  {
    label: '직원관리',
    path: '/admin/employees',
    icon: <Briefcase size={16} />,
    requires: 'employee.view',
    children: [
      { label: '직원 등록', path: '/admin/employees?new=1', requires: 'employee.create' },
      { label: '직원 목록', path: '/admin/employees', requires: 'employee.view' },
    ],
  },
  {
    label: '반관리',
    path: '/admin/classes',
    icon: <BookOpen size={16} />,
    requires: 'class.view',
    children: [
      { label: '반 등록', path: '/admin/classes?new=1', requires: 'class.create' },
      { label: '반 목록', path: '/admin/classes', requires: 'class.view' },
    ],
  },
  {
    label: '출결관리',
    path: '/admin/attendance',
    icon: <CalendarCheck size={16} />,
    requires: 'attendance.view',
    children: [
      { label: '출결체크', path: '/admin/attendance/check', requires: 'attendance.check' },
      { label: '출결현황', path: '/admin/attendance', requires: 'attendance.view' },
    ],
  },
  {
    label: '시험 및 성적 관리',
    path: '/admin/scores',
    icon: <BarChart2 size={16} />,
    requires: 'assessment.view',
    children: [
      { label: '시험 목록', path: '/admin/scores', requires: 'assessment.view' },
      { label: '성적 출력', path: '/admin/scores/export', requiresFn: (_can, accountType) => canExportAcademyWideScores(accountType as import('@/lib/rbac').AccountType) },
    ],
  },
  {
    label: '재무관리',
    path: '/admin/finance',
    icon: <Wallet size={16} />,
    // [Phase 3D v3-r12] financeEnabled 게이트 — OFF면 메뉴 자체가 사라진다(하위 항목도 전부).
    requiresFn: (can, _accountType) => can('finance.view') && isFinanceEnabled(),
    children: [
      { label: '수납관리', path: '/admin/finance/payments', requiresFn: (can) => can('finance.view') && isFinanceEnabled() },
      { label: '환불관리', path: '/admin/finance/refunds', requiresFn: (can) => can('finance.view') && isFinanceEnabled() },
      { label: '미납관리', path: '/admin/finance/unpaid', requiresFn: (can) => can('finance.view') && isFinanceEnabled() },
      { label: '정산관리', path: '/admin/finance/settlements', requiresFn: (can) => can('finance.view') && isFinanceEnabled() },
      { label: '통계', path: '/admin/finance/statistics', requiresFn: (can) => can('finance.view') && isFinanceEnabled() },
    ],
  },
      { label: '성장관리',
        path: '/admin/growth',
        icon: <Trophy size={16} />,
        requiresFn: (_can, accountType) => canAccessGrowth(accountType as import('@/lib/rbac').AccountType),
        // [Phase 3D v3-r7] 성장관리 메뉴 비중 축소: 엠블럼 지급/라이벌 승패 같은 "운영"
        // 작업은 여기서 빼고 학생 상세 > 성장/진열장 탭에서 바로 처리한다(StudentDetail.tsx
        // GrowthShowcaseTab 참조). 이 메뉴에는 정책/템플릿/시즌 설정만 남긴다.
        children: [
          { label: '성장현황', path: '/admin/growth/overview' },
          { label: 'Rival 시즌 관리', path: '/admin/growth/rival-seasons', requiresFn: () => isRivalEnabled() },
          { label: '진열장 노출 정책', path: '/admin/growth/showcase-policy' },
        ],
      },
  {
    label: '대학추천/목표대학',
    path: '/admin/university-reports',
    icon: <GraduationCap size={16} />,
    requiresFn: (_can, accountType) => canAccessGrowth(accountType as import('@/lib/rbac').AccountType),
    children: [
      { label: '관리자 상세 리포트', path: '/admin/university-reports' },
    ],
  },
  {
    label: '알림관리',
    path: '/admin/notifications',
    icon: <Bell size={16} />,
    requires: 'notification.view',
    children: [
      { label: '발송이력', path: '/admin/notifications/history', requires: 'notification.view' },
      { label: '템플릿관리', path: '/admin/notifications/templates', requires: 'notification.view' },
      { label: '알림설정', path: '/admin/notifications/settings', requires: 'notification.view' },
    ],
  },
  {
    label: '시스템설정',
    path: '/admin/settings',
    icon: <Settings size={16} />,
    children: [
      { label: '학원정보관리', path: '/admin/settings/academy', icon: <Building2 size={13} />, requires: 'system.logoUpdate' },
      { label: '권한설정', path: '/admin/settings/permissions', icon: <ShieldCheck size={13} />, requires: 'system.permissionView' },
      { label: '비밀번호 초기화 관리', path: '/admin/settings/password-reset', icon: <KeyRound size={13} />, requires: 'system.passwordReset' },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

export default function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { can, currentUser, loginAs, devUsers, logout, activeMode, canSwitchMode, setActiveMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const visibleNav = NAV_ITEMS
    .map((item): NavItem | null => {
      const visibleChildren = item.children?.filter((c) =>
        c.requiresFn ? c.requiresFn(can, currentUser.accountType) : (!c.requires || can(c.requires))
      );
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
    if (path === '/admin/students') return location === '/admin/students' || location.startsWith('/admin/students/');
    if (path === '/admin/employees') return location === '/admin/employees' || location.startsWith('/admin/employees/');
    if (path === '/admin/classes') return location === '/admin/classes' || location.startsWith('/admin/classes/');
    if (path === '/admin/attendance') return location === '/admin/attendance' || location.startsWith('/admin/attendance/');
    if (path === '/admin/settings') return location.startsWith('/admin/settings');
    if (path === '/admin/growth') return location.startsWith('/admin/growth');
    return location.startsWith(path);
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'oklch(0.22 0.02 250)', minHeight: 56 }}>
        <AxisMark size={32} className="rounded-md flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm tracking-wide">AXIS LMS</div>
          <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>v1.2 관리자</div>
        </div>
        <button
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style={{ color: 'oklch(0.6 0.015 250)' }}
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 min-h-0 py-3 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.45 0.015 250)' }}>메뉴</span>
        </div>
        {visibleNav.map((item) => (
          <div key={item.path}>
            <Link href={item.path}>
              <div
                className={cn('flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer',
                  isActive(item.path) ? '' : 'hover:text-white')}
                style={{
                  background: isActive(item.path) ? '#C8A15A' : 'transparent',
                  color: isActive(item.path) ? '#040D1E' : 'oklch(0.7 0.015 250)',
                }}
                onMouseEnter={e => { if (!isActive(item.path)) { (e.currentTarget as HTMLElement).style.background = 'oklch(0.2 0.025 250)'; (e.currentTarget as HTMLElement).style.color = 'white'; } }}
                onMouseLeave={e => { if (!isActive(item.path)) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'oklch(0.7 0.015 250)'; } }}
              >
                <span style={{ opacity: isActive(item.path) ? 1 : 0.7 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
            {item.children && isActive(item.path) && (
              <div className="ml-5 mt-0.5 mb-1">
                {item.children.map(child => (
                  <Link key={child.path} href={child.path}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all duration-150 cursor-pointer"
                      style={{ color: location === child.path ? 'white' : 'oklch(0.55 0.015 250)', background: location === child.path ? 'oklch(0.22 0.025 250)' : 'transparent' }}
                      onMouseEnter={e => { if (location !== child.path) { (e.currentTarget as HTMLElement).style.color = 'oklch(0.85 0.01 250)'; } }}
                      onMouseLeave={e => { if (location !== child.path) { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.015 250)'; } }}
                    >
                      <ChevronRight size={10} />{child.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t" style={{ borderColor: 'oklch(0.22 0.02 250)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#C8A15A', color: '#040D1E' }}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white truncate">{currentUser.name}</div>
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{POSITION_LABEL[currentUser.position]}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs px-2 py-1 rounded-md flex-shrink-0 transition-colors hover:bg-white/5"
            style={{ color: 'oklch(0.6 0.015 250)' }}
          >
            로그아웃
          </button>
        </div>

        {/* Phase 3D v2: 원장/부원장 관리자모드/강사모드 전환 — 별도 강사 계정을 만들지 않고
            하나의 계정에서 두 화면을 오간다. */}
        {canSwitchMode && (
          <div className="flex gap-1 p-1 rounded-lg mb-2" style={{ background: 'oklch(0.2 0.025 250)' }}>
            {(['ADMIN_MODE', 'TEACHER_MODE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setActiveMode(mode);
                  navigate(mode === 'ADMIN_MODE' ? '/admin' : '/teacher');
                }}
                className="flex-1 text-xs py-1.5 rounded-md font-medium transition-colors"
                style={{
                  background: activeMode === mode ? '#C8A15A' : 'transparent',
                  color: activeMode === mode ? '#040D1E' : 'oklch(0.65 0.015 250)',
                }}
              >
                {mode === 'ADMIN_MODE' ? '관리자 모드' : '강사 모드'}
              </button>
            ))}
          </div>
        )}

        {/* ⚠ DEV/TEST ONLY */}
        <label className="flex items-center gap-1.5 mt-1">
          <span className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ background: 'oklch(0.7 0.18 80)', color: 'oklch(0.2 0.02 250)' }}>DEV</span>
          <select
            value={currentUser.id}
            onChange={(e) => loginAs(e.target.value)}
            className="flex-1 text-xs rounded px-1.5 py-1 bg-transparent min-w-0"
            style={{ border: '1px solid oklch(0.3 0.02 250)', color: 'oklch(0.8 0.01 250)' }}
          >
            {devUsers.map((u) => <option key={u.id} value={u.id} style={{ color: 'black' }}>{POSITION_LABEL[u.position]} · {u.name}</option>)}
          </select>
        </label>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.98 0.008 75)' }}>
      <aside className="axis-sidebar flex-col fixed left-0 top-0 z-30 hidden lg:flex" style={{ width: 240 }}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'oklch(0 0 0 / 0.5)' }}
          onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={cn('axis-sidebar flex flex-col fixed left-0 top-0 z-50 lg:hidden transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full')}
        style={{ width: 240 }} aria-hidden={!mobileOpen}
      >
        <SidebarContent />
      </aside>

      <div className="axis-main flex flex-col w-full lg:ml-[240px]">
        <header className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6" style={{ height: 56, borderColor: 'oklch(0.9 0.008 250)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-slate-100"
              onClick={() => setMobileOpen(true)} aria-label="메뉴 열기">
              <Menu size={18} style={{ color: 'oklch(0.35 0.015 250)' }} />
            </button>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>
              {breadcrumbs ? (
                breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight size={12} />}
                    {b.path ? (
                      <Link href={b.path}>
                        <span className="hover:text-primary cursor-pointer transition-colors"
                          style={{ color: i === breadcrumbs.length - 1 ? 'oklch(0.2 0.02 250)' : undefined, fontWeight: i === breadcrumbs.length - 1 ? 600 : 500 }}>
                          {b.label}
                        </span>
                      </Link>
                    ) : (
                      <span style={{ color: i === breadcrumbs.length - 1 ? 'oklch(0.2 0.02 250)' : undefined, fontWeight: i === breadcrumbs.length - 1 ? 600 : 500 }}>
                        {b.label}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{title}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md transition-colors hover:bg-slate-100">
              <Bell size={16} style={{ color: 'oklch(0.4 0.015 250)' }} />
            </button>
            <div className="text-xs hidden sm:block" style={{ color: 'oklch(0.4 0.015 250)' }}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 page-enter">{children}</main>
      </div>
    </div>
  );
}
