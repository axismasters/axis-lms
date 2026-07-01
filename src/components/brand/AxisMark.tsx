// AXIS LMS v1.2 - AxisMark (Phase 3D v3-r9-r1)
//
// [교체 이력] v3-r8에서는 이 컴포넌트가 SVG 도형(모노라인 "A" + 대각선)으로 마크를
// 직접 그렸다 — 실제 브랜드 이미지와 다르게 보여 "허접한 임의 마크"라는 피드백을
// 받았다. v3-r9-r1부터는 사용자가 제공한 실제 AXIS 마크 이미지(정사각 패딩 처리,
// 짙은 네이비 배경 + 흰 "A" + 대각선 골드 슬래시 내장)를 그대로 사용한다 — 재해석
// 없이 이미지 그대로. 배경/색상이 이미지에 내장되어 있으므로 별도 색상 prop은
// 받지 않는다(부모가 감싸는 색상 배경 div도 더 이상 필요 없다).

import axisMarkIcon from '@/assets/brand/axis-mark-icon.png';

interface AxisMarkProps {
  size?: number;
  className?: string;
}

export function AxisMark({ size = 24, className }: AxisMarkProps) {
  return (
    <img
      src={axisMarkIcon}
      alt="AXIS"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: '22%', display: 'block' }}
    />
  );
}
