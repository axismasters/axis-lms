// AXIS LMS v1.2 - App Router
// Design: Structured Authority

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StudentProvider, useStudents } from "./contexts/StudentContext";
import { ClassProvider } from "./contexts/ClassContext";
import { EnrollmentProvider } from "./contexts/EnrollmentContext";
import { AttendanceProvider } from "./contexts/AttendanceContext";
import { AssessmentProvider } from "./contexts/AssessmentContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GrowthProvider } from "./contexts/GrowthContext";
import StudentList from "./pages/StudentList";
import StudentNew from "./pages/StudentNew";
import StudentDetail from "./pages/StudentDetail";
import ClassList from "./pages/ClassList";
import ClassDetail from "./pages/ClassDetail";
import AttendanceCheck from "./pages/AttendanceCheck";
import AttendanceStatus from "./pages/AttendanceStatus";
import AssessmentList from "./pages/AssessmentList";
import AssessmentDetail from "./pages/AssessmentDetail";
import FinancePayments from "./pages/FinancePayments";
import FinanceRefunds from "./pages/FinanceRefunds";
import FinanceUnpaid from "./pages/FinanceUnpaid";
import FinanceSettlements from "./pages/FinanceSettlements";
import FinanceStatistics from "./pages/FinanceStatistics";
import NotificationHistory from "./pages/NotificationHistory";
import NotificationTemplates from "./pages/NotificationTemplates";
import NotificationSettingsPage from "./pages/NotificationSettings";
import AcademyInfoManagement from "./pages/settings/AcademyInfoManagement";
import PermissionSettings from "./pages/settings/PermissionSettings";
import PasswordResetManagement from "./pages/settings/PasswordResetManagement";
import GrowthOverview from "./pages/growth/GrowthOverview";
import EmblemManagement from "./pages/growth/EmblemManagement";
import RivalManagement from "./pages/growth/RivalManagement";
import AdminLayout from "./components/AdminLayout";

// 미구현 페이지 플레이스홀더
function PlaceholderPage({ title }: { title: string }) {
  return (
    <AdminLayout title={title} breadcrumbs={[{ label: title }]}>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.04 250)' }}>
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>{title} 화면은 다음 단계에서 구현됩니다.</p>
        <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>현재 학생관리 · 수업관리 · 출결관리 엔진이 구현된 상태입니다.</p>
      </div>
    </AdminLayout>
  );
}

// AXIS 확정 원칙 10 / 필수 수정 8 (+ Attendance Engine 정책 수정):
// 학생/보호자 화면은 별도 단계(향후 포털)이며, 현재 Admin Back Office에서 학생/보호자 계정이
// 관리자 레이아웃으로 내부정보를 수정할 수 없어야 한다. FALLBACK_USER가 STUDENT이고 개발 테스트용
// DEV 계정 전환(loginAs)으로 학생/보호자 계정이 AdminLayout 내부로 들어올 수 있는 구조는 유지하되,
// Back Office "출입" 자체는 학생/보호자만 차단한다.
//
// 주의: isBackOfficeType()(rbac.ts)은 SUPER_ADMIN/DIRECTOR/STAFF만 true를 반환하도록 정의되어 있고,
// 이 함수는 StudentDetail.tsx에서 "내부 직원급 운영메모 노출 여부" 등 별도 의미로도 쓰인다.
// 그 함수를 그대로 이 게이트에 쓰면 TEACHER(강사)가 Back Office 자체에 들어오지 못해, 강사가 본인
// 담당 반 출결을 처리해야 한다는 AXIS 확정 정책(출결체크: 담당강사 본인 반 처리 가능)과 모순된다.
// 따라서 이 게이트는 "학생/보호자 여부"만 직접 판별하고, isBackOfficeType()은 변경하지 않는다
// (StudentDetail.tsx 등 다른 화면의 기존 동작에 영향을 주지 않기 위함).
// TODO(student-guardian-portal): 학생/보호자는 향후 별도 포털(Student/Guardian Portal)에서 처리하고,
//                                이 Gate는 포털 분리가 완료되면 라우팅 단계(로그인 분기)로 옮길 것.
function BackOfficeGate({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const isPortalOnly = currentUser.accountType === 'STUDENT' || currentUser.accountType === 'GUARDIAN';
  if (isPortalOnly) {
    return (
      <AdminLayout title="접근 제한" breadcrumbs={[{ label: '접근 제한' }]}>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.04 250)' }}>
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>학생/보호자 계정은 Admin Back Office에 접근할 수 없습니다.</p>
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>학생/보호자 전용 화면은 별도 포털에서 제공될 예정입니다. (TODO: Student/Guardian Portal)</p>
        </div>
      </AdminLayout>
    );
  }
  return <>{children}</>;
}

function Router() {
  return (
    <BackOfficeGate>
      <Switch>
        {/* 루트 → 학생목록으로 리다이렉트 */}
        <Route path="/" component={() => <Redirect to="/students" />} />

        {/* 학생관리 */}
        <Route path="/students" component={StudentList} />
        <Route path="/students/new" component={StudentNew} />
        <Route path="/students/:id" component={StudentDetail} />

        {/* 수업관리 (반 관리) */}
        {/* AXIS 확정 구조상 수업관리 메뉴(AdminLayout)의 "반 등록"은 /classes?new=1로 진입한다.
            ClassFormModal.tsx 기반 등록 모달이 ClassList.tsx에 이미 있으므로 별도 /classes/new 페이지는
            만들지 않았다. ClassList.tsx가 ?new=1 쿼리를 읽어 진입 시 등록 모달을 자동으로 열고,
            모달을 닫으면 /classes로 URL을 정리한다. 아래 /classes/new 라우트는 옛 경로를 직접
            입력하거나 북마크한 경우를 위한 호환용 리다이렉트다. */}
        <Route path="/classes/new" component={() => <Redirect to="/classes?new=1" />} />
        <Route path="/classes" component={ClassList} />
        <Route path="/classes/:id" component={ClassDetail} />

        {/* 출결관리 */}
        <Route path="/attendance/check" component={AttendanceCheck} />
        <Route path="/attendance" component={AttendanceStatus} />

        {/* 시스템설정: 학원정보관리 / 권한설정 / 비밀번호 초기화 관리 */}
        <Route path="/settings" component={() => <Redirect to="/settings/academy" />} />
        <Route path="/settings/academy" component={AcademyInfoManagement} />
        <Route path="/settings/permissions" component={PermissionSettings} />
        <Route path="/settings/password-reset" component={PasswordResetManagement} />

        {/* 미구현 플레이스홀더 */}
        {/* 성적관리 (Assessment Engine) — 메뉴는 "성적 관리" 1개만 유지(하위 메뉴 추가 없음).
            시험 등록은 ClassList의 ?new=1 패턴과 동일하게 목록 화면 내 모달로 처리한다. */}
        <Route path="/scores/new" component={() => <Redirect to="/scores?new=1" />} />
        <Route path="/scores" component={AssessmentList} />
        <Route path="/scores/:id" component={AssessmentDetail} />

        {/* 재무관리 (Finance Foundation v1) — SUPER_ADMIN/DIRECTOR/STAFF만 접근 가능(각 페이지 내부에서
            canManageFinance로 가드). 메뉴는 AdminLayout.tsx의 "재무관리" 하위 5개로 고정. */}
        <Route path="/finance" component={() => <Redirect to="/finance/payments" />} />
        <Route path="/finance/payments" component={FinancePayments} />
        <Route path="/finance/refunds" component={FinanceRefunds} />
        <Route path="/finance/unpaid" component={FinanceUnpaid} />
        <Route path="/finance/settlements" component={FinanceSettlements} />
        <Route path="/finance/statistics" component={FinanceStatistics} />

        {/* 알림관리 (Notification Foundation v1) — SUPER_ADMIN/DIRECTOR/STAFF만 접근 가능.
            TEACHER/STUDENT/GUARDIAN은 메뉴 자체가 노출되지 않으며, 각 페이지 내부에서 canAccessNotifications로 추가 가드. */}
        <Route path="/notifications" component={() => <Redirect to="/notifications/history" />} />
        <Route path="/notifications/history" component={NotificationHistory} />
        <Route path="/notifications/templates" component={NotificationTemplates} />
        <Route path="/notifications/settings" component={NotificationSettingsPage} />

        {/* 성장관리 (Growth Showcase Foundation v1)
            canAccessGrowth: SUPER_ADMIN / DIRECTOR / STAFF / TEACHER 허용. STUDENT / GUARDIAN 차단.
            엠블럼 정책 관리(canManageEmblems)·라이벌 관리(canManageRivals)는 각 페이지 내부에서 게이트. */}
        <Route path="/growth" component={() => <Redirect to="/growth/overview" />} />
        <Route path="/growth/overview" component={GrowthOverview} />
        <Route path="/growth/emblems" component={EmblemManagement} />
        <Route path="/growth/rivals" component={RivalManagement} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </BackOfficeGate>
  );
}

// AuthProvider는 StudentProvider 내부에 위치해야 한다 — 강사(TEACHER)의 assignedStudentIds를
// 배정 반(assignedClassIds) 기준으로 파생시키기 위해 학생 목록(useStudents)이 필요하기 때문이다.
function AuthBoundary({ children }: { children: React.ReactNode }) {
  const { students } = useStudents();
  return <AuthProvider students={students}>{children}</AuthProvider>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <StudentProvider>
          <ClassProvider>
            {/* NotificationProvider를 Enrollment/Attendance/Finance보다 위에 배치:
                세 Provider의 이벤트 핸들러에서 useNotification()을 직접 호출하기 위함.
                NotificationContext 자체는 다른 Context에 의존하지 않으므로 순환 없음. */}
            <NotificationProvider>
              <EnrollmentProvider>
                <AttendanceProvider>
                  <AssessmentProvider>
                    <FinanceProvider>
                      <GrowthProvider>
                        <AuthBoundary>
                          <TooltipProvider>
                            <Toaster position="top-right" richColors />
                            <Router />
                          </TooltipProvider>
                        </AuthBoundary>
                      </GrowthProvider>
                    </FinanceProvider>
                  </AssessmentProvider>
                </AttendanceProvider>
              </EnrollmentProvider>
            </NotificationProvider>
          </ClassProvider>
        </StudentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
