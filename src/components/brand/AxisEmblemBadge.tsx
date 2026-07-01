// AXIS LMS v1.2 — Phase 3D v3-r10-r1: AxisEmblemBadge
//
// 프리미엄 업적 배지 렌더러. 단일 🏅 이모지 UI를 폐기하고, 03-emblem-system-board.png
// 기준의 "네이비 원판 + 골드 링 + 월계관 + 젬 토퍼 + 의미 아이콘 + 네임 플레이트"
// 구조를 순수 SVG로 그린다(외부 이미지/폰트 의존 없음).
//
// ⚠ 브랜드/디자인 원칙:
//   - 색상은 AXIS 팔레트(Deep Navy / Gold / Ivory / Soft Teal / Muted Blue / Warm Amber)만
//     사용한다. 보라/네온/그라데이션 blob 금지.
//   - 이 컴포넌트는 실제 AXIS "마크/워드마크"가 아니라 "성취 엠블럼"이다 —
//     axis-mark-icon.png(브랜드 마크)를 대체하지 않는다(둘은 별개).
//   - 미획득(locked) 상태는 "잠금 금지 아이템"이 아니라 "다음 성장 목표"처럼 은은하게
//     보이도록 채도/불투명도를 낮춘 아웃라인으로 렌더한다.
//
// 레벨(EmblemLevel)에 따라 프레임 강도가 달라진다(EMBLEM_LEVEL_STYLE 참조):
//   BASIC → GROWTH → FOCUS → SIGNATURE → MASTER 순으로 골드 프레임/광택이 강해진다.

import type { EmblemIconKey, EmblemLevel } from '@/lib/growthData';
import { EMBLEM_LEVEL_STYLE } from '@/lib/growthData';

interface AxisEmblemBadgeProps {
  iconKey?: EmblemIconKey;
  level?: EmblemLevel;
  /** 강조 색(계열) — IF 사유/패밀리별 포인트. 없으면 레벨 accent 사용 */
  accent?: string;
  size?: number;
  /** 미획득(다음 목표) 상태 — 채도/불투명도 하향 */
  locked?: boolean;
  className?: string;
}

// ─── 의미 아이콘(SVG path) — 카탈로그 iconKey별 심볼 ────────────────────
// 각 심볼은 60x60 뷰박스(중앙 원판 안)에 그려지도록 좌표를 맞춘다.
function EmblemSymbol({ iconKey, color }: { iconKey: EmblemIconKey; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (iconKey) {
    case 'calc': // 계산 정밀 — 계산기 + 체크
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
    case 'concept': // 개념 완성 — 펼친 책 + 노드
      return (
        <g transform="translate(13 16)">
          <path d="M17 4 C12 1 5 1 2 4 L2 24 C5 21 12 21 17 24 C22 21 29 21 32 24 L32 4 C29 1 22 1 17 4 Z" {...s} />
          <line x1="17" y1="4" x2="17" y2="24" {...s} />
          <circle cx="24" cy="9" r="1.6" fill={color} stroke="none" />
          <circle cx="27" cy="14" r="1.6" fill={color} stroke="none" />
          <line x1="24" y1="9" x2="27" y2="14" {...s} strokeWidth={2} />
        </g>
      );
    case 'time': // 시간 컨트롤 — 시계
      return (
        <g transform="translate(15 15)">
          <circle cx="15" cy="15" r="14" {...s} />
          <path d="M15 7 v8 l6 4" {...s} strokeWidth={3.2} />
        </g>
      );
    case 'steady': // 꾸준한 성장 — 상승 막대 + 화살표
      return (
        <g transform="translate(14 14)">
          <line x1="3" y1="30" x2="3" y2="20" {...s} />
          <line x1="12" y1="30" x2="12" y2="14" {...s} />
          <line x1="21" y1="30" x2="21" y2="8" {...s} />
          <path d="M5 12 l8 -7 l6 4 l7 -8" {...s} />
          <path d="M26 1 l3 0 l0 3" {...s} />
        </g>
      );
    case 'comeback': // 역전 성장 — 하강 후 급상승 화살표
      return (
        <g transform="translate(13 15)">
          <path d="M2 8 l6 8 l6 -3 l10 -11" {...s} />
          <path d="M20 2 l4 0 l0 4" {...s} />
          <path d="M2 26 l30 0" {...s} strokeWidth={2} opacity={0.5} />
        </g>
      );
    case 'weekly': // 주간 꾸준함 — 캘린더 + 체크
      return (
        <g transform="translate(14 13)">
          <rect x="2" y="4" width="24" height="24" rx="3" {...s} />
          <line x1="2" y1="11" x2="26" y2="11" {...s} />
          <line x1="9" y1="1" x2="9" y2="6" {...s} />
          <line x1="19" y1="1" x2="19" y2="6" {...s} />
          <path d="M9 19 l4 4 l7 -8" {...s} strokeWidth={3.2} />
        </g>
      );
    case 'focus': // 고집중 세션 — 조준/컴퍼스 별
      return (
        <g transform="translate(15 15)">
          <circle cx="15" cy="15" r="14" {...s} />
          <path d="M15 3 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 Z" fill={color} stroke="none" opacity={0.85} />
        </g>
      );
    case 'reflection': // 복습 완료 — 문서 + 돋보기
      return (
        <g transform="translate(13 13)">
          <path d="M6 2 h13 l6 6 v14 a2 2 0 0 1 -2 2 h-17 a2 2 0 0 1 -2 -2 v-18 a2 2 0 0 1 2 -2 Z" {...s} />
          <circle cx="14" cy="16" r="5" {...s} />
          <line x1="18" y1="20" x2="23" y2="25" {...s} strokeWidth={3.2} />
        </g>
      );
    case 'streak': // 성장 연속 — 별 + 궤도
      return (
        <g transform="translate(15 14)">
          <path d="M15 3 l3.4 7 l7.6 0.8 l-5.6 5.2 l1.6 7.6 l-7 -4 l-7 4 l1.6 -7.6 l-5.6 -5.2 l7.6 -0.8 Z" fill={color} stroke="none" />
        </g>
      );
    case 'mentor': // 멘토 추천 — 방패 + 악수(단순화: 방패 + 별)
      return (
        <g transform="translate(15 13)">
          <path d="M15 2 C11 5 6 6 3 6 C3 16 6 24 15 29 C24 24 27 16 27 6 C24 6 19 5 15 2 Z" {...s} />
          <path d="M15 10 l2 4.5 l5 0.4 l-3.8 3.3 l1.2 4.8 l-4.4 -2.6 l-4.4 2.6 l1.2 -4.8 l-3.8 -3.3 l5 -0.4 Z" fill={color} stroke="none" />
        </g>
      );
    case 'attendance': // 출결 — 캘린더 도트
      return (
        <g transform="translate(14 13)">
          <rect x="2" y="4" width="24" height="24" rx="3" {...s} />
          <line x1="2" y1="11" x2="26" y2="11" {...s} />
          <circle cx="9" cy="18" r="2" fill={color} stroke="none" />
          <circle cx="16" cy="18" r="2" fill={color} stroke="none" />
          <circle cx="9" cy="24" r="2" fill={color} stroke="none" />
        </g>
      );
    default: // generic — AXIS 별 마크
      return (
        <g transform="translate(15 14)">
          <path d="M15 2 l2.6 8.8 l9 0 l-7.3 5.4 l2.8 8.6 l-7.1 -5.3 l-7.1 5.3 l2.8 -8.6 l-7.3 -5.4 l9 0 Z" fill={color} stroke="none" opacity={0.9} />
        </g>
      );
  }
}

// ─── 월계관(양쪽) — 획득 배지에만 표시 ────────────────────────────────
function Laurel({ color, side }: { color: string; side: 'l' | 'r' }) {
  const flip = side === 'r' ? 'scale(-1,1) translate(-100 0)' : '';
  return (
    <g transform={flip} opacity={0.9}>
      <path d="M30 78 C18 70 14 55 16 40" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 44 + i * 7;
        const x = 17 + i * 2.4;
        return <ellipse key={i} cx={x} cy={y} rx={4.4} ry={2.4} fill={color} transform={`rotate(-42 ${x} ${y})`} opacity={0.92} />;
      })}
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
  const gemColor = style.premium ? '#E4C979' : symbolColor;

  if (locked) {
    // "다음 성장 목표" — 옅은 아웃라인 + 자물쇠 힌트(위협적이지 않게)
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="다음 성장 목표">
        <circle cx="50" cy="46" r="30" fill="#FBF9F4" stroke="#D8CFBE" strokeWidth={2} strokeDasharray="4 4" />
        <g opacity={0.5}>
          <rect x="42" y="42" width="16" height="13" rx="2.5" fill="none" stroke="#B9AE97" strokeWidth={2.4} />
          <path d="M45 42 v-3 a5 5 0 0 1 10 0 v3" fill="none" stroke="#B9AE97" strokeWidth={2.4} />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="성취 엠블럼">
      <defs>
        <radialGradient id={`plate-${iconKey}-${level}`} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor={plate} stopOpacity={0.98} />
          <stop offset="100%" stopColor="#040D1E" />
        </radialGradient>
      </defs>

      {/* 월계관 */}
      <Laurel color={ring} side="l" />
      <Laurel color={ring} side="r" />

      {/* 젬 토퍼(다이아 형태) */}
      <path d="M50 6 l7 7 l-7 7 l-7 -7 Z" fill={gemColor} stroke="#040D1E" strokeWidth={1.4} />
      <path d="M50 6 l7 7 l-7 7 Z" fill="#000" opacity={0.12} />

      {/* 외곽 골드 링 + 네이비 원판 */}
      <circle cx="50" cy="46" r="31" fill={ring} />
      <circle cx="50" cy="46" r="28" fill={`url(#plate-${iconKey}-${level})`} stroke="#040D1E" strokeWidth={1} />
      {/* 내측 얇은 골드 트림 */}
      <circle cx="50" cy="46" r="24.5" fill="none" stroke={ring} strokeWidth={style.premium ? 1.4 : 0.9} opacity={0.85} />
      {/* 상단 광택 하이라이트 */}
      <ellipse cx="43" cy="34" rx="12" ry="6" fill="#FFFFFF" opacity={0.08} />

      {/* 의미 아이콘 */}
      <g transform="translate(20 16) scale(1)">
        <EmblemSymbol iconKey={iconKey} color={symbolColor} />
      </g>
    </svg>
  );
}
