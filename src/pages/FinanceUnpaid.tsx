// AXIS LMS v1.2 - 미납관리 화면 (Finance Payments Filter v1)
// 미납(UNPAID) 또는 부분납(PARTIAL)인 청구만 모아서 보여주는 조회 중심 화면.
//
// Payments Filter v1 추가 사항:
// - "수납 등록" 버튼 추가 — 미납/부분납 건에서 수납관리 화면으로 이동하면서
//   ?invoiceId=... query string을 전달해 수납 등록 모달이 자동으로 열리도록 한다.
//   신규 route 없음, useLocation(wouter) 활용.
// - Stability v1의 수강상태 컬럼 및 enrollmentMap 유지.
// - 모든 hook은 canManageFinance early return 이전에 위치한다.

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { useNotification } from '@/contexts/NotificationContext';
import { canManageFinance, canCreatePayment, daysOverdue } from '@/lib/financeData';
import { toast } from 'sonner';
import { Send, AlertTriangle, CreditCard } from 'lucide-react';

function won(n: number) { return `${n.toLocaleString()}원`; }

export default function FinanceUnpaid() {
  const { can } = useAuth();
  const { invoices, getPaidAmount } = useFinance();
  const { students } = useStudents();
  const { getClass } = useClasses();
  const { enrollments } = useEnrollment();

  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  const studentMap    = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const enrollmentMap = useMemo(() => new Map(enrollments.map(e => [e.id, e])), [enrollments]);
  const { createNotificationFromEvent } = useNotification();
  const [, navigate] = useLocation();

  const canPay = canCreatePayment(can);

  // ★ QA v1: unpaidList/summary useMemo를 canManageFinance early return 이전으로 이동
  // React hooks rule: 모든 hook(useMemo 포함)은 조건부 return 이전에 위치해야 한다.
  const unpaidList = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'UNPAID' || inv.status === 'PARTIAL')
      .map(inv => {
        const paid      = getPaidAmount(inv.id);
        const remaining = Math.max(0, inv.finalAmount - paid);
        const overdue   = daysOverdue(inv.dueDate);
        const enr       = enrollmentMap.get(inv.enrollmentId);
        return { inv, paid, remaining, overdue, enrStatus: enr?.status };
      })
      .filter(row => row.remaining > 0)
      .sort((a, b) => b.overdue - a.overdue);
  }, [invoices, getPaidAmount, enrollmentMap]);

  const summary = useMemo(() => {
    const totalUnpaid   = unpaidList.reduce((s, r) => s + r.remaining, 0);
    const studentCount  = new Set(unpaidList.map(r => r.inv.studentId)).size;
    const count         = unpaidList.length;
    const over7         = unpaidList.filter(r => r.overdue >= 7).length;
    const over30        = unpaidList.filter(r => r.overdue >= 30).length;
    return { totalUnpaid, studentCount, count, over7, over30 };
  }, [unpaidList]);

  if (!canManageFinance(can)) {
    return (
      <AdminLayout breadcrumbs={[{ label: '재무관리' }, { label: '미납관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>재무관리 접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const handleNotify = (invoiceId: string, studentId: string, studentName: string) => {
    setNotifiedIds(prev => new Set(prev).add(invoiceId));
    const inv      = invoices.find(i => i.id === invoiceId);
    const stu      = studentMap.get(studentId);
    const guardian = stu?.guardians?.[0];
    createNotificationFromEvent('FINANCE_UNPAID_REMINDER', {
      studentId,
      studentName,
      guardianName:  guardian?.name,
      guardianPhone: guardian?.phone,
      relatedEntityType: 'FINANCE',
      relatedEntityId:   invoiceId,
      requestedBy: '시스템',
      vars: {
        학생명:   studentName,
        보호자명: guardian?.name,
        청구월:   inv?.billingMonth,
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
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.42 0.015 250)' }}>
          미납·부분납 청구를 한눈에 조회합니다. 수강 상태가 퇴원/종료인 경우도 표시됩니다.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>총 미납액</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.4 0.18 27)' }}>{won(summary.totalUnpaid)}</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>미납 학생 수</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.35 0.13 60)' }}>{summary.studentCount}명</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>미납 건수</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.35 0.13 60)' }}>{summary.count}건</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>7일 이상 미납</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.4 0.18 27)' }}>{summary.over7}건</div>
        </div>
        <div className="axis-card p-4 text-center">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.47 0.015 250)' }}>30일 이상 미납</div>
          <div className="text-lg font-bold" style={{ color: 'oklch(0.35 0.2 20)' }}>{summary.over30}건</div>
        </div>
      </div>

      {/* 미납 목록 */}
      <div className="axis-card overflow-hidden">
        {unpaidList.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.47 0.015 250)' }}>미납 내역이 없습니다.</div>
        ) : (
          <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
            <table className="w-full text-sm" style={{ minWidth: 1280 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {[
                    '학생명', '보호자 연락처', '반명',
                    '수강상태',  // Stability v1 추가 — 퇴원/종료 학생의 미납을 즉시 식별하기 위함
                    '청구월', '청구금액', '수납금액', '미납금액', '납부기한', '미납일수', '알림상태', '관리',
                  ].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unpaidList.map(({ inv, paid, remaining, overdue, enrStatus }) => {
                  const stu      = studentMap.get(inv.studentId);
                  const cls      = getClass(inv.classId);
                  const notified = notifiedIds.has(inv.id);

                  // 퇴원/종료 수강에서 미납이 남아있으면 수강상태 셀을 경고색으로 표시한다.
                  const isInactiveEnr = enrStatus === '퇴원' || enrStatus === '종료';

                  return (
                    <tr key={inv.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu?.name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{stu?.guardians[0]?.phone ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.35 0.015 250)' }}>{cls?.name ?? '-'}</td>
                      {/* 수강상태 — Stability v1: 퇴원/종료인 경우 주황색 경고 뱃지로 표시 */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {enrStatus ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={isInactiveEnr
                              ? { background: 'oklch(0.96 0.08 27)', color: 'oklch(0.4 0.18 27)' }
                              : { background: 'oklch(0.94 0.08 160)', color: 'oklch(0.3 0.13 160)' }
                            }
                          >
                            {enrStatus}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'oklch(0.54 0.01 250)' }}>-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{inv.billingMonth}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{won(inv.finalAmount)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.3 0.13 160)' }}>{won(paid)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap font-semibold" style={{ color: 'oklch(0.4 0.18 27)' }}>{won(remaining)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{inv.dueDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                          background: overdue >= 30 ? 'oklch(0.94 0.1 20)' : overdue >= 7 ? 'oklch(0.96 0.08 27)' : 'oklch(0.96 0.06 60)',
                          color:      overdue >= 30 ? 'oklch(0.4 0.18 20)' : overdue >= 7 ? 'oklch(0.5 0.18 27)' : 'oklch(0.45 0.13 60)',
                        }}>
                          {overdue >= 7 && <AlertTriangle size={10} />} {overdue}일
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: notified ? 'oklch(0.3 0.13 160)' : 'oklch(0.65 0.01 250)' }}>
                        {notified ? '발송됨(mock)' : '미발송'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNotify(inv.id, inv.studentId, stu?.name ?? '')}
                            disabled={notified}
                            className="flex items-center gap-1 text-xs hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ color: '#040D1E' }}
                          >
                            <Send size={11} /> {notified ? '발송완료' : '알림 발송'}
                          </button>
                          {/* ★ 수납 등록 — 수납관리 화면으로 이동하면서 invoiceId를 query string으로 전달
                              FinancePayments에서 useSearch로 이 값을 받아 모달을 자동으로 연다. */}
                          {canPay && (
                            <button
                              onClick={() => navigate(`/admin/finance/payments?invoiceId=${inv.id}`)}
                              className="flex items-center gap-1 text-xs hover:underline"
                              style={{ color: 'oklch(0.38 0.18 250)' }}
                            >
                              <CreditCard size={11} /> 수납 등록
                            </button>
                          )}
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
    </AdminLayout>
  );
}
