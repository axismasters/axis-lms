// AXIS LMS v1.2 — Phase 3D v3-r12: systemFeatureFlags.ts
// 관리자 시스템설정 > 기능 사용 설정에서 Rival / Emblem / 재무관리 기능을 켜고 끌 수 있게 한다.
//
// ⚠ 설계 원칙:
//   - App.tsx는 불변 파일이며, "새 라우트/프로바이더 금지" 원칙이 있다. 이 모듈은 React
//     Context/Provider를 추가하지 않는다 — src/lib/studentProfile.ts와 동일한 방식으로,
//     localStorage를 직접 읽고 쓰는 plain 함수만 제공한다.
//   - 각 컴포넌트는 렌더 시점(라우트 진입/네비게이션)마다 아래 함수를 직접 호출해 최신 값을
//     읽는다. wouter의 Route는 경로가 바뀔 때마다 관련 컴포넌트를 다시 렌더링하므로, 별도
//     구독(subscribe) 장치 없이도 "새로고침 후에도 유지 + 네비게이션 시 즉시 반영"이 된다.
//   - 기본값은 전부 ON(true) — 켜져 있던 걸 새로 끄는 개념이며, 최초 진입 시 아무 화면도
//     갑자기 사라지지 않는다.

export interface SystemFeatureFlags {
  rivalEnabled: boolean;
  emblemEnabled: boolean;
  financeEnabled: boolean;
}

const STORAGE_KEY = 'axis_system_feature_flags';

function defaultFlags(): SystemFeatureFlags {
  return { rivalEnabled: true, emblemEnabled: true, financeEnabled: true };
}

// ─── 불러오기 ────────────────────────────────────────────────────────
export function loadSystemFeatureFlags(): SystemFeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFlags();
    return { ...defaultFlags(), ...JSON.parse(raw) };
  } catch {
    return defaultFlags();
  }
}

// ─── 저장 ────────────────────────────────────────────────────────────
export function saveSystemFeatureFlags(flags: SystemFeatureFlags): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // localStorage 접근 불가 환경(SSR/프라이빗 모드 등) 무시 — 기본값(ON)으로 동작
  }
}

// ─── 단일 플래그 변경 (설정 화면 토글에서 사용) ─────────────────────
export function setFeatureFlag(key: keyof SystemFeatureFlags, enabled: boolean): SystemFeatureFlags {
  const next = { ...loadSystemFeatureFlags(), [key]: enabled };
  saveSystemFeatureFlags(next);
  return next;
}

// ─── 개별 조회 헬퍼(가장 흔한 사용 형태) ────────────────────────────
export function isRivalEnabled(): boolean {
  return loadSystemFeatureFlags().rivalEnabled;
}
export function isEmblemEnabled(): boolean {
  return loadSystemFeatureFlags().emblemEnabled;
}
export function isFinanceEnabled(): boolean {
  return loadSystemFeatureFlags().financeEnabled;
}
