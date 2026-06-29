// src/lib/homeworkData.ts
// AXIS LMS v1.2 — Homework Foundation v1
// 숙제 타입 정의 + localStorage 키
// NGD2/문제은행 연동 없음 · 자동채점 없음 · 파일 업로드 없음

export interface Homework {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;          // 'YYYY-MM-DD'
  /** 'draft' = 미공개, 'published' = 공개(학생 조회 가능) */
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export type AddHomeworkInput = Omit<Homework, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateHomeworkInput = Partial<
  Omit<Homework, 'id' | 'teacherId' | 'classId' | 'createdAt' | 'updatedAt'>
>;

/** 초기 데이터 — 빈 배열 (seed 없음) */
export const INITIAL_HOMEWORK: Homework[] = [];

/** localStorage 키 */
export const HOMEWORK_STORAGE_KEY = 'axis_lms_homework_v1';
