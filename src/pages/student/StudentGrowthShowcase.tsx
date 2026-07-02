// AXIS LMS v1.2 — StudentGrowthShowcase Premium Board

import { Link } from 'wouter';
import { Award, ChevronRight, Sparkles, Calculator, Brain, Clock as ClockIcon, Target, BookOpen, Compass, Trophy } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useGrowth } from '@/contexts/GrowthContext';
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

const IF_SUMMARY_META = [
  { key: 'calculationError', label: '계산 실수', short: '계산', icon: Calculator, color: CHART_BLUE },
  { key: 'conceptLack', label: '개념 이해 부족', short: '개념', icon: Brain, color: CHART_TEAL },
  { key: 'timeShortage', label: '시간 부족', short: '시간', icon: ClockIcon, color: CHART_AMBER },
] as const;

function studentTitle(emblem: Emblem): string {
  const map: Record<string, string> = {
    calc_precision_01: '계산 정밀', concept_mastery_01: '개념 마스터', time_control_01: '시간 컨트롤',
    steady_improvement_01: '꾸준한 성장', comeback_growth_01: '역전 성장', weekly_consistency_01: '주간 꾸준함',
    high_focus_01: '고집중 세션', reflection_complete_01: '복습 완료', growth_streak_01: '성장 연속',
    mentor_recommendation_01: '멘토 추천',
  };
  return map[emblem.id] ?? emblem.parentSafeLabel ?? emblem.name;
}

function EmblemDisplayCard({ emblem, record }: { emblem: Emblem; record?: StudentEmblem }) {
  const achieved = record?.achieved ?? false;
  const level = emblem.level ?? 'BASIC';
  const accent = EMBLEM_LEVEL_STYLE[level].accent;
  const pct = record && !achieved && emblem.requiredCount > 0
    ? Math.min(100, Math.round((record.progressCount / emblem.requiredCount) * 100))
    : 100;

  return (
    <div className="group relative min-h-[178px] rounded-xl p-3 text-center overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: achieved
          ? 'linear-gradient(180deg, #FFFDF7 0%, #F8F0DC 100%)'
          : 'linear-gradient(180deg, #FBFAF6 0%, #EFEADF 100%)',
        border: achieved ? '1px solid #D7BF78' : '1px solid #DED6C8',
        boxShadow: achieved ? 'inset 0 1px 0 #FFFFFF, 0 12px 24px rgba(11, 27, 51, 0.05)' : 'inset 0 1px 0 #FFFFFF',
      }}>
      <div className="absolute inset-x-4 top-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C8A15A, transparent)', opacity: achieved ? 0.75 : 0.35 }} />
      <AxisEmblemBadge iconKey={emblem.iconKey} level={emblem.level} accent={accent} size={104} locked={!achieved} />
      <div className="mt-1 font-black text-xs leading-tight" style={{ color: achieved ? '#0B1B33' : '#6F6758' }}>
        {studentTitle(emblem)}
      </div>
      <div className="mt-1 text-[10px]" style={{ color: 'oklch(0.48 0.015 250)' }}>
        {achieved ? record?.acquiredAt : `${record?.progressCount ?? 0} / ${emblem.requiredCount}`}
      </div>
      {!achieved && (
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#E4DED1' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_GOLD }} />
        </div>
      )}
    </div>
  );
}

function IfReasonRow({ label, short, color, icon: Icon, pct }: {
  label: string; short: string; color: string; icon: typeof Calculator; pct: number;
}) {
  const improved = -Math.round(24 + (30 - Math.min(30, pct)));
  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3 py-4" style={{ borderBottom: '1px solid #EAE2D2' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={21} style={{ color }} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: '#0B1B33' }}>{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>개선됨</span>
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: '#E8E0D2' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(28, 100 + improved)}%`, background: color }} />
        </div>
        <div className="mt-1 text-[11px]" style={{ color: '#6B7280' }}>{short} 비중 {pct}% · 4주 전 대비</div>
      </div>
      <div className="text-xl font-black tabular-nums" style={{ color }}>{improved}%</div>
    </div>
  );
}

export default function StudentGrowthShowcase() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { getProfile, getStudentEmblems, getSPLogs, emblems } = useGrowth();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const profile = getProfile(myStudentId);
  const gradeLevel = detectStudentGradeLevel(student);

  const tier = profile?.tier ?? 'UNRANKED';
  const tierProgress = calcTierProgress(profile?.totalSP ?? 0);
  const spLogs = getSPLogs(myStudentId, 6);

  const myEmblemRecords = getStudentEmblems(myStudentId);
  const recordByEmblem = new Map(myEmblemRecords.map(r => [r.emblemId, r]));
  const catalogEmblems = emblems.filter(e => e.active && e.family && e.family !== 'LIFE');
  const galleryEmblems = catalogEmblems
    .map(e => ({ emblem: e, record: recordByEmblem.get(e.id) }))
    .sort((a, b) => Number(Boolean(b.record?.achieved)) - Number(Boolean(a.record?.achieved)));
  const achievedCount = galleryEmblems.filter(g => g.record?.achieved).length;

  const ifCumulative = getIfCumulativeSummary(loadIfRecords(myStudentId));
  const ifSummary = IF_SUMMARY_META.map(meta => {
    const reasonKo = meta.label === '개념 이해 부족' ? '개념 부족' : meta.label;
    const ratio = ifCumulative.reasonRatios.find(r => r.reason === reasonKo);
    return { ...meta, currentPct: ratio?.pct ?? 0 };
  });

  const representativeEmblems = [
    ...((profile?.representativeEmblemIds ?? [])
      .map(id => catalogEmblems.find(e => e.id === id))
      .filter((e): e is Emblem => !!e)),
    ...galleryEmblems.filter(g => g.record?.achieved).map(g => g.emblem),
    ...catalogEmblems,
  ].filter((emblem, index, arr) => arr.findIndex(e => e.id === emblem.id) === index).slice(0, 3);

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
      <div className="max-w-[1380px] mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#F8F0DC', color: '#B88D2A' }}>
              <Sparkles size={23} />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: '#0B1B33' }}>성장 갤러리</h1>
              <p className="text-sm" style={{ color: '#5C6676' }}>노력은 기록되고, 성장은 빛납니다.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-right">
            <div>
              <div className="font-bold" style={{ color: '#0B1B33' }}>{currentUser.name}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{gradeLevel ?? '학생'} · {TIER_LABELS[tier]}</div>
            </div>
            <AxisTierMedallion tier={tier} size={44} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 items-start">
          <div className="space-y-5">
            <section className="axis-card p-6 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #FFFDF8 0%, #FFFFFF 55%, #F8F0DC 100%)' }}>
              <div className="absolute inset-y-6 left-[32%] w-px hidden lg:block" style={{ background: '#E5D8BC' }} />
              <div className="absolute inset-y-6 right-[24%] w-px hidden lg:block" style={{ background: '#E5D8BC' }} />
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr_0.7fr] gap-6 items-center">
                <div className="flex items-center gap-5">
                  <AxisTierMedallion tier={tier} size={140} />
                  <div>
                    <div className="text-xs font-bold tracking-wide" style={{ color: '#B88D2A' }}>CURRENT GROWTH STAGE</div>
                    <div className="mt-2 text-3xl font-black" style={{ color: '#0B1B33' }}>
                      {TIER_LABELS_EN[tier]}
                    </div>
                    <div className="text-base font-bold" style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]}</div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: '#4B5563' }}>{TIER_TAGLINE[tier]}</p>
                    <Link href="/student/grades">
                      <button type="button" className="mt-4 px-4 py-2 rounded-lg text-sm font-bold"
                        style={{ background: '#FFFDF7', color: '#0B1B33', border: '1px solid #E3D8C3' }}>
                        단계 해석 보기 <ChevronRight size={14} className="inline ml-1" />
                      </button>
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#0B1B33' }}>다음 단계까지</div>
                  <div className="mt-2 text-5xl font-black tabular-nums" style={{ color: '#C8A15A' }}>{tierProgress.progressPct}%</div>
                  <div className="mt-3 h-3 rounded-full overflow-hidden" style={{ background: '#E8E0D2' }}>
                    <div className="h-full rounded-full" style={{ width: `${tierProgress.progressPct}%`, background: 'linear-gradient(90deg, #C8A15A, #E4C979)' }} />
                  </div>
                  <div className="mt-2 text-sm tabular-nums" style={{ color: '#4B5563' }}>
                    {(profile?.totalSP ?? 0).toLocaleString()} / {tierProgress.nextThresholdSP?.toLocaleString() ?? '-'} 성장 활동
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>다음 단계</div>
                  {tierProgress.next ? <AxisTierMedallion tier={tierProgress.next} size={92} /> : <Trophy size={64} className="mx-auto" style={{ color: CHART_GOLD }} />}
                  <div className="mt-2 text-sm font-bold" style={{ color: tierProgress.next ? TIER_COLORS[tierProgress.next] : CHART_GOLD }}>
                    {tierProgress.next ? TIER_LABELS[tierProgress.next] : '최상위 단계'}
                  </div>
                </div>
              </div>
            </section>

            <section className="axis-card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award size={18} style={{ color: '#C8A15A' }} />
                    <h2 className="font-black text-lg" style={{ color: '#0B1B33' }}>성장 엠블럼 컬렉션</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full tabular-nums" style={{ background: '#F8F0DC', color: '#8A6D2E' }}>{achievedCount} / {galleryEmblems.length}</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#5C6676' }}>노력의 여정이 특별한 메달로 기록됩니다.</p>
                </div>
                <Link href="/student/grades">
                  <button type="button" className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold"
                    style={{ background: '#FFFDF7', color: '#0B1B33', border: '1px solid #E3D8C3' }}>
                    전체 보기 <ChevronRight size={14} />
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {galleryEmblems.slice(0, 12).map(({ emblem, record }) => (
                  <EmblemDisplayCard key={emblem.id} emblem={emblem} record={record} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: '#FFF9EA', border: '1px solid #EADDBF' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#6B5530' }}>
                  <Compass size={16} /> 엠블럼은 자동으로 수여되며, 일부 목표는 직접 선택할 수 있습니다.
                </div>
                <Link href="/student/rival">
                  <span className="text-sm font-bold cursor-pointer" style={{ color: '#0B1B33' }}>다음 목표 설정 <ChevronRight size={14} className="inline" /></span>
                </Link>
              </div>
            </section>
          </div>

          <aside className="axis-card p-5 xl:sticky xl:top-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-lg" style={{ color: '#0B1B33' }}>IF 기반 성장 요약</h2>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3', color: '#4B5563' }}>최근 4주</span>
            </div>
            <p className="text-sm mb-2" style={{ color: '#5C6676' }}>나의 약점을 정밀하게 분석하고, 확실히 개선하고 있어요.</p>
            {ifSummary.map(({ key, label, short, icon, color, currentPct }) => (
              <IfReasonRow key={key} label={label} short={short} icon={icon} color={color} pct={currentPct} />
            ))}
            <Link href="/student/grades">
              <button type="button" className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-black"
                style={{ background: '#0B1B33', color: '#F8E7A2', border: '1px solid #C8A15A' }}>
                상세 분석 리포트 보기 <ChevronRight size={16} />
              </button>
            </Link>
          </aside>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
          <section className="axis-card p-5">
            <div className="font-black text-lg mb-1" style={{ color: '#0B1B33' }}>대표 성장 엠블럼</div>
            <p className="text-sm mb-4" style={{ color: '#5C6676' }}>이번 시즌 나를 가장 잘 설명하는 성장 기록입니다.</p>
            <div className="grid grid-cols-3 gap-3">
              {representativeEmblems.map((emblem, index) => (
                <div key={emblem.id} className="rounded-xl p-4 text-center" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                  <div className="text-[10px] font-black tracking-wide" style={{ color: '#B88D2A' }}>SIGNATURE {index + 1}</div>
                  <AxisEmblemBadge iconKey={emblem.iconKey} level={emblem.level} size={112} />
                  <div className="mt-1 text-sm font-black" style={{ color: '#0B1B33' }}>{studentTitle(emblem)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="axis-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-black text-lg" style={{ color: '#0B1B33' }}>주간 학습 습관</div>
                <p className="text-sm" style={{ color: '#5C6676' }}>꾸준한 습관이 최고의 성과를 만듭니다.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3', color: '#4B5563' }}>최근 8주</span>
            </div>
            <div className="relative h-56 flex items-end justify-between gap-3 px-2 pt-4">
              {weekly.map((w) => (
                <div key={w.wk} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs tabular-nums" style={{ color: '#0B1B33' }}>{w.hours}</span>
                  <div className="w-full rounded-t-lg" style={{ height: `${(w.hours / maxHours) * 132}px`, background: 'linear-gradient(180deg, #7DD8CE, #2F7F86)', minHeight: 8 }} />
                  <span className="text-[10px]" style={{ color: '#6B7280' }}>{w.wk}</span>
                </div>
              ))}
              <svg className="absolute inset-x-2 top-5 pointer-events-none" style={{ height: 150 }} viewBox={`0 0 ${weekly.length * 50} 150`} preserveAspectRatio="none">
                <polyline points={weekly.map((w, i) => `${i * 50 + 25},${150 - (w.goalPct / 100) * 132}`).join(' ')}
                  fill="none" stroke={CHART_GOLD} strokeWidth={2.5} />
                {weekly.map((w, i) => (
                  <circle key={w.wk} cx={i * 50 + 25} cy={150 - (w.goalPct / 100) * 132} r={3.2} fill={CHART_GOLD} />
                ))}
              </svg>
            </div>
            <div className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#FFF9EA', border: '1px solid #EADDBF' }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#6B5530' }}>
                <Sparkles size={16} /> 최근 기록 갱신! 이번 주 학습 시간이 지난 8주 중 가장 높아요.
              </div>
              <Link href="/student/grades"><span className="text-sm font-bold cursor-pointer" style={{ color: '#0B1B33' }}>주간 리포트 보기 <ChevronRight size={14} className="inline" /></span></Link>
            </div>
          </section>
        </div>

        <section className="axis-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-black text-lg" style={{ color: '#0B1B33' }}>최근 성장 기록</div>
              <p className="text-sm" style={{ color: '#5C6676' }}>한 걸음 한 걸음, 성장의 이야기가 이어지고 있어요.</p>
            </div>
            <Link href="/student/rival">
              <button type="button" className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{ background: '#0B1B33', color: '#F8E7A2', border: '1px solid #C8A15A' }}>
                또래 성장 비교 보기 <ChevronRight size={14} className="inline ml-1" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {spLogs.slice(0, 4).map((log, index) => (
              <div key={log.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: index === 0 ? '#F8F0DC' : '#E7EBF3', color: index === 0 ? '#B88D2A' : '#2F7F86' }}>
                  {index === 0 ? <Trophy size={18} /> : <Target size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#0B1B33' }}>{log.reason}</div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>{log.createdAt}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-bold tabular-nums" style={{ background: '#F8F0DC', color: '#8A6D2E' }}>+{log.amount}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}
