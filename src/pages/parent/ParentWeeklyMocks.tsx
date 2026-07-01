// AXIS LMS v1.2 - ParentWeeklyMocks (Senior Weekly Mock Routine Foundation v1)
// ✅ Senior Mock Accumulation Bridge v1: 누적 요약 섹션 추가
// 보호자 전용 자녀 수능실전모의고사 회차별 결과 조회 — 읽기 전용.
// ⚠ "수능실전주간루틴"은 개발 설명용 내부 개념일 뿐, 화면에 노출되는 이름이 아니다.
//   고3 주간 반복 운영은 별도 시험 종류가 아니라 수능실전모의고사 성적 입력 → 내부 분석 →
//   대학추천/보완 과목/브리핑 반영으로 이어지는 처리 흐름이며, 화면 타이틀은 항상
//   "수능실전모의고사 결과"로 표시한다(라우트 경로 /parent/weekly-mocks는 내부 경로명일
//   뿐 사용자에게 노출되지 않으므로 유지).
// ✅ mock-suneung 카테고리 공개 결과만 표시 (회차순 누적)
// ✅ getPublishedResultsForStudent() 공개 필터 경유 (미공개/미채점/결석 제외)
// ✅ 연결된 자녀(assignedStudentIds) 조회 — 다자녀 선택 지원
// ✅ 시험일 오름차순(회차순) + 전회 대비 추이 표시
// 🚫 등급/백분위/표준점수/대학추천 미구현 (향후 단계)

import { useState } from 'react';
import { Link } from 'wouter';
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronDown } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getMockAccumulationSummary } from '@/lib/assessmentData';

function scoreColor(pct: number): string {
  return pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

type TrendType = 'up' | 'down' | 'same' | 'first';

function TrendBadge({ trend, delta }: { trend: TrendType; delta: number }) {
  if (trend === 'first') {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.55 0.015 250)' }}>
        첫 회차
      </span>
    );
  }
  if (trend === 'up') {
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'oklch(0.45 0.15 160)' }}>
        <TrendingUp size={12} /> +{delta}점
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'oklch(0.55 0.2 27)' }}>
        <TrendingDown size={12} /> -{delta}점
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
      <Minus size={12} /> 유지
    </span>
  );
}

export default function ParentWeeklyMocks() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { getPublishedResultsForStudent } = useAssessment();

  const myChildren = students.filter((s) =>
    (currentUser.assignedStudentIds ?? []).includes(s.id)
  );
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id ?? '');
  const child = myChildren.find((s) => s.id === selectedChildId);

  // 수능실전모의고사(mock-suneung)만 필터 — 공개 필터 Context 경유
  const allPublished = selectedChildId ? getPublishedResultsForStudent(selectedChildId) : [];
  const weeklyResults = allPublished
    .filter((r) => r.categoryId === 'mock-suneung')
    .slice()
    .sort((a, b) => a.examDate.localeCompare(b.examDate)); // 오름차순(회차순)

  // 추이 계산
  const withTrend = weeklyResults.map((r, idx) => {
    if (idx === 0) return { ...r, trend: 'first' as TrendType, delta: 0 };
    const prev = weeklyResults[idx - 1];
    const delta = r.earnedScore - prev.earnedScore;
    const trend: TrendType = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
    return { ...r, trend, delta };
  });

  const best = weeklyResults.length > 0
    ? Math.max(...weeklyResults.map((r) => r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0))
    : null;
  const latest = weeklyResults.length > 0 ? weeklyResults[weeklyResults.length - 1] : null;
  const latestPct = latest && latest.totalPoints > 0
    ? Math.round((latest.earnedScore / latest.totalPoints) * 100)
    : null;

  // 누적 요약 헬퍼 — Senior Mock Accumulation Bridge v1
  const summary = getMockAccumulationSummary(weeklyResults);

  return (
    <ParentLayout title="자녀 수능실전모의고사 결과">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/parent/mock-exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'oklch(0.45 0.15 160)' }}>
            <ChevronLeft size={14} />
            모의고사 결과
          </div>
        </Link>

        {/* 자녀 선택 (복수 자녀) */}
        {myChildren.length > 1 && (
          <div className="axis-card p-4">
            <div className="text-xs mb-2 font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>자녀 선택</div>
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 appearance-none"
                style={{ border: '1px solid oklch(0.9 0.008 250)', background: 'white', color: 'oklch(0.2 0.02 250)' }}
              >
                {myChildren.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'oklch(0.5 0.015 250)' }} />
            </div>
          </div>
        )}

        {/* 안내 */}
        <div
          className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.45 0.15 160)', color: 'oklch(0.5 0.015 250)' }}
        >
          수능실전모의고사 공개 결과를 회차 순으로 표시합니다. 미공개/채점 중인 결과는 표시되지 않습니다.
        </div>

        {!child ? (
          <div className="axis-card p-10 text-center">
            <TrendingUp size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>연결된 자녀 정보가 없습니다.</div>
          </div>
        ) : weeklyResults.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <TrendingUp size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>{child.name}</div>
            <div className="text-sm mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              표시할 수능실전모의 결과가 없습니다.
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
              결과가 공개되면 여기에 표시됩니다.
            </div>
          </div>
        ) : (
          <>
            {/* 단일 자녀 표시 */}
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

            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '누적 회차', value: `${weeklyResults.length}회`,               color: 'oklch(0.45 0.15 160)' },
                { label: '최근 점수', value: latestPct !== null ? `${latestPct}%` : '-', color: scoreColor(latestPct ?? 0) },
                { label: '최고 점수', value: best !== null ? `${best}%` : '-',           color: '#040D1E' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>


            {/* 누적 요약 — Senior Mock Accumulation Bridge v1 */}
            <div className="axis-card p-4">
              <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.45 0.015 250)' }}>
                누적 요약
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>평균 점수</div>
                  <div className="font-bold text-sm tabular-nums mt-0.5" style={{ color: 'oklch(0.45 0.15 160)' }}>
                    {summary.avgPct !== null ? `${summary.avgPct}%` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>최근 3회 평균</div>
                  <div className="font-bold text-sm tabular-nums mt-0.5" style={{ color: '#040D1E' }}>
                    {summary.last3AvgPct !== null ? `${summary.last3AvgPct}%` : '-'}
                  </div>
                </div>
              </div>
              {weeklyResults.length >= 2 && summary.firstToLastDelta !== null && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
                  <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>첫 회차 대비</div>
                  <div className="flex items-center gap-1">
                    {summary.firstToLastDelta > 0 ? (
                      <>
                        <TrendingUp size={14} style={{ color: 'oklch(0.45 0.15 160)' }} />
                        <span className="font-bold text-sm" style={{ color: 'oklch(0.45 0.15 160)' }}>
                          +{summary.firstToLastDelta}점 향상
                        </span>
                      </>
                    ) : summary.firstToLastDelta < 0 ? (
                      <>
                        <TrendingDown size={14} style={{ color: 'oklch(0.55 0.2 27)' }} />
                        <span className="font-bold text-sm" style={{ color: 'oklch(0.55 0.2 27)' }}>
                          {summary.firstToLastDelta}점
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus size={14} style={{ color: 'oklch(0.6 0.015 250)' }} />
                        <span className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>변화 없음</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 회차 목록 */}
            <div className="space-y-2">
              {withTrend.map((r, idx) => {
                const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                return (
                  <div key={r.examId} className="axis-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'oklch(0.45 0.15 160)', color: 'white' }}
                          >
                            {idx + 1}회
                          </span>
                          <div className="font-semibold text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>
                            {r.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{r.examDate}</span>
                          <TrendBadge trend={r.trend} delta={Math.abs(r.delta)} />
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-bold tabular-nums text-sm" style={{ color: scoreColor(pct) }}>
                          {r.earnedScore}/{r.totalPoints}
                        </div>
                        <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreColor(pct) }} />
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
