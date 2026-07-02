// AXIS LMS v1.2 — Phase 3D v3-r14: AxisTierImageMedallion
//
// AxisEmblemImageBadge.tsx와 동일한 이유로 신규 추가했다 — 기존 AxisTierMedallion.tsx
// (SVG 방패 렌더러)는 한 줄도 수정하지 않는다. Tier PNG가 있으면 이미지를, 없으면
// (예: UNRANKED) 기존 SVG 메달리온을 그대로 호출한다.
//
// ⚠ 지시서 원칙(Phase 3D v3-r14 §7): 학생 화면은 Tier 이미지 표시 가능, 교사 화면은
// 상담 지표로 표시 가능. 학부모 화면에는 이 컴포넌트를 쓰지 않는다(Tier 명칭 직접
// 노출 금지 원칙 — 학부모 화면은 계속 기존의 "성장 단계" 간접 표현만 쓴다).

import { AxisTierMedallion } from './AxisTierMedallion';
import { getTierImage } from '@/lib/emblemAssetManifest';
import type { StudentTier } from '@/lib/growthData';

interface AxisTierImageMedallionProps {
  tier: StudentTier;
  size?: number;
  className?: string;
}

export function AxisTierImageMedallion({ tier, size = 96, className }: AxisTierImageMedallionProps) {
  const imageSrc = getTierImage(tier);

  if (!imageSrc) {
    // UNRANKED 등 매핑 없음 → 기존 SVG 방패 메달리온 그대로.
    return <AxisTierMedallion tier={tier} size={size} className={className} />;
  }

  return (
    <img
      src={imageSrc}
      alt="성장 단계"
      role="img"
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}

export default AxisTierImageMedallion;
