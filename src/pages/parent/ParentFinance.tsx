// AXIS LMS v1.2 — ParentFinance (Parent Finance View Foundation v1 → Phase 3D v2 정리)
// 학부모 전용 수납 내역 조회 — 읽기 전용, 상태 확인 중심.
// 🚫 납부 등록 / 환불 요청 / 수정 / 삭제 버튼 없음
// 🚫 라이벌 / 엠블럼 / 경쟁 정보 노출 금지
// ✅ assignedStudentIds 자녀 범위만 조회
// ✅ FinanceContext 기존 함수(getInvoicesByStudent, getUnpaidAmount)만 사용
// ✅ Phase 3D v2: 총 청구/완납/미납 "총액" 요약 그리드 제거 — 학부모 페이지 헌법 원칙
//    "총액 과시형 화면이 아니라 상태 확인 중심으로 정리한다"에 따라 상단 요약은 미납 유무
//    배지만 표시한다. 개별 청구서(월별)의 청구액/미납액은 실제 납부에 필요한 최소 정보로
//    유지한다(완전히 숨기면 납부 안내 기능 자체가 무력화되므로 "총액 과시"와는 구분).

import { useState } from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
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

export default function ParentFinance() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { getInvoicesByStudent, getUnpaidAmount, getPaymentsByInvoice } = useFinance();

  // ── 자녀 목록 (assignedStudentIds 기준) ───────────────────
  const myChildren = students.filter(s =>
    (currentUser.assignedStudentIds ?? []).includes(s.id)
  );
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id ?? '');
  const child = myChildren.find(s => s.id === selectedChildId);

  // ── 선택 자녀의 청구 내역 (최신월 우선) ──────────────────
  const invoices = selectedChildId
    ? getInvoicesByStudent(selectedChildId)
        .filter(inv => inv.status !== 'CANCELED')
        .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))
    : [];

  // ── 수납 요약(미납 유무만 사용 — 총액 표시는 하지 않는다) ─────
  const totalUnpaid  = invoices.reduce((s, inv) => s + getUnpaidAmount(inv.id), 0);

  // ── classId → 반 이름 ─────────────────────────────────────
  const classNameOf = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? classId;

  return (
    <ParentLayout title="수납 내역">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        {myChildren.length > 1 && (
          <div className="axis-card p-4">
            <div className="text-xs mb-2 font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
              자녀 선택
            </div>
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 appearance-none"
                style={{ border: '1px solid oklch(0.9 0.008 250)', background: 'white', color: 'oklch(0.2 0.02 250)' }}
              >
                {myChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'oklch(0.5 0.015 250)' }} />
            </div>
          </div>
        )}

        {/* 단일 자녀 표시 */}
        {myChildren.length === 1 && child && (
          <div className="axis-card p-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
              style={{ background: 'oklch(0.45 0.15 160)' }}
            >
              {child.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{child.name}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{child.status}</div>
            </div>
          </div>
        )}

        {/* 자녀 없음 */}
        {myChildren.length === 0 && (
          <div className="axis-card p-10 text-center">
            <CreditCard size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>연결된 자녀 정보가 없습니다.</div>
          </div>
        )}

        {child && (
          <>
            {/* 안내 배너 */}
            <div
              className="axis-card px-4 py-3 text-xs flex items-center justify-between gap-3 flex-wrap"
              style={{ borderLeft: '3px solid oklch(0.45 0.15 160)', color: 'oklch(0.5 0.015 250)' }}
            >
              <span>수납 내역은 조회 전용입니다. 납부 문의는 학원 행정실로 연락해주세요.</span>
              {invoices.length > 0 && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                  style={totalUnpaid > 0
                    ? { background: 'oklch(0.93 0.1 25)', color: 'oklch(0.45 0.15 25)' }
                    : { background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.12 145)' }}
                >
                  {totalUnpaid > 0 ? '미납 있음' : '미납 없음'}
                </span>
              )}
            </div>


            {/* 청구 내역 목록 */}
            {invoices.length === 0 ? (
              <div className="axis-card p-10 text-center">
                <CreditCard size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  표시할 수납 내역이 없습니다.
                </div>
              </div>
            ) : (
              <section>
                <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                  청구 내역
                </div>
                <div className="space-y-2">
                  {invoices.map(inv => {
                    const unpaid = getUnpaidAmount(inv.id);
                    const paid   = inv.finalAmount - unpaid;
                    const style  = STATUS_STYLE[inv.status];
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
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
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

                        {/* 수납 내역 (있는 경우만) */}
                        {invPayments.length > 0 && (
                          <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
                            <div className="text-xs font-medium" style={{ color: 'oklch(0.45 0.015 250)' }}>
                              수납 내역
                            </div>
                            {invPayments.map(p => (
                              <div key={p.id} className="flex items-center justify-between text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                                <span>{p.paidAt.slice(0, 10)} · {PAYMENT_METHOD_LABEL[p.paymentMethod]}</span>
                                <span className="tabular-nums font-medium" style={{ color: 'oklch(0.45 0.15 160)' }}>
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
    </ParentLayout>
  );
}
