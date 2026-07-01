// AXIS LMS v1.2 — Phase 3A-1: StudentGrades (테스트 화면)
// 단원평가 + 내신대비 모의고사 중심 테스트 결과 조회
//
// Phase 3A-1 변경:
//   ✅ 화면명 "성적" → "테스트"
//   ✅ 탭: 단원평가 + 내신대비 모의고사 (2탭)
//   ✅ 점수 추이 그래프 + 내 점수 vs 평균 막대 추가
//   ✅ 최근 3회 평균 / 최고 기록 / 이전 대비 변화 표시
//   ✅ 성적표 상세 + IF 채점 유지
//   ✅ 학생 직접 입력 버튼 제거 (선생님이 입력)
//   ✅ 실제내신/전국연합/수능실전 → 대학추천 화면으로 이동
//
// ⚠ 금지:
//   - 합격률 / 합격 가능성 / 합격 보장 / 불합격 표현 금지
//   - 학생 화면 수납/재무 노출 금지
//   - 학생 성적 직접 입력 금지 (선생님이 입력)

import { useState, useEffect, useMemo } from 'react';
import { X, ClipboardList, Lightbulb, BarChart2, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { getPublishedResultsForStudent, categoryLabel, studentFacingScopeLabel } from '@/lib/assessmentData';
import {
  STUDENT_HIDDEN_CATEGORY_IDS,
  getSchoolGradeColor,
} from '@/lib/phase2dData';
import type { StudentExamResult, ExamSubmission } from '@/lib/assessmentData';
// [Phase 3D v3-r9-r1] IF 계산/저장/성장연동을 ifAnalysisEngine.ts 하나로 경유한다.
// studentIfAnalysis.ts/studentIfRecord.ts를 이 화면에서 직접 import하지 않는다.
import {
  IF_REASONS, calcIfAnalysis, getIfMotivationComment,
  saveIfRecord, getIfRecordForExam, markIfRecordGrowthLinked, loadIfRecords,
  getIfCumulativeSummary, runIfAnalysisEngine, buildGrowthEvent,
} from '@/lib/ifAnalysisEngine';
import type { IfReason, IfQuestionEntry } from '@/lib/ifAnalysisEngine';
import { Button } from '@/components/ui/button';

// ─── 성적 색상 ────────────────────────────────────────────────────────
function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 145)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

// ─── 탭 정의 (2탭) ────────────────────────────────────────────────────
interface TestTab {
  id: string;
  label: string;
  categoryIds: string[];
  color: string;
  accentBg: string;
  description: string;
}

const TEST_TABS: TestTab[] = [
  {
    id: 'unit-eval',
    label: '단원평가',
    categoryIds: ['unit-eval', 'certification'],
    color: '#040D1E',
    accentBg: 'oklch(0.95 0.06 260)',
    description: '단원별 평가 결과 — 단원평가 + 인증평가',
  },
  {
    id: 'mock-school',
    label: '내신대비',
    categoryIds: ['mock-school'],
    color: 'oklch(0.45 0.15 160)',
    accentBg: 'oklch(0.94 0.06 145)',
    description: '내신 대비 모의고사 결과',
  },
];

// ─── 인라인 SVG 추이 그래프 ─────────────────────────────────────────
function TrendChart({ results }: { results: StudentExamResult[] }) {
  if (results.length < 2) return null;
  const last5 = results.slice(-5);
  const pcts = last5.map(r => r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0);
  const W = 220, H = 80, pad = 16;
  const minPct = Math.max(0, Math.min(...pcts) - 10);
  const maxPct = Math.min(100, Math.max(...pcts) + 10);
  const range = maxPct - minPct || 10;
  const xs = pcts.map((_, i) => pad + (i / (pcts.length - 1)) * (W - 2 * pad));
  const ys = pcts.map(p => H - pad - ((p - minPct) / range) * (H - 2 * pad));
  const trend = pcts[pcts.length - 1] - pcts[0];

  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const areaPoints = `${xs[0]},${H - pad} ${points} ${xs[xs.length - 1]},${H - pad}`;

  const color = trend > 0 ? 'oklch(0.45 0.15 145)' : trend < 0 ? 'oklch(0.55 0.2 27)' : '#040D1E';

  return (
    <div className="axis-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} style={{ color: '#040D1E' }} />
          <span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 250)' }}>점수 추이</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color }}>
          {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
          {trend > 0 ? `+${trend}%p` : trend < 0 ? `${trend}%p` : '동일'}
        </div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polygon points={areaPoints} fill={color} fillOpacity="0.1" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r={4} fill="white" stroke={color} strokeWidth="1.5" />
            <text x={x} y={H - 1} fontSize={9} textAnchor="middle" fill="oklch(0.65 0.015 250)">
              {last5[i].examDate.slice(5)}
            </text>
            <text x={x} y={ys[i] - 7} fontSize={9} textAnchor="middle" fontWeight="700" fill={color}>
              {pcts[i]}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Phase 3D v3-r6: 학생 성적 추이 선그래프(신규) ──────────────────────
// 기존 TrendChart(탭 내부, 최근 5회, 인증평가와 혼합)는 삭제하지 않고 그대로 둔다.
// 이 컴포넌트는 "단원평가"(인증평가 제외 순수)와 "내신 대비 모의고사"를 각각 독립된
// 선그래프로 분리해서 보여주기 위한 신규 섹션 전용이며, 전체 응시 이력을 시험일 오름차순
// 그대로 표시한다(최근 5회로 자르지 않음). 각 점에는 시험일/시험명/백분율이 항상 텍스트로도
// 확인 가능하도록 SVG 라벨 + 하단 목록을 함께 제공한다. 데이터가 없으면 빈 상태 안내를 표시한다.
function ExamLineTrendChart({ title, results, color }: { title: string; results: StudentExamResult[]; color: string }) {
  const sorted = [...results].sort((a, b) => a.examDate.localeCompare(b.examDate));
  const pcts = sorted.map(r => r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0);

  const H = 100, padTop = 22, padBottom = 28, padX = 20;
  const POINT_GAP = 56; // 점 사이 최소 간격(px) — 회차가 많아지면 가로 스크롤로 대응
  const W = Math.max(240, padX * 2 + Math.max(1, sorted.length - 1) * POINT_GAP);

  const minPct = sorted.length > 0 ? Math.max(0, Math.min(...pcts) - 10) : 0;
  const maxPct = sorted.length > 0 ? Math.min(100, Math.max(...pcts) + 10) : 100;
  const range = maxPct - minPct || 10;
  const xs = sorted.length > 1
    ? pcts.map((_, i) => padX + (i / (pcts.length - 1)) * (W - 2 * padX))
    : [W / 2];
  const ys = pcts.map(p => H - padBottom - ((p - minPct) / range) * (H - padTop - padBottom));

  return (
    <div className="axis-card p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp size={13} style={{ color }} />
        <span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 250)' }}>{title} 결과 추이</span>
        {sorted.length > 0 && (
          <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>· 총 {sorted.length}회</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>표시할 {title} 결과가 없습니다.</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>{title} 결과가 공개되면 추이 그래프가 표시됩니다.</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W }}>
              {sorted.length >= 2 && (
                <>
                  <polygon
                    points={`${xs[0]},${H - padBottom} ${xs.map((x, i) => `${x},${ys[i]}`).join(' ')} ${xs[xs.length - 1]},${H - padBottom}`}
                    fill={color} fillOpacity="0.08"
                  />
                  <polyline
                    points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')}
                    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </>
              )}
              {xs.map((x, i) => (
                <g key={sorted[i].examId}>
                  <circle cx={x} cy={ys[i]} r={4} fill="white" stroke={color} strokeWidth="1.5" />
                  {/* 네이티브 SVG 툴팁 — 마우스오버 시 시험일/시험명/점수 확인 가능 */}
                  <title>{`${sorted[i].examDate} · ${sorted[i].title} · ${pcts[i]}%`}</title>
                  <text x={x} y={H - padBottom + 14} fontSize={9} textAnchor="middle" fill="oklch(0.65 0.015 250)">
                    {sorted[i].examDate.slice(5)}
                  </text>
                  <text x={x} y={ys[i] - 8} fontSize={9} textAnchor="middle" fontWeight="700" fill={color}>
                    {pcts[i]}%
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* 시험명 목록 — 그래프 위 라벨만으로는 좁아서 못 보이는 시험명을 텍스트로도 확인 가능하게 */}
          <ul className="mt-2 space-y-0.5">
            {sorted.map((r, i) => (
              <li key={r.examId} className="flex items-center justify-between text-xs gap-2">
                <span className="truncate" style={{ color: 'oklch(0.45 0.015 250)' }}>{r.examDate} · {r.title}</span>
                <span className="font-semibold tabular-nums flex-shrink-0" style={{ color }}>{pcts[i]}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ─── 내 점수 vs 평균 막대 그래프 ────────────────────────────────────
function ScoreVsAvgBar({ result }: { result: StudentExamResult }) {
  const myPct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const avgPct = result.averageScore != null && result.totalPoints > 0
    ? Math.round(result.averageScore / result.totalPoints * 100) : null;
  const maxPct = result.highestScore != null && result.totalPoints > 0
    ? Math.round(result.highestScore / result.totalPoints * 100) : null;
  if (avgPct === null) return null;
  const diff = myPct - avgPct;
  const myColor = scoreColor(myPct);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'oklch(0.55 0.015 250)' }}>내 점수</div>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <div className="h-full rounded-full" style={{ width: `${myPct}%`, background: myColor }} />
        </div>
        <div className="text-xs font-bold w-8 text-right tabular-nums flex-shrink-0" style={{ color: myColor }}>{myPct}%</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'oklch(0.55 0.015 250)' }}>평균</div>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: 'oklch(0.7 0.01 250)' }} />
        </div>
        <div className="text-xs font-bold w-8 text-right tabular-nums flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{avgPct}%</div>
      </div>
      {maxPct !== null && (
        <div className="flex items-center gap-2">
          <div className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'oklch(0.55 0.015 250)' }}>최고점</div>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
            <div className="h-full rounded-full" style={{ width: `${maxPct}%`, background: 'oklch(0.45 0.15 145)' }} />
          </div>
          <div className="text-xs font-bold w-8 text-right tabular-nums flex-shrink-0" style={{ color: 'oklch(0.45 0.15 145)' }}>{maxPct}%</div>
        </div>
      )}
      {diff !== 0 && (
        <div className="text-xs text-center" style={{ color: diff > 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
          평균 대비 {diff > 0 ? `+${diff}%p` : `${diff}%p`}
        </div>
      )}
    </div>
  );
}

// ─── Phase 3B: 시험지 상세 누적 성장 그래프 ─────────────────────────
// 별도 메뉴 없음 — "테스트" 성적표 상세(ResultDetailModal) 안에서만 노출된다.
// 표시 위치: "성적 요약" 아래, IF 채점 블록 위.
//
// 6개 그래프:
//   1. 최근 테스트 점수 추이(최근 5회)
//   2. 시험군 내 하위 카테고리별 누적 성취도
//   3. IF 점수 추이
//   4. 놓친 점수 누적
//   5. 계산 실수/개념 부족/시간 부족 비율
//   6. 같은 시험군 내 성장 변화(첫 기록 대비)
//
// 데이터 구조는 Rival 비교/Emblem·SP 지급 트리거가 그대로 재사용할 수 있도록
// studentIfRecord.ts의 저장 레코드 + StudentExamResult만 사용하고, 이 컴포넌트
// 안에서만 쓰는 파생값은 별도 export하지 않는다(필요해지면 lib으로 승격).
function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const W = 200, H = 56, pad = 6;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 10;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (W - 2 * pad));
  const ys = points.map(p => H - pad - ((p - min) / range) * (H - 2 * pad));
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W }}>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3.5 : 2.5} fill={color} />)}
    </svg>
  );
}

function CumulativeGrowthSection({
  currentResult, sameCategoryResults, studentId,
}: {
  currentResult: StudentExamResult;
  sameCategoryResults: StudentExamResult[]; // 날짜 오름차순, currentResult 포함
  studentId: string;
}) {
  const [open, setOpen] = useState(false);

  const upToNow = useMemo(
    () => sameCategoryResults.filter(r => r.examDate <= currentResult.examDate),
    [sameCategoryResults, currentResult.examDate]
  );

  // 1. 최근 테스트 점수 추이(최근 5회, 현재 시험까지)
  const recent5 = upToNow.slice(-5);
  const recent5Pcts = recent5.map(r => r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0);

  // 2. 시험군 내 하위 카테고리(단원)별 누적 평균
  const byCategory = useMemo(() => {
    const map = new Map<string, number[]>();
    upToNow.forEach(r => {
      const p = r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0;
      map.set(r.categoryId, [...(map.get(r.categoryId) ?? []), p]);
    });
    return Array.from(map.entries()).map(([categoryId, pcts]) => ({
      categoryId,
      avg: Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length),
      count: pcts.length,
    }));
  }, [upToNow]);

  // 3~5. IF 저장 데이터 기반 — 이 시험군에 속한 시험들의 저장된 IF 레코드만 사용
  const ifRecords = useMemo(() => {
    const examIds = new Set(upToNow.map(r => r.examId));
    return loadIfRecords(studentId).filter(r => examIds.has(r.examId) && r.isComplete)
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [studentId, upToNow]);

  const ifScorePcts = ifRecords.map(r => r.totalPoints > 0 ? Math.round(r.ifScore / r.totalPoints * 100) : 0);
  const cumulativeMissed = ifRecords.reduce((acc: number[], r) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + r.missedPoints);
    return acc;
  }, []);
  const reasonSummaryRaw = getIfCumulativeSummary(ifRecords);
  const reasonSummary = {
    total: reasonSummaryRaw.reasonRatios.reduce((s, r) => s + r.count, 0),
    ratios: reasonSummaryRaw.reasonRatios,
  };

  // 6. 같은 시험군 내 성장 변화 — 첫 기록 대비 현재
  const firstPct = upToNow.length > 0
    ? (upToNow[0].totalPoints > 0 ? Math.round(upToNow[0].earnedScore / upToNow[0].totalPoints * 100) : 0)
    : null;
  const currentPct = currentResult.totalPoints > 0 ? Math.round(currentResult.earnedScore / currentResult.totalPoints * 100) : 0;
  const growthChange = firstPct !== null ? currentPct - firstPct : null;

  const hasAnyData = upToNow.length >= 2 || ifRecords.length > 0;
  if (!hasAnyData) return null;

  return (
    <div className="mx-5 mb-5 rounded-xl overflow-hidden border" style={{ borderColor: 'oklch(0.88 0.06 200)' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: open ? 'oklch(0.94 0.05 200)' : 'oklch(0.97 0.02 200)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: 'oklch(0.5 0.14 200)' }} />
          <span className="text-sm font-bold" style={{ color: 'oklch(0.25 0.02 250)' }}>누적 성장 그래프</span>
          <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>이 시험까지의 변화</span>
        </div>
        <span className="text-xs font-medium" style={{ color: 'oklch(0.5 0.14 200)' }}>{open ? '닫기' : '보기'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-white">
          {/* 1. 최근 점수 추이 */}
          {recent5Pcts.length >= 2 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
                최근 테스트 점수 추이 (최근 {recent5Pcts.length}회)
              </div>
              <MiniSparkline points={recent5Pcts} color="#040D1E" />
            </div>
          )}

          {/* 2. 시험군 내 카테고리별 누적 성취도 */}
          {byCategory.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
                시험군 내 누적 성취도
              </div>
              <div className="space-y-1.5">
                {byCategory.map(({ categoryId, avg, count }) => (
                  <div key={categoryId} className="flex items-center gap-2">
                    <div className="text-xs w-20 flex-shrink-0 truncate" style={{ color: 'oklch(0.5 0.015 250)' }}>
                      {categoryLabel(categoryId)}
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                      <div className="h-full rounded-full" style={{ width: `${avg}%`, background: scoreColor(avg) }} />
                    </div>
                    <div className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: scoreColor(avg), width: 40 }}>
                      {avg}%
                    </div>
                    <div className="text-xs flex-shrink-0" style={{ color: 'oklch(0.65 0.015 250)' }}>({count}회)</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. IF 점수 추이 */}
          {ifScorePcts.length >= 2 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
                IF 점수 추이 (놓친 이유를 다 잡았다면?)
              </div>
              <MiniSparkline points={ifScorePcts} color="#C8A15A" />
            </div>
          )}

          {/* 4. 놓친 점수 누적 */}
          {cumulativeMissed.length > 0 && (
            <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'oklch(0.97 0.004 247)' }}>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                누적 놓친 점수 ({ifRecords.length}회 분석 기준)
              </div>
              <div className="font-black text-base tabular-nums" style={{ color: 'oklch(0.55 0.2 27)' }}>
                {cumulativeMissed[cumulativeMissed.length - 1]}점
              </div>
            </div>
          )}

          {/* 5. IF 사유 비율 */}
          {reasonSummary.total > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
                놓친 이유 비율
              </div>
              <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                {reasonSummary.ratios.map(({ reason, pct }) => pct > 0 && (
                  <div key={reason} style={{
                    width: `${pct}%`,
                    background: reason === '계산 실수' ? 'oklch(0.55 0.2 27)' : reason === '개념 부족' ? '#040D1E' : 'oklch(0.55 0.15 80)',
                  }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5 mt-1.5">
                {reasonSummary.ratios.map(({ reason, pct, count }) => (
                  <div key={reason} className="flex items-center gap-1 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                    <span className="inline-block w-2 h-2 rounded-full" style={{
                      background: reason === '계산 실수' ? 'oklch(0.55 0.2 27)' : reason === '개념 부족' ? '#040D1E' : 'oklch(0.55 0.15 80)',
                    }} />
                    {reason} {pct}%({count})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. 같은 시험군 내 성장 변화 */}
          {growthChange !== null && upToNow.length >= 2 && (
            <div className="rounded-lg px-3 py-2.5 text-xs flex items-center gap-2" style={{ background: 'oklch(0.95 0.05 200)', color: 'oklch(0.3 0.1 200)' }}>
              {growthChange > 0 ? <TrendingUp size={14} /> : growthChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
              같은 시험군 첫 기록({firstPct}%) 대비 {growthChange > 0 ? `+${growthChange}%p 상승` : growthChange < 0 ? `${growthChange}%p 하락` : '변화 없음'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// [Phase 3D v3-r9-r1] 이전에는 studentId 전체 기준 집계용과 다르다는 이유로 이 화면
// 안에 getIfCumulativeSummaryLocal이라는 중복 함수가 있었다 — 실제로는
// ifAnalysisEngine.getIfCumulativeSummary도 동일하게 "이미 필터링된 records 배열"을
// 받는 시그니처였다(studentId를 받지 않음). 판단/계산 로직을 컴포넌트 밖에 두는
// 원칙에 따라 중복 함수를 제거하고 엔진 함수를 그대로 쓰도록 정리했다.

// ─── 성적표 상세 모달 (IF 채점 포함) ────────────────────────────────
export function ResultDetailModal({
  result, sameCategoryResults, studentId, onClose,
}: {
  result: StudentExamResult;
  sameCategoryResults: StudentExamResult[]; // 같은 시험군(탭) 결과, 날짜 오름차순
  studentId: string;
  onClose: () => void;
}) {
  const { onIfAnalysisResult, addStudentSP } = useGrowth();
  const pct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const avgPct = result.averageScore != null && result.totalPoints > 0
    ? Math.round(result.averageScore / result.totalPoints * 100) : null;
  const color = scoreColor(pct);
  const maxRecoverable = result.totalPoints - result.earnedScore;
  const pointStep = result.totalPoints >= 100 ? 5 : 2;
  const recoveryOptions = Array.from(
    { length: Math.floor(maxRecoverable / pointStep) + 1 },
    (_, i) => i * pointStep
  ).slice(0, 9);

  const [ifOpen, setIfOpen] = useState(false);
  const hasQuestionLevelData = result.wrongQuestions.length > 0;

  // 문항별 quick-tap 방식(오답 문항이 있는 시험) — 문항ID → 선택된 이유
  // Phase 3B: localStorage에 저장된 이전 선택을 불러와 이어보기를 지원한다.
  const [questionReasons, setQuestionReasons] = useState<Record<string, IfReason | null>>(() => {
    if (!hasQuestionLevelData) return {};
    const saved = getIfRecordForExam(studentId, result.examId);
    if (!saved) return {};
    const map: Record<string, IfReason | null> = {};
    saved.selections.forEach(s => { map[s.questionId] = s.reason; });
    return map;
  });

  const questionEntries: IfQuestionEntry[] = result.wrongQuestions.map(wq => ({
    questionId: wq.questionId, no: wq.no, points: wq.points,
    reason: questionReasons[wq.questionId] ?? null,
  }));
  // [Phase 3D v3-r9-r1] calcIfAnalysisFromQuestions() 직접 호출 대신
  // ifAnalysisEngine.runIfAnalysisEngine()을 사용한다 — 결과/동기부여 문장/보완
  // 포인트를 한 번에 받는다(계약 그대로).
  const ifEngineOutput = hasQuestionLevelData
    ? runIfAnalysisEngine({
        examId: result.examId, examTitle: result.title,
        actualScore: result.earnedScore, totalPoints: result.totalPoints,
        questions: questionEntries,
      })
    : null;
  const ifQuestionResult = ifEngineOutput?.result ?? null;

  // Phase 3B: 탭할 때마다 저장 + 오답 전체에 이유가 채워지면 1회만 Growth(Emblem/SP) 훅 연결.
  useEffect(() => {
    if (!hasQuestionLevelData) return;
    const selections = questionEntries
      .filter((q): q is IfQuestionEntry & { reason: IfReason } => q.reason !== null)
      .map(q => ({ questionId: q.questionId, no: q.no, points: q.points, reason: q.reason }));
    if (selections.length === 0) return; // 아직 하나도 안 골랐으면 저장할 것도 없음

    const record = saveIfRecord({
      studentId, examId: result.examId, examTitle: result.title, examDate: result.examDate,
      categoryId: result.categoryId, actualScore: result.earnedScore, totalPoints: result.totalPoints,
      totalWrongCount: result.wrongQuestions.length, selections,
    });

    if (record.isComplete && !record.growthLinked) {
      // [Phase 3D v3-r9-r1] toGrowthIfFlags() 직접 호출 대신 ifAnalysisEngine.buildGrowthEvent()를 사용한다.
      onIfAnalysisResult(buildGrowthEvent(studentId, result.examId, record));
      addStudentSP(studentId, 5, 'IF 분석 완료 — 오답 회고', 'ASSESSMENT', result.examId, 'SYSTEM');
      markIfRecordGrowthLinked(studentId, result.examId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionReasons]);

  // Fallback: 문항별 채점 데이터가 없는 legacy 시험은 기존 시험 전체 단위 방식을 그대로 사용한다.
  const [ifReason, setIfReason] = useState<IfReason>(IF_REASONS[0]);
  const [ifPoints, setIfPoints] = useState(0);
  const ifResult = !hasQuestionLevelData && ifPoints > 0
    ? calcIfAnalysis({ examId: result.examId, examTitle: result.title, actualScore: result.earnedScore, totalPoints: result.totalPoints, recoveredPoints: ifPoints, reason: ifReason })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="axis-card w-full max-w-sm flex flex-col" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
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

        <div className="overflow-y-auto min-h-0">
        {/* 점수 */}
        <div className="px-5 pb-3 pt-3">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black tabular-nums" style={{ color }}>{result.earnedScore}</span>
            <span className="text-lg font-semibold mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>/ {result.totalPoints}</span>
            <span className="text-sm font-bold mb-1.5" style={{ color }}>({pct}%)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-2 px-5 pb-3">
          {[
            { label: '내 점수', value: `${result.earnedScore}/${result.totalPoints}`, highlight: true },
            ...(avgPct !== null ? [{ label: '평균', value: `${result.averageScore?.toFixed(1) ?? '-'}점 (${avgPct}%)` }] : []),
            ...(result.highestScore !== undefined ? [{ label: '최고점', value: `${result.highestScore}점` }] : []),
            ...(result.participantCount !== undefined ? [{ label: '응시인원', value: `${result.participantCount}명` }] : []),
            ...(result.myRank !== undefined && result.participantCount !== undefined
              ? [{ label: '내 등수', value: `${result.myRank}등/${result.participantCount}명` }] : []),
          ].map(({ label, value, highlight }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: 'oklch(0.97 0.004 247)' }}>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
              <div className="font-bold text-sm tabular-nums mt-0.5" style={{ color: highlight ? color : 'oklch(0.35 0.02 250)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 내 점수 vs 평균 바 */}
        {avgPct !== null && (
          <div className="px-5 pb-4">
            <ScoreVsAvgBar result={result} />
          </div>
        )}

        {/* Phase 3B: 누적 성장 그래프 */}
        <CumulativeGrowthSection
          currentResult={result}
          sameCategoryResults={sameCategoryResults}
          studentId={studentId}
        />

        {/* IF 채점 블록 */}
        {maxRecoverable > 0 && (
          <div className="mx-5 mb-5 rounded-xl overflow-hidden border" style={{ borderColor: 'oklch(0.88 0.04 260)' }}>
            <button type="button" onClick={() => setIfOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: ifOpen ? 'oklch(0.94 0.04 260)' : 'oklch(0.97 0.02 260)' }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={14} style={{ color: '#040D1E' }} />
                <span className="text-sm font-bold" style={{ color: 'oklch(0.25 0.02 250)' }}>IF 채점</span>
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>맞출 수 있었던 문제를 맞혔다면?</span>
              </div>
              <span className="text-xs font-medium" style={{ color: '#040D1E' }}>{ifOpen ? '닫기' : '분석'}</span>
            </button>
            {ifOpen && (
              <div className="px-4 py-4 space-y-4 bg-white">
                {hasQuestionLevelData ? (
                  <>
                    {/* 문항별 quick-tap: 오답 문항만 리스트업, 문항마다 3버튼 중 1탭 */}
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>
                        오답 문항 {result.wrongQuestions.length}개 — 문항별로 놓친 이유를 선택하세요
                      </div>
                      <div className="space-y-2">
                        {result.wrongQuestions.map(wq => {
                          const selected = questionReasons[wq.questionId] ?? null;
                          return (
                            <div key={wq.questionId} className="rounded-lg p-2.5" style={{ background: 'oklch(0.97 0.004 250)' }}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold" style={{ color: 'oklch(0.3 0.02 250)' }}>{wq.no}번 문항</span>
                                <span className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>배점 {wq.points}점</span>
                              </div>
                              <div className="flex gap-1.5">
                                {IF_REASONS.map(r => (
                                  <button key={r} type="button"
                                    onClick={() => setQuestionReasons(prev => ({ ...prev, [wq.questionId]: prev[wq.questionId] === r ? null : r }))}
                                    className="flex-1 py-1.5 rounded-md text-xs font-semibold"
                                    style={{ background: selected === r ? '#040D1E' : 'white', color: selected === r ? 'white' : 'oklch(0.45 0.015 250)', border: '1px solid ' + (selected === r ? '#040D1E' : 'oklch(0.9 0.008 250)') }}>
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {ifQuestionResult && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '실제 점수', value: `${ifQuestionResult.actualScore}점`, c: color },
                            { label: 'IF 점수', value: `${ifQuestionResult.ifScore}점`, c: '#040D1E' },
                            { label: '놓친 점수', value: `${ifQuestionResult.missedPoints}점`, c: 'oklch(0.55 0.2 27)' },
                            { label: '상승 가능성', value: `+${ifQuestionResult.improvementPct}%p`, c: '#059669' },
                          ].map(({ label, value, c }) => (
                            <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.97 0.004 247)' }}>
                              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                              <div className="font-black text-base tabular-nums" style={{ color: c }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-center" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {ifQuestionResult.selectedCount}/{ifQuestionResult.totalWrongCount}개 문항 선택됨
                        </div>
                        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'oklch(0.95 0.06 260)', color: 'oklch(0.3 0.1 260)' }}>
                          {ifEngineOutput?.motivationComment}
                        </div>
                        {ifEngineOutput?.improvementPoint.topReason && (
                          <div className="flex items-start gap-1.5 text-xs" style={{ color: '#040D1E' }}>
                            <Sparkles size={12} className="flex-shrink-0 mt-0.5" />
                            <span>{ifEngineOutput.improvementPoint.suggestion}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Fallback: 문항별 채점 데이터가 없는 시험(legacy) — 시험 전체 단위로 계산 */}
                    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'oklch(0.96 0.02 80)', color: 'oklch(0.4 0.08 80)' }}>
                      이 시험은 문항별 채점 데이터가 없어 전체 단위로 계산합니다.
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>놓친 이유</div>
                      <div className="flex gap-2">
                        {IF_REASONS.map(r => (
                          <button key={r} type="button" onClick={() => setIfReason(r)}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: ifReason === r ? '#040D1E' : 'oklch(0.95 0.004 250)', color: ifReason === r ? 'white' : 'oklch(0.45 0.015 250)' }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>더 받을 수 있었던 점수</div>
                      <div className="flex flex-wrap gap-1.5">
                        {recoveryOptions.map(pts => (
                          <button key={pts} type="button" onClick={() => setIfPoints(pts)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: ifPoints === pts ? '#040D1E' : 'oklch(0.95 0.004 250)', color: ifPoints === pts ? 'white' : 'oklch(0.45 0.015 250)' }}>
                            {pts === 0 ? '선택 안함' : `+${pts}점`}
                          </button>
                        ))}
                      </div>
                    </div>
                    {ifResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '실제 점수', value: `${ifResult.actualScore}점`, c: color },
                            { label: 'IF 점수', value: `${ifResult.ifScore}점`, c: '#040D1E' },
                            { label: '놓친 점수', value: `${ifResult.missedPoints}점`, c: 'oklch(0.55 0.2 27)' },
                            { label: '상승 가능성', value: `+${ifResult.improvementPct}%p`, c: '#059669' },
                          ].map(({ label, value, c }) => (
                            <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.97 0.004 247)' }}>
                              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                              <div className="font-black text-base tabular-nums" style={{ color: c }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'oklch(0.95 0.06 260)', color: 'oklch(0.3 0.1 260)' }}>
                          {getIfMotivationComment(ifResult)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>
                        위에서 점수를 선택하면 IF 분석 결과가 표시됩니다.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── 시험 카드 ────────────────────────────────────────────────────────
function TestCard({ result, onClick }: { result: StudentExamResult; onClick: () => void }) {
  const pct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const color = scoreColor(pct);
  const avgPct = result.averageScore != null && result.totalPoints > 0
    ? Math.round(result.averageScore / result.totalPoints * 100) : null;

  return (
    <button type="button" onClick={onClick} className="axis-card axis-card-clickable p-4 w-full text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate flex items-center gap-1.5" style={{ color: 'oklch(0.2 0.02 250)' }}>
            {result.title}
            <span className="text-xs font-normal px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.55 0.015 250)' }}>
              {studentFacingScopeLabel(result.scope)}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {result.examDate}
            {result.participantCount && ` · 응시 ${result.participantCount}명`}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-black text-lg tabular-nums" style={{ color }}>{pct}%</div>
          <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>
            {result.earnedScore}/{result.totalPoints}
          </div>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      {avgPct !== null && (
        <div className="mt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)', width: 24 }}>나</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs tabular-nums" style={{ color }}>{pct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)', width: 24 }}>평균</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
              <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: 'oklch(0.75 0.01 250)' }} />
            </div>
            <span className="text-xs tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{avgPct}%</span>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── 탭 콘텐츠 ────────────────────────────────────────────────────────
function TestTabContent({ results, tab, studentId }: { results: StudentExamResult[]; tab: TestTab; studentId: string }) {
  const [selectedResult, setSelectedResult] = useState<StudentExamResult | null>(null);
  const sorted = [...results].sort((a, b) => b.examDate.localeCompare(a.examDate));
  const ascending = [...results].sort((a, b) => a.examDate.localeCompare(b.examDate)); // 누적 성장 그래프용(오름차순)

  // 요약 지표
  const pcts = sorted.map(r => r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0);
  const recent3Avg = pcts.slice(0, 3).length > 0
    ? Math.round(pcts.slice(0, 3).reduce((s, p) => s + p, 0) / pcts.slice(0, 3).length) : null;
  const bestPct = pcts.length > 0 ? Math.max(...pcts) : null;
  const prevChange = pcts.length >= 2 ? pcts[0] - pcts[1] : null;

  if (sorted.length === 0) {
    return (
      <div className="axis-card p-8 text-center">
        <ClipboardList size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
        <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
          아직 등록된 {tab.label} 결과가 없습니다.
        </div>
        <div className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>
          선생님이 결과를 입력하면 여기에 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 요약 지표 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '최근 3회 평균', value: recent3Avg !== null ? `${recent3Avg}%` : '-', color: scoreColor(recent3Avg ?? 0) },
          { label: '최고 기록', value: bestPct !== null ? `${bestPct}%` : '-', color: '#040D1E' },
          { label: '이전 대비', value: prevChange !== null ? (prevChange >= 0 ? `+${prevChange}%p` : `${prevChange}%p`) : '-',
            color: prevChange !== null ? (prevChange > 0 ? 'oklch(0.45 0.15 145)' : prevChange < 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.5 0.015 250)') : 'oklch(0.5 0.015 250)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="axis-card p-3 text-center">
            <div className="font-black text-base tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 추이 그래프 */}
      <TrendChart results={sorted} />

      {/* 시험 카드 목록 */}
      <div className="space-y-2">
        {sorted.map(r => (
          <TestCard key={r.examId} result={r} onClick={() => setSelectedResult(r)} />
        ))}
      </div>

      {/* 상세 모달 */}
      {selectedResult && (
        <ResultDetailModal
          result={selectedResult}
          sameCategoryResults={ascending}
          studentId={studentId}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────
export default function StudentGrades() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const [activeTabId, setActiveTabId] = useState<string>('unit-eval');

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';

  // 학원 평가 성적 (입학테스트 제외)
  const allResults = myStudentId
    ? getPublishedResultsForStudent(exams, submissions, myStudentId)
        .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any))
    : [];

  const activeTab = TEST_TABS.find(t => t.id === activeTabId) ?? TEST_TABS[0];
  const tabResults = allResults.filter(r => activeTab.categoryIds.includes(r.categoryId));

  const tabCounts: Record<string, number> = {
    'unit-eval':   allResults.filter(r => ['unit-eval', 'certification'].includes(r.categoryId)).length,
    'mock-school': allResults.filter(r => r.categoryId === 'mock-school').length,
  };

  // Phase 3D v3-r6: 성적 추이 선그래프용 — "단원평가"는 인증평가를 섞지 않은 순수
  // unit-eval만, "내신 대비 모의고사"는 mock-school만 사용한다(위 tabCounts와는 별개).
  const unitEvalOnlyResults = allResults.filter(r => r.categoryId === 'unit-eval');
  const mockSchoolOnlyResults = allResults.filter(r => r.categoryId === 'mock-school');

  return (
    <StudentLayout title="테스트">
      <div className="max-w-lg lg:max-w-6xl mx-auto px-4 py-4 space-y-3">

        {/* 안내 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ borderLeft: '3px solid #040D1E', color: 'oklch(0.5 0.015 250)' }}>
          단원평가와 내신대비 모의고사 결과를 확인하세요. 카드를 탭하면 테스트 결과 상세와 IF 채점을 볼 수 있습니다.
        </div>

        {/* [Phase 3D v3-r7-r1] PC 최적화: 데스크톱에서는 좌측(메인: 탭+시험목록)과
            우측(요약: 결과 추이 선그래프 2개) 2컬럼으로 재구성한다. */}
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5">
          <div className="space-y-3 lg:col-span-2">

        {/* 탭 */}
        <div className="flex gap-2">
          {TEST_TABS.map(tab => {
            const count = tabCounts[tab.id] ?? 0;
            const isActive = activeTabId === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTabId(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold flex-1"
                style={{
                  background: isActive ? tab.color : 'oklch(0.95 0.004 250)',
                  color: isActive ? 'white' : 'oklch(0.5 0.015 250)',
                  border: isActive ? `1px solid ${tab.color}` : '1px solid oklch(0.9 0.008 250)',
                }}>
                {tab.label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-black leading-none"
                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : tab.accentBg, color: isActive ? 'white' : tab.color, fontSize: 10 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 탭 설명 */}
        <div className="text-xs px-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{activeTab.description}</div>

        {/* 탭 콘텐츠 */}
        <TestTabContent results={tabResults} tab={activeTab} studentId={myStudentId} />

        {/* 대학추천 안내 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
          💡 실제내신 · 전국연합모의고사 · 수능실전 성적은 홈의 <strong>대학추천</strong> 카드에서 확인하세요.
        </div>

          </div>

          {/* 우측 요약 패널: 결과 추이 선그래프 — [Phase 3D v3-r8] "성적"→"결과/테스트" 표현 정리 */}
          <div className="lg:col-span-1">
            <div className="text-xs font-semibold px-1 mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>결과 추이</div>
            <div className="space-y-3">
              <ExamLineTrendChart title="단원평가" results={unitEvalOnlyResults} color="#040D1E" />
              <ExamLineTrendChart title="내신 대비 모의고사" results={mockSchoolOnlyResults} color="oklch(0.45 0.15 160)" />
            </div>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
