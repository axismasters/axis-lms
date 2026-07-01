// AXIS LMS v1.2 - AxisWordmark (Phase 3D v3-r9-r1)
//
// [교체 이력] v3-r8에서는 SVG <text> + 대각선 <line>으로 워드마크를 직접 그렸다 —
// 폰트 렌더링에 따라 슬래시와 "X" 글자 위치가 브라우저마다 어긋날 수 있는 리스크가
// 있었고, 실제 브랜드 이미지와 미묘하게 달라 보였다. v3-r9-r1부터는 사용자가 제공한
// 실제 워드마크 이미지(밝은 배경용, 투명 배경 처리 완료 — Navy "A"/"I"/"S" + Gold "X"
// + 대각선 슬래시)를 그대로 사용한다. 배경이 투명하므로 밝은 배경 위 어디에 놓아도
// 자연스럽게 어울린다(어두운 배경에는 쓰지 않는다 — 그 경우 로그인 히어로처럼
// axis-hero-dark.png를 통째로 쓴다).

import axisWordmarkLight from '@/assets/brand/axis-wordmark-light.png';

interface AxisWordmarkProps {
  height?: number;
  className?: string;
}

export function AxisWordmark({ height = 40, className }: AxisWordmarkProps) {
  return (
    <img
      src={axisWordmarkLight}
      alt="AXIS"
      height={height}
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
