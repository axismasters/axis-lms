// AXIS LMS v1.2 - Admin Back Office Layout
// Design: Structured Authority - Slate-900 sidebar + Slate-50 main area
// Mobile/App Optimization Readiness v1: 모바일 폭에서 collapsible sidebar 대응
// 메뉴 노출은 RBAC(AuthContext.can)을 따른다. 시스템설정 하위: 학원정보관리 / 권한설정 / 비밀번호 초기화 관리.

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Users, BookOpen, BarChart2, Settings, ChevronRight, CalendarCheck,
  Building2, ShieldCheck, KeyRound, GraduationCap, Bell, Wallet, Trophy, Briefcase,
  Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionKey, POSITION_LABEL, canAccessGrowth } from '@/lib/rbac';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requires?: PermissionKey;
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
    requires: 'finance.view',
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
    requires: 'notification.view',
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // 모바일 폭에서 경로 변경 시 사이드바 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // 모바일 오픈 시 body 스크롤 잠금
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'oklch(0.22 0.02 250)', minHeight: 56 }}>
        <div className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, background: 'oklch(0.511 0.262 276.966)' }}>
          <GraduationCap size={18} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm tracking-wide">AXIS LMS</div>
          <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>v1.2 관리자</div>
        </div>
        {/* 모바일: 닫기 버튼 */}
        <button
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style={{ color: 'oklch(0.6 0.015 250)' }}
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X size={16} />
        </button>
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
                  isActive(item.path) ? 'text-white' : 'hover:text-white'
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

      {/* Footer */}
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
    <div className="flex min-h-screen" style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.984 0.003 247)' }}>

      {/* ── 데스크톱 사이드바 (lg 이상: 항상 노출) ── */}
      <aside className="axis-sidebar flex-col fixed left-0 top-0 h-full z-30 hidden lg:flex" style={{ width: 240 }}>
        <SidebarContent />
      </aside>

      {/* ── 모바일 Overlay (lg 미만: mobileOpen일 때만 표시) ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'oklch(0 0 0 / 0.5)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── 모바일 사이드바 드로어 (lg 미만) ── */}
      <aside
        className={cn(
          'axis-sidebar flex flex-col fixed left-0 top-0 h-full z-50 lg:hidden transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: 240 }}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent />
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <div className="axis-main flex flex-col w-full lg:ml-[240px]">
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6" style={{ height: 56, borderColor: 'oklch(0.9 0.008 250)' }}>
          <div className="flex items-center gap-3">
            {/* 모바일 햄버거 버튼 */}
            <button
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu size={18} style={{ color: 'oklch(0.4 0.015 250)' }} />
            </button>

            {/* 브레드크럼 / 타이틀 */}
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
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md transition-colors hover:bg-slate-100">
              <Bell size={16} style={{ color: 'oklch(0.5 0.015 250)' }} />
            </button>
            <div className="text-xs hidden sm:block" style={{ color: 'oklch(0.5 0.015 250)' }}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
