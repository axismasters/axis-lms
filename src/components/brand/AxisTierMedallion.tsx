// AXIS LMS v1.2 — Phase 3D v3-r10-r1: AxisTierMedallion
//
// AXIS 성장 단계(Seed → Foundation → Focus → Strategy → Mastery → Axis Master)를
// 나타내는 방패형 메달. 04-tier-system-board.png 기준으로, 게임 랭크 아이콘이 아니라
// "학습 성장 단계 심볼"(새싹/기둥/조준/나침반/책/축의 별)로 그린다.
//
// ⚠ Mastery / Axis Master 단계만 딥 네이비+골드 프리미엄 프레임(방패)을 쓴다.
//    하위 단계는 밝은 아이보리 배경 + 단계 색 라인아트로 "가벼운 프리미엄" 톤 유지.

import { useId } from 'react';
import type { StudentTier } from '@/lib/growthData';
import { TIER_COLORS, TIER_IS_PREMIUM_FRAME } from '@/lib/growthData';

interface AxisTierMedallionProps {
  tier: StudentTier;
  size?: number;
  className?: string;
}

function TierSymbol({ tier, color }: { tier: StudentTier; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (tier) {
    case 'SEED': // 새싹
      return (
        <g transform="translate(30 26)">
          <path d="M20 40 C20 30 20 24 20 18" {...s} />
          <path d="M20 22 C12 22 8 16 8 10 C16 10 20 16 20 22 Z" fill={color} stroke="none" opacity={0.9} />
          <path d="M20 18 C28 18 32 12 32 6 C24 6 20 12 20 18 Z" fill={color} stroke="none" opacity={0.9} />
          <path d="M10 42 h20" {...s} strokeWidth={2.4} />
        </g>
      );
    case 'FOUNDATION': // 기둥
      return (
        <g transform="translate(28 24)">
          <rect x="6" y="6" width="28" height="4" rx="1.5" fill={color} stroke="none" />
          <rect x="8" y="36" width="24" height="5" rx="1.5" fill={color} stroke="none" />
          {[11, 18, 25, 29].map((x, i) => <line key={i} x1={x} y1="12" x2={x} y2="35" {...s} strokeWidth={2.6} />)}
        </g>
      );
    case 'FOCUS': // 조준(집중)
      return (
        <g transform="translate(28 22)">
          <circle cx="22" cy="22" r="18" {...s} />
          <circle cx="22" cy="22" r="9" {...s} />
          <circle cx="22" cy="22" r="2.6" fill={color} stroke="none" />
          <line x1="22" y1="0" x2="22" y2="6" {...s} />
          <line x1="22" y1="38" x2="22" y2="44" {...s} />
          <line x1="0" y1="22" x2="6" y2="22" {...s} />
          <line x1="38" y1="22" x2="44" y2="22" {...s} />
        </g>
      );
    case 'STRATEGY': // 나침반 별(방향성)
      return (
        <g transform="translate(28 22)">
          <circle cx="22" cy="22" r="18" {...s} />
          <path d="M22 5 l4 15 l15 2 l-15 2 l-4 15 l-4 -15 l-15 -2 l15 -2 Z" fill={color} stroke="none" opacity={0.92} />
        </g>
      );
    case 'MASTERY': // 펼친 책(내면화)
      return (
        <g transform="translate(24 26)">
          <path d="M26 6 C20 2 8 2 3 6 L3 34 C8 30 20 30 26 34 C32 30 44 30 49 34 L49 6 C44 2 32 2 26 6 Z" fill={color} stroke="none" opacity={0.95} />
          <line x1="26" y1="6" x2="26" y2="34" stroke="#081428" strokeWidth={2} />
        </g>
      );
    case 'AXIS_MASTER': // 축의 별(완성) — 왕관 별
      return (
        <g transform="translate(26 20)">
          <path d="M24 2 l5 18 l18 4 l-18 4 l-5 18 l-5 -18 l-18 -4 l18 -4 Z" fill={color} stroke="none" />
          <circle cx="24" cy="24" r="3.4" fill="#081428" />
        </g>
      );
    default: // UNRANKED — 옅은 원
      return <circle cx="50" cy="46" r="12" fill="none" stroke={color} strokeWidth={2.4} strokeDasharray="3 3" />;
  }
}

export function AxisTierMedallion({ tier, size = 96, className }: AxisTierMedallionProps) {
  const rid = useId();
  const gid = `tier${rid.replace(/[:]/g, '')}`;
  const color = TIER_COLORS[tier];
  const premium = TIER_IS_PREMIUM_FRAME[tier];
  const gold = '#C8A15A';

  // 방패 외곽 path(공용)
  const shield = 'M50 6 C38 14 22 17 14 17 C14 44 22 74 50 92 C78 74 86 44 86 17 C78 17 62 14 50 6 Z';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="성장 단계">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={premium ? '#12233B' : '#FFFFFF'} />
          <stop offset="100%" stopColor={premium ? '#081428' : '#FBF9F4'} />
        </linearGradient>
      </defs>

      {premium && (
        // 프리미엄 단계: 골드 이중 프레임
        <>
          <path d={shield} fill={gold} />
          <path d="M50 10 C39 17 24 20 17 20 C17 44 24 71 50 87 C76 71 83 44 83 20 C76 20 61 17 50 10 Z" fill={`url(#${gid})`} stroke="#081428" strokeWidth={1} />
          <path d="M50 15 C40 21 27 24 21 24 C21 45 27 68 50 82 C73 68 79 45 79 24 C73 24 60 21 50 15 Z" fill="none" stroke={gold} strokeWidth={1.2} opacity={0.75} />
        </>
      )}
      {!premium && (
        // 하위 단계: 밝은 배경 + 단계색 라인 프레임
        <>
          <path d={shield} fill={`url(#${gid})`} stroke={color} strokeWidth={2.4} />
          <path d="M50 14 C40 20 27 23 21 23 C21 45 27 69 50 84 C73 69 79 45 79 23 C73 23 60 20 50 14 Z" fill="none" stroke={gold} strokeWidth={1} opacity={0.5} />
        </>
      )}

      <TierSymbol tier={tier} color={premium ? gold : color} />

      {/* 하단 리본 라인(프리미엄만) */}
      {premium && <path d="M30 74 h40" stroke={gold} strokeWidth={1.6} opacity={0.7} />}
    </svg>
  );
}
