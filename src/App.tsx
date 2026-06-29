// AXIS LMS v1.2 - App Router
// Role Separation v1: 역할별 포털 분리
// / → 역할에 따라 /admin, /teacher, /student, /parent 자동 이동
// 기존 /students, /classes 등 구 경로는 /admin/** 로 리다이렉트 유지 (하위호환)

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StudentProvider, useStudents } from "./contexts/StudentContext";
import { ClassProvider } from "./contexts/ClassContext";
import { EnrollmentProvider } from "./contexts/EnrollmentContext";
import { AttendanceProvider } from "./contexts/AttendanceContext";
import { AssessmentProvider } from "./contexts/AssessmentContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { GrowthProvider } from "./contexts/GrowthContext";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import { ContentProvider } from "./contexts/ContentContext";
import { HomeworkProvider } from "./contexts/HomeworkContext";
import { HomeworkStatusProvider } from "./contexts/HomeworkStatusContext";

// 역할별 라우트
import AdminRoutes from "./routes/AdminRoutes";
import TeacherRoutes from "./routes/TeacherRoutes";
import StudentRoutes from "./routes/StudentRoutes";
import ParentRoutes from "./routes/ParentRoutes";
import { RootRedirect } from "./routes/RoleRoute";

// ─────────────────────────────────────────────────────────
// ID 파라미터 리다이렉트 헬퍼 컴포넌트
// ─────────────────────────────────────────────────────────
function RedirectWithId({ prefix }: { prefix: string }) {
  const params = useParams<{ id: string }>();
  return <Redirect to={`${prefix}/${params.id}`} />;
}

// ─────────────────────────────────────────────────────────
// 구 경로 하위호환 리다이렉트
// ─────────────────────────────────────────────────────────
function LegacyRedirects() {
  return (
    <Switch>
      <Route path="/students/new"            component={() => <Redirect to="/admin/students/new" />} />
      <Route path="/students/:id"            component={() => <RedirectWithId prefix="/admin/students" />} />
      <Route path="/students"               component={() => <Redirect to="/admin/students" />} />
      <Route path="/employees/new"           component={() => <Redirect to="/admin/employees?new=1" />} />
      <Route path="/employees/:id"           component={() => <RedirectWithId prefix="/admin/employees" />} />
      <Route path="/employees"              component={() => <Redirect to="/admin/employees" />} />
      <Route path="/classes/new"             component={() => <Redirect to="/admin/classes?new=1" />} />
      <Route path="/classes/:id"             component={() => <RedirectWithId prefix="/admin/classes" />} />
      <Route path="/classes"               component={() => <Redirect to="/admin/classes" />} />
      <Route path="/attendance/check"        component={() => <Redirect to="/admin/attendance/check" />} />
      <Route path="/attendance"             component={() => <Redirect to="/admin/attendance" />} />
      <Route path="/scores/new"              component={() => <Redirect to="/admin/scores?new=1" />} />
      <Route path="/scores/:id"              component={() => <RedirectWithId prefix="/admin/scores" />} />
      <Route path="/scores"                component={() => <Redirect to="/admin/scores" />} />
      <Route path="/finance/payments"        component={() => <Redirect to="/admin/finance/payments" />} />
      <Route path="/finance/refunds"         component={() => <Redirect to="/admin/finance/refunds" />} />
      <Route path="/finance/unpaid"          component={() => <Redirect to="/admin/finance/unpaid" />} />
      <Route path="/finance/settlements"     component={() => <Redirect to="/admin/finance/settlements" />} />
      <Route path="/finance/statistics"      component={() => <Redirect to="/admin/finance/statistics" />} />
      <Route path="/finance"               component={() => <Redirect to="/admin/finance/payments" />} />
      <Route path="/notifications/history"   component={() => <Redirect to="/admin/notifications/history" />} />
      <Route path="/notifications/templates" component={() => <Redirect to="/admin/notifications/templates" />} />
      <Route path="/notifications/settings"  component={() => <Redirect to="/admin/notifications/settings" />} />
      <Route path="/notifications"          component={() => <Redirect to="/admin/notifications/history" />} />
      <Route path="/growth/overview"         component={() => <Redirect to="/admin/growth/overview" />} />
      <Route path="/growth/emblems"          component={() => <Redirect to="/admin/growth/emblems" />} />
      <Route path="/growth/rivals"           component={() => <Redirect to="/admin/growth/rivals" />} />
      <Route path="/growth"                component={() => <Redirect to="/admin/growth/overview" />} />
      <Route path="/settings/academy"        component={() => <Redirect to="/admin/settings/academy" />} />
      <Route path="/settings/permissions"    component={() => <Redirect to="/admin/settings/permissions" />} />
      <Route path="/settings/password-reset" component={() => <Redirect to="/admin/settings/password-reset" />} />
      <Route path="/settings"              component={() => <Redirect to="/admin/settings/academy" />} />
    </Switch>
  );
}

// ─────────────────────────────────────────────────────────
// 메인 라우터
// ─────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* 루트 → 역할별 홈으로 */}
      <Route path="/" component={RootRedirect} />

      {/* 관리자 포털 (/admin/**) */}
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/*" component={AdminRoutes} />

      {/* 강사 포털 (/teacher/**) */}
      <Route path="/teacher" component={TeacherRoutes} />
      <Route path="/teacher/*" component={TeacherRoutes} />

      {/* 학생 포털 (/student/**) */}
      <Route path="/student" component={StudentRoutes} />
      <Route path="/student/*" component={StudentRoutes} />

      {/* 보호자 포털 (/parent/**) */}
      <Route path="/parent" component={ParentRoutes} />
      <Route path="/parent/*" component={ParentRoutes} />

      {/* 구 경로 하위호환 리다이렉트 */}
      <Route path="/students/*"       component={LegacyRedirects} />
      <Route path="/students"         component={LegacyRedirects} />
      <Route path="/employees/*"      component={LegacyRedirects} />
      <Route path="/employees"        component={LegacyRedirects} />
      <Route path="/classes/*"        component={LegacyRedirects} />
      <Route path="/classes"          component={LegacyRedirects} />
      <Route path="/attendance/*"     component={LegacyRedirects} />
      <Route path="/attendance"       component={LegacyRedirects} />
      <Route path="/scores/*"         component={LegacyRedirects} />
      <Route path="/scores"           component={LegacyRedirects} />
      <Route path="/finance/*"        component={LegacyRedirects} />
      <Route path="/finance"          component={LegacyRedirects} />
      <Route path="/notifications/*"  component={LegacyRedirects} />
      <Route path="/notifications"    component={LegacyRedirects} />
      <Route path="/growth/*"         component={LegacyRedirects} />
      <Route path="/growth"           component={LegacyRedirects} />
      <Route path="/settings/*"       component={LegacyRedirects} />
      <Route path="/settings"         component={LegacyRedirects} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// AuthProvider는 StudentProvider 내부에 위치해야 한다.
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
            <NotificationProvider>
              <EmployeeProvider>
                <EnrollmentProvider>
                  <AttendanceProvider>
                    <AssessmentProvider>
                      <FinanceProvider>
                        <GrowthProvider>
                          <ContentProvider>
                            <HomeworkProvider>
                              <HomeworkStatusProvider>
                                <AuthBoundary>
                                  <TooltipProvider>
                                    <Toaster position="top-right" richColors />
                                    <Router />
                                  </TooltipProvider>
                                </AuthBoundary>
                              </HomeworkStatusProvider>
                            </HomeworkProvider>
                          </ContentProvider>
                        </GrowthProvider>
                      </FinanceProvider>
                    </AssessmentProvider>
                  </AttendanceProvider>
                </EnrollmentProvider>
              </EmployeeProvider>
            </NotificationProvider>
          </ClassProvider>
        </StudentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
