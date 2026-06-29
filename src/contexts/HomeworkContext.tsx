// src/contexts/HomeworkContext.tsx
// AXIS LMS v1.2 — Homework Foundation v1
// ContentContext API와 완전 분리 — ContentContext 변경 없음

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Homework, AddHomeworkInput, UpdateHomeworkInput } from '@/lib/homeworkData';
import { loadHomework, saveHomework } from '@/lib/homeworkPersistence';

interface HomeworkContextType {
  homework: Homework[];

  /** 숙제 추가. 반환값: 생성된 Homework */
  addHomework: (input: AddHomeworkInput) => Homework;

  /** 숙제 수정 (제목/설명/마감일/상태) */
  updateHomework: (id: string, patch: UpdateHomeworkInput) => void;

  /** 숙제 삭제 */
  deleteHomework: (id: string) => void;

  /**
   * 강사용 조회 — teacherId + classIds 기준
   * assignedClassIds 외 반 접근 불가
   */
  getByTeacher: (teacherId: string, classIds?: string[]) => Homework[];

  /**
   * 학생용 조회 — enrolledClassIds 기준, published만 반환
   * teacherOnly/draft는 노출 안 됨
   */
  getForStudent: (enrolledClassIds: string[]) => Homework[];
}

const HomeworkContext = createContext<HomeworkContextType | null>(null);

export function HomeworkProvider({ children }: { children: ReactNode }) {
  const [homework, setHomework] = useState<Homework[]>(() => loadHomework());

  const addHomework = useCallback((input: AddHomeworkInput): Homework => {
    const now = new Date().toISOString();
    const item: Homework = {
      ...input,
      id: `hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setHomework(prev => {
      const updated = [item, ...prev];
      saveHomework(updated);
      return updated;
    });
    return item;
  }, []);

  const updateHomework = useCallback((id: string, patch: UpdateHomeworkInput): void => {
    setHomework(prev => {
      const updated = prev.map(h =>
        h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h,
      );
      saveHomework(updated);
      return updated;
    });
  }, []);

  const deleteHomework = useCallback((id: string): void => {
    setHomework(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveHomework(updated);
      return updated;
    });
  }, []);

  const getByTeacher = useCallback(
    (teacherId: string, classIds?: string[]): Homework[] =>
      homework.filter(h => {
        if (h.teacherId !== teacherId) return false;
        if (classIds && classIds.length > 0 && !classIds.includes(h.classId)) return false;
        return true;
      }),
    [homework],
  );

  /** 학생: published + 수강 중인 반 */
  const getForStudent = useCallback(
    (enrolledClassIds: string[]): Homework[] =>
      homework.filter(
        h => h.status === 'published' && enrolledClassIds.includes(h.classId),
      ),
    [homework],
  );

  return (
    <HomeworkContext.Provider
      value={{ homework, addHomework, updateHomework, deleteHomework, getByTeacher, getForStudent }}
    >
      {children}
    </HomeworkContext.Provider>
  );
}

export function useHomework(): HomeworkContextType {
  const ctx = useContext(HomeworkContext);
  if (!ctx) throw new Error('useHomework must be used within <HomeworkProvider>');
  return ctx;
}
