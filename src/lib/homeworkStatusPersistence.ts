// src/lib/homeworkStatusPersistence.ts
// AXIS LMS v1.2 — Homework Status/Completion v1

import type { HomeworkStatus } from './homeworkStatusData';
import { HW_STATUS_STORAGE_KEY } from './homeworkStatusData';

export function loadHomeworkStatus(): HomeworkStatus[] {
  try {
    const raw = localStorage.getItem(HW_STATUS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HomeworkStatus[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveHomeworkStatus(items: HomeworkStatus[]): void {
  try {
    localStorage.setItem(HW_STATUS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silent fail — private mode / quota
  }
}
