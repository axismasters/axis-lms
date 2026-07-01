// AXIS LMS v1.2 - accountActionLog.ts (Phase 3D v3)
// 비밀번호 초기화 / 닉네임 초기화 같은 민감한 계정 액션의 실행 로그(audit mock).
// 실제 백엔드 감사로그 연동 전까지 localStorage에 기록한다(studentIfRecord.ts /
// counselingData.ts와 동일한 Provider-less 패턴 — App.tsx가 불변이라 새 Context를
// 추가할 수 없다).

export type AccountActionType = 'PASSWORD_RESET' | 'NICKNAME_RESET';

export interface AccountActionLogEntry {
  id: string;
  action: AccountActionType;
  targetStudentId: string;
  targetStudentName: string;
  actorId: string;        // 실행한 사용자 계정 id
  actorName: string;
  activeMode: 'ADMIN_MODE' | 'TEACHER_MODE'; // 실행 당시 모드(원장/부원장 모드전환 대응)
  createdAt: string;      // ISO datetime
}

const STORAGE_KEY = 'axis_lms_account_action_log';

function readAll(): AccountActionLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: AccountActionLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage 비활성 환경 — 조용히 무시
  }
}

export function logAccountAction(input: {
  action: AccountActionType;
  targetStudentId: string;
  targetStudentName: string;
  actorId: string;
  actorName: string;
  activeMode: 'ADMIN_MODE' | 'TEACHER_MODE';
}): AccountActionLogEntry {
  const entry: AccountActionLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(entry);
  writeAll(all);
  return entry;
}

/** 특정 학생 대상 액션 로그(최신순) — 관리자 조회용으로 열어둔다. */
export function getAccountActionLogForStudent(studentId: string): AccountActionLogEntry[] {
  return readAll()
    .filter((e) => e.targetStudentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
