// AXIS LMS v1.2 - TeacherRoutes
// /teacher/** — TEACHER 계정 전용.

import { Route, Switch } from 'wouter';
import { RoleRoute } from './RoleRoute';
import TeacherHome from '@/pages/teacher/TeacherHome';
import TeacherLayout from '@/layouts/TeacherLayout';

function TeacherPlaceholder({ title }: { title: string }) {
  return (
    <TeacherLayout title={title}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'oklch(0.95 0.04 250)' }}>
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-sm font-medium text-center" style={{ color: 'oklch(0.4 0.015 250)' }}>
          {title} 화면은 다음 단계에서 구현됩니다.
        </p>
      </div>
    </TeacherLayout>
  );
}

export default function TeacherRoutes() {
  return (
    <RoleRoute allow={['TEACHER']}>
      <Switch>
        <Route path="/teacher" component={TeacherHome} />
        <Route path="/teacher/attendance" component={() => <TeacherPlaceholder title="출결 관리" />} />
        <Route path="/teacher/scores" component={() => <TeacherPlaceholder title="성적 관리" />} />
        <Route path="/teacher/students" component={() => <TeacherPlaceholder title="담당 학생" />} />
        <Route component={() => <TeacherPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
