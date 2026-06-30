// AXIS LMS v1.2 - Finance Foundation v1 데이터 구조
// classData.ts/attendanceData.ts/assessmentData.ts/enrollmentData.ts와 동일한
// "타입 + mock 데이터 + 순수 헬퍼 함수" 파일 구조 패턴을 따른다.
//
// AXIS 확정 원칙: 재무는 학생 기준이 아니라 수강(Enrollment) 기준으로 관리한다. 학생 1명이 여러 반을
// 동시에 수강하면 청구/수납/환불도 수강(enrollmentId) 단위로 각각 발생한다 — Invoice/Payment/Refund
// 전부 studentId뿐 아니라 enrollmentId·classId를 함께 들고 다니므로, 한 학생의 여러 수강이 섞이지 않는다.
//
// 이번 단계 범위: Foundation(기본 화면 + mock 데이터 + 일할 계산 함수)까지. 실제 PG/카드사/세금계산서/
// 카카오페이·토스페이 연동, 복잡한 회계 처리는 포함하지 않는다.

import type { PermissionKey } from './rbac';
import type { Enrollment } from './enrollmentData';

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────
export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type SettlementStatus = 'DRAFT' | 'CONFIRMED';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: '현금', CARD: '카드', TRANSFER: '계좌이체', OTHER: '기타',
};
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: '미납', PARTIAL: '부분납', PAID: '완납', CANCELED: '취소',
};
export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  REQUESTED: '요청', APPROVED: '승인', REJECTED: '반려', COMPLETED: '완료',
};
export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  DRAFT: '미확정', CONFIRMED: '확정',
};

export interface Invoice {
  id: string;
  enrollmentId: string;
  studentId: string;
  classId: string;
  billingMonth: string;      // 'YYYY-MM'
  amount: number;            // 정상 월 수강료(일할 계산 전 기준값) — originalAmount와 동일하게 둔다
  originalAmount: number;    // 일할 계산 전 정상 금액
  proratedAmount: number;    // 일할 계산이 적용된 실제 청구 금액(중도등록/퇴원이 아니면 originalAmount와 동일)
  discountAmount: number;    // 할인 금액(Foundation 단계에서는 0 고정, 향후 확장 지점)
  finalAmount: number;       // 실제 청구 확정액 = proratedAmount - discountAmount
  status: InvoiceStatus;
  issueDate: string;         // 청구서 발행일(보통 해당 월 1일)
  dueDate: string;           // 납부기한
  memo?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  enrollmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  handledBy: string;
  receiptIssued: boolean;
  memo?: string;
}

export interface Refund {
  id: string;
  invoiceId: string;
  enrollmentId: string;
  studentId: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: RefundStatus;
  requestedBy: string;
  approvedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  reason: string;
  memo?: string;
}

export interface Settlement {
  id: string;
  month: string; // 'YYYY-MM'
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  totalRefunded: number;
  status: SettlementStatus;
  confirmedBy?: string;
  confirmedAt?: string;
}

// Finance Foundation v3: 영수증 — 데이터 구조만 구현하고 PDF 출력은 이후 단계로 미룬다(이번 단계에서
// 만들지 않음). 수납(Payment) 1건당 영수증 1건이 원칙적으로 자동 발급되며, receiptNumber로 식별한다.
export interface Receipt {
  id: string;
  paymentId: string;
  invoiceId: string;
  studentId: string;
  enrollmentId: string;
  receiptNumber: string;
  amount: number;
  issuedAt: string;
  issuedBy: string;
}

// ────────────────────────────────────────────────────────────
// 권한 헬퍼 — 기존 AuthContext.can(key)를 그대로 위임한다(새 권한 체계를 만들지 않음).
// 화면에서 `canManageFinance(can)`처럼 호출해 의미가 분명한 이름으로 사용한다.
// ────────────────────────────────────────────────────────────
type CanFn = (key: PermissionKey) => boolean;

/** 재무관리 메뉴/화면 진입 가능 여부 — SUPER_ADMIN/DIRECTOR/STAFF만 보유(부원장/실장/팀장/강사/학생/보호자는 불가) */
export function canManageFinance(can: CanFn): boolean {
  return can('finance.view');
}
/** 수납 등록 가능 여부 */
export function canCreatePayment(can: CanFn): boolean {
  return can('finance.paymentCreate');
}
/** 환불 요청 등록 가능 여부 — 행정/원장/최고관리자 */
export function canRequestRefund(can: CanFn): boolean {
  return can('finance.refundRequest');
}
/** 환불 승인/반려 가능 여부 — 원장/최고관리자만(행정 불가) */
export function canApproveRefund(can: CanFn): boolean {
  return can('finance.refundApprove');
}
/** 영수증 발급 가능 여부 */
export function canIssueReceipt(can: CanFn): boolean {
  return can('finance.receiptIssue');
}
/** 정산 확정 가능 여부 — 원장/최고관리자만(행정 불가) */
export function canConfirmSettlement(can: CanFn): boolean {
  return can('finance.settlementConfirm');
}

// ────────────────────────────────────────────────────────────
// 일할 계산 — Finance Foundation 기본 함수. 복잡한 회계 기준 없이 "월 총 일수 대비 실제 수강 일수" 비율로
// 단순 계산하고, 결과는 원 단위로 반올림한다.
//
// startDate/endDate가 모두 없으면(중도등록/퇴원이 아닌 일반 월) 정상월 전체 금액을 그대로 반환한다.
// startDate만 있으면(중도등록) "시작일~월말"만 계산하고, endDate만 있으면(중도퇴원) "월초~종료일"만 계산한다.
// 예) 6월(30일) 10일 등록 → 6/10~6/30 = 21일 → monthlyAmount * 21/30 (약 2/3)
// 예) 6월(30일) 10일 퇴원 → 6/1~6/10 = 10일 → monthlyAmount * 10/30 (1~10일분)
// ────────────────────────────────────────────────────────────
export function calculateProratedAmount(
  monthlyAmount: number,
  startDate: string | undefined,
  endDate: string | undefined,
  billingMonth: string, // 'YYYY-MM'
): number {
  const [year, month] = billingMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(year, month, 0).getDate(); // 해당 월 총 일수
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, totalDaysInMonth);

  if (!startDate && !endDate) return Math.round(monthlyAmount); // 일반월: 일할 계산 없음

  const effectiveStart = startDate ? new Date(startDate) : monthStart;
  const effectiveEnd = endDate ? new Date(endDate) : monthEnd;

  // 그 달 범위 밖으로 나간 값은 달 경계로 보정(clamp)한다.
  const clampedStart = effectiveStart < monthStart ? monthStart : effectiveStart;
  const clampedEnd = effectiveEnd > monthEnd ? monthEnd : effectiveEnd;

  const actualDays = Math.max(0, Math.round((clampedEnd.getTime() - clampedStart.getTime()) / 86400000) + 1);
  const dailyRate = monthlyAmount / totalDaysInMonth;
  return Math.round(dailyRate * actualDays); // 원 단위 반올림
}

// 미납 일수 계산 — 미납관리 화면의 "미납일수"/"7일 이상"/"30일 이상" 판단에 사용.
export function daysOverdue(dueDate: string, today: Date = new Date()): number {
  const due = new Date(dueDate);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}

// ────────────────────────────────────────────────────────────
// Finance Foundation v2: 공통 계산 helper
// ────────────────────────────────────────────────────────────
// 청구서 1건의 누적 수납액 — Payment 배열을 그대로 합산한다(인자로 받아 순수 함수로 둔다 — Context의
// payments state는 호출부에서 그대로 넘겨주면 된다).
export function getInvoicePaidAmount(invoiceId: string, payments: Payment[]): number {
  return payments.filter(p => p.invoiceId === invoiceId).reduce((s, p) => s + p.amount, 0);
}

// 청구서 1건에 대해 실제로 빠져나간(COMPLETED) 환불 누적액. 승인(APPROVED)만 되고 아직 완료되지
// 않은 환불은 "아직 돈이 나가지는 않았지만 곧 나갈 돈"이므로 별도로 getRefundableAmount에서 다룬다.
export function getInvoiceRefundedAmount(invoiceId: string, refunds: Refund[]): number {
  return refunds
    .filter(r => r.invoiceId === invoiceId && r.status === 'COMPLETED')
    .reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
}

// 청구서 1건의 미납금액 = 청구확정액 - 누적수납액(최소 0).
export function getInvoiceUnpaidAmount(invoice: Invoice, payments: Payment[]): number {
  return Math.max(0, invoice.finalAmount - getInvoicePaidAmount(invoice.id, payments));
}

// 청구서 1건에 대해 "지금 추가로 환불 요청·승인할 수 있는 한도" = 실제 수납액 - (이미 완료됐거나
// 승인되어 곧 빠질 환불액). 요청(REQUESTED)·반려(REJECTED) 상태는 아직 돈이 빠지지 않으므로 제외한다
// (REQUESTED는 승인 전이라 한도에 포함시키면 행정이 중복 요청을 막을 명분이 약해지고, REJECTED는
// 빠질 일이 없는 돈이다 — 환불 요청 단계에서는 REQUESTED 상태인 기존 요청과 중복되어도 일단 막지
// 않고, 승인 단계에서 다시 한 번 한도를 재검증해 실질적인 초과 환불을 방지한다).
export function getRefundableAmount(invoiceId: string, payments: Payment[], refunds: Refund[]): number {
  const paid = getInvoicePaidAmount(invoiceId, payments);
  const alreadyOutOrPending = refunds
    .filter(r => r.invoiceId === invoiceId && (r.status === 'COMPLETED' || r.status === 'APPROVED'))
    .reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
  return Math.max(0, paid - alreadyOutOrPending);
}

// 청구서 1건의 상태를 누적 수납액 기준으로 재계산한다(UNPAID/PARTIAL/PAID). CANCELED는 별도 취소
// 액션이 있을 때만 설정되는 상태라 여기서는 그대로 보존한다(이번 단계에 취소 액션 자체는 없음).
export function calculateInvoiceStatus(invoice: Invoice, payments: Payment[]): InvoiceStatus {
  if (invoice.status === 'CANCELED') return 'CANCELED';
  const paid = getInvoicePaidAmount(invoice.id, payments);
  if (paid <= 0) return 'UNPAID';
  if (paid >= invoice.finalAmount) return 'PAID';
  return 'PARTIAL';
}

export interface MonthlyFinanceAmounts {
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  totalRefunded: number;
  netRevenue: number;
}

// 정산관리·통계 화면이 공유하는 월별 합산 계산 — mock 고정값이 아니라 매번 invoices/payments/refunds
// 원본 데이터에서 그대로 합산한다(AXIS 확정 원칙 8).
//   totalBilled   = 해당 월 Invoice.finalAmount 합계(CANCELED 제외)
//   totalPaid     = 해당 월 Invoice에 연결된 Payment.amount 합계
//   totalUnpaid   = max(0, totalBilled - totalPaid)
//   totalRefunded = 해당 월 Invoice에 연결된 Refund 중 COMPLETED 상태의 approvedAmount 합계
//   netRevenue    = totalPaid - totalRefunded
export function calculateMonthlySettlement(
  month: string, invoices: Invoice[], payments: Payment[], refunds: Refund[],
): MonthlyFinanceAmounts {
  const monthInvoices = invoices.filter(i => i.billingMonth === month);
  const invoiceIds = new Set(monthInvoices.map(i => i.id));

  const totalBilled = monthInvoices.filter(i => i.status !== 'CANCELED').reduce((s, i) => s + i.finalAmount, 0);
  const totalPaid = payments.filter(p => invoiceIds.has(p.invoiceId)).reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = Math.max(0, totalBilled - totalPaid);
  const totalRefunded = refunds
    .filter(r => invoiceIds.has(r.invoiceId) && r.status === 'COMPLETED')
    .reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
  const netRevenue = totalPaid - totalRefunded;

  return { totalBilled, totalPaid, totalUnpaid, totalRefunded, netRevenue };
}

// 통계 화면용 — Invoice에 존재하는 모든 청구월을 모아 각 월의 합산치를 계산해 최신순으로 반환한다.
export function calculateMonthlyFinanceStats(
  invoices: Invoice[], payments: Payment[], refunds: Refund[],
): (MonthlyFinanceAmounts & { month: string })[] {
  const months = Array.from(new Set(invoices.map(i => i.billingMonth))).sort().reverse();
  return months.map(month => ({ month, ...calculateMonthlySettlement(month, invoices, payments, refunds) }));
}

export function currentBillingMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────
// Finance Foundation v3: 매월 1일 자동 청구서 생성 — "구조"를 먼저 구현한다(이 함수는 순수 함수이며,
// 실제 매월 1일 00시 실행은 서버 스케줄러가 맡을 영역이다. 이 mock 환경에서는 FinanceContext가
// 앱 시작 시점과 Enrollment 변경 시점에 이 함수를 호출해 "그 시점까지 청구되지 않은 이번 달 청구서"를
// 보충 생성하는 방식으로 구조를 시연한다 — idempotent하므로 몇 번을 호출해도 중복 생성되지 않는다).
//
// AXIS 확정 원칙: 학생 1명이 여러 반을 수강하면 반(Enrollment)마다 별도 청구서가 생성된다(이미 청구서가
// enrollmentId 단위이므로 자연히 만족된다). 신규 수강(이번 달 안에 시작)은 시작일 기준 일할 계산을
// 적용하고, 이미 진행 중인 수강은 정상 월 금액 그대로 청구한다. 종료/퇴원으로 이번 달 안에 끝난
// 수강도 "그 달 마지막 청구"가 아직 없다면 종료일 기준 일할 계산으로 청구한다(이미 청구서가 존재하면
// 건드리지 않는다 — 이미 발행된 청구서를 사후에 재계산하는 것이 아니라, 정상 종료 처리 시점에 맞춰
// 환불 워크플로우(calculateWithdrawalRefundAmount)로 차액을 돌려주는 쪽을 AXIS는 원칙으로 한다).
export function generateMonthlyInvoices(
  month: string, // 'YYYY-MM'
  enrollments: Enrollment[],
  existingInvoices: Invoice[],
): Invoice[] {
  const existingKeys = new Set(existingInvoices.map(i => `${i.enrollmentId}__${i.billingMonth}`));
  const monthStart = `${month}-01`;
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  const newInvoices: Invoice[] = [];

  enrollments.forEach((enr) => {
    if (existingKeys.has(`${enr.id}__${month}`)) return; // 이미 이번 달 청구서가 있으면 건너뜀(idempotent)
    if (!enr.tuitionAmount) return; // 수강료가 아직 정해지지 않은 수강은 자동 청구 대상이 아니다

    const startsThisMonth = enr.startDate >= monthStart && enr.startDate <= monthEnd;
    const endsThisMonth = !!enr.endDate && enr.endDate >= monthStart && enr.endDate <= monthEnd;

    // 청구 대상 여부: 이번 달에 수강중이거나, 이번 달 안에 종료/퇴원된 수강(그 달 마지막 청구가 필요)
    const isBillableThisMonth = enr.status === '수강중' || endsThisMonth;
    if (!isBillableThisMonth) return;
    if (enr.startDate > monthEnd) return;       // 아직 시작하지 않은 미래 수강은 청구하지 않음
    if (enr.endDate && enr.endDate < monthStart) return; // 이번 달보다 먼저 끝난 수강은 청구하지 않음

    const proratedStart = startsThisMonth ? enr.startDate : undefined;
    const proratedEnd = endsThisMonth ? enr.endDate : undefined;
    const proratedAmount = calculateProratedAmount(enr.tuitionAmount, proratedStart, proratedEnd, month);
    const isProrated = !!(proratedStart || proratedEnd);

    newInvoices.push({
      id: `inv-auto-${enr.id}-${month}`,
      enrollmentId: enr.id,
      studentId: enr.studentId,
      classId: enr.classId,
      billingMonth: month,
      amount: enr.tuitionAmount,
      originalAmount: enr.tuitionAmount,
      proratedAmount,
      discountAmount: 0,
      finalAmount: proratedAmount,
      status: 'UNPAID',
      issueDate: monthStart,
      dueDate: `${month}-10`,
      memo: isProrated ? '자동 생성 — 일할 계산 적용(중도등록/종료)' : '자동 생성(매월 1일 정기 청구)',
    });
  });

  return newInvoices;
}

// Finance Foundation v3: 중도 퇴원 환불 일할 계산 — 이미 그 달 전체 금액을 청구·수납한 뒤 중도에
// 퇴원하면, 퇴원일 이후의 남은 기간만큼을 환불해야 한다. calculateProratedAmount로 "퇴원일까지 실제
// 사용한 금액"을 구하고, 월 정상 금액에서 그만큼을 뺀 나머지를 환불 제안액으로 계산한다.
// 예) 6월(30일) 30만원 청구, 10일 퇴원 → 사용분 10만원(1~10일) → 환불 제안액 20만원(11~30일).
export function calculateWithdrawalRefundAmount(
  monthlyAmount: number, withdrawalDate: string, billingMonth: string,
): number {
  const usedAmount = calculateProratedAmount(monthlyAmount, undefined, withdrawalDate, billingMonth);
  return Math.max(0, Math.round(monthlyAmount) - usedAmount);
}

// ────────────────────────────────────────────────────────────
// AXIS 재무 원칙: 퇴원 20일 이내 일할 환불 정책
// 퇴원 후 20일을 초과하면 일할 환불 요청을 제한한다. 예외 환불은 향후 별도 승인 워크플로우로
// 분리해야 하며, 이번 MVP에서는 “20일 초과 퇴원 건”을 일반 환불 요청으로 등록하지 않는다.
// 이 상수를 변경하면 FinanceRefunds.tsx의 handleSelectInvoice / saveRequest 로직과 함께 즉시 반영된다.
// ────────────────────────────────────────────────────────────
export const WITHDRAWAL_REFUND_WINDOW_DAYS = 20;

/**
 * 퇴원 후 환불 자동 제안 유효 기간(20일) 이내인지 판단한다.
 * - endDate 로부터 today까지 경과일이 20일 이하이면 true(일할 환불 가능 기간 내)를 반환한다.
 * - 퇴원일 당일을 0일로 계산하므로, 퇴원일(0일) ~ 퇴원일+20일이 일할 환불 가능 기간이다.
 * - 20일 초과 퇴원 건은 이번 MVP에서 일할 환불 요청 등록을 제한한다.
 */
export function isWithinWithdrawalRefundWindow(endDate: string, today: Date = new Date()): boolean {
  const end = new Date(endDate);
  const diffDays = Math.floor((today.getTime() - end.getTime()) / 86400000);
  return diffDays <= WITHDRAWAL_REFUND_WINDOW_DAYS;
}

// Finance Foundation v3: 영수증 자동 발급 구조 — 번호만 생성한다(실제 PDF 렌더링은 다음 단계).
// 형식: RCT-YYYYMM-#### (그 달의 발급 순번, 4자리). sequence는 호출부(Context)가 누적 발급 건수로 넘긴다.
export function generateReceiptNumber(issuedAt: string, sequence: number): string {
  const ym = issuedAt.slice(0, 7).replace('-', '');
  return `RCT-${ym}-${String(sequence).padStart(4, '0')}`;
}

// ────────────────────────────────────────────────────────────
// 반유형 분류(정규반/특강반) — ClassRoom 자체에는 이런 구분 필드가 없으므로(기존 Class 구조를
// 건드리지 않기 위해 필드를 추가하지 않았다), Finance 도메인 안에서만 쓰는 보조 매핑으로 분류한다.
// 통계 화면의 "수강 유형별 매출" 항목에만 사용되며, ClassRoom 데이터 자체에는 영향이 없다.
// ────────────────────────────────────────────────────────────
const SPECIAL_LECTURE_CLASS_IDS = new Set(['cls-006', 'cls-008']); // 수능반/파이널반 — 특강 성격
export type ClassEnrollmentType = '정규반' | '특강반';
export function getClassEnrollmentType(classId: string): ClassEnrollmentType {
  return SPECIAL_LECTURE_CLASS_IDS.has(classId) ? '특강반' : '정규반';
}

// ────────────────────────────────────────────────────────────
// mock 데이터 — Enrollment Foundation의 DUMMY_ENROLLMENTS(enr-001~004, enr-101~102)와 정확히
// 연결되도록 enrollmentId/studentId/classId를 그대로 가져와 구성한다.
// 현재 활성 수강: enr-001(stu-001/cls-001/32만원), enr-002(stu-001/cls-002/28만원, 같은 학생 복수수강
// 예시), enr-003(stu-002/cls-001/32만원), enr-004(stu-003/cls-003/25만원, 중도등록 시나리오).
// 과거 이력: enr-101(stu-004/cls-005, 종료), enr-102(stu-006/cls-001, 중도퇴원 시나리오).
// ────────────────────────────────────────────────────────────

function makeInvoice(
  id: string, enrollmentId: string, studentId: string, classId: string,
  billingMonth: string, originalAmount: number, proratedAmount: number,
  status: InvoiceStatus, issueDate: string, dueDate: string, memo?: string,
): Invoice {
  return {
    id, enrollmentId, studentId, classId, billingMonth,
    amount: originalAmount, originalAmount, proratedAmount,
    discountAmount: 0, finalAmount: proratedAmount,
    status, issueDate, dueDate, memo,
  };
}

export const DUMMY_INVOICES: Invoice[] = [
  // enr-001 (stu-001 / cls-001, 32만원) — 4월·5월 완납, 6월(이번 달) 미납 → 미납관리 시연용
  makeInvoice('inv-001', 'enr-001', 'stu-001', 'cls-001', '2026-04', 320000, 320000, 'PAID', '2026-04-01', '2026-04-10'),
  makeInvoice('inv-002', 'enr-001', 'stu-001', 'cls-001', '2026-05', 320000, 320000, 'PAID', '2026-05-01', '2026-05-10'),
  makeInvoice('inv-003', 'enr-001', 'stu-001', 'cls-001', '2026-06', 320000, 320000, 'UNPAID', '2026-06-01', '2026-06-10', '6월분 미납'),

  // enr-002 (stu-001 / cls-002, 28만원) — 같은 학생(stu-001)의 다른 수강. 6월 완납.
  // → "학생 1명이 여러 반을 수강할 때 수강별 청구가 분리된다"를 보여주는 핵심 예시(enr-001은 미납, enr-002는 완납).
  makeInvoice('inv-004', 'enr-002', 'stu-001', 'cls-002', '2026-04', 280000, 280000, 'PAID', '2026-04-01', '2026-04-10'),
  makeInvoice('inv-005', 'enr-002', 'stu-001', 'cls-002', '2026-05', 280000, 280000, 'PAID', '2026-05-01', '2026-05-10'),
  makeInvoice('inv-006', 'enr-002', 'stu-001', 'cls-002', '2026-06', 280000, 280000, 'PAID', '2026-06-01', '2026-06-10'),

  // enr-003 (stu-002 / cls-001, 32만원) — 6월 미납, 납부기한을 충분히 지나 "30일 이상 미납" 시연용
  makeInvoice('inv-007', 'enr-003', 'stu-002', 'cls-001', '2026-05', 320000, 320000, 'PAID', '2026-05-01', '2026-05-10'),
  makeInvoice('inv-008', 'enr-003', 'stu-002', 'cls-001', '2026-06', 320000, 320000, 'UNPAID', '2026-06-01', '2026-05-25', '독촉 필요'),

  // enr-004 (stu-003 / cls-003, 25만원, 중도등록 가정: 6/15 시작) — 일할 계산 적용 + 부분납 시연
  makeInvoice('inv-009', 'enr-004', 'stu-003', 'cls-003', '2026-06',
    250000, calculateProratedAmount(250000, '2026-06-15', undefined, '2026-06'),
    'PARTIAL', '2026-06-15', '2026-06-20', '6/15 중도등록 — 일할 계산 적용'),

  // enr-101 (stu-004 / cls-005, 종료: 2024-05-30) — 종료월 전액 수납됐지만 아직 환불 요청은 하지 않은
  // 상태(enr-102/ref-003과 달리 의도적으로 "미환불"로 남겨, 환불관리 화면에서 calculateWithdrawalRefundAmount
  // 자동 제안 기능을 실제로 시연할 수 있게 한다).
  makeInvoice('inv-102', 'enr-101', 'stu-004', 'cls-005', '2024-05', 260000, 260000, 'PAID', '2024-05-01', '2024-05-10', '5/30 휴원으로 수강 종료 — 환불 미요청'),

  // enr-102 (stu-006 / cls-001, 중도퇴원: 2024-01-15 퇴원) — 퇴원월 일할 계산(1~15일분) 과거 이력
  makeInvoice('inv-101', 'enr-102', 'stu-006', 'cls-001', '2024-01',
    320000, calculateProratedAmount(320000, undefined, '2024-01-15', '2024-01'),
    'PAID', '2024-01-01', '2024-01-10', '1/15 중도퇴원 — 1~15일분만 청구'),
];

export const DUMMY_PAYMENTS: Payment[] = [
  { id: 'pay-001', invoiceId: 'inv-001', studentId: 'stu-001', enrollmentId: 'enr-001', amount: 320000, paymentMethod: 'CARD', paidAt: '2026-04-05T10:00:00', handledBy: '한태준', receiptIssued: true },
  { id: 'pay-002', invoiceId: 'inv-002', studentId: 'stu-001', enrollmentId: 'enr-001', amount: 320000, paymentMethod: 'CARD', paidAt: '2026-05-04T10:00:00', handledBy: '한태준', receiptIssued: true },
  { id: 'pay-003', invoiceId: 'inv-004', studentId: 'stu-001', enrollmentId: 'enr-002', amount: 280000, paymentMethod: 'TRANSFER', paidAt: '2026-04-03T11:00:00', handledBy: '한태준', receiptIssued: true },
  { id: 'pay-004', invoiceId: 'inv-005', studentId: 'stu-001', enrollmentId: 'enr-002', amount: 280000, paymentMethod: 'TRANSFER', paidAt: '2026-05-02T11:00:00', handledBy: '한태준', receiptIssued: false },
  { id: 'pay-005', invoiceId: 'inv-006', studentId: 'stu-001', enrollmentId: 'enr-002', amount: 280000, paymentMethod: 'CASH', paidAt: '2026-06-02T09:30:00', handledBy: '한태준', receiptIssued: true },
  { id: 'pay-006', invoiceId: 'inv-007', studentId: 'stu-002', enrollmentId: 'enr-003', amount: 320000, paymentMethod: 'CARD', paidAt: '2026-05-06T14:00:00', handledBy: '한태준', receiptIssued: true },
  // 부분납 — inv-009의 일할계산 청구 중 일부만 수납된 상태
  { id: 'pay-007', invoiceId: 'inv-009', studentId: 'stu-003', enrollmentId: 'enr-004', amount: 100000, paymentMethod: 'CASH', paidAt: '2026-06-16T13:00:00', handledBy: '한태준', receiptIssued: false, memo: '일부 납부, 잔액 추후 수납 예정' },
  { id: 'pay-101', invoiceId: 'inv-101', studentId: 'stu-006', enrollmentId: 'enr-102', amount: 160000, paymentMethod: 'CARD', paidAt: '2024-01-08T10:00:00', handledBy: '한태준', receiptIssued: true },
  { id: 'pay-102', invoiceId: 'inv-102', studentId: 'stu-004', enrollmentId: 'enr-101', amount: 260000, paymentMethod: 'CARD', paidAt: '2024-05-03T10:00:00', handledBy: '한태준', receiptIssued: true },
];

// 영수증 자동 발급 mock — receiptIssued: true인 기존 Payment마다 1:1로 Receipt를 만든다(과거 v1/v2
// 데이터는 그대로 두고, 영수증이라는 새 데이터 구조만 확장해서 매칭한다). receiptIssued: false인
// 결제(pay-004/007)는 아직 발급 전이라 Receipt가 없다 — 화면에서 수동 발급(issueReceipt) 시 그때 생성된다.
export const DUMMY_RECEIPTS: Receipt[] = DUMMY_PAYMENTS
  .filter((p) => p.receiptIssued)
  .map((p, idx) => ({
    id: `rcpt-${p.id}`,
    paymentId: p.id,
    invoiceId: p.invoiceId,
    studentId: p.studentId,
    enrollmentId: p.enrollmentId,
    receiptNumber: generateReceiptNumber(p.paidAt, idx + 1),
    amount: p.amount,
    issuedAt: p.paidAt,
    issuedBy: p.handledBy,
  }));

export const DUMMY_REFUNDS: Refund[] = [
  // 승인 대기 — 행정이 요청만 등록한 상태
  { id: 'ref-001', invoiceId: 'inv-002', enrollmentId: 'enr-001', studentId: 'stu-001', requestedAmount: 50000, status: 'REQUESTED', requestedBy: '한태준', requestedAt: '2026-06-10T10:00:00', reason: '5월 수업 2회 결석으로 인한 부분 환불 요청' },
  // 승인 완료(아직 환불 완료는 아님) — 원장이 승인
  { id: 'ref-002', invoiceId: 'inv-007', enrollmentId: 'enr-003', studentId: 'stu-002', requestedAmount: 320000, approvedAmount: 320000, status: 'APPROVED', requestedBy: '한태준', approvedBy: '원장님', requestedAt: '2026-05-20T09:00:00', approvedAt: '2026-05-21T15:00:00', reason: '반 폐강으로 인한 전액 환불' },
  // 환불 완료까지 mock 처리된 사례
  { id: 'ref-003', invoiceId: 'inv-101', enrollmentId: 'enr-102', studentId: 'stu-006', requestedAmount: 160000, approvedAmount: 160000, status: 'COMPLETED', requestedBy: '한태준', approvedBy: '원장님', requestedAt: '2024-01-16T09:00:00', approvedAt: '2024-01-17T10:00:00', reason: '퇴원에 따른 잔여분 환불', memo: '계좌이체로 환불 완료(mock)' },
];

export const DUMMY_SETTLEMENTS: Settlement[] = [
  { id: 'stl-2026-04', month: '2026-04', totalBilled: 600000, totalPaid: 600000, totalUnpaid: 0, totalRefunded: 0, status: 'CONFIRMED', confirmedBy: '원장님', confirmedAt: '2026-05-02T10:00:00' },
  { id: 'stl-2026-05', month: '2026-05', totalBilled: 920000, totalPaid: 920000, totalUnpaid: 0, totalRefunded: 50000, status: 'CONFIRMED', confirmedBy: '원장님', confirmedAt: '2026-06-02T10:00:00' },
  { id: 'stl-2026-06', month: '2026-06', totalBilled: 1006000, totalPaid: 380000, totalUnpaid: 626000, totalRefunded: 0, status: 'DRAFT' },
];
