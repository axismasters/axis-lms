// AXIS LMS v1.2 - 학생 상세 (Back Office)
// 상단 요약 카드 + 탭: 기본정보 / 보호자·가족 / 수강현황 / 출결현황 / 성적조회 / 재무상태.
// 상담기록 독립 탭은 두지 않는다. 운영메모 로그는 기본정보 탭 하단의 Back Office 내부 기록 섹션으로 유지
//   (최고관리자/원장/행정만 조회, 학생·학부모 화면에는 절대 노출하지 않음).
// 출결현황·재무상태 탭은 조회 전용(입력은 출결관리/재무관리 엔진). 재무는 권한자에게만 노출.
// 반 데이터(반유형·요일·시간·강의실·강사·수강료)는 ClassContext(실제 반)에서 연결한다.

import { useMemo, useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  ChevronLeft, Phone, User, CreditCard, CalendarCheck, BookOpen, BarChart2,
  Users, KeyRound, Power, Plus, ArrowRightLeft, Receipt, Target, FileText,
  Bell, CheckCircle2, XCircle, AlertTriangle, Info, Link2, StickyNote, X,
  Trophy, Zap, Star, Swords, Award,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { StatusBadge, GradeBadge, formatDate } from '@/components/StatusBadge';
import { useStudents } from '@/contexts/StudentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import EnrollmentFormModal from '@/components/EnrollmentFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { isBackOfficeType, canViewStudentGrowth, canAwardSP, canAwardEmblem } from '@/lib/rbac';
import { STATUS_CONFIG, AttendanceStatus } from '@/lib/attendanceData';
import { ClassRoom } from '@/lib/classData';
import { Student, StudentStatus, ClassInfo, InternalScore, MockExamScore } from '@/lib/dummyData';
import { getPublishedResultsForStudent, categoryLabel, StudentExamResult, getUniversityRecommendationReadiness, getMockAccumulationSummary } from '@/lib/assessmentData';
import {
  adaptReadinessFromLms,
  adaptInternalGradesFromLms,
  adaptMockSummaryFromLms,
  safeAssembleUniversityAnalysisInput,
  getUniversityAnalysisInputQuality,
  buildUniversityAnalysisPayloadPreview,
  getUniversityAnalysisHandoffGate,
  buildPhase51AnalyzeRequestDraftBundle,
  deriveGradeLevelFromMockExamScores,
  type Phase51GradeLevel,
  type Phase51Track,
  type Phase51TargetUniversityInputDraft,
  type Phase51ImprovementScenarioInputDraft,
} from '@/lib/universityAnalysisAdapter';
import { nanoid } from 'nanoid';
import {
  callPhase51AnalyzeApi,
  type Phase51ApiStatus,
  type Phase51AnalyzeResponse,
} from '@/lib/universityAnalysisClient';
import {
  getActiveClasses, getPastClasses, resolveClassView, timeSlotsToSchedule, ClassView,
  getUnivDataStatus, getUnivChecklist, UNIV_STATUS_STYLE,
  getFinance, formatWon,
  GRADE_TYPES, GradeType, gradeTypeFromParam,
} from '@/lib/studentDerived';
import { cn } from '@/lib/utils';
import { useGrowth } from '@/contexts/GrowthContext';
import {
  TIER_LABELS, TIER_COLORS, MATERIAL_LABELS, MATERIAL_BADGE,
  CATEGORY_LABELS, SOURCE_TYPE_LABELS, StudentTier,
} from '@/lib/growthData';

// ════════════════════════════════════════════════════════════
// 공통 작은 컴포넌트
// ════════════════════════════════════════════════════════════
function Area({ title, desc, action, children }: { title: string; desc?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="axis-card p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>{title}</h3>
          {desc && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
      <div className="text-xs mb-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
      <div className="text-sm" style={{ color: 'oklch(0.22 0.02 250)' }}>{children}</div>
    </div>
  );
}

function ReadOnlyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-3 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
      <Info size={13} /> {children}
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5 text-center" style={{ background: tone }}>
      <div className="text-lg font-bold tabular-nums" style={{ color: 'oklch(0.25 0.03 250)' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.45 0.02 250)' }}>{label}</div>
    </div>
  );
}

function AttStatusPill({ status }: { status: AttendanceStatus }) {
  const c = STATUS_CONFIG[status];
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{c.label}</span>;
}

// ════════════════════════════════════════════════════════════
// 메인
// ════════════════════════════════════════════════════════════
type TabKey = 'basic' | 'guardian' | 'enrollment' | 'attendance' | 'grades' | 'finance' | 'growth';

export default function StudentDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { getStudent } = useStudents();
  const { can, canAccessStudent, canViewFinance: authCanViewFinance } = useAuth();

  const student = getStudent(params.id);
  // 재무 탭은 finance.view 권한과 canAccessStudent(studentId)를 모두 통과해야 노출
  const showFinance = !!student && authCanViewFinance(student.id);
  const canEditStudent = can('student.update');
  const canWithdrawStudent = can('student.withdraw');

  const initial = useMemo(() => {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    let tab = (sp.get('tab') as TabKey) || 'basic';
    if (tab === 'finance' && !showFinance) tab = 'basic';
    const valid: TabKey[] = ['basic', 'guardian', 'enrollment', 'attendance', 'grades', 'finance', 'growth'];
    if (!valid.includes(tab)) tab = 'basic';
    return { tab, gradeType: gradeTypeFromParam(sp.get('gradeType')) };
  }, [showFinance]);

  const [tab, setTab] = useState<TabKey>(initial.tab);

  if (!student) {
    return (
      <AdminLayout title="학생 상세" breadcrumbs={[{ label: '학생관리', path: '/students' }, { label: '학생 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>학생을 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/admin/students')} className="mt-3 text-sm font-medium" style={{ color: 'oklch(0.45 0.2 277)' }}>← 학생 목록으로</button>
        </div>
      </AdminLayout>
    );
  }

  if (!canAccessStudent(student.id)) {
    return (
      <AdminLayout title="학생 상세" breadcrumbs={[{ label: '학생관리', path: '/students' }, { label: '학생 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>이 학생 정보에 접근할 권한이 없습니다.</p>
          <button onClick={() => navigate('/admin/students')} className="mt-3 text-sm font-medium" style={{ color: 'oklch(0.45 0.2 277)' }}>← 학생 목록으로</button>
        </div>
      </AdminLayout>
    );
  }

  const { currentUser: authUser } = useAuth();
  const showGrowth = canViewStudentGrowth(authUser.accountType);

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: '기본정보', icon: <User size={14} /> },
    { key: 'guardian', label: '보호자·가족', icon: <Users size={14} /> },
    { key: 'enrollment', label: '수강현황', icon: <BookOpen size={14} /> },
    { key: 'attendance', label: '출결현황', icon: <CalendarCheck size={14} /> },
    { key: 'grades', label: '성적조회', icon: <BarChart2 size={14} /> },
    ...(showFinance ? [{ key: 'finance' as TabKey, label: '재무상태', icon: <CreditCard size={14} /> }] : []),
    ...(showGrowth ? [{ key: 'growth' as TabKey, label: '성장/진열장', icon: <Trophy size={14} /> }] : []),
  ];

  return (
    <AdminLayout title={student.name} breadcrumbs={[{ label: '학생관리', path: '/students' }, { label: '학생 목록', path: '/students' }, { label: student.name }]}>
      <button onClick={() => navigate('/admin/students')} className="inline-flex items-center gap-1 text-xs mb-3 hover:underline" style={{ color: 'oklch(0.5 0.015 250)' }}>
        <ChevronLeft size={13} /> 학생 목록
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: 'oklch(0.511 0.262 276.966)' }}>{student.name.charAt(0)}</div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</h1>
            <StatusBadge status={student.status} />
          </div>
          <div className="flex items-center gap-1 text-xs mt-0.5 tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}><Phone size={11} /> {student.phone}</div>
        </div>
      </div>

      <SummaryCards student={student} showFinance={showFinance} onJump={setTab} />

      <div className="axis-detail-tabs mt-5 mb-4" style={{ borderBottom: '1px solid oklch(0.9 0.008 250)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative" style={{ color: tab === t.key ? 'oklch(0.45 0.2 277)' : 'oklch(0.5 0.015 250)' }}>
            {t.icon}{t.label}
            {tab === t.key && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded" style={{ background: 'oklch(0.511 0.262 276.966)' }} />}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicInfoTab student={student} />}
      {tab === 'guardian' && <GuardianFamilyTab student={student} onOpenStudent={(id) => navigate(`/admin/students/${id}?tab=guardian`)} />}
      {tab === 'enrollment' && <EnrollmentTab student={student} />}
      {tab === 'attendance' && <AttendanceTab student={student} />}
      {tab === 'grades' && <GradesTab student={student} initialGradeType={initial.gradeType} />}
      {tab === 'finance' && showFinance && <FinanceTab student={student} />}
      {tab === 'growth' && showGrowth && <GrowthShowcaseTab studentId={student.id} studentName={student.name} />}
    </AdminLayout>
  );
}

// ════════════════════════════════════════════════════════════
// 요약 카드 (재무 카드는 권한자에게만)
// ════════════════════════════════════════════════════════════
function SummaryCards({ student, showFinance, onJump }: { student: Student; showFinance: boolean; onJump: (t: TabKey) => void }) {
  const { sessions } = useAttendance();
  const { getClass } = useClasses();
  const active = getActiveClasses(student);
  const first = active[0];
  const firstView = first ? resolveClassView(first, getClass(first.id)) : null;

  const ym = currentYm();
  const monthCounts = useMemo(() => countAttendance(sessions, student.id, ym), [sessions, student.id, ym]);

  const mock = student.mockExamScores[0];
  const univ = getUnivDataStatus(student);
  const us = UNIV_STATUS_STYLE[univ];
  const fin = getFinance(student, getClass);

  const card = 'axis-card p-3.5 cursor-pointer hover:border-indigo-200 transition-colors';
  const cardLabel = (icon: React.ReactNode, label: string) => (
    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>{icon}{label}</div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div className={card} onClick={() => onJump('basic')}>
        {cardLabel(<User size={13} />, '학생정보')}
        <div className="text-sm font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</div>
        <div className="text-xs tabular-nums mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{student.phone}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge status={student.status} />
          <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>수강 {active.length}반</span>
        </div>
      </div>

      <div className={card} onClick={() => onJump('enrollment')}>
        {cardLabel(<BookOpen size={13} />, '수강현황')}
        {firstView ? (
          <>
            <div className="text-sm font-semibold truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>{firstView.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{firstView.teacher} 강사</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{firstView.days} {firstView.time}</div>
          </>
        ) : <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>수강 반 없음</div>}
      </div>

      <div className={card} onClick={() => onJump('attendance')}>
        {cardLabel(<CalendarCheck size={13} />, '출결현황 · 이번 달')}
        <div className="grid grid-cols-4 gap-1 mt-1">
          {([['출석', monthCounts.출석, 'oklch(0.4 0.12 160)'], ['결석', monthCounts.결석, 'oklch(0.5 0.2 27)'], ['지각', monthCounts.지각, 'oklch(0.5 0.13 60)'], ['조퇴', monthCounts.조퇴, 'oklch(0.5 0.13 30)']] as const).map(([l, v, c]) => (
            <div key={l} className="text-center">
              <div className="text-base font-bold tabular-nums" style={{ color: c }}>{v}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={card} onClick={() => onJump('grades')}>
        {cardLabel(<BarChart2 size={13} />, '최근성적')}
        {mock ? (
          <>
            <div className="text-sm font-semibold truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>{mock.examName}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>총점 {mock.totalScore ?? '-'}</span>
              {mock.korean && <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>국{mock.korean.grade}</span>}
              {mock.math && <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>수{mock.math.grade}</span>}
              {mock.english && <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>영{mock.english.grade}</span>}
            </div>
          </>
        ) : <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>성적 데이터 없음</div>}
      </div>

      {showFinance && (
        <div className={card} onClick={() => onJump('finance')}>
          {cardLabel(<CreditCard size={13} />, '재무상태 · 이번 달')}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: fin.status === '미납' ? 'oklch(0.5 0.2 27)' : 'oklch(0.2 0.02 250)' }}>{fin.status}</span>
            {fin.hasUnpaid && <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">미납 {formatWon(fin.unpaid)}</span>}
          </div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.5 0.015 250)' }}>{fin.refundRequested ? `환불 ${fin.refundApproveStatus}` : '환불 없음'}</div>
        </div>
      )}

      <div className={card} onClick={() => onJump('grades')}>
        {cardLabel(<Target size={13} />, '대학추천 데이터')}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: us.bg, color: us.text, border: `1px solid ${us.border}` }}>{univ}</span>
        <div className="text-xs mt-1.5" style={{ color: 'oklch(0.55 0.015 250)' }}>입력 상태만 판단 (추천 미계산)</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 1) 기본정보 탭 (+ 운영메모 로그 — Back Office 내부 기록)
// ════════════════════════════════════════════════════════════
function BasicInfoTab({ student }: { student: Student }) {
  const { setStudentStatus, addOperationMemo } = useStudents();
  const { currentUser, can, canResetPassword } = useAuth();
  const showMemo = isBackOfficeType(currentUser.accountType);
  const canEdit = can('student.update');
  const canWithdraw = can('student.withdraw');
  // 학생 계정 비밀번호 초기화 가능 여부: student.passwordReset 또는 system.passwordReset + canResetPassword(대상,계정유형,학생id)
  const allowResetPw = canResetPassword(`student-account-${student.id}`, 'STUDENT', student.id);

  const [memoText, setMemoText] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const changeStatus = (status: StudentStatus) => {
    if (!canEdit) { toast.error('재원 상태 변경 권한이 없습니다.'); return; }
    setStudentStatus(student.id, status);
    toast.success(`재원 상태가 '${status}'(으)로 변경되었습니다.`);
  };
  const withdraw = () => {
    if (!canWithdraw) { toast.error('퇴원/비활성 처리 권한이 없습니다.'); return; }
    if (!confirm(`${student.name} 학생을 퇴원/비활성 처리할까요?\n실제 데이터는 삭제되지 않으며 퇴원 상태로 전환됩니다.`)) return;
    setStudentStatus(student.id, '퇴원');
    toast.success('퇴원/비활성 처리되었습니다. 데이터는 보존됩니다.');
  };
  const confirmResetPw = () => {
    setResetConfirmOpen(false);
    toast.success(`${student.name} 학생 계정의 비밀번호가 초기화되었습니다. (안내 발송 — 시스템설정 연동 예정)`);
  };
  const addMemo = () => {
    if (!memoText.trim()) return;
    addOperationMemo(student.id, { date: new Date().toISOString().split('T')[0], content: memoText.trim(), author: currentUser.name });
    toast.success('운영메모가 기록되었습니다. (Back Office 내부 기록)');
    setMemoText('');
  };

  const accountActive = student.status !== '퇴원';
  const statusBtn = (s: StudentStatus, color: string) => (
    <button key={s} disabled={!canEdit} onClick={() => changeStatus(s)} className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ borderColor: student.status === s ? color : 'oklch(0.9 0.008 250)', background: student.status === s ? color : 'white', color: student.status === s ? 'white' : 'oklch(0.4 0.02 250)' }}>{s}</button>
  );

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-3">
        <Area title="학생 기본정보">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              {student.photo ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover rounded-lg" /> : student.name.charAt(0)}
            </div>
            <div className="flex-1">
              <Field label="학생명">{student.name}</Field>
              <Field label="휴대폰번호"><span className="tabular-nums">{student.phone}</span></Field>
            </div>
          </div>
          <Field label="재원 상태"><StatusBadge status={student.status} /></Field>
          <Field label="등록일">{formatDate(student.registeredAt)}</Field>
          <Field label="퇴원일">{student.withdrawnAt ? formatDate(student.withdrawnAt) : '-'}</Field>
          <p className="text-xs mt-2" style={{ color: 'oklch(0.6 0.015 250)' }}>※ 생년월일·학습목표·학생메모 단독 필드는 수집하지 않습니다.</p>
        </Area>

        <div>
          <Area title="계정 정보" desc="로그인 계정은 학생 등록 시 자동 생성됩니다.">
            <Field label="로그인 휴대폰번호"><span className="tabular-nums">{student.phone}</span></Field>
            <Field label="계정 상태">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', accountActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{accountActive ? '활성' : '비활성'}</span>
            </Field>
            {allowResetPw ? (
              <button onClick={() => setResetConfirmOpen(true)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>
                <KeyRound size={13} /> 비밀번호 초기화
              </button>
            ) : (
              <p className="mt-3 text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 비밀번호 초기화 권한이 없습니다.</p>
            )}
          </Area>

          <Area title="관리 정보">
            <div className="text-xs mb-1.5" style={{ color: 'oklch(0.55 0.015 250)' }}>재원 상태 변경{!canEdit && <span className="ml-1" style={{ color: 'oklch(0.6 0.015 250)' }}>(student.update 권한 필요)</span>}</div>
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1 mr-1"><Power size={13} style={{ color: 'oklch(0.5 0.015 250)' }} /></span>
              {statusBtn('재원', 'oklch(0.5 0.13 160)')}
              {statusBtn('휴원', 'oklch(0.55 0.13 80)')}
              {statusBtn('퇴원', 'oklch(0.5 0.02 250)')}
            </div>
            {canWithdraw ? (
              <div className="pt-3" style={{ borderTop: '1px solid oklch(0.95 0.006 250)' }}>
                <button onClick={withdraw} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-rose-50" style={{ borderColor: 'oklch(0.88 0.08 27)', color: 'oklch(0.5 0.2 27)' }}>
                  <Power size={13} /> 퇴원/비활성 처리
                </button>
                <p className="text-xs mt-1.5" style={{ color: 'oklch(0.6 0.015 250)' }}>실제 DB 삭제가 아닌 비활성(퇴원) 처리입니다. 데이터는 보존됩니다.</p>
              </div>
            ) : (
              <p className="text-xs pt-3 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)', borderTop: '1px solid oklch(0.95 0.006 250)' }}><Info size={11} /> 퇴원/비활성 처리 권한(student.withdraw)이 없습니다.</p>
            )}
          </Area>
        </div>
      </div>

      {/* 운영메모 로그 — Back Office 내부 기록 (학생/학부모 비노출) */}
      {showMemo && (
        <Area
          title="운영메모 로그"
          desc="최고관리자·원장·행정 내부 기록입니다. 학생·학부모 화면에는 절대 노출되지 않습니다."
          action={<span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'oklch(0.96 0.02 250)', color: 'oklch(0.45 0.1 250)' }}><StickyNote size={11} /> 내부 전용</span>}
        >
          <div className="flex gap-2 mb-3">
            <input value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="운영메모를 입력하세요 (예: 학습 태도, 결제 협의, 반 이동 사유 등)" className="flex-1 text-sm px-3 py-2 rounded-md border" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
            <button onClick={addMemo} className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}><Plus size={14} /> 기록</button>
          </div>
          {student.operationMemos.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>기록된 운영메모가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {[...student.operationMemos].reverse().map((m) => (
                <div key={m.id} className="p-2.5 rounded-md" style={{ background: 'oklch(0.98 0.004 247)', border: '1px solid oklch(0.95 0.006 250)' }}>
                  <div className="text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>{m.content}</div>
                  <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{formatDate(m.date)} · {m.author}</div>
                </div>
              ))}
            </div>
          )}
        </Area>
      )}

      {/* 비밀번호 초기화 확인 모달 — canResetPassword 통과 시에만 버튼 노출, 실행 전 반드시 확인 */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setResetConfirmOpen(false)}>
          <div className="bg-white rounded-lg w-full max-w-sm modal-enter" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>비밀번호 초기화</h3>
              <button onClick={() => setResetConfirmOpen(false)}><X size={16} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
            </div>
            <div className="p-4">
              <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
                <b>{student.name}</b> 학생 계정의 비밀번호를 초기화합니다. 새 임시 비밀번호 안내가 등록된 휴대폰번호로 발송됩니다.
              </p>
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 이 계정 1건만 초기화됩니다. 일괄·전체 초기화는 제공되지 않습니다.</p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setResetConfirmOpen(false)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={confirmResetPw} className="px-3 py-1.5 rounded-md text-sm text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}>초기화 실행</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 2) 보호자·가족 탭
// ════════════════════════════════════════════════════════════
function GuardianFamilyTab({ student, onOpenStudent }: { student: Student; onOpenStudent: (id: string) => void }) {
  const { students, updateStudent } = useStudents();
  const { can, canAccessStudent } = useAuth();
  // AXIS 확정 원칙: 보호자 추가·알림 수신 상태 변경 등 정보 변경 액션은 반드시 student.update 권한이 있을 때만 가능하다.
  const canEdit = can('student.update');
  const [optedOut, setOptedOut] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '어머니', phone: '' });

  const myPhones = new Set(student.guardians.map((g) => g.phone.replace(/-/g, '')));
  // 가족 연결 데이터 범위: 전체 students를 그대로 노출하지 않고, canAccessStudent를 통과한 학생만 노출한다.
  // 권한 밖 형제자매의 이름·휴대폰번호·상태는 노출되지 않으며, 존재 여부만 안내한다.
  const allSiblings = students.filter((o) => {
    if (o.id === student.id) return false;
    if (student.familyGroupId && o.familyGroupId === student.familyGroupId) return true;
    return o.guardians.some((g) => myPhones.has(g.phone.replace(/-/g, '')));
  });
  const siblings = allSiblings.filter((o) => canAccessStudent(o.id));
  const hiddenSiblingCount = allSiblings.length - siblings.length;

  const addGuardian = () => {
    if (!canEdit) { toast.error('보호자 추가 권한(student.update)이 없습니다.'); return; }
    if (!form.name.trim() || !form.phone.trim()) { toast.error('보호자명과 휴대폰번호를 입력하세요.'); return; }
    updateStudent(student.id, { guardians: [...student.guardians, { id: `g-${Date.now()}`, name: form.name.trim(), relation: form.relation, phone: form.phone.trim() }] });
    toast.success('보호자가 추가되었습니다. 동일 번호가 있으면 가족 연결이 자동 감지됩니다.');
    setForm({ name: '', relation: '어머니', phone: '' });
    setAdding(false);
  };

  const toggleNotify = (guardianId: string) => {
    if (!canEdit) { toast.error('알림 수신 상태 변경 권한(student.update)이 없습니다.'); return; }
    setOptedOut((prev) => { const n = new Set(prev); n.has(guardianId) ? n.delete(guardianId) : n.add(guardianId); return n; });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div>
        <Area
          title="보호자 정보"
          desc="보호자는 여러 명 등록할 수 있습니다."
          action={canEdit ? (
            <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}><Plus size={12} /> 보호자 추가</button>
          ) : undefined}
        >
          {!canEdit && (
            <p className="text-xs mb-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 읽기 전용입니다. 보호자 추가는 student.update 권한이 필요합니다.</p>
          )}
          {adding && canEdit && (
            <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 rounded-md" style={{ background: 'oklch(0.98 0.004 247)' }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="보호자명" className="text-xs px-2 py-1.5 rounded border" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} className="text-xs px-2 py-1.5 rounded border" style={{ borderColor: 'oklch(0.9 0.008 250)' }}>{['어머니', '아버지', '할머니', '할아버지', '기타'].map((r) => <option key={r}>{r}</option>)}</select>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" className="text-xs px-2 py-1.5 rounded border tabular-nums" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              <button onClick={addGuardian} className="col-span-3 text-xs py-1.5 rounded text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}>저장</button>
            </div>
          )}
          {student.guardians.length === 0 && <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>등록된 보호자가 없습니다.</p>}
          {student.guardians.map((g, i) => (
            <div key={g.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.22 0.02 250)' }}>{g.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.005 250)', color: 'oklch(0.45 0.015 250)' }}>{g.relation}</span>
                  {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.95 0.04 277)', color: 'oklch(0.45 0.2 277)' }}>대표</span>}
                </div>
                <div className="text-xs tabular-nums mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{g.phone}</div>
              </div>
            </div>
          ))}
        </Area>

        <Area title="알림 기준" desc="알림은 대표 보호자에게 기본 발송됩니다.">
          {!canEdit && student.guardians.length > 0 && (
            <p className="text-xs mb-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 읽기 전용입니다. 알림 수신 상태 변경은 student.update 권한이 필요합니다.</p>
          )}
          {student.guardians.map((g, i) => {
            const on = !optedOut.has(g.id);
            return (
              <div key={g.id} className="flex items-center justify-between py-2">
                <span className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{g.name} <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>({g.relation}{i === 0 ? ' · 대표' : ''})</span></span>
                {canEdit ? (
                  <button onClick={() => toggleNotify(g.id)} className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full', on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}><Bell size={11} /> {on ? '수신' : '미수신'}</button>
                ) : (
                  <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full opacity-60', on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}><Bell size={11} /> {on ? '수신' : '미수신'}</span>
                )}
              </div>
            );
          })}
        </Area>
      </div>

      <Area title="가족 연결" desc="동일 보호자 휴대폰번호가 발견되면 Family Engine이 자동으로 연결합니다.">
        {siblings.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>연결된 형제자매가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}><Link2 size={12} /> 연결된 형제자매 {siblings.length}명</div>
            {siblings.map((sib) => (
              <button key={sib.id} onClick={() => onOpenStudent(sib.id)} className="w-full flex items-center justify-between p-2.5 rounded-md text-left transition-colors hover:bg-slate-50" style={{ border: '1px solid oklch(0.93 0.008 250)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'oklch(0.6 0.05 277)' }}>{sib.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>{sib.name}</div>
                    <div className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>{sib.phone}</div>
                  </div>
                </div>
                <StatusBadge status={sib.status} />
              </button>
            ))}
          </div>
        )}
        {hiddenSiblingCount > 0 && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 권한 밖 가족 정보는 표시되지 않습니다.</p>
        )}
      </Area>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 3) 수강현황 탭 — 실제 반 데이터 연결, 추가(시작일 필수)/종료(모달)
// ════════════════════════════════════════════════════════════
function EnrollmentTab({ student }: { student: Student }) {
  const { can, currentUser } = useAuth();
  const { getClass } = useClasses();
  const { getEnrollmentsByStudent, endEnrollment, withdrawEnrollment, updateEnrollmentMemo } = useEnrollment();
  const canEdit = can('student.update'); // 메모 확인/수정은 기존과 동일한 권한 기준 유지(학생 정보 수정 범주)
  // AXIS 정책: 수강 등록/종료/퇴원은 Finance Engine의 청구/정산 기준이 되므로, student.update 권한만으로는
  // 부족하다. 최고관리자/원장/행정 계열만 가능하고, 강사는 조회만 가능하며 등록/종료/퇴원 버튼 자체를
  // 표시하지 않는다(disabled가 아니라 미노출). 새 권한키를 추가하지 않고 currentUser.accountType만으로 판별한다.
  const canManageEnrollment =
    currentUser.accountType === 'SUPER_ADMIN' ||
    currentUser.accountType === 'DIRECTOR' ||
    currentUser.accountType === 'STAFF';

  const today = new Date().toISOString().split('T')[0];
  const allEnrollments = getEnrollmentsByStudent(student.id);
  const active = allEnrollments.filter((e) => e.status === '수강중');
  const past = allEnrollments.filter((e) => e.status !== '수강중');

  const [formOpen, setFormOpen] = useState(false);
  const [endModal, setEndModal] = useState<{ enrollmentId: string; className: string; mode: '종료' | '퇴원' } | null>(null);
  const [endDate, setEndDate] = useState(today);
  const [endMemo, setEndMemo] = useState('');
  const [memoModal, setMemoModal] = useState<{ enrollmentId: string; className: string } | null>(null);
  const [memoInput, setMemoInput] = useState('');

  const openEnd = (enrollmentId: string, className: string, mode: '종료' | '퇴원') => {
    if (!canManageEnrollment) { toast.error(`수강 ${mode} 처리는 최고관리자/원장/행정만 가능합니다.`); return; }
    setEndModal({ enrollmentId, className, mode }); setEndDate(today); setEndMemo('');
  };
  const confirmEnd = () => {
    if (!endModal) return;
    if (!endDate) { toast.error('종료일은 필수입니다.'); return; }
    if (endModal.mode === '종료') endEnrollment(endModal.enrollmentId, endDate, endMemo.trim() || undefined);
    else withdrawEnrollment(endModal.enrollmentId, endDate, endMemo.trim() || undefined);
    toast.success(`${endModal.className} 수강이 ${endDate}자로 ${endModal.mode} 처리되었습니다.`);
    setEndModal(null);
  };

  const openMemo = (enrollmentId: string, className: string, currentMemo?: string) => {
    setMemoModal({ enrollmentId, className }); setMemoInput(currentMemo ?? '');
  };
  const saveMemo = () => {
    if (!memoModal) return;
    if (!canEdit) { toast.error('메모 수정 권한(student.update)이 없습니다.'); return; }
    updateEnrollmentMemo(memoModal.enrollmentId, memoInput.trim());
    toast.success('메모가 저장되었습니다.');
    setMemoModal(null);
  };

  return (
    <div>
      <Area
        title="현재 수강반"
        desc="학생 1명은 여러 반을 동시에 수강할 수 있습니다. 반유형·요일·시간은 반관리(ClassContext)에서 가져옵니다."
        action={canManageEnrollment ? (
          <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
            <Plus size={12} /> 반 등록
          </button>
        ) : undefined}
      >
        {active.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>수강 중인 반이 없습니다.</p>
        ) : (
          <div className="axis-table-wrap">
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
                  {['반명', '반유형', '담당강사', '수업요일', '수업시간', '수강 시작일', '수강료', '관리'].map((h) => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {active.map((e) => {
                  const klass = getClass(e.classId);
                  const v: ClassView = resolveClassView({ id: e.classId, name: '', subject: '', teacher: '', schedule: '', startDate: e.startDate, status: '수강중' }, klass);
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                      <td className="px-2.5 py-2 font-medium whitespace-nowrap" style={{ color: 'oklch(0.22 0.02 250)' }}>{v.name}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap"><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.005 250)', color: 'oklch(0.45 0.015 250)' }}>{v.category}</span></td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.teacher}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.days}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.time}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{formatDate(e.startDate)}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{e.tuitionAmount ? `${e.tuitionAmount.toLocaleString()}원` : '-'}</td>
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-1">
                          {canManageEnrollment && (
                            <>
                              <button onClick={() => openEnd(e.id, v.name, '종료')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-rose-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.5 0.12 27)' }}>수강 종료</button>
                              <button onClick={() => openEnd(e.id, v.name, '퇴원')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-rose-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.5 0.12 27)' }}>퇴원 처리</button>
                            </>
                          )}
                          <button onClick={() => openMemo(e.id, v.name, e.memo)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.45 0.015 250)' }}>
                            <StickyNote size={11} /> 메모{e.memo ? '' : ' 추가'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Area>

      <Area title="과거 수강이력">
        {past.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>과거 수강이력이 없습니다.</p>
        ) : past.map((e) => {
          const klass = getClass(e.classId);
          const v = resolveClassView({ id: e.classId, name: '', subject: '', teacher: '', schedule: '', startDate: e.startDate, status: '수강완료' }, klass);
          return (
            <div key={e.id} className="py-2" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{v.name}</div>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.005 250)', color: 'oklch(0.45 0.015 250)' }}>{e.status}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{v.teacher} · {formatDate(e.startDate)} ~ {e.endDate ? formatDate(e.endDate) : '-'}</div>
              {e.memo && <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.05 27)' }}>메모: {e.memo}</div>}
            </div>
          );
        })}
      </Area>

      {/* 반 등록 모달 */}
      <EnrollmentFormModal open={formOpen} onClose={() => setFormOpen(false)} studentId={student.id} />

      {/* 수강 종료/퇴원 모달 */}
      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setEndModal(null)}>
          <div className="bg-white rounded-lg w-full max-w-md modal-enter" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>수강 {endModal.mode} — {endModal.className}</h3>
              <button onClick={() => setEndModal(null)}><X size={16} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="block">
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{endModal.mode}일<span style={{ color: 'oklch(0.55 0.2 27)' }}> *</span></span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full text-sm px-2.5 py-2 rounded-md border tabular-nums" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              </label>
              <label className="block">
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{endModal.mode} 사유 (선택)</span>
                <textarea value={endMemo} onChange={(e) => setEndMemo(e.target.value)} rows={3} placeholder={endModal.mode === '종료' ? '예: 반 변경, 상위반 이동 등' : '예: 개인 사정으로 수강 중단'} className="mt-1 w-full text-sm px-2.5 py-2 rounded-md border resize-none" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              </label>
              <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 저장 시 해당 수강은 {endModal.mode} 처리되고 {endModal.mode}일이 기록됩니다(삭제되지 않고 이력으로 보관됩니다).</p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setEndModal(null)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={confirmEnd} className="px-3 py-1.5 rounded-md text-sm text-white" style={{ background: 'oklch(0.5 0.18 27)' }}>{endModal.mode}</button>
            </div>
          </div>
        </div>
      )}

      {/* 메모 확인/수정 모달 */}
      {memoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setMemoModal(null)}>
          <div className="bg-white rounded-lg w-full max-w-md modal-enter" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>수강 메모 — {memoModal.className}</h3>
              <button onClick={() => setMemoModal(null)}><X size={16} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                rows={4}
                placeholder="이 수강과 관련된 메모를 입력하세요"
                disabled={!canEdit}
                className="w-full text-sm px-2.5 py-2 rounded-md border resize-none disabled:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)' }}
              />
              {!canEdit && <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 읽기 전용입니다. 메모 수정은 student.update 권한이 필요합니다.</p>}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setMemoModal(null)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>닫기</button>
              {canEdit && <button onClick={saveMemo} className="px-3 py-1.5 rounded-md text-sm text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}>저장</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 4) 출결현황 탭 (조회 전용)
// ════════════════════════════════════════════════════════════
function AttendanceTab({ student }: { student: Student }) {
  const { sessions } = useAttendance();
  const { getClass } = useClasses();
  const records = useMemo(() => {
    return sessions
      .flatMap((sess) => sess.records.filter((r) => r.studentId === student.id).map((r) => ({ ...r, className: getClass(r.classId)?.name ?? r.classId })))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, student.id, getClass]);

  const ym = currentYm();
  const month = records.filter((r) => r.date.startsWith(ym));
  const counts = countRecords(month);
  const notifyRecords = records.filter((r) => r.status === '결석' || r.status === '조퇴');
  const primaryGuardian = student.guardians[0];

  return (
    <div>
      <ReadOnlyHint>출결 입력은 <b>출결관리 › 출결체크</b>에서 진행합니다. 이 화면은 조회 전용입니다.</ReadOnlyHint>

      <Area title="이번 달 출결 요약" desc={`${ym} 기준`}>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StatPill label="출석" value={counts.출석} tone="oklch(0.95 0.06 160)" />
          <StatPill label="결석" value={counts.결석} tone="oklch(0.96 0.06 27)" />
          <StatPill label="지각" value={counts.지각} tone="oklch(0.96 0.06 60)" />
          <StatPill label="조퇴" value={counts.조퇴} tone="oklch(0.96 0.05 30)" />
          <StatPill label="보강출석" value={counts.보강출석} tone="oklch(0.96 0.04 250)" />
          <StatPill label="공결" value={counts.공결} tone="oklch(0.97 0.005 250)" />
        </div>
      </Area>

      <Area title="월별 출결 캘린더" desc={`${ym}`}><MonthCalendar ym={ym} records={month} /></Area>

      <Area title="출결 상세 목록">
        {records.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>출결 기록이 없습니다.</p>
        ) : (
          <div className="axis-table-wrap">
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
                  {['날짜', '수강반', '출결 상태', '사유', '입력자', '알림 발송'].map((h) => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                    <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.35 0.015 250)' }}>{r.date}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{r.className}</td>
                    <td className="px-2.5 py-2"><AttStatusPill status={r.status} /></td>
                    <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{r.reason || '-'}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{r.createdBy}</td>
                    <td className="px-2.5 py-2">{r.notified ? <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={12} /> 발송</span> : <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Area>

      <Area title="알림 이력" desc="결석·조퇴 시 대표 보호자에게 자동 발송됩니다.">
        {notifyRecords.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>발송 대상 알림이 없습니다.</p>
        ) : notifyRecords.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
            <div className="flex items-center gap-2">
              <AttStatusPill status={r.status} />
              <span className="text-xs tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{r.date} · {r.className}</span>
            </div>
            <div className="text-xs text-right" style={{ color: 'oklch(0.5 0.015 250)' }}>
              {r.notified ? <span className="inline-flex items-center gap-1 text-emerald-600"><Bell size={11} /> {primaryGuardian?.name ?? '대표 보호자'} · {r.notifyChannel} {r.notifyTime}</span> : <span className="inline-flex items-center gap-1" style={{ color: 'oklch(0.55 0.12 60)' }}><AlertTriangle size={11} /> 미발송</span>}
            </div>
          </div>
        ))}
      </Area>
    </div>
  );
}

function MonthCalendar({ ym, records }: { ym: string; records: { date: string; status: AttendanceStatus }[] }) {
  const [y, m] = ym.split('-').map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const byDay: Record<number, AttendanceStatus> = {};
  records.forEach((r) => { byDay[Number(r.date.slice(8, 10))] = r.status; });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">{['일', '월', '화', '수', '목', '금', '토'].map((w) => <div key={w} className="text-center text-xs py-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{w}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const st = d ? byDay[d] : undefined;
          const c = st ? STATUS_CONFIG[st] : null;
          return (
            <div key={i} className="aspect-square rounded-md flex flex-col items-center justify-center text-xs" style={{ background: c ? c.bg : d ? 'oklch(0.985 0.003 247)' : 'transparent', border: d ? '1px solid oklch(0.95 0.006 250)' : 'none' }}>
              {d && <span style={{ color: c ? c.text : 'oklch(0.5 0.015 250)' }}>{d}</span>}
              {c && <span className="text-[9px] leading-none mt-0.5" style={{ color: c.text }}>{c.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 5) 성적조회 탭 (종류 선택: 전체/내신/전국연합/내신대비/수능실전)
// ════════════════════════════════════════════════════════════
function GradesTab({ student, initialGradeType }: { student: Student; initialGradeType: GradeType }) {
  const [gradeType, setGradeType] = useState<GradeType>(initialGradeType);
  const [draftTrack, setDraftTrack] = useState<Phase51Track | null>(null);
  const [draftGradeLevel, setDraftGradeLevel] = useState<Phase51GradeLevel | null>(null);
  const [draftTargetUniversities, setDraftTargetUniversities] = useState<Phase51TargetUniversityInputDraft[]>([]);
  const [targetInput, setTargetInput] = useState({ univName: '', deptName: '' });
  const [draftScenarioInput, setDraftScenarioInput] = useState({
    mathStdScoreDelta: '',
    mathPercentileDelta: '',
    mathGradeUp: '',
  });
  const [apiStatus, setApiStatus] = useState<Phase51ApiStatus>('idle');
  const [apiResponse, setApiResponse] = useState<Phase51AnalyzeResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { exams, submissions } = useAssessment();

  const mockFiltered = useMemo(() => {
    if (gradeType === '전국연합모의고사' || gradeType === '내신대비모의고사' || gradeType === '수능실전모의고사') {
      return student.mockExamScores.filter((e) => e.examCategory === gradeType);
    }
    return [];
  }, [gradeType, student.mockExamScores]);

  // Assessment Engine(시험관리)에서 이 학생에게 공개(또는 채점완료) 가능한 결과만 가져온다.
  // getPublishedResultsForStudent()가 이미 "공개되지 않은 결과는 제외"를 보장하므로 여기서는
  // 카테고리별 자동 분류만 한다 — 단원평가/인증평가/입학테스트는 대학추천 계산과 연결하지 않는다.
  const assessmentResults = useMemo(
    () => getPublishedResultsForStudent(exams, submissions, student.id),
    [exams, submissions, student.id]
  );
  const mockSchoolResults = useMemo(() => assessmentResults.filter((r) => r.categoryId === 'mock-school'), [assessmentResults]);
  const mockSuneungResults = useMemo(() => assessmentResults.filter((r) => r.categoryId === 'mock-suneung'), [assessmentResults]);
  // 기타평가: 입학테스트 / 단원평가 / 인증평가 — 대학추천과 연결하지 않음
  const schoolEvalResults = useMemo(
    () => assessmentResults.filter((r) => r.categoryId === 'unit-eval' || r.categoryId === 'certification' || r.categoryId === 'entrance-test'),
    [assessmentResults]
  );

  const univ = getUnivDataStatus(student);
  const us = UNIV_STATUS_STYLE[univ];
  const checklist = getUnivChecklist(student);

  // Assessment Engine 기반 수능실전모의 준비 상태 — University Recommendation Readiness Foundation v1
  const readiness = useMemo(
    () => getUniversityRecommendationReadiness(assessmentResults),
    [assessmentResults]
  );

  // ── University Analysis Adapter Input Bridge v1 ──────────
  // LMS 데이터 → 어댑터 입력 타입으로 변환 (엔진 호출 없음)
  const adapterReadiness = useMemo(
    () => adaptReadinessFromLms(readiness, student.internalScores.length > 0, student.mockExamScores.length > 0),
    [readiness, student.internalScores.length, student.mockExamScores.length]
  );
  const adapterInternalGrades = useMemo(
    () => adaptInternalGradesFromLms(student.internalScores),
    [student.internalScores]
  );
  const suneungAccum = useMemo(() => {
    const sorted = [...mockSuneungResults].sort((a, b) => a.examDate.localeCompare(b.examDate));
    return getMockAccumulationSummary(sorted);
  }, [mockSuneungResults]);
  const mockSchoolAccum = useMemo(() => {
    const sorted = [...mockSchoolResults].sort((a, b) => a.examDate.localeCompare(b.examDate));
    return getMockAccumulationSummary(sorted);
  }, [mockSchoolResults]);
  const adapterMockSummaries = useMemo(() => {
    const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];
    if (suneungAccum.totalRounds > 0) list.push(adaptMockSummaryFromLms('mock-suneung', suneungAccum));
    if (mockSchoolAccum.totalRounds > 0) list.push(adaptMockSummaryFromLms('mock-school', mockSchoolAccum));
    return list;
  }, [suneungAccum, mockSchoolAccum]);
  const analysisInput = useMemo(
    () => safeAssembleUniversityAnalysisInput(student.id, student.name, adapterReadiness, adapterInternalGrades, adapterMockSummaries),
    [student.id, student.name, adapterReadiness, adapterInternalGrades, adapterMockSummaries]
  );
  const analysisQuality = useMemo(
    () => getUniversityAnalysisInputQuality(analysisInput),
    [analysisInput]
  );
  const payloadPreview = useMemo(
    () => buildUniversityAnalysisPayloadPreview(analysisInput),
    [analysisInput]
  );
  const handoffGate = useMemo(
    () => getUniversityAnalysisHandoffGate(payloadPreview),
    [payloadPreview]
  );
  // Draft Preview UI Wiring v1 — buildPhase51AnalyzeRequestDraftBundle
  // Target University Draft Input UI Wiring v1 — draftTargetUniversities 연결
  // Improvement Scenario Draft Input UI Wiring v1 — draftScenario 파생 및 연결
  // GradeLevel Input UI Wiring v1 — derivedGradeLevel 자동 파생 + draftGradeLevel 우선 적용
  const derivedGradeLevel = useMemo<Phase51GradeLevel | null>(
    () => deriveGradeLevelFromMockExamScores(student.mockExamScores),
    [student.mockExamScores]
  );

  const draftContext = useMemo(
    () => (draftGradeLevel != null || draftTrack != null)
      ? { gradeLevel: draftGradeLevel, track: draftTrack }
      : undefined,
    [draftGradeLevel, draftTrack]
  );

  const draftScenario = useMemo<Phase51ImprovementScenarioInputDraft | undefined>(() => {
    const s: Phase51ImprovementScenarioInputDraft = {};
    const std = draftScenarioInput.mathStdScoreDelta !== '' ? Number(draftScenarioInput.mathStdScoreDelta) : undefined;
    const pct = draftScenarioInput.mathPercentileDelta !== '' ? Number(draftScenarioInput.mathPercentileDelta) : undefined;
    const grd = draftScenarioInput.mathGradeUp !== '' ? Number(draftScenarioInput.mathGradeUp) : undefined;
    if (std !== undefined && Number.isFinite(std)) s.mathStdScoreDelta = std;
    if (pct !== undefined && Number.isFinite(pct)) s.mathPercentileDelta = pct;
    if (grd !== undefined && Number.isFinite(grd)) s.mathGradeUp = grd;
    return Object.keys(s).length > 0 ? s : undefined;
  }, [draftScenarioInput]);

  const draftBundle = useMemo(
    () => buildPhase51AnalyzeRequestDraftBundle(
      analysisInput,
      student.mockExamScores,
      student.internalScores,
      draftContext,
      draftTargetUniversities.length > 0 ? draftTargetUniversities : undefined,
      draftScenario,
    ),
    [analysisInput, student.mockExamScores, student.internalScores, draftContext, draftTargetUniversities, draftScenario]
  );
  // ────────────────────────────────────────────────────────

  // Response UI Wiring v1 — Phase 5.1 API 호출 핸들러 (사용자 버튼 클릭 시에만 실행)
  const handleRequestAnalysis = () => {
    if (apiStatus === 'pending' || draftBundle.validation.status !== 'ready') return;
    setApiStatus('pending');
    setApiError(null);
    setApiResponse(null);
    void callPhase51AnalyzeApi(draftBundle.draft)
      .then((result) => {
        setApiResponse(result);
        setApiStatus('success');
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : '알 수 없는 에러';
        setApiError(
          message === 'Phase 5.1 API request timed out.'
            ? 'Phase 5.1 응답 시간이 30초를 초과했습니다. 잠시 후 다시 시도해 주세요.'
            : message,
        );
        setApiStatus('error');
      });
  };

  // Stale Response Reset v1 — draftBundle.draft 변경 시 이전 응답 초기화
  useEffect(() => {
    setApiStatus('idle');
    setApiResponse(null);
    setApiError(null);
  }, [draftBundle.draft]);

  // 현재 표시 중인 평가 결과 목록 (기타평가 필터)
  const currentEvalResults = useMemo(() => {
    if (gradeType === '기타평가') return schoolEvalResults;
    return [];
  }, [gradeType, schoolEvalResults]);

  return (
    <div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {GRADE_TYPES.map((t) => (
          <button key={t} onClick={() => setGradeType(t)} className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={{ borderColor: gradeType === t ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.008 250)', background: gradeType === t ? 'oklch(0.511 0.262 276.966)' : 'white', color: gradeType === t ? 'white' : 'oklch(0.4 0.02 250)' }}>{t}</button>
        ))}
      </div>

      {/* 성적 반영 기준 안내 */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-md mb-3 text-xs" style={{ background: 'oklch(0.97 0.01 250)', color: 'oklch(0.5 0.015 250)', border: '1px solid oklch(0.92 0.01 250)' }}>
        <Info size={11} className="flex-shrink-0 mt-0.5" />
        <span>
          <b>학원 전체 시험</b>은 성적 공개 후 표시됩니다. &nbsp;
          <b>반 단위 시험</b>은 해당 학생 채점 완료 시 표시됩니다. &nbsp;
          결석/미채점은 표시되지 않습니다.
        </span>
      </div>

      {gradeType === '전체' ? (
        <>
          <InternalScores scores={student.internalScores} />
          <MockScores title="모의고사 (전체)" scores={student.mockExamScores} />
        </>
      ) : gradeType === '내신성적' ? (
        <InternalScores scores={student.internalScores} />
      ) : gradeType === '기타평가' ? (
        currentEvalResults.length > 0
          ? <AssessmentResultList title="기타평가 (단원평가·인증평가·입학테스트)" results={currentEvalResults} note="대학추천 계산에는 사용되지 않습니다." />
          : <div className="px-3 py-8 text-center text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>채점이 반영된 기타평가 결과가 없습니다.</div>
      ) : (
        <MockScores title={gradeType} scores={mockFiltered} />
      )}

      {/* Assessment Engine(시험관리)에서 채점·공개된 결과 — 성적 종류에 따라 자동 분류해 표시한다. */}
      {(gradeType === '전체' || gradeType === '내신대비모의고사') && mockSchoolResults.length > 0 && (
        <AssessmentResultList title="내신대비모의고사 (시험관리)" results={mockSchoolResults} />
      )}
      {(gradeType === '전체' || gradeType === '수능실전모의고사') && mockSuneungResults.length > 0 && (
        <AssessmentResultList title="수능실전모의고사 (시험관리)" results={mockSuneungResults} />
      )}
      {gradeType === '전체' && schoolEvalResults.length > 0 && (
        <AssessmentResultList
          title="교내 평가 (단원평가·인증평가·입학테스트)"
          results={schoolEvalResults}
          note="대학추천 계산에는 사용되지 않습니다."
        />
      )}

      <Area title="성적 상세 보기" desc="문항 단위 분석은 시험관리 엔진(채점)과 연동됩니다.">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>IF 만약 분석</div>
            <div className="space-y-2">
              {[
                { key: '계산 실수', label: '만약 계산 실수를 줄였다면', color: 'oklch(0.55 0.18 45)', bg: 'oklch(0.97 0.04 60)' },
                { key: '개념 부족', label: '만약 이 개념을 확실히 익혔다면', color: 'oklch(0.45 0.12 250)', bg: 'oklch(0.97 0.03 250)' },
                { key: '시간 부족', label: '만약 시간 배분을 조금 더 잘했다면', color: 'oklch(0.45 0.12 300)', bg: 'oklch(0.97 0.03 300)' },
              ].map(({ key, label, color, bg }) => (
                <div key={key} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: bg }}>
                  <span className="font-semibold flex-shrink-0" style={{ color }}>IF</span>
                  <span style={{ color: 'oklch(0.35 0.015 250)' }}>{label}</span>
                  <span className="ml-auto text-xs italic" style={{ color: 'oklch(0.65 0.01 250)' }}>준비 중</span>
                </div>
              ))}
            </div>
            <div className="text-xs mt-3 font-semibold mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>취약 단원</div>
            <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>문항별 정오표·취약 단원은 채점 데이터 연동 시 표시됩니다.</p>
          </div>
          <div>
            <div className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'oklch(0.45 0.015 250)' }}><Target size={12} /> IF 분석 / 엠블럼</div>
            <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>IF 분석 결과와 엠블럼 획득 조건은 시험관리 엔진의 결과분석과 연동됩니다.</p>
          </div>
        </div>
      </Area>

      <Area title="대학추천 데이터 상태" desc="실제 추천 계산 없이 성적 데이터 입력 상태만 판단합니다.">
        <div className="flex items-center gap-3 mb-3"><span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold" style={{ background: us.bg, color: us.text, border: `1px solid ${us.border}` }}>{univ}</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {([['내신 입력', checklist.hasInternal], ['모의고사 입력', checklist.hasMock], ['수학 입력', checklist.hasMath], ['탐구 입력', checklist.hasInquiry]] as const).map(([label, ok]) => (
            <div key={label} className="flex items-center gap-2 p-2.5 rounded-md" style={{ border: '1px solid oklch(0.93 0.008 250)' }}>
              {ok ? <CheckCircle2 size={15} style={{ color: 'oklch(0.5 0.13 160)' }} /> : <XCircle size={15} style={{ color: 'oklch(0.7 0.02 250)' }} />}
              <span className="text-xs" style={{ color: ok ? 'oklch(0.3 0.02 250)' : 'oklch(0.6 0.015 250)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Assessment Engine 기반 수능실전모의 준비 상태 — University Recommendation Readiness Foundation v1 */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'oklch(0.93 0.008 250)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
              수능실전모의 데이터 준비 상태 (Assessment Engine)
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={
                readiness.status === '충분'
                  ? { background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }
                  : readiness.status === '준비 중'
                  ? { background: 'oklch(0.97 0.06 80)', color: 'oklch(0.45 0.12 80)' }
                  : { background: 'oklch(0.96 0.005 250)', color: 'oklch(0.5 0.015 250)' }
              }
            >
              {readiness.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['응시 회차', readiness.hasRecentScore,    `${readiness.suneungRounds}회`],
              ['최근 점수', readiness.hasRecentScore,    '확인 가능'],
              ['누적 평균', readiness.hasCumulativeAvg,  '산출 가능'],
              ['최근 3회 평균', readiness.hasLast3Avg,   '산출 가능'],
            ] as const).map(([label, ok, okText]) => (
              <div
                key={label}
                className="flex items-center gap-2 p-2.5 rounded-md"
                style={{ border: '1px solid oklch(0.93 0.008 250)' }}
              >
                {ok
                  ? <CheckCircle2 size={13} style={{ color: 'oklch(0.5 0.13 160)' }} />
                  : <XCircle size={13} style={{ color: 'oklch(0.7 0.02 250)' }} />
                }
                <span className="text-xs flex-1" style={{ color: ok ? 'oklch(0.3 0.02 250)' : 'oklch(0.6 0.015 250)' }}>
                  {label}
                </span>
                {ok && (
                  <span className="text-xs tabular-nums ml-auto" style={{ color: 'oklch(0.5 0.015 250)' }}>
                    {okText}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'oklch(0.65 0.01 250)' }}>
            실제 대학명·추천 순위 같은 확정 결과는 표시되지 않으며, 추천 적합도 중심의 참고 지표만 제공됩니다.
          </p>
        </div>
      </Area>

      {/* 상담 리포트 미리보기 — University Report Preview UX v1 */}
      <Area
        title="상담 리포트 미리보기"
        desc="상담 전 성적·실전모의 데이터 준비 상태 요약 — 읽기 전용"
        action={
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.45 0.15 250)' }}>
            <FileText size={11} /> 미리보기
          </span>
        }
      >
        {/* ① 리포트 헤더 */}
        <div className="rounded-lg p-3.5 mb-4" style={{ background: 'oklch(0.965 0.012 250)', border: '1px solid oklch(0.91 0.012 250)' }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>대학추천 상담 준비 상태 요약</div>
            </div>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ background: us.bg, color: us.text, border: `1px solid ${us.border}` }}
            >
              {univ}
            </span>
          </div>
        </div>

        {/* ② 기본 성적 데이터 */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
            <BookOpen size={11} />
            기본 성적 데이터
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['내신 입력',    checklist.hasInternal, checklist.hasInternal ? '입력됨' : '미입력'],
              ['모의고사 입력', checklist.hasMock,     checklist.hasMock     ? '입력됨' : '미입력'],
            ] as [string, boolean, string][]).map(([label, ok, valueText]) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{
                  border: `1px solid ${ok ? 'oklch(0.87 0.07 160)' : 'oklch(0.93 0.008 250)'}`,
                  background: ok ? 'oklch(0.97 0.03 160)' : 'oklch(0.985 0.003 250)',
                }}
              >
                {ok
                  ? <CheckCircle2 size={13} style={{ color: 'oklch(0.5 0.13 160)', flexShrink: 0 }} />
                  : <XCircle     size={13} style={{ color: 'oklch(0.7 0.02 250)', flexShrink: 0 }} />
                }
                <span className="text-xs flex-1" style={{ color: 'oklch(0.35 0.02 250)' }}>{label}</span>
                <span className="text-xs font-medium" style={{ color: ok ? 'oklch(0.35 0.12 160)' : 'oklch(0.6 0.015 250)' }}>
                  {valueText}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ③ 수능실전모의 데이터 */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
            <BarChart2 size={11} />
            수능실전모의 데이터 (Assessment Engine)
          </div>
          <div className="space-y-1.5">
            {([
              ['응시 회차',        readiness.hasRecentScore, `${readiness.suneungRounds}회`],
              ['최근 실전모의 데이터', readiness.hasRecentScore, readiness.hasRecentScore ? '존재' : '없음'],
              ['최근 3회 평균 산출', readiness.hasLast3Avg,   readiness.hasLast3Avg ? '가능' : '불가 (3회 이상 필요)'],
            ] as [string, boolean, string][]).map(([label, ok, valueText]) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{ background: ok ? 'oklch(0.97 0.03 160)' : 'oklch(0.97 0.005 250)' }}
              >
                {ok
                  ? <CheckCircle2 size={13} style={{ color: 'oklch(0.5 0.13 160)', flexShrink: 0 }} />
                  : <XCircle     size={13} style={{ color: 'oklch(0.7 0.02 250)', flexShrink: 0 }} />
                }
                <span className="text-xs flex-1" style={{ color: 'oklch(0.35 0.02 250)' }}>{label}</span>
                <span className="text-xs font-medium tabular-nums" style={{ color: ok ? 'oklch(0.35 0.12 160)' : 'oklch(0.55 0.015 250)' }}>
                  {valueText}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ⑤ 어댑터 입력 구성 상태 — University Analysis Adapter Input Bridge v1 */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
            <Target size={11} />
            분석 입력 구성 상태
          </div>
          <div
            className="rounded-lg px-3.5 py-3"
            style={{ border: '1px solid oklch(0.92 0.01 250)', background: 'oklch(0.985 0.004 250)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>어댑터 입력 상태</span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={
                  analysisInput.readiness.adapterStatus === 'ready'
                    ? { background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }
                    : analysisInput.readiness.adapterStatus === 'partial'
                    ? { background: 'oklch(0.97 0.06 80)', color: 'oklch(0.45 0.12 80)' }
                    : { background: 'oklch(0.96 0.005 250)', color: 'oklch(0.5 0.015 250)' }
                }
              >
                {analysisInput.readiness.adapterStatus === 'ready'
                  ? '입력 구성 완료'
                  : analysisInput.readiness.adapterStatus === 'partial'
                  ? '입력 일부'
                  : '데이터 부족'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ['내신', analysisInput.internalGrades.hasData],
                ['수능실전모의', analysisInput.readiness.suneungRounds > 0],
                ['모의 요약', analysisInput.mockSummaries.length > 0],
              ] as [string, boolean][]).map(([label, ok]) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs"
                  style={{
                    background: ok ? 'oklch(0.97 0.03 160)' : 'oklch(0.97 0.005 250)',
                    border: `1px solid ${ok ? 'oklch(0.88 0.07 160)' : 'oklch(0.93 0.006 250)'}`,
                  }}
                >
                  {ok
                    ? <CheckCircle2 size={11} style={{ color: 'oklch(0.5 0.13 160)', flexShrink: 0 }} />
                    : <XCircle     size={11} style={{ color: 'oklch(0.75 0.02 250)', flexShrink: 0 }} />
                  }
                  <span style={{ color: ok ? 'oklch(0.35 0.02 250)' : 'oklch(0.6 0.012 250)' }}>{label}</span>
                </div>
              ))}
            </div>
            {analysisInput.readiness.suneungRounds > 0 && (
              <div className="mt-2 text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>
                수능실전모의 {analysisInput.readiness.suneungRounds}회 · 모의 카테고리 {analysisInput.mockSummaries.length}종
              </div>
            )}
            {analysisQuality.warnings.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {analysisQuality.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-1.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    <span className="flex-shrink-0">·</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.6 0.012 250)' }}>
              <span>게이트:</span>
              <span style={{
                color: handoffGate.status === 'ready'
                  ? 'oklch(0.4 0.12 160)'
                  : handoffGate.status === 'needs-data'
                  ? 'oklch(0.5 0.12 80)'
                  : 'oklch(0.55 0.015 250)',
              }}>
                {handoffGate.status === 'ready'
                  ? '연동 준비 완료'
                  : handoffGate.status === 'needs-data'
                  ? '데이터 보완 권장'
                  : '데이터 입력 필요'}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>
              입력 조립 결과 — 실제 추천 계산은 포함되지 않습니다.
            </p>
          </div>
        </div>

        {/* ④ 안내 문구 */}
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
          style={{ background: 'oklch(0.97 0.04 250)', border: '1px solid oklch(0.93 0.008 250)' }}
        >
          <Info size={13} style={{ color: 'oklch(0.511 0.262 276.966)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: 'oklch(0.45 0.015 250)' }}>
            실제 대학명·추천 순위 같은 확정 결과는 다음 단계에서 계산되며, 지금은 추천 적합도 중심의 입력 조립 단계입니다.
          </p>
        </div>

        {/* ⑥ Phase 5.1 Draft Preview — University Analysis Draft Preview UI Wiring v1 */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'oklch(0.93 0.008 250)' }}>
          <div className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
            <FileText size={11} />
            Phase 5.1 Draft 검증 미리보기
          </div>

          {/* ⑤ 학년 선택 — GradeLevel Input UI Wiring v1 */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>학년 선택 (선택)</div>
              {draftGradeLevel === null && derivedGradeLevel !== null && (
                <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>
                  (예: 고{derivedGradeLevel} 자동파생)
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {([1, 2, 3] as Phase51GradeLevel[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setDraftGradeLevel(g === draftGradeLevel ? null : g)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                  style={{
                    background:  draftGradeLevel === g ? 'oklch(0.511 0.262 276.966)' : 'white',
                    color:       draftGradeLevel === g ? 'white' : 'oklch(0.45 0.015 250)',
                    borderColor: draftGradeLevel === g ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.008 250)',
                  }}
                >
                  고{g}
                </button>
              ))}
            </div>
          </div>

          {/* 계열 선택 */}
          <div className="mb-3">
            <div className="text-xs mb-1.5" style={{ color: 'oklch(0.55 0.015 250)' }}>계열 선택 (선택)</div>
            <div className="flex gap-1.5">
              {(['인문', '자연', '통합'] as Phase51Track[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDraftTrack(t === draftTrack ? null : t)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                  style={{
                    background:   draftTrack === t ? 'oklch(0.511 0.262 276.966)' : 'white',
                    color:        draftTrack === t ? 'white' : 'oklch(0.45 0.015 250)',
                    borderColor:  draftTrack === t ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.008 250)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Validation 결과 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>Draft 검증 상태</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={
                draftBundle.validation.status === 'ready'
                  ? { background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }
                  : draftBundle.validation.status === 'needs-data'
                  ? { background: 'oklch(0.97 0.06 80)', color: 'oklch(0.45 0.12 80)' }
                  : { background: 'oklch(0.96 0.005 250)', color: 'oklch(0.5 0.015 250)' }
              }
            >
              {draftBundle.validation.status === 'ready'
                ? '전달 준비'
                : draftBundle.validation.status === 'needs-data'
                ? '데이터 보완 필요'
                : '데이터 부족'}
            </span>
          </div>

          {/* Missing fields */}
          {draftBundle.validation.messages.length > 0 && (
            <ul className="mb-2 space-y-0.5">
              {draftBundle.validation.messages.map((msg) => (
                <li key={msg} className="flex items-start gap-1.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  <span className="flex-shrink-0">·</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          )}
          {draftBundle.validation.missingFields.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {draftBundle.validation.missingFields.map((field) => (
                <span
                  key={field}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'oklch(0.97 0.005 250)', color: 'oklch(0.5 0.015 250)' }}
                >
                  {field}
                </span>
              ))}
            </div>
          )}

          {/* ⑦ 목표 대학 입력 UI — Target University Draft Input UI Wiring v1 */}
          <div className="mb-3 pt-1">
            <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'oklch(0.35 0.015 250)' }}>
              <Target size={11} />
              목표 대학 입력
            </div>
            <p className="text-xs mb-2 leading-relaxed" style={{ color: 'oklch(0.6 0.01 250)' }}>
              추천 결과가 아닌, 직접 지정하는 분석 대상 대학/학과입니다.
            </p>

            {/* 입력 폼 */}
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                placeholder="대학명"
                value={targetInput.univName}
                onChange={(e) => setTargetInput((prev) => ({ ...prev, univName: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && targetInput.univName.trim() && targetInput.deptName.trim()) {
                    setDraftTargetUniversities((prev) => [
                      ...prev,
                      { univId: `univ-${nanoid(6)}`, univName: targetInput.univName.trim(), deptName: targetInput.deptName.trim() },
                    ]);
                    setTargetInput({ univName: '', deptName: '' });
                  }
                }}
                className="flex-1 min-w-0 rounded-md px-2 py-1 text-xs border"
                style={{
                  borderColor: 'oklch(0.88 0.008 250)',
                  background: 'white',
                  color: 'oklch(0.22 0.02 250)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="학과명"
                value={targetInput.deptName}
                onChange={(e) => setTargetInput((prev) => ({ ...prev, deptName: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && targetInput.univName.trim() && targetInput.deptName.trim()) {
                    setDraftTargetUniversities((prev) => [
                      ...prev,
                      { univId: `univ-${nanoid(6)}`, univName: targetInput.univName.trim(), deptName: targetInput.deptName.trim() },
                    ]);
                    setTargetInput({ univName: '', deptName: '' });
                  }
                }}
                className="flex-1 min-w-0 rounded-md px-2 py-1 text-xs border"
                style={{
                  borderColor: 'oklch(0.88 0.008 250)',
                  background: 'white',
                  color: 'oklch(0.22 0.02 250)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  const u = targetInput.univName.trim();
                  const d = targetInput.deptName.trim();
                  if (!u || !d) return;
                  setDraftTargetUniversities((prev) => [
                    ...prev,
                    { univId: `univ-${nanoid(6)}`, univName: u, deptName: d },
                  ]);
                  setTargetInput({ univName: '', deptName: '' });
                }}
                disabled={!targetInput.univName.trim() || !targetInput.deptName.trim()}
                className="flex-shrink-0 flex items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: (!targetInput.univName.trim() || !targetInput.deptName.trim())
                    ? 'oklch(0.95 0.005 250)'
                    : 'oklch(0.511 0.262 276.966)',
                  color: (!targetInput.univName.trim() || !targetInput.deptName.trim())
                    ? 'oklch(0.65 0.01 250)'
                    : 'white',
                  cursor: (!targetInput.univName.trim() || !targetInput.deptName.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={10} />
                추가
              </button>
            </div>

            {/* 입력된 목표 대학 목록 */}
            {draftTargetUniversities.length > 0 ? (
              <ul className="space-y-1 mb-1.5">
                {draftTargetUniversities.map((u, idx) => (
                  <li
                    key={u.univId}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs"
                    style={{ background: 'oklch(0.96 0.008 250)', color: 'oklch(0.3 0.02 250)' }}
                  >
                    <span className="font-semibold flex-shrink-0 tabular-nums" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      {u.univName}
                      <span style={{ color: 'oklch(0.55 0.015 250)' }}> · </span>
                      {u.deptName}
                    </span>
                    <button
                      onClick={() => setDraftTargetUniversities((prev) => prev.filter((_, i) => i !== idx))}
                      className="flex-shrink-0 p-0.5 rounded transition-colors"
                      title="삭제"
                      style={{ color: 'oklch(0.65 0.01 250)' }}
                    >
                      <X size={10} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="text-xs px-2.5 py-1.5 rounded-md mb-1.5"
                style={{ background: 'oklch(0.97 0.005 250)', color: 'oklch(0.65 0.01 250)' }}
              >
                아직 입력된 목표 대학이 없습니다.
              </div>
            )}

            {draftTargetUniversities.length > 0 && (
              <p className="text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>
                payload preview의 <code style={{ fontFamily: 'monospace', fontSize: '10px' }}>targetUniversities</code>에 반영됩니다.
              </p>
            )}
          </div>

          {/* ⑧ IF 개선 시나리오 입력 UI — Improvement Scenario Draft Input UI Wiring v1 */}
          <div className="mb-2">
            <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'oklch(0.35 0.015 250)' }}>
              <Zap size={11} />
              IF 개선 시나리오
            </div>
            <p className="text-xs mb-2 leading-relaxed" style={{ color: 'oklch(0.6 0.01 250)' }}>
              확정 결과 계산이 아닌, 수학 점수 향상 시 추천 변화를 가정하는 입력값입니다.
            </p>

            {/* 3-field input grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1.5">
              {(
                [
                  { key: 'mathStdScoreDelta',   label: '표준점수 +Δ', placeholder: '예) 10' },
                  { key: 'mathPercentileDelta',  label: '백분위 +Δ',   placeholder: '예) 5'  },
                  { key: 'mathGradeUp',          label: '등급 향상',    placeholder: '예) 1'  },
                ] as const
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <div className="text-xs mb-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={draftScenarioInput[key]}
                    onChange={(e) =>
                      setDraftScenarioInput((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full rounded-md px-2 py-1 text-xs border"
                    style={{
                      borderColor: 'oklch(0.88 0.008 250)',
                      background: 'white',
                      color: 'oklch(0.22 0.02 250)',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* 입력값 반영 안내 + 초기화 */}
            {draftScenario ? (
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>
                  payload preview의{' '}
                  <code style={{ fontFamily: 'monospace', fontSize: '10px' }}>improvementScenario</code>
                  에 반영됩니다.
                </p>
                <button
                  onClick={() =>
                    setDraftScenarioInput({ mathStdScoreDelta: '', mathPercentileDelta: '', mathGradeUp: '' })
                  }
                  className="text-xs px-2 py-0.5 rounded-md border transition-colors"
                  style={{
                    borderColor: 'oklch(0.88 0.008 250)',
                    color: 'oklch(0.55 0.015 250)',
                    background: 'white',
                  }}
                >
                  초기화
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'oklch(0.72 0.01 250)' }}>
                입력하면 payload preview에 반영됩니다.
              </p>
            )}
          </div>

          <details className="mb-2">
            <summary className="cursor-pointer text-xs font-medium" style={{ color: 'oklch(0.45 0.015 250)' }}>
              AnalyzeRequest draft payload 보기
            </summary>
            <pre
              className="mt-2 max-h-56 overflow-auto rounded-md p-2 text-[10px] leading-relaxed"
              style={{ background: 'oklch(0.985 0.003 247)', color: 'oklch(0.35 0.015 250)' }}
            >
              {JSON.stringify(draftBundle.draft, null, 2)}
            </pre>
          </details>

          {/* ⑨ Phase 5.1 응답 확인 — Response UI Wiring v1 */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'oklch(0.93 0.008 250)' }}>
            <button
              onClick={handleRequestAnalysis}
              disabled={apiStatus === 'pending' || draftBundle.validation.status !== 'ready'}
              className="w-full py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: draftBundle.validation.status === 'ready'
                  ? 'oklch(0.95 0.012 250)'
                  : 'oklch(0.97 0.005 250)',
                color: draftBundle.validation.status === 'ready'
                  ? 'oklch(0.35 0.02 250)'
                  : 'oklch(0.65 0.01 250)',
                cursor: (apiStatus === 'pending' || draftBundle.validation.status !== 'ready')
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {apiStatus === 'pending' ? '응답 대기 중...' : 'Phase 5.1 응답 확인'}
            </button>

            {/* ready 아닐 때 안내 */}
            {draftBundle.validation.status !== 'ready' && (
              <p className="text-xs mt-1.5" style={{ color: 'oklch(0.65 0.01 250)' }}>
                Draft 검증 상태가 'ready'일 때 호출 가능합니다.
              </p>
            )}

            {/* pending */}
            {apiStatus === 'pending' && (
              <p className="text-xs mt-2" style={{ color: 'oklch(0.55 0.015 250)' }}>
                Phase 5.1 분석 응답 대기 중...
              </p>
            )}

            {/* error */}
            {apiStatus === 'error' && apiError && (
              <div
                className="mt-2 px-3 py-2 rounded-md text-xs"
                style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.45 0.15 25)' }}
              >
                {apiError}
              </div>
            )}

            {/* success */}
            {apiStatus === 'success' && apiResponse && (
              <div className="mt-2 space-y-2">
                {/* reportSummary */}
                <div className="px-3 py-2 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>보고서 요약</div>
                  <p className="text-xs" style={{ color: 'oklch(0.35 0.015 250)' }}>{apiResponse.reportSummary}</p>
                </div>

                {/* counselingComment */}
                <div className="px-3 py-2 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>상담 코멘트</div>
                  <p className="text-xs" style={{ color: 'oklch(0.35 0.015 250)' }}>{apiResponse.counselingComment}</p>
                </div>

                {/* dataConfidence / targetGap 수 / subjectWeakness 수 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="px-2 py-1.5 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>신뢰도</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'oklch(0.35 0.015 250)' }}>
                      {Math.round(apiResponse.dataConfidence * 100)}%
                    </div>
                  </div>
                  <div className="px-2 py-1.5 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>목표 갭</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'oklch(0.35 0.015 250)' }}>
                      {apiResponse.targetGap.length}건
                    </div>
                  </div>
                  <div className="px-2 py-1.5 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>취약 과목</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'oklch(0.35 0.015 250)' }}>
                      {apiResponse.subjectWeakness.length}개
                    </div>
                  </div>
                </div>

                {/* recommendationBand.summary */}
                <div className="px-3 py-2 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>추천 밴드 요약</div>
                  <p className="text-xs" style={{ color: 'oklch(0.35 0.015 250)' }}>{apiResponse.recommendationBand.summary}</p>
                </div>

                {/* recommendationBand.items — 밴드별 추천 대학/학과 목록 (읽기 전용) */}
                <div className="px-3 py-2 rounded-md" style={{ background: 'oklch(0.96 0.008 250)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>추천 대학/학과</div>
                  {(apiResponse.recommendationBand.items ?? []).length > 0 ? (
                    (['reach', 'target', 'safety'] as const).map((band) => {
                      const bandLabel = { reach: '소신', target: '적정', safety: '안정' }[band];
                      const items = (apiResponse.recommendationBand.items ?? []).filter((i) => i.band === band);
                      if (items.length === 0) return null;
                      return (
                        <div key={band} className="mb-2 last:mb-0">
                          <div
                            className="text-xs font-medium mb-1"
                            style={{ color: 'oklch(0.511 0.262 276.966)' }}
                          >
                            {bandLabel}
                          </div>
                          <ul className="space-y-0.5">
                            {items.map((item, idx) => (
                              <li
                                key={`${item.univId}-${item.deptName}-${idx}`}
                                className="flex items-start gap-1.5 text-xs"
                                style={{ color: 'oklch(0.35 0.015 250)' }}
                              >
                                <span className="flex-shrink-0 mt-px" style={{ color: 'oklch(0.65 0.01 250)' }}>·</span>
                                <span>
                                  {item.univName} — {item.deptName}
                                  {item.admissionType && (
                                    <span style={{ color: 'oklch(0.55 0.015 250)' }}> ({item.admissionType})</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>
                      표시할 추천 목록이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Area>
    </div>
  );
}

function ScoreSummary({ title, score, grade, sub }: { title: string; score: string; grade: string; sub?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>최근 시험</div><div className="text-sm font-semibold mt-0.5 truncate" style={{ color: 'oklch(0.22 0.02 250)' }}>{title}</div>{sub && <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{sub}</div>}</div>
      <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>최근 점수</div><div className="text-lg font-bold mt-0.5 tabular-nums" style={{ color: 'oklch(0.45 0.2 277)' }}>{score}</div></div>
      <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>최근 등급</div><div className="text-lg font-bold mt-0.5" style={{ color: 'oklch(0.22 0.02 250)' }}>{grade}</div></div>
    </div>
  );
}

function InternalScores({ scores }: { scores: InternalScore[] }) {
  const latest = scores[0];
  return (
    <Area title="내신성적">
      {scores.length === 0 ? (
        <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>입력된 내신성적이 없습니다.</p>
      ) : (
        <>
          {latest && <ScoreSummary title={`${latest.year} ${latest.semester} ${latest.examType}`} score={`${latest.rawScore}점`} grade={`${latest.grade}등급`} sub={latest.subject} />}
          <div className="axis-table-wrap">
            <table className="w-full text-sm" style={{ minWidth: 620 }}>
              <thead><tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>{['학년도', '학기', '시험', '과목', '원점수', '등급', '비고'].map((h) => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>)}</tr></thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                    <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{s.year}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{s.semester}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{s.examType}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>{s.subject}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.3 0.02 250)' }}>{s.rawScore}</td>
                    <td className="px-2.5 py-2"><GradeBadge grade={s.grade} /></td>
                    <td className="px-2.5 py-2 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{s.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Area>
  );
}

function MockScores({ title, scores }: { title: string; scores: MockExamScore[] }) {
  const latest = scores[0];
  const avgGrade = (e: MockExamScore) => {
    const g = [e.korean, e.math, e.english].filter(Boolean) as { grade: number }[];
    return g.length ? (g.reduce((a, b) => a + b.grade, 0) / g.length).toFixed(1) : '-';
  };
  return (
    <Area title={title}>
      {scores.length === 0 ? (
        <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>입력된 성적이 없습니다.</p>
      ) : (
        <>
          {latest && <ScoreSummary title={latest.examName} score={`${latest.totalScore ?? '-'}점`} grade={`평균 ${avgGrade(latest)}등급`} sub={latest.grade} />}
          <div className="space-y-2">
            {scores.map((e) => (
              <div key={e.id} className="p-3 rounded-md" style={{ border: '1px solid oklch(0.93 0.008 250)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold" style={{ color: 'oklch(0.22 0.02 250)' }}>{e.examName}</div>
                  <div className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>{formatDate(e.examDate)} · {e.grade}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {([['국어', e.korean], ['수학', e.math], ['영어', e.english], [e.inquiry1?.subject ?? '탐구1', e.inquiry1], [e.inquiry2?.subject ?? '탐구2', e.inquiry2]] as const).map(([label, sub], i) =>
                    sub ? (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'oklch(0.98 0.004 247)' }}>
                        <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{label}</span>
                        <GradeBadge grade={sub.grade} />
                        <span className="text-xs tabular-nums" style={{ color: 'oklch(0.45 0.015 250)' }}>{sub.score}점 · {sub.percentile}%</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Area>
  );
}

// Assessment Engine(시험관리)에서 채점·공개된 결과를 보여주는 간단한 리스트.
// MockExamScore처럼 과목별 세부 분석은 없고(시험관리 엔진은 문항 단위 총점 중심이므로),
// 시험명·시험일·획득점수만 표시한다. note가 있으면(교내 평가류) 안내 문구를 함께 보여준다.
function AssessmentResultList({ title, results, note }: { title: string; results: StudentExamResult[]; note?: string }) {
  return (
    <Area title={title} desc={note}>
      <div className="space-y-1.5">
        {results.map((r) => (
          <div key={r.examId} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ border: '1px solid oklch(0.93 0.008 250)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'oklch(0.22 0.02 250)' }}>{r.title}</div>
              <div className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>{categoryLabel(r.categoryId)} · {formatDate(r.examDate)}</div>
            </div>
            <div className="text-sm font-semibold tabular-nums" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{r.earnedScore} / {r.totalPoints}점</div>
          </div>
        ))}
      </div>
    </Area>
  );
}

// ════════════════════════════════════════════════════════════
// 6) 재무상태 탭 (조회 전용 · 권한) — 수강료는 실제 반 데이터(fee)
// ════════════════════════════════════════════════════════════
function FinanceTab({ student }: { student: Student }) {
  const { getClass } = useClasses();
  const f = getFinance(student, getClass);
  const payStatusColor = f.status === '미납' ? 'oklch(0.5 0.2 27)' : f.status === '부분납' ? 'oklch(0.5 0.13 60)' : 'oklch(0.4 0.12 160)';

  return (
    <div>
      <ReadOnlyHint>수납 등록·환불 요청·정산 처리는 <b>재무관리 엔진</b>에서 진행합니다. 이 화면은 조회 전용입니다.</ReadOnlyHint>
      <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-3 text-xs" style={{ background: 'oklch(0.97 0.06 80)', color: 'oklch(0.45 0.12 80)', border: '1px solid oklch(0.88 0.1 80)' }}>
        <AlertTriangle size={13} /> 아래 금액은 <b>더미 데이터</b>입니다. 실제 청구·일할·정산·납부 이력은 <b>재무관리 엔진</b> 연동 후 등록일/퇴원일 기준으로 처리됩니다.
      </div>

      <Area title="이번 달 청구 요약" desc={`${f.month}`}>
        {f.status === '청구없음' ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>이번 달 청구 내역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>청구 월</div><div className="text-sm font-semibold mt-1" style={{ color: 'oklch(0.25 0.02 250)' }}>{f.month}</div></div>
            <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>총 청구액</div><div className="text-sm font-bold mt-1 tabular-nums" style={{ color: 'oklch(0.22 0.02 250)' }}>{formatWon(f.total)}</div></div>
            <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>납부액</div><div className="text-sm font-bold mt-1 tabular-nums" style={{ color: 'oklch(0.4 0.12 160)' }}>{formatWon(f.paid)}</div></div>
            <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>미납액</div><div className="text-sm font-bold mt-1 tabular-nums" style={{ color: f.unpaid > 0 ? 'oklch(0.5 0.2 27)' : 'oklch(0.5 0.015 250)' }}>{formatWon(f.unpaid)}</div></div>
            <div className="rounded-lg p-3" style={{ background: 'oklch(0.98 0.004 247)' }}><div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>납부 상태</div><div className="text-sm font-bold mt-1" style={{ color: payStatusColor }}>{f.status}</div></div>
          </div>
        )}
      </Area>

      {f.classBills.length > 0 && (
        <Area title="수강별 청구 내역" desc="수강료·반유형은 반관리(ClassContext) 실제 반 데이터. 일할 계산은 재무관리 엔진에서 등록일/퇴원일 기준으로 처리.">
          <div className="axis-table-wrap">
            <table className="w-full text-sm" style={{ minWidth: 680 }}>
              <thead><tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>{['수강반', '반유형', '월 수강료', '일할', '청구액', '납부 상태'].map((h) => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>)}</tr></thead>
              <tbody>
                {f.classBills.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                    <td className="px-2.5 py-2 font-medium whitespace-nowrap" style={{ color: 'oklch(0.25 0.02 250)' }}>{b.className}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{b.classCategory}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{formatWon(b.monthlyFee)}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>재무엔진</td>
                    <td className="px-2.5 py-2 whitespace-nowrap tabular-nums font-medium" style={{ color: 'oklch(0.22 0.02 250)' }}>{formatWon(b.amount)}</td>
                    <td className="px-2.5 py-2"><span className={cn('text-xs px-2 py-0.5 rounded-full', b.status === '미납' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700')}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Area>
      )}

      <div className="grid lg:grid-cols-2 gap-3">
        <Area title="납부 이력">
          {f.payments.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>납부 이력이 없습니다.</p>
          ) : f.payments.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
              <div>
                <div className="text-sm tabular-nums" style={{ color: 'oklch(0.3 0.02 250)' }}>{formatWon(p.amount)}</div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{p.date} · {p.method} · {p.handler}</div>
              </div>
              {p.receiptIssued && <span className="text-xs inline-flex items-center gap-1 text-emerald-600"><Receipt size={12} /> 영수증</span>}
            </div>
          ))}
        </Area>

        <Area title="미납 / 환불 상태">
          <Field label="미납 여부">{f.hasUnpaid ? <span className="text-rose-600">미납 ({f.unpaidPeriod})</span> : '없음'}</Field>
          <Field label="환불 요청">{f.refundRequested ? '요청됨' : '없음'}</Field>
          <Field label="환불 승인 상태">{f.refundApproveStatus}</Field>
          <Field label="환불 완료">{f.refundCompleted ? '완료' : '-'}</Field>
        </Area>
      </div>

      <Area title="영수증">
        {f.receipts.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>발급된 영수증이 없습니다.</p>
        ) : f.receipts.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
            <div className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{r.month} · <span className="tabular-nums">{formatWon(r.amount)}</span></div>
            <div className="flex gap-1.5">
              <button onClick={() => toast.info('영수증 조회 (재무관리 엔진 연동 예정)')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>조회</button>
              <button onClick={() => toast.info('영수증 재발급 (재무관리 엔진 연동 예정)')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>재발급</button>
            </div>
          </div>
        ))}
      </Area>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 헬퍼
// ════════════════════════════════════════════════════════════
function currentYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
type Counts = Record<AttendanceStatus, number>;
function emptyCounts(): Counts { return { 출석: 0, 결석: 0, 지각: 0, 조퇴: 0, 보강출석: 0, 공결: 0 }; }
function countRecords(records: { status: AttendanceStatus }[]): Counts {
  const c = emptyCounts();
  records.forEach((r) => { c[r.status]++; });
  return c;
}
function countAttendance(sessions: { records: { studentId: string; date: string; status: AttendanceStatus }[] }[], studentId: string, ym: string): Counts {
  const c = emptyCounts();
  sessions.forEach((sess) => sess.records.forEach((r) => { if (r.studentId === studentId && r.date.startsWith(ym)) c[r.status]++; }));
  return c;
}

// ════════════════════════════════════════════════════════════
// 성장/진열장 탭 (Growth Showcase Foundation v2)
// 관리자 Back Office 전용. 보호자 화면 없음.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// 성장/진열장 탭 v2 (Growth Showcase v2)
// SP 이력 + 수동 지급 + IF 힌트 + 진행 중 엠블럼 표시.
// 관리자 Back Office 전용. 보호자 화면 없음.
// ════════════════════════════════════════════════════════════
function GrowthShowcaseTab({ studentId, studentName }: { studentId: string; studentName: string }) {
  const growth = useGrowth();
  const { students } = useStudents();
  const { currentUser } = useAuth();
  const canGrant       = canAwardSP(currentUser.accountType);
  const canGrantEmblem = canAwardEmblem(currentUser.accountType);

  const [spModal, setSpModal] = useState(false);
  const [spAmount, setSpAmount] = useState('');
  const [spReason, setSpReason] = useState('');
  const [embModal, setEmbModal] = useState(false);
  const [emblemId, setEmblemId] = useState('');

  const profile        = growth.getProfile(studentId);
  const achievedEmblems = growth.getAchievedEmblems(studentId);
  const recentEmblems  = growth.getRecentEmblems(studentId, 5);
  const inProgressEmblems = growth.getStudentEmblems(studentId).filter(se => !se.achieved);
  const recentSPLogs   = growth.getSPLogs(studentId, 5);
  const repEmblems     = growth.getRepresentativeEmblems(studentId);
  const { currentRivalProfile, challengersCount, relation } = growth.getRivalInfo(studentId);
  const rivalStudentName = currentRivalProfile
    ? students.find(s => s.id === currentRivalProfile.studentId)?.name
    : undefined;
  const tier = (profile?.tier ?? 'UNRANKED') as StudentTier;
  const activeEmblems  = growth.emblems.filter(e => e.active);

  const handleSpSubmit = () => {
    const amt = parseInt(spAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('SP는 양수여야 합니다.'); return; }
    if (!spReason.trim()) { toast.error('지급 사유를 입력하세요.'); return; }
    const res = growth.addStudentSP(studentId, amt, spReason, 'MANUAL', undefined, currentUser.name);
    if (res.ok) { toast.success(`SP ${amt} 지급 완료`); setSpModal(false); setSpAmount(''); setSpReason(''); }
    else toast.error(res.reason ?? '오류');
  };

  const handleEmblemSubmit = () => {
    if (!emblemId) { toast.error('엠블럼을 선택하세요.'); return; }
    const res = growth.awardEmblemMock(studentId, emblemId, 'MANUAL', undefined, currentUser.name);
    if (res.ok) {
      const emb = growth.getEmblemById(emblemId);
      toast.success(`'${emb?.name}' 엠블럼 지급 완료`);
      setEmbModal(false); setEmblemId('');
    } else toast.error(res.reason ?? '오류');
  };

  if (!profile) {
    return (
      <div className="axis-card p-12 text-center">
        <Trophy size={36} style={{ color: 'oklch(0.85 0.01 250)', display: 'block', margin: '0 auto 12px' }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
          {studentName} 학생의 성장 프로필이 아직 없습니다.
        </p>
        <p className="text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>
          첫 시험 응시 또는 관리자 수동 등록 후 생성됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 진열장 헤더 */}
      <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, oklch(0.15 0.02 250) 0%, oklch(0.22 0.03 260) 100%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#C9A84C' }}>AXIS 진열장</div>
            <div className="text-xl font-bold text-white mb-2">{profile.nickname}</div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: TIER_COLORS[tier] + '30', color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}60` }}>
                ⚡ {TIER_LABELS[tier]}
              </span>
              {/* 관리자 수동 지급 버튼 */}
              {canGrant && (
                <button onClick={() => { setSpModal(true); setSpAmount(''); setSpReason(''); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                  style={{ background: '#D1FAE5', color: '#065F46' }}>
                  <Plus size={11} /> SP 지급
                </button>
              )}
              {canGrantEmblem && (
                <button onClick={() => { setEmbModal(true); setEmblemId(''); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                  style={{ background: '#FEF3C7', color: '#92400E' }}>
                  <Trophy size={11} /> 엠블럼
                </button>
              )}
            </div>
          </div>
          {/* 대표 엠블럼 3슬롯 */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => {
              const emb = repEmblems[i];
              const mat = emb ? MATERIAL_BADGE[emb.material] : null;
              return (
                <div key={i} className="flex flex-col items-center justify-center rounded-lg"
                  style={{ width: 52, height: 52, background: mat ? mat.bg : 'oklch(0.22 0.025 250)', border: `2px solid ${mat ? mat.border : 'oklch(0.3 0.02 250)'}` }}
                  title={emb?.name}>
                  {emb ? (
                    <><Trophy size={18} style={{ color: mat?.text }} /><span style={{ fontSize: 9, color: mat?.text, fontWeight: 700, marginTop: 2 }}>{MATERIAL_LABELS[emb.material]}</span></>
                  ) : <span style={{ color: 'oklch(0.4 0.02 250)', fontSize: 18 }}>?</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SP / 전적 / 엠블럼 카드 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '누적 SP', value: profile.totalSP.toLocaleString(), icon: <Zap size={15} />, color: '#C9A84C' },
          { label: '이번 시즌 SP', value: profile.seasonSP.toLocaleString(), icon: <Star size={15} />, color: '#3B82F6' },
          { label: '보유 엠블럼', value: `${achievedEmblems.length}개`, icon: <Award size={15} />, color: '#8B5CF6' },
          { label: '라이벌 전적', value: `${profile.rivalWins}승 ${profile.rivalLosses}패`, icon: <Swords size={15} />, color: '#EF4444' },
        ].map((c, i) => (
          <div key={i} className="axis-card p-3">
            <div className="flex items-center gap-1.5 mb-1.5" style={{ color: c.color }}>{c.icon}<span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{c.label}</span></div>
            <div className="text-lg font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 라이벌 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="axis-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Swords size={14} style={{ color: '#EF4444' }} />
            <span className="text-sm font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>현재 라이벌</span>
            {relation && <span className="text-xs ml-auto" style={{ color: 'oklch(0.55 0.015 250)' }}>승률 {relation.winRate}%{relation.streak > 0 ? ` / ${relation.streak}연승` : relation.streak < 0 ? ` / ${Math.abs(relation.streak)}연패` : ''}</span>}
          </div>
          {rivalStudentName && currentRivalProfile ? (
            <div>
              <div className="text-base font-bold mb-1" style={{ color: 'oklch(0.18 0.02 250)' }}>{rivalStudentName}</div>
              <div className="text-xs font-semibold mb-1" style={{ color: TIER_COLORS[currentRivalProfile.tier as StudentTier] }}>{TIER_LABELS[currentRivalProfile.tier as StudentTier]}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>SP {currentRivalProfile.totalSP.toLocaleString()} · 엠블럼 {growth.getAchievedEmblems(currentRivalProfile.studentId).length}개</div>
            </div>
          ) : <p className="text-sm" style={{ color: 'oklch(0.65 0.015 250)' }}>라이벌 없음</p>}
        </div>
        <div className="axis-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={14} style={{ color: '#F59E0B' }} />
            <span className="text-sm font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>나를 지정한 학생</span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: '#4F46E5' }}>{challengersCount}명</div>
          <p className="text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>※ 누구인지는 학생에게 공개되지 않습니다</p>
        </div>
      </div>

      {/* SP 최근 이력 */}
      <div className="axis-card p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Zap size={14} style={{ color: '#C9A84C' }} />
          <span className="text-sm font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>SP 최근 이력</span>
        </div>
        {recentSPLogs.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: 'oklch(0.65 0.015 250)' }}>SP 이력 없음</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid oklch(0.92 0.006 250)' }}>
                {['일자', 'SP', '사유', '출처', '지급자'].map(h => (
                  <th key={h} className="text-left pb-1.5 font-semibold" style={{ color: 'oklch(0.4 0.015 250)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSPLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid oklch(0.96 0.004 250)' }}>
                  <td className="py-1.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{log.createdAt}</td>
                  <td className="py-1.5 font-bold" style={{ color: '#059669' }}>+{log.amount}</td>
                  <td className="py-1.5 max-w-40" style={{ color: 'oklch(0.4 0.015 250)' }}>
                    <span className="block truncate" title={log.reason}>{log.reason}</span>
                  </td>
                  <td className="py-1.5">
                    <span className="px-1.5 py-0.5 rounded" style={{ background: '#EEF2FF', color: '#4338CA' }}>
                      {SOURCE_TYPE_LABELS[log.sourceType]}
                    </span>
                  </td>
                  <td className="py-1.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{log.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 최근 획득 엠블럼 */}
      <div className="axis-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Award size={14} style={{ color: '#C9A84C' }} />
            <span className="text-sm font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>최근 획득 엠블럼</span>
          </div>
          <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>전체 {achievedEmblems.length}개</span>
        </div>
        {recentEmblems.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'oklch(0.65 0.015 250)' }}>획득한 엠블럼이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentEmblems.map(se => {
              const emb = growth.getEmblemById(se.emblemId);
              if (!emb) return null;
              const mat = MATERIAL_BADGE[emb.material];
              return (
                <div key={se.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'oklch(0.97 0.004 250)', border: '1px solid oklch(0.92 0.006 250)' }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: mat.bg, border: `1px solid ${mat.border}` }}>
                    <Trophy size={14} style={{ color: mat.text }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'oklch(0.18 0.02 250)' }}>{emb.name}</div>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{CATEGORY_LABELS[emb.category]} · {MATERIAL_LABELS[emb.material]}</div>
                  </div>
                  <div className="text-xs flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)' }}>{se.acquiredAt}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 진행 중 엠블럼 */}
      {inProgressEmblems.length > 0 && (
        <div className="axis-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={14} style={{ color: '#F59E0B' }} />
            <span className="text-sm font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>진행 중 엠블럼</span>
          </div>
          <div className="flex flex-col gap-2">
            {inProgressEmblems.map(se => {
              const emb = growth.getEmblemById(se.emblemId);
              if (!emb) return null;
              const pct = Math.min(100, Math.round((se.progressCount / emb.requiredCount) * 100));
              const mat = MATERIAL_BADGE[emb.material];
              return (
                <div key={se.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: mat.bg }}>
                    <Trophy size={12} style={{ color: mat.text }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{emb.name}</span>
                      <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{se.progressCount}/{emb.requiredCount}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: 'oklch(0.9 0.01 80)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: '#F59E0B' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IF 성장 힌트 placeholder */}
      <div className="px-4 py-3 rounded-lg text-xs" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA' }}>
        <strong>📊 IF 성장 힌트</strong> — 시험 및 성적 관리 IF 분석 결과와 엠블럼 진행도 연동이 준비되어 있습니다.
        계산 실수 개선 → 꼼꼼한 검토자 / 계산 정확도 향상 엠블럼,
        개념 부족 보완 → 개념 정복자 / 개념 회복 엠블럼,
        시간 부족 개선 → 시간 마스터 / 시간관리 달인 엠블럼과 연결됩니다.
        (Growth v3에서 자동화 예정)
      </div>

      {/* SP 수동 지급 모달 */}
      {spModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-80 p-6">
            <h3 className="font-bold text-base mb-1" style={{ color: 'oklch(0.15 0.02 250)' }}>SP 수동 지급</h3>
            <p className="text-xs mb-4" style={{ color: 'oklch(0.55 0.015 250)' }}>대상: <strong>{studentName}</strong></p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>SP 금액 *</label>
                <input type="number" min={1} value={spAmount} onChange={e => setSpAmount(e.target.value)}
                  placeholder="예: 50" className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>지급 사유 *</label>
                <input value={spReason} onChange={e => setSpReason(e.target.value)}
                  placeholder="예: 성실한 학습 태도" className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: '#EF4444' }}>※ SP 지급 이력은 삭제되지 않습니다.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setSpModal(false)} className="px-4 py-1.5 text-sm rounded-md border" style={{ borderColor: 'oklch(0.87 0.006 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
              <button onClick={handleSpSubmit} className="px-4 py-1.5 text-sm rounded-md font-semibold" style={{ background: '#059669', color: '#fff' }}>지급</button>
            </div>
          </div>
        </div>
      )}

      {/* 엠블럼 수동 지급 모달 */}
      {embModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
            <h3 className="font-bold text-base mb-1" style={{ color: 'oklch(0.15 0.02 250)' }}>엠블럼 수동 지급</h3>
            <p className="text-xs mb-4" style={{ color: 'oklch(0.55 0.015 250)' }}>대상: <strong>{studentName}</strong></p>
            <select value={emblemId} onChange={e => setEmblemId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm mb-3" style={{ borderColor: 'oklch(0.87 0.006 250)' }}>
              <option value="">— 엠블럼 선택 —</option>
              {activeEmblems.map(e => (
                <option key={e.id} value={e.id}>[{CATEGORY_LABELS[e.category]}] {e.name} ({MATERIAL_LABELS[e.material]})</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEmbModal(false)} className="px-4 py-1.5 text-sm rounded-md border" style={{ borderColor: 'oklch(0.87 0.006 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
              <button onClick={handleEmblemSubmit} className="px-4 py-1.5 text-sm rounded-md font-semibold" style={{ background: 'oklch(0.15 0.02 250)', color: '#C9A84C' }}>지급</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
