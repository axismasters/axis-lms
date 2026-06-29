// AXIS LMS v1.2 - ParentGrades (Parent Portal Foundation v1)
// 보호자 전용 자녀 성적 조회 — 읽기 전용.
// ✅ getPublishedResultsForStudent 정책: 반 단위=채점완료, 전체시험=공개 후
// 🚫 결석/미채점 결과 노출 금지
// 🚫 라이벌/엠블럼/경쟁 정보 없음

import { useState } from 'react';
import { BarChart2, ChevronDown } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPublishedResultsForStudent, EXAM_CATEGORIES } from '@/lib/assessmentData';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
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
    <ParentLayout title="자녀 성적">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

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
          채점이 완료된 반 시험과 공개 처리된 시험 결과만 표시됩니다.
        </div>

        {!child ? (
          <div className="axis-card p-10 text-center">
            <BarChart2 size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>연결된 자녀 정보가 없습니다.</div>
          </div>
        ) : results.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <BarChart2 size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>{child.name}</div>
            <div className="text-sm mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              표시할 성적 데이터가 없습니다.
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
                { label: '평균',     value: avg !== null ? `${avg}%` : '-',   color: 'oklch(0.511 0.262 276.966)' },
                { label: '최고',     value: best !== null ? `${best}%` : '-', color: 'oklch(0.55 0.15 80)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 성적 목록 */}
            <div className="space-y-2">
              {results.map(r => {
                const pct = r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0;
                const category = EXAM_CATEGORIES.find(c => c.id === r.categoryId);
                return (
                  <div key={r.examId} className="axis-card p-4">
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
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </ParentLayout>
  );
}
