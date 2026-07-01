// AXIS LMS v1.2 — Phase 3D v3-r4-r1: 관찰 필요 학생 신호 산출 (observationSignals)
//
// 목적: 관리자 홈(전체 학생) / 선생님 홈(담당 학생)에 "확인 필요한 학생" 강조 패널을
// 띄우기 위해, 이미 존재하는 데이터(공개된 테스트 결과 + IF 레코드 + 출결 + 숙제 +
// 과목별 목표 대비 격차)만으로 관찰 필요 신호를 자동 산출한다. 선생님이 추가로 글을
// 쓰게 만드는 입력 기능은 만들지 않는다.
//
// v3-r4-r1: 테스트/IF 중심 감지에 3종을 추가했다 — 결석/지각 증가, 숙제 미제출 증가,
// 목표 대비 보완 과목 악화. 모든 신호는 순수 함수 입력(ObservationInput)으로만 계산되며,
// 이 모듈 자체는 컨텍스트/localStorage에 직접 접근하지 않는다(호출부가 데이터를 모아 넘긴다).
// 이 모듈이 정의하는 입력 타입(StudentSignalBundle)은 parentInsightEngine.ts /
// studentBriefingEngine.ts에서도 동일하게 재사용해 계산 로직이 두 곳에서 어긋나지 않게 한다.
//
// ⚠ 표현 정책(AXIS 헌법 v3-r4): 배지/이유 문구는 아래 허용 표현만 사용한다.
//   허용: '관찰 필요' · '확인 필요' · '흐름 하락' · '반복 약점' · '학습 리듬 확인'
//   금지: 위험 학생 · 문제 학생 · 경고 대상 · 탈락 · 불합격 · 합격 가능성/합격률 하락

import type { StudentExamResult } from './assessmentData';
import type { AttendanceStatus } from './attendanceData';
import { getLocalDateStr } from '@/utils/dateUtils';

// 배지 레벨 — 허용 표현만.
export type ObservationLevel =
  | '흐름 하락'
  | '반복 약점'
  | '확인 필요'
  | '학습 리듬 확인'
  | '관찰 필요';

export type ObservationKind =
  | 'test-decline' // 최근 2회 연속 하락
  | 'repeat-weak' // 최근 하위 반복
  | 'below-average' // 직전 시험 반평균 하회
  | 'if-missed-up' // IF 놓친 점수 증가
  | 'attendance-decline' // 결석/지각 증가
  | 'homework-decline' // 숙제 미제출 증가
  | 'target-gap-worsening' // 목표 대비 보완 과목 악화
  | 'no-recent-activity'; // 최근 활동 없음

export interface ObservationReason {
  kind: ObservationKind;
  label: ObservationLevel; // 이 이유가 나타내는 상태(허용 표현)
  detail: string; // 근거 한 줄(객관 수치 기반)
}

export interface StudentObservation {
  studentId: string;
  studentName: string;
  level: ObservationLevel; // 대표 배지(가장 우선순위 높은 이유)
  reasons: ObservationReason[];
  recentChange: string; // "최근 변화" 한 줄 요약
}

// 호출부가 IF 전체 타입을 알 필요 없이 넘길 수 있도록 최소 형태만 요구한다.
export interface IfRecordLite {
  examDate: string; // YYYY-MM-DD
  missedPoints: number;
  isComplete: boolean;
}

// 출결 세션(AttendanceSession.records)에서 이 학생 것만 골라 최소 형태로 넘긴다.
export interface AttendanceRecordLite {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

// 숙제(Homework)+완료여부(HomeworkStatus)를 조합한 최소 형태.
// 호출부는 status==='published'인 항목만 걸러서 넘긴다(초안/미공개 숙제는 집계 제외).
export interface HomeworkItemLite {
  date: string; // 배정일(YYYY-MM-DD) — Homework.createdAt.slice(0,10)
  completed: boolean;
}

// 과목별 목표 대비 격차/변화 — computeSubjectGaps()로 산출한다.
export interface SubjectGapLite {
  subject: string;
  avgPct: number; // 해당 과목 평균 정답률(%)
  gapToTarget: number; // 목표(SUBJECT_TARGET_PCT) - avgPct. 양수면 목표에 못 미침.
  changeVsEarlier: number | null; // 이전 절반 대비 최근 절반 변화(%p). 음수면 하락(악화).
}

export interface ObservationInput {
  studentId: string;
  studentName: string;
  results: StudentExamResult[]; // getPublishedResultsForStudent 결과
  ifRecords: IfRecordLite[]; // loadIfRecords 결과(형태 호환)
  attendanceRecords?: AttendanceRecordLite[]; // 없으면 결석/지각 증가 신호는 계산하지 않음
  homeworkItems?: HomeworkItemLite[]; // 없으면 숙제 미제출 증가 신호는 계산하지 않음
  subjectGaps?: SubjectGapLite[]; // 없으면 목표 대비 보완 과목 악화 신호는 계산하지 않음
  today?: Date;
}

// parentInsightEngine.ts / studentBriefingEngine.ts가 동일한 입력 형태를 재사용하기 위한 별칭.
export type StudentSignalBundle = ObservationInput;

// ── 임계값(운영 조정 여지) ─────────────────────────────────────────────
const LOW_PCT = 60; // "하위"로 보는 정답률(%)
const RECENT_WINDOW = 3; // 최근 몇 회를 볼지
const REPEAT_LOW_MIN = 2; // 최근 N회 중 몇 회 이상 하위이면 반복 약점
const NO_ACTIVITY_DAYS = 21; // 최근 활동 없음 기준(일)
const IF_MISS_MIN = 5; // IF 놓친 점수 증가로 볼 최소 점수
const BELOW_AVG_MARGIN = 3; // 반평균 하회로 볼 최소 점수 차
export const SUBJECT_TARGET_PCT = 90; // 과목별 목표 퍼센트(다른 화면의 기존 상수와 동일 값 유지)
const ATTENDANCE_WINDOW_DAYS = 14; // 결석/지각 증가 비교 구간(일)
const ATTENDANCE_BAD_MIN = 2; // 최근 구간 결석+지각 최소 건수
const HOMEWORK_WINDOW_DAYS = 14; // 숙제 미제출 증가 비교 구간(일)
const HOMEWORK_UNDONE_MIN = 2; // 최근 구간 미제출 최소 건수
const TARGET_GAP_WORSEN_MIN = 3; // 과목 악화로 볼 최소 하락폭(%p)

const LEVEL_ORDER: ObservationLevel[] = [
  '흐름 하락',
  '반복 약점',
  '확인 필요',
  '학습 리듬 확인',
  '관찰 필요',
];

function pctOf(r: StudentExamResult): number {
  if (!r.totalPoints) return 0;
  return Math.round((r.earnedScore / r.totalPoints) * 100);
}

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// N일 전 날짜를 한국 로컬 기준 YYYY-MM-DD 문자열로 반환(toISOString 시차 문제 회피).
function daysAgoStr(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return getLocalDateStr(d);
}

/**
 * 공개 테스트 결과를 과목별로 묶어 평균 정답률/목표 대비 격차/이전 절반 대비 변화를 계산한다.
 * ParentGrowthReport.tsx의 기존 과목별 보완 필요도 계산과 동일한 방식(표본 2건 미만인
 * 과목은 changeVsEarlier를 계산하지 않음)을 재사용해 화면 간 수치가 어긋나지 않게 한다.
 *
 * @param results getPublishedResultsForStudent() 결과
 * @param getSubject examId → 과목명 리졸버(호출부가 exams 배열에서 찾아 넘긴다)
 */
export function computeSubjectGaps(
  results: StudentExamResult[],
  getSubject: (examId: string) => string | undefined,
  targetPct: number = SUBJECT_TARGET_PCT
): SubjectGapLite[] {
  const map = new Map<string, { pct: number; date: string }[]>();
  results.forEach((r) => {
    const subject = getSubject(r.examId) ?? '기타';
    const pct = r.totalPoints > 0 ? (r.earnedScore / r.totalPoints) * 100 : 0;
    const list = map.get(subject) ?? [];
    list.push({ pct, date: r.examDate });
    map.set(subject, list);
  });

  return Array.from(map.entries())
    .map(([subject, list]) => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      const avgPct = Math.round(sorted.reduce((s, x) => s + x.pct, 0) / sorted.length);
      const mid = Math.floor(sorted.length / 2);
      const earlierHalf = sorted.slice(0, mid);
      const laterHalf = sorted.slice(mid);
      const changeVsEarlier =
        earlierHalf.length > 0 && laterHalf.length > 0
          ? Math.round(laterHalf.reduce((s, x) => s + x.pct, 0) / laterHalf.length) -
            Math.round(earlierHalf.reduce((s, x) => s + x.pct, 0) / earlierHalf.length)
          : null;
      return { subject, avgPct, gapToTarget: targetPct - avgPct, changeVsEarlier };
    })
    .sort((a, b) => b.gapToTarget - a.gapToTarget);
}

/**
 * 한 학생의 관찰 신호를 산출한다. 신호가 하나도 없으면 null.
 * 모든 이유는 기존 데이터에서 자동 계산되며, 선생님/학부모 수동 입력을 요구하지 않는다.
 */
export function computeObservation(input: ObservationInput): StudentObservation | null {
  const today = input.today ?? new Date();
  const reasons: ObservationReason[] = [];

  // 날짜 오름차순(과거→최근)
  const sorted = [...input.results].sort((a, b) => a.examDate.localeCompare(b.examDate));
  const latest = sorted[sorted.length - 1];
  const recent = sorted.slice(-RECENT_WINDOW);

  // recentChange 기본 문구
  let recentChange = '최근 테스트 기록 없음';
  if (latest) {
    if (sorted.length >= 2) {
      const prev = sorted[sorted.length - 2];
      const diff = pctOf(latest) - pctOf(prev);
      const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
      recentChange = `최근 테스트 ${pctOf(prev)}% → ${pctOf(latest)}% (${arrow}${Math.abs(diff)}%p)`;
    } else {
      recentChange = `최근 테스트 ${pctOf(latest)}%`;
    }
  }

  // [1] test-decline: 최근 2회 연속 하락(직전<그전, 최근<직전)
  if (sorted.length >= 3) {
    const n = sorted.length;
    const p0 = pctOf(sorted[n - 3]);
    const p1 = pctOf(sorted[n - 2]);
    const p2 = pctOf(sorted[n - 1]);
    if (p2 < p1 && p1 < p0) {
      reasons.push({
        kind: 'test-decline',
        label: '흐름 하락',
        detail: `최근 2회 연속 하락 (${p0}% → ${p1}% → ${p2}%)`,
      });
    }
  }

  // [2] repeat-weak: 최근 RECENT_WINDOW회 중 REPEAT_LOW_MIN회 이상 하위(<LOW_PCT)
  if (recent.length >= REPEAT_LOW_MIN) {
    const lowCount = recent.filter((r) => pctOf(r) < LOW_PCT).length;
    if (lowCount >= REPEAT_LOW_MIN) {
      reasons.push({
        kind: 'repeat-weak',
        label: '반복 약점',
        detail: `최근 ${recent.length}회 중 ${lowCount}회 하위(${LOW_PCT}% 미만)`,
      });
    }
  }

  // [3] below-average: 직전 시험이 응시자 평균 점수를 BELOW_AVG_MARGIN점 이상 하회
  if (latest && latest.averageScore !== undefined && latest.earnedScore < latest.averageScore - BELOW_AVG_MARGIN) {
    reasons.push({
      kind: 'below-average',
      label: '확인 필요',
      detail: `직전 시험 반평균 하회 (${latest.earnedScore}점 / 평균 ${latest.averageScore}점)`,
    });
  }

  // [4] if-missed-up: 최근 IF 놓친 점수가 이전 평균보다 증가(완료 레코드만)
  const completeIf = input.ifRecords
    .filter((r) => r.isComplete)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  if (completeIf.length >= 2) {
    const last = completeIf[completeIf.length - 1];
    const prior = completeIf.slice(0, -1);
    const priorAvg = prior.reduce((s, r) => s + r.missedPoints, 0) / prior.length;
    if (last.missedPoints >= IF_MISS_MIN && last.missedPoints > priorAvg) {
      const up = Math.round((last.missedPoints - priorAvg) * 10) / 10;
      reasons.push({
        kind: 'if-missed-up',
        label: '확인 필요',
        detail: `IF 놓친 점수 증가 (직전 평균 대비 ▲${up}점)`,
      });
    }
  }

  // [5] attendance-decline: 결석/지각 증가 — 최근 14일 vs 직전 14일 비교
  const attendance = input.attendanceRecords ?? [];
  if (attendance.length > 0) {
    const recentFromStr = daysAgoStr(today, ATTENDANCE_WINDOW_DAYS);
    const priorFromStr = daysAgoStr(today, ATTENDANCE_WINDOW_DAYS * 2);
    const isBad = (s: AttendanceStatus) => s === '결석' || s === '지각';
    const recentBad = attendance.filter((r) => r.date >= recentFromStr && isBad(r.status)).length;
    const priorBad = attendance.filter(
      (r) => r.date >= priorFromStr && r.date < recentFromStr && isBad(r.status)
    ).length;
    if (recentBad >= ATTENDANCE_BAD_MIN && recentBad > priorBad) {
      reasons.push({
        kind: 'attendance-decline',
        label: '학습 리듬 확인',
        detail: `최근 ${ATTENDANCE_WINDOW_DAYS}일 결석/지각 ${recentBad}회 (직전 ${ATTENDANCE_WINDOW_DAYS}일 ${priorBad}회 대비 증가)`,
      });
    }
  }

  // [6] homework-decline: 숙제 미제출 증가 — 최근 14일 vs 직전 14일 비교(공개된 숙제만)
  const homework = input.homeworkItems ?? [];
  if (homework.length > 0) {
    const recentFromStr = daysAgoStr(today, HOMEWORK_WINDOW_DAYS);
    const priorFromStr = daysAgoStr(today, HOMEWORK_WINDOW_DAYS * 2);
    const recentUndone = homework.filter((h) => h.date >= recentFromStr && !h.completed).length;
    const priorUndone = homework.filter(
      (h) => h.date >= priorFromStr && h.date < recentFromStr && !h.completed
    ).length;
    if (recentUndone >= HOMEWORK_UNDONE_MIN && recentUndone > priorUndone) {
      reasons.push({
        kind: 'homework-decline',
        label: '학습 리듬 확인',
        detail: `최근 ${HOMEWORK_WINDOW_DAYS}일 숙제 미제출 ${recentUndone}건 (직전 ${HOMEWORK_WINDOW_DAYS}일 ${priorUndone}건 대비 증가)`,
      });
    }
  }

  // [7] target-gap-worsening: 목표 대비 보완 과목 악화 — 목표 미달 + 최근 절반이 이전 절반보다
  // TARGET_GAP_WORSEN_MIN(%p) 이상 하락한 과목 중 가장 많이 하락한 과목 1개만 보고한다.
  const subjectGaps = input.subjectGaps ?? [];
  const worsening = subjectGaps
    .filter((g) => g.gapToTarget > 0 && g.changeVsEarlier !== null && g.changeVsEarlier <= -TARGET_GAP_WORSEN_MIN)
    .sort((a, b) => (a.changeVsEarlier ?? 0) - (b.changeVsEarlier ?? 0))[0];
  if (worsening) {
    reasons.push({
      kind: 'target-gap-worsening',
      label: '확인 필요',
      detail: `${worsening.subject} 목표 대비 ${worsening.gapToTarget}%p 부족 · 최근 ${Math.abs(worsening.changeVsEarlier!)}%p 하락`,
    });
  }

  // [8] no-recent-activity: 테스트 기록이 없거나 최근 기록이 오래됨
  if (!latest) {
    reasons.push({
      kind: 'no-recent-activity',
      label: '학습 리듬 확인',
      detail: '최근 공개된 테스트 기록이 없습니다',
    });
  } else {
    const gap = daysBetween(today, new Date(latest.examDate));
    if (gap >= NO_ACTIVITY_DAYS) {
      reasons.push({
        kind: 'no-recent-activity',
        label: '학습 리듬 확인',
        detail: `최근 테스트 기록 ${gap}일 경과`,
      });
    }
  }

  if (reasons.length === 0) return null;

  // 대표 배지: 우선순위가 가장 높은 이유의 label
  const level =
    LEVEL_ORDER.find((lv) => reasons.some((r) => r.label === lv)) ?? '관찰 필요';

  return {
    studentId: input.studentId,
    studentName: input.studentName,
    level,
    reasons,
    recentChange,
  };
}

/**
 * 여러 학생의 입력을 받아 신호가 있는 학생만 추려서 정렬해 반환한다.
 * 정렬: 대표 배지 우선순위 → 이유 개수 많은 순.
 */
export function collectObservations(inputs: ObservationInput[]): StudentObservation[] {
  const obs = inputs
    .map((i) => computeObservation(i))
    .filter((o): o is StudentObservation => o !== null);

  return obs.sort((a, b) => {
    const la = LEVEL_ORDER.indexOf(a.level);
    const lb = LEVEL_ORDER.indexOf(b.level);
    if (la !== lb) return la - lb;
    return b.reasons.length - a.reasons.length;
  });
}

// 배지 색상(관찰 성격에 맞는 차분한 팔레트 — 경고성 강한 적색 남용 지양)
export const OBSERVATION_LEVEL_STYLE: Record<ObservationLevel, { bg: string; text: string; border: string }> = {
  '흐름 하락': { bg: 'oklch(0.96 0.05 27)', text: 'oklch(0.5 0.18 27)', border: 'oklch(0.88 0.08 27)' },
  '반복 약점': { bg: 'oklch(0.97 0.06 60)', text: 'oklch(0.5 0.14 60)', border: 'oklch(0.9 0.09 60)' },
  '확인 필요': { bg: 'oklch(0.96 0.05 80)', text: 'oklch(0.48 0.12 80)', border: 'oklch(0.9 0.08 80)' },
  '학습 리듬 확인': { bg: 'oklch(0.96 0.03 250)', text: 'oklch(0.45 0.1 250)', border: 'oklch(0.9 0.04 250)' },
  '관찰 필요': { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.45 0.015 250)', border: 'oklch(0.88 0.01 250)' },
};
