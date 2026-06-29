// src/lib/homeworkStatusData.ts
// AXIS LMS v1.2 — Homework Status/Completion v1
// 학생별 숙제 상태 — HomeworkContext와 분리된 독립 구조
// 나중에 완료율/성실도/성장포인트와 연결 가능하도록 설계

export type HomeworkStatusValue = 'assigned' | 'seen' | 'completed';

export interface HomeworkStatus {
  homeworkId: string;
  studentId: string;
  status: HomeworkStatusValue;
  seenAt?: string;       // ISO 8601
  completedAt?: string;  // ISO 8601
  updatedAt: string;
}

/** localStorage 키 */
export const HW_STATUS_STORAGE_KEY = 'axis_lms_homework_status_v1';
