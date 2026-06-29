// AXIS LMS v1.2 - TeacherRoutes (Workflow Foundation v1)
// /teacher/** — TEACHER 역할 전용.

import { Route, Switch, Redirect } from 'wouter';
import { RoleRoute } from './RoleRoute';
import TeacherHome from '@/pages/teacher/TeacherHome';
import TeacherClasses from '@/pages/teacher/TeacherClasses';
import TeacherStudents from '@/pages/teacher/TeacherStudents';
import TeacherStudentDetail from '@/pages/teacher/TeacherStudentDetail';
import TeacherAttendance from '@/pages/teacher/TeacherAttendance';
import TeacherExams from '@/pages/teacher/TeacherExams';
import TeacherExamGrading from '@/pages/teacher/TeacherExamGrading';
import TeacherGrades from '@/pages/teacher/TeacherGrades';
import TeacherVideos from '@/pages/teacher/TeacherVideos';
import TeacherNotes from '@/pages/teacher/TeacherNotes';
import TeacherHomework from '@/pages/teacher/TeacherHomework';
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

        {/* 출결 체크 */}
        <Route path="/teacher/attendance" component={TeacherAttendance} />

        {/* 담당 학생 상세 (목록보다 먼저 등록) */}
        <Route path="/teacher/students/:studentId" component={TeacherStudentDetail} />

        {/* 담당 학생 목록 */}
        <Route path="/teacher/students" component={TeacherStudents} />

        {/* 채점 상세 (목록보다 먼저 등록) */}
        <Route path="/teacher/exams/:examId/grading" component={TeacherExamGrading} />

        {/* 내 시험 / 미채점 */}
        <Route path="/teacher/exams" component={TeacherExams} />

        {/* 담당 학생 성적 확인 */}
        <Route path="/teacher/grades" component={TeacherGrades} />

        {/* 내 수업영상 */}
        <Route path="/teacher/videos" component={TeacherVideos} />

        {/* 내 수업노트 */}
        <Route path="/teacher/notes" component={TeacherNotes} />

        {/* 숙제 관리 */}
        <Route path="/teacher/homework" component={TeacherHomework} />

        {/* 구 경로 하위호환 리다이렉트 */}
        <Route path="/teacher/scores" component={() => <Redirect to="/teacher/grades" />} />

        {/* 404 */}
        <Route component={() => <TeacherPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
