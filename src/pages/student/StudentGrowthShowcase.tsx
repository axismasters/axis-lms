// AXIS LMS v1.2 — Phase 3D v3-r10-r1: StudentGrowthShowcase (PC-first Premium Gallery)
//
// 05-growth-showcase-screen.png 기준 재구성. "성장 진열장"이라는 이름에 맞게 학생이
// 오래 머무르고 눌러보고 싶은 프리미엄 학습 업적 갤러리로 만든다.
//
// 구성:
//   - 성장 단계 Hero(현재 Tier 메달 + 다음 단계까지 진행률 + 다음 단계 미리보기)
//   - 성장 엠블럼 컬렉션(프리미엄 배지 갤러리 — 획득/다음 목표)
//   - IF 기반 성장 요약(계산실수/개념부족/시간부족 개선 흐름)
//   - 최근 성장 기록(타임라인 + SP)
//   - 주간 학습 습관 차트(학습 시간 막대 + 주간 목표 라인)
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격 표현, 수납/재무 노출, max-w-lg 모바일 단일 구조.
//   Tier는 게임 랭크가 아니라 AXIS 성장 단계. 단일 이모지 엠블럼 금지(SVG 프리미엄 배지 사용).

import { Link } from 'wouter';
import { TrendingUp, Award, ChevronRight, Sparkles, Calculator, Brain, Clock as ClockIcon } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import { STUDENT_HIDDEN_CATEGORY_IDS } from '@/lib/phase2dData';
import {
  TIER_LABELS, TIER_LABELS_EN, TIER_TAGLINE, TIER_COLORS,
  calcTierProgress, EMBLEM_LEVEL_STYLE,
} from '@/lib/growthData';
import type { Emblem, StudentEmblem } from '@/lib/growthData';
import { detectStudentGradeLevel } from '@/lib/universityMenuLabel';
import { AxisTierMedallion } from '@/components/brand/AxisTierMedallion';
import { AxisEmblemBadge } from '@/components/brand/AxisEmblemBadge';
import { loadIfRecords, getIfCumulativeSummary } from '@/lib/ifAnalysisEngine';
import { CHART_TEAL, CHART_GOLD, CHART_BLUE, CHART_AMBER } from '@/lib/brandColors';

// ─── IF 기반 성장 요약 항목 ────────────────────────────────────────────
const IF_SUMMARY_META = [
  { key: 'calculationError', label: '계산 실수', icon: Calculator, color: CHART_TEAL },
  { key: 'conceptLack', label: '개념 이해 부족', icon: Brain, color: CHART_BLUE },
  { key: 'timeShortage', label: '시간 부족', icon: ClockIcon, color: CHART_AMBER },
] as const;

// ─── 엠블럼 갤러리 타일 ────────────────────────────────────────────────
function EmblemTile({ emblem, record }: { emblem: Emblem; record?: StudentEmblem }) {
  const achieved = record?.achieved ?? false;
  const level = emblem.level ?? 'BASIC';
  const accent = EMBLEM_LEVEL_STYLE[level].accent;
  const progressPct = record && !achieved && emblem.requiredCount > 0
    ? Math.min(100, Math.round((record.progressCount / emblem.requiredCount) * 100)) : 0;

  return (
    <div className="rounded-xl p-3 flex flex-col items-center text-center transition-shadow hover:shadow-md"
      style={{ background: achieved ? 'oklch(0.985 0.006 90)' : 'oklch(0.98 0.004 250)', border: '1px solid oklch(0.92 0.008 250)' }}>
      <AxisEmblemBadge iconKey={emblem.iconKey} level={emblem.level} accent={accent} size={72} locked={!achieved} />
      <div className="mt-1.5 font-semibold text-xs" style={{ color: achieved ? 'oklch(0.22 0.02 250)' : 'oklch(0.5 0.015 250)' }}>
        {emblem.parentSafeLabel ? studentTitle(emblem) : emblem.name}
      </div>
      {achieved ? (
        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)', fontSize: 10 }}>{record?.acquiredAt}</div>
      ) : (
        <>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)', fontSize: 10 }}>다음 성장 목표</div>
          {record && emblem.requiredCount > 1 && (
            <div className="w-full mt-1.5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: accent }} />
              </div>
              <div className="text-xs mt-0.5 tabular-nums" style={{ color: 'oklch(0.55 0.015 250)', fontSize: 10 }}>
                {record.progressCount} / {emblem.requiredCount}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 학생 화면 라벨(카탈로그의 한글 student label이 있으면 우선)
function studentTitle(emblem: Emblem): string {
  const map: Record<string, string> = {
    calc_precision_01: '계산 정밀', concept_mastery_01: '개념 완성', time_control_01: '시간 컨트롤',
    steady_improvement_01: '꾸준한 성장', comeback_growth_01: '역전 성장', weekly_consistency_01: '주간 꾸준함',
    high_focus_01: '고집중 세션', reflection_complete_01: '복습 완료', growth_streak_01: '성장 연속',
    mentor_recommendation_01: '멘토 추천',
  };
  return map[emblem.id] ?? emblem.name;
}

export default function StudentGrowthShowcase() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { getProfile, getStudentEmblems, getSPLogs, emblems } = useGrowth();
  const { exams, submissions } = useAssessment();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const profile = getProfile(myStudentId);
  const gradeLevel = detectStudentGradeLevel(student);

  const tier = profile?.tier ?? 'UNRANKED';
  const tierProgress = calcTierProgress(profile?.totalSP ?? 0);
  const spLogs = getSPLogs(myStudentId, 6);

  // 엠블럼: 획득 + 진행중(다음 목표). 신규 카탈로그(family 있는) 우선 노출.
  const myEmblemRecords = getStudentEmblems(myStudentId);
  const recordByEmblem = new Map(myEmblemRecords.map(r => [r.emblemId, r]));
  const catalogEmblems = emblems.filter(e => e.active && e.family && e.family !== 'LIFE');
  const galleryEmblems = catalogEmblems
    .map(e => ({ emblem: e, record: recordByEmblem.get(e.id) }))
    .sort((a, b) => {
      const av = a.record?.achieved ? 0 : 1;
      const bv = b.record?.achieved ? 0 : 1;
      return av - bv;
    });
  const achievedCount = galleryEmblems.filter(g => g.record?.achieved).length;

  // IF 누적 요약(실데이터) — 개선 % 는 사유 비율의 역수 기반 결정적 표현
  const ifRecords = loadIfRecords(myStudentId);
  const ifCumulative = getIfCumulativeSummary(ifRecords);
  const ifSummary = IF_SUMMARY_META.map(meta => {
    const reasonKo = meta.label === '개념 이해 부족' ? '개념 부족' : meta.label;
    const ratio = ifCumulative.reasonRatios.find(r => r.reason === reasonKo);
    const pct = ratio?.pct ?? 0;
    // "개선됨" 표현: 비중이 낮을수록 개선된 것으로 간주(데모 결정적 값)
    const improvedPct = -Math.round(24 + (30 - Math.min(30, pct)));
    return { ...meta, currentPct: pct, improvedPct, improved: true };
  });

  // 최근 성장 기록(SP 로그 기반 타임라인)
  const growthRecords = spLogs.slice(0, 4);

  // 주간 학습 습관(결정적 데모 값 — 학습 시간 막대 + 목표 달성률 라인)
  const weekly = [
    { wk: '3/24', hours: 6.2, goalPct: 67 },
    { wk: '3/31', hours: 7.1, goalPct: 72 },
    { wk: '4/7', hours: 8.3, goalPct: 78 },
    { wk: '4/14', hours: 9.6, goalPct: 85 },
    { wk: '4/21', hours: 10.2, goalPct: 88 },
    { wk: '4/28', hours: 11.4, goalPct: 92 },
    { wk: '5/5', hours: 12.6, goalPct: 95 },
    { wk: '5/12', hours: 13.1, goalPct: 100 },
  ];
  const maxHours = Math.max(...weekly.map(w => w.hours));

  return (
    <StudentLayout title="성장 진열장">
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 py-5 space-y-5">

        {/* 헤더 */}
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#C8A15A' }} />
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>성장 갤러리</h1>
            <p className="text-xs" style={{ color: 'oklch(0.45 0.015 250)' }}>노력은 기록되고, 성장은 빛납니다.</p>
          </div>
        </div>

        {/* 성장 단계 Hero — 전체 폭 밴드 */}
        <div className="axis-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-5">
            <div className="flex flex-col items-center">
              <AxisTierMedallion tier={tier} size={104} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>현재 성장 단계</div>
              <div className="text-2xl font-black" style={{ color: 'oklch(0.18 0.02 250)' }}>
                {TIER_LABELS[tier]} <span className="text-base font-bold" style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS_EN[tier]}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'oklch(0.5 0.015 250)' }}>{TIER_TAGLINE[tier]}</div>
              {tierProgress.next && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>다음 단계까지</span>
                    <span className="text-lg font-black tabular-nums" style={{ color: '#C8A15A' }}>{tierProgress.progressPct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                    <div className="h-full rounded-full" style={{ width: `${tierProgress.progressPct}%`, background: CHART_GOLD }} />
                  </div>
                  <div className="text-xs mt-1 tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    {(profile?.totalSP ?? 0).toLocaleString()} / {tierProgress.nextThresholdSP?.toLocaleString()} 성장 활동
                  </div>
                </div>
              )}
            </div>
            {tierProgress.next && (
              <div className="hidden sm:flex flex-col items-center gap-1 pl-4" style={{ borderLeft: '1px solid oklch(0.93 0.008 250)' }}>
                <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>다음 단계</span>
                <AxisTierMedallion tier={tierProgress.next} size={54} />
                <span className="text-xs font-semibold" style={{ color: TIER_COLORS[tierProgress.next] }}>{TIER_LABELS[tierProgress.next]}</span>
              </div>
            )}
          </div>
        </div>

        {/* 본문 — 좌: 엠블럼 갤러리 / 우: IF 기반 성장 요약 (PC에서 균형 2컬럼) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ── 좌: 성장 엠블럼 컬렉션 ── */}
          <div className="space-y-5">

            {/* 성장 엠블럼 컬렉션 */}
            <div className="axis-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award size={16} style={{ color: '#C8A15A' }} />
                  <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>성장 엠블럼 컬렉션</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full tabular-nums" style={{ background: '#F8F0DC', color: '#8A6D2E' }}>{achievedCount} / {galleryEmblems.length}</span>
                </div>
              </div>
              <p className="text-xs mb-3" style={{ color: 'oklch(0.5 0.015 250)' }}>노력의 여정이 특별한 엠블럼으로 기록됩니다.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {galleryEmblems.map(({ emblem, record }) => (
                  <EmblemTile key={emblem.id} emblem={emblem} record={record} />
                ))}
              </div>
              <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
                <TrendingUp size={11} /> 엠블럼은 자동으로 수여되며, 일부 목표는 직접 선택할 수 있습니다.
              </p>
            </div>

            {/* 주간 학습 습관 */}
            <div className="axis-card p-5">
              <div className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.25 0.02 250)' }}>주간 학습 습관</div>
              <p className="text-xs mb-3" style={{ color: 'oklch(0.5 0.015 250)' }}>꾸준한 습관이 최고의 성과를 만듭니다.</p>
              <div className="relative h-40 flex items-end justify-between gap-1 px-1">
                {/* 막대(학습 시간) */}
                {weekly.map((w) => (
                  <div key={w.wk} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs tabular-nums" style={{ color: 'oklch(0.5 0.015 250)', fontSize: 9 }}>{w.hours}</span>
                    <div className="w-full rounded-t" style={{ height: `${(w.hours / maxHours) * 100}px`, background: CHART_TEAL, minHeight: 4 }} />
                    <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)', fontSize: 8 }}>{w.wk}</span>
                  </div>
                ))}
                {/* 라인(목표 달성률) */}
                <svg className="absolute inset-x-1 top-0 pointer-events-none" style={{ height: 120 }} viewBox={`0 0 ${weekly.length * 40} 120`} preserveAspectRatio="none">
                  <polyline
                    points={weekly.map((w, i) => `${i * 40 + 20},${120 - (w.goalPct / 100) * 106}`).join(' ')}
                    fill="none" stroke={CHART_GOLD} strokeWidth={2} />
                  {weekly.map((w, i) => (
                    <circle key={i} cx={i * 40 + 20} cy={120 - (w.goalPct / 100) * 106} r={2.5} fill={CHART_GOLD} />
                  ))}
                </svg>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_TEAL }} /> 학습 시간</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_GOLD }} /> 주간 목표 달성률</span>
              </div>
            </div>
          </div>

          {/* ── 우: IF 기반 성장 요약 + 최근 성장 기록 + Rival 연결 ── */}
          <div className="space-y-5">
            <div className="axis-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>IF 기반 성장 요약</span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'oklch(0.5 0.015 250)' }}>나의 약점을 정확히 분석하고, 확실히 개선하고 있어요.</p>
              <div className="space-y-4">
                {ifSummary.map(({ key, label, icon: Icon, color, currentPct, improvedPct }) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '1A' }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <span className="text-sm font-medium flex-1" style={{ color: 'oklch(0.3 0.02 250)' }}>{label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: CHART_TEAL + '1A', color: CHART_TEAL }}>개선됨</span>
                      <span className="text-lg font-black tabular-nums flex-shrink-0" style={{ color: CHART_TEAL }}>{improvedPct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden ml-10" style={{ background: 'oklch(0.93 0.006 250)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(20, 100 + improvedPct)}%`, background: color }} />
                    </div>
                    <div className="text-xs mt-1 ml-10" style={{ color: 'oklch(0.55 0.015 250)' }}>현재 비중 {currentPct}% · 4주 전 대비 개선 흐름</div>
                  </div>
                ))}
              </div>
              <Link href="/student/grades">
                <div className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                  style={{ border: '1px solid oklch(0.88 0.01 250)', color: '#0B1B33' }}>
                  상세 분석 리포트 보기 <ChevronRight size={14} />
                </div>
              </Link>
            </div>

            {/* 최근 성장 기록 */}
            <div className="axis-card p-5">
              <div className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 성장 기록</div>
              <p className="text-xs mb-3" style={{ color: 'oklch(0.5 0.015 250)' }}>한 걸음 한 걸음, 성장이 이어지고 있어요.</p>
              {growthRecords.length === 0 ? (
                <div className="text-xs py-6 text-center" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 기록된 성장 활동이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {growthRecords.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: i === 0 ? CHART_GOLD : CHART_TEAL }} />
                        {i < growthRecords.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'oklch(0.9 0.008 250)', minHeight: 18 }} />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: 'oklch(0.25 0.02 250)' }}>{log.reason}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums font-semibold" style={{ background: '#F8F0DC', color: '#8A6D2E' }}>+{log.amount}</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{log.createdAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rival 매치업 연결 */}
            <Link href="/student/rival" style={{ display: 'block' }}>
              <div className="axis-card axis-card-clickable p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: CHART_TEAL }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>또래 성장 비교</div>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>이번 주 나의 성장 매치업 보기</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'oklch(0.7 0.01 250)' }} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
