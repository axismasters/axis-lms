// AXIS LMS v1.2 - 수납관리 화면 (RBAC Global Permission QA v1 buildfix)
// 청구(Invoice)는 학생이 아니라 수강(Enrollment) 단위로 관리된다.
// 한 학생이 여러 반을 수강하면 반마다 별도의 청구 행이 표시된다.
//
// RBAC QA buildfix 반영:
// 1. classData.ts 전체 덮어쓰기 없이 담당강사 표시를 파일 내부 helper로 유지.
// 2. helper는 unknown 안전 접근 방식으로 유지해 ClassRoom 타입/필드명 변동에 따른 build 회귀를 줄인다.
// 3. wouter useSearch 제거 및 hook early return 이전 배치는 이전 buildfix 상태를 유지한다.
//
// 권한: canManageFinance(can)로 페이지 진입 자체를 가드(SUPER_ADMIN/DIRECTOR/STAFF만 통과).
// 수납 등록은 canCreatePayment, 영수증 발급/조회는 canIssueReceipt로 별도 게이트한다.

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { useNotification } from '@/contexts/NotificationContext';
import FinanceSummaryCards from '@/components/FinanceSummaryCards';
import {
  Invoice, PaymentMethod, InvoiceStatus,
  PAYMENT_METHOD_LABEL, INVOICE_STATUS_LABEL,
  canManageFinance, canCreatePayment, canIssueReceipt, currentBillingMonth,
} from '@/lib/financeData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Receipt, StickyNote, CreditCard, Info, Eye, Send } from 'lucide-react';

// ★ 로컬 helper — classData.ts export로 만들지 않는다.
//   작은 helper 하나를 위해 classData.ts 전체를 덮어쓰면 반 관리 데이터 회귀 위험이 있다.
//   타입/필드명이 달라져도 Finance 화면이 깨지지 않도록 unknown 안전 접근을 유지한다.
function getTeacherName(cls: unknown): string {
  const record = cls as { teacher?: string; teacherName?: string; instructorName?: string; mainTeacher?: string } | null | undefined;
  return record?.teacher ?? record?.teacherName ?? record?.instructorName ?? record?.mainTeacher ?? '';
}

function thisMonthStr() { return currentBillingMonth(); }
function won(n: number) { return `${n.toLocaleString()}원`; }

const STATUS_STYLE: Record<InvoiceStatus, { bg: string; text: string }> = {
  UNPAID:   { bg: 'oklch(0.96 0.08 27)',    text: 'oklch(0.5 0.18 27)' },
  PARTIAL:  { bg: 'oklch(0.96 0.06 60)',    text: 'oklch(0.45 0.13 60)' },
  PAID:     { bg: 'oklch(0.94 0.08 160)',   text: 'oklch(0.3 0.13 160)' },
  CANCELED: { bg: 'oklch(0.95 0.005 250)',  text: 'oklch(0.55 0.015 250)' },
};

export default function FinancePayments() {
  const { currentUser, can } = useAuth();
  const { invoices, getPaymentsByInvoice, getPaidAmount, addPayment, issueReceipt, getReceiptByPayment, refunds } = useFinance();
  const { students } = useStudents();
  const { classes, getClass } = useClasses();
  const { enrollments } = useEnrollment();
  const { createNotificationFromEvent } = useNotification();

  // ── 모든 hook은 canManageFinance early return 이전에 위치한다 ──────────
  const [filterMonth,   setFilterMonth]   = useState(thisMonthStr());
  const [filterStudent, setFilterStudent] = useState('');
  const [filterClass,   setFilterClass]   = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterStatus,  setFilterStatus]  = useState<InvoiceStatus | 'all'>('all');
  const [filterMethod,  setFilterMethod]  = useState<PaymentMethod | 'all'>('all');

  const [paymentModal, setPaymentModal] = useState<{ invoice: Invoice; remaining: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payMemo,   setPayMemo]   = useState('');

  const [memoModal,            setMemoModal]            = useState<Invoice | null>(null);
  const [receiptViewInvoiceId, setReceiptViewInvoiceId] = useState<string | null>(null);

  const studentMap    = useMemo(() => new Map(students.map(s => [s.id, s])),    [students]);
  const enrollmentMap = useMemo(() => new Map(enrollments.map(e => [e.id, e])), [enrollments]);

  // ★ 로컬 helper getTeacherName 기반으로 고유 강사명 추출
  const teachers = useMemo(
    () => Array.from(new Set(classes.map(c => getTeacherName(c)).filter(Boolean))).sort(),
    [classes],
  );

  // ★ QA v1: filtered useMemo를 early return 이전으로 이동
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (filterMonth && inv.billingMonth !== filterMonth) return false;
      if (filterStudent) {
        const stu = studentMap.get(inv.studentId);
        if (!stu || !stu.name.includes(filterStudent)) return false;
      }
      if (filterClass !== 'all' && inv.classId !== filterClass) return false;
      if (filterTeacher !== 'all') {
        const cls = getClass(inv.classId);
        if (getTeacherName(cls) !== filterTeacher) return false;
      }
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
      if (filterMethod !== 'all') {
        const pays = getPaymentsByInvoice(inv.id);
        if (!pays.some(p => p.paymentMethod === filterMethod)) return false;
      }
      return true;
    }).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
  }, [invoices, filterMonth, filterStudent, filterClass, filterTeacher, filterStatus, filterMethod, studentMap, getClass, getPaymentsByInvoice]);

  // ★ QA v1: summary useMemo를 early return 이전으로 이동
  const summary = useMemo(() => {
    const thisMonth     = thisMonthStr();
    const monthInvoices = invoices.filter(i => i.billingMonth === thisMonth);
    const billed        = monthInvoices.reduce((s, i) => s + i.finalAmount, 0);
    const paid          = monthInvoices.reduce((s, i) => s + getPaidAmount(i.id), 0);
    const unpaid        = monthInvoices.reduce((s, i) => s + Math.max(0, i.finalAmount - getPaidAmount(i.id)), 0);
    const refundRequested = refunds.filter(r => r.status === 'REQUESTED').reduce((s, r) => s + r.requestedAmount, 0);
    const paidCount     = monthInvoices.filter(i => i.status === 'PAID').length;
    return { billed, paid, unpaid, refundRequested, paidCount };
  }, [invoices, getPaidAmount, refunds]);

  // ★ QA v1: wouter useSearch 제거 → window.location.search 기반으로 변경
  // FinanceUnpaid에서 ?invoiceId=... 로 이동했을 때 수납 등록 모달을 자동으로 연다
  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const preId = params.get('invoiceId');
    if (!preId) return;
    const inv = invoices.find(i => i.id === preId);
    if (!inv) return;
    if (inv.status === 'PAID' || inv.status === 'CANCELED') return;
    const remaining = Math.max(0, inv.finalAmount - getPaidAmount(inv.id));
    if (remaining <= 0) return;
    setPaymentModal({ invoice: inv, remaining });
    setPayAmount(String(remaining));
    setPayMethod('CASH');
    setPayMemo('');
  }, [invoices, getPaidAmount]);
  // ────────────────────────────────────────────────────────────────────────

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '수납관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }
  const canPay     = canCreatePayment(can);
  const canReceipt = canIssueReceipt(can);

  const openPaymentModal = (inv: Invoice) => {
    const remaining = Math.max(0, inv.finalAmount - getPaidAmount(inv.id));
    setPaymentModal({ invoice: inv, remaining });
    setPayAmount(String(remaining));
    setPayMethod('CASH');
    setPayMemo('');
  };

  const savePayment = () => {
    if (!paymentModal) return;
    const amount = Number(payAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) { toast.error('수납금액은 0원보다 커야 합니다.'); return; }
    const result = addPayment({ invoiceId: paymentModal.invoice.id, amount, paymentMethod: payMethod, handledBy: currentUser.name, memo: payMemo.trim() || undefined });
    if (!result.ok) { toast.error(result.reason ?? '수납 등록에 실패했습니다.'); return; }
    toast.success(`${won(amount)} 수납이 등록되었습니다.`);
    setPaymentModal(null);
  };

  const handleIssueReceipt = (invoiceId: string) => {
    const pays   = getPaymentsByInvoice(invoiceId);
    const target = pays.find(p => !p.receiptIssued);
    if (!target) { toast.info('이미 발급된 영수증입니다.'); return; }
    issueReceipt(target.id);
    toast.success('영수증이 발급되었습니다.');
  };

  const handleInvoiceNotify = (invoiceId: string) => {
    const inv      = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const stu      = studentMap.get(inv.studentId);
    const cls      = getClass(inv.classId);
    const guardian = stu?.guardians?.[0];
    createNotificationFromEvent('FINANCE_INVOICE_ISSUED', {
      studentId: inv.studentId, studentName: stu?.name,
      guardianName: guardian?.name, guardianPhone: guardian?.phone,
      className: cls?.name,
      relatedEntityType: 'FINANCE', relatedEntityId: invoiceId,
      requestedBy: currentUser.name,
      vars: {
        학생명: stu?.name, 보호자명: guardian?.name,
        청구월: inv.billingMonth, 청구금액: inv.finalAmount.toLocaleString(),
        납부기한: inv.dueDate, 반명: cls?.name,
      },
    });
    toast.success('청구 안내를 발송했습니다(mock).');
  };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '수납관리' }]}>
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>수납관리</h1>
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
          청구·수납은 수강(Enrollment) 단위로 관리됩니다. 한 학생이 여러 반을 수강하면 반별로 따로 표시됩니다.
        </p>
      </div>

      {/* 이번 달 요약 카드 */}
      <div className="mb-3">
        <FinanceSummaryCards month={thisMonthStr()} label="이번 달 청구금액" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="axis-card p-3 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>이번 달 수납 완료 건수</div>
          <div className="text-base font-bold" style={{ color: '#040D1E' }}>{summary.paidCount}건</div>
        </div>
        <div className="axis-card p-3 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 요청액 (승인 대기)</div>
          <div className="text-base font-bold" style={{ color: 'oklch(0.45 0.13 60)' }}>{won(summary.refundRequested)}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="h-9 px-2 rounded border text-sm"
            style={{ borderColor: 'oklch(0.9 0.005 250)' }}
          />
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
            <Input value={filterStudent} onChange={e => setFilterStudent(e.target.value)} placeholder="학생명 검색" className="h-9 w-36 pl-8 text-sm" />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="h-9 w-36 text-xs"><SelectValue placeholder="반 전체" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">반 전체</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* 담당강사 필터 — 로컬 getTeacherName helper 기반 */}
          <Select value={filterTeacher} onValueChange={setFilterTeacher}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue placeholder="강사 전체" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">강사 전체</SelectItem>
              {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as InvoiceStatus | 'all')}>
            <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">상태 전체</SelectItem>
              {(['UNPAID', 'PARTIAL', 'PAID', 'CANCELED'] as InvoiceStatus[]).map(s => (
                <SelectItem key={s} value={s}>{INVOICE_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={v => setFilterMethod(v as PaymentMethod | 'all')}>
            <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">결제수단 전체</SelectItem>
              {(['CASH', 'CARD', 'TRANSFER', 'OTHER'] as PaymentMethod[]).map(m => (
                <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 수납 목록 */}
      <div className="axis-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>조회 조건에 해당하는 청구 내역이 없습니다.</div>
        ) : (
          <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
            <table className="w-full text-sm" style={{ minWidth: 1160 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['청구월', '학생명', '반명', '담당강사', '수강상태', '청구금액', '수납금액', '미납금액', '상태', '납부일', '영수증', '청구 안내', '관리'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const stu       = studentMap.get(inv.studentId);
                  const cls       = getClass(inv.classId);
                  const enr       = enrollmentMap.get(inv.enrollmentId);
                  const paid      = getPaidAmount(inv.id);
                  const remaining = Math.max(0, inv.finalAmount - paid);
                  const pays      = getPaymentsByInvoice(inv.id);
                  const lastPaidAt = pays.length > 0 ? pays[pays.length - 1].paidAt.slice(0, 10) : '-';
                  const style     = STATUS_STYLE[inv.status];
                  const hasUnissuedReceipt = pays.some(p => !p.receiptIssued);
                  return (
                    <tr key={inv.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{inv.billingMonth}</td>
                      <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{cls?.name ?? '-'}</td>
                      {/* 로컬 helper getTeacherName 사용 — classData.ts export 불필요 */}
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{getTeacherName(cls) || '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.55 0.015 250)' }}>{enr?.status ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(inv.finalAmount)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(paid)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: remaining > 0 ? 'oklch(0.5 0.18 27)' : 'oklch(0.7 0.01 250)' }}>{won(remaining)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>{INVOICE_STATUS_LABEL[inv.status]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{lastPaidAt}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {hasUnissuedReceipt && canReceipt ? (
                          <button onClick={() => handleIssueReceipt(inv.id)} className="flex items-center gap-1 hover:underline" style={{ color: '#040D1E' }}>
                            <Receipt size={11} /> 발급
                          </button>
                        ) : pays.some(p => p.receiptIssued) ? (
                          <button onClick={() => setReceiptViewInvoiceId(inv.id)} className="flex items-center gap-1 hover:underline" style={{ color: 'oklch(0.3 0.13 160)' }}>
                            <Eye size={11} /> 보기
                          </button>
                        ) : (
                          <span style={{ color: 'oklch(0.7 0.01 250)' }}>-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button onClick={() => handleInvoiceNotify(inv.id)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.55 0.18 145)' }}>
                          <Send size={11} /> 발송
                        </button>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {canPay && remaining > 0 && (
                            <button onClick={() => openPaymentModal(inv)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#040D1E' }}>
                              <CreditCard size={11} /> 수납 등록
                            </button>
                          )}
                          <button onClick={() => setMemoModal(inv)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.45 0.015 250)' }}>
                            <StickyNote size={11} /> 메모
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 수납 등록 모달 */}
      <Dialog open={!!paymentModal} onOpenChange={o => !o && setPaymentModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">수납 등록</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
              잔여 미납액: <b>{paymentModal ? won(paymentModal.remaining) : ''}</b>
            </p>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">수납 금액</Label>
              <Input type="number" min={1} max={paymentModal?.remaining} value={payAmount} onChange={e => setPayAmount(e.target.value)} className="text-sm" />
              {paymentModal && Number(payAmount) > paymentModal.remaining && (
                <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.18 27)' }}>수납금액은 남은 미납금액을 초과할 수 없습니다.</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">결제 수단</Label>
              <Select value={payMethod} onValueChange={v => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['CASH', 'CARD', 'TRANSFER', 'OTHER'] as PaymentMethod[]).map(m => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">메모 (선택)</Label>
              <Textarea value={payMemo} onChange={e => setPayMemo(e.target.value)} rows={2} className="text-sm resize-none" />
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded text-xs" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
              <Info size={11} className="mt-0.5 flex-shrink-0" /> 실제 결제 연동 없이 mock으로 수납 내역만 등록됩니다.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPaymentModal(null)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={savePayment} className="h-8 text-xs" style={{ background: '#040D1E' }}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메모 보기 모달 */}
      <Dialog open={!!memoModal} onOpenChange={o => !o && setMemoModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">청구 메모</DialogTitle></DialogHeader>
          <p className="text-sm py-2" style={{ color: 'oklch(0.4 0.015 250)' }}>{memoModal?.memo || '메모가 없습니다.'}</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMemoModal(null)} className="h-8 text-xs">닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 영수증 보기 모달 */}
      <Dialog open={!!receiptViewInvoiceId} onOpenChange={o => !o && setReceiptViewInvoiceId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">영수증</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2">
            {receiptViewInvoiceId && getPaymentsByInvoice(receiptViewInvoiceId).filter(p => p.receiptIssued).map(p => {
              const receipt = getReceiptByPayment(p.id);
              if (!receipt) return null;
              return (
                <div key={receipt.id} className="p-3 rounded-md" style={{ border: '1px solid oklch(0.92 0.005 250)' }}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'oklch(0.5 0.015 250)' }}>영수증 번호</span>
                    <span className="font-semibold tabular-nums" style={{ color: 'oklch(0.2 0.02 250)' }}>{receipt.receiptNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'oklch(0.5 0.015 250)' }}>금액</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#040D1E' }}>{won(receipt.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'oklch(0.5 0.015 250)' }}>발급일</span>
                    <span className="tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{receipt.issuedAt.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'oklch(0.5 0.015 250)' }}>발급자</span>
                    <span style={{ color: 'oklch(0.4 0.015 250)' }}>{receipt.issuedBy}</span>
                  </div>
                </div>
              );
            })}
            <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              <Info size={11} /> PDF 출력은 다음 단계에서 제공됩니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReceiptViewInvoiceId(null)} className="h-8 text-xs">닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
