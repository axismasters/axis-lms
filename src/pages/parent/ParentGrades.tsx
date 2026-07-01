// AXIS LMS v1.2 - ParentGrades (Parent Portal Foundation v1 → Phase 3D v2: "테스트"로 동기화)
// 보호자 전용 자녀 테스트 결과 조회 — 읽기 전용.
// ✅ getPublishedResultsForStudent 정책: 반 단위=채점완료, 전체시험=공개 후
// ✅ IF는 별도 메뉴가 아니라 이 화면의 "테스트 성적표 상세" 안에서만, 읽기 전용으로 확인 가능
// 🚫 결석/미채점 결과 노출 금지
// 🚫 라이벌/엠블럼/경쟁 정보 없음(성장 흐름은 /parent/growth에서 확인)
// 🚫 학부모는 확인자 — IF 문항별 이유 선택/수정 불가(이미 학생이 선택한 결과만 조회)

import { useState } from 'react';
import { ClipboardList, ChevronDown, X, Lightbulb } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPublishedResultsForStudent, EXAM_CATEGORIES } from '@/lib/assessmentData';
import type { StudentExamResult } from '@/lib/assessmentData';
import { getIfRecordForExam } from '@/lib/ifAnalysisEngine';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

// 학부모용 읽기 전용 테스트 성적표 상세 — IF는 여기서만, 조회만 가능(선택/수정 불가)
function ParentResultDetailModal({
  result, studentId, onClose,
}: {
  result: StudentExamResult;
  studentId: string;
  onClose: () => void;
}) {
  const pct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const color = scoreColor(pct);
  const ifRecord = getIfRecordForExam(studentId, result.examId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="axis-card w-full max-w-sm flex flex-col" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid oklch(0.95 0.004 250)' }}>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'oklch(0.55 0.2 27)' }}>테스트 성적표</div>
            <h2 className="font-bold text-sm leading-snug" style={{ color: 'oklch(0.15 0.02 250)' }}>{result.title}</h2>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{result.examDate}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 flex-shrink-0" aria-label="닫기">
            <X size={18} style={{ color: 'oklch(0.55 0.015 250)' }} />
          </Button>
        </div>

        <div className="overflow-y-auto min-h-0 p-5 space-y-4">
          <div className="flex items-end gap-2">
            <div className="font-black text-3xl tabular-nums" style={{ color }}>{pct}%</div>
            <div className="text-sm mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
              {result.earnedScore} / {result.totalPoints}점
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
          {result.averageScore != null && result.totalPoints > 0 && (
            <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
              평균 {Math.round(result.averageScore / result.totalPoints * 100)}%
            </div>
          )}

          {/* IF 요약 — 조회 전용. 학생이 이미 선택한 결과만 보여주고, 여기서 선택/수정할 수 없다. */}
          <div className="rounded-xl p-4" style={{ background: 'oklch(0.97 0.004 247)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={13} style={{ color: '#081F4D' }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.015 250)' }}>IF 채점 요약</span>
            </div>
            {!ifRecord ? (
              <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                아직 학생이 오답 회고(IF 채점)를 완료하지 않았습니다.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2.5 text-center" style={{ background: 'white' }}>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>IF 점수</div>
                    <div className="font-black text-sm tabular-nums" style={{ color: '#081F4D' }}>{ifRecord.ifScore}점</div>
                  </div>
                  <div className="rounded-lg p-2.5 text-center" style={{ background: 'white' }}>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>놓친 점수</div>
                    <div className="font-black text-sm tabular-nums" style={{ color: 'oklch(0.55 0.2 27)' }}>{ifRecord.missedPoints}점</div>
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  {ifRecord.isComplete ? '오답 문항 전체에 회고를 완료했습니다.' : `${ifRecord.selections.length}/${ifRecord.totalWrongCount}문항 회고 완료(진행 중)`}
                </div>
                {ifRecord.selections.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ifRecord.selections.map((s) => (
                      <span key={s.questionId} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'white', color: 'oklch(0.4 0.015 250)' }}>
                        {s.no}번 · {s.reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentGrades() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();

  const myChildren = students.filter(s =>
    (currentUser.assignedStudentIds ?? []).includes(s.id)
  );
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id ?? '');
  const child = myChildren.find(s => s.id === selectedChildId);
  const [selectedResult, setSelectedResult] = useState<StudentExamResult | null>(null);

  // visibility 정책 적용 — 공개/반영 결과만
  const results = selectedChildId
    ? getPublishedResultsForStudent(exams, submissions, selectedChildId)
    : [];

  const avg = results.length > 0
    ? Math.round(
        results.reduce((sum, r) => sum + (r.totalPoints > 0 ? r.earnedScore / r.totalPoints : 0), 0)
        / results.length * 100
      )
    : null;
  const best = results.length > 0
    ? Math.max(...results.map(r => r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0))
    : null;

  return (
    <ParentLayout title="자녀 테스트">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        {myChildren.length > 1 && (
          <div className="axis-card p-4">
            <div className="text-xs mb-2 font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>자녀 선택</div>
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 appearance-none"
                style={{ border: '1px solid oklch(0.9 0.008 250)', background: 'white', color: 'oklch(0.2 0.02 250)' }}
              >
                {myChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'oklch(0.5 0.015 250)' }} />
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.45 0.15 160)', color: 'oklch(0.5 0.015 250)' }}>
          채점이 완료된 반 시험과 공개 처리된 시험 결과만 표시됩니다. 카드를 누르면 테스트 성적표 상세(IF 요약 포함)를 볼 수 있습니다.
        </div>

        {!child ? (
          <div className="axis-card p-10 text-center">
            <ClipboardList size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>연결된 자녀 정보가 없습니다.</div>
          </div>
        ) : results.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <ClipboardList size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>{child.name}</div>
            <div className="text-sm mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              표시할 테스트 데이터가 없습니다.
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
              채점이 완료되면 여기에 표시됩니다.
            </div>
          </div>
        ) : (
          <>
            {/* 자녀 표시 (단일 자녀) */}
            {myChildren.length === 1 && (
              <div className="axis-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'oklch(0.45 0.15 160)' }}>
                  {child.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{child.name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{child.status}</div>
                </div>
              </div>
            )}

            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '응시 시험', value: `${results.length}회`, color: 'oklch(0.45 0.15 160)' },
                { label: '평균',     value: avg !== null ? `${avg}%` : '-',   color: '#081F4D' },
                { label: '최고',     value: best !== null ? `${best}%` : '-', color: 'oklch(0.55 0.15 80)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 테스트 목록 — 카드를 누르면 상세(IF 요약 포함, 읽기 전용)가 열린다 */}
            <div className="grid gap-2 sm:grid-cols-2">
              {results.map(r => {
                const pct = r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0;
                const category = EXAM_CATEGORIES.find(c => c.id === r.categoryId);
                return (
                  <button
                    key={r.examId}
                    type="button"
                    onClick={() => setSelectedResult(r)}
                    className="axis-card axis-card-clickable p-4 w-full text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {r.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {r.examDate}
                          {category ? ` · ${category.label}` : ''}
                          {!r.classId && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-xs"
                              style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.4 0.15 250)' }}>
                              전체
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-bold tabular-nums text-sm" style={{ color: scoreColor(pct) }}>
                          {r.earnedScore}/{r.totalPoints}
                        </div>
                        <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'oklch(0.93 0.006 250)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: scoreColor(pct) }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

      </div>
      {selectedResult && (
        <ParentResultDetailModal
          result={selectedResult}
          studentId={selectedChildId}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </ParentLayout>
  );
}
