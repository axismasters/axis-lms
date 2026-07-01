// AXIS LMS v1.2 — Phase 3D v3-r4-r1: 학부모 객관 지표 엔진 (parentInsightEngine)
//
// 목적: 학부모 화면(홈/성장 리포트)에 표시할 "객관 지표" 8종을 규칙 기반으로 계산한다.
//   1. 최근 테스트 변화        5. IF 놓친 점수 변화
//   2. 평균 대비 위치          6. 목표 대비 보완 과목
//   3. 출결 안정도             7. 좋아진 지표
//   4. 숙제 수행 흐름          8. 확인할 지점
//
// ⚠ 이 모듈은 AI API를 호출하지 않는다(OpenAI/Claude/Gemini/fetch 등 외부 요약 금지).
// 모든 문구는 이미 계산된 수치(observationSignals.StudentSignalBundle)를 임계값과
// 템플릿 문자열로 조합해서 만든다 — 100% 결정적(deterministic) 규칙 기반이다.
//
// ⚠ 학부모 페이지 헌법 준수:
//   - Rival/Emblem/SP/Tier 등 학생용 게임형 지표는 이 모듈의 어떤 출력에도 포함하지 않는다.
//   - 감정적 경고가 아니라 객관적 지표 중심으로 표현한다.
//   - 금지 표현: 합격률/합격 가능성/합격 보장/안정 합격/불합격. (이 모듈은 애초에 대학
//     추천/합격 관련 데이터를 다루지 않으므로 해당 표현이 등장할 경로 자체가 없다.)
//
// 입력은 observationSignals.ts의 StudentSignalBundle을 그대로 재사용한다 — 신호 산출과
// 객관 지표 계산이 같은 원본 데이터를 쓰기 때문에 두 화면(위험 신호 알림판 / 학부모
// 객관 지표)의 수치가 서로 어긋나지 않는다.

import type { StudentExamResult } from './assessmentData';
import type { StudentSignalBundle } from './observationSignals';
import { getLocalDateStr } from '@/utils/dateUtils';

export type InsightTone = 'positive' | 'neutral' | 'watch';

export interface ParentInsightMetric {
  label: string; // 예: '최근 테스트 변화'
  value: string; // 예: '68% → 74% (▲6%p)'
  tone: InsightTone; // 표시 색상 구분용 — 감정적 경고가 아니라 객관 톤 구분만
}

export interface ParentInsightResult {
  recentTestChange: ParentInsightMetric;
  averagePosition: ParentInsightMetric;
  attendanceStability: ParentInsightMetric;
  homeworkFlow: ParentInsightMetric;
  ifMissedChange: ParentInsightMetric;
  targetGapSubjects: { subject: string; gapToTarget: number; changeVsEarlier: number | null }[];
  improvedPoints: string[]; // 좋아진 지표(문장형)
  checkPoints: string[]; // 확인할 지점(문장형)
}

const ATTENDANCE_WINDOW_DAYS = 30;
const HOMEWORK_WINDOW_DAYS = 14;

function pctOf(r: StudentExamResult): number {
  if (!r.totalPoints) return 0;
  return Math.round((r.earnedScore / r.totalPoints) * 100);
}

function daysAgoStr(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return getLocalDateStr(d);
}

/** 최근 테스트 변화 — 직전 대비 최근 1회 등락. */
function computeRecentTestChange(bundle: StudentSignalBundle): ParentInsightMetric {
  const sorted = [...bundle.results].sort((a, b) => a.examDate.localeCompare(b.examDate));
  if (sorted.length === 0) {
    return { label: '최근 테스트 변화', value: '아직 공개된 테스트 결과가 없습니다', tone: 'neutral' };
  }
  const latest = sorted[sorted.length - 1];
  if (sorted.length === 1) {
    return { label: '최근 테스트 변화', value: `최근 테스트 ${pctOf(latest)}%`, tone: 'neutral' };
  }
  const prev = sorted[sorted.length - 2];
  const diff = pctOf(latest) - pctOf(prev);
  const tone: InsightTone = diff > 0 ? 'positive' : diff < 0 ? 'watch' : 'neutral';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
  return {
    label: '최근 테스트 변화',
    value: `${pctOf(prev)}% → ${pctOf(latest)}% (${arrow}${Math.abs(diff)}%p)`,
    tone,
  };
}

/** 평균 대비 위치 — 직전 시험의 반평균 대비 위치. */
function computeAveragePosition(bundle: StudentSignalBundle): ParentInsightMetric {
  const sorted = [...bundle.results].sort((a, b) => a.examDate.localeCompare(b.examDate));
  const latest = sorted[sorted.length - 1];
  if (!latest || latest.averageScore === undefined) {
    return { label: '평균 대비 위치', value: '비교할 평균 데이터가 없습니다', tone: 'neutral' };
  }
  const diff = Math.round((latest.earnedScore - latest.averageScore) * 10) / 10;
  if (diff > 0) {
    return { label: '평균 대비 위치', value: `반평균보다 ${diff}점 높습니다`, tone: 'positive' };
  }
  if (diff < 0) {
    return { label: '평균 대비 위치', value: `반평균보다 ${Math.abs(diff)}점 낮습니다`, tone: 'watch' };
  }
  return { label: '평균 대비 위치', value: '반평균과 같습니다', tone: 'neutral' };
}

/** 출결 안정도 — 최근 30일 출석률(출석+보강출석 비율). */
function computeAttendanceStability(bundle: StudentSignalBundle, today: Date): ParentInsightMetric {
  const records = bundle.attendanceRecords ?? [];
  const fromStr = daysAgoStr(today, ATTENDANCE_WINDOW_DAYS);
  const recent = records.filter((r) => r.date >= fromStr);
  if (recent.length === 0) {
    return { label: '출결 안정도', value: '최근 30일 출결 기록이 없습니다', tone: 'neutral' };
  }
  const goodCount = recent.filter((r) => r.status === '출석' || r.status === '보강출석').length;
  const rate = Math.round((goodCount / recent.length) * 100);
  const tone: InsightTone = rate >= 90 ? 'positive' : rate >= 75 ? 'neutral' : 'watch';
  return { label: '출결 안정도', value: `최근 30일 출석률 ${rate}%`, tone };
}

/** 숙제 수행 흐름 — 최근 14일 공개 숙제 완료율. */
function computeHomeworkFlow(bundle: StudentSignalBundle, today: Date): ParentInsightMetric {
  const items = bundle.homeworkItems ?? [];
  const fromStr = daysAgoStr(today, HOMEWORK_WINDOW_DAYS);
  const recent = items.filter((h) => h.date >= fromStr);
  if (recent.length === 0) {
    return { label: '숙제 수행 흐름', value: '최근 14일 배정된 숙제가 없습니다', tone: 'neutral' };
  }
  const doneCount = recent.filter((h) => h.completed).length;
  const rate = Math.round((doneCount / recent.length) * 100);
  const tone: InsightTone = rate >= 80 ? 'positive' : rate >= 50 ? 'neutral' : 'watch';
  return { label: '숙제 수행 흐름', value: `최근 14일 완료율 ${rate}%`, tone };
}

/** IF 놓친 점수 변화 — 최근 1건 vs 직전 평균. */
function computeIfMissedChange(bundle: StudentSignalBundle): ParentInsightMetric {
  const complete = bundle.ifRecords
    .filter((r) => r.isComplete)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  if (complete.length === 0) {
    return { label: 'IF 놓친 점수 변화', value: '아직 완료된 IF 회고가 없습니다', tone: 'neutral' };
  }
  if (complete.length === 1) {
    return { label: 'IF 놓친 점수 변화', value: `최근 IF 놓친 점수 ${complete[0].missedPoints}점`, tone: 'neutral' };
  }
  const last = complete[complete.length - 1];
  const prior = complete.slice(0, -1);
  const priorAvg = Math.round((prior.reduce((s, r) => s + r.missedPoints, 0) / prior.length) * 10) / 10;
  const diff = Math.round((last.missedPoints - priorAvg) * 10) / 10;
  const tone: InsightTone = diff > 0 ? 'watch' : diff < 0 ? 'positive' : 'neutral';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
  return {
    label: 'IF 놓친 점수 변화',
    value: `직전 평균 ${priorAvg}점 → 최근 ${last.missedPoints}점 (${arrow}${Math.abs(diff)}점)`,
    tone,
  };
}

/**
 * StudentSignalBundle을 받아 학부모용 객관 지표 8종을 계산한다.
 * 모든 값은 결정적 규칙(임계값 비교)으로만 산출되며, 외부 API 호출이 없다.
 */
export function computeParentInsight(bundle: StudentSignalBundle): ParentInsightResult {
  const today = bundle.today ?? new Date();

  const recentTestChange = computeRecentTestChange(bundle);
  const averagePosition = computeAveragePosition(bundle);
  const attendanceStability = computeAttendanceStability(bundle, today);
  const homeworkFlow = computeHomeworkFlow(bundle, today);
  const ifMissedChange = computeIfMissedChange(bundle);

  const targetGapSubjects = (bundle.subjectGaps ?? [])
    .filter((g) => g.gapToTarget > 0)
    .sort((a, b) => b.gapToTarget - a.gapToTarget)
    .slice(0, 3)
    .map((g) => ({ subject: g.subject, gapToTarget: g.gapToTarget, changeVsEarlier: g.changeVsEarlier }));

  // 좋아진 지표 — positive 톤인 지표들을 사람이 읽는 문장으로 조합한다.
  const improvedPoints: string[] = [];
  if (recentTestChange.tone === 'positive') improvedPoints.push('최근 테스트 점수가 올랐습니다.');
  if (averagePosition.tone === 'positive') improvedPoints.push('반평균보다 높은 점수를 유지하고 있습니다.');
  if (attendanceStability.tone === 'positive') improvedPoints.push('최근 출결이 안정적입니다.');
  if (homeworkFlow.tone === 'positive') improvedPoints.push('숙제 수행률이 좋습니다.');
  if (ifMissedChange.tone === 'positive') improvedPoints.push('IF 놓친 점수가 직전보다 줄었습니다.');
  (bundle.subjectGaps ?? [])
    .filter((g) => g.changeVsEarlier !== null && g.changeVsEarlier! >= 3)
    .forEach((g) => improvedPoints.push(`${g.subject} 성적이 최근 상승했습니다.`));

  // 확인할 지점 — watch 톤 지표 + 목표 미달 과목을 문장으로 조합한다.
  const checkPoints: string[] = [];
  if (recentTestChange.tone === 'watch') checkPoints.push('최근 테스트 점수가 직전보다 내려갔습니다.');
  if (averagePosition.tone === 'watch') checkPoints.push('직전 시험이 반평균보다 낮았습니다.');
  if (attendanceStability.tone === 'watch') checkPoints.push('최근 30일 출결 흐름을 함께 확인해보면 좋겠습니다.');
  if (homeworkFlow.tone === 'watch') checkPoints.push('최근 14일 숙제 수행률이 낮은 편입니다.');
  if (ifMissedChange.tone === 'watch') checkPoints.push('IF 놓친 점수가 직전보다 늘었습니다.');
  if (targetGapSubjects.length > 0) {
    const top = targetGapSubjects[0];
    checkPoints.push(`${top.subject} 과목이 목표 대비 ${top.gapToTarget}%p 부족합니다.`);
  }

  return {
    recentTestChange,
    averagePosition,
    attendanceStability,
    homeworkFlow,
    ifMissedChange,
    targetGapSubjects,
    improvedPoints,
    checkPoints,
  };
}
