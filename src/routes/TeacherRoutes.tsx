// AXIS LMS v1.2 - TeacherRoutes (강사 포털 Foundation v1)
// /teacher/** — TEACHER 역할 전용.
// TEACHER 외 역할: RoleRoute가 해당 역할의 홈으로 리다이렉트.

import { Route, Switch, Redirect } from 'wouter';
import { RoleRoute } from './RoleRoute';
import TeacherHome from '@/pages/teacher/TeacherHome';
import TeacherClasses from '@/pages/teacher/TeacherClasses';
import TeacherStudents from '@/pages/teacher/TeacherStudents';
import TeacherExams from '@/pages/teacher/TeacherExams';
import TeacherGrades from '@/pages/teacher/TeacherGrades';
import TeacherVideos from '@/pages/teacher/TeacherVideos';
import TeacherNotes from '@/pages/teacher/TeacherNotes';
import TeacherLayout from '@/layouts/TeacherLayout';

function TeacherPlaceholder({ title }: { title: string }) {
  return (
    <TeacherLayout title={title}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'oklch(0.95 0.04 250)' }}
        >
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
        {/* 강사 홈 */}
        <Route path="/teacher" component={TeacherHome} />

        {/* 담당 반 */}
        <Route path="/teacher/classes" component={TeacherClasses} />

        {/* 담당 학생 */}
        <Route path="/teacher/students" component={TeacherStudents} />

        {/* 내 시험 / 미채점 */}
        <Route path="/teacher/exams" component={TeacherExams} />

        {/* 담당 학생 성적 확인 */}
        <Route path="/teacher/grades" component={TeacherGrades} />

        {/* 내 수업영상 */}
        <Route path="/teacher/videos" component={TeacherVideos} />

        {/* 내 수업노트 */}
        <Route path="/teacher/notes" component={TeacherNotes} />

        {/* 구 경로 → 신규 경로 리다이렉트 (하위호환) */}
        <Route path="/teacher/attendance" component={() => <Redirect to="/teacher" />} />
        <Route path="/teacher/scores" component={() => <Redirect to="/teacher/grades" />} />

        {/* 404 */}
        <Route component={() => <TeacherPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
