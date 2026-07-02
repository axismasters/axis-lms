// AXIS LMS v1.2 — Phase 3D v3-r11: AxisEmblemBadge (Premium Medal, v2)
//
// v3-r10-r1 버전은 단색 원판 + 얇은 아웃라인 잎이라 "허접한 배지" 느낌이 강했다.
// v2는 실제 아카데믹 메달 구조를 SVG로 다시 짠다:
//   - 골드 링: 방사형 그라데이션 + 크리스프한 다크 네이비 킬라인(외곽/이음선)으로 베벨감.
//   - 월계관: 끝이 뾰족한 "잎" 패스(단순 타원 아님) + 중심맥 라인, 좌상단 고정 광원
//     그라데이션(잎이 회전해도 광원 방향이 일정하게 유지되도록 userSpaceOnUse 사용).
//   - 상단 보석: 패싯(면) 분리 다이아몬드 컷 + accent 색상(IF 사유별로 다르게 넘길 수 있음)
//     + 세팅 브라켓 + 스파클(글린트) 2개.
//   - 중앙 아이콘: 뒤에 은은한 소프트 글로우(방사형 그라데이션 원)를 깔아 입체감.
//
// ⚠ 브랜드/디자인 원칙(불변):
//   - 색상은 AXIS 팔레트만 사용(보라/네온/그라데이션 blob 금지).
//   - 이 컴포넌트는 "성취 엠블럼"이며 AXIS 마크/워드마크를 대체하지 않는다.
//   - 미획득(locked) 상태는 은은한 점선 아웃라인 "다음 성장 목표"로 유지.
//   - 이름표(플라크)는 이 컴포넌트에 내장하지 않는다 — 텍스트 길이가 화면마다 다르므로
//     별도의 AxisEmblemPlaque(HTML/CSS) 컴포넌트를 조합해서 쓴다(EmblemBadge + Plaque).
//
// 외부 API(props)는 v1과 100% 동일 — 기존 6개 호출부(EmblemManagement, TeacherStudentDetail,
// TeacherStudentGrowth, StudentGrowthShowcase, StudentMyPage) 수정 없이 시각만 업그레이드된다.

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

const CX = 50, CY = 47, RING_OUT = 30, RING_IN = 25;
const KEYLINE = '#04101F';

function EmblemSymbol({ iconKey, color }: { iconKey: EmblemIconKey; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 3.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (iconKey) {
    case 'calc':
      return (
        <g transform="translate(15 14)">
          <rect x="2" y="2" width="20" height="28" rx="3" {...s} />
          <line x1="6" y1="9" x2="18" y2="9" {...s} />
          <circle cx="8" cy="16" r="1.5" fill={color} stroke="none" />
          <circle cx="14" cy="16" r="1.5" fill={color} stroke="none" />
          <circle cx="8" cy="22" r="1.5" fill={color} stroke="none" />
          <path d="M20 20 l4 5 l7 -9" {...s} strokeWidth={3.6} />
        </g>
      );
    case 'concept':
      return (
        <g transform="translate(13 16)">
          <path d="M17 4 C12 1 5 1 2 4 L2 24 C5 21 12 21 17 24 C22 21 29 21 32 24 L32 4 C29 1 22 1 17 4 Z" {...s} />
          <line x1="17" y1="4" x2="17" y2="24" {...s} />
          <circle cx="24" cy="9" r="1.7" fill={color} stroke="none" />
          <circle cx="27" cy="14" r="1.7" fill={color} stroke="none" />
          <line x1="24" y1="9" x2="27" y2="14" {...s} strokeWidth={2.1} />
        </g>
      );
    case 'time':
      return (
        <g transform="translate(15 15)">
          <circle cx="15" cy="15" r="14" {...s} />
          <path d="M15 7 v8 l6 4" {...s} strokeWidth={3.4} />
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
          <path d="M9 19 l4 4 l7 -8" {...s} strokeWidth={3.4} />
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
          <line x1="18" y1="20" x2="23" y2="25" {...s} strokeWidth={3.4} />
        </g>
      );
    case 'streak':
      return (
        <g transform="translate(15 14)">
          <path d="M15 3 l3.4 7 l7.6 0.8 l-5.6 5.2 l1.6 7.6 l-7 -4 l-7 4 l1.6 -7.6 l-5.6 -5.2 l7.6 -0.8 Z" fill={color} stroke="none" />
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
          <circle cx="9" cy="18" r="2.1" fill={color} stroke="none" />
          <circle cx="16" cy="18" r="2.1" fill={color} stroke="none" />
          <circle cx="9" cy="24" r="2.1" fill={color} stroke="none" />
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

const LAUREL_NODES: { a: number; r: number; len: number }[] = [
  { a: 100.0, r: 34.0, len: 11.5 },
  { a: 121.2, r: 39.9, len: 10.3 },
  { a: 142.4, r: 43.5, len: 9.1 },
  { a: 163.6, r: 43.5, len: 7.9 },
  { a: 184.8, r: 39.9, len: 6.7 },
  { a: 206.0, r: 34.0, len: 5.5 },
];

function leafPoint(a: number, r: number) {
  const rad = (a * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function Leaf({ x, y, len, rot, gradId }: { x: number; y: number; len: number; rot: number; gradId: string }) {
  const w = len * 0.34;
  const d = `M 0 0 Q ${len * 0.32} ${w} ${len * 0.68} ${w * 0.55} Q ${len * 0.92} ${w * 0.2} ${len} 0 ` +
    `Q ${len * 0.68} ${-w * 0.55} ${len * 0.32} ${-w} Q ${len * 0.1} ${-w * 0.4} 0 0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={d} fill={`url(#${gradId})`} stroke={KEYLINE} strokeWidth={0.45} />
      <line x1={len * 0.06} y1={0} x2={len * 0.9} y2={0} stroke={KEYLINE} strokeWidth={0.35} opacity={0.4} />
    </g>
  );
}

function LaurelWreath({ gradId, stemColor }: { gradId: string; stemColor: string }) {
  const left = LAUREL_NODES.map(n => ({ ...leafPoint(n.a, n.r), a: n.a, len: n.len }));
  const right = left.map(p => ({ x: CX - (p.x - CX), y: p.y, a: 180 - p.a, len: p.len }));

  const stemPath = (pts: { x: number; y: number }[]) => {
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1].x + pts[i].x) / 2, my = (pts[i - 1].y + pts[i].y) / 2;
      d += `Q ${pts[i - 1].x.toFixed(1)} ${pts[i - 1].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `;
    }
    d += `L ${pts[pts.length - 1].x.toFixed(1)} ${pts[pts.length - 1].y.toFixed(1)}`;
    return d;
  };

  return (
    <g opacity={0.97}>
      <path d={stemPath(left)} fill="none" stroke={stemColor} strokeWidth={0.9} strokeLinecap="round" opacity={0.7} />
      <path d={stemPath(right)} fill="none" stroke={stemColor} strokeWidth={0.9} strokeLinecap="round" opacity={0.7} />
      {left.map((p, i) => <Leaf key={`l${i}`} x={p.x} y={p.y} len={p.len} rot={p.a + 90 + 8} gradId={gradId} />)}
      {right.map((p, i) => <Leaf key={`r${i}`} x={p.x} y={p.y} len={p.len} rot={p.a - 90 - 8} gradId={gradId} />)}
    </g>
  );
}

export function AxisEmblemBadge({
  iconKey = 'generic', level = 'BASIC', accent, size = 84, locked = false, className,
}: AxisEmblemBadgeProps) {
  const style = EMBLEM_LEVEL_STYLE[level];
  const ring = style.ring;
  const plate = style.plate;
  const symbolColor = accent ?? style.accent;
  const gemColor = accent ?? (style.premium ? '#E4C979' : style.ring);
  const uid = `${iconKey}-${level}${accent ? '-a' : ''}`;

  if (locked) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="다음 성장 목표">
        <circle cx={CX} cy={CY} r={RING_IN} fill="#FBF9F4" stroke="#D8CFBE" strokeWidth={2} strokeDasharray="4 4" />
        <g opacity={0.5}>
          <rect x={CX - 8} y={CY - 4} width="16" height="13" rx="2.5" fill="none" stroke="#B9AE97" strokeWidth={2.4} />
          <path d={`M${CX - 5} ${CY - 4} v-3 a5 5 0 0 1 10 0 v3`} fill="none" stroke="#B9AE97" strokeWidth={2.4} />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="성취 엠블럼">
      <defs>
        <radialGradient id={`plate-${uid}`} cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor={plate} stopOpacity={0.98} />
          <stop offset="100%" stopColor="#04101F" />
        </radialGradient>
        <radialGradient id={`ring-${uid}`} cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#FFF7DE" />
          <stop offset="55%" stopColor={ring} />
          <stop offset="100%" stopColor={ring} />
        </radialGradient>
        <linearGradient id={`leaf-${uid}`} x1={CX - 40} y1={CY - 40} x2={CX + 20} y2={CY + 30} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBEAAF" />
          <stop offset="100%" stopColor={ring} />
        </linearGradient>
        <linearGradient id={`gem-${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="45%" stopColor={gemColor} />
          <stop offset="100%" stopColor={gemColor} stopOpacity={0.75} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={symbolColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={symbolColor} stopOpacity={0} />
        </radialGradient>
      </defs>

      <LaurelWreath gradId={`leaf-${uid}`} stemColor={ring} />

      <path d="M50 8 L58 17.5 L50 24.5 L42 17.5 Z" fill={`url(#gem-${uid})`} stroke={KEYLINE} strokeWidth={0.7} />
      <path d="M50 8 L58 17.5 L50 17.5 Z" fill="#FFFFFF" opacity={0.3} />
      <path d="M50 8 L50 17.5 L42 17.5 Z" fill="#000000" opacity={0.12} />
      <rect x={45.5} y={20.5} width="9" height="6.5" fill={ring} stroke={KEYLINE} strokeWidth={0.5} />
      <path d="M36 12 l1.4 3 l3 1.2 l-3 1.2 l-1.4 3 l-1.4 -3 l-3 -1.2 l3 -1.2 Z" fill="#FFF7DE" opacity={0.85} />
      <path d="M65 15 l1 2.2 l2.2 0.9 l-2.2 0.9 l-1 2.2 l-1 -2.2 l-2.2 -0.9 l2.2 -0.9 Z" fill="#FFF7DE" opacity={0.7} />

      <circle cx={CX} cy={CY} r={RING_OUT} fill={`url(#ring-${uid})`} stroke={KEYLINE} strokeWidth={0.7} />
      <path d={`M ${CX - RING_OUT * 0.66} ${CY - RING_OUT * 0.75} A ${RING_OUT * 0.9} ${RING_OUT * 0.9} 0 0 1 ${CX + RING_OUT * 0.86} ${CY - RING_OUT * 0.4}`}
        fill="none" stroke="#FFFFFF" strokeWidth={1.3} opacity={0.4} strokeLinecap="round" />

      <circle cx={CX} cy={CY} r={RING_IN} fill={`url(#plate-${uid})`} stroke={KEYLINE} strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={RING_IN - 3.2} fill="none" stroke={ring} strokeWidth={0.55} opacity={0.85} />
      <ellipse cx={CX - 8} cy={CY - 9} rx="9" ry="5" fill="#FFFFFF" opacity={0.07} transform={`rotate(-28 ${CX - 8} ${CY - 9})`} />

      <circle cx={CX} cy={CY} r={RING_IN * 0.72} fill={`url(#glow-${uid})`} />
      <g transform="translate(20 16)">
        <EmblemSymbol iconKey={iconKey} color={symbolColor} />
      </g>
    </svg>
  );
}
