// AXIS LMS v1.2 - 수납관리 화면 (Finance Foundation v1)
// Design: Structured Authority
// 재무관리의 기본 화면. 청구(Invoice)는 학생이 아니라 수강(Enrollment) 단위로 관리되므로, 한 학생이
// 여러 반을 동시에 수강하면 반마다 별도의 청구 행이 표시된다.
//
// 권한: canManageFinance(can)로 페이지 진입 자체를 가드(SUPER_ADMIN/DIRECTOR/STAFF만 통과).
// 수납 등록은 canCreatePayment, 영수증 발급은 canIssueReceipt로 별도 게이트한다.

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import {
  Invoice, PaymentMethod, InvoiceStatus,
  PAYMENT_METHOD_LABEL, INVOICE_STATUS_LABEL,
  canManageFinance, canCreatePayment, canIssueReceipt,
} from '@/lib/financeData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Receipt, StickyNote, CreditCard, Info } from 'lucide-react';

function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function won(n: number) {
  return `${n.toLocaleString()}원`;
}

const STATUS_STYLE: Record<InvoiceStatus, { bg: string; text: string }> = {
  UNPAID: { bg: 'oklch(0.96 0.08 27)', text: 'oklch(0.5 0.18 27)' },
  PARTIAL: { bg: 'oklch(0.96 0.06 60)', text: 'oklch(0.45 0.13 60)' },
  PAID: { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.3 0.13 160)' },
  CANCELED: { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.55 0.015 250)' },
};

export default function FinancePayments() {
  const { currentUser, can } = useAuth();
  const { invoices, getPaymentsByInvoice, getPaidAmount, addPayment, issueReceipt, refunds } = useFinance();
  const { students } = useStudents();
  const { classes, getClass } = useClasses();
  const { enrollments } = useEnrollment();

  const [filterMonth, setFilterMonth] = useState(thisMonthStr());
  const [filterStudent, setFilterStudent] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all');

  const [paymentModal, setPaymentModal] = useState<{ invoice: Invoice; remaining: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payMemo, setPayMemo] = useState('');

  const [memoModal, setMemoModal] = useState<Invoice | null>(null);

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const enrollmentMap = useMemo(() => new Map(enrollments.map(e => [e.id, e])), [enrollments]);

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '수납관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }
  const canPay = canCreatePayment(can);
  const canReceipt = canIssueReceipt(can);

  // 필터링된 목록
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (filterMonth && inv.billingMonth !== filterMonth) return false;
      if (filterStudent) {
        const stu = studentMap.get(inv.studentId);
        if (!stu || !stu.name.includes(filterStudent)) return false;
      }
      if (filterClass !== 'all' && inv.classId !== filterClass) return false;
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
      if (filterMethod !== 'all') {
        const pays = getPaymentsByInvoice(inv.id);
        if (!pays.some(p => p.paymentMethod === filterMethod)) return false;
      }
      return true;
    }).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
  }, [invoices, filterMonth, filterStudent, filterClass, filterStatus, filterMethod, studentMap, getPaymentsByInvoice]);

  // 이번 달 기준 요약 카드(필터와 무관하게 "이번 달" 고정 — 운영자가 항상 현재 상황을 한눈에 보도록)
  const summary = useMemo(() => {
    const thisMonth = thisMonthStr();
    const monthInvoices = invoices.filter(i => i.billingMonth === thisMonth);
    const billed = monthInvoices.reduce((s, i) => s + i.finalAmount, 0);
    const paid = monthInvoices.reduce((s, i) => s + getPaidAmount(i.id), 0);
    const unpaid = monthInvoices.reduce((s, i) => s + Math.max(0, i.finalAmount - getPaidAmount(i.id)), 0);
    const refundRequested = refunds.filter(r => r.status === 'REQUESTED').reduce((s, r) => s + r.requestedAmount, 0);
    const paidCount = monthInvoices.filter(i => i.status === 'PAID').length;
    return { billed, paid, unpaid, refundRequested, paidCount };
  }, [invoices, getPaidAmount, refunds]);

  const openPaymentModal = (inv: Invoice) => {
    const remaining = inv.finalAmount - getPaidAmount(inv.id);
    setPaymentModal({ invoice: inv, remaining });
    setPayAmount(String(Math.max(0, remaining)));
    setPayMethod('CASH');
    setPayMemo('');
  };

  const savePayment = () => {
    if (!paymentModal) return;
    const amount = Number(payAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) { toast.error('올바른 수납 금액을 입력하세요.'); return; }
    addPayment({ invoiceId: paymentModal.invoice.id, amount, paymentMethod: payMethod, handledBy: currentUser.name, memo: payMemo.trim() || undefined });
    toast.success(`${won(amount)} 수납이 등록되었습니다.`);
    setPaymentModal(null);
  };

  const handleIssueReceipt = (invoiceId: string) => {
    const pays = getPaymentsByInvoice(invoiceId);
    const target = pays.find(p => !p.receiptIssued);
    if (!target) { toast.info('이미 발급된 영수증입니다.'); return; }
    issueReceipt(target.id);
    toast.success('영수증이 발급되었습니다.');
  };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '수납관리' }]}>
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>수납관리</h1>
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
          청구·수납은 수강(Enrollment) 단위로 관리됩니다. 한 학생이 여러 반을 수강하면 반별로 따로 표시됩니다.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>이번 달 청구액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.38 0.18 250)' }}>{won(summary.billed)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>이번 달 수납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(summary.paid)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>미납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.5 0.18 27)' }}>{won(summary.unpaid)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 요청액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.45 0.13 60)' }}>{won(summary.refundRequested)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>수납 완료 건수</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{summary.paidCount}건</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="h-9 px-2 rounded border text-sm" style={{ borderColor: 'oklch(0.9 0.005 250)' }} />
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
            <Input value={filterStudent} onChange={e => setFilterStudent(e.target.value)} placeholder="학생명 검색" className="h-9 w-40 pl-8 text-sm" />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue placeholder="반 전체" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">반 전체</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as InvoiceStatus | 'all')}>
            <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">상태 전체</SelectItem>
              {(['UNPAID', 'PARTIAL', 'PAID', 'CANCELED'] as InvoiceStatus[]).map(s => <SelectItem key={s} value={s}>{INVOICE_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={v => setFilterMethod(v as PaymentMethod | 'all')}>
            <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">결제수단 전체</SelectItem>
              {(['CASH', 'CARD', 'TRANSFER', 'OTHER'] as PaymentMethod[]).map(m => <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 목록 */}
      <div className="axis-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>조회 조건에 해당하는 청구 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['청구월', '학생명', '반명', '수강상태', '청구금액', '수납금액', '미납금액', '상태', '납부일', '영수증', '관리'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const stu = studentMap.get(inv.studentId);
                  const cls = getClass(inv.classId);
                  const enr = enrollmentMap.get(inv.enrollmentId);
                  const paid = getPaidAmount(inv.id);
                  const remaining = Math.max(0, inv.finalAmount - paid);
                  const pays = getPaymentsByInvoice(inv.id);
                  const lastPaidAt = pays.length > 0 ? pays[pays.length - 1].paidAt.slice(0, 10) : '-';
                  const style = STATUS_STYLE[inv.status];
                  const hasUnissuedReceipt = pays.some(p => !p.receiptIssued);
                  return (
                    <tr key={inv.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{inv.billingMonth}</td>
                      <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{cls?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.55 0.015 250)' }}>{enr?.status ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(inv.finalAmount)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(paid)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: remaining > 0 ? 'oklch(0.5 0.18 27)' : 'oklch(0.7 0.01 250)' }}>{won(remaining)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>{INVOICE_STATUS_LABEL[inv.status]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{lastPaidAt}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {canReceipt ? (
                          <button onClick={() => handleIssueReceipt(inv.id)} disabled={!hasUnissuedReceipt} className="flex items-center gap-1 hover:underline disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                            <Receipt size={11} /> {hasUnissuedReceipt ? '발급' : '발급됨'}
                          </button>
                        ) : (
                          <span style={{ color: 'oklch(0.7 0.01 250)' }}>{pays.some(p => p.receiptIssued) ? '발급됨' : '-'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {canPay && remaining > 0 && (
                            <button onClick={() => openPaymentModal(inv)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
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
              <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">결제 수단</Label>
              <Select value={payMethod} onValueChange={v => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['CASH', 'CARD', 'TRANSFER', 'OTHER'] as PaymentMethod[]).map(m => <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>)}
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
            <Button size="sm" onClick={savePayment} className="h-8 text-xs" style={{ background: 'oklch(0.511 0.262 276.966)' }}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메모 보기 모달(청구서 메모 — 단순 조회, Foundation 단계라 수정은 만들지 않음) */}
      <Dialog open={!!memoModal} onOpenChange={o => !o && setMemoModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">청구 메모</DialogTitle></DialogHeader>
          <p className="text-sm py-2" style={{ color: 'oklch(0.4 0.015 250)' }}>{memoModal?.memo || '메모가 없습니다.'}</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMemoModal(null)} className="h-8 text-xs">닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
