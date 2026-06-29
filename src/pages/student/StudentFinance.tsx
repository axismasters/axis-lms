// AXIS LMS v1.2 — StudentFinance (Student Finance View Foundation v1)
// 학생 전용 수납 내역 조회 — 읽기 전용.
// ✅ currentUser.assignedStudentIds[0] 기준으로만 조회
// ✅ FinanceContext 기존 함수만 사용 (getInvoicesByStudent, getUnpaidAmount, getPaymentsByInvoice)
// 🚫 납부 등록 / 환불 요청 / 수정 / 삭제 버튼 없음
// 🚫 라이벌 / 엠블럼 / 경쟁 정보 노출 금지

import { CreditCard } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useFinance } from '@/contexts/FinanceContext';
import {
  INVOICE_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
} from '@/lib/financeData';
import type { InvoiceStatus } from '@/lib/financeData';

// ── 상태별 스타일 ────────────────────────────────────────────
const STATUS_STYLE: Record<InvoiceStatus, { bg: string; color: string }> = {
  PAID:     { bg: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.12 145)' },
  PARTIAL:  { bg: 'oklch(0.93 0.1 70)',   color: 'oklch(0.4 0.15 70)'  },
  UNPAID:   { bg: 'oklch(0.93 0.1 25)',   color: 'oklch(0.45 0.15 25)' },
  CANCELED: { bg: 'oklch(0.93 0.01 250)', color: 'oklch(0.5 0.01 250)' },
};

function formatMonth(billingMonth: string): string {
  const [y, m] = billingMonth.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export default function StudentFinance() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { getInvoicesByStudent, getUnpaidAmount, getPaymentsByInvoice } = useFinance();

  // ── 본인 studentId ─────────────────────────────────────────
  const myStudentId = currentUser.assignedStudentIds[0] ?? '';

  // ── 본인 청구 내역 (최신월 우선, CANCELED 제외) ───────────
  const invoices = myStudentId
    ? getInvoicesByStudent(myStudentId)
        .filter(inv => inv.status !== 'CANCELED')
        .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))
    : [];

  // ── 수납 요약 통계 ─────────────────────────────────────────
  const totalBilled = invoices.reduce((s, inv) => s + inv.finalAmount, 0);
  const totalUnpaid = invoices.reduce((s, inv) => s + getUnpaidAmount(inv.id), 0);
  const totalPaid   = totalBilled - totalUnpaid;

  // ── classId → 반 이름 ─────────────────────────────────────
  const classNameOf = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? classId;

  return (
    <StudentLayout title="수납 내역">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 안내 배너 */}
        <div
          className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}
        >
          수납 내역은 조회 전용입니다. 납부 문의는 학원 행정실로 연락해주세요.
        </div>

        {/* 학생 ID 없음 */}
        {!myStudentId && (
          <div className="axis-card p-10 text-center">
            <CreditCard size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              학생 정보를 찾을 수 없습니다.
            </div>
          </div>
        )}

        {myStudentId && (
          <>
            {/* 수납 요약 */}
            {invoices.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '총 청구', value: formatAmount(totalBilled), color: 'oklch(0.3 0.02 250)' },
                  { label: '완납',    value: formatAmount(totalPaid),   color: 'oklch(0.45 0.15 160)' },
                  { label: '미납',    value: formatAmount(totalUnpaid), color: totalUnpaid > 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.55 0.015 250)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="axis-card p-3 text-center">
                    <div className="font-bold text-xs tabular-nums" style={{ color }}>{value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 청구 내역 목록 */}
            {invoices.length === 0 ? (
              <div className="axis-card p-10 text-center">
                <CreditCard size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  표시할 수납 내역이 없습니다.
                </div>
                <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
                  수납 내역이 등록되면 여기에 표시됩니다.
                </div>
              </div>
            ) : (
              <section>
                <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                  청구 내역
                </div>
                <div className="space-y-2">
                  {invoices.map(inv => {
                    const unpaid     = getUnpaidAmount(inv.id);
                    const paid       = inv.finalAmount - unpaid;
                    const style      = STATUS_STYLE[inv.status];
                    const invPayments = getPaymentsByInvoice(inv.id);

                    return (
                      <div key={inv.id} className="axis-card p-4 space-y-2">
                        {/* 헤더 행 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                              {classNameOf(inv.classId)}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                              {formatMonth(inv.billingMonth)} · 납부기한 {inv.dueDate}
                            </div>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {INVOICE_STATUS_LABEL[inv.status]}
                          </span>
                        </div>

                        {/* 금액 행 */}
                        <div
                          className="grid grid-cols-2 gap-2 pt-1 border-t"
                          style={{ borderColor: 'oklch(0.93 0.006 250)' }}
                        >
                          <div>
                            <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>청구액</div>
                            <div className="font-semibold text-sm tabular-nums" style={{ color: 'oklch(0.25 0.02 250)' }}>
                              {formatAmount(inv.finalAmount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                              {unpaid > 0 ? '미납액' : '완납액'}
                            </div>
                            <div
                              className="font-semibold text-sm tabular-nums"
                              style={{ color: unpaid > 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.45 0.15 160)' }}
                            >
                              {unpaid > 0 ? formatAmount(unpaid) : formatAmount(paid)}
                            </div>
                          </div>
                        </div>

                        {/* 수납 내역 */}
                        {invPayments.length > 0 && (
                          <div
                            className="space-y-1 pt-1 border-t"
                            style={{ borderColor: 'oklch(0.93 0.006 250)' }}
                          >
                            <div className="text-xs font-medium" style={{ color: 'oklch(0.45 0.015 250)' }}>
                              수납 내역
                            </div>
                            {invPayments.map(p => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between text-xs"
                                style={{ color: 'oklch(0.55 0.015 250)' }}
                              >
                                <span>{p.paidAt.slice(0, 10)} · {PAYMENT_METHOD_LABEL[p.paymentMethod]}</span>
                                <span
                                  className="tabular-nums font-medium"
                                  style={{ color: 'oklch(0.45 0.15 160)' }}
                                >
                                  {formatAmount(p.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 메모 */}
                        {inv.memo && (
                          <div
                            className="text-xs rounded px-2 py-1"
                            style={{ background: 'oklch(0.97 0.004 250)', color: 'oklch(0.5 0.015 250)' }}
                          >
                            {inv.memo}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </StudentLayout>
  );
}
