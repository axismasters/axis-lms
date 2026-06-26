// AXIS LMS v1.2 - 학생 파생 데이터 & 권한 헬퍼
// 원칙: 학생관리/반관리/출결/재무/성적이 서로 다른 더미를 참조하지 않도록 "단일 소스"로 연결.
//   · 반 메타데이터(반유형·요일·시간·강의실·강사·수강료) = ClassContext / classData.ts (ClassRoom)
//   · 수강 이력(시작일·종료일·종료사유·상태)            = 학생 레코드(Student.classes)
//   · 출결 = AttendanceContext, 성적 = Student.internal/mockExamScores
// 재무는 MVP 단계 결정론적 산출이며, 재무관리 엔진/DB 연동 시 getFinance만 교체한다.

import { Student, ClassInfo } from '@/lib/dummyData';
import { ClassRoom, DAY_ORDER, DayOfWeek } from '@/lib/classData';

// ────────────────────────────────────────────────────────────
// 권한/노출 정책은 AuthContext(can/canAccessStudent/canViewFinance/canResetPassword 등)로 일원화됨.
// 이 파일은 더 이상 role 기반 권한 판별을 갖지 않는다. (RBAC Foundation 참고: lib/rbac.ts, contexts/AuthContext.tsx)
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// 공통 유틸
// ────────────────────────────────────────────────────────────
export function seedNum(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function getActiveClasses(s: Student): ClassInfo[] {
  return s.classes.filter((c) => c.status === '수강중');
}

/** 주어진 반 id 목록에 현재 수강중인 학생 id 목록 — 강사 ASSIGNED_CLASSES 범위를 학생 단위로 환산할 때 사용 */
export function studentIdsInClasses(students: Student[], classIds: string[]): string[] {
  if (classIds.length === 0) return [];
  const set = new Set(classIds);
  return students.filter((s) => getActiveClasses(s).some((c) => set.has(c.id))).map((s) => s.id);
}
export function getPastClasses(s: Student): ClassInfo[] {
  return s.classes.filter((c) => c.status !== '수강중');
}

// ────────────────────────────────────────────────────────────
// 반 데이터 연결 (단일 소스 = ClassRoom)
// ────────────────────────────────────────────────────────────
export function formatDays(slots: { day: DayOfWeek }[]): string {
  const days = Array.from(new Set(slots.map((t) => t.day))).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  return days.join('');
}
export function formatTime(slots: { startTime: string; endTime: string }[]): string {
  const uniq = Array.from(new Set(slots.map((t) => `${t.startTime}-${t.endTime}`)));
  return uniq.join(', ');
}
/** ClassRoom의 timeSlots → "월수금 18:00-20:00" 스냅샷 문자열 */
export function timeSlotsToSchedule(slots: { day: DayOfWeek; startTime: string; endTime: string }[]): string {
  if (!slots.length) return '';
  return `${formatDays(slots)} ${formatTime(slots)}`.trim();
}

export interface ClassView {
  name: string;
  category: string; // 반유형 — ClassRoom.category에서만 가져옴 (반명 추정 금지)
  teacher: string;
  days: string;
  time: string;
  room: string;
  subject: string;
  level: string;
  resolved: boolean; // 실제 반 데이터로 해석되었는지
}

/** 수강 이력 + 실제 반 데이터를 합쳐 표시용 뷰 생성 */
export function resolveClassView(enrollment: ClassInfo, klass?: ClassRoom): ClassView {
  if (klass) {
    return {
      name: klass.name,
      // 주의: 받은 classData.ts(ClassRoom)에는 별도 category 필드가 없어 subject로 대체한다.
      // (studentDerived.ts는 1차로 받은 원본, classData.ts는 2차로 받은 원본이라 필드명이 어긋나 있었음 — 새 필드 추가 아님)
      category: klass.subject,
      teacher: klass.teacher,
      days: formatDays(klass.timeSlots),
      time: formatTime(klass.timeSlots),
      room: klass.room ?? '-',
      subject: klass.subject,
      level: klass.level,
      resolved: true,
    };
  }
  // 종강/외부 등 ClassContext에 없는 반: 수강 이력 스냅샷으로 폴백 (반유형 미상)
  const s = parseSchedule(enrollment.schedule);
  return {
    name: enrollment.name,
    category: '-',
    teacher: enrollment.teacher,
    days: s.days,
    time: s.time,
    room: '-',
    subject: enrollment.subject,
    level: '-',
    resolved: false,
  };
}

/** 레거시 스냅샷 schedule 파서 (실제 반 데이터가 없을 때만 사용) */
export function parseSchedule(schedule: string): { days: string; time: string } {
  const m = schedule.match(/^([^\d]+)\s*(.*)$/);
  if (!m) return { days: schedule, time: '' };
  return { days: m[1].trim(), time: m[2].trim() };
}

/** 활성 반 담당강사(중복 제거) — getClass 제공 시 실제 반 강사 기준 */
export function getTeachers(s: Student, getClass?: (id: string) => ClassRoom | undefined): string[] {
  const names = getActiveClasses(s).map((c) => getClass?.(c.id)?.teacher ?? c.teacher);
  return Array.from(new Set(names));
}

/** 학년 — 최신 모의고사 grade('고1'|'고2'|'고3') 기준 */
export function getGradeLevel(s: Student): string {
  return s.mockExamScores[0]?.grade ?? '-';
}

export function getRecentScoreLabel(s: Student): string {
  const mock = s.mockExamScores[0];
  if (mock) {
    const subjects = [mock.korean, mock.math, mock.english].filter(Boolean) as { grade: number }[];
    if (subjects.length) {
      const avg = subjects.reduce((a, b) => a + b.grade, 0) / subjects.length;
      return `${mock.examName.replace(/^\d{4}\s*/, '')} · 평균 ${avg.toFixed(1)}등급`;
    }
  }
  const internal = s.internalScores[0];
  if (internal) return `내신 ${internal.subject} ${internal.grade}등급`;
  return '-';
}

// ────────────────────────────────────────────────────────────
// 대학추천 데이터 상태 (실제 추천 계산 아님 — 입력 상태만 판단)
// ────────────────────────────────────────────────────────────
export type UnivStatus = '데이터 부족' | '준비 중' | '충분';

export interface UnivChecklist {
  hasInternal: boolean;
  hasMock: boolean;
  hasMath: boolean;
  hasInquiry: boolean;
  kmeCount: number;
}

export function getUnivChecklist(s: Student): UnivChecklist {
  const latest = s.mockExamScores[0];
  const hasInternal = s.internalScores.length > 0;
  const hasMock = s.mockExamScores.length > 0;
  let kmeCount = 0;
  let hasMath = false;
  let hasInquiry = false;
  if (latest) {
    if (latest.korean) kmeCount++;
    if (latest.math) { kmeCount++; hasMath = true; }
    if (latest.english) kmeCount++;
    hasInquiry = !!(latest.inquiry1 || latest.inquiry2);
  }
  if (!hasMath) hasMath = s.internalScores.some((i) => i.subject === '수학');
  return { hasInternal, hasMock, hasMath, hasInquiry, kmeCount };
}

export function getUnivDataStatus(s: Student): UnivStatus {
  const c = getUnivChecklist(s);
  if (!c.hasInternal && !c.hasMock) return '데이터 부족';
  if (c.hasInternal && c.hasMock && c.kmeCount >= 2 && c.hasInquiry) return '충분';
  return '준비 중';
}

export const UNIV_STATUS_STYLE: Record<UnivStatus, { bg: string; text: string; border: string }> = {
  '데이터 부족': { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.5 0.015 250)', border: 'oklch(0.9 0.005 250)' },
  '준비 중': { bg: 'oklch(0.97 0.06 80)', text: 'oklch(0.45 0.12 80)', border: 'oklch(0.88 0.1 80)' },
  '충분': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.35 0.12 160)', border: 'oklch(0.85 0.1 160)' },
};

// ────────────────────────────────────────────────────────────
// 재무 (조회 전용) — 수강료는 ClassRoom.fee(실제 반 데이터) 기준
// ────────────────────────────────────────────────────────────
export type PayStatus = '완납' | '부분납' | '미납' | '청구없음';

export interface FinanceClassBill {
  className: string;
  classCategory: string;
  monthlyFee: number;
  prorated: boolean;
  amount: number;
  status: '완납' | '미납';
}
export interface FinancePayment {
  date: string; amount: number; method: '카드' | '계좌이체' | '현금'; handler: string; receiptIssued: boolean;
}
export interface FinanceReceipt { id: string; month: string; amount: number; issued: boolean; }
export interface StudentFinance {
  isDummy: boolean; // 재무관리 엔진 연동 전 더미 데이터 표시용
  month: string; total: number; paid: number; unpaid: number; status: PayStatus;
  classBills: FinanceClassBill[]; payments: FinancePayment[];
  hasUnpaid: boolean; unpaidPeriod: string;
  refundRequested: boolean; refundApproveStatus: '없음' | '요청' | '승인' | '반려'; refundCompleted: boolean;
  receipts: FinanceReceipt[];
}

const FEE_FALLBACK: Record<string, number> = { 수학: 240000, 영어: 210000, 국어: 200000, 과학: 230000, 사회: 200000 };

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isUnpaid(s: Student): boolean {
  if (s.status === '퇴원' || s.status === '대기') return false;
  if (getActiveClasses(s).length === 0) return false;
  return seedNum(s.id) % 4 === 0;
}

/**
 * 재무 산출 — ⚠ 현재는 더미(isDummy=true). 수강료는 ClassRoom.fee(실제 반 데이터)에서 가져오되,
 * 일할/정산/납부 이력은 임의 정책을 적용하지 않는다. 일할은 등록일/퇴원일 기준으로 재무관리 엔진에서 처리한다.
 */
export function getFinance(s: Student, getClass?: (id: string) => ClassRoom | undefined): StudentFinance {
  const month = currentMonth();
  const active = getActiveClasses(s);

  if (s.status === '퇴원' || s.status === '대기' || active.length === 0) {
    const refundRequested = s.status === '휴원';
    return {
      isDummy: true,
      month, total: 0, paid: 0, unpaid: 0, status: '청구없음',
      classBills: [], payments: [], hasUnpaid: false, unpaidPeriod: '',
      refundRequested, refundApproveStatus: refundRequested ? '승인' : '없음', refundCompleted: false, receipts: [],
    };
  }

  const unpaidFlag = isUnpaid(s);

  // ⚠ 더미: 일할 계산을 임의 적용하지 않는다(0.6 등 고정 비율 제거). 일할은 재무관리 엔진이 등록일/퇴원일 기준으로 처리.
  const classBills: FinanceClassBill[] = active.map((c, idx) => {
    const klass = getClass?.(c.id);
    const fee = klass?.fee ?? FEE_FALLBACK[c.subject] ?? 200000;
    const amount = fee; // 월 수강료 전액 (일할 미적용)
    const status: '완납' | '미납' = unpaidFlag && idx === 0 ? '미납' : '완납';
    return { className: klass?.name ?? c.name, classCategory: klass?.subject ?? '-', monthlyFee: fee, prorated: false, amount, status };
  });

  const total = classBills.reduce((a, b) => a + b.amount, 0);
  const unpaid = classBills.filter((b) => b.status === '미납').reduce((a, b) => a + b.amount, 0);
  const paid = total - unpaid;
  const status: PayStatus = unpaid === 0 ? '완납' : paid > 0 ? '부분납' : '미납';

  const methods: FinancePayment['method'][] = ['카드', '계좌이체', '현금'];
  const payments: FinancePayment[] = paid > 0 ? [{ date: `${month}-05`, amount: paid, method: methods[seedNum(s.id) % methods.length], handler: '행정', receiptIssued: true }] : [];
  const receipts: FinanceReceipt[] = paid > 0 ? [{ id: `rcpt-${s.id}-${month}`, month, amount: paid, issued: true }] : [];
  const refundRequested = s.status === '휴원';

  return {
    isDummy: true,
    month, total, paid, unpaid, status, classBills, payments,
    hasUnpaid: unpaid > 0, unpaidPeriod: unpaid > 0 ? `${month} (1개월)` : '',
    refundRequested, refundApproveStatus: refundRequested ? '요청' : '없음', refundCompleted: false, receipts,
  };
}

export function formatWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

// ────────────────────────────────────────────────────────────
// 성적 종류 (성적조회 탭 내부 선택 — 별도 탭 아님)
// ────────────────────────────────────────────────────────────
export const GRADE_TYPES = ['전체', '내신성적', '전국연합모의고사', '내신대비모의고사', '수능실전모의고사'] as const;
export type GradeType = (typeof GRADE_TYPES)[number];

/** 빠른조회 deep-link gradeType 파라미터 → 성적 종류 */
export function gradeTypeFromParam(param: string | null): GradeType {
  if (param === 'naesin') return '내신성적';
  if (param === 'mock') return '전국연합모의고사';
  return '전체';
}
