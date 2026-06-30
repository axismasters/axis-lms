// AXIS LMS v1.2 - 환불관리 화면 (Finance Stability v1)
// 흐름: 행정(또는 원장/최고관리자)이 요청 등록(REQUESTED) → 원장/최고관리자가 승인(APPROVED)/반려
// (REJECTED) → 승인된 건은 완료(COMPLETED, mock 처리)까지 진행한다. 실제 계좌 환불/PG 취소 연동은 하지 않는다.
//
// Stability v1 추가 사항:
// 1. 청구월(billingMonth) 컬럼을 테이블에 추가했다 — "환불 기준이 어느 달 청구분인지" 운영자가
//    바로 확인할 수 있도록 한다.
// 2. 퇴원 20일 이내 환불 정책을 UI/검증에 반영했다.
//    - 20일 이내: 일할 계산 제안액을 자동으로 채운다(기존 동작 유지).
//    - 20일 초과: AXIS MVP 원칙상 일할 환불 요청 등록을 막고 제한 안내를 표시한다.
// 3. withdrawalSuggestion 상태에 overWindow 플래그를 추가해 제한 배너/등록 차단에 사용한다.
//
// AXIS 재무 원칙:
// - 환불 요청: 행정/원장/최고관리자 가능 (canRequestRefund)
// - 환불 승인/반려: 원장/최고관리자만 가능 (canApproveRefund) — 행정 불가
// - 환불 완료 처리: 승인 이후 mock 처리 (실제 계좌 이체 없음)

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import {
  Refund, RefundStatus, REFUND_STATUS_LABEL,
  canManageFinance, canRequestRefund, canApproveRefund,
  calculateWithdrawalRefundAmount,
  isWithinWithdrawalRefundWindow,
  WITHDRAWAL_REFUND_WINDOW_DAYS,
} from '@/lib/financeData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

function won(n: number) { return `${n.toLocaleString()}원`; }

const STATUS_STYLE: Record<RefundStatus, { bg: string; text: string }> = {
  REQUESTED: { bg: 'oklch(0.96 0.06 60)', text: 'oklch(0.45 0.13 60)' },
  APPROVED:  { bg: 'oklch(0.95 0.06 250)', text: 'oklch(0.38 0.18 250)' },
  REJECTED:  { bg: 'oklch(0.96 0.08 27)', text: 'oklch(0.5 0.18 27)' },
  COMPLETED: { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.3 0.13 160)' },
};

// withdrawalSuggestion: 환불 요청 모달에서 중도 퇴원 일할 제안값 또는 제한 상태를 담는 상태.
// overWindow: 퇴원 후 20일 초과 건 — AXIS MVP 원칙상 일할 환불 요청 등록을 막는다.
interface WithdrawalSuggestion {
  amount: number;
  endDate: string;
  overWindow: boolean;
}

export default function FinanceRefunds() {
  const { currentUser, can } = useAuth();
  const { refunds, invoices, requestRefund, approveRefund, rejectRefund, completeRefund, getRefundable } = useFinance();
  const { students } = useStudents();
  const { getClass } = useClasses();
  const { enrollments } = useEnrollment();

  const [requestModal, setRequestModal] = useState(false);
  const [reqInvoiceId, setReqInvoiceId] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [withdrawalSuggestion, setWithdrawalSuggestion] = useState<WithdrawalSuggestion | null>(null);

  const [approveModal, setApproveModal] = useState<Refund | null>(null);
  const [approveAmount, setApproveAmount] = useState('');

  const studentMap   = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const enrollmentMap = useMemo(() => new Map(enrollments.map(e => [e.id, e])), [enrollments]);
  const invoiceMap   = useMemo(() => new Map(invoices.map(i => [i.id, i])), [invoices]);

  const hasFinanceAccess = canManageFinance(can);
  const canRequest = canRequestRefund(can);
  const canApprove = canApproveRefund(can);

  const sorted = useMemo(() => [...refunds].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)), [refunds]);

  const summary = useMemo(() => {
    const requestCount     = refunds.length;
    const pendingAmount   = refunds.filter(r => r.status === 'REQUESTED').reduce((s, r) => s + r.requestedAmount, 0);
    const approvedAmount  = refunds.filter(r => r.status === 'APPROVED').reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
    const completedAmount = refunds.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
    return { requestCount, pendingAmount, approvedAmount, completedAmount };
  }, [refunds]);

  if (!hasFinanceAccess) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '환불관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const openRequestModal = () => {
    setReqInvoiceId(''); setReqAmount(''); setReqReason(''); setWithdrawalSuggestion(null);
    setRequestModal(true);
  };

  // 환불 요청 모달 — 대상 청구 선택 시 퇴원 20일 이내 정책을 적용한다.
  //   ① 퇴원/종료된 수강이고, 퇴원일이 해당 청구월 안에 있는 경우만 일할 계산 대상이다.
  //   ② 20일 이내: 일할 계산 제안액을 reqAmount에 자동 채운다.
  //   ③ 20일 초과: reqAmount는 비우고 overWindow=true 제한 배너를 표시하며 등록을 막는다.
  const handleSelectInvoice = (invoiceId: string) => {
    setReqInvoiceId(invoiceId);
    const inv = invoiceMap.get(invoiceId);
    const enr = inv ? enrollmentMap.get(inv.enrollmentId) : undefined;

    const isWithdrawnThisMonth = !!(
      inv && enr?.endDate && enr.tuitionAmount &&
      (enr.status === '종료' || enr.status === '퇴원') &&
      enr.endDate.slice(0, 7) === inv.billingMonth
    );

    if (isWithdrawnThisMonth && inv && enr?.endDate && enr.tuitionAmount) {
      const inWindow  = isWithinWithdrawalRefundWindow(enr.endDate);
      const suggested = calculateWithdrawalRefundAmount(enr.tuitionAmount, enr.endDate, inv.billingMonth);
      const capped    = Math.min(suggested, getRefundable(invoiceId));

      if (inWindow) {
        // 20일 이내 — 일할 제안액 자동 채움
        setReqAmount(String(capped));
        setWithdrawalSuggestion({ amount: capped, endDate: enr.endDate, overWindow: false });
      } else {
        // 20일 초과 — AXIS MVP 원칙상 일할 환불 요청 등록 제한
        setReqAmount('');
        setWithdrawalSuggestion({ amount: capped, endDate: enr.endDate, overWindow: true });
      }
    } else {
      setReqAmount('');
      setWithdrawalSuggestion(null);
    }
  };

  const saveRequest = () => {
    if (!reqInvoiceId) { toast.error('환불 대상 청구를 선택하세요.'); return; }
    if (withdrawalSuggestion?.overWindow) {
      toast.error(`퇴원 후 ${WITHDRAWAL_REFUND_WINDOW_DAYS}일이 초과되어 일할 환불 요청을 등록할 수 없습니다.`);
      return;
    }
    const amount = Number(reqAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) { toast.error('환불요청액은 0원보다 커야 합니다.'); return; }
    if (!reqReason.trim()) { toast.error('환불 사유는 필수입니다.'); return; }
    const result = requestRefund({ invoiceId: reqInvoiceId, requestedAmount: amount, requestedBy: currentUser.name, reason: reqReason.trim() });
    if (!result.ok) { toast.error(result.reason ?? '환불 요청 등록에 실패했습니다.'); return; }
    toast.success('환불 요청이 등록되었습니다.');
    setRequestModal(false);
  };

  const openApprove = (r: Refund) => { setApproveModal(r); setApproveAmount(String(r.requestedAmount)); };
  const confirmApprove = () => {
    if (!approveModal) return;
    const amount = Number(approveAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) { toast.error('승인금액은 0원보다 커야 합니다.'); return; }
    const result = approveRefund(approveModal.id, amount, currentUser.name);
    if (!result.ok) { toast.error(result.reason ?? '환불 승인에 실패했습니다.'); return; }
    toast.success('환불이 승인되었습니다.');
    setApproveModal(null);
  };
  const handleReject = (r: Refund) => {
    rejectRefund(r.id, currentUser.name);
    toast.info('환불 요청이 반려되었습니다.');
  };
  const handleComplete = (r: Refund) => {
    completeRefund(r.id);
    toast.success('환불이 완료 처리되었습니다(mock).');
  };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '환불관리' }]}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>환불관리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            행정이 요청을 등록하고, 원장/최고관리자가 승인 또는 반려합니다.
            퇴원 후 {WITHDRAWAL_REFUND_WINDOW_DAYS}일 이내 건에 한해 일할 계산 제안이 자동 적용됩니다.
          </p>
        </div>
        {canRequest && (
          <Button onClick={openRequestModal} className="gap-1.5" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
            <Plus size={14} /> 환불 요청 등록
          </Button>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 요청 건수</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{summary.requestCount}건</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>승인 대기 금액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.45 0.13 60)' }}>{won(summary.pendingAmount)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>승인 완료 금액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.38 0.18 250)' }}>{won(summary.approvedAmount)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 완료 금액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(summary.completedAmount)}</div>
        </div>
      </div>

      {/* 환불 목록 */}
      <div className="axis-card overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 요청 내역이 없습니다.</div>
        ) : (
          <div className="axis-table-wrap">
            <table className="w-full text-sm" style={{ minWidth: 1320 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['요청일', '청구월', '학생명', '반명', '수강상태', '요청금액', '승인금액', '상태', '요청자', '승인자', '사유', '관리'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const stu = studentMap.get(r.studentId);
                  const inv = invoiceMap.get(r.invoiceId);
                  const cls = inv ? getClass(inv.classId) : undefined;
                  const enr = enrollmentMap.get(r.enrollmentId);
                  const style = STATUS_STYLE[r.status];
                  return (
                    <tr key={r.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{r.requestedAt.slice(0, 10)}</td>
                      {/* 청구월 — Stability v1에서 추가: 환불 기준 청구월을 명시적으로 표시한다 */}
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.38 0.18 250)' }}>{inv?.billingMonth ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{cls?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.55 0.015 250)' }}>{enr?.status ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(r.requestedAmount)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{r.approvedAmount !== undefined ? won(r.approvedAmount) : '-'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>{REFUND_STATUS_LABEL[r.status]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.requestedBy}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.approvedBy ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs max-w-[180px] truncate" style={{ color: 'oklch(0.45 0.015 250)' }} title={r.reason}>{r.reason}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {canApprove && r.status === 'REQUESTED' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openApprove(r)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.38 0.18 250)' }}><CheckCircle2 size={11} /> 승인</button>
                            <button onClick={() => handleReject(r)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.5 0.18 27)' }}><XCircle size={11} /> 반려</button>
                          </div>
                        )}
                        {canApprove && r.status === 'APPROVED' && (
                          <button onClick={() => handleComplete(r)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.3 0.13 160)' }}><CheckCircle2 size={11} /> 환불 완료 처리</button>
                        )}
                        {!canApprove && (r.status === 'REQUESTED' || r.status === 'APPROVED') && (
                          <span className="text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>승인 대기 중</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 환불 요청 등록 모달 */}
      <Dialog open={requestModal} onOpenChange={setRequestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-sm">환불 요청 등록</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">대상 청구</Label>
              <Select value={reqInvoiceId} onValueChange={handleSelectInvoice}>
                <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="청구 선택…" /></SelectTrigger>
                <SelectContent>
                  {invoices.filter(inv => inv.status !== 'CANCELED' && getRefundable(inv.id) > 0).map(inv => {
                    const stu = studentMap.get(inv.studentId);
                    const cls = getClass(inv.classId);
                    return <SelectItem key={inv.id} value={inv.id}>{inv.billingMonth} · {stu?.name} · {cls?.name} (환불가능 {won(getRefundable(inv.id))})</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              {invoices.filter(inv => inv.status !== 'CANCELED' && getRefundable(inv.id) > 0).length === 0 && (
                <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 가능한 청구서가 없습니다(미수납 또는 이미 전액 환불됨).</p>
              )}

              {/* 퇴원 20일 이내 정책 안내 배너 */}
              {withdrawalSuggestion && !withdrawalSuggestion.overWindow && (
                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded text-xs" style={{ background: 'oklch(0.95 0.06 250)', color: 'oklch(0.38 0.18 250)' }}>
                  <Info size={11} className="mt-0.5 flex-shrink-0" />
                  {withdrawalSuggestion.endDate} 퇴원 기준 일할 계산 제안액 {won(withdrawalSuggestion.amount)}을 자동으로 채웠습니다.
                  필요하면 직접 조정하세요.
                </div>
              )}
              {/* 퇴원 20일 초과 경고 배너 — 자동 제안 없음, 직접 입력 필요 */}
              {withdrawalSuggestion && withdrawalSuggestion.overWindow && (
                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded text-xs" style={{ background: 'oklch(0.96 0.08 27)', color: 'oklch(0.5 0.18 27)' }}>
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                  퇴원일({withdrawalSuggestion.endDate})로부터 {WITHDRAWAL_REFUND_WINDOW_DAYS}일이 초과되었습니다.
                  AXIS 재무 원칙상 일할 환불 요청을 등록할 수 없습니다. 예외 환불은 별도 승인 워크플로우에서 처리해야 합니다.
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">요청 금액</Label>
              <Input
                type="number"
                min={1}
                max={reqInvoiceId ? getRefundable(reqInvoiceId) : undefined}
                value={reqAmount}
                onChange={e => setReqAmount(e.target.value)}
                className="text-sm"
                placeholder={withdrawalSuggestion?.overWindow ? '20일 초과로 등록 제한' : ''}
                disabled={withdrawalSuggestion?.overWindow}
              />
              {reqInvoiceId && Number(reqAmount) > getRefundable(reqInvoiceId) && (
                <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.18 27)' }}>환불요청액은 환불 가능 금액({won(getRefundable(reqInvoiceId))})을 초과할 수 없습니다.</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">사유</Label>
              <Textarea value={reqReason} onChange={e => setReqReason(e.target.value)} rows={3} className="text-sm resize-none" placeholder="환불 사유를 입력하세요" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRequestModal(false)} className="h-8 text-xs">취소</Button>
            <Button
              size="sm"
              onClick={saveRequest}
              disabled={withdrawalSuggestion?.overWindow}
              className="h-8 text-xs"
              style={{ background: 'oklch(0.511 0.262 276.966)' }}
            >요청 등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 환불 승인 모달 — 원장/최고관리자 전용(canApprove) */}
      <Dialog open={!!approveModal} onOpenChange={o => !o && setApproveModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">환불 승인</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
              요청 금액: {approveModal ? won(approveModal.requestedAmount) : ''} · 환불 가능 금액: {approveModal ? won(getRefundable(approveModal.invoiceId)) : ''}
            </p>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">승인 금액</Label>
              <Input
                type="number"
                min={1}
                max={approveModal ? Math.min(approveModal.requestedAmount, getRefundable(approveModal.invoiceId)) : undefined}
                value={approveAmount}
                onChange={e => setApproveAmount(e.target.value)}
                className="text-sm"
              />
              {approveModal && Number(approveAmount) > Math.min(approveModal.requestedAmount, getRefundable(approveModal.invoiceId)) && (
                <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.18 27)' }}>승인금액은 요청액과 환불 가능 금액을 초과할 수 없습니다.</p>
              )}
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded text-xs" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
              <Info size={11} className="mt-0.5 flex-shrink-0" /> 승인 후에는 &ldquo;환불 완료 처리&rdquo; 버튼으로 mock 완료 처리를 할 수 있습니다(실제 계좌 환불 연동 없음).
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApproveModal(null)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={confirmApprove} className="h-8 text-xs" style={{ background: 'oklch(0.511 0.262 276.966)' }}>승인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
