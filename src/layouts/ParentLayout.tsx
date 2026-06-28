// AXIS LMS v1.2 - ParentLayout
// 보호자 전용 레이아웃: 중앙 카드형, Bottom Navigation 기반.
// 라이벌/엠블럼/경쟁 정보 노출 금지 원칙 유지.

import { Link, useLocation } from 'wouter';
import { Home, CalendarCheck, CreditCard, Bell, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';

const PARENT_NAV = [
  { path: '/parent',             label: '홈',   icon: Home },
  { path: '/parent/attendance',  label: '출결', icon: CalendarCheck },
  { path: '/parent/finance',     label: '수납', icon: CreditCard },
  { path: '/parent/notices',     label: '알림', icon: Bell },
];

interface ParentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function ParentLayout({ children, title }: ParentLayoutProps) {
  const [location] = useLocation();
  const { currentUser } = useAuth();

  const isActive = (path: string) =>
    path === '/parent' ? location === '/parent' : location.startsWith(path);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.97 0.005 250)' }}
    >
      {/* 상단 헤더 */}
      <header
        className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4"
        style={{ height: 52, borderColor: 'oklch(0.9 0.008 250)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: 28, height: 28, background: 'oklch(0.45 0.15 160)' }}
          >
            <GraduationCap size={15} color="white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
            {title ?? 'AXIS 학부모'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><DevRoleSwitcher compact /></div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'oklch(0.45 0.15 160)' }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>
            {currentUser.name}
          </span>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex"
        style={{ borderColor: 'oklch(0.9 0.008 250)', height: 60 }}
      >
        {PARENT_NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path}>
              <div
                className="flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
                style={{
                  minWidth: 64,
                  color: active ? 'oklch(0.45 0.15 160)' : 'oklch(0.6 0.015 250)',
                }}
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
