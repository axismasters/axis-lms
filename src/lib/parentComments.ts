// AXIS LMS v1.2 - parentComments.ts (Phase 3D v3-r1 추가 요구 대응)
// 선생님이 학부모에게 공개할 목적으로 직접 작성하는 "공개 코멘트".
//
// counselingData.ts(상담 기록)와는 완전히 별개다:
//   - counselingData.ts = 내부 기록. 학부모/학생에게 절대 노출하지 않는다.
//   - parentComments.ts = 선생님이 "학부모가 봐도 되는 내용"만 골라 직접 작성하는 요약 코멘트.
//     상담 원문을 그대로 옮기지 않는다 — 선생님이 학부모용으로 다시 쓴 문장만 저장한다.
//
// App.tsx가 불변이라 Provider 없이 localStorage 기반으로 구현한다(counselingData.ts와 동일 패턴).

export interface ParentComment {
  id: string;
  studentId: string;
  date: string;          // YYYY-MM-DD
  content: string;       // 학부모에게 공개할 코멘트 원문(선생님이 직접 작성)
  authorId: string;
  authorName: string;
  createdAt: string;
}

const STORAGE_KEY = (studentId: string) => `axis_parent_comments_${studentId}`;

function readAll(studentId: string): ParentComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(studentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(studentId: string, entries: ParentComment[]) {
  try {
    localStorage.setItem(STORAGE_KEY(studentId), JSON.stringify(entries));
  } catch {
    // storage 비활성 환경 — 조용히 무시
  }
}

/** 학부모 화면에서 최신순으로 조회 */
export function getParentCommentsForStudent(studentId: string): ParentComment[] {
  return readAll(studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 선생님 화면에서 작성 */
export function addParentComment(input: {
  studentId: string;
  date: string;
  content: string;
  authorId: string;
  authorName: string;
}): ParentComment {
  const entry: ParentComment = {
    id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };
  const all = readAll(input.studentId);
  all.push(entry);
  writeAll(input.studentId, all);
  return entry;
}
