// AXIS LMS v1.2 - counselingData.ts (Phase 3D v2)
// 선생님 상담 기록 — 내부 기록용. 학부모/학생에게 원문을 노출하지 않는다.
//
// 설계 노트: App.tsx가 불변 파일이라 새 Context Provider를 트리에 추가할 수 없다.
// studentIfRecord.ts와 동일한 패턴(localStorage 기반 모듈 함수 + 각 화면의 로컬 useState)을
// 그대로 따라 Provider 없이 동작하게 했다.
//
// 정책(요구사항 원문):
//   - 상담 유형: 학부모 상담 / 학사 상담 / 학습 상담 / 기타
//   - 상담 대상: 학부모 / 학생 / 내부 논의
//   - 필드: 상담일, 상담 유형, 상담 대상, 상담 내용, 작성자, 작성일
//   - 선생님은 본인 담당 학생 상담 기록만 작성/조회 가능 (canAccessStudent로 화면단 스코프)
//   - 최고관리자/원장은 전체 상담 기록 조회 가능
//   - 학생/보호자는 상담 기록 조회 불가(이 모듈은 학생/보호자 화면에서 import하지 않는다)
//   - 작성 시 작성자 계정 id + 작성 당시 activeMode(관리자모드/강사모드)를 함께 남긴다.

export type CounselingType = '학부모 상담' | '학사 상담' | '학습 상담' | '기타';
export type CounselingTarget = '학부모' | '학생' | '내부 논의';

export const COUNSELING_TYPES: CounselingType[] = ['학부모 상담', '학사 상담', '학습 상담', '기타'];
export const COUNSELING_TARGETS: CounselingTarget[] = ['학부모', '학생', '내부 논의'];

export interface CounselingRecord {
  id: string;
  studentId: string;
  date: string;            // 상담일 YYYY-MM-DD
  type: CounselingType;
  target: CounselingTarget;
  content: string;         // 상담 내용
  authorId: string;        // 작성자 계정 id (실제 사용자 id)
  authorName: string;      // 작성자 표시 이름
  activeMode: 'ADMIN_MODE' | 'TEACHER_MODE'; // 작성 당시 모드(원장/부원장 모드 전환 대응)
  createdAt: string;       // 작성일 ISO datetime
}

const STORAGE_KEY = 'axis_lms_counseling_records';

function readAll(): CounselingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: CounselingRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage 비활성 환경 — 조용히 무시(화면 자체는 계속 동작)
  }
}

/** 특정 학생의 상담 기록(최신순) */
export function getCounselingRecordsForStudent(studentId: string): CounselingRecord[] {
  return readAll()
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** 전체 상담 기록(최신순) — 최고관리자/원장 전용 화면에서만 호출할 것 */
export function getAllCounselingRecords(): CounselingRecord[] {
  return readAll().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function addCounselingRecord(input: {
  studentId: string;
  date: string;
  type: CounselingType;
  target: CounselingTarget;
  content: string;
  authorId: string;
  authorName: string;
  activeMode: 'ADMIN_MODE' | 'TEACHER_MODE';
}): CounselingRecord {
  const record: CounselingRecord = {
    id: `counsel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(record);
  writeAll(all);
  return record;
}
