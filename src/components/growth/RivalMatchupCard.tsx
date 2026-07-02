// AXIS LMS v1.2 — Phase 3D v3-r10-r1: RivalMatchupCard
//
// 승인된 "나 vs Rival" 매치업 카드(01-rival-matchup-card-approved.png)를 그대로 구현한다.
// 기존의 심심한 원형 그래프 카드를 대체한다.
//
// 구성(좌 → 우):
//   [나 아바타 + 이번 주 성장 + 상위%] [내 주간 추이] [VS 메달] [Rival 주간 추이]
//   [Rival 평균 성장 + 상위%] [Rival 아바타]
//   아래: 정확도/꾸준함/집중도 비교 레인 3줄
//   하단: 이번 주 리드 문구 + CTA(상세 매치업 보기)
//
// ⚠ 전투/몬스터/무기/아이템샵 표현 금지. VS 메달은 학습 대전 톤(월계관+네이비 원판).
//    실명/식별정보 노출 금지 — 상대는 "Rival 평균" 또는 익명 닉네임만.

import { ChevronRight, Target, CalendarCheck, Clock, User, GraduationCap } from 'lucide-react';
import type { RivalMatchup } from '@/lib/rivalMatchupEngine';
import { CHART_TEAL, CHART_BLUE } from '@/lib/brandColors';

const MINE_COLOR = CHART_TEAL;
const RIVAL_COLOR = CHART_BLUE;

function MiniTrend({ points, color }: { points: { label: string; value: number }[]; color: string }) {
  const W = 110, H = 44, pad = 4;
  const xs = points.map((_, i) => pad + (i * (W - pad * 2)) / Math.max(1, points.length - 1));
  const min = Math.min(...points.map(p => p.value));
  const max = Math.max(...points.map(p => p.value));
  const span = Math.max(1, max - min);
  const ys = points.map(p => H - pad - ((p.value - min) / span) * (H - pad * 2));
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} className="block">
        <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3 : 2} fill={color} />)}
      </svg>
      <div className="flex justify-between w-full px-1" style={{ maxWidth: W }}>
        {points.map((p, i) => (
          <span key={i} style={{ fontSize: 8, color: 'oklch(0.55 0.015 250)' }}>{p.label.replace('이번 주', '이번').replace('지난주', '지난').replace(' 전', '')}</span>
        ))}
      </div>
    </div>
  );
}

function VsMedallion() {
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="flex-shrink-0" aria-label="VS">
      {/* 월계관 */}
      {([-1, 1] as const).map((dir) => (
        <g key={dir} transform={dir === 1 ? 'scale(-1,1) translate(-72 0)' : ''} opacity={0.9}>
          {[0, 1, 2, 3].map((i) => {
            const y = 26 + i * 6; const x = 10 + i * 1.6;
            return <ellipse key={i} cx={x} cy={y} rx={3.4} ry={1.9} fill="#C8A15A" transform={`rotate(-40 ${x} ${y})`} />;
          })}
        </g>
      ))}
      <circle cx="36" cy="36" r="21" fill="#C8A15A" />
      <circle cx="36" cy="36" r="18.5" fill="#0B1B33" stroke="#040D1E" strokeWidth={1} />
      <circle cx="36" cy="36" r="15.5" fill="none" stroke="#C8A15A" strokeWidth={1} opacity={0.8} />
      <text x="36" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill="#E4C979" fontStyle="italic">VS</text>
    </svg>
  );
}

function LaneRow({ icon: Icon, label, mine, rival }: { icon: typeof Target; label: string; mine: number; rival: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* 내 값 */}
      <span className="text-sm font-bold tabular-nums w-10 text-right flex-shrink-0" style={{ color: MINE_COLOR }}>{mine}%</span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden flex flex-row-reverse" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full" style={{ width: `${mine}%`, background: MINE_COLOR }} />
      </div>
      {/* 라벨 */}
      <div className="flex items-center gap-1 w-20 justify-center flex-shrink-0">
        <Icon size={13} style={{ color: 'oklch(0.4 0.015 250)' }} />
        <span className="text-xs font-medium" style={{ color: 'oklch(0.35 0.015 250)' }}>{label}</span>
      </div>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full" style={{ width: `${rival}%`, background: RIVAL_COLOR }} />
      </div>
      <span className="text-sm font-bold tabular-nums w-10 flex-shrink-0" style={{ color: RIVAL_COLOR }}>{rival}%</span>
    </div>
  );
}

export function RivalMatchupCard({
  matchup, myNickname, rivalLabel = 'Rival 평균', onDetail,
}: {
  matchup: RivalMatchup;
  myNickname?: string;
  rivalLabel?: string;
  onDetail?: () => void;
}) {
  const laneIcon = { accuracy: Target, consistency: CalendarCheck, focus: Clock } as const;

  return (
    <div className="axis-card overflow-hidden">
      {/* 상단 매치업 헤더 — 좌우 분할 배경 */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-5"
        style={{ background: 'linear-gradient(90deg, oklch(0.97 0.02 190) 0%, oklch(0.98 0.008 90) 48%, oklch(0.97 0.015 250) 100%)' }}>
        {/* 좌: 나 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'white', border: `2px solid ${MINE_COLOR}` }}>
              <User size={26} style={{ color: MINE_COLOR }} />
            </div>
            <span className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-md font-bold text-white" style={{ background: '#0B1B33' }}>나</span>
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>이번 주 성장</div>
            <div className="text-2xl font-black tabular-nums leading-tight" style={{ color: MINE_COLOR }}>
              {matchup.myWeeklyGrowthPct >= 0 ? '+' : ''}{matchup.myWeeklyGrowthPct}%<span className="text-sm ml-0.5">▲</span>
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{matchup.myPercentileLabel}</div>
          </div>
          <div className="hidden lg:block ml-1">
            <div className="text-xs mb-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>주간 테스트 추이</div>
            <MiniTrend points={matchup.myTrend} color={MINE_COLOR} />
          </div>
        </div>

        {/* 중앙: VS 메달 */}
        <div className="flex flex-col items-center px-1"><VsMedallion /></div>

        {/* 우: Rival */}
        <div className="flex items-center gap-3 min-w-0 justify-end">
          <div className="hidden lg:block mr-1">
            <div className="text-xs mb-0.5 text-right" style={{ color: 'oklch(0.5 0.015 250)' }}>주간 테스트 추이</div>
            <MiniTrend points={matchup.rivalTrend} color={RIVAL_COLOR} />
          </div>
          <div className="min-w-0 text-right hidden sm:block">
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{rivalLabel} 성장</div>
            <div className="text-2xl font-black tabular-nums leading-tight" style={{ color: RIVAL_COLOR }}>
              {matchup.rivalWeeklyGrowthPct >= 0 ? '+' : ''}{matchup.rivalWeeklyGrowthPct}%
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{matchup.rivalPercentileLabel}</div>
          </div>
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'white', border: `2px solid ${RIVAL_COLOR}` }}>
              <GraduationCap size={24} style={{ color: RIVAL_COLOR }} />
            </div>
            <span className="absolute -top-1 -left-1 text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ background: 'white', color: RIVAL_COLOR, border: `1px solid ${RIVAL_COLOR}55` }}>{rivalLabel}</span>
          </div>
        </div>
      </div>

      {/* 비교 레인 */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
        {matchup.lanes.map((lane) => (
          <LaneRow key={lane.key} icon={laneIcon[lane.key]} label={lane.label} mine={lane.mine} rival={lane.rival} />
        ))}
      </div>

      {/* 하단 CTA */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap" style={{ borderTop: '1px solid oklch(0.93 0.008 250)', background: 'oklch(0.98 0.006 90)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F8F0DC' }}>
            <span style={{ fontSize: 18 }}>🏆</span>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
              {matchup.leadingThisWeek ? '이번 주는 내가 앞서가고 있어요!' : '이번 주, 조금만 더 힘내볼까요?'}
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{matchup.encouragement}</div>
          </div>
        </div>
        <button onClick={onDetail}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-white flex-shrink-0 cursor-pointer"
          style={{ background: '#0B1B33', border: '1px solid #C8A15A' }}>
          <span style={{ color: '#E4C979' }}>상세 매치업 보기</span>
          <ChevronRight size={15} style={{ color: '#E4C979' }} />
        </button>
      </div>
    </div>
  );
}
