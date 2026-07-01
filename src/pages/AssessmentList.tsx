// AXIS LMS v1.2 - 시험 및 성적 관리(Assessment Engine) 시험 목록
// Design: Structured Authority
// 메뉴는 "시험 및 성적 관리" 1개만 유지한다(하위 메뉴 추가 없음). 시험 등록은 ClassList.tsx와 동일하게
// ?new=1 쿼리로 진입 시 모달이 자동으로 열리는 패턴을 따른다.
//
// Phase 3C: 이 화면은 관리자 공통 시험(ACADEMY_COMMON/GRADE_COMMON/COURSE_COMMON)만 관리한다.
// 선생님 개인 시험(TEACHER_PRIVATE)은 기본 목록에서 항상 제외하고, "교사별 시험 현황" 요약
// 카드로만 건수를 보여준다(교사 개인 시험을 공통 시험처럼 열람/편집하지 않는다).

import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEmployees } from '@/contexts/EmployeeContext';
import { EXAM_CATEGORIES, ExamPhase, getExamPhase, categoryLabel, ExamScope, EXAM_SCOPE_LABELS } from '@/lib/assessmentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssessmentFormModal from '@/components/AssessmentFormModal';
import {
  Plus, Search, ChevronRight, FileText, Users, AlertTriangle, CheckCircle2, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// AXIS 확정 정책: "준비중/응시중/채점중/공개완료" 같은 관리자 운영 상태는 화면에서 제거하고,
// 공개 여부(publishedAt)와 채점 완료 여부로만 판단한 파생 단계(ExamPhase)를 사용한다.
const PHASE_CONFIG: Record<ExamPhase, { bg: string; text: string; border: string }> = {
  '미채점 있음': { bg: 'oklch(0.95 0.08 60)', text: 'oklch(0.42 0.14 60)', border: 'oklch(0.88 0.1 60)' },
  '채점 완료': { bg: 'oklch(0.95 0.06 250)', text: 'oklch(0.38 0.18 250)', border: 'oklch(0.85 0.08 250)' },
  '공개 완료': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.28 0.15 160)', border: 'oklch(0.85 0.1 160)' },
};

export default function AssessmentList() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { currentUser, can, canAccessExam, canAccessClass } = useAuth();
  const { exams, getSubmissionsByExam } = useAssessment();
  const { classes, getClass } = useClasses();
  const { getEmployeeByAccountId } = useEmployees();

  const canCreate = can('assessment.create'); // 최고관리자/원장만(AXIS 확정 원칙 4)

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClass, setFilterClass] = useState('all'); // 'all' | 'academy'(학원 전체 대상만) | classId
  const [filterPhase, setFilterPhase] = useState<ExamPhase | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState('all'); // 과목 필터
  const [filterScope, setFilterScope] = useState<ExamScope | 'all'>('all'); // Phase 3C: 공통 시험 종류 필터

  const [formOpen, setFormOpen] = useState(false);

  // ClassList.tsx와 동일한 패턴 — ?new=1로 들어오면(사이드바에는 등록 버튼이 없으므로 주로 직접 진입 시)
  // 모달을 자동으로 연다. 단, 시험 생성 권한이 없으면 열지 않는다.
  useEffect(() => {
    const sp = new URLSearchParams(searchStr);
    if (sp.get('new') !== '1') return;
    if (!canCreate) return;
    setFormOpen(true);
  }, [searchStr, canCreate]);

  const closeForm = () => {
    setFormOpen(false);
    const sp = new URLSearchParams(searchStr);
    if (sp.get('new') === '1') navigate('/admin/scores', { replace: true });
  };

  // 강사는 본인 담당 반 대상 시험만 본다(canAccessExam — 학원 전체 대상 시험은 classId가 없어
  // ASSIGNED_CLASSES 범위에서는 항상 false가 되므로, 강사 화면에는 자연히 보이지 않는다).
  // Phase 3C: 관리자 화면은 항상 공통 시험(ACADEMY_COMMON/GRADE_COMMON/COURSE_COMMON)만 다룬다.
  // 교사 개인 시험(TEACHER_PRIVATE)은 여기 목록에 절대 섞이지 않는다 — 아래 요약 카드로만 건수 표시.
  const visibleExams = useMemo(
    () => exams.filter((e) => canAccessExam(e.id, e.classId) && e.scope !== 'TEACHER_PRIVATE'),
    [exams, canAccessExam]
  );

  // 교사별 시험 현황 요약(선택 항목) — 교사 개인 시험을 열람/편집하지 않고 건수만 집계한다.
  const teacherPrivateSummary = useMemo(() => {
    const map = new Map<string, number>();
    exams.filter((e) => e.scope === 'TEACHER_PRIVATE').forEach((e) => {
      const key = e.ownerTeacherId ?? e.createdBy;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([teacherId, count]) => ({
      teacherId,
      name: getEmployeeByAccountId(teacherId)?.name ?? teacherId,
      count,
    }));
  }, [exams, getEmployeeByAccountId]);

  // 대상 반 필터 선택지 — canAccessClass를 통과하는 반만 노출한다(강사가 본인 담당 외 반명까지
  // 보지 못하도록 방어). 최고관리자/원장/행정 등 ALL_ACADEMY 범위는 canAccessClass가 항상 true이므로
  // 기존처럼 전체 반이 그대로 노출된다.
  const availableClasses = useMemo(() => classes.filter((c) => canAccessClass(c.id)), [classes, canAccessClass]);

  // 시험별 파생 단계(ExamPhase)를 미리 계산해 필터/카드/테이블에서 재사용한다.
  const examPhases = useMemo(() => {
    const map = new Map<string, ExamPhase>();
    visibleExams.forEach((e) => map.set(e.id, getExamPhase(e, getSubmissionsByExam(e.id))));
    return map;
  }, [visibleExams, getSubmissionsByExam]);

  // 과목 목록 — visibleExams에서 고유 과목 추출
  const availableSubjects = useMemo(() => {
    const s = new Set(visibleExams.map(e => e.subject).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [visibleExams]);

  const filtered = useMemo(() => {
    return visibleExams.filter((e) => {
      if (search && !e.title.includes(search)) return false;
      if (filterCategory !== 'all' && e.categoryId !== filterCategory) return false;
      if (filterClass === 'academy' && e.classId) return false;
      if (filterClass !== 'all' && filterClass !== 'academy' && e.classId !== filterClass) return false;
      if (filterPhase !== 'all' && examPhases.get(e.id) !== filterPhase) return false;
      if (filterSubject !== 'all' && e.subject !== filterSubject) return false;
      if (filterScope !== 'all' && e.scope !== filterScope) return false;
      return true;
    }).sort((a, b) => b.examDate.localeCompare(a.examDate));
  }, [visibleExams, search, filterCategory, filterClass, filterPhase, filterSubject, filterScope, examPhases]);

  // AXIS 확정 정책: 상태 카드 대신 파생 정보(전체/미채점 있음/채점 완료/공개 완료)로 보여준다.
  const stats = useMemo(() => ({
    total: visibleExams.length,
    ungraded: visibleExams.filter((e) => examPhases.get(e.id) === '미채점 있음').length,
    graded: visibleExams.filter((e) => examPhases.get(e.id) === '채점 완료').length,
    published: visibleExams.filter((e) => examPhases.get(e.id) === '공개 완료').length,
  }), [visibleExams, examPhases]);

  // 직접 URL 접근 보강 — 메뉴는 RBAC로 숨겨지지만, /scores 직접 진입 시에도 assessment.view를 확인한다.
  if (!can('assessment.view')) {
    return (
      <AdminLayout title="시험 및 성적 관리" breadcrumbs={[{ label: '시험 및 성적 관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>시험 및 성적 관리 조회 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="시험 및 성적 관리" breadcrumbs={[{ label: '시험 및 성적 관리' }]}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>시험 및 성적 관리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            학원 전체·학년·과정 공통 시험을 관리합니다. 선생님 개인 시험지는 포함되지 않습니다.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormOpen(true)} className="gap-1.5" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
            <Plus size={14} /> 시험 등록
          </Button>
        )}
      </div>

      {/* 요약 카드 — 상태 카드 대신 파생 정보(공개 여부 + 채점 완료 여부)로 보여준다 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>전체 시험</div>
          <div className="text-2xl font-bold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{stats.total}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>미채점 있음</div>
          <div className="text-2xl font-bold" style={{ color: 'oklch(0.42 0.14 60)' }}>{stats.ungraded}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>채점 완료</div>
          <div className="text-2xl font-bold" style={{ color: 'oklch(0.38 0.18 250)' }}>{stats.graded}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>공개 완료</div>
          <div className="text-2xl font-bold" style={{ color: 'oklch(0.28 0.15 160)' }}>{stats.published}</div>
        </div>
      </div>

      {/* Phase 3C: 교사별 시험 현황 요약(건수만 — 열람/편집 불가) */}
      {teacherPrivateSummary.length > 0 && (
        <div className="axis-card p-4 mb-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.5 0.015 250)' }}>
            교사별 시험 현황 (선생님 개인 시험지 — 이 목록에는 표시되지 않음, 건수만)
          </div>
          <div className="flex flex-wrap gap-2">
            {teacherPrivateSummary.map(({ teacherId, name, count }) => (
              <span key={teacherId} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'oklch(0.96 0.02 250)', color: 'oklch(0.45 0.015 250)' }}>
                {name} · {count}건
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="시험명 검색" className="h-9 w-52 pl-8 text-sm" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">시험종류 전체</SelectItem>
              {EXAM_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterScope} onValueChange={(v) => setFilterScope(v as ExamScope | 'all')}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">범위 전체</SelectItem>
              <SelectItem value="ACADEMY_COMMON">{EXAM_SCOPE_LABELS.ACADEMY_COMMON}</SelectItem>
              <SelectItem value="GRADE_COMMON">{EXAM_SCOPE_LABELS.GRADE_COMMON}</SelectItem>
              <SelectItem value="COURSE_COMMON">{EXAM_SCOPE_LABELS.COURSE_COMMON}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">대상 전체</SelectItem>
              <SelectItem value="academy">학원 전체 대상</SelectItem>
              {availableClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {availableSubjects.length > 0 && (
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">과목 전체</SelectItem>
                {availableSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterPhase} onValueChange={(v) => setFilterPhase(v as ExamPhase | 'all')}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">진행상태 전체</SelectItem>
              {(['미채점 있음', '채점 완료', '공개 완료'] as ExamPhase[]).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 목록 */}
      <div className="axis-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
            <FileText size={28} style={{ color: 'oklch(0.82 0.01 250)', margin: '0 auto 10px' }} />
            조회 조건에 해당하는 시험이 없습니다.
          </div>
        ) : (
          <div className="axis-table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'oklch(0.985 0.003 250)' }}>
                {['시험명', '종류', '과목', '대상', '시험일', '응시/채점', '진행상태', '공개일', ''].map((h) => (
                  <th key={h} className="axis-th-sticky axis-th-sticky-56 px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                    style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exam) => {
                const phase = examPhases.get(exam.id) ?? '미채점 있음';
                const cfg = PHASE_CONFIG[phase];
                const cls = exam.classId ? getClass(exam.classId) : undefined;
                const subs = getSubmissionsByExam(exam.id);
                const gradedCnt = subs.filter((s) => s.status === '채점완료' || s.status === '결석').length;
                return (
                  <tr key={exam.id} className="axis-table-row border-b cursor-pointer" style={{ borderColor: 'oklch(0.95 0.003 250)' }} onClick={() => navigate(`/admin/scores/${exam.id}`)}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{categoryLabel(exam.categoryId)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{exam.subject ?? '-'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{cls ? cls.name : '학원 전체'}</td>
                    <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{exam.examDate}</td>
                    <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} /> {gradedCnt}/{subs.length}명
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                        {phase === '공개 완료' && <Lock size={10} />}
                        {phase === '미채점 있음' && <AlertTriangle size={10} />}
                        {phase === '채점 완료' && <CheckCircle2 size={10} />}
                        {phase}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>
                      {exam.publishedAt ? exam.publishedAt.slice(0, 10) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-md"
                        style={{ color: 'oklch(0.511 0.262 276.966)', background: 'oklch(0.96 0.02 277)' }}>
                        상세 <ChevronRight size={11} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {canCreate && <AssessmentFormModal open={formOpen} onClose={closeForm} createdBy={currentUser.name} />}
    </AdminLayout>
  );
}
