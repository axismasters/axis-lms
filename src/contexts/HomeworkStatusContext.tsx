// src/contexts/HomeworkStatusContext.tsx
// AXIS LMS v1.2 — Homework Status/Completion v1
// HomeworkContext / ContentContext와 완전 분리

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { HomeworkStatus, HomeworkStatusValue } from '@/lib/homeworkStatusData';
import { loadHomeworkStatus, saveHomeworkStatus } from '@/lib/homeworkStatusPersistence';

interface HomeworkStatusContextType {
  statuses: HomeworkStatus[];

  /**
   * 학생이 숙제 상태를 갱신.
   * 기존 레코드가 있으면 덮어쓰고, 없으면 신규 생성.
   * completed < seen < assigned 는 강등 불가 (이미 완료면 completed 유지).
   */
  setStatus: (homeworkId: string, studentId: string, next: HomeworkStatusValue) => void;

  /** 특정 학생의 특정 숙제 상태 조회. 없으면 'assigned' 반환. */
  getStatus: (homeworkId: string, studentId: string) => HomeworkStatus | null;

  /**
   * 강사용 — 특정 숙제의 학생별 상태 목록 조회
   * 대상 studentIds는 호출자가 반 수강 기준으로 필터해서 넘길 것
   */
  getStatusesForHomework: (homeworkId: string, studentIds: string[]) => HomeworkStatus[];
}

const RANK: Record<HomeworkStatusValue, number> = {
  assigned:  0,
  seen:      1,
  completed: 2,
};

const HomeworkStatusContext = createContext<HomeworkStatusContextType | null>(null);

export function HomeworkStatusProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<HomeworkStatus[]>(() => loadHomeworkStatus());

  const setStatus = useCallback(
    (homeworkId: string, studentId: string, next: HomeworkStatusValue) => {
      const now = new Date().toISOString();
      setStatuses(prev => {
        const existing = prev.find(s => s.homeworkId === homeworkId && s.studentId === studentId);
        let updated: HomeworkStatus[];

        if (!existing) {
          const entry: HomeworkStatus = {
            homeworkId,
            studentId,
            status: next,
            seenAt: next === 'seen' || next === 'completed' ? now : undefined,
            completedAt: next === 'completed' ? now : undefined,
            updatedAt: now,
          };
          updated = [entry, ...prev];
        } else {
          // 강등 불가 — 이미 높은 상태면 유지
          if (RANK[next] <= RANK[existing.status]) return prev;
          const entry: HomeworkStatus = {
            ...existing,
            status: next,
            seenAt: existing.seenAt ?? (next === 'seen' || next === 'completed' ? now : undefined),
            completedAt: next === 'completed' ? (existing.completedAt ?? now) : existing.completedAt,
            updatedAt: now,
          };
          updated = prev.map(s =>
            s.homeworkId === homeworkId && s.studentId === studentId ? entry : s,
          );
        }
        saveHomeworkStatus(updated);
        return updated;
      });
    },
    [],
  );

  const getStatus = useCallback(
    (homeworkId: string, studentId: string): HomeworkStatus | null =>
      statuses.find(s => s.homeworkId === homeworkId && s.studentId === studentId) ?? null,
    [statuses],
  );

  const getStatusesForHomework = useCallback(
    (homeworkId: string, studentIds: string[]): HomeworkStatus[] =>
      statuses.filter(
        s => s.homeworkId === homeworkId && studentIds.includes(s.studentId),
      ),
    [statuses],
  );

  return (
    <HomeworkStatusContext.Provider
      value={{ statuses, setStatus, getStatus, getStatusesForHomework }}
    >
      {children}
    </HomeworkStatusContext.Provider>
  );
}

export function useHomeworkStatus(): HomeworkStatusContextType {
  const ctx = useContext(HomeworkStatusContext);
  if (!ctx) throw new Error('useHomeworkStatus must be used within <HomeworkStatusProvider>');
  return ctx;
}
