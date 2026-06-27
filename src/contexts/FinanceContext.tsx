// AXIS LMS v1.2 - FinanceContext
// ClassContext.tsx/EnrollmentContext.tsx/AttendanceContext.tsx와 동일한 "mock 데이터를 useState로
// 보관하고 CRUD 함수를 노출"하는 패턴을 따른다.
//
// AXIS 확정 원칙: 매출 삭제, 수납 삭제 기능은 만들지 않는다(delete 관련 함수 자체가 없음). 환불은
// 행정이 요청(REQUESTED)을 등록하고, 원장/최고관리자가 승인(APPROVED)/반려(REJECTED)한 뒤 완료
// (COMPLETED)까지 mock으로 처리한다. 정산 확정도 DRAFT → CONFIRMED 상태 변경만 제공한다(되돌리기 없음
// — 이번 Foundation 단계에서는 확정 취소 기능까지는 만들지 않는다).

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Invoice, Payment, Refund, Settlement, PaymentMethod, InvoiceStatus,
  DUMMY_INVOICES, DUMMY_PAYMENTS, DUMMY_REFUNDS, DUMMY_SETTLEMENTS,
} from '@/lib/financeData';

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

  // 조회
  getInvoicesByEnrollment: (enrollmentId: string) => Invoice[];
  getInvoicesByStudent: (studentId: string) => Invoice[];
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getRefundsByInvoice: (invoiceId: string) => Refund[];
  getPaidAmount: (invoiceId: string) => number;

  // 수납 — mock 등록만 제공(실제 결제 연동 없음)
  addPayment: (input: AddPaymentInput) => Payment;
  issueReceipt: (paymentId: string) => void;

  // 환불 — 요청(행정) → 승인/반려(원장·최고관리자) → 완료(mock)
  requestRefund: (input: RequestRefundInput) => Refund;
  approveRefund: (refundId: string, approvedAmount: number, approvedBy: string) => void;
  rejectRefund: (refundId: string, approvedBy: string) => void;
  completeRefund: (refundId: string) => void;

  // 정산 — DRAFT → CONFIRMED만 제공(원장/최고관리자 전용, 화면에서 권한 가드)
  confirmSettlement: (settlementId: string, confirmedBy: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

// Invoice 1건의 누적 수납액을 기준으로 status를 재계산한다(UNPAID/PARTIAL/PAID). CANCELED는
// 별도 취소 액션이 있을 때만 설정되는 상태라 이 Foundation 단계의 자동 재계산 대상에서는 제외한다.
function recalcStatus(finalAmount: number, paidSoFar: number, currentStatus: InvoiceStatus): InvoiceStatus {
  if (currentStatus === 'CANCELED') return 'CANCELED';
  if (paidSoFar <= 0) return 'UNPAID';
  if (paidSoFar >= finalAmount) return 'PAID';
  return 'PARTIAL';
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(DUMMY_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(DUMMY_PAYMENTS);
  const [refunds, setRefunds] = useState<Refund[]>(DUMMY_REFUNDS);
  const [settlements, setSettlements] = useState<Settlement[]>(DUMMY_SETTLEMENTS);

  const getInvoicesByEnrollment = useCallback((enrollmentId: string) => invoices.filter(i => i.enrollmentId === enrollmentId), [invoices]);
  const getInvoicesByStudent = useCallback((studentId: string) => invoices.filter(i => i.studentId === studentId), [invoices]);
  const getPaymentsByInvoice = useCallback((invoiceId: string) => payments.filter(p => p.invoiceId === invoiceId), [payments]);
  const getRefundsByInvoice = useCallback((invoiceId: string) => refunds.filter(r => r.invoiceId === invoiceId), [refunds]);
  const getPaidAmount = useCallback((invoiceId: string) => payments.filter(p => p.invoiceId === invoiceId).reduce((s, p) => s + p.amount, 0), [payments]);

  // 수납 등록 — 실제 결제 연동 없이 mock으로 Payment를 추가하고, 그 Invoice의 status를 누적 수납액
  // 기준으로 재계산한다(완납 시 PAID, 일부만 납부 시 PARTIAL).
  const addPayment = useCallback((input: AddPaymentInput): Payment => {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: input.invoiceId,
      studentId: invoices.find(i => i.id === input.invoiceId)?.studentId ?? '',
      enrollmentId: invoices.find(i => i.id === input.invoiceId)?.enrollmentId ?? '',
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paidAt: new Date().toISOString(),
      handledBy: input.handledBy,
      receiptIssued: false,
      memo: input.memo,
    };
    setPayments(prev => [...prev, newPayment]);
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== input.invoiceId) return inv;
      const paidSoFar = payments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0) + input.amount;
      return { ...inv, status: recalcStatus(inv.finalAmount, paidSoFar, inv.status) };
    }));
    return newPayment;
  }, [invoices, payments]);

  const issueReceipt = useCallback((paymentId: string) => {
    setPayments(prev => prev.map(p => (p.id === paymentId ? { ...p, receiptIssued: true } : p)));
  }, []);

  // 환불 요청 등록 — 행정/원장/최고관리자가 등록(화면에서 canRequestRefund로 게이트).
  const requestRefund = useCallback((input: RequestRefundInput): Refund => {
    const invoice = invoices.find(i => i.id === input.invoiceId);
    const newRefund: Refund = {
      id: `ref-${Date.now()}`,
      invoiceId: input.invoiceId,
      enrollmentId: invoice?.enrollmentId ?? '',
      studentId: invoice?.studentId ?? '',
      requestedAmount: input.requestedAmount,
      status: 'REQUESTED',
      requestedBy: input.requestedBy,
      requestedAt: new Date().toISOString(),
      reason: input.reason,
      memo: input.memo,
    };
    setRefunds(prev => [...prev, newRefund]);
    return newRefund;
  }, [invoices]);

  // 환불 승인/반려 — 원장/최고관리자만(화면에서 canApproveRefund로 게이트, 행정은 호출 자체가 불가능하도록 막음).
  const approveRefund = useCallback((refundId: string, approvedAmount: number, approvedBy: string) => {
    setRefunds(prev => prev.map(r => (r.id === refundId
      ? { ...r, status: 'APPROVED', approvedAmount, approvedBy, approvedAt: new Date().toISOString() }
      : r)));
  }, []);

  const rejectRefund = useCallback((refundId: string, approvedBy: string) => {
    setRefunds(prev => prev.map(r => (r.id === refundId
      ? { ...r, status: 'REJECTED', approvedBy, approvedAt: new Date().toISOString() }
      : r)));
  }, []);

  // 환불 완료 처리 — 실제 계좌 환불/PG 취소 연동 없이 상태만 COMPLETED로 변경(mock).
  const completeRefund = useCallback((refundId: string) => {
    setRefunds(prev => prev.map(r => (r.id === refundId ? { ...r, status: 'COMPLETED' } : r)));
  }, []);

  // 정산 확정 — 원장/최고관리자만(화면에서 canConfirmSettlement로 게이트). 확정 후 되돌리기는 제공하지 않는다.
  const confirmSettlement = useCallback((settlementId: string, confirmedBy: string) => {
    setSettlements(prev => prev.map(s => (s.id === settlementId
      ? { ...s, status: 'CONFIRMED', confirmedBy, confirmedAt: new Date().toISOString() }
      : s)));
  }, []);

  return (
    <FinanceContext.Provider value={{
      invoices, payments, refunds, settlements,
      getInvoicesByEnrollment, getInvoicesByStudent, getPaymentsByInvoice, getRefundsByInvoice, getPaidAmount,
      addPayment, issueReceipt,
      requestRefund, approveRefund, rejectRefund, completeRefund,
      confirmSettlement,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
