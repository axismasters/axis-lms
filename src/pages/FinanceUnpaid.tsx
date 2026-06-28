// AXIS LMS v1.2 - 미납관리 화면 (Finance Foundation v1)
// 미납(UNPAID) 또는 부분납(PARTIAL)인 청구만 모아서 보여주는 조회 중심 화면. 알림 발송은 실제
// 카카오/SMS 연동 없이 mock 처리만 한다(이 화면에서 "발송 여부"를 로컬로만 표시 — Invoice 데이터
// 모델 자체에는 알림 필드를 추가하지 않았다, Foundation 단계의 최소 범위를 지키기 위함).
// v2: handleNotify에서 NotificationContext.createNotificationFromEvent 호출 추가.

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useNotification } from '@/contexts/NotificationContext';
import { canManageFinance, daysOverdue } from '@/lib/financeData';
import { toast } from 'sonner';
import { Send, AlertTriangle } from 'lucide-react';

function won(n: number) { return `${n.toLocaleString()}원`; }

export default function FinanceUnpaid() {
  const { can } = useAuth();
  const { invoices, getPaidAmount } = useFinance();
  const { students } = useStudents();
  const { getClass } = useClasses();

  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const { createNotificationFromEvent } = useNotification();

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '미납관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const unpaidList = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'UNPAID' || inv.status === 'PARTIAL')
      .map(inv => {
        const paid = getPaidAmount(inv.id);
        const remaining = Math.max(0, inv.finalAmount - paid);
        const overdue = daysOverdue(inv.dueDate);
        return { inv, paid, remaining, overdue };
      })
      .filter(row => row.remaining > 0)
      .sort((a, b) => b.overdue - a.overdue);
  }, [invoices, getPaidAmount]);

  const summary = useMemo(() => {
    const totalUnpaid = unpaidList.reduce((s, r) => s + r.remaining, 0);
    const studentCount = new Set(unpaidList.map(r => r.inv.studentId)).size;
    const count = unpaidList.length;
    const over7 = unpaidList.filter(r => r.overdue >= 7).length;
    const over30 = unpaidList.filter(r => r.overdue >= 30).length;
    return { totalUnpaid, studentCount, count, over7, over30 };
  }, [unpaidList]);

  const handleNotify = (invoiceId: string, studentId: string, studentName: string) => {
    setNotifiedIds(prev => new Set(prev).add(invoiceId));
    const inv = invoices.find(i => i.id === invoiceId);
    const stu = studentMap.get(studentId);
    const guardian = stu?.guardians?.[0];
    // NotificationContext에 FINANCE_UNPAID_REMINDER 이력 생성
    createNotificationFromEvent('FINANCE_UNPAID_REMINDER', {
      studentId,
      studentName,
      guardianName: guardian?.name,
      guardianPhone: guardian?.phone,
      relatedEntityType: 'FINANCE',
      relatedEntityId: invoiceId,
      requestedBy: '시스템',
      vars: {
        학생명: studentName,
        보호자명: guardian?.name,
        청구월: inv?.billingMonth,
        미납금액: inv ? String(inv.finalAmount) : '',
        납부기한: inv?.dueDate,
      },
    });
    toast.success(`${studentName} 보호자에게 미납 안내를 발송했습니다(mock — 실제 카카오/SMS 연동 없음).`);
  };

  return (
    <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '미납관리' }]}>
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>미납관리</h1>
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>미납·부분납 청구를 한눈에 조회합니다.</p>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>총 미납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.5 0.18 27)' }}>{won(summary.totalUnpaid)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>미납 학생 수</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.45 0.13 60)' }}>{summary.studentCount}명</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>미납 건수</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.45 0.13 60)' }}>{summary.count}건</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>7일 이상 미납</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.5 0.18 27)' }}>{summary.over7}건</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>30일 이상 미납</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.45 0.2 20)' }}>{summary.over30}건</div>
        </div>
      </div>

      <div className="axis-card overflow-hidden">
        {unpaidList.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>미납 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 1180 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['학생명', '보호자 연락처', '반명', '청구월', '청구금액', '수납금액', '미납금액', '납부기한', '미납일수', '알림상태', '관리'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unpaidList.map(({ inv, paid, remaining, overdue }) => {
                  const stu = studentMap.get(inv.studentId);
                  const cls = getClass(inv.classId);
                  const notified = notifiedIds.has(inv.id);
                  return (
                    <tr key={inv.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{stu?.guardians[0]?.phone ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)' }}>{cls?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{inv.billingMonth}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(inv.finalAmount)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(paid)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap font-semibold" style={{ color: 'oklch(0.5 0.18 27)' }}>{won(remaining)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{inv.dueDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                          background: overdue >= 30 ? 'oklch(0.94 0.1 20)' : overdue >= 7 ? 'oklch(0.96 0.08 27)' : 'oklch(0.96 0.06 60)',
                          color: overdue >= 30 ? 'oklch(0.4 0.18 20)' : overdue >= 7 ? 'oklch(0.5 0.18 27)' : 'oklch(0.45 0.13 60)',
                        }}>
                          {overdue >= 7 && <AlertTriangle size={10} />} {overdue}일
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: notified ? 'oklch(0.3 0.13 160)' : 'oklch(0.65 0.01 250)' }}>
                        {notified ? '발송됨(mock)' : '미발송'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button onClick={() => handleNotify(inv.id, inv.studentId, stu?.name ?? '')} disabled={notified} className="flex items-center gap-1 text-xs hover:underline disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                          <Send size={11} /> {notified ? '발송완료' : '알림 발송'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
