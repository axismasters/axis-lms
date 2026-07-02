// AXIS LMS v1.2 — Phase 3E v3-r16-r2: 대학추천 상담 요약 엔진
//
// [Phase 3E v3-r16-r3] reliability 확장 필드 추가 — universityReliabilityEngine.ts(신규,
// 순수 계산 함수)의 결과를 UniversityCounselingSummary에 그대로 붙였다. 기존 6가지
// 요약 항목(dataReadiness/fitScore/currentPosition/topWeakSubjects/mathScenario/
// internalGradeScenario/dataGaps/oneLiner)의 계산 로직과 반환값은 전혀 바뀌지 않았다.
//
// [Phase 3E v3-r16-r2] 대학추천 상담 요약 엔진 고도화.
//
// ⚠ 이 파일은 axis-university-analysis-engine-phase5.1(첨부 기준자료)과
//   AXIS_LMS_INTEGRATION_PLAN_PHASE6_0_1.md(첨부 통합 계획서)를 검토한 뒤 작성했다.
//   두 문서 모두 "Phase 6.1"에서 실제 대학 DB·목표대학 분석 API를 LMS에 연결하는
//   훨씬 큰 계획(신규 모달/신규 RBAC 권한/대학명 25개 샘플 DB/독립 엔진 코드 복사)을
//   설명하지만, 이번 v3-r16-r2 지시서는 그중 아주 좁은 부분만 요청한다 — "새 대학추천
//   로직을 상상해서 만드는 게 아니라 기준자료를 참고해서 현재 LMS에 연결"하되, 대상은
//   university 이름이 전혀 필요 없는 6가지 상담 요약 항목뿐이다(§ 지시서 3번). 그래서:
//     - src/lib/universityAnalysis/(격리 폴더), types.ts, mockAnalysisEngine.ts,
//       lmsPayloadBuilder.ts, mockUniversities.ts(대학 25개 샘플 DB)는 만들지 않았다.
//     - 'universityAnalysis.view' RBAC 권한, [목표대학 분석 시작] 버튼, 새 모달
//       컴포넌트도 만들지 않았다 — 전부 Phase 6.1의 훨씬 큰 스코프이지 이번 지시서
//       범위가 아니다(§ 지시서 5번 "Phase 5.1 독립 엔진을 LMS 전체에 덮어쓰기 금지").
//   대신 기준자료에서 "대학명 없이도 성립하는" 계산 개념만 가져왔다:
//     - scoreNormalizer.ts의 백분위 구간 라벨(최상위권/상위권/…/하위권) 6단계 — 국내
//       수능 등급컷 통계에 기반한 공개적인 구간 정의라 대학 정보와 무관하다.
//     - simulationEngine.ts의 등급→백분위 중앙값 lookup(gradeToMidPercentile) — 마찬가지로
//       공개된 수능 등급별 누적 비율 통계이며, 특정 대학 커트라인과 무관하다.
//     - simulationEngine.ts의 "수학 등급 1단계 향상" 시나리오 계산 방식(등급 상승 시
//       백분위 증가폭을 lookup으로 추정) — 이 계산은 university cutoff 없이도 성립한다.
//     - reportGenerator.ts의 상담 코멘트 생성 패턴(강점/약점 과목, 학년별 상담 방향) —
//       텍스트 조합 방식만 참고하고, 실제 문구는 이 프로젝트의 금지 표현 규정에 맞게
//       전부 새로 썼다.
//   대학 tier 분류(상향목표/적정목표/안정목표/기본확보권)나 목표 대학 목록, cut50 비교
//   같은 "특정 대학 대비 위치" 계산은 전혀 가져오지 않았다 — 그건 실제 대학 DB가
//   있어야 계산할 수 있고, 이 프로젝트는 대학명/합격 가능성을 계산하지 않는다.
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격/안정 합격 표현 금지.
// ⚠ "현재 위치"는 학생 자신의 국가 단위 시험 백분위/등급을 그대로 보여주는 것이며,
//   특정 대학 합격 여부와는 무관하다 — 이 파일은 그 경계를 넘지 않는다.

import type { UniversityRecommendationFullPayload } from './universityPayloadAdapter';
import { getRecommendationFitScore, getSubjectImprovementNeeds, type FitLabel, type SubjectImprovementNeed } from './universityPayloadAdapter';
// [Phase 3E v3-r16-r3] 대학추천 신뢰도 엔진 연결 — 순수 계산 함수만 있는 신규 파일.
// 기존 6가지 상담 요약 항목은 전혀 건드리지 않고, UniversityCounselingSummary에
// reliability라는 확장 필드 1개만 추가한다(§ 지시서 5번 "기존 반환 구조를 깨지 말고").
import { buildUniversityReliabilityAssessment, type UniversityReliabilityAssessment } from './universityReliabilityEngine';

// ────────────────────────────────────────────────────────────
// 공개된 수능 등급-백분위 통계 기반 lookup (특정 대학과 무관)
// ────────────────────────────────────────────────────────────

/** 등급(1~9) → 등급 구간 중앙값 백분위 근사치. 9등급 상대평가 누적 비율 기준. */
const GRADE_TO_PERCENTILE_MID: Record<number, number> = {
  1: 97, 2: 92, 3: 82, 4: 68, 5: 50, 6: 35, 7: 22, 8: 12, 9: 4,
};

function gradeToPercentileMid(grade: number): number {
  const g = Math.max(1, Math.min(9, Math.round(grade)));
  return GRADE_TO_PERCENTILE_MID[g];
}

/** 백분위 → 6단계 위치 라벨. */
function positionLabel(pct: number): string {
  if (pct >= 95) return '최상위권';
  if (pct >= 88) return '상위권';
  if (pct >= 77) return '중상위권';
  if (pct >= 60) return '중위권';
  if (pct >= 40) return '중하위권';
  return '하위권';
}

// ────────────────────────────────────────────────────────────
// 1) 데이터 준비 상태
// ────────────────────────────────────────────────────────────
export type CounselingDataStatus = 'not-ready' | 'partial' | 'ready';

export interface CounselingDataReadiness {
  status: CounselingDataStatus;
  label: string;
  color: string;
  description: string;
}

function buildDataReadiness(payload: UniversityRecommendationFullPayload): CounselingDataReadiness {
  const { hasInternalGrades, hasMockExams, hasSuneungMocks, readyForAnalysis } = payload.dataCompleteness;
  const isGrade3 = payload.gradeLevel === '고3';

  if (!hasInternalGrades && !hasMockExams && !hasSuneungMocks) {
    return {
      status: 'not-ready',
      label: '데이터 준비 중',
      color: 'oklch(0.55 0.015 250)',
      description: '내신 또는 모의고사 성적이 아직 입력되지 않았습니다. 입력이 필요합니다.',
    };
  }
  if (!readyForAnalysis) {
    return {
      status: 'partial',
      label: '데이터 일부 준비',
      color: 'oklch(0.55 0.15 80)',
      description: isGrade3
        ? '수능실전모의고사 데이터가 더 쌓이면 분석 정확도가 높아집니다.'
        : '내신 또는 모의고사 성적이 더 쌓이면 분석 정확도가 높아집니다.',
    };
  }
  return {
    status: 'ready',
    label: '분석 가능',
    color: 'oklch(0.45 0.15 145)',
    description: '현재까지 입력된 성적으로 상담 요약을 확인할 수 있습니다.',
  };
}

// ────────────────────────────────────────────────────────────
// 2) 현재 위치 요약 (특정 대학과 무관 — 학생 자신의 전국 단위 백분위/등급 위치)
// ────────────────────────────────────────────────────────────
export interface CurrentPositionSummary {
  available: boolean;
  estimatedPercentile: number | null;
  label: string;
  source: 'mock' | 'internal' | null; // 어떤 데이터 기준으로 추정했는지
  summary: string;
}

function buildCurrentPosition(payload: UniversityRecommendationFullPayload): CurrentPositionSummary {
  const latestMock = payload.mockExamRecords[0] ?? payload.suneungMockRecords[0];
  const korPct = latestMock?.korean.pct;
  const mathPct = latestMock?.math.pct;

  if (korPct !== undefined && mathPct !== undefined) {
    const engGrade = latestMock?.english.grade;
    const engPct = engGrade !== undefined ? gradeToPercentileMid(engGrade) : undefined;
    const parts = [korPct, mathPct, ...(engPct !== undefined ? [engPct] : [])];
    const avgPct = Math.round(parts.reduce((s, v) => s + v, 0) / parts.length);
    const label = positionLabel(avgPct);
    return {
      available: true,
      estimatedPercentile: avgPct,
      label,
      source: 'mock',
      summary: `모의고사 성적 기준으로 전국 상위 약 ${100 - avgPct}% 수준(${label})입니다.`,
    };
  }

  const avgInternal = payload.dataCompleteness.weightedInternalGradeAvg;
  if (avgInternal !== undefined) {
    const estPct = gradeToPercentileMid(avgInternal);
    const label = positionLabel(estPct);
    return {
      available: true,
      estimatedPercentile: estPct,
      label,
      source: 'internal',
      summary: `내신 평균(${avgInternal.toFixed(2)}등급) 기준으로 ${label} 수준으로 추정됩니다. 모의고사 성적이 입력되면 더 정확해집니다.`,
    };
  }

  return {
    available: false,
    estimatedPercentile: null,
    label: '데이터 부족',
    source: null,
    summary: '아직 입력된 성적이 없어 현재 위치를 확인할 수 없습니다.',
  };
}

// ────────────────────────────────────────────────────────────
// 3) 수학 등급 상승 시나리오 (등급→백분위 lookup 기반, 대학 무관)
// ────────────────────────────────────────────────────────────
export interface GradeScenarioStep {
  currentGrade: number;
  improvedGrade: number;
  label: string;
  percentileGain: number;
  direction: string;
}

export interface GradeImprovementScenario {
  available: boolean;
  subjectLabel: string;
  steps: GradeScenarioStep[];
  note: string;
}

function directionLabel(improvedGrade: number): string {
  if (improvedGrade <= 1) return '최상위권 방향';
  if (improvedGrade <= 2) return '상위권 방향';
  if (improvedGrade <= 3) return '중상위권 방향';
  return '중위권 방향';
}

function buildGradeScenario(
  subjectLabel: string,
  currentGrade: number | undefined,
  note: string,
): GradeImprovementScenario {
  if (currentGrade === undefined) {
    return { available: false, subjectLabel, steps: [], note: `${subjectLabel} 성적이 입력되면 시나리오를 확인할 수 있습니다.` };
  }
  const steps: GradeScenarioStep[] = [1, 2]
    .map((inc) => Math.max(1, currentGrade - inc))
    .filter((g, idx, arr) => arr.indexOf(g) === idx && g < currentGrade)
    .map((improvedGrade) => {
      const gain = Math.max(0, gradeToPercentileMid(improvedGrade) - gradeToPercentileMid(currentGrade));
      return {
        currentGrade,
        improvedGrade,
        label: `${subjectLabel} ${currentGrade}등급 → ${improvedGrade}등급`,
        percentileGain: gain,
        direction: directionLabel(improvedGrade),
      };
    });
  return { available: steps.length > 0, subjectLabel, steps, note };
}

// ────────────────────────────────────────────────────────────
// 4) 데이터 부족 여부(모의고사/수능실전)
// ────────────────────────────────────────────────────────────
export interface DataGapStatus {
  needsMockExam: boolean;
  needsSuneungMock: boolean; // 고3에서만 의미 있음
  message: string;
}

function buildDataGaps(payload: UniversityRecommendationFullPayload): DataGapStatus {
  const isGrade3 = payload.gradeLevel === '고3';
  const needsMockExam = !payload.dataCompleteness.hasMockExams;
  const needsSuneungMock = isGrade3 && !payload.dataCompleteness.hasSuneungMocks;

  let message = '';
  if (needsSuneungMock) message = '수능실전모의고사 성적이 아직 없습니다. 입력이 필요합니다.';
  else if (needsMockExam) message = '전국연합모의고사 성적이 아직 없습니다. 입력이 필요합니다.';
  else message = '모의고사 데이터가 준비되어 있습니다.';

  return { needsMockExam, needsSuneungMock, message };
}

// ────────────────────────────────────────────────────────────
// 종합 — 상담 요약
// ────────────────────────────────────────────────────────────
export interface UniversityCounselingSummary {
  studentId: string;
  gradeLevel: UniversityRecommendationFullPayload['gradeLevel'];
  dataReadiness: CounselingDataReadiness;
  fitScore: { score: number; label: FitLabel; color: string; description: string };
  currentPosition: CurrentPositionSummary;
  topWeakSubjects: SubjectImprovementNeed[];
  mathScenario: GradeImprovementScenario;
  internalGradeScenario: GradeImprovementScenario;
  dataGaps: DataGapStatus;
  oneLiner: string;
  // [Phase 3E v3-r16-r3] 확장 필드 — 기존 필드는 전부 그대로 유지.
  reliability: UniversityReliabilityAssessment;
}

/**
 * buildUniversityCounselingSummary — 상담 요약 종합 빌더.
 * 기존 universityPayloadAdapter.ts가 만든 payload를 입력받아, 대학명·합격 가능성
 * 계산 없이 상담에 바로 쓸 수 있는 6가지 요약 항목(+데이터 준비 상태·적합도)을
 * 계산한다. 순수 함수 — AI 호출/외부 API 호출 없음.
 */
export function buildUniversityCounselingSummary(
  payload: UniversityRecommendationFullPayload,
  studentName = '학생',
): UniversityCounselingSummary {
  const dataReadiness = buildDataReadiness(payload);
  const fitScore = getRecommendationFitScore(payload);
  const currentPosition = buildCurrentPosition(payload);
  const topWeakSubjects = getSubjectImprovementNeeds(payload).slice(0, 3);
  const dataGaps = buildDataGaps(payload);
  // [Phase 3E v3-r16-r3] 신뢰도/균형/누적 회차/부족 데이터/설명 문장 — 전부
  // universityReliabilityEngine.ts의 순수 함수 결과를 그대로 붙인다(재계산 없음).
  const reliability = buildUniversityReliabilityAssessment(payload);

  const mathScenario = buildGradeScenario(
    '수학',
    payload.dataCompleteness.latestMathGrade,
    '최근 모의고사 수학 성적 기준입니다.',
  );
  const internalGradeScenario = buildGradeScenario(
    '내신 평균',
    payload.dataCompleteness.weightedInternalGradeAvg !== undefined
      ? Math.round(payload.dataCompleteness.weightedInternalGradeAvg)
      : undefined,
    '가중 내신 평균등급 기준입니다.',
  );

  // 상담용 한 줄 요약
  let oneLiner: string;
  if (dataReadiness.status === 'not-ready') {
    oneLiner = `${studentName} 학생은 아직 상담 요약에 필요한 성적 데이터가 부족합니다. ${dataGaps.message}`;
  } else {
    const weakPart = topWeakSubjects.length > 0
      ? `보완 우선 과목은 '${topWeakSubjects[0].subjectName}'입니다.`
      : '전 과목이 고르게 준비되어 있습니다.';
    oneLiner = `${studentName} 학생은 현재 ${currentPosition.label} 수준(적합도 ${fitScore.score}점)이며, ${weakPart}`;
  }

  return {
    studentId: payload.studentId,
    gradeLevel: payload.gradeLevel,
    dataReadiness,
    fitScore,
    currentPosition,
    topWeakSubjects,
    mathScenario,
    internalGradeScenario,
    dataGaps,
    oneLiner,
    reliability,
  };
}
