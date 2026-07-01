// AXIS LMS v1.2 — StudentFinance (Phase 3D v2: 완전 격리 stub)
// ⚠ AXIS 확정 원칙: 학생 화면 재무/수납/청구/미납/환불/영수증 노출 절대 금지.
//
// v1에서 이 컴포넌트가 실제 재무 데이터(총 청구/완납/미납 금액, 청구 내역, 결제 내역)를
// 렌더링하고 있었고, StudentRoutes.tsx에 /student/finance로 라우팅까지 되어 있어
// 직접 URL 접근 시 학생에게 재무 정보가 노출되는 정책 위반이 있었다(v2 반려 사유 중 하나).
//
// v2에서 조치:
//   1) StudentRoutes.tsx에서 이 컴포넌트의 import를 완전히 제거하고, /student/finance는
//      항상 /student로 리다이렉트하도록 변경.
//   2) 이 파일 자체도 useFinance()를 호출하지 않는 완전한 stub으로 교체 — 향후 실수로
//      다시 import되더라도 재무 데이터가 화면에 그려질 수 없도록 이중으로 차단한다.
//
// 이 컴포넌트는 어떤 라우트에도 연결되어 있지 않다. 실수로 import되어도 안전하다.

import StudentLayout from '@/layouts/StudentLayout';

export default function StudentFinance() {
  return (
    <StudentLayout title="이용할 수 없는 화면">
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
          이 화면은 더 이상 제공되지 않습니다.
        </p>
      </div>
    </StudentLayout>
  );
}
