// AXIS LMS v1.2 - contentData.ts (Teacher Content Engine v1)
// 강사 콘텐츠(수업노트/수업영상/학습자료) 공통 타입 정의.
// ─ 학생/학부모 포털에는 이번 단계에서 노출하지 않음 (visibility 구조만 준비).
// ─ 외부 영상 플랫폼 실제 연동 없음 — URL만 저장.

// ── 타입 ─────────────────────────────────────────────────────

/** 콘텐츠 종류 */
export type ContentType =
  | 'note'       // 수업노트
  | 'video'      // 수업영상 (URL 저장)
  | 'material';  // 학습자료 (URL 저장)

/**
 * 콘텐츠 공개 범위.
 * teacherOnly: 강사 본인만 / studentVisible: 학생 포털 공개 / parentVisible: 학부모 포털까지 공개.
 * 현재(v1) 학생·학부모 포털에는 노출하지 않으므로 UI에서는 teacherOnly를 기본값으로 사용.
 */
export type ContentVisibility = 'teacherOnly' | 'studentVisible' | 'parentVisible';

export interface ContentItem {
  id: string;
  type: ContentType;
  classId: string;      // 담당 반 ID (scope guard: 강사 assignedClassIds 포함 여부 확인 후 저장)
  teacherId: string;    // 저장 강사 ID
  title: string;        // 노트 주제 / 영상 제목 / 자료 제목

  // note용
  content?: string;     // 수업 본문
  homework?: string;    // 과제/다음수업 안내 (선택)

  // video/material용
  url?: string;         // 영상/자료 링크 (외부 플랫폼 URL — 실제 임베드 없음)

  date: string;         // 수업 날짜 (YYYY-MM-DD)
  visibility: ContentVisibility;
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
}

/** addContent 호출 시 입력 타입 (id/createdAt/updatedAt은 Context 내부 생성) */
export type AddContentInput = Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>;

/** 부분 업데이트 타입 */
export type UpdateContentInput = Partial<AddContentInput>;

// ── 초기 더미 데이터 ─────────────────────────────────────────
// 새로고침 시 초기화 (Context state 수준).
export const INITIAL_CONTENT: ContentItem[] = [];
