// AXIS LMS v1.2 - 정산관리 화면 (Finance Foundation v1)
// 월별 요약 화면. 정산 확정은 최고관리자/원장만 가능하며, 행정은 조회만 가능하고 확정 버튼 자체가
// 노출되지 않는다(canConfirmSettlement = finance.settlementConfirm — STAFF는 미보유).

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { canManageFinance, canConfirmSettlement, SettlementStatus, SETTLEMENT_STATUS_LABEL } from '@/lib/financeData';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Lock, CheckCircle2 } from 'lucide-react';

function won(n: number) { return `${n.toLocaleString()}원`; }
function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_STYLE: Record<SettlementStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.5 0.015 250)' },
  CONFIRMED: { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.3 0.13 160)' },
};

export default function FinanceSettlements() {
  const { currentUser, can } = useAuth();
  const { settlements, confirmSettlement } = useFinance();
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr());

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '정산관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }
  const canConfirm = canConfirmSettlement(can);

  const sorted = useMemo(() => [...settlements].sort((a, b) => b.month.localeCompare(a.month)), [settlements]);
  const selected = settlements.find(s => s.month === selectedMonth);

  const handleConfirm = () => {
    if (!confirmTarget) return;
    confirmSettlement(confirmTarget, currentUser.name);
    toast.success('정산이 확정되었습니다.');
    setConfirmTarget(null);
  };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '정산관리' }]}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>정산관리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>월별 청구·수납·미납·환불을 요약해 확정합니다.</p>
        </div>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-9 px-2 rounded border text-sm" style={{ borderColor: 'oklch(0.9 0.005 250)' }} />
      </div>

      {/* 선택 월 요약 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{selectedMonth} 총 청구액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.38 0.18 250)' }}>{won(selected?.totalBilled ?? 0)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>총 수납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(selected?.totalPaid ?? 0)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>총 미납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.5 0.18 27)' }}>{won(selected?.totalUnpaid ?? 0)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>총 환불액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.45 0.13 60)' }}>{won(selected?.totalRefunded ?? 0)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>순매출</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            {won((selected?.totalPaid ?? 0) - (selected?.totalRefunded ?? 0))}
          </div>
        </div>
      </div>

      <div className="axis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
              {['정산월', '청구액', '수납액', '미납액', '환불액', '순매출', '상태', '확정자', '확정일', '관리'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const netRevenue = s.totalPaid - s.totalRefunded;
              const style = STATUS_STYLE[s.status];
              return (
                <tr key={s.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                  <td className="px-3 py-2.5 text-xs tabular-nums font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{s.month}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(s.totalBilled)}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(s.totalPaid)}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.18 27)' }}>{won(s.totalUnpaid)}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.45 0.13 60)' }}>{won(s.totalRefunded)}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap font-semibold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{won(netRevenue)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>
                      {s.status === 'CONFIRMED' && <Lock size={10} />} {SETTLEMENT_STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{s.confirmedBy ?? '-'}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.55 0.015 250)' }}>{s.confirmedAt?.slice(0, 10) ?? '-'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {s.status === 'DRAFT' && canConfirm && (
                      <button onClick={() => setConfirmTarget(s.id)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                        <CheckCircle2 size={11} /> 정산 확정
                      </button>
                    )}
                    {s.status === 'DRAFT' && !canConfirm && (
                      <span className="text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>확정 권한 없음</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
            <AlertDialogAction onClick={handleConfirm} style={{ background: 'oklch(0.511 0.262 276.966)' }}>확정</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
