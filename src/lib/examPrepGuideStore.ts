// AXIS LMS v1.2 — Phase 3D v3-r15: 내신 대비 운영 가이드 엔진 — 저장 계층
//
// ⚠ 설계 원칙(systemFeatureFlags.ts와 동일한 이유):
//   - App.tsx는 불변 파일이며 "새 라우트/프로바이더 금지" 원칙이 있다. 이 모듈은 React
//     Context/Provider를 추가하지 않고, localStorage를 직접 읽고 쓰는 plain 함수만
//     제공한다 — 호출부(ExamPrepGuidePanel.tsx)가 렌더 시점마다 직접 호출해 최신 값을
//     읽고, 변경 후에는 로컬 컴포넌트 상태(useState)를 함께 갱신해 재렌더한다.
//   - 시험(Exam) 1건당 최대 1개의 가이드만 존재한다 — 키를 examId로 스코프한다.
//   - 지시서 §4-6: "추후 DB 연동 가능하도록 타입/헬퍼 분리" — 이 파일의 함수 시그니처는
//     저장소가 localStorage든 실제 API든 그대로 재사용할 수 있도록 순수 CRUD 형태로 뒀다.
//     실제 DB 연동 시에는 이 파일 내부 구현(get/set)만 API 호출로 교체하면 된다.
//   - 기존 시험/성적 데이터(assessmentData.ts, AssessmentContext.tsx)는 전혀 건드리지
//     않는다 — 이 스토어는 독립된 localStorage 키 공간에서만 동작한다.

import {
  ExamPrepGuideInput, ExamPrepGuideRecord, newDraftExamPrepGuide,
} from './examPrepGuideTypes';
import { generateExamPrepSchedule, validateExamPrepGuideInput } from './examPrepGuideEngine';

const STORAGE_PREFIX = 'axis_exam_prep_guide_v1:';

function storageKey(examId: string): string {
  return `${STORAGE_PREFIX}${examId}`;
}

// ─── 조회 ────────────────────────────────────────────────────────────
export function loadExamPrepGuide(examId: string): ExamPrepGuideRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(examId));
    if (!raw) return null;
    return JSON.parse(raw) as ExamPrepGuideRecord;
  } catch {
    return null;
  }
}

function persist(record: ExamPrepGuideRecord): ExamPrepGuideRecord {
  try {
    localStorage.setItem(storageKey(record.examId), JSON.stringify(record));
  } catch {
    // localStorage 접근 불가 환경(프라이빗 모드 등) — 이번 세션 동안은 호출부 state로만 유지된다.
  }
  return record;
}

/** 현재 입력값이 마지막 자동 생성 시점의 입력값과 달라졌는지(재생성 권장 여부). */
export function isExamPrepGuideStale(record: ExamPrepGuideRecord): boolean {
  if (record.status === 'draft' || !record.generatedFromInput) return false;
  return JSON.stringify(record.input) !== JSON.stringify(record.generatedFromInput);
}

// ─── 입력값 저장(초안 작성/수정) ────────────────────────────────────
// 승인 완료(approved) 상태에서는 직접 수정할 수 없다 — 먼저 승인을 취소해야 한다(§선생님
// 수정/승인 구조 — 정정 처리와 동일하게 "명시적 되돌리기" 없이 조용히 덮어쓰지 않는다).
export function saveExamPrepGuideInput(
  examId: string,
  input: ExamPrepGuideInput,
  actorName: string,
): { ok: boolean; reason?: string; record?: ExamPrepGuideRecord } {
  const existing = loadExamPrepGuide(examId);
  if (existing?.status === 'approved') {
    return { ok: false, reason: '승인된 가이드는 직접 수정할 수 없습니다. 먼저 승인을 취소해주세요.' };
  }
  const now = new Date().toISOString();
  const next: ExamPrepGuideRecord = existing
    ? { ...existing, input, updatedBy: actorName, updatedAt: now }
    : { ...newDraftExamPrepGuide(examId, input, actorName) };
  return { ok: true, record: persist(next) };
}

// ─── 자동 생성 ───────────────────────────────────────────────────────
// AXIS 계산 엔진(examPrepGuideEngine)만 호출한다 — 여기서 직접 일정을 계산하지 않는다.
export function generateExamPrepGuide(
  examId: string,
  actorName: string,
): { ok: boolean; reason?: string; errors?: string[]; record?: ExamPrepGuideRecord } {
  const existing = loadExamPrepGuide(examId);
  if (!existing) return { ok: false, reason: '먼저 입력값을 저장해주세요.' };
  if (existing.status === 'approved') {
    return { ok: false, reason: '승인된 가이드는 다시 생성할 수 없습니다. 먼저 승인을 취소해주세요.' };
  }
  const errors = validateExamPrepGuideInput(existing.input);
  if (errors.length > 0) {
    return { ok: false, reason: '입력값을 모두 채워주세요.', errors };
  }
  const schedule = generateExamPrepSchedule(existing.input);
  const now = new Date().toISOString();
  const next: ExamPrepGuideRecord = {
    ...existing,
    schedule,
    generatedFromInput: existing.input,
    status: 'generated',
    updatedBy: actorName,
    updatedAt: now,
  };
  return { ok: true, record: persist(next) };
}

// ─── 개별 회차 텍스트 수정(진도/숙제 문구를 선생님이 직접 다듬을 때) ─────
// status는 바꾸지 않는다(승인 전 검토·수정 단계에서 자유롭게 다듬을 수 있어야 하므로) —
// 단, 승인 완료 후에는 이 함수도 막는다.
export function updateExamPrepSessionText(
  examId: string,
  sessionNo: number,
  patch: { focus?: string; homework?: string },
  actorName: string,
): { ok: boolean; reason?: string; record?: ExamPrepGuideRecord } {
  const existing = loadExamPrepGuide(examId);
  if (!existing || !existing.schedule) return { ok: false, reason: '먼저 자동 생성을 실행해주세요.' };
  if (existing.status === 'approved') {
    return { ok: false, reason: '승인된 가이드는 직접 수정할 수 없습니다. 먼저 승인을 취소해주세요.' };
  }
  const now = new Date().toISOString();
  const schedule = {
    ...existing.schedule,
    progressPlan: existing.schedule.progressPlan.map((s) =>
      s.sessionNo === sessionNo && patch.focus !== undefined ? { ...s, focus: patch.focus } : s
    ),
    homeworkPlan: existing.schedule.homeworkPlan.map((h) =>
      h.sessionNo === sessionNo && patch.homework !== undefined ? { ...h, description: patch.homework } : h
    ),
  };
  const next: ExamPrepGuideRecord = { ...existing, schedule, updatedBy: actorName, updatedAt: now };
  return { ok: true, record: persist(next) };
}

// ─── 승인 ────────────────────────────────────────────────────────────
// generated 상태에서만 승인할 수 있다. 입력값이 마지막 생성 이후 바뀌었으면(stale) 승인을 막아
// "화면에 보이는 일정과 실제 승인된 일정이 다른" 상황을 방지한다.
export function approveExamPrepGuide(
  examId: string,
  actorName: string,
): { ok: boolean; reason?: string; record?: ExamPrepGuideRecord } {
  const existing = loadExamPrepGuide(examId);
  if (!existing || !existing.schedule) return { ok: false, reason: '먼저 자동 생성을 실행해주세요.' };
  if (existing.status === 'approved') return { ok: false, reason: '이미 승인된 가이드입니다.' };
  if (isExamPrepGuideStale(existing)) {
    return { ok: false, reason: '입력값이 마지막 생성 이후 변경되었습니다. 다시 생성한 뒤 승인해주세요.' };
  }
  const now = new Date().toISOString();
  const next: ExamPrepGuideRecord = { ...existing, status: 'approved', approvedBy: actorName, approvedAt: now };
  return { ok: true, record: persist(next) };
}

// ─── 승인 취소(되돌리기) ────────────────────────────────────────────
// 일정 데이터는 삭제하지 않고 보존한다 — 승인 이력(approvedBy/approvedAt)만 지우고 상태를
// 'generated'로 되돌려, 입력값을 수정하거나 세부 문구를 다듬은 뒤 다시 승인할 수 있게 한다.
export function unapproveExamPrepGuide(
  examId: string,
  actorName: string,
): { ok: boolean; reason?: string; record?: ExamPrepGuideRecord } {
  const existing = loadExamPrepGuide(examId);
  if (!existing || existing.status !== 'approved') return { ok: false, reason: '승인된 가이드가 아닙니다.' };
  const now = new Date().toISOString();
  const next: ExamPrepGuideRecord = {
    ...existing, status: 'generated', approvedBy: undefined, approvedAt: undefined,
    updatedBy: actorName, updatedAt: now,
  };
  return { ok: true, record: persist(next) };
}
