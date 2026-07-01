// AXIS LMS v1.2 - FinanceContext
// ClassContext.tsx/EnrollmentContext.tsx/AttendanceContext.tsx와 동일한 "mock 데이터를 useState로
// 보관하고 CRUD 함수를 노출"하는 패턴을 따른다.
//
// AXIS 확정 원칙: 매출 삭제, 수납 삭제 기능은 만들지 않는다(delete 관련 함수 자체가 없음). 환불은
// 행정이 요청(REQUESTED)을 등록하고, 원장/최고관리자가 승인(APPROVED)/반려(REJECTED)한 뒤 완료
// (COMPLETED)까지 mock으로 처리한다. 정산 확정도 DRAFT → CONFIRMED 상태 변경만 제공한다(되돌리기 없음
// — 이번 Foundation 단계에서는 확정 취소 기능까지는 만들지 않는다).
//
// Finance Foundation v2: addPayment/requestRefund/approveRefund/confirmSettlement가 전부
// `{ ok: boolean; reason?: string }` 형태로 검증 결과를 반환한다(AssessmentContext.addEnrollment와
// 동일한 패턴) — 화면은 ok가 false면 reason을 그대로 toast.error로 보여준다. 금액 검증은
// financeData.ts의 공통 helper(getInvoicePaidAmount/getInvoiceUnpaidAmount/getRefundableAmount/
// calculateInvoiceStatus)를 그대로 재사용해, 검증 기준이 화면(FinancePayments 등)과 항상 일치한다.
//
// Finance Foundation v3: EnrollmentContext에 의존성을 추가해(ClassProvider/EnrollmentProvider가
// FinanceProvider보다 바깥에 있으므로 가능) 매월 1일 자동 청구서 생성 구조를 구현한다 —
// enrollments가 바뀔 때마다(신규 등록/종료/퇴원) generateMonthlyInvoices를 다시 호출해 "이번 달에
// 아직 청구되지 않은 수강"만 idempotent하게 보충 생성한다. 실제 매월 1일 00시 실행은 서버 스케줄러의
// 영역이라 이 mock 환경에서는 "그 시점까지 누락된 이번 달 청구를 채운다"로 구조를 시연한다.
// 수납(Payment) 등록 시 영수증(Receipt)을 자동 발급한다(데이터 구조만 — PDF 출력은 다음 단계).

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  Invoice, Payment, Refund, Settlement, Receipt, PaymentMethod,
  DUMMY_INVOICES, DUMMY_PAYMENTS, DUMMY_REFUNDS, DUMMY_SETTLEMENTS, DUMMY_RECEIPTS,
  getInvoicePaidAmount, getInvoiceUnpaidAmount, getRefundableAmount, calculateInvoiceStatus,
  generateMonthlyInvoices, generateReceiptNumber, currentBillingMonth,
  calculateMonthlySettlement,
} from '@/lib/financeData';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';

interface AddPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  handledBy: string;
  memo?: string;
}

interface RequestRefundInput {
  invoiceId: string;
  requestedAmount: number;
  requestedBy: string;
  reason: string;
  memo?: string;
}

interface FinanceContextType {
  invoices: Invoice[];
  payments: Payment[];
  refunds: Refund[];
  settlements: Settlement[];
  receipts: Receipt[];

  // 조회 — 금액 계산은 전부 financeData.ts의 공통 helper에 위임한다(화면과 검증 로직이 항상 같은 기준을 본다).
  getInvoicesByEnrollment: (enrollmentId: string) => Invoice[];
  getInvoicesByStudent: (studentId: string) => Invoice[];
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getRefundsByInvoice: (invoiceId: string) => Refund[];
  getPaidAmount: (invoiceId: string) => number;
  getUnpaidAmount: (invoiceId: string) => number;
  getRefundable: (invoiceId: string) => number;
  getReceiptByPayment: (paymentId: string) => Receipt | undefined;

  // 수납 — mock 등록만 제공(실제 결제 연동 없음). 0원 이하/미납액 초과/완납 청구서 추가수납은 거부한다.
  addPayment: (input: AddPaymentInput) => { ok: boolean; reason?: string; payment?: Payment };
  issueReceipt: (paymentId: string) => void;

  // 환불 — 요청(행정) → 승인/반려(원장·최고관리자) → 완료(mock). 각 단계마다 금액 한도를 재검증한다.
  requestRefund: (input: RequestRefundInput) => { ok: boolean; reason?: string; refund?: Refund };
  approveRefund: (refundId: string, approvedAmount: number, approvedBy: string) => { ok: boolean; reason?: string };
  rejectRefund: (refundId: string, approvedBy: string) => void;
  completeRefund: (refundId: string) => void;

  // 정산 — DRAFT → CONFIRMED만 제공(원장/최고관리자 전용, 화면에서 권한 가드). 이미 확정된 정산은 거부한다.
  confirmSettlement: (settlementId: string, confirmedBy: string) => { ok: boolean; reason?: string };

  // 매월 1일 자동 청구서 생성 — enrollments 변경 시 Context가 자동으로 호출하지만, 화면에서 "지금
  // 다시 동기화" 같은 수동 트리거도 둘 수 있도록 같은 함수를 노출한다(idempotent라 몇 번 눌러도 안전).
  generateInvoicesForMonth: (month: string) => number; // 새로 생성된 청구서 수를 반환

  // 정산 레코드 자동 생성 — invoices가 존재하지만 Settlement 레코드가 없는 달을 보충한다.
  // 이미 레코드가 있으면 기존 레코드를 그대로 반환(idempotent).
  // 정산 화면에서 "누락된 달 정산 생성" 버튼을 통해 호출한다.
  generateSettlementForMonth: (month: string) => Settlement;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { enrollments } = useEnrollment();
  const { createNotificationFromEvent } = useNotification();
  const { students } = useStudents();
  const [invoices, setInvoices] = useState<Invoice[]>(DUMMY_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(DUMMY_PAYMENTS);
  const [refunds, setRefunds] = useState<Refund[]>(DUMMY_REFUNDS);
  const [settlements, setSettlements] = useState<Settlement[]>(DUMMY_SETTLEMENTS);
  const [receipts, setReceipts] = useState<Receipt[]>(DUMMY_RECEIPTS);

  // 학생 정보 조회 헬퍼 (알림 이력 생성용)
  const getStudentInfoForNotif = useCallback((studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const guardian = student?.guardians?.[0];
    return {
      studentName: student?.name,
      guardianName: guardian?.name,
      guardianPhone: guardian?.phone,
    };
  }, [students]);

  // 매월 1일 자동 청구서 생성(구조) — enrollments가 바뀔 때마다(신규 등록/종료/퇴원) 이번 달 청구서가
  // 누락된 활성 수강을 idempotent하게 채워 넣는다. 실제 서비스에서는 서버 스케줄러가 매월 1일 00시에
  // 동일한 함수를 호출하면 된다; 이 mock 환경에서는 앱이 켜져 있는 동안 enrollments 변경을 트리거로
  // 사용해 같은 구조를 시연한다(신규 수강 등록 직후 즉시 이번 달 일할 청구서가 생기는 것도 이 경로다).
  useEffect(() => {
    const month = currentBillingMonth();
    setInvoices((prev) => {
      const newOnes = generateMonthlyInvoices(month, enrollments, prev);
      return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
    });
  }, [enrollments]);

  const generateInvoicesForMonth = useCallback((month: string): number => {
    let createdCount = 0;
    setInvoices((prev) => {
      const newOnes = generateMonthlyInvoices(month, enrollments, prev);
      createdCount = newOnes.length;
      return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
    });
    return createdCount;
  }, [enrollments]);

  const getReceiptByPayment = useCallback((paymentId: string) => receipts.find((r) => r.paymentId === paymentId), [receipts]);

  // 영수증 자동 발급 — 다음 발급 순번은 누적 발급 건수 + 1로 단순하게 매긴다(Foundation 단계).
  const issueReceiptFor = useCallback((payment: Payment): Receipt => {
    const newReceipt: Receipt = {
      id: `rcpt-${payment.id}`,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      enrollmentId: payment.enrollmentId,
      receiptNumber: generateReceiptNumber(payment.paidAt, receipts.length + 1),
      amount: payment.amount,
      issuedAt: payment.paidAt,
      issuedBy: payment.handledBy,
    };
    setReceipts((prev) => [...prev, newReceipt]);
    return newReceipt;
  }, [receipts]);

  const getInvoicesByEnrollment = useCallback((enrollmentId: string) => invoices.filter(i => i.enrollmentId === enrollmentId), [invoices]);
  const getInvoicesByStudent = useCallback((studentId: string) => invoices.filter(i => i.studentId === studentId), [invoices]);
  const getPaymentsByInvoice = useCallback((invoiceId: string) => payments.filter(p => p.invoiceId === invoiceId), [payments]);
  const getRefundsByInvoice = useCallback((invoiceId: string) => refunds.filter(r => r.invoiceId === invoiceId), [refunds]);
  const getPaidAmount = useCallback((invoiceId: string) => getInvoicePaidAmount(invoiceId, payments), [payments]);
  const getUnpaidAmount = useCallback((invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    return inv ? getInvoiceUnpaidAmount(inv, payments) : 0;
  }, [invoices, payments]);
  const getRefundable = useCallback((invoiceId: string) => getRefundableAmount(invoiceId, payments, refunds), [payments, refunds]);

  // 수납 등록 — 실제 결제 연동 없이 mock으로 Payment를 추가하고, 그 Invoice의 status를 누적 수납액
  // 기준으로 재계산한다(완납 시 PAID, 일부만 납부 시 PARTIAL). AXIS 확정 원칙 4: 수납금액은 남은
  // 미납금액을 초과할 수 없다.
  const addPayment = useCallback((input: AddPaymentInput): { ok: boolean; reason?: string; payment?: Payment } => {
    const invoice = invoices.find(i => i.id === input.invoiceId);
    if (!invoice) return { ok: false, reason: '청구서를 찾을 수 없습니다.' };
    if (invoice.status === 'PAID') return { ok: false, reason: '이미 완납된 청구서입니다.' };
    if (invoice.status === 'CANCELED') return { ok: false, reason: '취소된 청구서에는 수납을 등록할 수 없습니다.' };
    if (!input.amount || input.amount <= 0) return { ok: false, reason: '수납금액은 0원보다 커야 합니다.' };
    const unpaid = getInvoiceUnpaidAmount(invoice, payments);
    if (input.amount > unpaid) return { ok: false, reason: '수납금액은 남은 미납금액을 초과할 수 없습니다.' };

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: input.invoiceId,
      studentId: invoice.studentId,
      enrollmentId: invoice.enrollmentId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paidAt: new Date().toISOString(),
      handledBy: input.handledBy,
      receiptIssued: true, // Finance Foundation v3: 수납 등록 즉시 영수증을 자동 발급한다(데이터 구조만 — PDF는 다음 단계)
      memo: input.memo,
    };
    const nextPayments = [...payments, newPayment];
    setPayments(nextPayments);
    setInvoices(prev => prev.map(inv => (
      inv.id !== input.invoiceId ? inv : { ...inv, status: calculateInvoiceStatus(inv, nextPayments) }
    )));
    issueReceiptFor(newPayment);
    return { ok: true, payment: newPayment };
  }, [invoices, payments, issueReceiptFor]);

  // 레거시 수동 발급 — v1/v2 mock 데이터 중 receiptIssued:false로 남아있던 결제(자동 발급 도입 전
  // 상태를 보존)에 대해, 담당자가 버튼으로 직접 발급하면 이 시점에 Receipt를 생성한다.
  const issueReceipt = useCallback((paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment || payment.receiptIssued) return;
    setPayments(prev => prev.map(p => (p.id === paymentId ? { ...p, receiptIssued: true } : p)));
    issueReceiptFor(payment);
  }, [payments, issueReceiptFor]);

  // 환불 요청 등록 — 행정/원장/최고관리자가 등록(화면에서 canRequestRefund로 게이트). AXIS 확정
  // 원칙 5: 환불요청액은 실제 수납된 금액을 초과할 수 없다. 이미 완료/승인된 환불이 있으면 그만큼
  // 차감한 "환불 가능 금액"을 기준으로 다시 제한한다.
  const requestRefund = useCallback((input: RequestRefundInput): { ok: boolean; reason?: string; refund?: Refund } => {
    const invoice = invoices.find(i => i.id === input.invoiceId);
    if (!invoice) return { ok: false, reason: '청구서를 찾을 수 없습니다.' };
    if (invoice.status === 'CANCELED') return { ok: false, reason: '취소된 청구서는 환불 요청을 할 수 없습니다.' };
    const paid = getInvoicePaidAmount(invoice.id, payments);
    if (paid <= 0) return { ok: false, reason: '미수납 청구서는 환불 요청을 할 수 없습니다.' };
    if (!input.requestedAmount || input.requestedAmount <= 0) return { ok: false, reason: '환불요청액은 0원보다 커야 합니다.' };
    if (input.requestedAmount > paid) return { ok: false, reason: '환불요청액은 실제 수납금액을 초과할 수 없습니다.' };
    const refundable = getRefundableAmount(invoice.id, payments, refunds);
    if (input.requestedAmount > refundable) {
      return { ok: false, reason: `환불요청액은 남은 환불 가능 금액(${refundable.toLocaleString()}원)을 초과할 수 없습니다.` };
    }

    const newRefund: Refund = {
      id: `ref-${Date.now()}`,
      invoiceId: input.invoiceId,
      enrollmentId: invoice.enrollmentId,
      studentId: invoice.studentId,
      requestedAmount: input.requestedAmount,
      status: 'REQUESTED',
      requestedBy: input.requestedBy,
      requestedAt: new Date().toISOString(),
      reason: input.reason,
      memo: input.memo,
    };
    setRefunds(prev => [...prev, newRefund]);

    // 알림 이력 생성 — FINANCE_REFUND_REQUESTED
    const rInfo = getStudentInfoForNotif(invoice.studentId);
    createNotificationFromEvent('FINANCE_REFUND_REQUESTED', {
      studentId: invoice.studentId,
      studentName: rInfo.studentName,
      guardianName: rInfo.guardianName,
      guardianPhone: rInfo.guardianPhone,
      relatedEntityType: 'FINANCE',
      relatedEntityId: newRefund.id,
      requestedBy: input.requestedBy,
      vars: {
        학생명: rInfo.studentName,
        보호자명: rInfo.guardianName,
        환불금액: input.requestedAmount.toLocaleString(),
      },
    });

    return { ok: true, refund: newRefund };
  }, [invoices, payments, refunds]);

  // 환불 승인/반려 — 원장/최고관리자만(화면에서 canApproveRefund로 게이트, 행정은 버튼 자체가 보이지
  // 않아 호출 자체가 일어나지 않는다). AXIS 확정 원칙 6: 승인금액은 환불요청액을 초과할 수 없고,
  // 동시에 그 시점의 실제 환불 가능 금액(다른 환불이 먼저 처리됐을 수 있으므로 재검증)도 넘을 수 없다.
  const approveRefund = useCallback((refundId: string, approvedAmount: number, approvedBy: string): { ok: boolean; reason?: string } => {
    const refund = refunds.find(r => r.id === refundId);
    if (!refund) return { ok: false, reason: '환불 요청을 찾을 수 없습니다.' };
    if (refund.status !== 'REQUESTED') return { ok: false, reason: '이미 처리된 환불 요청입니다.' };
    if (!approvedAmount || approvedAmount <= 0) return { ok: false, reason: '승인금액은 0원보다 커야 합니다.' };
    if (approvedAmount > refund.requestedAmount) return { ok: false, reason: '승인금액은 환불요청액을 초과할 수 없습니다.' };
    const refundable = getRefundableAmount(refund.invoiceId, payments, refunds);
    if (approvedAmount > refundable) {
      return { ok: false, reason: `승인금액은 실제 환불 가능 금액(${refundable.toLocaleString()}원)을 초과할 수 없습니다.` };
    }

    setRefunds(prev => prev.map(r => (r.id === refundId
      ? { ...r, status: 'APPROVED', approvedAmount, approvedBy, approvedAt: new Date().toISOString() }
      : r)));

    // 알림 이력 생성 — FINANCE_REFUND_APPROVED
    const aInfo = getStudentInfoForNotif(refund.studentId);
    createNotificationFromEvent('FINANCE_REFUND_APPROVED', {
      studentId: refund.studentId,
      studentName: aInfo.studentName,
      guardianName: aInfo.guardianName,
      guardianPhone: aInfo.guardianPhone,
      relatedEntityType: 'FINANCE',
      relatedEntityId: refundId,
      requestedBy: approvedBy,
      vars: {
        학생명: aInfo.studentName,
        보호자명: aInfo.guardianName,
        환불금액: approvedAmount.toLocaleString(),
      },
    });

    return { ok: true };
  }, [refunds, payments]);

  const rejectRefund = useCallback((refundId: string, approvedBy: string) => {
    const refund = refunds.find(r => r.id === refundId);
    setRefunds(prev => prev.map(r => (r.id === refundId
      ? { ...r, status: 'REJECTED', approvedBy, approvedAt: new Date().toISOString() }
      : r)));

    // 알림 이력 생성 — FINANCE_REFUND_REJECTED
    if (refund) {
      const rjInfo = getStudentInfoForNotif(refund.studentId);
      createNotificationFromEvent('FINANCE_REFUND_REJECTED', {
        studentId: refund.studentId,
        studentName: rjInfo.studentName,
        guardianName: rjInfo.guardianName,
        guardianPhone: rjInfo.guardianPhone,
        relatedEntityType: 'FINANCE',
        relatedEntityId: refundId,
        requestedBy: approvedBy,
        vars: {
          학생명: rjInfo.studentName,
          보호자명: rjInfo.guardianName,
          환불금액: refund.requestedAmount.toLocaleString(),
        },
      });
    }
  }, [refunds, getStudentInfoForNotif, createNotificationFromEvent]);

  // 환불 완료 처리 — 실제 계좌 환불/PG 취소 연동 없이 상태만 COMPLETED로 변경(mock).
  const completeRefund = useCallback((refundId: string) => {
    const refund = refunds.find(r => r.id === refundId);
    setRefunds(prev => prev.map(r => (r.id === refundId ? { ...r, status: 'COMPLETED' } : r)));

    // 알림 이력 생성 — FINANCE_REFUND_COMPLETED
    if (refund) {
      const cInfo = getStudentInfoForNotif(refund.studentId);
      createNotificationFromEvent('FINANCE_REFUND_COMPLETED', {
        studentId: refund.studentId,
        studentName: cInfo.studentName,
        guardianName: cInfo.guardianName,
        guardianPhone: cInfo.guardianPhone,
        relatedEntityType: 'FINANCE',
        relatedEntityId: refundId,
        requestedBy: '시스템',
        vars: {
          학생명: cInfo.studentName,
          보호자명: cInfo.guardianName,
          환불금액: (refund.approvedAmount ?? refund.requestedAmount).toLocaleString(),
        },
      });
    }
  }, [refunds, getStudentInfoForNotif, createNotificationFromEvent]);

  // 정산 확정 — 원장/최고관리자만(화면에서 canConfirmSettlement로 게이트). 확정 후 되돌리기는 제공하지
  // 않으며, 이미 CONFIRMED인 정산은 다시 확정할 수 없다(AXIS 확정 원칙).
  const confirmSettlement = useCallback((settlementId: string, confirmedBy: string): { ok: boolean; reason?: string } => {
    const settlement = settlements.find(s => s.id === settlementId);
    if (!settlement) return { ok: false, reason: '정산 항목을 찾을 수 없습니다.' };
    if (settlement.status === 'CONFIRMED') return { ok: false, reason: '이미 확정된 정산입니다.' };

    setSettlements(prev => prev.map(s => (s.id === settlementId
      ? { ...s, status: 'CONFIRMED', confirmedBy, confirmedAt: new Date().toISOString() }
      : s)));
    return { ok: true };
  }, [settlements]);

  // 정산 레코드 자동 생성 — invoices는 있지만 Settlement 레코드가 없는 달을 보충한다.
  // calculateMonthlySettlement로 실시간 합산값을 총계로 사용하고 DRAFT 상태로 생성한다.
  // idempotent: 이미 레코드가 있으면 기존 레코드를 그대로 반환한다.
  const generateSettlementForMonth = useCallback((month: string): Settlement => {
    const existing = settlements.find(s => s.month === month);
    if (existing) return existing;

    const amounts = calculateMonthlySettlement(month, invoices, payments, refunds);
    const newSettlement: Settlement = {
      id: `stl-auto-${month}`,
      month,
      totalBilled:   amounts.totalBilled,
      totalPaid:     amounts.totalPaid,
      totalUnpaid:   amounts.totalUnpaid,
      totalRefunded: amounts.totalRefunded,
      status: 'DRAFT',
    };
    setSettlements(prev => [...prev, newSettlement]);
    return newSettlement;
  }, [settlements, invoices, payments, refunds]);

  return (
    <FinanceContext.Provider value={{
      invoices, payments, refunds, settlements, receipts,
      getInvoicesByEnrollment, getInvoicesByStudent, getPaymentsByInvoice, getRefundsByInvoice,
      getPaidAmount, getUnpaidAmount, getRefundable, getReceiptByPayment,
      addPayment, issueReceipt,
      requestRefund, approveRefund, rejectRefund, completeRefund,
      confirmSettlement, generateInvoicesForMonth, generateSettlementForMonth,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

// ─── Phase 3A-2 / Phase 3D v2: 학생 role 재무 데이터 원천 차단 ──────────────────────
// (Phase 3D v2 재검증: v1 시점에는 StudentFinance.tsx가 라우팅되어 있었고 useFinance()를
// 직접 호출하고 있었다 — 이 훅 레벨 차단 덕분에 실제 STUDENT 계정에는 항상 빈 배열/0원만
// 반환되어 실데이터 유출은 없었지만, "UI에서 숨기는 것만으로는 불충분하다"는 원칙과
// 별개로 재무 화면 자체가 URL로 도달 가능했던 것 자체가 정책 위반이었다. v2에서
// StudentRoutes.tsx의 /student/finance 라우트와 import를 제거하고 StudentFinance.tsx를
// useFinance()를 호출하지 않는 완전한 stub으로 교체해 이제는 아래 조건 자체가 실제로
// "어떤 학생 화면도 useFinance()를 호출하지 않는다"를 만족한다.)
// 그래도 이 데이터 계층(훅 레벨) 차단은 그대로 유지한다 — 앞으로 실수로 학생 화면에서
// useFinance()가 다시 호출되더라도 실데이터가 반환되지 않도록 하는 이중 안전망이다.
// App.tsx의 Provider 순서상 FinanceProvider가 AuthProvider보다 바깥(상위)에 위치해
// FinanceProvider 자체에서는 useAuth()를 호출할 수 없으므로, 실제 소비 지점인
// useFinance() 훅에서 role을 검사해 STUDENT 계정에는 실제 데이터를 절대 반환하지 않는다.
const STUDENT_BLOCKED_REASON = '학생 계정은 재무 데이터에 접근할 수 없습니다.';

const STUDENT_SAFE_FINANCE: FinanceContextType = {
  invoices: [], payments: [], refunds: [], settlements: [], receipts: [],
  getInvoicesByEnrollment: () => [],
  getInvoicesByStudent: () => [],
  getPaymentsByInvoice: () => [],
  getRefundsByInvoice: () => [],
  getPaidAmount: () => 0,
  getUnpaidAmount: () => 0,
  getRefundable: () => 0,
  getReceiptByPayment: () => undefined,
  addPayment: () => ({ ok: false, reason: STUDENT_BLOCKED_REASON }),
  issueReceipt: () => {},
  requestRefund: () => ({ ok: false, reason: STUDENT_BLOCKED_REASON }),
  approveRefund: () => ({ ok: false, reason: STUDENT_BLOCKED_REASON }),
  rejectRefund: () => {},
  completeRefund: () => {},
  confirmSettlement: () => ({ ok: false, reason: STUDENT_BLOCKED_REASON }),
  generateInvoicesForMonth: () => 0,
  generateSettlementForMonth: (month: string) => ({
    id: 'blocked', month, totalBilled: 0, totalPaid: 0, totalUnpaid: 0, totalRefunded: 0, status: 'DRAFT',
  }),
};

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  const { currentUser } = useAuth();
  if (currentUser?.position === 'STUDENT') {
    return STUDENT_SAFE_FINANCE;
  }
  return ctx;
}
