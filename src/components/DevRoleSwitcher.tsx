// AXIS LMS v1.2 - DevRoleSwitcher
// 실제 로그인 연동 전 역할별 포털을 테스트하기 위한 DEV 전용 계정 전환 UI.
// 운영 배포 시 AuthContext의 DEV_USERS/loginAs와 함께 제거한다.

import { useAuth } from '@/contexts/AuthContext';
import { POSITION_LABEL } from '@/lib/rbac';

interface DevRoleSwitcherProps {
  compact?: boolean;
}

export default function DevRoleSwitcher({ compact = false }: DevRoleSwitcherProps) {
  const { currentUser, devUsers, loginAs } = useAuth();

  return (
    <label className="flex items-center gap-1.5">
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
        style={{ background: 'oklch(0.7 0.18 80)', color: 'oklch(0.2 0.02 250)' }}
      >
        DEV
      </span>
      <select
        value={currentUser.id}
        onChange={(e) => loginAs(e.target.value)}
        className="text-xs rounded px-1.5 py-1 bg-white min-w-0"
        style={{
          width: compact ? 112 : 150,
          border: '1px solid oklch(0.88 0.008 250)',
          color: 'oklch(0.25 0.02 250)',
        }}
        aria-label="DEV 계정 전환"
      >
        {devUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {POSITION_LABEL[u.position]} · {u.name}
          </option>
        ))}
      </select>
    </label>
  );
}
