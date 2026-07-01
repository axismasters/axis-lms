// AXIS LMS v1.2 - Brand Color Tokens (Phase 3D v3-r8)
//
// AXIS 브랜드보드(BRAND MARK 문서) 기준 공식 색상값.
// ⚠ 임의로 새 색상 팔레트를 만들지 않는다 — 반드시 이 상수, 또는 index.css의
//   --brand-navy / --brand-gold / --brand-ivory CSS 변수를 통해서만 참조한다.
//
// HEX -> OKLCH 변환은 sRGB -> Linear -> OKLab -> OKLCh 표준 공식으로 정밀 계산했다
// (근사값 사용 금지 — 과거 #C9A84C 같은 근사 골드값 오류 재발 방지).

export const AXIS_NAVY = '#040E1F';
export const AXIS_GOLD = '#C8A15A';
export const AXIS_IVORY = '#F7F4EE';

// index.css의 --brand-* 변수와 동일한 값 (JS/TS 코드에서 CSS 변수 대신 상수가
// 필요한 경우에만 사용 — 가능하면 style={{ color: 'var(--brand-navy)' }} 형태를 우선한다).
export const AXIS_NAVY_OKLCH = 'oklch(0.1644 0.0397 257.96)';
export const AXIS_GOLD_OKLCH = 'oklch(0.730 0.101 81.09)';
export const AXIS_IVORY_OKLCH = 'oklch(0.968 0.009 84.57)';

// ─── 데이터 시각화(막대그래프) 팔레트 — Phase 3D v3-r10 ──────────────────
// 문제: 막대그래프 데이터 막대(bar fill)를 딥 네이비 단색으로 채워 Ivory/Warm White
// 배경에서 무겁고 시인성이 떨어졌다(특히 여러 막대가 나열될 때 구분이 어려움).
// 정리 기준(GPT 지시 v3-r10):
//   - 딥 네이비(AXIS_NAVY)는 축/라벨/기준선 등 "구조" 용도로만 남기고, 데이터 막대
//     자체의 기본색으로는 쓰지 않는다.
//   - 기본 막대: muted blue / soft teal 중심.
//   - 강조 막대(내 점수, 하이라이트 등): AXIS Gold.
//   - 주의/보완 필요 표현: 강한 red 남발 금지 → warm amber로 제한.
// ⚠ 이 팔레트 밖의 새 색상(보라/마젠타/그라데이션/blob)을 임의로 추가하지 않는다.
export const CHART_BLUE = 'oklch(0.56 0.1 255)';       // 기본 막대(주)
export const CHART_TEAL = 'oklch(0.62 0.09 195)';      // 기본 막대(보조/비교값)
export const CHART_GOLD = AXIS_GOLD;                   // 강조 막대(하이라이트)
export const CHART_AMBER = 'oklch(0.68 0.13 70)';      // 보완 필요 표현(강한 red 대체)
export const CHART_AXIS_LINE = AXIS_NAVY;              // 축/라벨/기준선(구조 용도 — 데이터 막대에는 사용 금지)

// IF 사유별 색상 — 계산 실수 / 개념 부족 / 시간 부족(3사유 고정, 추가 금지).
// 기존에는 계산 실수=강한 red, 개념 부족=딥 네이비로 채워 "네이비 단색 + 강한 red" 문제가
// 동시에 발생했다 — 3사유 모두 위 신규 팔레트(amber/blue/teal)로 통일한다.
export const IF_REASON_COLOR: Record<'계산 실수' | '개념 부족' | '시간 부족', string> = {
  '계산 실수': CHART_AMBER,
  '개념 부족': CHART_BLUE,
  '시간 부족': CHART_TEAL,
};
