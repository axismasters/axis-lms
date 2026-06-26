// AXIS LMS v1.2 - 시스템설정 > 학원정보관리
// 시스템설정 메뉴 구조(학원정보관리/권한설정/비밀번호 초기화 관리) 충족을 위한 화면.
// 상세 필드(로고·학원명·주소 등)는 별도 요청 시 확장. 현재는 system.logoUpdate 권한 게이트만 적용.

import { Building2, Info } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function AcademyInfoManagement() {
  const { can } = useAuth();
  const canEdit = can('system.logoUpdate');

  return (
    <AdminLayout title="학원정보관리" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '학원정보관리' }]}>
      <h1 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: 'oklch(0.2 0.02 250)' }}><Building2 size={18} /> 학원정보관리</h1>
      <p className="text-xs mb-4" style={{ color: 'oklch(0.5 0.015 250)' }}>학원 기본 정보·로고·브랜드 설정을 관리합니다.</p>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
          <Info size={13} /> 조회 전용입니다. 편집은 system.logoUpdate 권한이 필요합니다.
        </div>
      )}

      <div className="axis-card p-12 text-center">
        <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>학원정보관리 상세 화면은 추후 확장 예정입니다.</p>
        <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>(AXIS 브랜드북·로고·연락처 등 항목은 별도 요청 시 구현)</p>
      </div>
    </AdminLayout>
  );
}
