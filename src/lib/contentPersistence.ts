// src/lib/contentPersistence.ts
// AXIS LMS v1.2 — Content Persistence v1 buildfix
// ContentItem[] 전체를 하나의 localStorage 키로 저장/복원

import type { ContentItem } from './contentData';
import { CONTENT_STORAGE_KEY, INITIAL_CONTENT } from './contentData';

/** localStorage에서 ContentItem[] 복원. 실패 시 INITIAL_CONTENT(빈 배열) 반환. */
export function loadContentItems(): ContentItem[] {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!raw) return INITIAL_CONTENT;
    const parsed = JSON.parse(raw) as ContentItem[];
    if (!Array.isArray(parsed)) return INITIAL_CONTENT;
    return parsed;
  } catch {
    return INITIAL_CONTENT;
  }
}

/** ContentItem[] 전체를 localStorage에 저장. quota 초과 등은 silent fail. */
export function saveContentItems(items: ContentItem[]): void {
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // private mode / quota exceeded — 앱 동작 유지
  }
}
