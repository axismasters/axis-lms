// AXIS LMS v1.2 - StudentRoutes (Phase 3D v3-r1: 누락 라우트 복구)
// /student/** — STUDENT 계정 전용. 모든 화면은 읽기 전용.
//
// v3-r1 반려 대응: 홈 카드/하단 네비게이션이 가리키는 /student/my, /student/target-preview,
// /student/growth, /student/rival이 실제로는 라우트에 연결되어 있지 않아(또는 placeholder만
// 있어) 404/placeholder로 빠지는 문제가 있었다. 이미 완성되어 있던 페이지 컴포넌트들을
// 실제로 연결하고, StudentRival.tsx는 존재하지 않아 이번에 신규로 만들었다.

import { Route, Switch, Redirect } from 'wouter';
import { RoleRoute } from './RoleRoute';
import StudentHome from '@/pages/student/StudentHome';
import StudentClasses from '@/pages/student/StudentClasses';
import StudentGrades from '@/pages/student/StudentGrades';
import StudentAttendance from '@/pages/student/StudentAttendance';
import StudentHomework from '@/pages/student/StudentHomework';
import StudentMockExams from '@/pages/student/StudentMockExams';
import StudentWeeklyMocks from '@/pages/student/StudentWeeklyMocks';
import StudentMyPage from '@/pages/student/StudentMyPage';
import StudentTargetPreview from '@/pages/student/StudentTargetPreview';
import StudentGrowthShowcase from '@/pages/student/StudentGrowthShowcase';
import StudentRival from '@/pages/student/StudentRival';
import StudentLayout from '@/layouts/StudentLayout';
import { isRivalEnabled } from '@/lib/systemFeatureFlags';
import FeatureDisabledNotice from '@/components/FeatureDisabledNotice';

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

        {/* Phase 3D v2/v3-r1: 학생 화면 재무 노출 절대 금지 — /student/finance는 항상 /student로 차단 리다이렉트.
            StudentFinance.tsx 컴포넌트 자체도 더 이상 존재하지 않는다(물리 삭제 완료). */}
        <Route path="/student/finance" component={() => <Redirect to="/student" />} />

        {/* 모의고사 결과 조회 (읽기 전용) */}
        <Route path="/student/mock-exams" component={StudentMockExams} />

        {/* 수능실전모의고사 결과(회차별 누적) — 화면 타이틀은 "수능실전모의고사 결과"(개발 내부 코드명만 weekly-mocks) */}
        <Route path="/student/weekly-mocks" component={StudentWeeklyMocks} />

        {/* 마이페이지(닉네임/프로필) — v3-r1: 실제 연결 */}
        <Route path="/student/my" component={StudentMyPage} />

        {/* 목표대학추천/대학추천 미리보기 — v3-r1: 실제 연결 */}
        <Route path="/student/target-preview" component={StudentTargetPreview} />

        {/* 성장 진열장 — v3-r1: placeholder 대신 실제 화면 연결 */}
        <Route path="/student/growth" component={StudentGrowthShowcase} />

        {/* Rival — v3-r1: 신규 Foundation 화면 연결. [Phase 3D v3-r12] rivalEnabled 게이트 */}
        <Route path="/student/rival" component={() => isRivalEnabled() ? <StudentRival /> : (
          <StudentLayout title="Rival">
            <div className="max-w-lg mx-auto px-4 py-5">
              <FeatureDisabledNotice description="관리자 설정에서 Rival 시스템이 켜지면 다시 이용할 수 있습니다." />
            </div>
          </StudentLayout>
        )} />

        {/* 구 경로 하위호환 리다이렉트 */}
        <Route path="/student/scores" component={() => <Redirect to="/student/grades" />} />

        {/* 404 */}
        <Route component={() => <StudentPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
