// AXIS LMS v1.2 - AxisWordmark (Phase 3D v3-r8)
//
// 브랜드보드 "BRAND MARK" 히어로 패널을 기준으로 구현한 AXIS 전체 워드마크.
// A / I / S는 letterColor, X는 accentColor(Gold)로 표시하고, X 위로 대각선
// 골드 슬래시가 화면 왼쪽 아래에서 오른쪽 위로 관통한다.
// 로그인 화면 등 브랜드 노출이 중요한 히어로 영역에서 사용한다.

interface AxisWordmarkProps {
  height?: number;
  letterColor?: string;
  accentColor?: string;
  className?: string;
}

export function AxisWordmark({
  height = 44,
  letterColor = '#081F4D',
  accentColor = '#C8A15A',
  className,
}: AxisWordmarkProps) {
  const gradId = `axisWordSlash-${letterColor.replace('#', '')}-${accentColor.replace('#', '')}`;

  return (
    <svg
      height={height}
      viewBox="0 0 400 130"
      className={className}
      role="img"
      aria-label="AXIS"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="30%" stopColor={accentColor} stopOpacity="1" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <text
        x="200"
        y="88"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Noto Serif KR', Georgia, 'Times New Roman', serif"
        fontSize="78"
        fontWeight="600"
        letterSpacing="12"
      >
        <tspan fill={letterColor}>A</tspan>
        <tspan fill={accentColor}>X</tspan>
        <tspan fill={letterColor}>IS</tspan>
      </text>
      {/* 시그니처 대각선 골드 슬래시 — X 글자를 관통해 위아래로 뻗는다 */}
      <line
        x1="148"
        y1="122"
        x2="234"
        y2="2"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
