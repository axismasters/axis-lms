// AXIS LMS v1.2 - StudentRoutes (Student Finance View Foundation v1)
// /student/** — STUDENT 계정 전용. 모든 화면은 읽기 전용.

import { Route, Switch, Redirect } from 'wouter';
import { RoleRoute } from './RoleRoute';
import StudentHome from '@/pages/student/StudentHome';
import StudentClasses from '@/pages/student/StudentClasses';
import StudentGrades from '@/pages/student/StudentGrades';
import StudentAttendance from '@/pages/student/StudentAttendance';
import StudentHomework from '@/pages/student/StudentHomework';
import StudentFinance from '@/pages/student/StudentFinance';
import StudentLayout from '@/layouts/StudentLayout';

function StudentPlaceholder({ title }: { title: string }) {
  return (
    <StudentLayout title={title}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'oklch(0.95 0.04 250)' }}>
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-sm font-medium text-center" style={{ color: 'oklch(0.4 0.015 250)' }}>
          {title} 화면은 다음 단계에서 구현됩니다.
        </p>
      </div>
    </StudentLayout>
  );
}

export default function StudentRoutes() {
  return (
    <RoleRoute allow={['STUDENT']}>
      <Switch>
        {/* 학생 홈 */}
        <Route path="/student" component={StudentHome} />

        {/* 내 반/수업 조회 */}
        <Route path="/student/classes" component={StudentClasses} />

        {/* 성적 조회 (공개/반영 결과만) */}
        <Route path="/student/grades" component={StudentGrades} />

        {/* 출결 조회 */}
        <Route path="/student/attendance" component={StudentAttendance} />

        {/* 내 숙제 */}
        <Route path="/student/homework" component={StudentHomework} />

        {/* 수납 내역 조회 (읽기 전용) */}
        <Route path="/student/finance" component={StudentFinance} />

        {/* 성장 진열장 (Foundation — 홈에서 접근) */}
        <Route path="/student/growth" component={() => <StudentPlaceholder title="성장 진열장" />} />

        {/* 구 경로 하위호환 리다이렉트 */}
        <Route path="/student/scores" component={() => <Redirect to="/student/grades" />} />

        {/* 404 */}
        <Route component={() => <StudentPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
