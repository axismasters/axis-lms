// AXIS LMS v1.2 - 통계 화면 (Finance Foundation v2)
// 차트 라이브러리가 프로젝트에 없으므로(package.json 확인) 새로 추가하지 않고, 표 + 요약 카드 +
// 막대 형태의 간단한 바(div width%)로만 구현한다(이번 단계는 "간단 통계"까지만).
//
// Finance Foundation v2: 월별 청구/수납/미납/환불 계산을 financeData.ts의 calculateMonthlyFinanceStats로
// 옮겼다(정산관리 화면의 calculateMonthlySettlement와 동일한 합산 로직을 공유). 이전 버전은 환불액을
// APPROVED(아직 완료 전)까지 합산해 과대 집계되는 문제가 있었는데, 공통 helper로 옮기면서
// COMPLETED 상태만 정확히 집계하도록 함께 고쳐졌다.

import { useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useClasses } from '@/contexts/ClassContext';
import { canManageFinance, getClassEnrollmentType, calculateMonthlyFinanceStats } from '@/lib/financeData';

function won(n: number) { return `${n.toLocaleString()}원`; }

export default function FinanceStatistics() {
  const { can } = useAuth();
  const { invoices, payments, refunds, getPaidAmount } = useFinance();
  const { classes, getClass } = useClasses();

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '통계' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  // 월별 집계(청구/수납/미납/환불) — 정산관리와 동일한 calculateMonthlySettlement 로직을 그대로 공유한다.
  const monthlyStats = useMemo(
    () => calculateMonthlyFinanceStats(invoices, payments, refunds),
    [invoices, payments, refunds]
  );

  const maxBilled = Math.max(1, ...monthlyStats.map(m => m.totalBilled));

  // 반별 매출(수납 기준)
  const classStats = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach(inv => {
      const paid = getPaidAmount(inv.id);
      map.set(inv.classId, (map.get(inv.classId) ?? 0) + paid);
    });
    return Array.from(map.entries())
      .map(([classId, revenue]) => ({ classId, name: getClass(classId)?.name ?? classId, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [invoices, getPaidAmount, getClass]);

  const maxClassRevenue = Math.max(1, ...classStats.map(c => c.revenue));

  // 수강 유형별(정규반/특강반) 매출
  const typeStats = useMemo(() => {
    const result = { 정규반: 0, 특강반: 0 };
    invoices.forEach(inv => {
      const type = getClassEnrollmentType(inv.classId);
      result[type] += getPaidAmount(inv.id);
    });
    return result;
  }, [invoices, getPaidAmount]);
  const typeTotal = Math.max(1, typeStats.정규반 + typeStats.특강반);

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '통계' }]}>
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>통계</h1>
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
          월별·반별·수강 유형별 매출을 간단히 요약합니다. 모든 금액은 실제 청구/수납/환불 데이터에서 계산됩니다.
        </p>
      </div>

      {/* 월별 청구/수납/미납/환불 */}
      <div className="axis-card p-5 mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'oklch(0.3 0.015 250)' }}>월별 청구 · 수납 · 미납 · 환불</h2>
        {monthlyStats.length === 0 ? (
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>표시할 데이터가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
                {['청구월', '청구액', '수납액', '미납액', '환불액', '청구 비교'].map(h => (
                  <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map(m => (
                <tr key={m.month} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                  <td className="px-2.5 py-2 text-xs tabular-nums font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{m.month}</td>
                  <td className="px-2.5 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(m.totalBilled)}</td>
                  <td className="px-2.5 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(m.totalPaid)}</td>
                  <td className="px-2.5 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.18 27)' }}>{won(m.totalUnpaid)}</td>
                  <td className="px-2.5 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.45 0.13 60)' }}>{won(m.totalRefunded)}</td>
                  <td className="px-2.5 py-2" style={{ minWidth: 140 }}>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(m.totalBilled / maxBilled) * 100}%`, background: 'oklch(0.511 0.262 276.966)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 반별 매출 */}
        <div className="axis-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'oklch(0.3 0.015 250)' }}>반별 매출 (수납 기준)</h2>
          {classStats.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>표시할 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {classStats.map(c => (
                <div key={c.classId} className="flex items-center gap-2 text-xs">
                  <span className="w-28 flex-shrink-0 truncate" style={{ color: 'oklch(0.4 0.015 250)' }}>{c.name}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(c.revenue / maxClassRevenue) * 100}%`, background: 'oklch(0.511 0.262 276.966)' }} />
                  </div>
                  <span className="w-20 text-right tabular-nums flex-shrink-0" style={{ color: 'oklch(0.3 0.015 250)' }}>{won(c.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 수강 유형별 매출 */}
        <div className="axis-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'oklch(0.3 0.015 250)' }}>수강 유형별 매출</h2>
          <div className="space-y-3">
            {(['정규반', '특강반'] as const).map(type => (
              <div key={type}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'oklch(0.4 0.015 250)' }}>{type}</span>
                  <span className="tabular-nums font-semibold" style={{ color: 'oklch(0.3 0.015 250)' }}>{won(typeStats[type])}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(typeStats[type] / typeTotal) * 100}%`, background: type === '정규반' ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.6 0.15 60)' }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'oklch(0.6 0.015 250)' }}>
            반유형(정규반/특강반) 구분은 Class 데이터 구조를 변경하지 않고 Finance 도메인 안에서만 분류합니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
