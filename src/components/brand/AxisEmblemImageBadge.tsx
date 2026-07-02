// AXIS LMS v1.2 — Phase 3D v3-r14 / r14-r1: AxisEmblemImageBadge
//
// ⚠ 매우 중요: 이 파일은 기존 AxisEmblemBadge.tsx(SVG 렌더러)를 단 한 줄도 수정하지
// 않기 위해 신규로 추가했다. 이 프로젝트는 여러 Phase에 걸쳐 "엠블럼 디자인 파일 절대
// 수정 금지"를 지켜왔고(v3-r11 계열 재설계가 3~4연속 반려된 전례), 이번 v3-r14는
// 검수 통과한 PNG 에셋을 "추가로 얹는" 작업이지 기존 SVG 디자인을 바꾸는 작업이 아니다.
// 그래서 기존 컴포넌트를 건드리는 대신, 이 래퍼가 렌더링 분기를 전담한다:
//   - emblemEnabled === false → null(아무것도 렌더링하지 않음, SVG fallback도 없음)
//   - emblemEnabled === true  + PNG 매핑 있음 → PNG 이미지
//   - emblemEnabled === true  + PNG 매핑 없음 → 기존 AxisEmblemBadge SVG
// [Phase 3D v3-r14-r1] v3-r14는 OFF 상태에서도 SVG fallback이 그대로 보이는 노출 누수가
// 있었다(반려 사유) — 이번에 OFF를 최우선으로 검사해 완전히 null을 반환하도록 고쳤다.
//
// 사용법: 기존에 <AxisEmblemBadge iconKey={...} level={...} /> 를 쓰던 자리에서,
// growthData.ts 기존 엠블럼 id를 알고 있다면 <AxisEmblemImageBadge emblemId={...} iconKey={...} level={...} />
// 로 바꾸면 된다. OFF면 아무것도 안 보이고, ON이면 이미지 매핑 여부에 따라 PNG 또는 SVG로 보인다.

import { AxisEmblemBadge } from './AxisEmblemBadge';
import { getEmblemImageByExistingId } from '@/lib/emblemAssetManifest';
import { isEmblemEnabled } from '@/lib/systemFeatureFlags';
import type { EmblemIconKey, EmblemLevel } from '@/lib/growthData';

interface AxisEmblemImageBadgeProps {
  /** growthData.ts MOCK_EMBLEMS의 기존 id(예: 'emb-001', 'calc_precision_01'). 이미지
   *  매핑 조회 키로 쓴다 — 이 프로젝트가 관리하는 유일한 "진짜" 엠블럼 식별자다. */
  emblemId: string;
  /** 매핑 실패 시 기존 SVG fallback에 그대로 전달할 props(기존 호출부와 동일) */
  iconKey?: EmblemIconKey;
  level?: EmblemLevel;
  accent?: string;
  size?: number;
  locked?: boolean;
  className?: string;
}

export function AxisEmblemImageBadge({
  emblemId, iconKey, level, accent, size = 84, locked = false, className,
}: AxisEmblemImageBadgeProps) {
  // [Phase 3D v3-r14-r1] emblemEnabled가 false면 PNG는 물론 기존 SVG fallback도
  // 렌더링하지 않는다(v3-r14 반려 사유: OFF 상태에서도 SVG로 엠블럼이 보일 수 있었음).
  // 호출부가 emblemEnabled 체크를 빠뜨리는 실수를 해도 이 컴포넌트 자체가 최종 방어선이다.
  if (!isEmblemEnabled()) {
    return null;
  }

  const imageSrc = getEmblemImageByExistingId(emblemId);

  if (!imageSrc) {
    // 매핑이 없는 경우(§0 참고 — 애매한 항목은 의도적으로 비워둠) → ON 상태에서만 기존 SVG로.
    return <AxisEmblemBadge iconKey={iconKey} level={level} accent={accent} size={size} locked={locked} className={className} />;
  }

  if (locked) {
    // "다음 성장 목표" 표현 — 기존 SVG locked 스타일(옅은 아웃라인)과 톤을 맞춰,
    // 이미지 자체는 흐리게/저채도로 보여준다(원본 파일은 전혀 손대지 않음, CSS만 적용).
    return (
      <div
        className={className}
        role="img"
        aria-label="다음 성장 목표"
        style={{
          width: size, height: size, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#FBF9F4', border: '2px dashed #D8CFBE',
          overflow: 'hidden',
        }}
      >
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          style={{ width: '78%', height: '78%', objectFit: 'contain', filter: 'grayscale(1)', opacity: 0.35 }}
        />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt="성취 엠블럼"
      role="img"
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}

export default AxisEmblemImageBadge;
