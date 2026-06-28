// AXIS LMS v1.2 - StudentRoutes
// /student/** — STUDENT 계정 전용.

import { Route, Switch } from 'wouter';
import { RoleRoute } from './RoleRoute';
import StudentHome from '@/pages/student/StudentHome';
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
        <Route path="/student" component={StudentHome} />
        <Route path="/student/growth" component={() => <StudentPlaceholder title="성장 진열장" />} />
        <Route path="/student/scores" component={() => <StudentPlaceholder title="성적 조회" />} />
        <Route path="/student/attendance" component={() => <StudentPlaceholder title="출결 확인" />} />
        <Route component={() => <StudentPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
