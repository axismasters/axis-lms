// AXIS LMS v1.2 — Phase 3D v3-r4-r1: 자동 브리핑 엔진 (studentBriefingEngine)
//
// 목적: 학부모 `상담 전 확인 카드` / 선생님 `담당 학생 빠른 브리핑`에 쓸 문구를
// 테스트/출결/숙제/IF/보완 과목 데이터로부터 규칙 기반 템플릿으로 조합한다.
//
// ⚠ 절대 규칙:
//   - AI API 호출 금지(OpenAI/Claude/Gemini/fetch 기반 AI 요약 금지). 이 파일은 fetch를
//     사용하지 않으며, 모든 문장은 아래 조건문/템플릿 리터럴로만 생성된다.
//   - 선생님 수동 입력창 금지 — 이 엔진의 입력은 전부 이미 시스템에 존재하는 데이터
//     (observationSignals.StudentSignalBundle + parentInsightEngine 결과)뿐이다.
//   - 낙인/압박/불안 조장 문구 금지(parentTalkSuggestion). "위험/문제/경고/탈락/불합격"
//     같은 표현은 사용하지 않으며, 항상 "같이 확인해보자"류의 협력적 어투를 쓴다.
//   - 상담 기록 원문(counselingData.ts)은 이 엔진의 입력으로 사용하지 않는다 — 학부모
//     노출 절대 금지 원칙(PARENT_PAGE_CONSTITUTION.md §5)을 여기서도 그대로 지킨다.
//
// 출력: parentBriefing / teacherBriefing / highlights / checkPoints / parentTalkSuggestion
//       (+ suggestedQuestions: 상담 시 학부모가 물어볼 질문 추천 — 자동 브리핑 카드 구성 요소)

import type { StudentSignalBundle, ObservationReason } from './observationSignals';
import { computeObservation } from './observationSignals';
import type { ParentInsightResult } from './parentInsightEngine';

export interface BriefingResult {
  parentBriefing: string; // 상담 전 확인 카드 본문(학부모용, 문단형)
  teacherBriefing: string; // 담당 학생 빠른 브리핑 본문(선생님용, 문단형·실무 톤)
  highlights: string[]; // 최근 테스트/출결/숙제/보완 과목/IF 요약(짧은 항목 나열)
  checkPoints: string[]; // 확인할 지점(상담 전 체크리스트)
  parentTalkSuggestion: string; // 자녀에게 해줄 말 추천(격려형, 낙인/압박 문구 금지)
  suggestedQuestions: string[]; // 학부모가 상담 때 물어볼 질문 추천
}

function findReason(reasons: ObservationReason[], kind: string): ObservationReason | undefined {
  return reasons.find((r) => r.kind === kind);
}

/**
 * highlights — 최근 테스트 변화/출결/숙제/보완 과목/IF를 한 줄씩 나열한다.
 * insight(parentInsightEngine 결과)를 그대로 재사용해 다른 카드와 수치가 어긋나지 않게 한다.
 */
function buildHighlights(bundle: StudentSignalBundle, insight: ParentInsightResult): string[] {
  const list: string[] = [
    insight.recentTestChange.value,
    `출결 · ${insight.attendanceStability.value}`,
    `숙제 · ${insight.homeworkFlow.value}`,
  ];
  if (insight.targetGapSubjects.length > 0) {
    const top = insight.targetGapSubjects[0];
    list.push(`보완 과목 · ${top.subject}(목표 대비 ${top.gapToTarget}%p 부족)`);
  }
  if (!insight.ifMissedChange.value.includes('없습니다')) {
    list.push(`IF · ${insight.ifMissedChange.value}`);
  }
  return list;
}

/** parentBriefing — 학부모가 상담 전에 읽는 문단형 요약. 협력적·차분한 톤. */
function buildParentBriefing(insight: ParentInsightResult): string {
  const parts: string[] = [];
  parts.push(`최근 테스트는 ${insight.recentTestChange.value}이고, ${insight.averagePosition.value}.`);
  parts.push(`최근 출결은 ${insight.attendanceStability.value.replace('최근 30일 ', '')}이며, 숙제는 ${insight.homeworkFlow.value.replace('최근 14일 ', '')}입니다.`);
  if (insight.targetGapSubjects.length > 0) {
    const top = insight.targetGapSubjects[0];
    parts.push(`${top.subject} 과목은 목표 대비 ${top.gapToTarget}%p 부족해 조금 더 챙겨보면 좋겠습니다.`);
  }
  if (!insight.ifMissedChange.value.includes('없습니다')) {
    parts.push(`IF 회고 기준 ${insight.ifMissedChange.value}입니다.`);
  }
  return parts.join(' ');
}

/** teacherBriefing — 선생님이 빠르게 훑을 수 있는 실무 톤 요약(간결, 액션 중심). */
function buildTeacherBriefing(insight: ParentInsightResult, reasons: ObservationReason[]): string {
  const parts: string[] = [];
  parts.push(insight.recentTestChange.value + (insight.averagePosition.value.includes('없') ? '' : ` · ${insight.averagePosition.value}`));
  parts.push(insight.attendanceStability.value);
  parts.push(insight.homeworkFlow.value);
  if (insight.targetGapSubjects.length > 0) {
    const top = insight.targetGapSubjects[0];
    parts.push(`${top.subject} 목표 대비 ${top.gapToTarget}%p 부족${top.changeVsEarlier !== null && top.changeVsEarlier < 0 ? ' — 이번 주 보강 검토' : ''}`);
  }
  const ifReason = findReason(reasons, 'if-missed-up');
  if (ifReason) parts.push(ifReason.detail);
  return parts.join(' · ') + '.';
}

/**
 * parentTalkSuggestion — 감지된 신호의 우선순위에 따라 격려형 문구 1개를 고른다.
 * 우선순위: 테스트 하락 > IF 놓친 점수 증가 > 출결 흔들림 > 숙제 흐름 저하 > 상승(칭찬) > 기본.
 * 낙인/압박/불안 조장 표현은 쓰지 않고, 항상 "같이 확인/해보자" 톤을 유지한다.
 */
function buildParentTalkSuggestion(reasons: ObservationReason[], insight: ParentInsightResult): string {
  if (findReason(reasons, 'test-decline') || findReason(reasons, 'repeat-weak') || findReason(reasons, 'below-average')) {
    return '요즘 시험이 조금 힘들었을 수 있어. 어디가 어려웠는지 같이 확인해볼까?';
  }
  if (findReason(reasons, 'if-missed-up')) {
    return '실수했던 부분들을 같이 짚어보면서 줄이는 방법을 찾아보자.';
  }
  if (findReason(reasons, 'attendance-decline')) {
    return '이번 주부터 다시 수업 리듬 잡아보자!';
  }
  if (findReason(reasons, 'homework-decline')) {
    return '요즘 숙제가 조금 밀렸구나. 이번 주는 계획을 같이 세워서 하나씩 해보자.';
  }
  if (findReason(reasons, 'target-gap-worsening')) {
    return '요즘 보완이 필요한 과목이 있는데, 어떤 부분이 어려운지 같이 얘기해볼까?';
  }
  if (insight.recentTestChange.tone === 'positive' || insight.homeworkFlow.tone === 'positive' || insight.attendanceStability.tone === 'positive') {
    return '요즘 좋아진 습관들, 잘 하고 있어! 계속 이 페이스로 가보자.';
  }
  return '요즘 꾸준히 하고 있는 모습이 보기 좋아. 계속 이 페이스로 가보자!';
}

/** suggestedQuestions — 상담 시 학부모가 물어볼 질문 추천(감지된 신호 기반, 최대 3개). */
function buildSuggestedQuestions(reasons: ObservationReason[], insight: ParentInsightResult): string[] {
  const qs: string[] = [];
  if (insight.targetGapSubjects.length > 0) {
    qs.push(`${insight.targetGapSubjects[0].subject} 수업은 요즘 어떻게 진행되고 있나요?`);
  }
  if (findReason(reasons, 'attendance-decline')) {
    qs.push('최근 출결에 영향을 준 특별한 사정이 있었을까요?');
  }
  if (findReason(reasons, 'homework-decline')) {
    qs.push('숙제 수행에 어려움이 있다면 어떤 부분인지 여쭤봐도 될까요?');
  }
  if (findReason(reasons, 'if-missed-up')) {
    qs.push('오답 회고(IF)에서 반복되는 실수 유형이 있을까요?');
  }
  if (qs.length === 0) {
    qs.push('요즘 학원 수업에서 어려워하는 부분이 있을까요?');
  }
  return qs.slice(0, 3);
}

/** checkPoints — parentInsightEngine의 확인할 지점을 그대로 재사용(중복 계산 방지). */
function buildCheckPoints(insight: ParentInsightResult): string[] {
  return insight.checkPoints.length > 0
    ? insight.checkPoints
    : ['특별히 확인이 필요한 지점은 없습니다. 지금의 흐름을 유지하면 좋겠습니다.'];
}

/**
 * StudentSignalBundle + parentInsightEngine 결과를 받아 브리핑 5+1종을 계산한다.
 * AI API를 호출하지 않으며, 모든 문장은 규칙 기반 템플릿으로만 조합된다.
 */
export function computeBriefing(bundle: StudentSignalBundle, insight: ParentInsightResult): BriefingResult {
  const observation = computeObservation(bundle);
  const reasons = observation?.reasons ?? [];

  return {
    parentBriefing: buildParentBriefing(insight),
    teacherBriefing: buildTeacherBriefing(insight, reasons),
    highlights: buildHighlights(bundle, insight),
    checkPoints: buildCheckPoints(insight),
    parentTalkSuggestion: buildParentTalkSuggestion(reasons, insight),
    suggestedQuestions: buildSuggestedQuestions(reasons, insight),
  };
}
