// AXIS LMS v1.2 — Phase 3D v3-r14-r4: RivalMatchupCard (Premium Analysis Panel)
//
// [Phase 3D v3-r14-r4] "나 vs Rival" 매치업 카드 — 학생 성장/Rival/Emblem 프리미엄 UI 정리.
// 이전(v3-r10-r1) 버전은 헤더를 3-tone 그라데이션 배너로 칠하고, 주간 추이 차트와 성장률
// 텍스트를 `hidden sm:block` / `hidden lg:block`으로 좁은 폭에서 잘라내는 방식이었다 —
// 뷰포트가 그 경계 근처(≈900~1023px 등)일 때 정보가 들쭉날쭉 빠지고, 남은 좌우 열이
// min-w-0 flex로 눌려 "PC에서 세로로 눌려 보인다"는 지적을 받았다. 이번 개정은:
//   - 핵심 정보(아바타/성장률/백분위/주간 추이)를 항상 렌더링한다(폭에 따라 숨기지 않는다).
//   - 헤더 그리드를 `grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`로 바꿔,
//     좁은 화면에서는 세 블록이 각각 전체 폭을 쓰며 위→아래로 쌓이고(찌그러지지 않음),
//     md 이상에서는 항상 좌/중앙/우 3열이 넉넉한 최소폭(minmax(0,1fr))으로 나란히 선다.
//   - 배경은 단일 톤(아이보리)으로 정리하고, VS 메달/CTA에만 Gold를 남긴다(§ 색상 원칙).
//   - 🏆 이모지 대신 lucide Trophy 아이콘을 사용해 아이콘 톤을 통일한다.
//
// ⚠ 전투/몬스터/무기/아이템샵 표현 금지. VS 메달은 학습 대전 톤(월계관+네이비 원판).
//    실명/식별정보 노출 금지 — 상대는 "Rival 평균" 또는 익명 닉네임만.

import { ChevronRight, Target, CalendarCheck, Clock, User, GraduationCap, Trophy } from 'lucide-react';
import type { RivalMatchup } from '@/lib/rivalMatchupEngine';
import { AXIS_NAVY, AXIS_GOLD, CHART_TEAL, CHART_BLUE } from '@/lib/brandColors';

const MINE_COLOR = CHART_TEAL;
const RIVAL_COLOR = CHART_BLUE;
const TEXT_MUTE = 'oklch(0.5 0.015 250)';

function MiniTrend({ points, color, align = 'left' }: { points: { label: string; value: number }[]; color: string; align?: 'left' | 'right' }) {
  const W = 128, H = 48, pad = 4;
  const xs = points.map((_, i) => pad + (i * (W - pad * 2)) / Math.max(1, points.length - 1));
  const min = Math.min(...points.map(p => p.value));
  const max = Math.max(...points.map(p => p.value));
  const span = Math.max(1, max - min);
  const ys = points.map(p => H - pad - ((p.value - min) / span) * (H - pad * 2));
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <div className="flex flex-col flex-shrink-0" style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <span className="text-xs mb-1" style={{ color: TEXT_MUTE }}>주간 추이</span>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
        <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3.5 : 2} fill={color} />)}
      </svg>
    </div>
  );
}

function VsMedallion() {
  return (
    <svg width={80} height={80} viewBox="0 0 80 80" className="flex-shrink-0" aria-label="VS">
      {/* 월계관 */}
      {([-1, 1] as const).map((dir) => (
        <g key={dir} transform={dir === 1 ? 'scale(-1,1) translate(-80 0)' : ''} opacity={0.9}>
          {[0, 1, 2, 3].map((i) => {
            const y = 29 + i * 6.6; const x = 11 + i * 1.8;
            return <ellipse key={i} cx={x} cy={y} rx={3.8} ry={2.1} fill={AXIS_GOLD} transform={`rotate(-40 ${x} ${y})`} />;
          })}
        </g>
      ))}
      <circle cx="40" cy="40" r="23" fill={AXIS_GOLD} />
      <circle cx="40" cy="40" r="20" fill={AXIS_NAVY} stroke="#040D1E" strokeWidth={1} />
      <circle cx="40" cy="40" r="17" fill="none" stroke={AXIS_GOLD} strokeWidth={1} opacity={0.8} />
      <text x="40" y="47" textAnchor="middle" fontSize="19" fontWeight="800" fill="#E4C979" fontStyle="italic">VS</text>
    </svg>
  );
}

function LaneRow({ icon: Icon, label, mine, rival }: { icon: typeof Target; label: string; mine: number; rival: number }) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      {/* 내 값 */}
      <span className="text-sm font-bold tabular-nums w-10 text-right flex-shrink-0" style={{ color: MINE_COLOR }}>{mine}%</span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden flex flex-row-reverse" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full" style={{ width: `${mine}%`, background: MINE_COLOR }} />
      </div>
      {/* 라벨 */}
      <div className="flex items-center gap-1.5 w-24 justify-center flex-shrink-0">
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
      {/* 상단 매치업 헤더 — 단일 톤 배경, md 이상에서 항상 3열(좌/VS/우), 그 아래는 세로로 쌓임 */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 md:gap-5 px-6 py-7"
        style={{ background: 'oklch(0.98 0.008 85)' }}>
        {/* 좌: 나 */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'white', border: `2.5px solid ${MINE_COLOR}` }}>
              <User size={28} style={{ color: MINE_COLOR }} />
            </div>
            <span className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-md font-bold text-white" style={{ background: AXIS_NAVY }}>나</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs" style={{ color: TEXT_MUTE }}>이번 주 성장</div>
            <div className="text-3xl font-black tabular-nums leading-tight" style={{ color: MINE_COLOR }}>
              {matchup.myWeeklyGrowthPct >= 0 ? '+' : ''}{matchup.myWeeklyGrowthPct}%<span className="text-sm ml-0.5">▲</span>
            </div>
            <div className="text-xs" style={{ color: TEXT_MUTE }}>{matchup.myPercentileLabel}</div>
          </div>
          <div className="ml-auto md:ml-2">
            <MiniTrend points={matchup.myTrend} color={MINE_COLOR} />
          </div>
        </div>

        {/* 중앙: VS 메달 */}
        <div className="flex flex-col items-center justify-self-center px-2"><VsMedallion /></div>

        {/* 우: Rival */}
        <div className="flex items-center gap-4 min-w-0 md:flex-row-reverse">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'white', border: `2.5px solid ${RIVAL_COLOR}` }}>
              <GraduationCap size={26} style={{ color: RIVAL_COLOR }} />
            </div>
            <span className="absolute -top-1 -left-1 text-xs px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap" style={{ background: 'white', color: RIVAL_COLOR, border: `1px solid ${RIVAL_COLOR}55` }}>{rivalLabel}</span>
          </div>
          <div className="min-w-0 md:text-right">
            <div className="text-xs" style={{ color: TEXT_MUTE }}>{rivalLabel} 성장</div>
            <div className="text-3xl font-black tabular-nums leading-tight" style={{ color: RIVAL_COLOR }}>
              {matchup.rivalWeeklyGrowthPct >= 0 ? '+' : ''}{matchup.rivalWeeklyGrowthPct}%
            </div>
            <div className="text-xs" style={{ color: TEXT_MUTE }}>{matchup.rivalPercentileLabel}</div>
          </div>
          <div className="mr-auto md:mr-2">
            <MiniTrend points={matchup.rivalTrend} color={RIVAL_COLOR} align="right" />
          </div>
        </div>
      </div>

      {/* 비교 레인 */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
        {matchup.lanes.map((lane) => (
          <LaneRow key={lane.key} icon={laneIcon[lane.key]} label={lane.label} mine={lane.mine} rival={lane.rival} />
        ))}
      </div>

      {/* 하단 CTA — 딥 네이비 바탕에 Gold 강조(카드 전체에서 유일하게 진한 색을 쓰는 지점) */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 flex-wrap" style={{ background: AXIS_NAVY }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'oklch(0.98 0.008 85 / 0.12)' }}>
            <Trophy size={19} style={{ color: AXIS_GOLD }} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-white">
              {matchup.leadingThisWeek ? '이번 주는 내가 앞서가고 있어요' : '이번 주, 조금만 더 힘내볼까요?'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.85 0.01 250)' }}>{matchup.encouragement}</div>
          </div>
        </div>
        <button onClick={onDetail}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold flex-shrink-0 cursor-pointer"
          style={{ background: AXIS_GOLD, color: AXIS_NAVY }}>
          상세 매치업 보기
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
