// AXIS LMS v1.2 - 학생 상세 (Back Office)
// 상단 요약 카드 + 탭: 기본정보 / 보호자·가족 / 수강현황 / 출결현황 / 성적조회 / 재무상태.
// 상담기록 독립 탭은 두지 않는다. 운영메모 로그는 기본정보 탭 하단의 Back Office 내부 기록 섹션으로 유지
//   (최고관리자/원장/행정만 조회, 학생·학부모 화면에는 절대 노출하지 않음).
// 출결현황·재무상태 탭은 조회 전용(입력은 출결관리/재무관리 엔진). 재무는 권한자에게만 노출.
// 반 데이터(반유형·요일·시간·강의실·강사·수강료)는 ClassContext(실제 반)에서 연결한다.

import { useMemo, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  ChevronLeft, Phone, User, CreditCard, CalendarCheck, BookOpen, BarChart2,
  Users, KeyRound, Power, Plus, ArrowRightLeft, Receipt, Target,
  Bell, CheckCircle2, XCircle, AlertTriangle, Info, Link2, StickyNote, X,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { StatusBadge, GradeBadge, formatDate } from '@/components/StatusBadge';
import { useStudents } from '@/contexts/StudentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { isBackOfficeType } from '@/lib/rbac';
import { STATUS_CONFIG, AttendanceStatus } from '@/lib/attendanceData';
import { ClassRoom } from '@/lib/classData';
import { Student, StudentStatus, ClassInfo, InternalScore, MockExamScore } from '@/lib/dummyData';
import { getPublishedResultsForStudent, categoryLabel, StudentExamResult } from '@/lib/assessmentData';
import {
  getActiveClasses, getPastClasses, resolveClassView, timeSlotsToSchedule, ClassView,
  getUnivDataStatus, getUnivChecklist, UNIV_STATUS_STYLE,
  getFinance, formatWon,
  GRADE_TYPES, GradeType, gradeTypeFromParam,
} from '@/lib/studentDerived';
import { cn } from '@/lib/utils';

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
type TabKey = 'basic' | 'guardian' | 'enrollment' | 'attendance' | 'grades' | 'finance';

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
    const valid: TabKey[] = ['basic', 'guardian', 'enrollment', 'attendance', 'grades', 'finance'];
    if (!valid.includes(tab)) tab = 'basic';
    return { tab, gradeType: gradeTypeFromParam(sp.get('gradeType')) };
  }, [showFinance]);

  const [tab, setTab] = useState<TabKey>(initial.tab);

  if (!student) {
    return (
      <AdminLayout title="학생 상세" breadcrumbs={[{ label: '학생관리', path: '/students' }, { label: '학생 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>학생을 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/students')} className="mt-3 text-sm font-medium" style={{ color: 'oklch(0.45 0.2 277)' }}>← 학생 목록으로</button>
        </div>
      </AdminLayout>
    );
  }

  if (!canAccessStudent(student.id)) {
    return (
      <AdminLayout title="학생 상세" breadcrumbs={[{ label: '학생관리', path: '/students' }, { label: '학생 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>이 학생 정보에 접근할 권한이 없습니다.</p>
          <button onClick={() => navigate('/students')} className="mt-3 text-sm font-medium" style={{ color: 'oklch(0.45 0.2 277)' }}>← 학생 목록으로</button>
        </div>
      </AdminLayout>
    );
  }

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: '기본정보', icon: <User size={14} /> },
    { key: 'guardian', label: '보호자·가족', icon: <Users size={14} /> },
    { key: 'enrollment', label: '수강현황', icon: <BookOpen size={14} /> },
    { key: 'attendance', label: '출결현황', icon: <CalendarCheck size={14} /> },
    { key: 'grades', label: '성적조회', icon: <BarChart2 size={14} /> },
    ...(showFinance ? [{ key: 'finance' as TabKey, label: '재무상태', icon: <CreditCard size={14} /> }] : []),
  ];

  return (
    <AdminLayout title={student.name} breadcrumbs={[{ label: '학생관리', path: '/students' }, { label: '학생 목록', path: '/students' }, { label: student.name }]}>
      <button onClick={() => navigate('/students')} className="inline-flex items-center gap-1 text-xs mb-3 hover:underline" style={{ color: 'oklch(0.5 0.015 250)' }}>
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

      <div className="flex gap-1 mt-5 mb-4 overflow-x-auto" style={{ borderBottom: '1px solid oklch(0.9 0.008 250)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative" style={{ color: tab === t.key ? 'oklch(0.45 0.2 277)' : 'oklch(0.5 0.015 250)' }}>
            {t.icon}{t.label}
            {tab === t.key && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded" style={{ background: 'oklch(0.511 0.262 276.966)' }} />}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicInfoTab student={student} />}
      {tab === 'guardian' && <GuardianFamilyTab student={student} onOpenStudent={(id) => navigate(`/students/${id}?tab=guardian`)} />}
      {tab === 'enrollment' && <EnrollmentTab student={student} />}
      {tab === 'attendance' && <AttendanceTab student={student} />}
      {tab === 'grades' && <GradesTab student={student} initialGradeType={initial.gradeType} />}
      {tab === 'finance' && showFinance && <FinanceTab student={student} />}
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
  const { assignClass, removeFromClass } = useStudents();
  const { classes, getClass } = useClasses();
  const { can } = useAuth();
  const canEdit = can('student.update'); // 수강반 추가/종료는 학생 정보 수정 범주
  const active = getActiveClasses(student);
  const past = getPastClasses(student);

  const today = new Date().toISOString().split('T')[0];
  const [addId, setAddId] = useState('');
  const [addStart, setAddStart] = useState(today);
  const [endModal, setEndModal] = useState<{ classId: string; name: string } | null>(null);
  const [endDate, setEndDate] = useState(today);
  const [endReason, setEndReason] = useState('');

  // 추가 가능 반: 운영중/개설예정 중, 현재 수강중이 아닌 반 (실제 반 데이터)
  const available = classes.filter((c) => c.status !== '종강' && !active.some((a) => a.id === c.id));

  const doAdd = () => {
    if (!canEdit) { toast.error('수강반 추가 권한(student.update)이 없습니다.'); return; }
    if (!addId) { toast.error('추가할 반을 선택하세요.'); return; }
    if (!addStart) { toast.error('수강 시작일을 입력하세요. (출결·청구·시험 응시 기준)'); return; }
    const klass = getClass(addId);
    if (!klass) { toast.error('반 정보를 찾을 수 없습니다.'); return; }
    const enrollment: ClassInfo = {
      id: klass.id, name: klass.name, subject: klass.subject, teacher: klass.teacher,
      schedule: timeSlotsToSchedule(klass.timeSlots), startDate: addStart, status: '수강중',
    };
    assignClass(student.id, enrollment);
    toast.success(`${klass.name} 수강이 시작일 ${addStart}(으)로 추가되었습니다.`);
    setAddId(''); setAddStart(today);
  };

  const openEnd = (classId: string, name: string) => {
    if (!canEdit) { toast.error('수강 종료 권한(student.update)이 없습니다.'); return; }
    setEndModal({ classId, name }); setEndDate(today); setEndReason('');
  };
  const confirmEnd = () => {
    if (!endModal) return;
    if (!endDate) { toast.error('수강 종료일은 필수입니다.'); return; }
    removeFromClass(student.id, endModal.classId, endDate, endReason.trim() || undefined);
    toast.success(`${endModal.name} 수강이 ${endDate}자로 종료 처리되었습니다.`);
    setEndModal(null);
  };

  return (
    <div>
      <Area title="현재 수강반" desc="학생 1명은 여러 반을 동시에 수강할 수 있습니다. 반유형·요일·시간·강의실은 반관리(ClassContext)에서 가져옵니다.">
        {active.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>수강 중인 반이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
                  {['반명', '반유형', '담당강사', '수업요일', '수업시간', '강의실', '수강 시작일', '상태'].map((h) => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {active.map((c) => {
                  const v: ClassView = resolveClassView(c, getClass(c.id));
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                      <td className="px-2.5 py-2 font-medium whitespace-nowrap" style={{ color: 'oklch(0.22 0.02 250)' }}>{v.name}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap"><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.005 250)', color: 'oklch(0.45 0.015 250)' }}>{v.category}</span></td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.teacher}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.days}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.time}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{v.room}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{formatDate(c.startDate)}</td>
                      <td className="px-2.5 py-2">
                        <button onClick={() => openEnd(c.id, v.name)} disabled={!canEdit} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.5 0.12 27)' }}>수강 종료</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Area>

      <div className="grid lg:grid-cols-2 gap-3">
        <Area title="수강반 추가" desc="기존에 개설된 반을 선택하고 수강 시작일을 입력합니다.">
          <div className="space-y-2">
            <select value={addId} onChange={(e) => setAddId(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-md border" style={{ borderColor: 'oklch(0.9 0.008 250)' }}>
              <option value="">반 선택…</option>
              {available.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.teacher} · {c.subject})</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>수강 시작일<span style={{ color: 'oklch(0.55 0.2 27)' }}> *</span></label>
              <input type="date" value={addStart} onChange={(e) => setAddStart(e.target.value)} className="flex-1 text-sm px-2.5 py-2 rounded-md border tabular-nums" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              <button onClick={doAdd} disabled={!canEdit} className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'oklch(0.511 0.262 276.966)' }}><Plus size={14} /> 추가</button>
            </div>
            <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 수강 시작일은 출결 대상·재무 청구·시험 응시 대상 판단 기준입니다.</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><ArrowRightLeft size={11} /> 반 변경은 기존 반 <b>수강 종료</b> 후 새 반 추가 방식만 사용합니다.</p>
          </div>
        </Area>

        <Area title="과거 수강이력">
          {past.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>과거 수강이력이 없습니다.</p>
          ) : past.map((c) => {
            const v = resolveClassView(c, getClass(c.id));
            return (
              <div key={c.id} className="py-2" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{v.name}</div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.005 250)', color: 'oklch(0.45 0.015 250)' }}>{c.status}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{v.teacher} · {formatDate(c.startDate)} ~ {c.endDate ? formatDate(c.endDate) : '-'}</div>
                {c.endReason && <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.05 27)' }}>종료 사유: {c.endReason}</div>}
              </div>
            );
          })}
        </Area>
      </div>

      {/* 수강 종료 모달 */}
      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setEndModal(null)}>
          <div className="bg-white rounded-lg w-full max-w-md modal-enter" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>수강 종료 — {endModal.name}</h3>
              <button onClick={() => setEndModal(null)}><X size={16} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="block">
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>수강 종료일<span style={{ color: 'oklch(0.55 0.2 27)' }}> *</span></span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full text-sm px-2.5 py-2 rounded-md border tabular-nums" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              </label>
              <label className="block">
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>종료 사유 (선택)</span>
                <textarea value={endReason} onChange={(e) => setEndReason(e.target.value)} rows={3} placeholder="예: 반 변경, 개인 사정, 성적 향상으로 상위반 이동 등" className="mt-1 w-full text-sm px-2.5 py-2 rounded-md border resize-none" style={{ borderColor: 'oklch(0.9 0.008 250)' }} />
              </label>
              <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 저장 시 해당 반은 종료 처리되고 종료일이 기록됩니다. 사유는 내부 이력으로만 보관됩니다.</p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setEndModal(null)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={confirmEnd} className="px-3 py-1.5 rounded-md text-sm text-white" style={{ background: 'oklch(0.5 0.18 27)' }}>수강 종료</button>
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
          <div className="overflow-x-auto">
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
  const { exams, submissions } = useAssessment();

  const mockFiltered = useMemo(() => {
    if (gradeType === '전국연합모의고사' || gradeType === '내신대비모의고사' || gradeType === '수능실전모의고사') {
      return student.mockExamScores.filter((e) => e.examCategory === gradeType);
    }
    return [];
  }, [gradeType, student.mockExamScores]);

  // Assessment Engine(시험관리)에서 이 학생에게 공개(또는 반영) 가능한 결과만 가져온다.
  // getPublishedResultsForStudent()가 이미 "공개되지 않은 결과는 제외"를 보장하므로 여기서는
  // 카테고리별 자동 분류만 한다 — 단원평가/인증평가/입학테스트는 대학추천 계산과 연결하지 않는다.
  const assessmentResults = useMemo(
    () => getPublishedResultsForStudent(exams, submissions, student.id),
    [exams, submissions, student.id]
  );
  const mockSchoolResults = useMemo(() => assessmentResults.filter((r) => r.categoryId === 'mock-school'), [assessmentResults]);
  const mockSuneungResults = useMemo(() => assessmentResults.filter((r) => r.categoryId === 'mock-suneung'), [assessmentResults]);
  const schoolEvalResults = useMemo(
    () => assessmentResults.filter((r) => r.categoryId === 'unit-eval' || r.categoryId === 'certification' || r.categoryId === 'entrance-test'),
    [assessmentResults]
  );

  const univ = getUnivDataStatus(student);
  const us = UNIV_STATUS_STYLE[univ];
  const checklist = getUnivChecklist(student);

  return (
    <div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {GRADE_TYPES.map((t) => (
          <button key={t} onClick={() => setGradeType(t)} className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={{ borderColor: gradeType === t ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.008 250)', background: gradeType === t ? 'oklch(0.511 0.262 276.966)' : 'white', color: gradeType === t ? 'white' : 'oklch(0.4 0.02 250)' }}>{t}</button>
        ))}
      </div>

      {gradeType === '전체' ? (
        <>
          <InternalScores scores={student.internalScores} />
          <MockScores title="모의고사 (전체)" scores={student.mockExamScores} />
        </>
      ) : gradeType === '내신성적' ? (
        <InternalScores scores={student.internalScores} />
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
            <div className="text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>놓친 점수 IF 분석</div>
            <div className="flex gap-1.5 flex-wrap">{['계산 실수', '개념 부족', '시간 부족'].map((x) => <span key={x} className="text-xs px-2 py-1 rounded-md" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.45 0.1 250)' }}>{x}</span>)}</div>
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
          <div className="overflow-x-auto">
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
          <div className="overflow-x-auto">
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
