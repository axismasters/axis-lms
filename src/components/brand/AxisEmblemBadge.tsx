// AXIS LMS v1.2 — Premium Achievement Emblem Renderer
// Reference direction: classic academic medal, deep navy enamel, gold bevels, laurel,
// top jewel, inner symbolic icon, and lower name-plate form.

import { useId } from 'react';
import type { EmblemIconKey, EmblemLevel } from '@/lib/growthData';
import { EMBLEM_LEVEL_STYLE } from '@/lib/growthData';

interface AxisEmblemBadgeProps {
  iconKey?: EmblemIconKey;
  level?: EmblemLevel;
  accent?: string;
  size?: number;
  locked?: boolean;
  className?: string;
}

function EmblemSymbol({ iconKey, color }: { iconKey: EmblemIconKey; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (iconKey) {
    case 'calc':
      return (
        <g transform="translate(15 14)">
          <rect x="2" y="2" width="20" height="28" rx="3" {...s} />
          <line x1="6" y1="9" x2="18" y2="9" {...s} />
          <circle cx="8" cy="16" r="1.4" fill={color} stroke="none" />
          <circle cx="14" cy="16" r="1.4" fill={color} stroke="none" />
          <circle cx="8" cy="22" r="1.4" fill={color} stroke="none" />
          <path d="M20 20 l4 5 l7 -9" {...s} strokeWidth={3.4} />
        </g>
      );
    case 'concept':
      return (
        <g transform="translate(13 16)">
          <path d="M17 4 C12 1 5 1 2 4 L2 24 C5 21 12 21 17 24 C22 21 29 21 32 24 L32 4 C29 1 22 1 17 4 Z" {...s} />
          <line x1="17" y1="4" x2="17" y2="24" {...s} />
          <circle cx="24" cy="9" r="1.6" fill={color} stroke="none" />
          <circle cx="27" cy="14" r="1.6" fill={color} stroke="none" />
          <line x1="24" y1="9" x2="27" y2="14" {...s} strokeWidth={2} />
        </g>
      );
    case 'time':
      return (
        <g transform="translate(15 15)">
          <circle cx="15" cy="15" r="14" {...s} />
          <path d="M15 7 v8 l6 4" {...s} strokeWidth={3.2} />
        </g>
      );
    case 'steady':
      return (
        <g transform="translate(14 14)">
          <line x1="3" y1="30" x2="3" y2="20" {...s} />
          <line x1="12" y1="30" x2="12" y2="14" {...s} />
          <line x1="21" y1="30" x2="21" y2="8" {...s} />
          <path d="M5 12 l8 -7 l6 4 l7 -8" {...s} />
          <path d="M26 1 l3 0 l0 3" {...s} />
        </g>
      );
    case 'comeback':
      return (
        <g transform="translate(13 15)">
          <path d="M2 8 l6 8 l6 -3 l10 -11" {...s} />
          <path d="M20 2 l4 0 l0 4" {...s} />
          <path d="M2 26 l30 0" {...s} strokeWidth={2} opacity={0.5} />
        </g>
      );
    case 'weekly':
      return (
        <g transform="translate(14 13)">
          <rect x="2" y="4" width="24" height="24" rx="3" {...s} />
          <line x1="2" y1="11" x2="26" y2="11" {...s} />
          <line x1="9" y1="1" x2="9" y2="6" {...s} />
          <line x1="19" y1="1" x2="19" y2="6" {...s} />
          <path d="M9 19 l4 4 l7 -8" {...s} strokeWidth={3.2} />
        </g>
      );
    case 'focus':
      return (
        <g transform="translate(15 15)">
          <circle cx="15" cy="15" r="14" {...s} />
          <path d="M15 3 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 Z" fill={color} stroke="none" opacity={0.9} />
        </g>
      );
    case 'reflection':
      return (
        <g transform="translate(13 13)">
          <path d="M6 2 h13 l6 6 v14 a2 2 0 0 1 -2 2 h-17 a2 2 0 0 1 -2 -2 v-18 a2 2 0 0 1 2 -2 Z" {...s} />
          <circle cx="14" cy="16" r="5" {...s} />
          <line x1="18" y1="20" x2="23" y2="25" {...s} strokeWidth={3.2} />
        </g>
      );
    case 'streak':
      return (
        <g transform="translate(15 14)">
          <path d="M15 3 l3.4 7 l7.6 0.8 l-5.6 5.2 l1.6 7.6 l-7 -4 l-7 4 l1.6 -7.6 l-5.6 -5.2 l7.6 -0.8 Z" fill={color} stroke="none" />
          <path d="M5 27 C14 33 26 29 31 20" {...s} strokeWidth={2} opacity={0.65} />
        </g>
      );
    case 'mentor':
      return (
        <g transform="translate(15 13)">
          <path d="M15 2 C11 5 6 6 3 6 C3 16 6 24 15 29 C24 24 27 16 27 6 C24 6 19 5 15 2 Z" {...s} />
          <path d="M15 10 l2 4.5 l5 0.4 l-3.8 3.3 l1.2 4.8 l-4.4 -2.6 l-4.4 2.6 l1.2 -4.8 l-3.8 -3.3 l5 -0.4 Z" fill={color} stroke="none" />
        </g>
      );
    case 'attendance':
      return (
        <g transform="translate(14 13)">
          <rect x="2" y="4" width="24" height="24" rx="3" {...s} />
          <line x1="2" y1="11" x2="26" y2="11" {...s} />
          <circle cx="9" cy="18" r="2" fill={color} stroke="none" />
          <circle cx="16" cy="18" r="2" fill={color} stroke="none" />
          <circle cx="9" cy="24" r="2" fill={color} stroke="none" />
        </g>
      );
    default:
      return (
        <g transform="translate(15 14)">
          <path d="M15 2 l2.6 8.8 l9 0 l-7.3 5.4 l2.8 8.6 l-7.1 -5.3 l-7.1 5.3 l2.8 -8.6 l-7.3 -5.4 l9 0 Z" fill={color} stroke="none" opacity={0.92} />
        </g>
      );
  }
}

function LaurelSide({ color, side }: { color: string; side: 'left' | 'right' }) {
  const flip = side === 'right' ? 'scale(-1 1) translate(-140 0)' : '';
  return (
    <g transform={flip} opacity="0.92">
      <path d="M42 104 C23 89 20 64 31 45" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 31 + i * 2.3;
        const y = 52 + i * 8;
        return <ellipse key={i} cx={x} cy={y} rx="7.2" ry="3.1" fill={color} transform={`rotate(-40 ${x} ${y})`} />;
      })}
    </g>
  );
}

function TinyStars({ color }: { color: string }) {
  return (
    <g opacity="0.72" fill={color}>
      <path d="M35 47 l1.4 3.5 l3.6 1 l-3.4 1.3 l-1.6 3.4 l-1.2 -3.6 l-3.4 -1.2 l3.4 -1.2 Z" />
      <path d="M99 45 l1 2.6 l2.7 0.8 l-2.5 1 l-1.2 2.5 l-0.9 -2.7 l-2.5 -0.9 l2.5 -0.9 Z" />
      <circle cx="102" cy="78" r="1.5" />
      <circle cx="39" cy="83" r="1.2" />
    </g>
  );
}

export function AxisEmblemBadge({
  iconKey = 'generic', level = 'BASIC', accent, size = 96, locked = false, className,
}: AxisEmblemBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const style = EMBLEM_LEVEL_STYLE[level];
  const ring = style.ring;
  const plate = style.plate;
  const symbolColor = accent ?? style.accent;
  const jewel = style.premium ? '#1F5B85' : symbolColor;
  const plateId = `axis-emblem-plate-${uid}`;
  const rimId = `axis-emblem-rim-${uid}`;
  const jewelId = `axis-emblem-jewel-${uid}`;
  const shadowId = `axis-emblem-shadow-${uid}`;

  if (locked) {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={className} role="img" aria-label="다음 성장 목표">
        <defs>
          <linearGradient id={rimId} x1="24" y1="16" x2="112" y2="126">
            <stop offset="0%" stopColor="#F4E8C8" />
            <stop offset="55%" stopColor="#CBB98D" />
            <stop offset="100%" stopColor="#FFF8DF" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="66" r="45" fill="#FBF7EE" stroke={`url(#${rimId})`} strokeWidth="5" strokeDasharray="8 6" />
        <circle cx="70" cy="66" r="35" fill="#F0EBE0" stroke="#D8CFBE" strokeWidth="1.5" />
        <path d="M70 42 v48 M46 66 h48" stroke="#B9AE97" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        <path d="M45 112 H95 L88 124 H52 Z" fill="#F6F0E4" stroke="#D8CFBE" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 140 140" className={className} role="img" aria-label="성취 엠블럼">
      <defs>
        <radialGradient id={plateId} cx="38%" cy="28%" r="76%">
          <stop offset="0%" stopColor={plate} />
          <stop offset="58%" stopColor="#0B1B33" />
          <stop offset="100%" stopColor="#030914" />
        </radialGradient>
        <linearGradient id={rimId} x1="24" y1="8" x2="118" y2="134">
          <stop offset="0%" stopColor="#FFF4C7" />
          <stop offset="22%" stopColor={ring} />
          <stop offset="50%" stopColor="#8A6D2E" />
          <stop offset="76%" stopColor="#E4C979" />
          <stop offset="100%" stopColor="#FFF1B8" />
        </linearGradient>
        <radialGradient id={jewelId} cx="36%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="42%" stopColor={jewel} />
          <stop offset="100%" stopColor="#081428" />
        </radialGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#040D1E" floodOpacity="0.24" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <LaurelSide color={ring} side="left" />
        <LaurelSide color={ring} side="right" />

        <path d="M70 7 l10 12 l-10 12 l-10 -12 Z" fill={`url(#${jewelId})`} stroke="#0B1B33" strokeWidth="1.8" />
        <path d="M70 7 l10 12 l-10 12 Z" fill="#000" opacity="0.15" />

        <circle cx="70" cy="66" r="48" fill={`url(#${rimId})`} stroke="#071427" strokeWidth="1.8" />
        <circle cx="70" cy="66" r="42" fill={`url(#${plateId})`} stroke="#F8E7A2" strokeWidth="1.3" />
        <circle cx="70" cy="66" r="34" fill="none" stroke={ring} strokeWidth={style.premium ? 2 : 1.4} opacity="0.88" />
        <circle cx="70" cy="66" r="27" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.16" />
        <path d="M41 45 C55 30 83 28 100 45 C82 42 59 42 41 45 Z" fill="#FFFFFF" opacity="0.12" />
        <TinyStars color="#F8E7A2" />

        <g transform="translate(43 38) scale(1.45)">
          <EmblemSymbol iconKey={iconKey} color={symbolColor} />
        </g>

        <path d="M38 105 H102 L110 114 L101 124 H39 L30 114 Z" fill="#0B1B33" stroke={`url(#${rimId})`} strokeWidth="3" />
        <path d="M44 111 H96" stroke="#F8E7A2" strokeWidth="1.2" opacity="0.7" />
        <path d="M70 124 l5 6 l-5 6 l-5 -6 Z" fill={`url(#${rimId})`} stroke="#071427" strokeWidth="1" />
      </g>
    </svg>
  );
}
