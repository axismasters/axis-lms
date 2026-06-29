// AXIS LMS v1.2 - dateUtils
// 한국 로컬 기준 날짜 처리 유틸.
// toISOString()은 UTC 기준이라 한국 시간 새벽(0~9시)에 날짜가 하루 밀려 나올 수 있어 사용하지 않는다.
// attendanceData.ts의 formatLocalDate와 동일한 원칙.

/** 현재 날짜를 한국 로컬 기준 YYYY-MM-DD 문자열로 반환 */
export function getLocalDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
