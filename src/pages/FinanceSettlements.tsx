// AXIS LMS v1.2 - 정산관리 화면 (Finance Payments Filter v1)
// 월별 요약 화면. 정산 확정은 최고관리자/원장만 가능하며, 행정은 조회만 가능하다.
//
// Payments Filter v1 추가 사항:
// - Settlement 레코드 자동 보충 — invoices에서 청구 이력이 있는 달 중 Settlement 레코드가
//   없는 달을 감지해 "정산 생성" 버튼으로 generateSettlementForMonth(FinanceContext)를 호출한다.
//   생성 후 즉시 정산 확정까지 진행할 수 있다.
// - 금액(청구액/수납액/미납액/환불액/순매출)은 계속 calculateMonthlySettlement 실시간 계산값을 사용한다.
//   Settlement 레코드 자체는 "확정 여부 + 확정자/확정일" 역할만 한다.

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import {
  canManageFinance, canConfirmSettlement,
  calculateMonthlySettlement,
  SettlementStatus, SETTLEMENT_STATUS_LABEL,
} from '@/lib/financeData';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Lock, CheckCircle2, PlusCircle } from 'lucide-react';

function won(n: number) { return `${n.toLocaleString()}원`; }
function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_STYLE: Record<SettlementStatus, { bg: string; text: string }> = {
  DRAFT:     { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.5 0.015 250)' },
  CONFIRMED: { bg: 'oklch(0.94 0.08 160)',  text: 'oklch(0.3 0.13 160)' },
};

export default function FinanceSettlements() {
  const { currentUser, can } = useAuth();
  const { settlements, invoices, payments, refunds, confirmSettlement, generateSettlementForMonth } = useFinance();

  const [confirmTarget,  setConfirmTarget]  = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth]  = useState(thisMonthStr());

  // 선택 월 요약 — Invoice 기반 실시간 계산(Settlement 레코드 고정값이 아님)
  const selectedAmounts = useMemo(
    () => calculateMonthlySettlement(selectedMonth, invoices, payments, refunds),
    [selectedMonth, invoices, payments, refunds],
  );

  // 모든 정산 대상 달 — invoices에 존재하는 달 + 기존 settlements에 있는 달의 합집합, 최신순 정렬
  const allMonths = useMemo(() => {
    const fromInvoices    = Array.from(new Set(invoices.map(i => i.billingMonth)));
    const fromSettlements = settlements.map(s => s.month);
    const combined        = Array.from(new Set([...fromInvoices, ...fromSettlements]));
    return combined.sort().reverse();
  }, [invoices, settlements]);

  const settlementMap = useMemo(() => new Map(settlements.map(s => [s.month, s])), [settlements]);

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '정산관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }
  const canConfirm = canConfirmSettlement(can);

  const handleGenerate = (month: string) => {
    generateSettlementForMonth(month);
    toast.success(`${month} 정산 레코드가 생성되었습니다.`);
  };

  // ★ QA v1: confirmTarget을 month 기준으로 통일한다.
  // settlementMap은 month를 키로 사용하므로, confirmTarget에 s!.id(settlement id)가 아닌
  // month를 저장해야 정상적으로 레코드를 조회할 수 있다.
  // 흐름: month → settlementMap.get(month) → settlement.id → confirmSettlement(settlement.id)
  const handleConfirm = () => {
    if (!confirmTarget) return;
    // confirmTarget은 month (id가 아님)
    let settlement = settlementMap.get(confirmTarget);
    if (!settlement) {
      // 레코드가 없으면 먼저 생성한 후 확정한다
      settlement = generateSettlementForMonth(confirmTarget);
    }
    const result = confirmSettlement(settlement.id, currentUser.name);
    if (!result.ok) { toast.error(result.reason ?? '정산 확정에 실패했습니다.'); setConfirmTarget(null); return; }
    toast.success('정산이 확정되었습니다.');
    setConfirmTarget(null);
  };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '정산관리' }]}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>정산관리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.42 0.015 250)' }}>
            월별 청구·수납·미납·환불을 요약해 확정합니다. 금액은 실제 청구/수납/환불 데이터에서 매번 계산됩니다.
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="h-9 px-2 rounded border text-sm"
          style={{ borderColor: 'oklch(0.9 0.005 250)' }}
        />
      </div>

      {/* 선택 월 요약 카드 — 실시간 계산값 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>{selectedMonth} 총 청구액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.38 0.18 250)' }}>{won(selectedAmounts.totalBilled)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>총 수납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(selectedAmounts.totalPaid)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>총 미납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.4 0.18 27)' }}>{won(selectedAmounts.totalUnpaid)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>총 환불액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.35 0.13 60)' }}>{won(selectedAmounts.totalRefunded)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>순매출</div>
          <div className="text-lg font-bold" style={{ color: '#040D1E' }}>{won(selectedAmounts.netRevenue)}</div>
        </div>
      </div>

      {/* 정산 목록 — allMonths 기준으로 Settlement 레코드 유무와 관계없이 모두 표시 */}
      <div className="axis-card overflow-hidden">
        <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
          <table className="w-full text-sm" style={{ minWidth: 780 }}>
            <thead>
              <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                {['정산월', '청구액', '수납액', '미납액', '환불액', '순매출', '상태', '확정자', '확정일', '관리'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allMonths.map(month => {
                const s       = settlementMap.get(month);
                const amounts = calculateMonthlySettlement(month, invoices, payments, refunds);
                const hasRecord = !!s;
                const style   = s ? STATUS_STYLE[s.status] : { bg: 'oklch(0.97 0.003 250)', text: 'oklch(0.6 0.015 250)' };

                return (
                  <tr key={month} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                    <td className="px-3 py-2.5 text-xs tabular-nums font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{month}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(amounts.totalBilled)}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(amounts.totalPaid)}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.18 27)' }}>{won(amounts.totalUnpaid)}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.35 0.13 60)' }}>{won(amounts.totalRefunded)}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap font-semibold" style={{ color: '#040D1E' }}>{won(amounts.netRevenue)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {hasRecord ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>
                          {s!.status === 'CONFIRMED' && <Lock size={10} />} {SETTLEMENT_STATUS_LABEL[s!.status]}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.97 0.003 250)', color: 'oklch(0.49 0.01 250)' }}>레코드 없음</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{s?.confirmedBy ?? '-'}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.42 0.015 250)' }}>{s?.confirmedAt?.slice(0, 10) ?? '-'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {/* ★ Settlement 레코드가 없는 달 — "정산 생성" 버튼 제공 */}
                      {!hasRecord && canConfirm && (
                        <button
                          onClick={() => handleGenerate(month)}
                          className="flex items-center gap-1 text-xs hover:underline"
                          style={{ color: 'oklch(0.38 0.18 250)' }}
                        >
                          <PlusCircle size={11} /> 정산 생성
                        </button>
                      )}
                      {/* 정산 레코드는 있지만 DRAFT — 확정 버튼 */}
                      {hasRecord && s!.status === 'DRAFT' && canConfirm && (
                        // ★ QA v1: s!.id(settlement id) 대신 month를 confirmTarget에 저장한다
                        <button onClick={() => setConfirmTarget(month)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#040D1E' }}>
                          <CheckCircle2 size={11} /> 정산 확정
                        </button>
                      )}
                      {hasRecord && s!.status === 'DRAFT' && !canConfirm && (
                        <span className="text-xs" style={{ color: 'oklch(0.54 0.01 250)' }}>정산 확정은 원장 또는 최고관리자만 가능합니다.</span>
                      )}
                      {hasRecord && s!.status === 'CONFIRMED' && (
                        <span className="text-xs" style={{ color: 'oklch(0.54 0.01 250)' }}>이미 확정된 정산입니다.</span>
                      )}
                      {/* 레코드 없는 달, 행정 권한 — 안내만 표시 */}
                      {!hasRecord && !canConfirm && (
                        <span className="text-xs" style={{ color: 'oklch(0.54 0.01 250)' }}>정산 레코드 미생성</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 정산 확정 확인 다이얼로그 */}
      <AlertDialog open={!!confirmTarget} onOpenChange={o => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정산 확정</AlertDialogTitle>
            <AlertDialogDescription>
              정산을 확정하면 이후 해당 월의 수치를 되돌릴 수 없습니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} style={{ background: '#040D1E' }}>확정</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
