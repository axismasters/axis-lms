// AXIS LMS v1.2 — Phase 3D v3-r15: 내신 대비 운영 가이드 엔진(Exam Prep Guide Engine) — UI
//
// 시험 상세(AssessmentDetail.tsx)의 탭 하나로만 붙는다 — 독립 라우트/사이드바 메뉴가 아니다.
//
// ⚠ 지시서 §5 금지 사항 반영:
//   - AI가 일정을 계산하지 않는다 — 이 파일은 fetch를 쓰지 않으며, 모든 계산은
//     examPrepGuideEngine.ts(순수 함수)가 담당하고 이 컴포넌트는 결과를 표시/편집만 한다.
//   - 학생이 직접 가이드를 생성하는 구조 금지 — 이 패널은 AssessmentDetail.tsx(관리자·교사
//     전용 라우트)에서만 렌더되며, 학생/보호자 화면 어디에도 연결되지 않는다.
//   - 승인 없이 학생에게 자동 배포 금지 — 애초에 이번 MVP는 학생/보호자 화면에 이 데이터를
//     노출하는 지점 자체가 없다(승인 여부와 무관하게 노출 0건).
//   - 재무(수납/환불/미납/청구/영수증) 정보 노출 금지 — 이 패널은 재무 데이터를 다루지 않는다.
//   - 합격률/합격 가능성/합격 보장/불합격 표현 금지 — 이 패널은 그런 표현을 쓰지 않는다.
//   - 문제은행 실제 연동 금지 — recommendedProblemSetIds/levelPolicy/questionBankReady는
//     화면에 노출하지 않는 placeholder로만 데이터에 보존한다(추후 연동 대비).

import { useState } from 'react';
import {
  ExamPrepGuideInput, ExamPrepGuideRecord, emptyExamPrepGuideInput,
  EXAM_PREP_GUIDE_STATUS_LABEL, EXAM_PREP_SESSION_PHASE_LABEL, ExamPrepSessionPhase,
} from '@/lib/examPrepGuideTypes';
import {
  loadExamPrepGuide, saveExamPrepGuideInput, generateExamPrepGuide,
  updateExamPrepSessionText, approveExamPrepGuide, unapproveExamPrepGuide, isExamPrepGuideStale,
} from '@/lib/examPrepGuideStore';
import { validateExamPrepGuideInput } from '@/lib/examPrepGuideEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck, RotateCcw, AlertTriangle, Info, Lock } from 'lucide-react';
import { CHART_BLUE, CHART_TEAL, CHART_GOLD, CHART_AMBER, AXIS_NAVY } from '@/lib/brandColors';

interface Props {
  examId: string;
  examTitle: string;
  examDate: string;
  defaultClassName: string;   // 반 이름(있으면 기본값으로 채움 — 학원 전체 시험이면 빈 문자열)
  defaultTeacher: string;     // 담당 선생님 기본값(시험 생성자)
  currentUserName: string;
  canEdit: boolean;           // 편집/생성/승인 가능 여부(assessment.grade + canAccessExam — 호출부에서 계산)
}

const PHASE_COLOR: Record<ExamPrepSessionPhase, string> = {
  progress: CHART_BLUE,
  assessment: CHART_TEAL,
  mockExam: CHART_GOLD,
  wrongAnswerReview: CHART_AMBER,
  finalReview: AXIS_NAVY,
};

const TEXT_MUTE = 'oklch(0.47 0.015 250)';
const TEXT_BODY = 'oklch(0.2 0.02 250)';
const TEXT_LABEL = 'oklch(0.4 0.015 250)';

export default function ExamPrepGuidePanel({ examId, examTitle, examDate, defaultClassName, defaultTeacher, currentUserName, canEdit }: Props) {
  const [record, setRecord] = useState<ExamPrepGuideRecord | null>(() => loadExamPrepGuide(examId));
  const [input, setInput] = useState<ExamPrepGuideInput>(
    () => record?.input ?? emptyExamPrepGuideInput({ examName: examTitle, examDate, className: defaultClassName, teacherInCharge: defaultTeacher })
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [unapproveConfirmOpen, setUnapproveConfirmOpen] = useState(false);

  const locked = record?.status === 'approved' || !canEdit;
  const stale = record ? isExamPrepGuideStale(record) : false;
  const schedule = record?.schedule ?? null;

  const patchInput = (patch: Partial<ExamPrepGuideInput>) => {
    if (locked) return;
    const next = { ...input, ...patch };
    setInput(next);
    const result = saveExamPrepGuideInput(examId, next, currentUserName);
    if (result.ok && result.record) setRecord(result.record);
  };

  const handleGenerate = () => {
    const errors = validateExamPrepGuideInput(input);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('입력값을 모두 채워주세요.');
      return;
    }
    setValidationErrors([]);
    const saved = saveExamPrepGuideInput(examId, input, currentUserName);
    if (!saved.ok) { toast.error(saved.reason ?? '저장할 수 없습니다.'); return; }
    const result = generateExamPrepGuide(examId, currentUserName);
    if (!result.ok || !result.record) { toast.error(result.reason ?? '생성할 수 없습니다.'); return; }
    setRecord(result.record);
    toast.success('내신 대비 운영 가이드를 자동 생성했습니다. 검토 후 승인해주세요.');
  };

  const handleApprove = () => {
    const result = approveExamPrepGuide(examId, currentUserName);
    if (!result.ok || !result.record) { toast.error(result.reason ?? '승인할 수 없습니다.'); setApproveConfirmOpen(false); return; }
    setRecord(result.record);
    setApproveConfirmOpen(false);
    toast.success('내신 대비 운영 가이드를 승인했습니다.');
  };

  const handleUnapprove = () => {
    const result = unapproveExamPrepGuide(examId, currentUserName);
    if (!result.ok || !result.record) { toast.error(result.reason ?? '승인을 취소할 수 없습니다.'); setUnapproveConfirmOpen(false); return; }
    setRecord(result.record);
    setUnapproveConfirmOpen(false);
    toast.info('승인을 취소했습니다. 필요한 부분을 수정한 뒤 다시 생성/승인해주세요.');
  };

  const handleSessionText = (sessionNo: number, field: 'focus' | 'homework', value: string) => {
    const result = updateExamPrepSessionText(examId, sessionNo, { [field]: value }, currentUserName);
    if (result.ok && result.record) setRecord(result.record);
  };

  return (
    <div className="space-y-5">
      {/* 안내 — 노출 범위 명시 */}
      <div className="flex items-start gap-2 p-3 rounded-md text-xs" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          이 가이드는 시험/성적 관리 화면(선생님/관리자)에서만 확인·수정할 수 있습니다. 학생·보호자 화면에는 노출되지 않으며,
          일정 계산은 AI가 아니라 규칙 기반 계산 엔진이 처리합니다. 자동 생성 결과는 승인 전까지 초안입니다 — 반드시 검토 후 승인해주세요.
        </span>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-3 rounded-md text-xs" style={{ background: 'oklch(0.96 0.005 250)', color: TEXT_MUTE }}>
          <Lock size={13} /> 이 시험의 내신 대비 가이드를 조회할 수만 있습니다(수정 권한 없음).
        </div>
      )}

      {/* 상태 배지 */}
      {record && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <StatusBadge status={record.status} />
          {stale && record.status === 'generated' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold" style={{ background: 'oklch(0.95 0.08 60)', color: 'oklch(0.42 0.14 60)' }}>
              <AlertTriangle size={11} /> 입력값이 변경되었습니다 — 다시 생성해주세요
            </span>
          )}
          {record.status === 'approved' && record.approvedBy && (
            <span style={{ color: TEXT_MUTE }}>승인: {record.approvedBy} · {record.approvedAt?.slice(0, 10)}</span>
          )}
        </div>
      )}

      {/* 입력 패널 */}
      <div>
        <Label className="text-xs font-semibold mb-2 block">입력값</Label>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="학교" value={input.school} onChange={(v) => patchInput({ school: v })} disabled={locked} placeholder="예: OO고등학교" />
          <TextField label="학년" value={input.grade} onChange={(v) => patchInput({ grade: v })} disabled={locked} placeholder="예: 고2" />
          <TextField label="반" value={input.className} onChange={(v) => patchInput({ className: v })} disabled={locked} placeholder="예: 고2 수학 심화반" />
          <TextField label="시험명" value={input.examName} onChange={(v) => patchInput({ examName: v })} disabled={locked} />
          <TextField label="시험일" type="date" value={input.examDate} onChange={(v) => patchInput({ examDate: v })} disabled={locked} />
          <TextField label="담당 선생님" value={input.teacherInCharge} onChange={(v) => patchInput({ teacherInCharge: v })} disabled={locked} />
          <TextField label="부교재명" value={input.supplementaryBookName} onChange={(v) => patchInput({ supplementaryBookName: v })} disabled={locked} />
          <TextField label="부교재 범위" value={input.supplementaryBookScope} onChange={(v) => patchInput({ supplementaryBookScope: v })} disabled={locked} />
          <NumberField label="주당 수업 횟수" value={input.weeklySessionCount} onChange={(v) => patchInput({ weeklySessionCount: v })} disabled={locked} />
          <NumberField label="실제 남은 수업 회차" value={input.actualRemainingSessions} onChange={(v) => patchInput({ actualRemainingSessions: v })} disabled={locked} />
          <div className="col-span-2">
            <TextAreaField label="시험범위" value={input.examScope} onChange={(v) => patchInput({ examScope: v })} disabled={locked} placeholder="예: 미적분 1~3단원" />
          </div>
          <div className="col-span-2">
            <TextAreaField label="평가 방식" value={input.assessmentMethod} onChange={(v) => patchInput({ assessmentMethod: v })} disabled={locked} placeholder="예: 객관식+서술형 혼합 30문항" />
          </div>
          <div className="col-span-2">
            <TextAreaField label="보충 기준" value={input.supplementCriteria} onChange={(v) => patchInput({ supplementCriteria: v })} disabled={locked} placeholder="예: 70점 미만 학생 대상 보충 실시" />
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-3 p-3 rounded-md text-xs" style={{ background: 'oklch(0.96 0.05 27)', color: 'oklch(0.45 0.2 27)' }}>
            <p className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={12} /> 입력값을 확인해주세요</p>
            <ul className="list-disc list-inside space-y-0.5">
              {validationErrors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}

        {canEdit && !locked && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleGenerate} className="h-8 text-xs gap-1.5" style={{ background: '#040D1E' }}>
              <Sparkles size={12} /> {schedule ? '다시 생성' : '자동 생성'}
            </Button>
          </div>
        )}
      </div>

      {/* 생성 결과 */}
      {schedule && (
        <div className="space-y-4 pt-1 border-t" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
          {schedule.warnings.length > 0 && (
            <div className="p-3 rounded-md text-xs space-y-1" style={{ background: 'oklch(0.95 0.08 60)', color: 'oklch(0.42 0.14 60)' }}>
              {schedule.warnings.map((w) => (
                <p key={w} className="flex items-start gap-1.5"><AlertTriangle size={12} className="mt-0.5 flex-shrink-0" /> {w}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            <Stat label="시험일까지" value={`D-${schedule.daysUntilExam}`} />
            <Stat label="남은 주차" value={`${schedule.weeksUntilExam}주`} />
            <Stat label="남은 수업 횟수" value={`${schedule.totalRemainingSessions}회`} />
            <Stat label="날짜 기준 참고치" value={`약 ${schedule.estimatedSessionsByDate}회`} />
          </div>

          {schedule.milestones.length > 0 && (
            <div>
              <Label className="text-xs font-semibold mb-2 block">일정 요약</Label>
              <div className="space-y-1">
                {schedule.milestones.map((m, i) => (
                  <div key={`${m.label}-${i}`} className="flex items-center gap-3 text-xs px-3 py-1.5 rounded" style={{ background: 'oklch(0.98 0.004 247)' }}>
                    <span className="w-28 flex-shrink-0 font-semibold" style={{ color: TEXT_LABEL }}>{m.label}</span>
                    <span className="tabular-nums" style={{ color: TEXT_BODY }}>{m.date}</span>
                    {m.note && <span style={{ color: TEXT_MUTE }}>· {m.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold mb-2 block">
              회차별 진도 · 숙제 계획 <span className="font-normal" style={{ color: TEXT_MUTE }}>(진도/평가/실전모의/오답보완/최종복습 — 선생님이 문구를 자유롭게 수정할 수 있습니다)</span>
            </Label>
            <div className="axis-table-scroll" style={{ maxHeight: 520 }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'oklch(0.985 0.003 250)' }}>
                    {['회차', '예상일', '구분', '진도/활동 내용', '숙제'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap"
                        style={{ color: TEXT_LABEL, background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.progressPlan.map((s) => {
                    const hw = schedule.homeworkPlan.find((h) => h.sessionNo === s.sessionNo);
                    return (
                      <tr key={s.sessionNo} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                        <td className="px-3 py-2.5 text-xs font-semibold tabular-nums" style={{ color: TEXT_BODY }}>{s.sessionNo}회차</td>
                        <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: TEXT_MUTE }}>{s.estimatedDate}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `color-mix(in oklch, ${PHASE_COLOR[s.phase]} 16%, white)`, color: PHASE_COLOR[s.phase] }}>
                            {EXAM_PREP_SESSION_PHASE_LABEL[s.phase]}
                          </span>
                        </td>
                        <td className="px-3 py-2 min-w-[240px]">
                          <Textarea
                            value={s.focus}
                            onChange={(e) => handleSessionText(s.sessionNo, 'focus', e.target.value)}
                            disabled={locked}
                            className="text-xs min-h-0 py-1.5 resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[220px]">
                          <Textarea
                            value={hw?.description ?? ''}
                            onChange={(e) => handleSessionText(s.sessionNo, 'homework', e.target.value)}
                            disabled={locked}
                            className="text-xs min-h-0 py-1.5 resize-none"
                            rows={2}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 승인 / 승인취소 */}
          {canEdit && (
            <div className="flex justify-end gap-2 pt-1">
              {record?.status === 'generated' && (
                <Button size="sm" onClick={() => setApproveConfirmOpen(true)} disabled={stale} className="h-8 text-xs gap-1.5" style={{ background: '#040D1E' }}
                  title={stale ? '입력값이 변경되었습니다. 다시 생성한 뒤 승인해주세요.' : undefined}>
                  <ShieldCheck size={13} /> 승인
                </Button>
              )}
              {record?.status === 'approved' && (
                <Button size="sm" variant="outline" onClick={() => setUnapproveConfirmOpen(true)} className="h-8 text-xs gap-1.5">
                  <RotateCcw size={12} /> 승인 취소
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 승인 확인 모달 */}
      <Dialog open={approveConfirmOpen} onOpenChange={(o) => !o && setApproveConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">내신 대비 가이드 승인</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
              <b>{input.examName || examTitle}</b>의 내신 대비 운영 가이드를 승인하시겠습니까?
            </p>
            <div className="rounded-lg p-3 text-xs" style={{ background: 'oklch(0.96 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
              <p>• 승인 후에는 입력값과 세부 문구를 직접 수정할 수 없으며, 승인 취소 후에만 수정할 수 있습니다.</p>
              <p>• 이 가이드는 승인 여부와 무관하게 학생/보호자 화면에는 노출되지 않습니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApproveConfirmOpen(false)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={handleApprove} className="h-8 text-xs gap-1" style={{ background: '#040D1E' }}>
              <ShieldCheck size={12} /> 승인 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 취소 확인 모달 */}
      <Dialog open={unapproveConfirmOpen} onOpenChange={(o) => !o && setUnapproveConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">승인 취소</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>승인을 취소하고 초안으로 되돌리시겠습니까? 기존 일정 내용은 그대로 유지됩니다.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUnapproveConfirmOpen(false)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={handleUnapprove} className="h-8 text-xs gap-1" style={{ background: '#040D1E' }}>
              <RotateCcw size={12} /> 승인 취소 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 작은 컴포넌트들
// ════════════════════════════════════════════════════════════
function StatusBadge({ status }: { status: ExamPrepGuideRecord['status'] }) {
  const map: Record<ExamPrepGuideRecord['status'], { bg: string; text: string }> = {
    draft: { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.5 0.015 250)' },
    generated: { bg: 'oklch(0.95 0.08 60)', text: 'oklch(0.42 0.14 60)' },
    approved: { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.28 0.15 160)' },
  };
  const cfg = map[status];
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.text }}>{EXAM_PREP_GUIDE_STATUS_LABEL[status]}</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="axis-card p-3 text-center">
      <div className="text-xs mb-1" style={{ color: TEXT_MUTE }}>{label}</div>
      <div className="text-base font-bold" style={{ color: '#040D1E' }}>{value}</div>
    </div>
  );
}

function TextField({ label, value, onChange, disabled, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} className="text-sm" />
    </div>
  );
}

function NumberField({ label, value, onChange, disabled }: {
  label: string; value: number; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">{label}</Label>
      <Input type="number" min={0} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled} className="text-sm" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, disabled, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} className="text-sm resize-none" rows={2} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// § Opinion for Lead Developer(개발 총괄 검토용 — 코드 동작에는 영향 없음)
// ════════════════════════════════════════════════════════════
// 1) 회차 "예상일"(estimateSessionDate, examPrepGuideEngine.ts)은 반의 실제 수업
//    요일/휴원일을 반영하지 않은 "오늘~시험일 구간의 비례 배분 근사치"다. 지시서 §4-2
//    필수 입력값에 반 시간표가 없어 이번 MVP 범위 밖으로 뒀다 — ClassContext의 반
//    스케줄(schedule 문자열) 또는 AttendanceContext의 실제 출결 캘린더와 연동하면
//    "다음 화요일 수업" 같은 정확한 날짜를 줄 수 있다. 다음 단계 후보로 제안한다.
// 2) "내신 대비 가이드" 탭은 exam.categoryId === 'mock-school'일 때만 노출하도록
//    AssessmentDetail.tsx에서 좁게 게이트했다(§ CHANGES 문서 §6 근거). 단원평가에도
//    붙이고 싶다는 요구가 나오면 그 조건 한 줄만 넓히면 되도록 구조를 열어뒀다 —
//    ExamPrepGuidePanel 자체는 exam.categoryId에 의존하지 않는다.
// 3) 평가 방식(assessmentMethod)/보충 기준(supplementCriteria)은 이번 MVP에서 자유
//    서술(텍스트)로만 받는다. 나중에 EXAM_CATEGORIES처럼 카탈로그(배열) 구조로
//    표준화하고 싶다면 ExamPrepGuideInput의 이 두 필드 타입만 바꾸면 되며, 다른
//    필드/엔진 로직과는 독립적이다.
// 4) 승인 취소(unapproveExamPrepGuide)는 상태를 'draft'가 아니라 'generated'로
//    되돌린다 — 마지막으로 생성된 일정을 그대로 보존해, 문구만 다듬고 재생성 없이
//    바로 재승인할 수 있게 하기 위함이다. 입력값(§필수 입력값)까지 바꾼 경우에는
//    isExamPrepGuideStale()이 감지해 재승인 전 "다시 생성" 하도록 막는다.
