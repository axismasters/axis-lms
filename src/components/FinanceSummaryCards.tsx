// AXIS LMS v1.2 - Finance Summary Cards (Finance Foundation v3)
// 재무관리 화면 공용 상단 요약 카드. 청구금액/수납완료/미납금액/환불금액 4개를 보여주며,
// calculateMonthlySettlement(financeData.ts)를 그대로 사용해 정산관리·통계 화면과 항상 같은
// 기준(같은 함수)으로 계산된 숫자를 표시한다 — 화면마다 숫자가 어긋나는 일이 없다.

import { useFinance } from '@/contexts/FinanceContext';
import { calculateMonthlySettlement } from '@/lib/financeData';

function won(n: number) {
  return `${n.toLocaleString()}원`;
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="axis-card p-4 text-center">
      <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function FinanceSummaryCards({ month, label }: { month: string; label?: string }) {
  const { invoices, payments, refunds } = useFinance();
  const amounts = calculateMonthlySettlement(month, invoices, payments, refunds);

  return (
    <div className="grid grid-cols-4 gap-3">
      <Card label={label ?? `${month} 청구금액`} value={won(amounts.totalBilled)} color="oklch(0.38 0.18 250)" />
      <Card label="수납완료" value={won(amounts.totalPaid)} color="oklch(0.3 0.13 160)" />
      <Card label="미납금액" value={won(amounts.totalUnpaid)} color="oklch(0.5 0.18 27)" />
      <Card label="환불금액" value={won(amounts.totalRefunded)} color="oklch(0.45 0.13 60)" />
    </div>
  );
}
