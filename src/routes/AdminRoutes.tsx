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
import { isFinanceEnabled, isRivalEnabled, isEmblemEnabled } from '@/lib/systemFeatureFlags';
import FeatureDisabledNotice from '@/components/FeatureDisabledNotice';

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

// [Phase 3D v3-r12] 시스템 기능 온/오프 — 라우트 레벨 가드.
// 메뉴만 숨기는 게 아니라 URL 직접 접근도 막아야 하므로, 대상 라우트의 component를
// 이 헬퍼로 감싼다. OFF면 실제 페이지 컴포넌트를 렌더링하지 않는다(마운트조차 안 됨).
function withFeatureGate(
  enabled: boolean,
  Comp: React.ComponentType,
  title: string,
  breadcrumbs: { label: string; path?: string }[],
) {
  if (enabled) return <Comp />;
  return (
    <AdminLayout title={title} breadcrumbs={breadcrumbs}>
      <FeatureDisabledNotice description="관리자 설정 > 시스템설정 > 학원정보관리에서 다시 켤 수 있습니다." />
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

        {/* 재무관리 — [Phase 3D v3-r12] financeEnabled 게이트 */}
        <Route path="/admin/finance" component={() => <Redirect to="/admin/finance/payments" />} />
        <Route path="/admin/finance/payments" component={() => withFeatureGate(isFinanceEnabled(), FinancePayments, '수납관리', [{ label: '재무관리', path: '/admin/finance' }, { label: '수납관리' }])} />
        <Route path="/admin/finance/refunds" component={() => withFeatureGate(isFinanceEnabled(), FinanceRefunds, '환불관리', [{ label: '재무관리', path: '/admin/finance' }, { label: '환불관리' }])} />
        <Route path="/admin/finance/unpaid" component={() => withFeatureGate(isFinanceEnabled(), FinanceUnpaid, '미납관리', [{ label: '재무관리', path: '/admin/finance' }, { label: '미납관리' }])} />
        <Route path="/admin/finance/settlements" component={() => withFeatureGate(isFinanceEnabled(), FinanceSettlements, '정산관리', [{ label: '재무관리', path: '/admin/finance' }, { label: '정산관리' }])} />
        <Route path="/admin/finance/statistics" component={() => withFeatureGate(isFinanceEnabled(), FinanceStatistics, '통계', [{ label: '재무관리', path: '/admin/finance' }, { label: '통계' }])} />
        {/* [Phase 3D v3-r13] 위 5개 외의 /admin/finance/* 미등록 하위 경로 — OFF 상태에서는
            404 대신 공통 비활성 안내를 보여준다(어떤 하위 경로가 실존하는지 노출하지 않기
            위해 OFF일 때는 페이지 존재 여부와 무관하게 동일한 안내를 준다). ON 상태에서는
            실존하지 않는 경로이므로 기존 404로 보낸다. */}
        <Route path="/admin/finance/*" component={() => isFinanceEnabled()
          ? <AdminPlaceholder title="페이지를 찾을 수 없습니다" />
          : (
            <AdminLayout title="재무관리" breadcrumbs={[{ label: '재무관리' }]}>
              <FeatureDisabledNotice description="관리자 설정 > 시스템설정 > 학원정보관리에서 다시 켤 수 있습니다." />
            </AdminLayout>
          )} />

        {/* 알림관리 */}
        <Route path="/admin/notifications" component={() => <Redirect to="/admin/notifications/history" />} />
        <Route path="/admin/notifications/history" component={NotificationHistory} />
        <Route path="/admin/notifications/templates" component={NotificationTemplates} />
        <Route path="/admin/notifications/settings" component={NotificationSettingsPage} />

        {/* 성장관리 — [Phase 3D v3-r12] Rival/Emblem 게이트. 성장현황(overview)은 게이트 없음. */}
        <Route path="/admin/growth" component={() => <Redirect to="/admin/growth/overview" />} />
        <Route path="/admin/growth/overview" component={GrowthOverview} />
        <Route path="/admin/growth/emblems" component={() => withFeatureGate(isEmblemEnabled(), EmblemManagement, '엠블럼 관리', [{ label: '성장관리', path: '/admin/growth' }, { label: '엠블럼 관리' }])} />
        <Route path="/admin/growth/rivals" component={() => withFeatureGate(isRivalEnabled(), RivalManagement, '라이벌 관리', [{ label: '성장관리', path: '/admin/growth' }, { label: '라이벌 관리' }])} />
        <Route path="/admin/growth/rival-seasons" component={() => withFeatureGate(isRivalEnabled(), RivalSeasonManagement, 'Rival 시즌 관리', [{ label: '성장관리', path: '/admin/growth' }, { label: 'Rival 시즌 관리' }])} />
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
