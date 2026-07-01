// AXIS LMS v1.2 - TeacherExamScores (Phase 3D v3)
// "내 시험지 관리"에서 시험지를 클릭하거나 "학생별 성적" 버튼을 눌렀을 때 보이는 화면.
// 담당 학생 기준 학생명/채점상태/점수·만점/응시·결시 상태/결과 보기/채점 또는 정정을 한 번에 보여준다.
//
// TeacherExamGrading.tsx(/teacher/exams/:examId/grading)는 "채점 대기 입력" 전용이라
// 결석 학생이 빠지고, 이미 채점된 건에 대한 정정 기능도 없다 — 이 화면은 그 둘을 보완하는
// "조회+정정" 화면이다.
//
// Phase 3C 원칙 유지: TEACHER_PRIVATE 시험은 ownerTeacherId === 본인일 때만 접근 가능.
// 다른 교사의 개인 시험지는 이 화면에서도 절대 보이지 않는다(scope 이중 방어).

import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronLeft, CheckCircle2, AlertCircle, UserX, Pencil, Eye, X } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';
import type { ExamSubmission } from '@/lib/assessmentData';
import { TEACHER_CREATABLE_EXAM_CATEGORY_IDS, isPendingGrading, isGradedSubmission } from '@/lib/assessmentData';

function NotFoundScreen() {
  return (
    <TeacherLayout title="내 시험지 관리">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: '#040D1E' }}>
            <ChevronLeft size={14} /> 내 시험지 목록
          </div>
        </Link>
        <div className="axis-card p-10 text-center">
          <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>시험지를 찾을 수 없습니다.</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
            담당 범위에 없거나(다른 선생님의 개인 시험지 포함) 담당 학생 응시 데이터가 없습니다.
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

// [Phase 3D v3-r7] '응시예정'/'채점중'은 정책상 "채점 대기" 하나의 개념이므로 배지
// 라벨도 동일하게 "미채점"으로 통일한다(Record는 SubmissionStatus 4종을 전부 요구하므로
// 두 키를 계속 각각 두되, 표시 라벨만 맞춘다).
const STATUS_BADGE: Record<ExamSubmission['status'], { label: string; bg: string; text: string }> = {
  '응시예정': { label: '미채점', bg: 'oklch(0.95 0.08 60)', text: 'oklch(0.42 0.14 60)' },
  '결석': { label: '결석', bg: 'oklch(0.96 0.08 27)', text: 'oklch(0.45 0.2 27)' },
  '채점중': { label: '미채점', bg: 'oklch(0.95 0.08 60)', text: 'oklch(0.42 0.14 60)' },
  '채점완료': { label: '채점완료', bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.28 0.15 160)' },
};

export default function TeacherExamScores() {
  const { examId } = useParams<{ examId: string }>();
  const { currentUser } = useAuth();
  const { exams, submissions, correctScore } = useAssessment();
  const { students } = useStudents();

  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  const [resultModalSub, setResultModalSub] = useState<ExamSubmission | null>(null);
  const [correctModalSub, setCorrectModalSub] = useState<ExamSubmission | null>(null);
  const [correctForm, setCorrectForm] = useState({ score: '', reason: '' });

  const rawExam = examId ? exams.find((e) => e.id === examId) : undefined;

  // Phase 3C scope 이중 방어: TEACHER_PRIVATE면 반드시 본인 소유만.
  // [교사 화면 시험 구조 정리] 입학테스트/인증평가(관리자 전용)·수능실전모의고사(성적 입력
  // 자료)는 "내 시험지 관리" 목록에서 이미 제외되지만, URL 직접 접근을 막기 위해 여기서도
  // 카테고리를 다시 확인한다(이중 방어).
  const visibleExam = rawExam
    && (TEACHER_CREATABLE_EXAM_CATEGORY_IDS as readonly string[]).includes(rawExam.categoryId)
    && (rawExam.scope === 'TEACHER_PRIVATE' ? rawExam.ownerTeacherId === currentUser.id : true)
    ? rawExam : undefined;

  if (!visibleExam) return <NotFoundScreen />;

  const mySubmissions = submissions.filter((s) => s.examId === examId && myStudentIds.has(s.studentId));
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Phase 3D v3-r1: 결과 보기 모달의 담당 평균/최고점 비교용
  const gradedScores = mySubmissions.filter((s) => isGradedSubmission(s) && s.totalScore != null).map((s) => s.totalScore as number);
  const gradedAvg = gradedScores.length > 0 ? gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length : 0;
  const gradedMax = gradedScores.length > 0 ? Math.max(...gradedScores) : 0;

  // Phase 3D v3-r3: 문항별 정답률 — 담당 학생 채점완료 제출 기준. 자동채점 문항은
  // AnswerRecord.isCorrect로 바로 집계되고, 수동채점 문항은 문항 배점 만점 획득 여부로
  // 정답 처리한다(부분점수 문항은 "만점=정답"으로 간주하는 단순화된 근사치).
  const questionAccuracy = visibleExam.questions.map((q) => {
    const answered = mySubmissions
      .filter((s) => isGradedSubmission(s))
      .map((s) => s.answers.find((a) => a.questionId === q.id))
      .filter((a): a is NonNullable<typeof a> => !!a && a.score !== undefined);
    const correctCount = answered.filter((a) => (a.isCorrect ?? (a.score ?? 0) >= q.points)).length;
    const rate = answered.length > 0 ? Math.round((correctCount / answered.length) * 100) : null;
    return { no: q.no, points: q.points, rate, sampleSize: answered.length };
  }).filter((q) => q.rate !== null);

  const openCorrect = (sub: ExamSubmission) => {
    setCorrectForm({ score: String(sub.totalScore ?? ''), reason: '' });
    setCorrectModalSub(sub);
  };

  const handleCorrectSubmit = () => {
    if (!correctModalSub) return;
    const newScore = Number(correctForm.score);
    if (Number.isNaN(newScore) || newScore < 0 || newScore > visibleExam.totalScore) {
      return;
    }
    if (!correctForm.reason.trim()) return;
    correctScore(visibleExam.id, correctModalSub.studentId, undefined, newScore, correctForm.reason.trim(), currentUser.name);
    setCorrectModalSub(null);
  };

  return (
    <TeacherLayout title="내 시험지 관리">
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#040D1E' }}>
            <ChevronLeft size={14} /> 내 시험지 목록
          </div>
        </Link>

        <div className="axis-card p-4">
          <div className="font-semibold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>{visibleExam.title}</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {visibleExam.subject} · {visibleExam.examDate} · 만점 {visibleExam.totalScore}점 · 담당 학생 {mySubmissions.length}명
          </div>
        </div>

        {/* Phase 3D v3-r3: 문항별 정답률 — 문항별 채점 데이터가 있는 경우에만 표시 */}
        {questionAccuracy.length > 0 && (
          <div className="axis-card p-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.45 0.015 250)' }}>
              문항별 정답률 (담당 학생 기준)
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {questionAccuracy.map((q) => {
                const color = q.rate! >= 80 ? 'oklch(0.45 0.15 145)' : q.rate! >= 50 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
                return (
                  <div key={q.no} className="flex items-center gap-2">
                    <div className="text-xs w-10 flex-shrink-0 tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{q.no}번</div>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                      <div className="h-full rounded-full" style={{ width: `${q.rate}%`, background: color }} />
                    </div>
                    <div className="text-xs font-bold tabular-nums w-10 text-right flex-shrink-0" style={{ color }}>{q.rate}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mySubmissions.length === 0 ? (
          <div className="axis-card p-10 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
            담당 학생 응시 데이터가 없습니다.
          </div>
        ) : (
          <div className="axis-card overflow-hidden">
            <div className="axis-table-scroll" style={{ maxHeight: 560 }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'oklch(0.985 0.003 250)' }}>
                    {['학생명', '채점상태', '점수/만점', '응시/결시', '결과', '관리'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap"
                        style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mySubmissions.map((sub) => {
                    const student = studentMap.get(sub.studentId);
                    const badge = STATUS_BADGE[sub.status];
                    const isAbsent = sub.status === '결석';
                    const isGraded = isGradedSubmission(sub);
                    const isPending = isPendingGrading(sub);
                    return (
                      <tr key={sub.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {student?.name ?? '-'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.text }}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>
                          {isAbsent ? '-' : isGraded ? `${sub.totalScore ?? '-'} / ${visibleExam.totalScore}` : '미채점'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isAbsent ? (
                            <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'oklch(0.5 0.2 27)' }}>
                              <UserX size={11} /> 결시
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'oklch(0.5 0.15 160)' }}>응시</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {(isGraded || isAbsent) ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setResultModalSub(sub)} aria-label="결과 보기">
                              <Eye size={14} style={{ color: 'oklch(0.5 0.015 250)' }} />
                            </Button>
                          ) : (
                            <span className="text-xs" style={{ color: 'oklch(0.75 0.01 250)' }}>-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isPending && (
                            <Link href={`/teacher/exams/${visibleExam.id}/grading`}>
                              <Button size="sm" className="h-7 text-xs" style={{ background: '#040D1E' }}>채점하기</Button>
                            </Link>
                          )}
                          {isGraded && (
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openCorrect(sub)}>
                              <Pencil size={11} /> 정정
                            </Button>
                          )}
                          {isAbsent && <span className="text-xs" style={{ color: 'oklch(0.75 0.01 250)' }}>-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 결과 보기 모달 */}
      {resultModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setResultModalSub(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <h2 className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {studentMap.get(resultModalSub.studentId)?.name ?? '학생'} — 결과
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setResultModalSub(null)} className="h-8 w-8" aria-label="닫기">
                <X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} />
              </Button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {resultModalSub.status === '결석' ? (
                <p style={{ color: 'oklch(0.5 0.2 27)' }}>결석 처리된 응시 건입니다.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'oklch(0.5 0.015 250)' }}>점수</span>
                    <span className="font-bold tabular-nums" style={{ color: 'oklch(0.2 0.02 250)' }}>
                      {resultModalSub.totalScore ?? '-'} / {visibleExam.totalScore}
                    </span>
                  </div>
                  {/* Phase 3D v3-r1: 담당 학생 범위 기준 평균/최고점 비교 막대 */}
                  {gradedScores.length > 0 && resultModalSub.totalScore != null && (
                    <div className="space-y-1.5 pt-1">
                      {([
                        { label: '이 학생', value: resultModalSub.totalScore, color: '#040D1E' },
                        { label: '담당 평균', value: Math.round(gradedAvg), color: 'oklch(0.6 0.015 250)' },
                        { label: '담당 최고', value: gradedMax, color: 'oklch(0.45 0.15 145)' },
                      ]).map((row) => {
                        const pct = visibleExam.totalScore > 0 ? Math.min(100, Math.round((row.value / visibleExam.totalScore) * 100)) : 0;
                        return (
                          <div key={row.label} className="flex items-center gap-2">
                            <div className="text-xs w-16 flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{row.label}</div>
                            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.color }} />
                            </div>
                            <div className="text-xs font-bold tabular-nums w-10 text-right flex-shrink-0" style={{ color: row.color }}>{row.value}점</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {resultModalSub.teacherNote && (
                    <div className="rounded-lg p-3 text-xs" style={{ background: 'oklch(0.97 0.004 250)', color: 'oklch(0.4 0.015 250)' }}>
                      💬 {resultModalSub.teacherNote}
                    </div>
                  )}
                  {resultModalSub.corrections.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>정정 이력</div>
                      <div className="space-y-1">
                        {resultModalSub.corrections.map((c) => (
                          <div key={c.id} className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                            {c.correctedAt.slice(0, 10)} · {c.previousScore}→{c.newScore}점 · {c.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 정정 모달 */}
      {correctModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setCorrectModalSub(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <h2 className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {studentMap.get(correctModalSub.studentId)?.name ?? '학생'} — 점수 정정
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCorrectModalSub(null)} className="h-8 w-8" aria-label="닫기">
                <X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} />
              </Button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>
                  새 점수 (0~{visibleExam.totalScore})
                </label>
                <input
                  type="number" min={0} max={visibleExam.totalScore} value={correctForm.score}
                  onChange={(e) => setCorrectForm((f) => ({ ...f, score: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>정정 사유 *</label>
                <input
                  type="text" value={correctForm.reason}
                  onChange={(e) => setCorrectForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="예: 채점 오류 정정"
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <Button variant="outline" onClick={() => setCorrectModalSub(null)}>취소</Button>
              <Button onClick={handleCorrectSubmit} style={{ background: '#040D1E' }}>정정 저장</Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
