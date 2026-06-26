// AXIS LMS v1.2 - 시스템설정 > 권한설정
// AXIS 확정 원칙 1/2/3: 직급과 권한은 분리한다. AccountType은 계정의 큰 유형이고,
// 권한설정 UI는 직급/권한그룹 기준으로 관리한다. 권한 복사·변경 이력은 향후 확장 가능한 구조로 둔다.
//
// system.permissionView 보유 시 조회 가능. 편집(체크 토글)은 system.permissionUpdate 보유자(기본: 최고관리자)만 가능.
// 좌측 직급 목록 + 우측 권한 매트릭스 — 향후 직급별 커스텀 권한그룹(예: '강사(선임)') 확장을 고려한 구조.

import { useState } from 'react';
import { ShieldCheck, Info, Lock, Copy, History, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Position, POSITIONS, PORTAL_ONLY_POSITIONS, POSITION_LABEL,
  PERMISSION_KEYS, PermissionKey, DEFAULT_PERMISSION_GROUPS,
} from '@/lib/rbac';

const GROUPS: { label: string; prefix: string }[] = [
  { label: '학생', prefix: 'student.' },
  { label: '직원', prefix: 'employee.' },
  { label: '반', prefix: 'class.' },
  { label: '출결', prefix: 'attendance.' },
  { label: '평가/시험', prefix: 'assessment.' },
  { label: '재무', prefix: 'finance.' },
  { label: '시스템', prefix: 'system.' },
];

export default function PermissionSettings() {
  const { can } = useAuth();
  const canView = can('system.permissionView');
  const canEdit = can('system.permissionUpdate');

  // 편집 가능한 로컬 상태(저장 전까지). 실제 저장은 백엔드 연동 전이므로 메모리 내 토글만 제공.
  // 직급(Position) 기준 매트릭스 — Back Office 운영 직급(POSITIONS) + 포털용 직급(PORTAL_ONLY_POSITIONS)을 함께 관리.
  const ALL_POSITIONS: Position[] = [...POSITIONS, ...PORTAL_ONLY_POSITIONS];
  const [matrix, setMatrix] = useState<Record<Position, Set<PermissionKey>>>(() => {
    const m: Record<Position, Set<PermissionKey>> = {} as any;
    DEFAULT_PERMISSION_GROUPS.forEach((g) => { m[g.basePosition] = new Set(g.permissions); });
    return m;
  });

  if (!canView) {
    return (
      <AdminLayout title="권한설정" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '권한설정' }]}>
        <div className="axis-card p-12 text-center"><p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>권한설정 조회 권한이 없습니다.</p></div>
      </AdminLayout>
    );
  }

  const toggle = (position: Position, key: PermissionKey) => {
    if (!canEdit) { toast.error('권한 매트릭스 편집은 최고관리자만 가능합니다.'); return; }
    if (position === 'SUPER_ADMIN') { toast.error('최고관리자 권한은 고정되어 편집할 수 없습니다.'); return; }
    if (PORTAL_ONLY_POSITIONS.includes(position)) { toast.error('학생/보호자는 향후 포털용 조회 권한으로만 관리됩니다. 현재 단계에서는 Back Office 권한을 부여하지 않습니다.'); return; }
    setMatrix((prev) => {
      const next = { ...prev };
      const set = new Set(next[position]);
      set.has(key) ? set.delete(key) : set.add(key);
      next[position] = set;
      return next;
    });
  };

  const save = () => toast.success('권한 매트릭스가 저장되었습니다. (백엔드 연동 전 — 새로고침 시 기본값으로 복원됩니다)');

  // TODO(권한 복사 / 변경 이력): 직급별 권한설정 확장 영역.
  //   - 권한 복사: 한 직급(또는 커스텀 권한그룹)의 권한 셋을 다른 직급/그룹에 복사하는 기능.
  //     PermissionGroup.basePosition을 출처로 추적해 "OOO 직급 권한을 복사함" 식의 이력을 남길 수 있도록
  //     rbac.ts의 PermissionGroup 구조를 미리 마련해 두었다. 실제 복사 UI/저장 로직은 이번 단계 범위 밖.
  //   - 변경 이력: 권한그룹 단위로 누가/언제/어떤 permission key를 추가·제거했는지 기록하는 로그.
  //     백엔드의 변경 이력 테이블 연동 전까지는 placeholder만 노출한다.
  const handleCopyClick = () => toast.info('권한 복사 기능은 다음 단계에서 제공됩니다. (TODO: 직급/권한그룹 간 권한 셋 복사)');
  const handleHistoryClick = () => toast.info('권한 변경 이력 기능은 다음 단계에서 제공됩니다. (TODO: 권한그룹별 변경 로그)');

  return (
    <AdminLayout title="권한설정" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '권한설정' }]}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'oklch(0.2 0.02 250)' }}><ShieldCheck size={18} /> 직급별 권한설정</h1>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>직급(권한그룹)별 permission key 매트릭스입니다. 계정유형이 아니라 직급 기준으로 관리됩니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleHistoryClick} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.45 0.02 250)' }}>
            <History size={13} /> 변경 이력
          </button>
          <button onClick={handleCopyClick} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.45 0.02 250)' }}>
            <Copy size={13} /> 권한 복사
          </button>
          {canEdit && <button onClick={save} className="px-3.5 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'oklch(0.511 0.262 276.966)' }}>저장</button>}
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
          <Info size={13} /> 조회 전용입니다. 매트릭스 편집은 system.permissionUpdate 권한(기본: 최고관리자)이 필요합니다.
        </div>
      )}

      <div className="grid lg:grid-cols-[180px_1fr] gap-3">
        {/* 좌측: 직급 목록 — 향후 직급별 커스텀 권한그룹 추가/선택 확장 지점 */}
        <div className="axis-card p-2 lg:sticky lg:top-4 self-start">
          <div className="px-2 py-1.5 text-xs font-semibold" style={{ color: 'oklch(0.45 0.02 250)' }}>직급</div>
          {POSITIONS.map((p) => (
            <div key={p} className="flex items-center justify-between px-2.5 py-2 rounded-md text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
              <span className="flex items-center gap-1.5">{POSITION_LABEL[p]}{p === 'SUPER_ADMIN' && <Lock size={10} style={{ color: 'oklch(0.6 0.015 250)' }} />}</span>
              <ChevronRight size={13} style={{ color: 'oklch(0.75 0.01 250)' }} />
            </div>
          ))}
          <div className="mt-2 pt-2 px-2" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>포털용(조회 전용)</div>
            {PORTAL_ONLY_POSITIONS.map((p) => (
              <div key={p} className="px-2.5 py-1.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{POSITION_LABEL[p]}</div>
            ))}
          </div>
        </div>

        {/* 우측: 권한 매트릭스 */}
        <div className="axis-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 920 }}>
              <thead>
                <tr style={{ background: 'oklch(0.98 0.004 247)', borderBottom: '1px solid oklch(0.9 0.008 250)' }}>
                  <th className="text-left font-semibold px-3 py-2.5 sticky left-0 bg-inherit" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>Permission Key</th>
                  {ALL_POSITIONS.map((p) => (
                    <th key={p} className="text-center font-semibold px-2 py-2.5 whitespace-nowrap" style={{ color: PORTAL_ONLY_POSITIONS.includes(p) ? 'oklch(0.6 0.015 250)' : 'oklch(0.45 0.015 250)', fontSize: 12 }}>
                      {POSITION_LABEL[p]}{p === 'SUPER_ADMIN' && <Lock size={10} className="inline ml-1" style={{ color: 'oklch(0.6 0.015 250)' }} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((g) => (
                  <>
                    <tr key={g.label} style={{ background: 'oklch(0.97 0.006 250)' }}>
                      <td colSpan={ALL_POSITIONS.length + 1} className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'oklch(0.45 0.02 250)' }}>{g.label}</td>
                    </tr>
                    {PERMISSION_KEYS.filter((k) => k.startsWith(g.prefix)).map((key) => (
                      <tr key={key} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap" style={{ color: 'oklch(0.3 0.02 250)' }}>{key}</td>
                        {ALL_POSITIONS.map((p) => {
                          const checked = matrix[p]?.has(key) ?? false;
                          const locked = p === 'SUPER_ADMIN';
                          const portalOnly = PORTAL_ONLY_POSITIONS.includes(p);
                          return (
                            <td key={p} className="text-center px-2 py-2">
                              <input
                                type="checkbox"
                                checked={locked ? true : checked}
                                disabled={!canEdit || locked || portalOnly}
                                onChange={() => toggle(p, key)}
                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-xs mt-3" style={{ color: 'oklch(0.6 0.015 250)' }}>※ 최고관리자(SUPER_ADMIN)는 전체 권한이 고정되어 편집할 수 없습니다. 학생/보호자는 현재 Admin Back Office 운영 권한그룹이 아니라 향후 포털용 조회 권한으로만 존재하며, 이번 단계에서는 편집할 수 없습니다.</p>
      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 권한 복사 · 권한 변경 이력은 직급/권한그룹 구조(PermissionGroup)를 기반으로 다음 단계에서 구현됩니다.</p>
    </AdminLayout>
  );
}
