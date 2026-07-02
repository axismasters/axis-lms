// AXIS LMS v1.2 — Phase 3D v3-r15: 내신 대비 운영 가이드 엔진(Exam Prep Guide Engine)
//
// ⚠ 절대 규칙(지시서 §3):
//   - AI가 계산하지 않는다. 이 파일은 fetch를 사용하지 않으며, 모든 결과는 아래
//     조건문/산술 연산으로만 결정적으로 계산된다(studentBriefingEngine.ts와 동일한 원칙).
//   - 계산은 AXIS 내부 계산 엔진(이 파일)이 전담한다 — UI(ExamPrepGuidePanel.tsx)는
//     이 파일의 결과를 그대로 표시/편집만 한다.
//
// 설계 메모(회차 날짜 추정): 이 MVP는 반의 실제 수업 요일/휴원일 캘린더를 입력받지 않는다
// (지시서 §4-2 필수 입력값에 없음). 따라서 각 회차의 "예상일"은 오늘~시험일 사이의 남은
// 일수를 남은 회차 수만큼 비례 배분한 근사치다 — 실제 수업일과 다를 수 있으며, 선생님이
// 화면에서 참고용으로만 확인하고 확정 일정은 별도로 관리해야 한다(§ Opinion for Lead
// Developer에 실제 반 시간표 연동을 향후 개선안으로 남긴다).

import { getLocalDateStr } from '@/utils/dateUtils';
import type {
  ExamPrepGuideInput, ExamPrepGuideSchedule, ExamPrepGuideSessionPlanItem,
  ExamPrepGuideHomeworkPlanItem, ExamPrepGuideMilestone, ExamPrepSessionRange, ExamPrepSessionPhase,
} from './examPrepGuideTypes';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ────────────────────────────────────────────────────────────
// 기본 날짜 계산
// ────────────────────────────────────────────────────────────

/** 시험일까지 남은 일수(오늘 기준, 음수면 이미 지난 날짜). 한국 로컬 자정 기준 날짜 문자열끼리 비교한다. */
export function calcDaysUntilExam(examDate: string, fromDate?: string): number {
  const from = new Date(`${fromDate ?? getLocalDateStr()}T00:00:00`);
  const to = new Date(`${examDate}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** 시험일까지 남은 주차(올림 — 예: 9일 남았으면 2주차). 지난 날짜(days<=0)는 0으로 취급한다. */
export function calcWeeksUntilExam(daysUntilExam: number): number {
  if (daysUntilExam <= 0) return 0;
  return Math.ceil(daysUntilExam / 7);
}

/** N회차 중 sessionNo번째 회차의 예상일 — 오늘~시험일 구간을 회차 수만큼 비례 배분한 근사치. */
function estimateSessionDate(sessionNo: number, totalSessions: number, examDate: string, fromDate?: string): string {
  const today = fromDate ?? getLocalDateStr();
  const totalDays = Math.max(calcDaysUntilExam(examDate, today), totalSessions, 1);
  const ratio = totalSessions <= 1 ? 1 : sessionNo / totalSessions;
  const dayOffset = Math.min(totalDays, Math.max(1, Math.round(ratio * totalDays)));
  const base = new Date(`${today}T00:00:00`);
  base.setDate(base.getDate() + dayOffset);
  return getLocalDateStr(base);
}

// ────────────────────────────────────────────────────────────
// 입력값 검증 — §4-2 필수 입력값을 채우지 않으면 자동 생성을 막는다(빈 일정 생성 방지)
// ────────────────────────────────────────────────────────────
export function validateExamPrepGuideInput(input: ExamPrepGuideInput): string[] {
  const errors: string[] = [];
  if (!input.school.trim()) errors.push('학교를 입력해주세요.');
  if (!input.grade.trim()) errors.push('학년을 입력해주세요.');
  if (!input.className.trim()) errors.push('반을 입력해주세요.');
  if (!input.examName.trim()) errors.push('시험명을 입력해주세요.');
  if (!input.examDate.trim()) errors.push('시험일을 입력해주세요.');
  if (!input.examScope.trim()) errors.push('시험범위를 입력해주세요.');
  if (!input.supplementaryBookName.trim()) errors.push('부교재명을 입력해주세요.');
  if (!input.supplementaryBookScope.trim()) errors.push('부교재 범위를 입력해주세요.');
  if (!input.teacherInCharge.trim()) errors.push('담당 선생님을 입력해주세요.');
  if (!input.assessmentMethod.trim()) errors.push('평가 방식을 입력해주세요.');
  if (!input.supplementCriteria.trim()) errors.push('보충 기준을 입력해주세요.');
  if (!Number.isFinite(input.weeklySessionCount) || input.weeklySessionCount < 1) {
    errors.push('주당 수업 횟수는 1 이상이어야 합니다.');
  }
  if (!Number.isFinite(input.actualRemainingSessions) || input.actualRemainingSessions < 1) {
    errors.push('실제 남은 수업 회차는 1 이상이어야 합니다.');
  }
  return errors;
}

// ────────────────────────────────────────────────────────────
// 회차 구간 배분 — 남은 회차(N)를 진도 / 평가 체크포인트 / 실전모의 / 오답보완 / 최종복습으로 나눈다.
// 비율은 고정 상수(피드백에 따라 조정 가능하도록 이 파일 상단에 모아둔다).
// ────────────────────────────────────────────────────────────
const FINAL_REVIEW_RATIO = 0.15;   // 최종 복습: 남은 회차의 약 15%(최소 1회차)
const WRONG_ANSWER_RATIO = 0.10;   // 오답 보완: 약 10%(최소 1회차, 여유가 있을 때만)

interface SessionAllocation {
  progressCount: number;         // 실전모의 이전, 순수 진도+평가 구간 회차 수
  hasMockExam: boolean;
  wrongAnswerCount: number;      // 0이면 별도 배정 없음(진도 구간에 흡수)
  finalReviewCount: number;
  assessmentPositions: number[]; // progress 구간 내 평가 배치 위치(1-indexed, progress 구간 기준)
  warnings: string[];
}

function allocateSessions(totalRemainingSessions: number): SessionAllocation {
  const N = totalRemainingSessions;
  const warnings: string[] = [];

  // 최종 복습은 항상 최소 1회차 확보(시험 직전 총정리 없이 끝나는 일정은 만들지 않는다).
  const finalReviewCount = Math.min(N, Math.max(1, Math.round(N * FINAL_REVIEW_RATIO)));
  let remaining = N - finalReviewCount;

  // 오답 보완 — 실전모의를 볼 여유가 있을 때만 별도 회차를 확보한다.
  let wrongAnswerCount = 0;
  if (remaining >= 2) {
    wrongAnswerCount = Math.min(remaining - 1, Math.max(1, Math.round(N * WRONG_ANSWER_RATIO)));
  } else {
    warnings.push('남은 수업 회차가 부족해 오답 보완 회차를 별도로 확보하지 못했습니다 — 최종 복습 회차에 오답 보완을 포함해 진행해주세요.');
  }
  remaining -= wrongAnswerCount;

  // 실전모의 — 최소 1회차가 남아있을 때만 배정한다.
  const hasMockExam = remaining >= 1;
  if (!hasMockExam) {
    warnings.push('남은 수업 회차가 부족해 실전모의고사 회차를 별도로 확보하지 못했습니다 — 진도 회차 내에서 점검 시간을 확보해주세요.');
  }
  const progressCount = hasMockExam ? remaining - 1 : remaining;

  if (progressCount <= 0) {
    warnings.push('남은 수업 회차가 매우 적어 진도 회차를 별도로 배정하지 못했습니다 — 전체 일정이 매우 압축되어 있으니 반드시 직접 검토해주세요.');
  }

  // 평가(형성평가/단원평가) 체크포인트 — 진도 구간이 충분할 때만 1~2회 배치한다.
  const assessmentPositions: number[] = [];
  if (progressCount >= 3) {
    assessmentPositions.push(Math.max(1, Math.round(progressCount / 2)));
  }
  if (progressCount >= 6) {
    const second = Math.max(assessmentPositions[0] + 1, Math.round(progressCount * 0.8));
    if (second < progressCount) assessmentPositions.push(second);
  }

  return { progressCount, hasMockExam, wrongAnswerCount, finalReviewCount, assessmentPositions, warnings };
}

// ────────────────────────────────────────────────────────────
// 메인 진입점 — 입력값을 받아 일정 전체(ExamPrepGuideSchedule)를 계산한다.
// 호출 전 validateExamPrepGuideInput()으로 필수값을 먼저 확인해야 한다(이 함수는 재검증하지 않는다).
// ────────────────────────────────────────────────────────────
export function generateExamPrepSchedule(input: ExamPrepGuideInput, fromDate?: string): ExamPrepGuideSchedule {
  const today = fromDate ?? getLocalDateStr();
  const daysUntilExam = calcDaysUntilExam(input.examDate, today);
  const weeksUntilExam = calcWeeksUntilExam(daysUntilExam);
  const N = Math.max(0, Math.round(input.actualRemainingSessions));
  const estimatedSessionsByDate = Math.max(0, weeksUntilExam * Math.max(0, Math.round(input.weeklySessionCount)));

  const warnings: string[] = [];
  if (daysUntilExam < 0) {
    warnings.push('시험일이 오늘보다 이전입니다. 시험일을 다시 확인해주세요.');
  }
  if (N > 0 && Math.abs(estimatedSessionsByDate - N) >= 3) {
    warnings.push(
      `날짜·주당 수업 횟수 기준 예상 회차(약 ${estimatedSessionsByDate}회)와 입력한 실제 남은 수업 회차(${N}회)의 차이가 큽니다. 휴원일·보강 일정을 한 번 더 확인해주세요.`
    );
  }

  if (N === 0) {
    return {
      generatedAt: new Date().toISOString(),
      daysUntilExam, weeksUntilExam,
      totalRemainingSessions: 0,
      estimatedSessionsByDate,
      progressPlan: [],
      homeworkPlan: [],
      supplementaryBookTargetDate: null,
      assessmentSessions: [],
      mockExamSession: null,
      wrongAnswerReviewPeriod: null,
      finalReviewPeriod: null,
      milestones: [],
      warnings: ['실제 남은 수업 회차가 0입니다. 1 이상으로 입력해야 세부 일정을 생성할 수 있습니다.', ...warnings],
    };
  }

  const alloc = allocateSessions(N);
  warnings.push(...alloc.warnings);

  const progressPlan: ExamPrepGuideSessionPlanItem[] = [];
  const homeworkPlan: ExamPrepGuideHomeworkPlanItem[] = [];
  const assessmentSessions: number[] = [];
  let sessionNo = 0;

  const pushSession = (phase: ExamPrepSessionPhase, focus: string, homework: string) => {
    sessionNo += 1;
    const estimatedDate = estimateSessionDate(sessionNo, N, input.examDate, today);
    progressPlan.push({ sessionNo, estimatedDate, phase, focus });
    homeworkPlan.push({ sessionNo, description: homework });
    return sessionNo;
  };

  // 1) 진도 구간(+ 그 안에 배치되는 평가 체크포인트)
  for (let i = 1; i <= alloc.progressCount; i += 1) {
    if (alloc.assessmentPositions.includes(i)) {
      const no = pushSession(
        'assessment',
        `형성평가 — 지금까지 진행한 「${input.examScope}」 범위 점검`,
        '형성평가 오답 재풀이 + 다음 진도 예습'
      );
      assessmentSessions.push(no);
    } else {
      pushSession(
        'progress',
        `시험범위 진도 (${i}/${alloc.progressCount}) — 「${input.examScope}」 및 부교재 「${input.supplementaryBookName}」(${input.supplementaryBookScope}) 병행`,
        `해당 회차 진도 범위 문제 풀이 + 부교재 「${input.supplementaryBookName}」 해당 분량`
      );
    }
  }

  // 2) 부교재 완료 목표일 — 진도 구간이 끝나는 시점(=실전모의 직전)으로 설정한다.
  const supplementaryBookTargetDate = alloc.progressCount > 0
    ? estimateSessionDate(alloc.progressCount, N, input.examDate, today)
    : null;

  // 3) 실전모의
  let mockExamSession: number | null = null;
  if (alloc.hasMockExam) {
    mockExamSession = pushSession(
      'mockExam',
      `실전모의고사 시행 — 「${input.examName}」 시험범위(「${input.examScope}」) 전 범위, 평가 방식: ${input.assessmentMethod}`,
      '실전모의고사 응시 준비물 확인 + 시험범위 전체 최종 재점검'
    );
  }

  // 4) 오답 보완 구간
  let wrongAnswerReviewPeriod: ExamPrepSessionRange | null = null;
  if (alloc.wrongAnswerCount > 0) {
    const startNo = sessionNo + 1;
    for (let i = 0; i < alloc.wrongAnswerCount; i += 1) {
      pushSession(
        'wrongAnswerReview',
        `오답 보완 — 실전모의고사 오답 분석 및 재풀이 (보충 기준: ${input.supplementCriteria})`,
        '오답노트 정리 및 동일 유형 문제 재풀이'
      );
    }
    wrongAnswerReviewPeriod = {
      startSessionNo: startNo,
      endSessionNo: sessionNo,
      startDate: progressPlan[startNo - 1].estimatedDate,
      endDate: progressPlan[sessionNo - 1].estimatedDate,
    };
  }

  // 5) 최종 복습 구간
  const finalReviewStart = sessionNo + 1;
  for (let i = 0; i < alloc.finalReviewCount; i += 1) {
    pushSession(
      'finalReview',
      `최종 복습 — 「${input.examScope}」 및 부교재 「${input.supplementaryBookName}」 전체 총정리`,
      '총정리 문제풀이(취약 유형 위주) + 시험 당일 준비물 확인'
    );
  }
  const finalReviewPeriod: ExamPrepSessionRange = {
    startSessionNo: finalReviewStart,
    endSessionNo: sessionNo,
    startDate: progressPlan[finalReviewStart - 1].estimatedDate,
    endDate: progressPlan[sessionNo - 1].estimatedDate,
  };

  // 6) 마일스톤 요약(날짜순 표시용)
  const milestones: ExamPrepGuideMilestone[] = [];
  if (supplementaryBookTargetDate) {
    milestones.push({ label: '부교재 완료 목표일', date: supplementaryBookTargetDate, note: input.supplementaryBookName });
  }
  assessmentSessions.forEach((no, idx) => {
    milestones.push({ label: `평가 배치일 ${assessmentSessions.length > 1 ? idx + 1 : ''}`.trim(), date: progressPlan[no - 1].estimatedDate });
  });
  if (mockExamSession) {
    milestones.push({ label: '실전모의 배치일', date: progressPlan[mockExamSession - 1].estimatedDate });
  }
  if (wrongAnswerReviewPeriod) {
    milestones.push({ label: '오답 보완 시작', date: wrongAnswerReviewPeriod.startDate });
  }
  milestones.push({ label: '최종 복습 시작', date: finalReviewPeriod.startDate });
  milestones.push({ label: '시험일', date: input.examDate });
  milestones.sort((a, b) => a.date.localeCompare(b.date));

  return {
    generatedAt: new Date().toISOString(),
    daysUntilExam, weeksUntilExam,
    totalRemainingSessions: N,
    estimatedSessionsByDate,
    progressPlan, homeworkPlan,
    supplementaryBookTargetDate,
    assessmentSessions,
    mockExamSession,
    wrongAnswerReviewPeriod,
    finalReviewPeriod,
    milestones,
    warnings,
  };
}
