// src/lib/homeworkPersistence.ts
// AXIS LMS v1.2 — Homework Foundation v1
// Homework[] 전체를 하나의 localStorage 키로 저장/복원

import type { Homework } from './homeworkData';
import { HOMEWORK_STORAGE_KEY, INITIAL_HOMEWORK } from './homeworkData';

export function loadHomework(): Homework[] {
  try {
    const raw = localStorage.getItem(HOMEWORK_STORAGE_KEY);
    if (!raw) return INITIAL_HOMEWORK;
    const parsed = JSON.parse(raw) as Homework[];
    if (!Array.isArray(parsed)) return INITIAL_HOMEWORK;
    return parsed;
  } catch {
    return INITIAL_HOMEWORK;
  }
}

export function saveHomework(items: Homework[]): void {
  try {
    localStorage.setItem(HOMEWORK_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // private mode / quota — silent fail
  }
}
