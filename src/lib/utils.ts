// shadcn/ui 표준 cn 헬퍼 — clsx로 조건부 클래스 병합 후 tailwind-merge로 충돌 클래스 정리

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
