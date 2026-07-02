// AXIS LMS v1.2 — Phase 3D v3-r12: FeatureDisabledNotice
// 관리자 설정에서 기능이 OFF일 때 라우트/카드 자리에 대신 보여주는 공용 안내.
// 시각 스타일은 기존 TeacherExamGradingGuard.tsx의 접근 차단 안내와 통일했다.

import { ShieldAlert } from 'lucide-react';

interface FeatureDisabledNoticeProps {
  /** 카드 안에 추가로 보여줄 한 줄 설명(선택) */
  description?: string;
  /** 기본 p-10 대신 좁은 카드 안에 넣을 때 등 여백 조정용(선택) */
  compact?: boolean;
}

export default function FeatureDisabledNotice({ description, compact }: FeatureDisabledNoticeProps) {
  return (
    <div className={compact ? 'axis-card p-5 text-center' : 'axis-card p-10 text-center'}>
      <ShieldAlert size={compact ? 18 : 24} className="mx-auto mb-2" style={{ color: 'oklch(0.55 0.2 27)' }} />
      <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>
        현재 관리자 설정에서 비활성화된 기능입니다.
      </div>
      {description && (
        <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{description}</div>
      )}
    </div>
  );
}
