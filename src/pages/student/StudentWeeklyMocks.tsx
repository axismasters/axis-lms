// AXIS LMS v1.2 - StudentWeeklyMocks (Senior Weekly Mock Routine Foundation v1)
// ✅ Senior Mock Accumulation Bridge v1: 누적 요약 섹션 추가
// 학생 전용 고3 수능실전 주간 루틴 조회 — 읽기 전용.
// ✅ mock-suneung 카테고리 공개 결과만 표시 (주간 루틴 기준)
// ✅ getPublishedResultsForStudent() 공개 필터 경유 (미공개/미채점/결석 제외)
// ✅ 본인(assignedStudentIds[0]) 데이터만 조회
// ✅ 시험일 오름차순(회차순) 표시 + 전회 대비 점수 추이 표시
// 🚫 등급/백분위/표준점수/대학추천 미구현 (향후 단계)

import { Link } from 'wouter';
import { TrendingUp, TrendingDown, Minus, ChevronLeft } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
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
        <TrendingDown size={12} /> {delta}점
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
      <Minus size={12} /> 유지
    </span>
  );
}

export default function StudentWeeklyMocks() {
  const { currentUser } = useAuth();
  const { getPublishedResultsForStudent } = useAssessment();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';

  // 수능실전모의고사(mock-suneung)만 필터 — 공개 필터 Context 경유
  const allPublished = myStudentId ? getPublishedResultsForStudent(myStudentId) : [];
  const weeklyResults = allPublished
    .filter((r) => r.categoryId === 'mock-suneung')
    .slice() // 원본 배열 보존
    .sort((a, b) => a.examDate.localeCompare(b.examDate)); // 오름차순(회차순)

  // 추이 계산 — 이전 회차 대비 점수 변화
  const withTrend = weeklyResults.map((r, idx) => {
    if (idx === 0) return { ...r, trend: 'first' as TrendType, delta: 0 };
    const prev = weeklyResults[idx - 1];
    const delta = r.earnedScore - prev.earnedScore;
    const trend: TrendType = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
    return { ...r, trend, delta };
  });

  // 요약
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
    <StudentLayout title="수능실전 주간 루틴">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/student/mock-exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            모의고사 결과
          </div>
        </Link>

        {/* 안내 */}
        <div
          className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}
        >
          수능실전모의고사(mock-suneung) 공개 결과를 회차 순으로 표시합니다. 미공개/채점 중인 결과는 표시되지 않습니다.
        </div>

        {weeklyResults.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <TrendingUp size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              표시할 수능실전모의 결과가 없습니다.
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
              결과가 공개되면 여기에 표시됩니다.
            </div>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '누적 회차', value: `${weeklyResults.length}회`,               color: 'oklch(0.511 0.262 276.966)' },
                { label: '최근 점수', value: latestPct !== null ? `${latestPct}%` : '-', color: scoreColor(latestPct ?? 0) },
                { label: '최고 점수', value: best !== null ? `${best}%` : '-',           color: 'oklch(0.45 0.15 160)' },
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
                  <div className="font-bold text-sm tabular-nums mt-0.5" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                    {summary.avgPct !== null ? `${summary.avgPct}%` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>최근 3회 평균</div>
                  <div className="font-bold text-sm tabular-nums mt-0.5" style={{ color: 'oklch(0.45 0.15 160)' }}>
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

            {/* 회차 목록 — 오름차순(오래된 것 → 최신 순) */}
            <div className="space-y-2">
              {withTrend.map((r, idx) => {
                const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                return (
                  <div key={r.examId} className="axis-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* 회차 번호 + 시험명 */}
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'oklch(0.511 0.262 276.966)', color: 'white' }}
                          >
                            {idx + 1}회
                          </span>
                          <div className="font-semibold text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>
                            {r.title}
                          </div>
                        </div>
                        {/* 날짜 + 추이 */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{r.examDate}</span>
                          <TrendBadge trend={r.trend} delta={Math.abs(r.delta)} />
                        </div>
                      </div>
                      {/* 점수 */}
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-bold tabular-nums text-sm" style={{ color: scoreColor(pct) }}>
                          {r.earnedScore}/{r.totalPoints}
                        </div>
                        <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                      </div>
                    </div>
                    {/* 달성률 바 */}
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
    </StudentLayout>
  );
}
