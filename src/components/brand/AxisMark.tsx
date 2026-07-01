// AXIS LMS v1.2 - AxisMark (Phase 3D v3-r8)
//
// 브랜드보드 "LOGO MARK" 패널을 기준으로 구현한 AXIS 아이콘 마크.
// 모노라인 지오메트릭 "A" 글자 위로 대각선 골드 슬래시가 관통하는 형태.
// 사이드바/헤더의 작은 배지(정사각형 컨테이너) 안에 아이콘으로 쓰기 위한 용도이며,
// 배경 정사각형 색상은 이 컴포넌트를 감싸는 부모 요소가 담당한다
// (Navy 배경 위에는 letterColor=ivory/white, Gold 배경 위에는 letterColor=navy 권장).

interface AxisMarkProps {
  size?: number;
  letterColor?: string;
  slashColor?: string;
  className?: string;
}

export function AxisMark({
  size = 24,
  letterColor = '#F7F4EE',
  slashColor = '#C8A15A',
  className,
}: AxisMarkProps) {
  const gradId = `axisMarkSlash-${letterColor.replace('#', '')}-${slashColor.replace('#', '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="AXIS"
    >
      <defs>
        <linearGradient id={gradId} x1="8%" y1="100%" x2="96%" y2="0%">
          <stop offset="0%" stopColor={slashColor} stopOpacity="0.1" />
          <stop offset="50%" stopColor={slashColor} stopOpacity="1" />
          <stop offset="100%" stopColor={slashColor} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* 모노라인 "A" */}
      <path
        d="M50 15 L24 83 M50 15 L76 83 M34 61 L66 61"
        fill="none"
        stroke={letterColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 시그니처 대각선 골드 슬래시 */}
      <line
        x1="13"
        y1="91"
        x2="89"
        y2="7"
        stroke={`url(#${gradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
