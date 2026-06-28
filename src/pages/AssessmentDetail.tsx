// AXIS LMS v1.2 - 시험 상세
// Design: Structured Authority
// 탭: 기본정보 / 응시자목록 / 채점현황 / 결과분석
// StudentDetail.tsx와 동일하게 ?tab= 쿼리로 진입 탭을 유지하고, 탭마다 별도 컴포넌트로 분리한다.

import { useState, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import {
  Exam, ExamSubmission, ExamQuestionDef, categoryLabel, isAutoGraded, isSubmissionGraded,
  getExamPhase, requiresPublishAction, isResultVisibleForStudent, ExamPhase,
} from '@/lib/assessmentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ChevronLeft, FileText, Users, ClipboardCheck, BarChart2, Lock, Unlock,
  CheckCircle2, AlertTriangle, Info, RefreshCw, Pencil, UserX, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'basic' | 'submissions' | 'grading' | 'analysis';

export default function AssessmentDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { currentUser, can, canAccessExam } = useAuth();
  const { getExam, getSubmissionsByExam, canPublish, publishExam, setStudentAnswer } = useAssessment();
  const { getClass } = useClasses();

  const exam = getExam(params.id);

  const initialTab = useMemo(() => {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const t = sp.get('tab') as TabKey;
    const valid: TabKey[] = ['basic', 'submissions', 'grading', 'analysis'];
    return valid.includes(t) ? t : 'basic';
  }, []);
  const [tab, setTab] = useState<TabKey>(initialTab);

  // 직접 URL 접근 보강(항목 6) — 메뉴는 RBAC로 숨겨지지만, /scores/:id 직접 진입 시에도
  // assessment.view를 먼저 확인한다. 시험 존재 여부보다 권한 체크를 앞에 둔다.
  if (!can('assessment.view')) {
    return (
      <AdminLayout title="시험 상세" breadcrumbs={[{ label: '성적 관리', path: '/scores' }, { label: '시험 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>성적 관리 조회 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  if (!exam) {
    return (
      <AdminLayout title="시험 상세" breadcrumbs={[{ label: '성적 관리', path: '/scores' }, { label: '시험 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>시험을 찾을 수 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  // 방어적 가드: 강사가 URL을 직접 입력해 본인 범위 밖 시험(학원 전체 대상 등)에 접근하는 경우 차단.
  if (!canAccessExam(exam.id, exam.classId)) {
    return (
      <AdminLayout title="시험 상세" breadcrumbs={[{ label: '성적 관리', path: '/scores' }, { label: '시험 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>이 시험에 접근할 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  // 항목 6: 채점은 assessment.grade, 공개는 assessment.publish, 정정은 assessment.resultCorrect.
  const canGrade = can('assessment.grade');
  const canPublishPerm = can('assessment.publish'); // canAccessExam은 위에서 이미 통과(canPublishExamResult와 동등한 조건)
  const canCorrect = can('assessment.resultCorrect');

  const submissions = getSubmissionsByExam(exam.id);
  const cls = exam.classId ? getClass(exam.classId) : undefined;
  const gradedCount = submissions.filter(isSubmissionGraded).length;
  const phase: ExamPhase = getExamPhase(exam, submissions);
  const needsPublishAction = requiresPublishAction(exam); // 학원 전체 시험만 true — 반 단위 시험은 공개 액션이 없다(항목 4)
  // AXIS 확정 정책(공개 전/후 잠금 분리):
  //   - 학원 전체 시험: 전원 채점완료 후에도 "성적 공개" 버튼을 누르기 전까지는 채점/점수를 자유롭게
  //     수정할 수 있어야 한다. 공개(phase === '공개 완료') 후에만 직접 수정을 막고 정정 처리로 전환한다.
  //   - 반 단위 시험: 별도 공개 절차가 없으므로, 전원 채점완료(phase === '채점 완료') 시점부터 곧바로
  //     성적조회에 반영되며, 그 이후의 수정은 정정 처리로만 가능하다.
  const locked = needsPublishAction ? phase === '공개 완료' : phase === '채점 완료';

  // 성적 공개 확인 모달 상태
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  const handlePublish = () => {
    const result = publishExam(exam.id, currentUser.name);
    if (!result.ok) {
      toast.error(result.reason ?? '공개할 수 없습니다.');
      return;
    }
    toast.success(`"${exam.title}" 시험 결과가 공개되었습니다. 알림 이력이 생성되었습니다.`);
    setPublishConfirmOpen(false);
  };

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: '기본정보', icon: <FileText size={13} /> },
    { key: 'submissions', label: '응시자목록', icon: <Users size={13} /> },
    { key: 'grading', label: '채점현황', icon: <ClipboardCheck size={13} /> },
    { key: 'analysis', label: '결과분석', icon: <BarChart2 size={13} /> },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: '성적 관리', path: '/scores' }, { label: exam.title }]}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <button onClick={() => navigate('/scores')} className="flex items-center gap-1 text-xs mb-1.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            <ChevronLeft size={12} /> 성적 관리로
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>{exam.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {categoryLabel(exam.categoryId)} · {cls ? cls.name : '학원 전체'} · {exam.examDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!needsPublishAction ? (
            // 반 단위 시험 — 공개 액션이 없다. 전원 채점 완료 시 곧바로 성적조회에 반영되므로 진행상태만 보여준다.
            <div
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={phase === '채점 완료'
                ? { background: 'oklch(0.94 0.08 160)', color: 'oklch(0.28 0.15 160)' }
                : { background: 'oklch(0.95 0.08 60)', color: 'oklch(0.42 0.14 60)' }}
            >
              {phase === '채점 완료' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />} {phase}
            </div>
          ) : phase === '공개 완료' ? (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.28 0.15 160)' }}>
              <Lock size={11} /> 공개완료 · {exam.publishedBy}
            </div>
          ) : phase === '채점 완료' ? (
            // 학원 전체 시험 — 전원 채점완료지만 아직 공개 전. "공개 대기" 상태를 명시하고,
            // 공개 권한 보유자에게는 그 옆에 "성적 공개" 버튼을 함께 보여준다.
            <>
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'oklch(0.95 0.06 250)', color: 'oklch(0.38 0.18 250)' }}>
                <CheckCircle2 size={11} /> 채점 완료 · 공개 대기
              </div>
              {canPublishPerm && (
                <Button size="sm" onClick={() => setPublishConfirmOpen(true)} className="h-8 text-xs gap-1.5" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                  <Unlock size={12} /> 성적 공개
                </Button>
              )}
            </>
          ) : canPublishPerm ? (
            <Button
              size="sm"
              onClick={() => setPublishConfirmOpen(true)}
              disabled={!canPublish(exam.id)}
              className="h-8 text-xs gap-1.5"
              style={{ background: canPublish(exam.id) ? 'oklch(0.511 0.262 276.966)' : undefined }}
              title={canPublish(exam.id) ? undefined : '미채점 응시자가 있어 공개할 수 없습니다.'}
            >
              <Unlock size={12} /> 성적 공개
            </Button>
          ) : null}
        </div>
      </div>

      {phase === '미채점 있음' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: 'oklch(0.96 0.04 60)', color: 'oklch(0.42 0.14 60)' }}>
          <AlertTriangle size={13} />
          {needsPublishAction
            ? `미채점 응시자가 있어 아직 공개할 수 없습니다. (${gradedCount}/${submissions.length}명 채점완료)`
            : `미채점 응시자가 있어 아직 성적조회에 반영되지 않습니다. (${gradedCount}/${submissions.length}명 채점완료)`}
        </div>
      )}

      {/* 탭 */}
      <div className="axis-card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-5 py-3 text-xs font-medium border-b-2 -mb-px transition-colors"
              style={{ borderColor: tab === t.key ? 'oklch(0.511 0.262 276.966)' : 'transparent', color: tab === t.key ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.55 0.015 250)' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'basic' && <BasicInfoTab exam={exam} className={cls?.name} phase={phase} />}
          {tab === 'submissions' && <SubmissionsTab exam={exam} submissions={submissions} canGrade={canGrade} locked={locked} />}
          {tab === 'grading' && <GradingTab exam={exam} submissions={submissions} canGrade={canGrade} currentUserName={currentUser.name} locked={locked} setStudentAnswer={setStudentAnswer} />}
          {tab === 'analysis' && <AnalysisTab exam={exam} submissions={submissions} canCorrect={canCorrect} currentUserName={currentUser.name} locked={locked} />}
        </div>
      </div>

      {/* 성적 공개 확인 모달 */}
      <Dialog open={publishConfirmOpen} onOpenChange={(o) => !o && setPublishConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">성적 공개 확인</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
              <b>{exam.title}</b> 시험 결과를 공개하시겠습니까?
            </p>
            <div className="rounded-lg p-3 text-xs" style={{ background: 'oklch(0.96 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
              <p>• 공개 후 성적은 직접 수정할 수 없으며 정정 처리만 가능합니다.</p>
              <p>• 공개 시 학생 알림 이력이 자동 생성됩니다. (mock)</p>
              <p>• 실제 카카오/SMS 발송은 되지 않습니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPublishConfirmOpen(false)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={handlePublish} className="h-8 text-xs gap-1" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              <Unlock size={11} /> 공개 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// ════════════════════════════════════════════════════════════
// 기본정보 탭
// ════════════════════════════════════════════════════════════
function BasicInfoTab({ exam, className, phase }: { exam: Exam; className?: string; phase: ExamPhase }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Info2 label="시험명" value={exam.title} />
      <Info2 label="시험 종류" value={categoryLabel(exam.categoryId)} />
      <Info2 label="대상" value={className ?? '학원 전체'} />
      <Info2 label="시험일" value={exam.examDate} />
      <Info2 label="문항 수" value={`${exam.questions.length}문항`} />
      <Info2 label="만점" value={`${exam.totalScore}점`} />
      <Info2 label="생성자" value={`${exam.createdBy} · ${exam.createdAt.slice(0, 10)}`} />
      <Info2 label="진행상태" value={phase === '공개 완료' ? `공개 완료 (${exam.publishedBy} · ${exam.publishedAt?.slice(0, 10)})` : phase} />

      <div className="col-span-2">
        <Label className="text-xs font-semibold mb-2 block">문항 구성</Label>
        <div className="space-y-1.5">
          {exam.questions.map((q) => (
            <div key={q.id} className="flex items-center gap-2 px-3 py-2 rounded text-xs" style={{ background: 'oklch(0.98 0.004 247)' }}>
              <span className="font-semibold w-8" style={{ color: 'oklch(0.4 0.015 250)' }}>{q.no}번</span>
              <span className="px-1.5 py-0.5 rounded" style={{ background: isAutoGraded(q.type) ? 'oklch(0.94 0.06 160)' : 'oklch(0.95 0.06 60)', color: isAutoGraded(q.type) ? 'oklch(0.4 0.13 160)' : 'oklch(0.45 0.13 60)' }}>
                {q.type}
              </span>
              <span style={{ color: 'oklch(0.5 0.015 250)' }}>{q.points}점</span>
              {isAutoGraded(q.type) && <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>정답: {q.correctAnswer}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>{label}</div>
      <div className="text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 응시자목록 탭
// ════════════════════════════════════════════════════════════
function SubmissionsTab({ exam, submissions, canGrade, locked }: { exam: Exam; submissions: ExamSubmission[]; canGrade: boolean; locked: boolean }) {
  const { students } = useStudents();
  const { markAbsent, markAttended } = useAssessment();
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
            {['학생명', '휴대폰번호', '응시상태', '획득점수', '채점상태', '공개여부', '관리'].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => {
            const stu = studentMap.get(sub.studentId);
            const isVisible = isResultVisibleForStudent(exam, sub);
            return (
              <tr key={sub.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                <td className="px-3 py-2.5 font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                <td className="px-3 py-2.5 text-xs tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{stu?.phone ?? '-'}</td>
                <td className="px-3 py-2.5"><SubmissionStatusBadge status={sub.status} /></td>
                <td className="px-3 py-2.5 text-xs tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>
                  {sub.totalScore !== undefined ? `${sub.totalScore} / ${exam.totalScore}` : '-'}
                </td>
                <td className="px-3 py-2.5 text-xs" style={{ color: sub.status === '채점완료' ? 'oklch(0.35 0.15 145)' : 'oklch(0.55 0.015 250)' }}>
                  {sub.status === '결석' ? '결석' : sub.status === '채점완료' ? '완료' : '미채점'}
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <span style={{ color: isVisible ? 'oklch(0.35 0.15 145)' : 'oklch(0.6 0.01 250)' }}>
                    {isVisible ? '✓ 공개됨' : '비공개'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {canGrade && !locked && (
                    sub.status === '결석' ? (
                      <button onClick={() => markAttended(exam.id, sub.studentId)} className="flex items-center gap-1 text-xs" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                        <UserCheck size={11} /> 결석 취소
                      </button>
                    ) : (
                      <button onClick={() => markAbsent(exam.id, sub.studentId)} className="flex items-center gap-1 text-xs" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
                        <UserX size={11} /> 결석 처리
                      </button>
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {submissions.length === 0 && <p className="text-center py-10 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>응시 대상이 없습니다.</p>}
    </div>
  );
}

function SubmissionStatusBadge({ status }: { status: ExamSubmission['status'] }) {
  const map: Record<ExamSubmission['status'], { bg: string; text: string }> = {
    '응시예정': { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.5 0.015 250)' },
    '결석': { bg: 'oklch(0.96 0.08 27)', text: 'oklch(0.45 0.2 27)' },
    '채점중': { bg: 'oklch(0.95 0.08 60)', text: 'oklch(0.42 0.14 60)' },
    '채점완료': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.28 0.15 160)' },
  };
  const cfg = map[status];
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.text }}>{status}</span>;
}

// ════════════════════════════════════════════════════════════
// 채점현황 탭 — 문항 단위 혼합 채점(자동채점 실행 + 수동채점 입력)
// ════════════════════════════════════════════════════════════
function GradingTab({
  exam, submissions, canGrade, currentUserName, locked, setStudentAnswer,
}: {
  exam: Exam; submissions: ExamSubmission[]; canGrade: boolean; currentUserName: string; locked: boolean;
  setStudentAnswer: (examId: string, studentId: string, questionId: string, answer: string) => void;
}) {
  const { students } = useStudents();
  const { autoGradeSubmission, gradeAnswer } = useAssessment();
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const hasAutoQuestions = exam.questions.some((q) => isAutoGraded(q.type));
  const hasManualQuestions = exam.questions.some((q) => !isAutoGraded(q.type));

  const handleAutoGradeAll = () => {
    submissions.filter((s) => s.status !== '결석').forEach((s) => autoGradeSubmission(exam.id, s.studentId));
    toast.success('자동채점 대상 문항을 일괄 채점했습니다.');
  };

  return (
    <div>
      {!locked && canGrade && hasAutoQuestions && (
        <div className="flex items-center justify-between mb-3 p-3 rounded-md" style={{ background: 'oklch(0.95 0.04 250)' }}>
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'oklch(0.38 0.18 250)' }}>
            <Info size={12} /> 객관식·OX·단답형 문항은 학생 답안을 입력하면 즉시 자동채점됩니다. 서술형·증명형·풀이형은 아래에서 직접 점수를 입력하세요.
          </p>
          <Button size="sm" variant="outline" onClick={handleAutoGradeAll} className="h-7 text-xs gap-1"><RefreshCw size={11} /> 전체 재채점</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
              <th className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>학생명</th>
              {exam.questions.map((q) => (
                <th key={q.id} className="px-2 py-2.5 text-center text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>
                  {q.no}번<br /><span className="text-[10px]" style={{ color: isAutoGraded(q.type) ? 'oklch(0.5 0.13 160)' : 'oklch(0.5 0.13 60)' }}>{q.type}({q.points})</span>
                  {isAutoGraded(q.type) && <div className="text-[10px] mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>정답: {q.correctAnswer}</div>}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>합계</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => {
              const stu = studentMap.get(sub.studentId);
              const isAbsent = sub.status === '결석';
              return (
                <tr key={sub.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                  {exam.questions.map((q) => {
                    const ans = sub.answers.find((a) => a.questionId === q.id);
                    if (isAbsent) return <td key={q.id} className="px-2 py-2 text-center text-xs" style={{ color: 'oklch(0.8 0.01 250)' }}>결석</td>;
                    return (
                      <td key={q.id} className="px-2 py-2 text-center">
                        {isAutoGraded(q.type) ? (
                          canGrade && !locked ? (
                            // 학생 답안 입력 — 포커스를 벗어나면 정답과 비교해 즉시 자동채점된다(score/isCorrect/gradedBy/gradedAt 채워짐).
                            <div className="flex flex-col items-center gap-0.5">
                              <Input
                                type="text"
                                defaultValue={ans?.studentAnswer ?? ''}
                                onBlur={(e) => setStudentAnswer(exam.id, sub.studentId, q.id, e.target.value)}
                                className="h-7 w-14 text-xs text-center mx-auto"
                                placeholder="답안"
                              />
                              <span className="text-[10px] tabular-nums" style={{ color: ans?.score !== undefined ? (ans.isCorrect ? 'oklch(0.5 0.15 160)' : 'oklch(0.577 0.245 27.325)') : 'oklch(0.75 0.01 250)' }}>
                                {ans?.score !== undefined ? `${ans.score}점` : '미채점'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-xs tabular-nums" style={{ color: ans?.score !== undefined ? 'oklch(0.4 0.015 250)' : 'oklch(0.8 0.01 250)' }}>
                                {ans?.studentAnswer || '-'}
                              </span>
                              <span className="text-[10px] tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>{ans?.score ?? '미채점'}</span>
                            </div>
                          )
                        ) : canGrade && !locked ? (
                          <Input
                            type="number"
                            defaultValue={ans?.score ?? ''}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (!Number.isNaN(v)) gradeAnswer(exam.id, sub.studentId, q.id, Math.max(0, Math.min(v, q.points)), currentUserName);
                            }}
                            className="h-7 w-14 text-xs text-center mx-auto"
                            placeholder="-"
                          />
                        ) : (
                          <span className="text-xs tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{ans?.score ?? '-'}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                    {isAbsent ? '결석' : (sub.totalScore !== undefined ? sub.totalScore : '미채점')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {submissions.length === 0 && <p className="text-center py-10 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>응시 대상이 없습니다.</p>}
      {!locked && canGrade && (
        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 답안·점수 입력 후 포커스를 벗어나면 저장됩니다.</p>
      )}
      {locked && (
        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
          <Info size={11} />
          {requiresPublishAction(exam)
            ? '성적이 공개되어 결과가 확정되었습니다. 점수 변경은 결과분석 탭의 정정 처리를 이용하세요.'
            : '채점이 완료되어 성적조회에 반영되었습니다. 점수 변경은 결과분석 탭의 정정 처리를 이용하세요.'}
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 결과분석 탭 — 분포/평균 + 정정 처리
// ════════════════════════════════════════════════════════════
function AnalysisTab({ exam, submissions, canCorrect, currentUserName, locked }: { exam: Exam; submissions: ExamSubmission[]; canCorrect: boolean; currentUserName: string; locked: boolean }) {
  const { students } = useStudents();
  const { classes } = useClasses();
  const { correctScore } = useAssessment();
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const graded = submissions.filter((s) => s.status !== '결석' && s.totalScore !== undefined);
  const scores = graded.map((s) => s.totalScore!);
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const min = scores.length ? Math.min(...scores) : 0;

  // 합격/기준 통과율 — 만점의 60% 이상을 "통과"로 간주(Foundation 기준, 추후 변경 가능)
  const passMark = Math.round(exam.totalScore * 0.6);
  const passCount = scores.filter((s) => s >= passMark).length;
  const passRate = scores.length ? Math.round((passCount / scores.length) * 100) : 0;

  // 점수 분포 — 10점 구간 버킷
  const buckets = Array.from({ length: Math.ceil(exam.totalScore / 10) + 1 }, (_, i) => ({
    label: `${i * 10}~${Math.min((i + 1) * 10 - 1, exam.totalScore)}`,
    count: scores.filter((s) => s >= i * 10 && s < (i + 1) * 10).length,
  })).filter((b) => b.count > 0 || b.label.startsWith('0'));

  // 반별 평균 (학원 전체 시험의 경우)
  const classByStudent = useMemo(() => {
    const map = new Map<string, string>(); // studentId → classId
    if (!exam.classId) {
      // 학원 전체 시험: students.classes에서 현재 수강 반 매핑
      students.forEach((stu) => {
        const activeClass = stu.classes?.find((c) => c.status === '수강중');
        if (activeClass) map.set(stu.id, activeClass.id);
      });
    }
    return map;
  }, [students, exam.classId]);

  const classAvgStats = useMemo(() => {
    if (exam.classId) return []; // 반 단위 시험은 반별 평균 불필요
    const classScores = new Map<string, number[]>();
    graded.forEach((sub) => {
      const cid = classByStudent.get(sub.studentId);
      if (!cid || sub.totalScore === undefined) return;
      if (!classScores.has(cid)) classScores.set(cid, []);
      classScores.get(cid)!.push(sub.totalScore);
    });
    return Array.from(classScores.entries()).map(([cid, sc]) => ({
      className: classes.find((c) => c.id === cid)?.name ?? cid,
      avg: Math.round((sc.reduce((a, b) => a + b, 0) / sc.length) * 10) / 10,
      count: sc.length,
    })).sort((a, b) => b.avg - a.avg);
  }, [graded, classByStudent, classes, exam.classId]);

  // 문항별 정답률(자동채점 문항 한정 — 의미가 명확한 지표)
  const questionStats = exam.questions.filter((q) => isAutoGraded(q.type)).map((q) => {
    const answered = graded.map((s) => s.answers.find((a) => a.questionId === q.id));
    const correctCount = answered.filter((a) => a?.isCorrect).length;
    return { q, rate: answered.length ? Math.round((correctCount / answered.length) * 100) : 0 };
  });

  const [correctionModal, setCorrectionModal] = useState<{ studentId: string; studentName: string; currentScore: number } | null>(null);
  const [newScoreInput, setNewScoreInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  const openCorrection = (studentId: string, studentName: string, currentScore: number) => {
    setCorrectionModal({ studentId, studentName, currentScore });
    setNewScoreInput(String(currentScore));
    setReasonInput('');
  };

  const handleCorrectionSave = () => {
    if (!correctionModal) return;
    const v = Number(newScoreInput);
    if (Number.isNaN(v)) { toast.error('올바른 점수를 입력하세요.'); return; }
    if (v < 0 || v > exam.totalScore) { toast.error(`점수는 0 ~ ${exam.totalScore}점 사이여야 합니다.`); return; }
    if (!reasonInput.trim()) { toast.error('정정 사유는 필수 입력입니다.'); return; }
    correctScore(exam.id, correctionModal.studentId, undefined, v, reasonInput.trim(), currentUserName);
    toast.success(`${correctionModal.studentName} 학생의 성적이 정정되었습니다.`);
    setCorrectionModal(null);
  };

  return (
    <div className="space-y-5">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Stat label="응시(채점) 인원" value={`${graded.length}명`} />
        <Stat label="평균" value={`${avg}점`} />
        <Stat label="최고점" value={`${max}점`} />
        <Stat label="최저점" value={`${min}점`} />
        <Stat label="기준 통과" value={`${passCount}명`} />
        <Stat label={`통과율 (≥${passMark}점)`} value={`${passRate}%`} />
      </div>

      {/* 점수 분포 */}
      {scores.length > 0 && (
        <div>
          <Label className="text-xs font-semibold mb-2 block">점수 분포</Label>
          <div className="flex items-end gap-2 h-20">
            {buckets.map((b) => {
              const maxCount = Math.max(...buckets.map((bk) => bk.count), 1);
              const heightPct = (b.count / maxCount) * 100;
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${Math.max(heightPct, 4)}%`, background: b.count > 0 ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.92 0.005 250)', minHeight: 4 }} />
                  <span className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.01 250)', fontSize: 10 }}>{b.count}명</span>
                  <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)', fontSize: 9 }}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 반별 평균 (학원 전체 시험) */}
      {classAvgStats.length > 0 && (
        <div>
          <Label className="text-xs font-semibold mb-2 block">반별 평균</Label>
          <div className="space-y-1.5">
            {classAvgStats.map(({ className, avg: cAvg, count }) => (
              <div key={className} className="flex items-center gap-3 text-xs">
                <span className="w-36 flex-shrink-0 truncate" style={{ color: 'oklch(0.4 0.02 250)' }}>{className}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round((cAvg / exam.totalScore) * 100)}%`, background: 'oklch(0.511 0.262 276.966)' }} />
                </div>
                <span className="w-24 text-right tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{cAvg}점 ({count}명)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 문항별 정답률 */}
      {questionStats.length > 0 && (
        <div>
          <Label className="text-xs font-semibold mb-2 block">문항별 정답률 (자동채점 문항)</Label>
          <div className="space-y-1.5">
            {questionStats.map(({ q, rate }) => (
              <div key={q.id} className="flex items-center gap-2 text-xs">
                <span className="w-12 flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{q.no}번</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                  <div className="h-full rounded-full" style={{ width: `${rate}%`, background: 'oklch(0.511 0.262 276.966)' }} />
                </div>
                <span className="w-10 text-right tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IF 분석 플레이스홀더 — 계산실수 / 개념부족 / 시간부족 */}
      <div>
        <Label className="text-xs font-semibold mb-2 block">
          IF 분석 <span className="font-normal" style={{ color: 'oklch(0.6 0.01 250)' }}>(준비 중 — 향후 문항별 오답 패턴 분석과 연동 예정)</span>
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '계산 실수', desc: '정답 개념은 알지만 계산 과정에서 오류 발생', color: 'oklch(0.55 0.18 45)' },
            { label: '개념 부족', desc: '관련 개념이나 공식의 이해 및 암기 부족', color: 'oklch(0.5 0.15 250)' },
            { label: '시간 부족', desc: '풀이 시간 배분 실패로 인한 미완성 또는 공란', color: 'oklch(0.45 0.15 320)' },
          ].map(({ label, desc, color }) => (
            <div key={label} className="rounded-xl p-3 border" style={{ borderColor: 'oklch(0.92 0.01 250)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color }}>{label}</div>
              <div className="text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>{desc}</div>
              <div className="mt-2 text-xs italic" style={{ color: 'oklch(0.7 0.01 250)' }}>데이터 수집 준비 중</div>
            </div>
          ))}
        </div>
      </div>

      {/* 학생별 결과 */}
      <div>
        <Label className="text-xs font-semibold mb-2 block">
          학생별 결과 {locked && (
            <span style={{ color: 'oklch(0.6 0.015 250)' }}>
              {requiresPublishAction(exam) ? '(공개 완료 — 점수 변경은 정정 처리로만 가능)' : '(채점 완료 — 점수 변경은 정정 처리로만 가능)'}
            </span>
          )}
        </Label>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
              {['학생명', '총점', '정정 이력', ''].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => {
              const stu = studentMap.get(sub.studentId);
              return (
                <tr key={sub.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>
                    {sub.status === '결석' ? '결석' : (sub.totalScore ?? '미채점')}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                    {sub.corrections.length > 0 ? `${sub.corrections.length}건 (최근: ${sub.corrections[sub.corrections.length - 1].previousScore}→${sub.corrections[sub.corrections.length - 1].newScore})` : '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    {canCorrect && locked && sub.status !== '결석' && sub.totalScore !== undefined && (
                      <button onClick={() => openCorrection(sub.studentId, stu?.name ?? '', sub.totalScore!)} className="flex items-center gap-1 text-xs" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                        <Pencil size={11} /> 정정
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!correctionModal} onOpenChange={(o) => !o && setCorrectionModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">{correctionModal?.studentName} 성적 정정</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">새 총점 (현재: {correctionModal?.currentScore}점)</Label>
              <Input type="number" value={newScoreInput} onChange={(e) => setNewScoreInput(e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">정정 사유 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>(필수)</span></Label>
              <Textarea value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} placeholder="정정 사유를 입력하세요" className="text-sm resize-none" rows={3} />
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded text-xs" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
              <Info size={11} className="mt-0.5 flex-shrink-0" /> 정정 처리는 이력으로 기록되며, 기존 점수를 직접 덮어쓰지 않습니다.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCorrectionModal(null)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={handleCorrectionSave} className="h-8 text-xs" style={{ background: 'oklch(0.511 0.262 276.966)' }}>정정 저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="axis-card p-3.5 text-center">
      <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{value}</div>
    </div>
  );
}
