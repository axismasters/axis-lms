// AXIS LMS v1.2 - 시험 생성 모달
// Design: Structured Authority
// 탭: 기본정보 / 문항 구성(문항 단위 혼합 채점 — 객관식/OX/단답형은 자동채점, 서술형/증명형/풀이형은 수동채점)
//
// 시험 생성 권한(assessment.create)은 최고관리자·원장만 보유 — 이 모달을 여는 진입점(AssessmentList.tsx)에서
// can('assessment.create')으로 이미 게이트하므로, 이 컴포넌트 자체는 권한 체크를 반복하지 않는다.

import { useState, useEffect } from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ExamQuestionDef, QuestionType, EXAM_CATEGORIES, AUTO_GRADED_TYPES, MANUAL_GRADED_TYPES, isAutoGraded,
  ExamScope, EXAM_SCOPE_LABELS, TEACHER_CREATABLE_EXAM_CATEGORY_IDS, ADMIN_CREATABLE_EXAM_CATEGORY_IDS,
} from '@/lib/assessmentData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Minus, Trash2, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

type TabKey = 'basic' | 'questions';

interface Props {
  open: boolean;
  onClose: () => void;
  createdBy: string; // 현재 로그인 사용자 이름(AuthContext) — 호출부에서 전달
  // Phase 3C: 'teacher'면 항상 TEACHER_PRIVATE로 고정하고, 대상 반을 본인 담당 반으로만 제한한다.
  // 기본값은 'admin'(기존 동작 그대로 — 공통 시험 3종 중 선택, 전체 반 대상 가능).
  mode?: 'admin' | 'teacher';
}

const QUESTION_TYPES: QuestionType[] = [...AUTO_GRADED_TYPES, ...MANUAL_GRADED_TYPES];

// AXIS 확정 과목 목록 (무제한 확장 가능하도록 배열 구조 사용)
export const SUBJECT_OPTIONS = ['수학', '국어', '영어', '과학', '사회', '기타'] as const;
export type SubjectOption = (typeof SUBJECT_OPTIONS)[number];

function emptyQuestion(no: number): ExamQuestionDef {
  return { id: nanoid(8), no, type: '객관식', points: 10, correctAnswer: '' };
}

// Phase 3D: 시험등록 기본 템플릿 — 교사가 "+ 문항 추가"를 여러 번 누르지 않아도
// 기본 문항 구성이 한 번에 생성되도록 한다. 문항 type은 모두 '객관식' 기본값으로 생성하고
// (개별 문항의 type/정답은 기존처럼 문항 구성 화면에서 자유롭게 수정 가능), 배점만
// 템플릿 규칙에 맞게 자동 계산한다.
const MIN_QUESTIONS = 1;

// 수능형(실전모의고사) — 30문항, 총점 100점.
// 1~6번 2점(12점) + 7~14번 3점(24점) + 15~22번 4점(32점) + 23~30번(선택과목) 4점(32점) = 100점.
// (v1에서 104점으로 잘못 계산되었던 문제를 v2에서 수정 — 총점 100점 고정 검증됨)
function buildSuneungTemplate(): ExamQuestionDef[] {
  const bands: Array<[number, number, number]> = [
    [1, 6, 2],
    [7, 14, 3],
    [15, 22, 4],
    [23, 30, 4],
  ];
  const qs: ExamQuestionDef[] = [];
  bands.forEach(([start, end, points]) => {
    for (let no = start; no <= end; no++) qs.push({ id: nanoid(8), no, type: '객관식', points, correctAnswer: '' });
  });
  return qs;
}

// 내신형 대시 시험지 — 24문항, 총점 100점 기준 자동 배분(100 = 4점×20 + 5점×4).
function buildNaeshinTemplate(): ExamQuestionDef[] {
  const TOTAL_QUESTIONS = 24;
  const TOTAL_POINTS = 100;
  const base = Math.floor(TOTAL_POINTS / TOTAL_QUESTIONS);
  const remainder = TOTAL_POINTS - base * TOTAL_QUESTIONS; // 남는 점수는 앞쪽 문항에 1점씩 더 배분
  const qs: ExamQuestionDef[] = [];
  for (let no = 1; no <= TOTAL_QUESTIONS; no++) {
    qs.push({ id: nanoid(8), no, type: '객관식', points: no <= remainder ? base + 1 : base, correctAnswer: '' });
  }
  return qs;
}

const EMPTY_FORM = {
  title: '',
  categoryId: 'unit-eval', // 관리자/교사 모두 선택 가능한 카테고리를 기본값으로(입학테스트 등 관리자 전용을 기본값으로 두지 않는다)
  classId: '', // '' = 학원 전체 대상
  subject: '수학' as string,
  examDate: '',
  scope: 'ACADEMY_COMMON' as ExamScope, // Phase 3C: 관리자는 공통 시험 3종(전체/학년/과정)만 생성
  targetGrade: '',
  targetCourseId: '',
};

// 관리자 화면에서 선택 가능한 공통 시험 scope만 노출(TEACHER_PRIVATE는 교사 전용 화면에서만 생성)
const ADMIN_SELECTABLE_SCOPES: ExamScope[] = ['ACADEMY_COMMON', 'GRADE_COMMON', 'COURSE_COMMON'];

export default function AssessmentFormModal({ open, onClose, createdBy, mode = 'admin' }: Props) {
  const { addExam } = useAssessment();
  const { classes: allClasses, getClassStudents } = useClasses();
  const { students } = useStudents();
  const { currentUser, activeMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [questions, setQuestions] = useState<ExamQuestionDef[]>([emptyQuestion(1)]);
  // Phase 3D: 입력값(정답)이 있는 문항을 삭제/템플릿으로 덮어쓸 때 확인을 받기 위한 대기 상태.
  // pendingAction이 있으면 확인 모달이 열린다.
  const [pendingAction, setPendingAction] = useState<
    | { type: 'removeQuestion'; id: string; label: string }
    | { type: 'applyTemplate'; template: 'suneung' | 'naeshin'; label: string }
    | null
  >(null);

  const isTeacherMode = mode === 'teacher';
  // 교사 모드: 본인 담당 반만 대상 반 선택지로 노출(다른 반/다른 교사 반이 섞이지 않도록)
  const classes = isTeacherMode
    ? allClasses.filter((c) => (currentUser.assignedClassIds ?? []).includes(c.id))
    : allClasses;

  // [교사 화면 시험 구조 정리] 시험 종류 선택지도 역할별로 분리한다.
  // 교사: 단원평가/내신대비모의고사만(내 시험지 관리 대상). 관리자: 입학테스트/인증평가까지
  // 포함하되, 성적 입력 자료로 재분류된 수능실전모의고사는 관리자도 문항 기반으로 새로
  // 만들지 않는다(전국연합모의고사/실제내신성적/수능실전모의고사는 /teacher/university-data의
  // "성적 입력" 탭에서 입력한다).
  const creatableCategoryIds: readonly string[] = isTeacherMode
    ? TEACHER_CREATABLE_EXAM_CATEGORY_IDS
    : ADMIN_CREATABLE_EXAM_CATEGORY_IDS;
  const categoryOptions = EXAM_CATEGORIES.filter((c) => creatableCategoryIds.includes(c.id));

  useEffect(() => {
    if (open) {
      setActiveTab('basic');
      setForm({
        ...EMPTY_FORM,
        categoryId: categoryOptions[0]?.id ?? EMPTY_FORM.categoryId,
        scope: isTeacherMode ? 'TEACHER_PRIVATE' : 'ACADEMY_COMMON',
      });
      setQuestions([emptyQuestion(1)]);
      setPendingAction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const totalScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  const removeQuestionById = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, no: i + 1 })));
  const updateQuestion = (id: string, patch: Partial<ExamQuestionDef>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  // 입력값(정답) 손실 가능성이 있으면 확인을 받고, 없으면 바로 삭제한다.
  const requestRemoveQuestion = (q: ExamQuestionDef) => {
    if (questions.length <= MIN_QUESTIONS) {
      toast.error(`최소 ${MIN_QUESTIONS}문항은 유지해야 합니다.`);
      return;
    }
    const hasData = (q.correctAnswer ?? '').trim() !== '';
    if (hasData) {
      setPendingAction({ type: 'removeQuestion', id: q.id, label: `${q.no}번 문항` });
    } else {
      removeQuestionById(q.id);
    }
  };

  // "-" 버튼: 마지막 문항 삭제(문항 구성 영역 좌측 스테퍼)
  const requestRemoveLast = () => {
    const last = questions[questions.length - 1];
    if (!last) return;
    requestRemoveQuestion(last);
  };

  const hasAnyAnswerData = questions.some((q) => (q.correctAnswer ?? '').trim() !== '');

  const applyTemplateNow = (template: 'suneung' | 'naeshin') => {
    setQuestions(template === 'suneung' ? buildSuneungTemplate() : buildNaeshinTemplate());
    toast.success(template === 'suneung' ? '수능형 템플릿(30문항)을 적용했습니다.' : '내신형 템플릿(24문항)을 적용했습니다.');
  };

  // 템플릿 적용은 현재 문항 구성을 전부 덮어쓰므로, 이미 입력한 정답이 있으면 확인을 받는다.
  const requestApplyTemplate = (template: 'suneung' | 'naeshin', label: string) => {
    if (hasAnyAnswerData) {
      setPendingAction({ type: 'applyTemplate', template, label });
    } else {
      applyTemplateNow(template);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'removeQuestion') {
      removeQuestionById(pendingAction.id);
    } else {
      applyTemplateNow(pendingAction.template);
    }
    setPendingAction(null);
  };


  const handleSave = () => {
    if (!form.title.trim()) { toast.error('시험명을 입력하세요.'); setActiveTab('basic'); return; }
    if (!form.examDate) { toast.error('시험일을 입력하세요.'); setActiveTab('basic'); return; }
    if (questions.length === 0) { toast.error('문항을 1개 이상 구성하세요.'); setActiveTab('questions'); return; }
    const invalidAuto = questions.find((q) => isAutoGraded(q.type) && !(q.correctAnswer ?? '').trim());
    if (invalidAuto) {
      toast.error(`${invalidAuto.no}번 문항(${invalidAuto.type})의 정답을 입력하세요. 자동채점 문항은 정답이 필요합니다.`);
      setActiveTab('questions');
      return;
    }

    // 대상 학생 결정:
    //   - 반을 선택했으면 그 반 수강생.
    //   - 반 미선택 시: 관리자 모드는 재원 중인 전체 학생(학원 전체 대상),
    //     교사 모드는 본인 담당 학생 전체(다른 교사 학생이 섞이지 않도록 — 학원 전체 개념 없음).
    const targetStudentIds = form.classId
      ? getClassStudents(form.classId)
      : isTeacherMode
        ? (currentUser.assignedStudentIds ?? [])
        : students.filter((s) => s.status === '재원').map((s) => s.id);

    if (targetStudentIds.length === 0) {
      toast.error(isTeacherMode
        ? '대상 학생이 없습니다. 담당 반 또는 담당 학생을 확인하세요.'
        : '대상 학생이 없습니다. 반 수강생 또는 재원 학생을 확인하세요.');
      return;
    }

    const exam = addExam(
      {
        title: form.title.trim(), categoryId: form.categoryId, classId: form.classId || undefined,
        subject: form.subject || undefined, examDate: form.examDate, questions, createdBy,
        createdByMode: activeMode,
        scope: isTeacherMode ? 'TEACHER_PRIVATE' : form.scope,
        ownerTeacherId: isTeacherMode ? currentUser.id : undefined,
        targetGrade: !isTeacherMode && form.scope === 'GRADE_COMMON' ? (form.targetGrade || undefined) : undefined,
        targetCourseId: !isTeacherMode && form.scope === 'COURSE_COMMON' ? (form.targetCourseId || undefined) : undefined,
      },
      targetStudentIds
    );
    toast.success(`"${exam.title}" 시험이 생성되었습니다. (응시 대상 ${targetStudentIds.length}명)`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isTeacherMode ? '내 시험 만들기' : '시험 등록'}</DialogTitle>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex gap-1 border-b mb-4" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
          {([{ key: 'basic' as TabKey, label: '기본정보' }, { key: 'questions' as TabKey, label: `문항 구성 (${questions.length})` }]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
              style={{
                borderColor: activeTab === t.key ? '#081F4D' : 'transparent',
                color: activeTab === t.key ? '#081F4D' : 'oklch(0.55 0.015 250)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">시험명</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="예: 1학기 1차 단원평가" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">시험 종류</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">과목</Label>
                <Select value={form.subject} onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}>
                  <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">시험일</Label>
              <input
                type="date"
                value={form.examDate}
                onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                className="h-9 w-full px-2 rounded border text-sm"
                style={{ borderColor: 'oklch(0.9 0.005 250)' }}
              />
            </div>
            {!isTeacherMode && (
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">시험 범위</Label>
                <Select value={form.scope} onValueChange={(v) => setForm((f) => ({ ...f, scope: v as ExamScope }))}>
                  <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ADMIN_SELECTABLE_SCOPES.map((s) => (
                      <SelectItem key={s} value={s}>{EXAM_SCOPE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  <Info size={11} /> 여기서 만드는 시험은 항상 관리자 공통 시험입니다. 선생님 개인 시험지는 강사 화면에서 별도로 생성합니다.
                </p>
                {form.scope === 'GRADE_COMMON' && (
                  <input type="text" placeholder="대상 학년(예: 고3)" value={form.targetGrade}
                    onChange={(e) => setForm((f) => ({ ...f, targetGrade: e.target.value }))}
                    className="h-9 w-full px-2 mt-2 rounded border text-sm" style={{ borderColor: 'oklch(0.9 0.005 250)' }} />
                )}
                {form.scope === 'COURSE_COMMON' && (
                  <input type="text" placeholder="대상 과정 id" value={form.targetCourseId}
                    onChange={(e) => setForm((f) => ({ ...f, targetCourseId: e.target.value }))}
                    className="h-9 w-full px-2 mt-2 rounded border text-sm" style={{ borderColor: 'oklch(0.9 0.005 250)' }} />
                )}
              </div>
            )}
            {isTeacherMode && (
              <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: 'oklch(0.96 0.02 250)', color: 'oklch(0.45 0.015 250)' }}>
                <Info size={12} /> 내가 만드는 시험은 내 수업용 개인 시험지입니다. 다른 선생님에게는 보이지 않습니다.
              </p>
            )}
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">대상 반</Label>
              <Select value={form.classId || 'all'} onValueChange={(v) => setForm((f) => ({ ...f, classId: v === 'all' ? '' : v }))}>
                <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isTeacherMode ? '담당 학생 전체' : '학원 전체'}</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.subject})</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
                <Info size={11} /> {isTeacherMode
                  ? '반을 선택하면 그 반 수강생만, 담당 학생 전체를 선택하면 내 담당 학생 전체가 응시 대상이 됩니다.'
                  : '반을 선택하면 그 반 수강생만, 학원 전체를 선택하면 재원 중인 전체 학생이 응시 대상이 됩니다.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {/* Phase 3D: 기본 템플릿 — 문항 추가를 여러 번 누르지 않아도 기본 구성이 한 번에 생성됨 */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-xs flex items-center gap-1 mr-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                <Sparkles size={11} /> 빠른 구성:
              </span>
              <Button variant="outline" size="sm" onClick={() => requestApplyTemplate('suneung', '수능형 템플릿(30문항)')} className="h-7 text-xs">
                수능형 (30문항 · 100점)
              </Button>
              <Button variant="outline" size="sm" onClick={() => requestApplyTemplate('naeshin', '내신형 템플릿(24문항)')} className="h-7 text-xs">
                내신형 대시 (24문항 · 100점 자동배분)
              </Button>
            </div>

            <div className="flex items-center justify-between mb-1">
              <p className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                총 {questions.length}문항 · 만점 {totalScore}점
              </p>
              {/* 왼쪽 "-"(마지막 문항 삭제) / 오른쪽 "+"(문항 추가) 스테퍼 */}
              <div className="flex items-center gap-1">
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={requestRemoveLast}
                  disabled={questions.length <= MIN_QUESTIONS}
                  className="h-8 w-8"
                  aria-label="마지막 문항 삭제"
                >
                  <Minus size={14} />
                </Button>
                <span className="text-xs tabular-nums w-10 text-center" style={{ color: 'oklch(0.4 0.015 250)' }}>{questions.length}문항</span>
                <Button type="button" variant="outline" size="icon" onClick={addQuestion} className="h-8 w-8" aria-label="문항 추가">
                  <Plus size={14} />
                </Button>
              </div>
            </div>
            {questions.map((q) => (
              <div key={q.id} className="flex items-center gap-2 p-2.5 rounded-md" style={{ border: '1px solid oklch(0.93 0.008 250)' }}>
                <span className="text-xs font-semibold w-8 text-center flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{q.no}번</span>
                <Select value={q.type} onValueChange={(v) => updateQuestion(q.id, { type: v as QuestionType, correctAnswer: isAutoGraded(v as QuestionType) ? q.correctAnswer : undefined })}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span
                  className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: isAutoGraded(q.type) ? 'oklch(0.94 0.06 160)' : 'oklch(0.95 0.06 60)',
                    color: isAutoGraded(q.type) ? 'oklch(0.4 0.13 160)' : 'oklch(0.45 0.13 60)',
                  }}
                >
                  {isAutoGraded(q.type) ? '자동채점' : '수동채점'}
                </span>
                <Input
                  type="number"
                  value={q.points}
                  onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) || 0 })}
                  className="h-8 w-16 text-xs"
                  placeholder="배점"
                />
                <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)' }}>점</span>
                {isAutoGraded(q.type) ? (
                  <Input
                    value={q.correctAnswer ?? ''}
                    onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                    placeholder={q.type === 'OX' ? '정답(O/X)' : q.type === '단답형' ? '정답' : '정답(보기 번호)'}
                    className="h-8 flex-1 text-xs"
                  />
                ) : (
                  <span className="flex-1 text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>채점현황 탭에서 수동 채점</span>
                )}
                <Button
                  type="button" variant="ghost" size="icon"
                  onClick={() => requestRemoveQuestion(q)}
                  disabled={questions.length <= MIN_QUESTIONS}
                  className="h-8 w-8 flex-shrink-0"
                  aria-label={`${q.no}번 문항 삭제`}
                >
                  <Trash2 size={14} style={{ color: 'oklch(0.55 0.015 250)' }} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">취소</Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs" style={{ background: '#081F4D' }}>
            시험 생성
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Phase 3D: 입력값 손실 가능성이 있는 삭제/템플릿 적용 확인 */}
      <AlertDialog open={pendingAction !== null} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === 'removeQuestion' ? '문항을 삭제할까요?' : '템플릿을 적용할까요?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'removeQuestion'
                ? `${pendingAction.label}에 입력한 정답이 함께 삭제됩니다. 계속하시겠습니까?`
                : `${pendingAction?.label} 적용 시 현재 입력한 문항 구성(정답 포함)이 모두 새 구성으로 대체됩니다. 계속하시겠습니까?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction} style={{ background: 'oklch(0.577 0.245 27.325)' }}>
              {pendingAction?.type === 'removeQuestion' ? '삭제' : '적용'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
