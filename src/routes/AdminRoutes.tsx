// AXIS LMS v1.2 - AdminRoutes
// /admin/** 경로 — SUPER_ADMIN / DIRECTOR / STAFF 계열 진입.
// 기존 페이지 컴포넌트를 그대로 사용하며 경로만 /admin 하위로 정리.

import { Route, Switch, Redirect } from 'wouter';
import { RoleRoute } from './RoleRoute';
import AdminLayout from '@/components/AdminLayout';

// 기존 페이지 그대로 재사용
import StudentList from '@/pages/StudentList';
import StudentNew from '@/pages/StudentNew';
import StudentDetail from '@/pages/StudentDetail';
import ClassList from '@/pages/ClassList';
import ClassDetail from '@/pages/ClassDetail';
import AttendanceCheck from '@/pages/AttendanceCheck';
import AttendanceStatus from '@/pages/AttendanceStatus';
import AssessmentList from '@/pages/AssessmentList';
import AssessmentDetail from '@/pages/AssessmentDetail';
import ScoreExportPage from '@/pages/ScoreExportPage';
import FinancePayments from '@/pages/FinancePayments';
import FinanceRefunds from '@/pages/FinanceRefunds';
import FinanceUnpaid from '@/pages/FinanceUnpaid';
import FinanceSettlements from '@/pages/FinanceSettlements';
import FinanceStatistics from '@/pages/FinanceStatistics';
import NotificationHistory from '@/pages/NotificationHistory';
import NotificationTemplates from '@/pages/NotificationTemplates';
import NotificationSettingsPage from '@/pages/NotificationSettings';
import AcademyInfoManagement from '@/pages/settings/AcademyInfoManagement';
import PermissionSettings from '@/pages/settings/PermissionSettings';
import PasswordResetManagement from '@/pages/settings/PasswordResetManagement';
import GrowthOverview from '@/pages/growth/GrowthOverview';
import EmblemManagement from '@/pages/growth/EmblemManagement';
import RivalManagement from '@/pages/growth/RivalManagement';
import RivalSeasonManagement from '@/pages/growth/RivalSeasonManagement';
import ShowcasePolicyManagement from '@/pages/growth/ShowcasePolicyManagement';
import UniversityReportManagement from '@/pages/admin/UniversityReportManagement';
// ⚠ Phase 3A-2 Final Cleanup: StudentInputGradeReview 완전 제거 (2026-07-01)
//   - 학생 성적 직접 입력 자체가 AXIS LMS 헌법 위반이라, 그 승인/반려 검토 화면도 함께 제거.
//   - /admin/student-input-review 경로는 더 이상 존재하지 않는다(리다이렉트도 없음).
import EmployeeList from '@/pages/EmployeeList';
import EmployeeDetail from '@/pages/EmployeeDetail';
import NotFound from '@/pages/NotFound';

function AdminPlaceholder({ title }: { title: string }) {
  return (
    <AdminLayout title={title} breadcrumbs={[{ label: title }]}>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.04 250)' }}>
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>{title} 화면은 다음 단계에서 구현됩니다.</p>
      </div>
    </AdminLayout>
  );
}

export default function AdminRoutes() {
  return (
    <RoleRoute allow={['SUPER_ADMIN', 'DIRECTOR', 'STAFF']}>
      <Switch>
        {/* /admin → 학생목록으로 */}
        <Route path="/admin" component={() => <Redirect to="/admin/students" />} />

        {/* 학생관리 */}
        <Route path="/admin/students/new" component={StudentNew} />
        <Route path="/admin/students/:id" component={StudentDetail} />
        <Route path="/admin/students" component={StudentList} />

        {/* 직원관리 */}
        <Route path="/admin/employees/new" component={() => <Redirect to="/admin/employees?new=1" />} />
        <Route path="/admin/employees/:id" component={EmployeeDetail} />
        <Route path="/admin/employees" component={EmployeeList} />

        {/* 반관리 */}
        <Route path="/admin/classes/new" component={() => <Redirect to="/admin/classes?new=1" />} />
        <Route path="/admin/classes/:id" component={ClassDetail} />
        <Route path="/admin/classes" component={ClassList} />

        {/* 출결관리 */}
        <Route path="/admin/attendance/check" component={AttendanceCheck} />
        <Route path="/admin/attendance" component={AttendanceStatus} />

        {/* 시험 및 성적 관리 */}
        <Route path="/admin/scores/new" component={() => <Redirect to="/admin/scores?new=1" />} />
        <Route path="/admin/scores/export" component={ScoreExportPage} />
        <Route path="/admin/scores/:id" component={AssessmentDetail} />
        <Route path="/admin/scores" component={AssessmentList} />

        {/* 재무관리 */}
        <Route path="/admin/finance" component={() => <Redirect to="/admin/finance/payments" />} />
        <Route path="/admin/finance/payments" component={FinancePayments} />
        <Route path="/admin/finance/refunds" component={FinanceRefunds} />
        <Route path="/admin/finance/unpaid" component={FinanceUnpaid} />
        <Route path="/admin/finance/settlements" component={FinanceSettlements} />
        <Route path="/admin/finance/statistics" component={FinanceStatistics} />

        {/* 알림관리 */}
        <Route path="/admin/notifications" component={() => <Redirect to="/admin/notifications/history" />} />
        <Route path="/admin/notifications/history" component={NotificationHistory} />
        <Route path="/admin/notifications/templates" component={NotificationTemplates} />
        <Route path="/admin/notifications/settings" component={NotificationSettingsPage} />

        {/* 성장관리 */}
        <Route path="/admin/growth" component={() => <Redirect to="/admin/growth/overview" />} />
        <Route path="/admin/growth/overview" component={GrowthOverview} />
        <Route path="/admin/growth/emblems" component={EmblemManagement} />
        <Route path="/admin/growth/rivals" component={RivalManagement} />
        <Route path="/admin/growth/rival-seasons" component={RivalSeasonManagement} />
        <Route path="/admin/growth/showcase-policy" component={ShowcasePolicyManagement} />

        {/* 대학추천/목표대학 관리자 리포트 */}
        <Route path="/admin/university-reports" component={UniversityReportManagement} />

        {/* 시스템설정 */}
        <Route path="/admin/settings" component={() => <Redirect to="/admin/settings/academy" />} />
        <Route path="/admin/settings/academy" component={AcademyInfoManagement} />
        <Route path="/admin/settings/permissions" component={PermissionSettings} />
        <Route path="/admin/settings/password-reset" component={PasswordResetManagement} />

        <Route component={() => <AdminPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
