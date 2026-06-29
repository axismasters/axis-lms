// AXIS LMS v1.2 - ContentContext (Teacher Content Engine v1)
// 강사 수업노트/수업영상/학습자료 CRUD Context.
//
// 설계 원칙:
// - Context는 모든 콘텐츠를 items 배열로 보관.
// - 스코프 가드(담당 반 범위 확인)는 호출부(TeacherNotes, TeacherVideos)에서 수행.
//   → addContent 시 classId가 assignedClassIds에 포함된 경우에만 호출할 것.
// - getByTeacher(teacherId, classIds)로 강사별/반별 필터링.
// - getVisibleForClass(classId, minVisibility)는 학생·학부모 포털 연동 시 사용 예정 (현재 v1 미사용).
// - 새로고침 시 초기화 (DB 연동은 다음 단계).

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ContentItem,
  ContentType,
  ContentVisibility,
  AddContentInput,
  UpdateContentInput,
  INITIAL_CONTENT,
} from '@/lib/contentData';

// ── Context 타입 ─────────────────────────────────────────────

interface ContentContextType {
  items: ContentItem[];

  /** 콘텐츠 추가. 반환값: 생성된 ContentItem */
  addContent: (input: AddContentInput) => ContentItem;

  /** 콘텐츠 수정 */
  updateContent: (id: string, patch: UpdateContentInput) => void;

  /** 콘텐츠 삭제 */
  deleteContent: (id: string) => void;

  /**
   * 강사 본인 콘텐츠 조회.
   * @param teacherId - 조회할 강사 ID
   * @param classIds  - 담당 반 ID 목록 (없으면 전체)
   * @param type      - 필터링할 타입 (없으면 전체)
   */
  getByTeacher: (teacherId: string, classIds?: string[], type?: ContentType) => ContentItem[];

  /**
   * 특정 반의 공개 콘텐츠 조회 (학생·학부모 포털용).
   * 현재 v1에서는 호출하지 않음 — visibility 구조 준비 목적.
   * @param classId       - 반 ID
   * @param minVisibility - 최소 공개 범위
   */
  getVisibleForClass: (classId: string, minVisibility: ContentVisibility) => ContentItem[];
}

// ── 공개 범위 우선순위 ────────────────────────────────────────
const VISIBILITY_RANK: Record<ContentVisibility, number> = {
  teacherOnly:     0,
  studentVisible:  1,
  parentVisible:   2,
};

// ── Context / Provider ────────────────────────────────────────

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_CONTENT);

  const addContent = useCallback((input: AddContentInput): ContentItem => {
    const now = new Date().toISOString();
    const newItem: ContentItem = {
      ...input,
      id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateContent = useCallback((id: string, patch: UpdateContentInput): void => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const deleteContent = useCallback((id: string): void => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const getByTeacher = useCallback(
    (teacherId: string, classIds?: string[], type?: ContentType): ContentItem[] => {
      return items
        .filter(item => {
          if (item.teacherId !== teacherId) return false;
          if (classIds && classIds.length > 0 && !classIds.includes(item.classId)) return false;
          if (type && item.type !== type) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    },
    [items]
  );

  const getVisibleForClass = useCallback(
    (classId: string, minVisibility: ContentVisibility): ContentItem[] => {
      const minRank = VISIBILITY_RANK[minVisibility];
      return items
        .filter(item =>
          item.classId === classId &&
          VISIBILITY_RANK[item.visibility] >= minRank
        )
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    [items]
  );

  return (
    <ContentContext.Provider value={{
      items,
      addContent,
      updateContent,
      deleteContent,
      getByTeacher,
      getVisibleForClass,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextType {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
}
