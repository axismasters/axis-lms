// AXIS LMS v1.2 - dateUtils
// 한국 로컬 기준 날짜 처리 유틸.
// toISOString()은 UTC 기준이라 한국 시간 새벽(0~9시)에 날짜가 하루 밀려 나올 수 있어 사용하지 않는다.
// attendanceData.ts의 formatLocalDate와 동일한 원칙.

/** 주어진 날짜(기본값: 현재)를 한국 로컬 기준 YYYY-MM-DD 문자열로 반환.
 *  Phase 3D v3-r1: 과거 날짜(예: N일 전) 포맷팅에도 재사용할 수 있도록 선택적 Date 인자를 추가했다
 *  (기존 인자 없는 호출부는 그대로 현재 날짜를 반환하므로 하위 호환된다). */
export function getLocalDateStr(date?: Date): string {
  const now = date ?? new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
