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
import {
  ExamQuestionDef, QuestionType, EXAM_CATEGORIES, AUTO_GRADED_TYPES, MANUAL_GRADED_TYPES, isAutoGraded,
} from '@/lib/assessmentData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

type TabKey = 'basic' | 'questions';

interface Props {
  open: boolean;
  onClose: () => void;
  createdBy: string; // 현재 로그인 사용자 이름(AuthContext) — 호출부에서 전달
}

const QUESTION_TYPES: QuestionType[] = [...AUTO_GRADED_TYPES, ...MANUAL_GRADED_TYPES];

function emptyQuestion(no: number): ExamQuestionDef {
  return { id: nanoid(8), no, type: '객관식', points: 10, correctAnswer: '' };
}

const EMPTY_FORM = {
  title: '',
  categoryId: EXAM_CATEGORIES[0].id,
  classId: '', // '' = 학원 전체 대상
  examDate: '',
};

export default function AssessmentFormModal({ open, onClose, createdBy }: Props) {
  const { addExam } = useAssessment();
  const { classes, getClassStudents } = useClasses();
  const { students } = useStudents();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [questions, setQuestions] = useState<ExamQuestionDef[]>([emptyQuestion(1)]);

  useEffect(() => {
    if (open) {
      setActiveTab('basic');
      setForm({ ...EMPTY_FORM });
      setQuestions([emptyQuestion(1)]);
    }
  }, [open]);

  const totalScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  const removeQuestion = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, no: i + 1 })));
  const updateQuestion = (id: string, patch: Partial<ExamQuestionDef>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

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

    // 대상 학생 결정: 반을 선택했으면 그 반 수강생, 아니면(학원 전체) 재원 중인 전체 학생.
    const targetStudentIds = form.classId
      ? getClassStudents(form.classId)
      : students.filter((s) => s.status === '재원').map((s) => s.id);

    if (targetStudentIds.length === 0) {
      toast.error('대상 학생이 없습니다. 반 수강생 또는 재원 학생을 확인하세요.');
      return;
    }

    const exam = addExam(
      { title: form.title.trim(), categoryId: form.categoryId, classId: form.classId || undefined, examDate: form.examDate, questions, createdBy },
      targetStudentIds
    );
    toast.success(`"${exam.title}" 시험이 생성되었습니다. (응시 대상 ${targetStudentIds.length}명)`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>시험 등록</DialogTitle>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex gap-1 border-b mb-4" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
          {([{ key: 'basic' as TabKey, label: '기본정보' }, { key: 'questions' as TabKey, label: `문항 구성 (${questions.length})` }]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
              style={{
                borderColor: activeTab === t.key ? 'oklch(0.511 0.262 276.966)' : 'transparent',
                color: activeTab === t.key ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.55 0.015 250)',
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
                    {EXAM_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">대상 반</Label>
              <Select value={form.classId || 'all'} onValueChange={(v) => setForm((f) => ({ ...f, classId: v === 'all' ? '' : v }))}>
                <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">학원 전체</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.subject})</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
                <Info size={11} /> 반을 선택하면 그 반 수강생만, 학원 전체를 선택하면 재원 중인 전체 학생이 응시 대상이 됩니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                총 {questions.length}문항 · 만점 {totalScore}점
              </p>
              <Button variant="outline" size="sm" onClick={addQuestion} className="h-7 text-xs gap-1"><Plus size={12} /> 문항 추가</Button>
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
                <button onClick={() => removeQuestion(q.id)} className="flex-shrink-0" style={{ color: 'oklch(0.65 0.01 250)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">취소</Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
            시험 생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
