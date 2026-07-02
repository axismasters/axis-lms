// AXIS LMS v1.2 — Phase 3D v3-r11: AxisEmblemPlaque
//
// 엠블럼 메달 아래 붙는 골드 테두리 네임 플레이트. AxisEmblemBadge(메달)에 내장하지 않고
// 별도 컴포넌트로 분리한 이유: 엠블럼 이름 길이가 화면마다 다르므로(영문/국문, 1~2줄)
// SVG에 좌표를 하드코딩하기보다 HTML/CSS로 텍스트 줄바꿈·말줄임을 안전하게 처리한다.
//
// 사용처: StudentGrowthShowcase의 "대표 엠블럼"처럼 이름을 크게 보여줘야 하는 자리에서만
// AxisEmblemBadge와 함께 조합해서 쓴다. 목록/그리드형 작은 배지(20~72px)에는 붙이지 않는다
// (그 크기에서는 플레이트 텍스트가 뭉개진다).

import { AXIS_NAVY, AXIS_GOLD, AXIS_IVORY } from '@/lib/brandColors';

export function AxisEmblemPlaque({
  title, subtitle, accent = AXIS_GOLD, className,
}: {
  /** 굵게 표시되는 상단 라인(엠블럼 정식 명칭) */
  title: string;
  /** 하단 보조 라인(파렌트-세이프 라벨 등) */
  subtitle?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(180deg, ${AXIS_NAVY} 0%, #04101F 100%)`,
        border: `1.5px solid ${accent}`,
        borderRadius: 8,
        padding: '6px 14px',
        textAlign: 'center',
        boxShadow: `inset 0 0 0 1px ${accent}33`,
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          fontSize: 12, fontWeight: 700, color: accent, letterSpacing: '0.04em',
          lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 11, color: AXIS_IVORY, opacity: 0.82, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
