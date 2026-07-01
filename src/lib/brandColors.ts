// AXIS LMS v1.2 - Brand Color Tokens (Phase 3D v3-r8)
//
// AXIS 브랜드보드(BRAND MARK 문서) 기준 공식 색상값.
// ⚠ 임의로 새 색상 팔레트를 만들지 않는다 — 반드시 이 상수, 또는 index.css의
//   --brand-navy / --brand-gold / --brand-ivory CSS 변수를 통해서만 참조한다.
//
// HEX -> OKLCH 변환은 sRGB -> Linear -> OKLab -> OKLCh 표준 공식으로 정밀 계산했다
// (근사값 사용 금지 — 과거 #C9A84C 같은 근사 골드값 오류 재발 방지).

export const AXIS_NAVY = '#040D1E';
export const AXIS_GOLD = '#C8A15A';
export const AXIS_IVORY = '#F7F4EE';

// index.css의 --brand-* 변수와 동일한 값 (JS/TS 코드에서 CSS 변수 대신 상수가
// 필요한 경우에만 사용 — 가능하면 style={{ color: 'var(--brand-navy)' }} 형태를 우선한다).
export const AXIS_NAVY_OKLCH = 'oklch(0.1605 0.0394 259.41)';
export const AXIS_GOLD_OKLCH = 'oklch(0.730 0.101 81.09)';
export const AXIS_IVORY_OKLCH = 'oklch(0.968 0.009 84.57)';
