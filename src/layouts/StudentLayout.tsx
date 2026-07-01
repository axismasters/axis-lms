// AXIS LMS v1.2 — Phase 3A-1: StudentLayout (Role-Based Portal Buildfix v1)
// 학생 전용 레이아웃 — Bottom Navigation 5탭
//
// Phase 3A-1 탭 구조:
//   1. 홈 (/student)
//   2. 테스트 (/student/grades) — 단원평가 + 내신대비모의고사
//   3. 진열장 (/student/growth)
//   4. Rival (/student/rival)
//   5. 마이 (/student/my)
//
// 대학추천/목표대학추천: 홈 카드 및 /student/target-preview 에서 접근
//
// ⚠ Phase 3A-1 금지: 수납/재무 관련 탭 추가 금지

import { Link, useLocation } from 'wouter';
import { Home, ClipboardList, Trophy, Swords, User, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';
import { detectStudentGradeLevel } from '@/lib/universityMenuLabel';

interface StudentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function StudentLayout({ children, title }: StudentLayoutProps) {
  const [location] = useLocation();
  const { currentUser, logout } = useAuth();
  const { students } = useStudents();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const gradeLevel = detectStudentGradeLevel(student);

  // Phase 3A-1: 5탭
  // "성적" → "테스트" (단원평가/내신대비 중심)
  // 대학추천/목표대학추천은 홈 카드에서 접근
  const STUDENT_NAV = [
    { path: '/student',        label: '홈',    icon: Home },
    { path: '/student/grades', label: '테스트', icon: ClipboardList },
    { path: '/student/growth', label: '진열장', icon: Trophy },
    { path: '/student/rival',  label: 'Rival', icon: Swords },
    { path: '/student/my',     label: '마이',   icon: User },
  ];

  const isActive = (path: string) =>
    path === '/student' ? location === '/student' : location.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: 'oklch(0.97 0.005 250)' }}>
      {/* 상단 헤더 */}
      <header className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4"
        style={{ height: 52, borderColor: 'oklch(0.9 0.008 250)' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-md"
            style={{ width: 28, height: 28, background: 'oklch(0.511 0.262 276.966)' }}>
            <BarChart2 size={15} color="white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
            {title ?? 'AXIS 학생'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {gradeLevel && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              {gradeLevel}
            </span>
          )}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'oklch(0.6 0.15 60)' }}>
            {currentUser.name.charAt(0)}
          </div>
          <button onClick={logout} className="p-1 rounded-md transition-colors hover:bg-slate-100" style={{ color: 'oklch(0.55 0.015 250)' }} aria-label="로그아웃">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* DEV ONLY */}
      <DevRoleSwitcher />

      {/* Bottom Navigation — 5탭 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex"
        style={{ borderColor: 'oklch(0.9 0.008 250)', height: 60 }}>
        {STUDENT_NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} style={{ flex: 1, display: 'flex' }}>
              <div className="flex flex-col items-center justify-center gap-0.5 w-full py-1 cursor-pointer transition-colors"
                style={{ color: active ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.6 0.015 250)' }}>
                <Icon size={20} />
                <span className="font-medium" style={{ fontSize: 9 }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
