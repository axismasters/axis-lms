// AXIS LMS v1.2 - ParentLayout (Parent Portal Foundation v1)
// 보호자 전용 레이아웃.
// [Phase 3D v3-r7] PC 웹 최적화: 데스크톱(lg 이상)에서는 하단 고정 네비게이션 대신
// 상단 가로 내비게이션을 사용한다. 모바일/태블릿(lg 미만)에서는 기존 Bottom Navigation
// (5탭)을 그대로 유지한다.
// 라이벌/엠블럼/경쟁 정보 노출 금지 원칙 유지.

import { Link, useLocation } from 'wouter';
import { Home, CalendarCheck, ClipboardList, CreditCard, TrendingUp, GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';

// Phase 3D v2: 학생 화면의 "성적" → "테스트" 개편에 맞춰 학부모 화면도 동기화.
// 자녀 성장 리포트(테스트 변화·출결 흐름·대학추천 요약) 접근성을 위해 "성장" 탭 추가.
// 학생용 게임형 지표는 학부모 화면에 노출하지 않음.
const PARENT_NAV = [
  { path: '/parent',             label: '홈',    icon: Home },
  { path: '/parent/attendance',  label: '출결',   icon: CalendarCheck },
  { path: '/parent/grades',      label: '테스트', icon: ClipboardList },
  { path: '/parent/growth',      label: '성장',   icon: TrendingUp },
  { path: '/parent/finance',     label: '수납',   icon: CreditCard },
];

interface ParentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function ParentLayout({ children, title }: ParentLayoutProps) {
  const [location] = useLocation();
  const { currentUser, logout } = useAuth();

  const isActive = (path: string) =>
    path === '/parent' ? location === '/parent' : location.startsWith(path);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.98 0.008 75)' }}
    >
      {/* 상단 헤더 */}
      <header
        className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6"
        style={{ height: 52, borderColor: 'oklch(0.9 0.008 250)' }}
      >
        <div className="flex items-center gap-2 lg:gap-6">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-md"
              style={{ width: 28, height: 28, background: '#081F4D' }}
            >
              <GraduationCap size={15} color="white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
              {title ?? 'AXIS 학부모'}
            </span>
          </div>

          {/* [PC 최적화] 데스크톱 상단 내비게이션 */}
          <nav className="hidden lg:flex items-center gap-1">
            {PARENT_NAV.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} href={path}>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors"
                    style={{
                      background: active ? '#C8A15A1A' : 'transparent',
                      color: active ? '#081F4D' : 'oklch(0.5 0.015 250)',
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#081F4D' }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-xs font-medium hidden sm:inline" style={{ color: 'oklch(0.4 0.015 250)' }}>
            {currentUser.name}
          </span>
          <button onClick={logout} className="p-1 rounded-md transition-colors hover:bg-slate-100" style={{ color: 'oklch(0.55 0.015 250)' }} aria-label="로그아웃">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 — 모바일은 하단 네비게이션 여백, 데스크톱은 상단 내비게이션으로 대체 */}
      <main className="flex-1 pb-20 lg:pb-6">
        {children}
      </main>

      {/* ⚠ DEV ONLY */}
      <DevRoleSwitcher />

      {/* Bottom Navigation — 모바일/태블릿(lg 미만) 전용 */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex lg:hidden"
        style={{ borderColor: 'oklch(0.9 0.008 250)', height: 60 }}
      >
        {PARENT_NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} style={{ flex: 1, display: 'flex' }}>
              <div
                className="flex flex-col items-center justify-center gap-0.5 w-full py-1 cursor-pointer transition-colors"
                style={{ color: active ? '#081F4D' : 'oklch(0.6 0.015 250)' }}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
