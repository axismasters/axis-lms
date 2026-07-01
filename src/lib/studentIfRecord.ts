// AXIS LMS v1.2 — Phase 3B: studentIfRecord.ts
// IF quick-tap(문항별) 선택 결과를 학생별로 저장·조회·집계한다.
//
// Phase 3A-2까지는 ResultDetailModal을 닫으면 선택이 사라지는 일회성 구조였다.
// Phase 3B에서는 이를 저장해 (1) 재접속 시 이어보기, (2) 시험 상세의 누적 성장 그래프,
// (3) Rival 비교/Emblem·SP 지급 트리거의 기반 데이터로 쓸 수 있게 한다.
//
// ⚠ 유지 원칙 (변경 없음):
//   - IF 사유는 계산 실수 / 개념 부족 / 시간 부족 3개만 사용한다.
//   - IF는 "테스트" 성적표 상세 안에서만 노출한다(별도 메뉴 없음).
//   - 학생 성적 직접 입력 기능이 아니다 — 이미 채점된 시험의 "놓친 이유 회고"만 저장한다.
//   - 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현 금지.
//   - 학생 화면 재무/수납/청구/미납/환불/영수증 노출 금지.

import { IF_REASONS } from './studentIfAnalysis';
import type { IfReason } from './studentIfAnalysis';

// ─── 저장 레코드 ─────────────────────────────────────────────────────
export interface IfQuestionSelectionSaved {
  questionId: string;
  no: number;
  points: number;
  reason: IfReason;
}

export interface StudentIfRecord {
  id: string;
  studentId: string;
  examId: string;
  examTitle: string;
  examDate: string;      // YYYY-MM-DD
  categoryId: string;
  actualScore: number;
  totalPoints: number;
  totalWrongCount: number;
  selections: IfQuestionSelectionSaved[]; // 이유가 선택된 문항만 저장(선택 안 한 문항은 미포함)
  isComplete: boolean;    // 오답 문항 전체에 이유가 선택되었는지
  ifScore: number;        // 선택된 문항 배점 합으로 계산한 IF 점수(상한 totalPoints)
  missedPoints: number;
  growthLinked: boolean;  // Emblem/SP 연동 훅이 이미 실행되었는지(중복 지급 방지)
  savedAt: string;
  updatedAt: string;
}

const STORAGE_KEY = (studentId: string) => `axis_student_if_record_${studentId}`;

function loadAllRaw(studentId: string): StudentIfRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(studentId));
    if (!raw) return [];
    return JSON.parse(raw) as StudentIfRecord[];
  } catch {
    return [];
  }
}

function saveAllRaw(studentId: string, records: StudentIfRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY(studentId), JSON.stringify(records));
  } catch {
    // localStorage 접근 불가 환경 무시(quick-tap 자체는 계속 동작, 새로고침 시 초기화될 뿐)
  }
}

// ─── 조회 ────────────────────────────────────────────────────────────
export function loadIfRecords(studentId: string): StudentIfRecord[] {
  return loadAllRaw(studentId).sort((a, b) => b.examDate.localeCompare(a.examDate));
}

export function getIfRecordForExam(studentId: string, examId: string): StudentIfRecord | undefined {
  return loadAllRaw(studentId).find(r => r.examId === examId);
}

// ─── 저장(upsert) ────────────────────────────────────────────────────
export function saveIfRecord(input: {
  studentId: string;
  examId: string;
  examTitle: string;
  examDate: string;
  categoryId: string;
  actualScore: number;
  totalPoints: number;
  totalWrongCount: number;
  selections: IfQuestionSelectionSaved[];
}): StudentIfRecord {
  const existing = getIfRecordForExam(input.studentId, input.examId);
  const recoveredPoints = input.selections.reduce((s, sel) => s + sel.points, 0);
  const ifScore = Math.min(input.actualScore + recoveredPoints, input.totalPoints);
  const isComplete = input.selections.length === input.totalWrongCount && input.totalWrongCount > 0;

  const record: StudentIfRecord = {
    id: existing?.id ?? `ifr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: input.studentId,
    examId: input.examId,
    examTitle: input.examTitle,
    examDate: input.examDate,
    categoryId: input.categoryId,
    actualScore: input.actualScore,
    totalPoints: input.totalPoints,
    totalWrongCount: input.totalWrongCount,
    selections: input.selections,
    isComplete,
    ifScore,
    missedPoints: ifScore - input.actualScore,
    growthLinked: existing?.growthLinked ?? false,
    savedAt: existing?.savedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rest = loadAllRaw(input.studentId).filter(r => r.examId !== input.examId);
  saveAllRaw(input.studentId, [record, ...rest]);
  return record;
}

// ─── Growth 연동 완료 표시(중복 지급 방지) ────────────────────────────
export function markIfRecordGrowthLinked(studentId: string, examId: string): void {
  const all = loadAllRaw(studentId);
  const updated = all.map(r => r.examId === examId ? { ...r, growthLinked: true } : r);
  saveAllRaw(studentId, updated);
}

// ─── ifFlags 변환 (GrowthContext.onIfAnalysisResult 입력 형식) ───────
// 학생 3사유 체계에는 없는 carelessMistake는 판단 불가 항목이라 항상 true로 고정한다
// (= 이 축에서는 보상하지 않음. "없다고 확인된 적 없다"는 뜻이지 "있었다"는 뜻이 아니다).
export function toGrowthIfFlags(record: StudentIfRecord): {
  calculationError: boolean; conceptLack: boolean; timeShortage: boolean; carelessMistake: boolean;
} {
  const has = (r: IfReason) => record.selections.some(s => s.reason === r);
  return {
    calculationError: has('계산 실수'),
    conceptLack: has('개념 부족'),
    timeShortage: has('시간 부족'),
    carelessMistake: true,
  };
}

// ─── 누적 집계 (Rival 비교/그래프용) ──────────────────────────────────
export interface IfReasonRatio {
  reason: IfReason;
  count: number;
  pct: number; // 전체 선택 대비 비율(%)
}

export interface IfCumulativeSummary {
  totalRecordsAnalyzed: number;      // isComplete인 레코드 수
  totalRecovered: number;            // 누적 놓친 점수 합
  reasonRatios: IfReasonRatio[];     // 3사유 비율(내림차순)
  avgImprovementPct: number | null;  // 평균 상승 가능성(%p)
}

export function getIfCumulativeSummary(records: StudentIfRecord[]): IfCumulativeSummary {
  const complete = records.filter(r => r.isComplete);
  const totalRecovered = complete.reduce((s, r) => s + r.missedPoints, 0);

  const counts: Record<IfReason, number> = { '계산 실수': 0, '개념 부족': 0, '시간 부족': 0 };
  let totalSelections = 0;
  complete.forEach(r => r.selections.forEach(s => { counts[s.reason]++; totalSelections++; }));

  const reasonRatios: IfReasonRatio[] = IF_REASONS.map(reason => ({
    reason,
    count: counts[reason],
    pct: totalSelections > 0 ? Math.round((counts[reason] / totalSelections) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const improvementPcts = complete
    .filter(r => r.totalPoints > 0)
    .map(r => Math.round((r.ifScore / r.totalPoints) * 100) - Math.round((r.actualScore / r.totalPoints) * 100));

  return {
    totalRecordsAnalyzed: complete.length,
    totalRecovered,
    reasonRatios,
    avgImprovementPct: improvementPcts.length > 0
      ? Math.round(improvementPcts.reduce((s, p) => s + p, 0) / improvementPcts.length)
      : null,
  };
}
