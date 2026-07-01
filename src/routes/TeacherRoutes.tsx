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
import TeacherExamScores from '@/pages/teacher/TeacherExamScores';
import TeacherExamGrading from '@/pages/teacher/TeacherExamGradingGuard';
import TeacherGrades from '@/pages/teacher/TeacherGrades';
import TeacherMaterials from '@/pages/teacher/TeacherMaterials';
import TeacherHomework from '@/pages/teacher/TeacherHomework';
import TeacherStudentGrowth from '@/pages/teacher/TeacherStudentGrowth';
// ─── Phase 3A-1: 대학추천 데이터 관리 ─────────────────────────────────
// ⚠ Phase 3A-2 Final Cleanup: TeacherAcademicInput(구 성적 입력 화면)은 제거되고
//   /teacher/university-data로 완전히 대체되었다(아래 라우트에서 redirect 처리).
import TeacherUniversityData from '@/pages/teacher/TeacherUniversityData';
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

        {/* Phase 3D v3: 학생별 성적(조회+정정) — 목록보다 먼저 등록 */}
        <Route path="/teacher/exams/:examId/scores" component={TeacherExamScores} />

        {/* 내 시험지 관리 / 미채점 */}
        <Route path="/teacher/exams" component={TeacherExams} />

        {/* 담당 학생 성적 확인 */}
        <Route path="/teacher/grades" component={TeacherGrades} />

        {/* Phase 3A: 학생 성장 요약 */}
        <Route path="/teacher/growth" component={TeacherStudentGrowth} />

        {/* Phase 3A-1: 대학추천 데이터 관리 */}
        {/* ⚠ Phase 3A-2 Final Cleanup: 구 academic-input 경로는 university-data로 완전 대체 → redirect */}
        <Route path="/teacher/academic-input" component={() => <Redirect to="/teacher/university-data" />} />
        <Route path="/teacher/university-data" component={TeacherUniversityData} />

        {/* Phase 3D v3: 수업영상+수업노트 통합 화면 (탭으로 전환) */}
        <Route path="/teacher/materials" component={TeacherMaterials} />
        {/* 구 경로 하위호환 — 각각 대응 탭으로 진입 */}
        <Route path="/teacher/videos" component={() => <Redirect to="/teacher/materials?tab=videos" />} />
        <Route path="/teacher/notes" component={() => <Redirect to="/teacher/materials?tab=notes" />} />

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
