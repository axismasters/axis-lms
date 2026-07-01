// AXIS LMS v1.2 - TeacherLayout (강사 포털 Foundation v1)
// 강사 전용 레이아웃.
// [Phase 3D v3-r7] PC 웹 최적화: 데스크톱(lg 이상)에서는 하단 고정 네비게이션 대신
// 상단 업무형 가로 내비게이션을 사용한다. 모바일/태블릿(lg 미만)에서는 기존 Bottom
// Navigation(5탭)을 그대로 유지한다(AdminLayout의 lg 분기 관례와 동일한 브레이크포인트).

import { Link, useLocation } from 'wouter';
import { Home, BookOpen, Users, BarChart2, GraduationCap, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';

const TEACHER_NAV = [
  { path: '/teacher',                  label: '홈',     icon: Home },
  { path: '/teacher/classes',          label: '담당반',  icon: BookOpen },
  { path: '/teacher/students',         label: '학생',   icon: Users },
  { path: '/teacher/exams',            label: '시험지',  icon: BarChart2 },
  { path: '/teacher/university-data',  label: '대학추천', icon: GraduationCap },
];

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function TeacherLayout({ children, title }: TeacherLayoutProps) {
  const [location, navigate] = useLocation();
  const { currentUser, logout, canSwitchMode, activeMode, setActiveMode } = useAuth();

  const isActive = (path: string) => {
    if (path === '/teacher') return location === '/teacher';
    // 시험지 탭: /teacher/exams(내 시험지 관리 목록/상세)와 /teacher/grades(학생별 성적) 모두 active
    if (path === '/teacher/exams') {
      return location.startsWith('/teacher/exams') || location.startsWith('/teacher/grades');
    }
    return location.startsWith(path);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.98 0.008 75)' }}
    >
      {/* Phase 3D v2: 원장/부원장이 강사 모드로 들어와 있을 때만 표시되는 복귀 바 */}
      {canSwitchMode && activeMode === 'TEACHER_MODE' && (
        <div
          className="flex items-center justify-between px-4 py-1.5 text-xs"
          style={{ background: 'oklch(0.15 0.02 250)', color: 'oklch(0.8 0.01 250)' }}
        >
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} style={{ color: '#C8A15A' }} /> 강사 모드 (내 담당 반/학생 화면)</span>
          <button
            onClick={() => { setActiveMode('ADMIN_MODE'); navigate('/admin'); }}
            className="font-medium px-2 py-0.5 rounded transition-colors hover:bg-white/10"
            style={{ color: '#C8A15A' }}
          >
            관리자 모드로 돌아가기
          </button>
        </div>
      )}

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
              {title ?? 'AXIS 강사'}
            </span>
          </div>

          {/* [PC 최적화] 데스크톱 상단 업무형 내비게이션 — 하단 고정 네비게이션의 데스크톱 대체 */}
          <nav className="hidden lg:flex items-center gap-1">
            {TEACHER_NAV.map(({ path, label, icon: Icon }) => {
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
          <button
            onClick={logout}
            className="text-xs px-1.5 py-1 rounded-md transition-colors hover:bg-slate-100 flex items-center gap-1"
            style={{ color: 'oklch(0.55 0.015 250)' }}
            aria-label="로그아웃"
          >
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 — 모바일은 하단 네비게이션 여백(pb-20), 데스크톱은 상단 네비게이션으로
          대체되어 하단 여백이 필요 없다(lg:pb-6). */}
      <main className="flex-1 pb-20 lg:pb-6">
        {children}
      </main>

      {/* ⚠ DEV ONLY: 역할 전환기 — 운영 배포 전 제거 */}
      <DevRoleSwitcher />

      {/* Bottom Navigation (5탭) — 모바일/태블릿(lg 미만) 전용. 데스크톱은 상단 내비게이션 사용. */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex lg:hidden"
        style={{ borderColor: 'oklch(0.9 0.008 250)', height: 60 }}
      >
        {TEACHER_NAV.map(({ path, label, icon: Icon }) => {
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
