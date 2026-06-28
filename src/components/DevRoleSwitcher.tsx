// AXIS LMS v1.2 - DevRoleSwitcher
// ⚠ DEV/TEST ONLY — 운영 배포 전 반드시 제거할 것.
// 역할별 포털(강사/학생/보호자) 화면에서도 계정 전환 테스트가 가능하도록
// 화면 우하단에 고정 표시하는 개발용 셀렉터.

import { useAuth } from '@/contexts/AuthContext';
import { POSITION_LABEL } from '@/lib/rbac';

export default function DevRoleSwitcher() {
  const { currentUser, loginAs, devUsers } = useAuth();

  return (
    <div
      className="fixed bottom-16 right-3 z-[200] flex items-center gap-1.5 px-2 py-1.5 rounded-lg shadow-lg"
      style={{ background: 'oklch(0.15 0.02 250)', border: '1px solid oklch(0.3 0.02 250)' }}
    >
      {/* DEV 배지 */}
      <span
        className="text-xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0"
        style={{ background: 'oklch(0.7 0.18 80)', color: 'oklch(0.15 0.02 250)' }}
      >
        DEV
      </span>

      {/* 계정 전환 셀렉터 */}
      <select
        value={currentUser.id}
        onChange={(e) => loginAs(e.target.value)}
        className="text-xs rounded px-1 py-0.5 bg-transparent"
        style={{
          border: '1px solid oklch(0.35 0.02 250)',
          color: 'oklch(0.85 0.01 250)',
          minWidth: 130,
        }}
      >
        {devUsers.map((u) => (
          <option key={u.id} value={u.id} style={{ color: 'black', background: 'white' }}>
            {POSITION_LABEL[u.position]} · {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
