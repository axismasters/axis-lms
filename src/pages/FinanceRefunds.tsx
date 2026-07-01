// AXIS LMS v1.2 - 환불관리 화면 (Finance Payments Filter v1)
// 흐름: 행정이 요청 등록(REQUESTED) → 원장/최고관리자가 승인(APPROVED)/반려(REJECTED) → 완료(COMPLETED).
//
// 퇴원 20일 이내 환불 정책 (AXIS 재무 원칙 — buildfix 반영):
// - 퇴원/종료된 수강이고, 퇴원일이 해당 청구월 안에 있는 경우에만 일할 계산 환불 대상이다.
// - 20일 이내: 일할 계산 제안액을 자동으로 채우고 요청 등록이 가능하다.
// - 20일 초과: 환불 요청 등록 자체가 차단된다. 요청 버튼이 비활성화되고 차단 안내가 표시된다.
//   → 20일 초과 건을 "직접 입력"으로 우회할 수 없다(buildfix에서 수정된 원칙).
// - 퇴원 외 사유(반 폐강, 수업 결석 등)의 환불 요청은 퇴원 일할 정책과 무관하게 정상 처리된다.
//
// React hooks 규칙 준수:
// - 모든 useState/useMemo/useCallback/useContext 호출은 canManageFinance early return 이전에 위치한다.
// - canRequest/canApprove는 순수 함수 호출이므로 early return 이후 위치가 가능하나,
//   명확성을 위해 early return 이전으로 이동했다.
//
// AXIS 권한 원칙:
// - 환불 요청: 행정/원장/최고관리자 (canRequestRefund)
// - 환불 승인/반려/완료: 원장/최고관리자만 (canApproveRefund)

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
  REQUESTED: { bg: 'oklch(0.96 0.06 60)',  text: 'oklch(0.45 0.13 60)' },
  APPROVED:  { bg: 'oklch(0.95 0.06 250)', text: 'oklch(0.38 0.18 250)' },
  REJECTED:  { bg: 'oklch(0.96 0.08 27)',  text: 'oklch(0.5 0.18 27)' },
  COMPLETED: { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.3 0.13 160)' },
};

interface WithdrawalSuggestion {
  amount: number;
  endDate: string;
  overWindow: boolean; // true = 20일 초과 → 요청 차단
}

export default function FinanceRefunds() {
  const { currentUser, can } = useAuth();
  const { refunds, invoices, requestRefund, approveRefund, rejectRefund, completeRefund, getRefundable } = useFinance();
  const { students }   = useStudents();
  const { getClass }   = useClasses();
  const { enrollments } = useEnrollment();

  // ── 모든 hook은 early return 이전에 ──────────────────────────
  const [requestModal,        setRequestModal]        = useState(false);
  const [reqInvoiceId,        setReqInvoiceId]        = useState('');
  const [reqAmount,           setReqAmount]           = useState('');
  const [reqReason,           setReqReason]           = useState('');
  const [withdrawalSuggestion, setWithdrawalSuggestion] = useState<WithdrawalSuggestion | null>(null);
  // isRefundBlocked: 퇴원 20일 초과 건 선택 시 true → 요청 등록 차단
  const [isRefundBlocked,     setIsRefundBlocked]     = useState(false);

  const [approveModal,  setApproveModal]  = useState<Refund | null>(null);
  const [approveAmount, setApproveAmount] = useState('');

  const studentMap    = useMemo(() => new Map(students.map(s => [s.id, s])),    [students]);
  const enrollmentMap = useMemo(() => new Map(enrollments.map(e => [e.id, e])), [enrollments]);
  const invoiceMap    = useMemo(() => new Map(invoices.map(i => [i.id, i])),    [invoices]);

  const sorted  = useMemo(() => [...refunds].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)), [refunds]);
  const summary = useMemo(() => {
    const requestCount    = refunds.length;
    const pendingAmount   = refunds.filter(r => r.status === 'REQUESTED').reduce((s, r) => s + r.requestedAmount, 0);
    const approvedAmount  = refunds.filter(r => r.status === 'APPROVED').reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
    const completedAmount = refunds.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
    return { requestCount, pendingAmount, approvedAmount, completedAmount };
  }, [refunds]);

  // canRequest / canApprove — 순수 함수지만 early return 이전에 위치시켜 명확성 확보
  const canRequest = canRequestRefund(can);
  const canApprove = canApproveRefund(can);
  // ─────────────────────────────────────────────────────────────

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '환불관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const openRequestModal = () => {
    setReqInvoiceId(''); setReqAmount(''); setReqReason('');
    setWithdrawalSuggestion(null); setIsRefundBlocked(false);
    setRequestModal(true);
  };

  // 대상 청구 선택 시 퇴원 20일 이내 정책 적용
  // ① 퇴원/종료이고, 퇴원일이 해당 청구월 안에 있는 경우만 일할 계산 대상이다.
  // ② 20일 이내 → 일할 계산 제안액 자동 채움, 요청 허용(isRefundBlocked = false)
  // ③ 20일 초과 → 요청 차단(isRefundBlocked = true), 버튼 비활성화 + 차단 안내 배너 표시
  // ④ 퇴원/종료 사유가 아닌 경우(반 폐강, 수업 결석 등) → 일할 정책 무관, 요청 허용
  const handleSelectInvoice = (invoiceId: string) => {
    setReqInvoiceId(invoiceId);
    setIsRefundBlocked(false);
    setReqAmount('');
    setWithdrawalSuggestion(null);

    const inv = invoiceMap.get(invoiceId);
    const enr = inv ? enrollmentMap.get(inv.enrollmentId) : undefined;

    const isWithdrawnThisMonth = !!(
      inv && enr?.endDate && enr.tuitionAmount &&
      (enr.status === '종료' || enr.status === '퇴원') &&
      enr.endDate.slice(0, 7) === inv.billingMonth
    );

    if (!isWithdrawnThisMonth || !inv || !enr?.endDate || !enr.tuitionAmount) return;

    const inWindow  = isWithinWithdrawalRefundWindow(enr.endDate);
    const suggested = calculateWithdrawalRefundAmount(enr.tuitionAmount, enr.endDate, inv.billingMonth);
    const capped    = Math.min(suggested, getRefundable(invoiceId));

    if (inWindow) {
      // 20일 이내 — 일할 제안액 자동 채움, 요청 허용
      setReqAmount(String(capped));
      setWithdrawalSuggestion({ amount: capped, endDate: enr.endDate, overWindow: false });
    } else {
      // 20일 초과 — 요청 자체를 차단한다
      setIsRefundBlocked(true);
      setWithdrawalSuggestion({ amount: capped, endDate: enr.endDate, overWindow: true });
    }
  };

  const saveRequest = () => {
    if (!reqInvoiceId) { toast.error('환불 대상 청구를 선택하세요.'); return; }
    // ★ buildfix: 20일 초과 퇴원 건은 요청 등록 차단
    if (isRefundBlocked) { toast.error(`퇴원 후 ${WITHDRAWAL_REFUND_WINDOW_DAYS}일이 초과되어 환불을 요청할 수 없습니다.`); return; }
    const amount = Number(reqAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) { toast.error('환불요청액은 0원보다 커야 합니다.'); return; }
    if (!reqReason.trim()) { toast.error('환불 사유는 필수입니다.'); return; }
    const result = requestRefund({ invoiceId: reqInvoiceId, requestedAmount: amount, requestedBy: currentUser.name, reason: reqReason.trim() });
    if (!result.ok) { toast.error(result.reason ?? '환불 요청 등록에 실패했습니다.'); return; }
    toast.success('환불 요청이 등록되었습니다.');
    setRequestModal(false);
  };

  const openApprove   = (r: Refund) => { setApproveModal(r); setApproveAmount(String(r.requestedAmount)); };
  const confirmApprove = () => {
    if (!approveModal) return;
    const amount = Number(approveAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) { toast.error('승인금액은 0원보다 커야 합니다.'); return; }
    const result = approveRefund(approveModal.id, amount, currentUser.name);
    if (!result.ok) { toast.error(result.reason ?? '환불 승인에 실패했습니다.'); return; }
    toast.success('환불이 승인되었습니다.');
    setApproveModal(null);
  };
  const handleReject   = (r: Refund) => { rejectRefund(r.id, currentUser.name);  toast.info('환불 요청이 반려되었습니다.'); };
  const handleComplete = (r: Refund) => { completeRefund(r.id); toast.success('환불이 완료 처리되었습니다(mock).'); };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '환불관리' }]}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>환불관리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            행정이 요청을 등록하고, 원장/최고관리자가 승인 또는 반려합니다.
            퇴원 후 {WITHDRAWAL_REFUND_WINDOW_DAYS}일 이내 건에 한해 일할 환불 요청이 가능합니다.
          </p>
        </div>
        {canRequest && (
          <Button onClick={openRequestModal} className="gap-1.5" style={{ background: '#040D1E' }}>
            <Plus size={14} /> 환불 요청 등록
          </Button>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 요청 건수</div>
          <div className="text-lg font-bold" style={{ color: '#040D1E' }}>{summary.requestCount}건</div>
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
          <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
            <table className="w-full text-sm" style={{ minWidth: 1320 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['요청일', '청구월', '학생명', '반명', '수강상태', '요청금액', '승인금액', '상태', '요청자', '승인자', '사유', '관리'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const stu   = studentMap.get(r.studentId);
                  const inv   = invoiceMap.get(r.invoiceId);
                  const cls   = inv ? getClass(inv.classId) : undefined;
                  const enr   = enrollmentMap.get(r.enrollmentId);
                  const style = STATUS_STYLE[r.status];
                  return (
                    <tr key={r.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{r.requestedAt.slice(0, 10)}</td>
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
      <Dialog open={requestModal} onOpenChange={o => { if (!o) { setRequestModal(false); setIsRefundBlocked(false); } }}>
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
                    return (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.billingMonth} · {stu?.name} · {cls?.name} (환불가능 {won(getRefundable(inv.id))})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {invoices.filter(inv => inv.status !== 'CANCELED' && getRefundable(inv.id) > 0).length === 0 && (
                <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>환불 가능한 청구서가 없습니다.</p>
              )}

              {/* ★ 20일 이내 — 일할 제안액 자동 채움 배너 */}
              {withdrawalSuggestion && !withdrawalSuggestion.overWindow && (
                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded text-xs" style={{ background: 'oklch(0.95 0.06 250)', color: 'oklch(0.38 0.18 250)' }}>
                  <Info size={11} className="mt-0.5 flex-shrink-0" />
                  {withdrawalSuggestion.endDate} 퇴원 기준 일할 계산 제안액 {won(withdrawalSuggestion.amount)}을 자동으로 채웠습니다. 필요하면 직접 조정하세요.
                </div>
              )}
              {/* ★ 20일 초과 — 환불 요청 차단 배너 (buildfix: 직접 입력 우회 불가) */}
              {withdrawalSuggestion && withdrawalSuggestion.overWindow && (
                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded text-xs" style={{ background: 'oklch(0.96 0.08 27)', color: 'oklch(0.5 0.18 27)' }}>
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                  퇴원일({withdrawalSuggestion.endDate})로부터 {WITHDRAWAL_REFUND_WINDOW_DAYS}일이 초과되었습니다.
                  AXIS 재무 원칙에 따라 일할 환불 요청이 불가합니다.
                </div>
              )}
            </div>

            {/* 20일 초과 건은 금액 입력란을 표시하지 않는다 */}
            {!isRefundBlocked && (
              <>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">요청 금액</Label>
                  <Input
                    type="number"
                    min={1}
                    max={reqInvoiceId ? getRefundable(reqInvoiceId) : undefined}
                    value={reqAmount}
                    onChange={e => setReqAmount(e.target.value)}
                    className="text-sm"
                  />
                  {reqInvoiceId && Number(reqAmount) > getRefundable(reqInvoiceId) && (
                    <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.18 27)' }}>환불요청액은 환불 가능 금액({won(getRefundable(reqInvoiceId))})을 초과할 수 없습니다.</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">사유</Label>
                  <Textarea value={reqReason} onChange={e => setReqReason(e.target.value)} rows={3} className="text-sm resize-none" placeholder="환불 사유를 입력하세요" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setRequestModal(false); setIsRefundBlocked(false); }} className="h-8 text-xs">취소</Button>
            {/* ★ 20일 초과 건은 버튼 비활성화 */}
            <Button
              size="sm"
              onClick={saveRequest}
              disabled={isRefundBlocked}
              className="h-8 text-xs"
              style={{ background: isRefundBlocked ? undefined : '#040D1E' }}
            >
              {isRefundBlocked ? '환불 불가' : '요청 등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 환불 승인 모달 — 원장/최고관리자 전용 */}
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
              <Info size={11} className="mt-0.5 flex-shrink-0" /> 승인 후 &ldquo;환불 완료 처리&rdquo; 버튼으로 mock 완료 처리를 할 수 있습니다(실제 계좌 환불 연동 없음).
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApproveModal(null)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={confirmApprove} className="h-8 text-xs" style={{ background: '#040D1E' }}>승인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
