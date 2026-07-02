// AXIS LMS v1.2 — Phase 3E v3-r16-r3: 대학추천 신뢰도 엔진
//
// [Phase 3E v3-r16-r3] "대학추천 신뢰도 향상" 지시서 §4에 따라 신설.
//
// ⚠ 이 파일은 axis-university-analysis-engine-phase5.1(Phase 6.1에서 참고했던 첨부
//   기준자료)의 dataConfidence(A/B/C) "개념"만 다시 가져왔다 — 그 엔진의 등급은
//   "대학 입시 자료의 출처 품질"(공식 입결/보정 자료/샘플 데이터)을 뜻했지만, 이
//   프로젝트에는 대학 DB 자체가 없다. 그래서 여기서는 같은 A/B/C(+D) 등급 표기 방식만
//   빌려오고, 실제로 등급을 매기는 대상은 완전히 다르다 — "지금까지 선생님이 입력한
//   내신/모의고사/수능실전 데이터가 상담에서 얼마나 참고할 만한가"이다. 대학 tier
//   분류·cut50 비교·mockUniversities 같은 대학 DB 구조는 이 파일에 전혀 없다.
//
// ⚠ 절대 금지 (지시서 §5 그대로):
//   - 합격률/합격 가능성/안정합격/불합격/컷 통과 표현 금지
//   - 배치표 원점수/표준점수/백분위 컷을 이 파일이 UI에 표시하도록 강제하지 않는다
//     (이 파일은 계산만 하고, 화면 표시 방식은 각 페이지가 결정한다 — 화면 쪽에서도
//     원점수/컷을 노출하지 않는다)
//   - 대교협/시행계획/배치표 등 원자료명을 문구에 넣지 않는다
//   - 실제 컷/기준을 임의로 만들지 않는다 — 이 파일은 "선생님이 입력한 데이터의 양과
//     구성"만 보고 판단하며, 어떤 외부 입시 기준값도 참조하지 않는다
//
// 순수 함수만 존재한다 — localStorage 접근, API 호출, React 없음.
// 입력은 오직 universityPayloadAdapter.ts가 만든 UniversityRecommendationFullPayload뿐이다.

import type { UniversityRecommendationFullPayload } from './universityPayloadAdapter';

// ────────────────────────────────────────────────────────────
// 공통 색상 토큰 — 기존 lib 파일들과 동일한 팔레트를 그대로 사용한다.
// (AXIS_GOLD/AXIS_NAVY는 브랜드 색으로 제한적으로만 쓰고, 상태 표현은 기존
//  universityPayloadAdapter.ts/universityCounselingSummary.ts가 써온 oklch 값을 재사용 —
//  강한 빨강 대신 amber를 "보완 필요"에 쓰는 기존 관례를 따른다)
// ────────────────────────────────────────────────────────────
const COLOR_GOOD = 'oklch(0.45 0.15 145)';   // 초록 — 충분/안정
const COLOR_OK = 'oklch(0.5 0.14 150)';      // 연초록 — 양호
const COLOR_AMBER = 'oklch(0.55 0.15 80)';   // 호박색 — 보통/보완 필요
const COLOR_NEUTRAL = 'oklch(0.55 0.015 250)'; // 중립 회색 — 데이터 부족(경고색 아님)

// ────────────────────────────────────────────────────────────
// 1) 데이터 신뢰도 등급 산출
// ────────────────────────────────────────────────────────────
export type ReliabilityGrade = 'A' | 'B' | 'C' | 'D';

export interface ReliabilityGradeResult {
  grade: ReliabilityGrade;
  /** 4단계 한글 라벨 — 화면에는 이 라벨만 노출하고 내부 score는 노출하지 않는다. */
  label: string;
  color: string;
  /** 선생님/관리자용 근거 포함 설명 문장. */
  description: string;
  /** 0~100 내부 산출 점수 — UI에 직접 숫자로 노출하지 않는 것을 원칙으로 한다
   *  (지시서 §5 "숫자 과다 노출 금지"). 필요 시 관리자 화면에서만 참고용으로 쓸 수 있다. */
  internalScore: number;
}

function gradeFromScore(score: number): { grade: ReliabilityGrade; label: string; color: string } {
  if (score >= 80) return { grade: 'A', label: '신뢰도 높음', color: COLOR_GOOD };
  if (score >= 55) return { grade: 'B', label: '신뢰도 양호', color: COLOR_OK };
  if (score >= 25) return { grade: 'C', label: '신뢰도 보통', color: COLOR_AMBER };
  return { grade: 'D', label: '신뢰도 낮음', color: COLOR_NEUTRAL };
}

// ────────────────────────────────────────────────────────────
// 2) 내신/모의고사/수능실전 데이터 균형 평가
// ────────────────────────────────────────────────────────────
export type DataAxisKey = 'internal' | 'mock' | 'suneung';

export interface DataBalanceAxis {
  key: DataAxisKey;
  label: string;
  count: number;
  level: 'thin' | 'adequate' | 'strong'; // 얇음 / 적정 / 충분
}

export interface DataBalanceAssessment {
  /** 학년에 따라 2~3개(고1/고2는 수능실전 축 자체가 적용되지 않아 제외). */
  axes: DataBalanceAxis[];
  balanced: boolean;
  dominantAxis: DataAxisKey | null;
  /** 균형 상태에 대한 1문장 설명(선생님/관리자용). */
  note: string;
}

function axisLevel(count: number): DataBalanceAxis['level'] {
  if (count === 0) return 'thin';
  if (count <= 2) return 'adequate';
  return 'strong';
}

export function buildDataBalanceAssessment(
  payload: UniversityRecommendationFullPayload,
): DataBalanceAssessment {
  const isGrade3 = payload.gradeLevel === '고3';

  const axes: DataBalanceAxis[] = [
    { key: 'internal', label: '내신', count: payload.internalGrades.length, level: axisLevel(payload.internalGrades.length) },
    { key: 'mock', label: '전국연합모의고사', count: payload.mockExamRecords.length, level: axisLevel(payload.mockExamRecords.length) },
    ...(isGrade3
      ? [{ key: 'suneung' as const, label: '수능실전모의고사', count: payload.suneungMockRecords.length, level: axisLevel(payload.suneungMockRecords.length) }]
      : []),
  ];

  const populated = axes.filter((a) => a.count > 0);
  const thin = axes.filter((a) => a.level === 'thin');
  const strong = axes.filter((a) => a.level === 'strong');

  // 균형 판단: 데이터가 있는 축이 하나뿐이고 나머지가 전부 비어 있으면 "치우침"으로 본다.
  const dominantAxis = populated.length === 1 && thin.length === axes.length - 1
    ? populated[0].key
    : null;
  const balanced = dominantAxis === null && thin.length <= 1;

  let note: string;
  if (populated.length === 0) {
    note = '아직 입력된 데이터가 없어 균형을 판단할 수 없습니다.';
  } else if (dominantAxis !== null) {
    const dominantLabel = axes.find((a) => a.key === dominantAxis)?.label ?? '';
    note = `현재는 ${dominantLabel} 데이터에 편중되어 있습니다. 다른 영역 데이터가 더해지면 상담 참고도가 높아집니다.`;
  } else if (balanced && strong.length === axes.length) {
    note = '내신·모의고사 데이터가 고르게 충분히 쌓여 있습니다.';
  } else if (balanced) {
    note = '내신·모의고사 데이터가 큰 편중 없이 준비되어 있습니다.';
  } else {
    note = '일부 영역의 데이터가 아직 부족합니다. 아래 확인 항목을 참고하세요.';
  }

  return { axes, balanced, dominantAxis, note };
}

// ────────────────────────────────────────────────────────────
// 3) 고3 수능실전 누적 회차 신뢰도 평가
// ────────────────────────────────────────────────────────────
export interface SuneungCumulativeReliability {
  /** 고3이 아니면 false — 다른 화면에서 이 블록 자체를 숨기는 데 사용. */
  applicable: boolean;
  rounds: number;
  level: 'insufficient' | 'building' | 'stable'; // 부족 / 축적 중 / 안정적 누적
  label: string;
  note: string;
}

// 기존 University Recommendation Readiness Foundation v1(assessmentData.ts)이 이미
// 1회/2회/3회 기준을 상담 UX 전반에서 쓰고 있어 — 같은 기준을 그대로 재사용한다
// (새 임계값을 임의로 만들지 않는다).
export function buildSuneungCumulativeReliability(
  payload: UniversityRecommendationFullPayload,
): SuneungCumulativeReliability {
  const isGrade3 = payload.gradeLevel === '고3';
  const rounds = payload.suneungMockRecords.length;

  if (!isGrade3) {
    return {
      applicable: false, rounds: 0, level: 'insufficient',
      label: '해당 없음',
      note: '수능실전모의고사 누적은 고3 상담에서만 적용됩니다.',
    };
  }

  if (rounds === 0) {
    return {
      applicable: true, rounds, level: 'insufficient',
      label: '누적 부족',
      note: '수능실전모의고사 결과가 아직 없습니다. 1회 이상 입력되면 참고할 수 있습니다.',
    };
  }
  if (rounds < 3) {
    return {
      applicable: true, rounds, level: 'building',
      label: '누적 축적 중',
      note: `현재 ${rounds}회 누적되었습니다. 3회 이상 쌓이면 추이를 더 안정적으로 참고할 수 있습니다.`,
    };
  }
  return {
    applicable: true, rounds, level: 'stable',
    label: '안정적 누적',
    note: `${rounds}회 누적되어 추이 흐름을 참고하기에 충분한 회차입니다.`,
  };
}

// ────────────────────────────────────────────────────────────
// 4) 상담 시 추가 입력이 필요한 항목 추출
// ────────────────────────────────────────────────────────────
export interface CounselingInputGapItem {
  key: string;
  label: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export function getCounselingInputGaps(
  payload: UniversityRecommendationFullPayload,
): CounselingInputGapItem[] {
  const gaps: CounselingInputGapItem[] = [];
  const isGrade3 = payload.gradeLevel === '고3';
  const { hasInternalGrades, hasMockExams, hasSuneungMocks } = payload.dataCompleteness;
  const suneungRounds = payload.suneungMockRecords.length;

  if (!hasInternalGrades) {
    gaps.push({
      key: 'internal-missing',
      label: '내신 성적 입력',
      reason: '내신 성적이 아직 입력되지 않았습니다.',
      priority: 'high',
    });
  }
  if (!hasMockExams) {
    gaps.push({
      key: 'mock-missing',
      label: '전국연합모의고사 성적 입력',
      reason: '전국연합모의고사 성적이 아직 입력되지 않았습니다.',
      priority: isGrade3 ? 'medium' : 'high',
    });
  }
  if (isGrade3 && !hasSuneungMocks) {
    gaps.push({
      key: 'suneung-missing',
      label: '수능실전모의고사 성적 입력',
      reason: '고3 상담에는 수능실전모의고사 성적이 특히 중요합니다.',
      priority: 'high',
    });
  } else if (isGrade3 && suneungRounds > 0 && suneungRounds < 3) {
    gaps.push({
      key: 'suneung-more-rounds',
      label: '수능실전모의고사 추가 회차 입력',
      reason: `현재 ${suneungRounds}회 누적 — 3회 이상이면 추이 참고가 더 안정적입니다.`,
      priority: 'medium',
    });
  }

  const balance = buildDataBalanceAssessment(payload);
  if (balance.dominantAxis !== null) {
    const dominantLabel = balance.axes.find((a) => a.key === balance.dominantAxis)?.label ?? '';
    gaps.push({
      key: 'balance-skewed',
      label: `${dominantLabel} 외 데이터 보강`,
      reason: '한 영역에만 데이터가 몰려 있어 다른 영역이 함께 입력되면 상담 참고도가 높아집니다.',
      priority: 'low',
    });
  }

  const priorityOrder: Record<CounselingInputGapItem['priority'], number> = { high: 0, medium: 1, low: 2 };
  return gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ────────────────────────────────────────────────────────────
// 5) 종합 — 신뢰도 등급 산출 + 화면별 설명 문장
// ────────────────────────────────────────────────────────────
export interface UniversityReliabilityAssessment {
  grade: ReliabilityGradeResult;
  balance: DataBalanceAssessment;
  suneungCumulative: SuneungCumulativeReliability;
  inputGaps: CounselingInputGapItem[];
  /** 학생 화면용 — 아주 짧은 한 문장. 불안 조장·합격/불합격 뉘앙스 없음. */
  studentMessage: string;
  /** 학부모 화면용 — 설명형 문장(숫자 나열 없음, "상담 참고도" 표현). */
  parentMessage: string;
  /** 선생님/관리자 화면용 — 근거를 포함한 한 줄 요약. */
  teacherHeadline: string;
}

/**
 * 데이터 신뢰도 점수 산출 — 순수 계산.
 * 고3은 내신(30)·전국연합(30)·수능실전(40) 3축 100점 만점,
 * 고1/2는 수능실전 축이 적용되지 않으므로 내신(30)·전국연합(30) 60점 만점을 100점으로 환산한다.
 * 편중(dominantAxis)이 있으면 10점을 감점한다.
 */
function computeReliabilityScore(
  payload: UniversityRecommendationFullPayload,
  suneung: SuneungCumulativeReliability,
  balance: DataBalanceAssessment,
): number {
  const isGrade3 = payload.gradeLevel === '고3';
  let raw = 0;

  if (payload.dataCompleteness.hasInternalGrades) raw += 30;

  const mockCount = payload.mockExamRecords.length;
  if (mockCount >= 3) raw += 30;
  else if (mockCount >= 1) raw += 18;

  if (isGrade3) {
    if (suneung.level === 'stable') raw += 40;
    else if (suneung.level === 'building') raw += 20;
  }

  const maxRaw = isGrade3 ? 100 : 60;
  const normalized = Math.round((raw / maxRaw) * 100);
  const balancePenalty = balance.dominantAxis !== null ? 10 : 0;

  return Math.max(0, Math.min(100, normalized - balancePenalty));
}

function buildReliabilityGrade(
  payload: UniversityRecommendationFullPayload,
  suneung: SuneungCumulativeReliability,
  balance: DataBalanceAssessment,
): ReliabilityGradeResult {
  const score = computeReliabilityScore(payload, suneung, balance);
  const { grade, label, color } = gradeFromScore(score);

  const isGrade3 = payload.gradeLevel === '고3';
  const parts: string[] = [];
  parts.push(payload.dataCompleteness.hasInternalGrades ? '내신 데이터 확인됨' : '내신 데이터 없음');
  parts.push(payload.mockExamRecords.length > 0 ? `전국연합모의고사 ${payload.mockExamRecords.length}회` : '전국연합모의고사 없음');
  if (isGrade3) {
    parts.push(suneung.rounds > 0 ? `수능실전모의고사 ${suneung.rounds}회 누적` : '수능실전모의고사 없음');
  }

  return {
    grade, label, color, internalScore: score,
    description: `${parts.join(' · ')}을 근거로 산출된 신뢰도입니다(${label}). 상담 전 참고 지표이며, 실제 대학 결과를 대신하지 않습니다.`,
  };
}

function buildStudentMessage(gradeResult: ReliabilityGradeResult): string {
  switch (gradeResult.grade) {
    case 'A':
    case 'B':
      return '지금까지 쌓인 성적을 바탕으로 충분히 참고할 수 있는 분석이에요.';
    case 'C':
      return '아직은 참고 정도로만 봐주세요. 성적이 더 쌓이면 더 정확해져요.';
    default:
      return '아직 데이터가 많지 않아요. 성적이 입력되면 분석이 채워질 거예요.';
  }
}

function buildParentMessage(
  gradeResult: ReliabilityGradeResult,
  balance: DataBalanceAssessment,
  suneung: SuneungCumulativeReliability,
): string {
  const base = (() => {
    switch (gradeResult.grade) {
      case 'A': return '현재까지 입력된 내신·모의고사 데이터가 고르게 쌓여 있어, 상담 참고도가 높은 편입니다.';
      case 'B': return '현재까지 입력된 데이터로 상담을 참고하기에 무리가 없는 수준입니다.';
      case 'C': return '현재까지 입력된 데이터가 아직 제한적이라, 상담 시 참고 자료로만 활용하는 것을 권장드립니다.';
      default:  return '아직 입력된 데이터가 많지 않아, 성적이 더 쌓인 뒤 상담 참고도가 높아질 예정입니다.';
    }
  })();
  if (suneung.applicable && suneung.level === 'building') {
    return `${base} 수능실전모의고사 회차가 더 쌓이면 참고도가 한층 높아집니다.`;
  }
  if (balance.dominantAxis !== null) {
    return `${base} 다른 영역의 성적도 함께 쌓이면 더 균형 잡힌 상담이 가능합니다.`;
  }
  return base;
}

function buildTeacherHeadline(
  gradeResult: ReliabilityGradeResult,
  gaps: CounselingInputGapItem[],
): string {
  if (gaps.length === 0) {
    return `${gradeResult.label} — 상담 전 추가로 확인할 데이터가 없습니다.`;
  }
  const highGaps = gaps.filter((g) => g.priority === 'high');
  const target = highGaps.length > 0 ? highGaps : gaps;
  const labels = target.slice(0, 2).map((g) => g.label).join(', ');
  return `${gradeResult.label} — 상담 전 확인: ${labels}${target.length > 2 ? ' 외' : ''}`;
}

/**
 * buildUniversityReliabilityAssessment — 종합 빌더.
 * universityCounselingSummary.ts가 기존 반환 구조를 유지한 채 확장 필드로 이 결과를
 * 그대로 붙인다(§ 지시서 5번).
 */
export function buildUniversityReliabilityAssessment(
  payload: UniversityRecommendationFullPayload,
): UniversityReliabilityAssessment {
  const balance = buildDataBalanceAssessment(payload);
  const suneungCumulative = buildSuneungCumulativeReliability(payload);
  const grade = buildReliabilityGrade(payload, suneungCumulative, balance);
  const inputGaps = getCounselingInputGaps(payload);

  return {
    grade,
    balance,
    suneungCumulative,
    inputGaps,
    studentMessage: buildStudentMessage(grade),
    parentMessage: buildParentMessage(grade, balance, suneungCumulative),
    teacherHeadline: buildTeacherHeadline(grade, inputGaps),
  };
}
