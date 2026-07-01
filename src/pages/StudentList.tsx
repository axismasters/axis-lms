// AXIS LMS v1.2 - 학생 목록 (Back Office)
// 요약 카드 · 통합 검색 · 접이식 상세 필터 · 컬럼 · 빠른 조회(상세/성적/더보기) → 학생 상세 해당 탭 딥링크.
// 반 데이터는 ClassContext(실제 반)에서 연결한다. 운영메모/상담기록 관련 UI 없음.
// 재무 권한이 없으면 미납 요약카드 · 미납 필터 · 재무 컬럼 · 빠른조회 재무항목을 모두 숨긴다.

import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, SlidersHorizontal, ChevronDown, UserPlus, Eye, BarChart2, MoreHorizontal,
  Users, GraduationCap, PauseCircle, LogOut, AlertCircle, X,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { StatusBadge, AttendanceBadge } from '@/components/StatusBadge';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAuth } from '@/contexts/AuthContext';
import { ClassRoom } from '@/lib/classData';
import { Student, StudentStatus } from '@/lib/dummyData';
import {
  getActiveClasses, getTeachers, getGradeLevel, getRecentScoreLabel,
  getUnivDataStatus, UnivStatus, UNIV_STATUS_STYLE, isUnpaid, getFinance,
} from '@/lib/studentDerived';
import { cn } from '@/lib/utils';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';
import { loadIfRecords } from '@/lib/ifAnalysisEngine';
import { collectObservations, computeSubjectGaps } from '@/lib/observationSignals';
import type { StudentSignalBundle } from '@/lib/observationSignals';
import ObservationPanel from '@/components/ObservationPanel';

const STATUS_OPTIONS: (StudentStatus | '전체')[] = ['전체', '재원', '휴원', '퇴원', '대기'];
const UNIV_OPTIONS: (UnivStatus | '전체')[] = ['전체', '데이터 부족', '준비 중', '충분'];
const UNPAID_OPTIONS = ['전체', '미납', '완납'] as const;

// Phase 3D v3-r1: 요약 카드를 클릭 가능한 필터 카드로 전환. active면 카드가 눌린 상태로 보이고,
// 아래 목록이 해당 조건으로 자동 필터링된다.
function SummaryFilterCard({
  icon, label, value, tone, active, onClick,
}: { icon: React.ReactNode; label: string; value: number; tone: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="axis-card axis-card-clickable p-4 flex items-center gap-3 text-left w-full transition-colors"
      style={active ? { borderColor: '#040D1E', boxShadow: '0 0 0 1px #040D1E' } : undefined}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tone }}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs flex items-center gap-1" style={{ color: active ? 'oklch(0.1605 0.0394 259.41)' : 'oklch(0.5 0.015 250)' }}>
          {label}
          {active && <span className="text-xs px-1 py-0 rounded" style={{ background: '#040D1E', color: 'white' }}>✓</span>}
        </div>
        <div className="text-xl font-bold tabular-nums" style={{ color: 'oklch(0.2 0.02 250)' }}>
          {value}<span className="text-xs font-normal ml-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>명</span>
        </div>
      </div>
    </button>
  );
}

function UnivPill({ status }: { status: UnivStatus }) {
  const s = UNIV_STATUS_STYLE[status];
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{status}</span>;
}

function FinancePill({ student, getClass }: { student: Student; getClass: (id: string) => ClassRoom | undefined }) {
  const f = getFinance(student, getClass);
  const map: Record<string, string> = {
    완납: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    부분납: 'bg-amber-50 text-amber-700 border border-amber-200',
    미납: 'bg-rose-50 text-rose-700 border border-rose-200',
    청구없음: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', map[f.status])}>{f.status}</span>;
}

// 빠른 조회 (상세 / 성적 / 더보기). 재무 항목은 권한자에게만.
function QuickActions({ studentId, showFinance }: { studentId: string; showFinance: boolean }) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const goto = (query: string) => { setOpen(false); navigate(`/admin/students/${studentId}${query}`); };

  const moreItems: { label: string; query: string }[] = [
    { label: '내신성적 조회', query: '?tab=grades&gradeType=naesin' },
    { label: '모의고사 성적 조회', query: '?tab=grades&gradeType=mock' },
    { label: '수강현황', query: '?tab=enrollment' },
    { label: '출결현황', query: '?tab=attendance' },
    ...(showFinance ? [{ label: '재무상태', query: '?tab=finance' }] : []),
  ];

  const btn = 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors';

  return (
    <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()} ref={ref}>
      <button className={cn(btn, 'hover:bg-slate-50')} style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.35 0.02 250)' }} onClick={() => goto('?tab=basic')}><Eye size={12} /> 상세</button>
      <button className={cn(btn, 'hover:bg-[#E7EBF3]')} style={{ borderColor: 'oklch(0.8 0.03 262)', color: 'oklch(0.1605 0.0394 259.41)' }} onClick={() => goto('?tab=grades')}><BarChart2 size={12} /> 성적</button>
      <div className="relative">
        <button className={cn(btn, 'hover:bg-slate-50')} style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.35 0.02 250)' }} onClick={() => setOpen((v) => !v)}><MoreHorizontal size={12} /> 더보기</button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-20 w-44 py-1 rounded-md bg-white modal-enter" style={{ border: '1px solid oklch(0.9 0.008 250)', boxShadow: '0 8px 24px oklch(0 0 0 / 0.12)' }}>
            {moreItems.map((it) => (
              <button key={it.label} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors" style={{ color: 'oklch(0.3 0.02 250)' }} onClick={() => goto(it.query)}>{it.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentList() {
  const { students: allStudents } = useStudents();
  const { classes, getClass } = useClasses();
  const { currentUser, can, canAccessStudent, canViewFinance } = useAuth();
  const { exams, getPublishedResultsForStudent } = useAssessment();
  const { sessions } = useAttendance();
  const { getForStudent } = useHomework();
  const { getStatus } = useHomeworkStatus();
  // Phase 3D v3-r4-r1: 전체 학생(접근 권한/dataScope 범위) 기준 "확인 필요한 학생" 신호 —
  // 테스트/IF뿐 아니라 출결·숙제·목표 대비 과목까지 포함해 기존 데이터로 자동 산출한다.
  const observations = useMemo(
    () =>
      collectObservations(
        allStudents
          .filter((s) => canAccessStudent(s.id))
          .map((s): StudentSignalBundle => {
            const results = getPublishedResultsForStudent(s.id);
            const attendanceRecords = sessions.flatMap((sess) =>
              sess.records
                .filter((r) => r.studentId === s.id)
                .map((r) => ({ date: sess.date, status: r.status }))
            );
            const studentClassIds = s.classes.filter((c) => c.status === '수강중').map((c) => c.id);
            const homeworkItems = getForStudent(studentClassIds)
              .filter((hw) => hw.status === 'published')
              .map((hw) => ({
                date: hw.createdAt.slice(0, 10),
                completed: getStatus(hw.id, s.id)?.status === 'completed',
              }));
            const subjectGaps = computeSubjectGaps(results, (examId) => exams.find((e) => e.id === examId)?.subject);
            return {
              studentId: s.id,
              studentName: s.name,
              results,
              ifRecords: loadIfRecords(s.id),
              attendanceRecords,
              homeworkItems,
              subjectGaps,
            };
          })
      ),
    [allStudents, canAccessStudent, getPublishedResultsForStudent, sessions, getForStudent, getStatus, exams]
  );
  // 목록 단위 노출(요약카드/필터/컬럼 헤더)은 finance.view 보유 여부로 1차 게이트.
  // 행 단위 표시는 각 학생에 대해 canViewFinance(studentId)(=finance.view && canAccessStudent)로 최종 판단.
  const showFinanceColumn = can('finance.view');

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [fStatus, setFStatus] = useState<StudentStatus | '전체'>('전체');
  const [fClass, setFClass] = useState('전체');
  const [fTeacher, setFTeacher] = useState('전체');
  const [fGrade, setFGrade] = useState('전체');
  const [fUnpaid, setFUnpaid] = useState<(typeof UNPAID_OPTIONS)[number]>('전체');
  const [fUniv, setFUniv] = useState<UnivStatus | '전체'>('전체');

  // 학생 목록 진입에는 student.view 권한이 필요. 권한이 없으면 빈 화면 + 안내.
  const hasListAccess = can('student.view');
  // dataScope 적용: 전체범위가 아니면 canAccessStudent로 접근 가능한 학생만 노출(강사=배정 반/학생, 학생=본인, 보호자=자녀)
  const students = useMemo(() => allStudents.filter((s) => canAccessStudent(s.id)), [allStudents, canAccessStudent]);

  // 필터 옵션 — 실제 반 데이터(ClassContext) 기준
  const classOptions = useMemo(() => Array.from(new Set(classes.map((c) => c.name))), [classes]);
  const teacherOptions = useMemo(() => Array.from(new Set(classes.map((c) => c.teacher))), [classes]);

  const summary = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === '재원').length,
    pause: students.filter((s) => s.status === '휴원').length,
    leave: students.filter((s) => s.status === '퇴원').length,
    unpaid: students.filter((s) => isUnpaid(s)).length,
  }), [students]);

  const filtered = useMemo(() => {
    const q = search.trim().replace(/-/g, '');
    return students.filter((s) => {
      if (q) {
        const inName = s.name.includes(search.trim());
        const inPhone = s.phone.replace(/-/g, '').includes(q);
        const inGuardian = s.guardians.some((g) => g.phone.replace(/-/g, '').includes(q));
        if (!inName && !inPhone && !inGuardian) return false;
      }
      if (fStatus !== '전체' && s.status !== fStatus) return false;
      if (fClass !== '전체' && !getActiveClasses(s).some((c) => (getClass(c.id)?.name ?? c.name) === fClass)) return false;
      if (fTeacher !== '전체' && !getTeachers(s, getClass).includes(fTeacher)) return false;
      if (fGrade !== '전체' && getGradeLevel(s) !== fGrade) return false;
      if (showFinanceColumn && fUnpaid === '미납' && !isUnpaid(s)) return false;
      if (showFinanceColumn && fUnpaid === '완납' && isUnpaid(s)) return false;
      if (fUniv !== '전체' && getUnivDataStatus(s) !== fUniv) return false;
      return true;
    });
  }, [students, search, fStatus, fClass, fTeacher, fGrade, fUnpaid, fUniv, getClass, showFinanceColumn]);

  const resetFilters = () => { setFStatus('전체'); setFClass('전체'); setFTeacher('전체'); setFGrade('전체'); setFUnpaid('전체'); setFUniv('전체'); };

  // Phase 3D v3-r1: 요약 카드 클릭 = 빠른 필터. 이미 선택된 카드를 다시 누르면 해제(토글).
  const toggleStatusFilter = (status: StudentStatus) => {
    setFStatus((prev) => (prev === status ? '전체' : status));
  };
  const toggleUnpaidFilter = () => {
    setFUnpaid((prev) => (prev === '미납' ? '전체' : '미납'));
  };
  const clearQuickFilters = () => { setFStatus('전체'); setFUnpaid('전체'); };

  // 현재 목록 위에 표시할 필터명 — "재원 학생 3명", "미납 학생 2명", "재원 · 미납 학생 1명" 등
  const currentFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (fStatus !== '전체') parts.push(fStatus);
    if (showFinanceColumn && fUnpaid === '미납') parts.push('미납');
    return parts.length > 0 ? `${parts.join(' · ')} 학생` : '전체 학생';
  }, [fStatus, fUnpaid, showFinanceColumn]);

  const activeFilterCount =
    [fStatus, fClass, fTeacher, fGrade, fUniv].filter((v) => v !== '전체').length +
    (showFinanceColumn && fUnpaid !== '전체' ? 1 : 0);

  const selectCls = 'text-xs rounded-md px-2.5 py-1.5 bg-white';
  const selectStyle = { border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' };

  const headers = ['학생명', '휴대폰번호', '보호자 연락처', '재원 상태', '현재 수강반', '담당강사', '최근 출결', '최근 성적', ...(showFinanceColumn ? ['재무 상태'] : []), '대학추천', '빠른 조회'];

  // 학생 목록 진입에는 student.view 권한이 필요
  if (!hasListAccess) {
    return (
      <AdminLayout title="학생 목록" breadcrumbs={[{ label: '학생관리' }, { label: '학생 목록' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>학생 목록 조회 권한이 없습니다.</p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>필요 시 권한설정에서 student.view 권한을 요청하세요.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="학생 목록" breadcrumbs={[{ label: '학생관리' }, { label: '학생 목록' }]}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>학생 목록</h1>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>학생을 등록하고 관리하세요</p>
        </div>
        {can('student.create') && (
          <Link href="/admin/students/new">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: '#040D1E' }}>
              <UserPlus size={15} /> 학생 등록
            </button>
          </Link>
        )}
      </div>

      {/* Phase 3D v3-r4: 확인 필요한 학생 (전체 학생 기준) — 관리자 랜딩 상단 강조 패널 */}
      <div className="mb-5">
        <ObservationPanel
          observations={observations}
          title="확인 필요한 학생"
          scopeNote="전체 학생 기준"
          detailHref={(id) => `/admin/students/${id}`}
        />
      </div>

      {/* 요약 카드 — 클릭하면 아래 목록이 해당 조건으로 필터링된다(Phase 3D v3-r1) */}
      <div className={cn('grid grid-cols-2 gap-3 mb-5', showFinanceColumn ? 'md:grid-cols-5' : 'md:grid-cols-4')}>
        <SummaryFilterCard
          icon={<Users size={18} color="oklch(0.1605 0.0394 259.41)" />} label="전체 학생" value={summary.total} tone="oklch(0.93 0.02 262)"
          active={fStatus === '전체' && fUnpaid === '전체'} onClick={clearQuickFilters}
        />
        <SummaryFilterCard
          icon={<GraduationCap size={18} color="oklch(0.4 0.14 160)" />} label="재원" value={summary.active} tone="oklch(0.94 0.07 160)"
          active={fStatus === '재원'} onClick={() => toggleStatusFilter('재원')}
        />
        <SummaryFilterCard
          icon={<PauseCircle size={18} color="oklch(0.5 0.13 80)" />} label="휴원" value={summary.pause} tone="oklch(0.96 0.07 80)"
          active={fStatus === '휴원'} onClick={() => toggleStatusFilter('휴원')}
        />
        <SummaryFilterCard
          icon={<LogOut size={18} color="oklch(0.5 0.015 250)" />} label="퇴원" value={summary.leave} tone="oklch(0.95 0.008 250)"
          active={fStatus === '퇴원'} onClick={() => toggleStatusFilter('퇴원')}
        />
        {showFinanceColumn && (
          <SummaryFilterCard
            icon={<AlertCircle size={18} color="oklch(0.5 0.2 27)" />} label="미납" value={summary.unpaid} tone="oklch(0.96 0.07 27)"
            active={fUnpaid === '미납'} onClick={toggleUnpaidFilter}
          />
        )}
      </div>

      {/* 검색 + 필터 토글 */}
      <div className="axis-card p-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.6 0.015 250)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="학생명 · 학생 휴대폰 · 보호자 휴대폰 통합 검색" className="w-full text-sm rounded-md pl-9 pr-3 py-2 outline-none focus:ring-2" style={{ border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }} />
          </div>
          <button onClick={() => setShowFilters((v) => !v)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-50" style={{ border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.35 0.02 250)' }}>
            <SlidersHorizontal size={14} /> 상세 필터
            {activeFilterCount > 0 && <span className="text-xs px-1.5 rounded-full text-white" style={{ background: '#040D1E' }}>{activeFilterCount}</span>}
            <ChevronDown size={14} className="transition-transform" style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>재원 상태</span>
              <select className={selectCls} style={selectStyle} value={fStatus} onChange={(e) => setFStatus(e.target.value as StudentStatus | '전체')}>{STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>수강반</span>
              <select className={selectCls} style={selectStyle} value={fClass} onChange={(e) => setFClass(e.target.value)}><option value="전체">전체</option>{classOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>담당강사</span>
              <select className={selectCls} style={selectStyle} value={fTeacher} onChange={(e) => setFTeacher(e.target.value)}><option value="전체">전체</option>{teacherOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>학년</span>
              <select className={selectCls} style={selectStyle} value={fGrade} onChange={(e) => setFGrade(e.target.value)}>{['전체', '고1', '고2', '고3'].map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            {showFinanceColumn && (
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>미납 여부</span>
                <select className={selectCls} style={selectStyle} value={fUnpaid} onChange={(e) => setFUnpaid(e.target.value as (typeof UNPAID_OPTIONS)[number])}>{UNPAID_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>대학추천 데이터</span>
              <select className={selectCls} style={selectStyle} value={fUniv} onChange={(e) => setFUniv(e.target.value as UnivStatus | '전체')}>{UNIV_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <div className="col-span-2 md:col-span-3 lg:col-span-6 flex justify-end">
              <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md hover:bg-slate-50" style={{ color: 'oklch(0.5 0.015 250)' }}><X size={12} /> 필터 초기화</button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs mb-2" style={{ color: 'oklch(0.5 0.015 250)' }}>
        <b style={{ color: 'oklch(0.1605 0.0394 259.41)' }}>{currentFilterLabel}</b> <b style={{ color: 'oklch(0.1605 0.0394 259.41)' }}>{filtered.length}</b>명
      </div>

      <div className="axis-card overflow-hidden">
        <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
          <table className="w-full text-sm" style={{ minWidth: showFinanceColumn ? 1180 : 1060 }}>
            <thead>
              <tr style={{ background: 'oklch(0.98 0.004 247)' }}>
                {headers.map((h) => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12, background: 'oklch(0.98 0.004 247)', boxShadow: 'inset 0 -1px 0 oklch(0.9 0.008 250)' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const active = getActiveClasses(s);
                const teachers = getTeachers(s, getClass);
                const guardian = s.guardians[0];
                const firstName = active.length ? (getClass(active[0].id)?.name ?? active[0].name) : '';
                return (
                  <tr key={s.id} className="axis-table-row" style={{ borderBottom: '1px solid oklch(0.95 0.006 250)' }}>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{s.name}</td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{s.phone}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>
                      {guardian ? <span className="tabular-nums">{guardian.phone}<span className="ml-1 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>({guardian.relation})</span></span> : '-'}
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={s.status} /></td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.35 0.015 250)' }}>
                      {active.length ? (active.length > 1 ? `${firstName} 외 ${active.length - 1}` : firstName) : <span style={{ color: 'oklch(0.65 0.015 250)' }}>미배정</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{teachers.length ? teachers.join(', ') : '-'}</td>
                    <td className="px-3 py-2.5">{s.recentAttendance ? <AttendanceBadge status={s.recentAttendance.status} /> : <span className="text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>-</span>}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>{getRecentScoreLabel(s)}</td>
                    {showFinanceColumn && (canViewFinance(s.id) ? <td className="px-3 py-2.5"><FinancePill student={s} getClass={getClass} /></td> : <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>-</td>)}
                    <td className="px-3 py-2.5"><UnivPill status={getUnivDataStatus(s)} /></td>
                    <td className="px-3 py-2.5"><QuickActions studentId={s.id} showFinance={showFinanceColumn && canViewFinance(s.id)} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={22} style={{ color: 'oklch(0.7 0.01 250)' }} />
                      <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>조건에 맞는 학생이 없습니다.</p>
                      <p className="text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>검색어나 필터를 조정해 보세요.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
