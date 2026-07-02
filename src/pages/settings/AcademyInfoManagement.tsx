// AXIS LMS v1.2 - 시스템설정 > 학원정보관리
// 시스템설정 메뉴 구조(학원정보관리/권한설정/비밀번호 초기화 관리) 충족을 위한 화면.
// 상세 필드(로고·학원명·주소 등)는 별도 요청 시 확장. 현재는 system.logoUpdate 권한 게이트만 적용.
//
// [Phase 3D v3-r12] "기능 사용 설정" 섹션 추가 — Rival / Emblem / 재무관리 시스템을
// 관리자가 켜고 끌 수 있게 한다. 새 라우트/새 권한 키를 추가하지 않고, 이미 이 화면에
// 쓰이던 system.logoUpdate 권한 게이트를 그대로 재사용한다(별도 RBAC 매트릭스 변경 없음).

import { useState } from 'react';
import { Building2, Info, ToggleLeft } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadSystemFeatureFlags, setFeatureFlag, SystemFeatureFlags,
} from '@/lib/systemFeatureFlags';

// ─── 토글 스위치 (기존 UI 킷에 Switch 컴포넌트가 없어 최소 형태로 직접 구현) ──────
function FeatureToggleRow({
  label, description, checked, disabled, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: '1px solid oklch(0.94 0.006 250)' }}>
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 rounded-full transition-colors duration-150"
        style={{
          width: 44, height: 24,
          background: checked ? '#040D1E' : 'oklch(0.85 0.01 250)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-150"
          style={{ width: 20, height: 20, left: checked ? 22 : 2 }}
        />
      </button>
    </div>
  );
}

// ─── 기능 사용 설정 섹션 ─────────────────────────────────────────────
function SystemFeatureSettingsSection({ canEdit }: { canEdit: boolean }) {
  const [flags, setFlags] = useState<SystemFeatureFlags>(loadSystemFeatureFlags());

  function handleToggle(key: keyof SystemFeatureFlags, next: boolean) {
    if (!canEdit) return;
    setFlags(setFeatureFlag(key, next));
  }

  return (
    <div className="axis-card p-5 mt-4">
      <h2 className="text-sm font-bold flex items-center gap-1.5 mb-1" style={{ color: 'oklch(0.2 0.02 250)' }}>
        <ToggleLeft size={16} /> 기능 사용 설정
      </h2>
      <p className="text-xs mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
        기능을 끄면 관련 메뉴·화면·조작이 전부 비활성화됩니다. 새로고침 후에도 설정이 유지되며,
        기존 데이터는 삭제되지 않습니다(다시 켜면 그대로 복원됩니다).
      </p>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md my-3 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
          <Info size={13} /> 조회 전용입니다. 편집은 system.logoUpdate 권한이 필요합니다.
        </div>
      )}

      <div className="mt-2">
        <FeatureToggleRow
          label="Rival 시스템"
          description="학생 Rival 화면, 성장 비교, Rival 관리 기능을 활성화합니다."
          checked={flags.rivalEnabled}
          disabled={!canEdit}
          onChange={(next) => handleToggle('rivalEnabled', next)}
        />
        <FeatureToggleRow
          label="Emblem 시스템"
          description="학생 성장 엠블럼, 엠블럼 관리/지급 기능을 활성화합니다."
          checked={flags.emblemEnabled}
          disabled={!canEdit}
          onChange={(next) => handleToggle('emblemEnabled', next)}
        />
        <FeatureToggleRow
          label="재무관리 시스템"
          description="수납/환불/미납/정산/학부모 수납 조회 기능을 활성화합니다."
          checked={flags.financeEnabled}
          disabled={!canEdit}
          onChange={(next) => handleToggle('financeEnabled', next)}
        />
      </div>
    </div>
  );
}

export default function AcademyInfoManagement() {
  const { can } = useAuth();
  const canEdit = can('system.logoUpdate');

  return (
    <AdminLayout title="학원정보관리" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '학원정보관리' }]}>
      <h1 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: 'oklch(0.2 0.02 250)' }}><Building2 size={18} /> 학원정보관리</h1>
      <p className="text-xs mb-4" style={{ color: 'oklch(0.4 0.015 250)' }}>학원 기본 정보·로고·브랜드 설정을 관리합니다.</p>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
          <Info size={13} /> 조회 전용입니다. 편집은 system.logoUpdate 권한이 필요합니다.
        </div>
      )}

      <div className="axis-card p-12 text-center">
        <p className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>학원정보관리 상세 화면은 추후 확장 예정입니다.</p>
        <p className="text-xs mt-1" style={{ color: 'oklch(0.47 0.015 250)' }}>(AXIS 브랜드북·로고·연락처 등 항목은 별도 요청 시 구현)</p>
      </div>

      <SystemFeatureSettingsSection canEdit={canEdit} />
    </AdminLayout>
  );
}
