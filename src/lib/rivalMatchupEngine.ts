// AXIS LMS v1.2 — Phase 3D v3-r10-r1: rivalMatchupEngine
//
// "나 vs Rival" 매치업 카드(01-rival-matchup-card-approved.png)에 필요한 비교 데이터를
// 규칙 기반으로 만든다.
//
// ⚠ 철학(코드에도 박아둔다):
//   - Rival은 전투/게임이 아니라 "비슷한 수준의 상대와 함께 성장"하는 자극 장치다.
//   - "누구를 눌렀다"가 아니라 "이번 주 나는 얼마나 성장했는가"가 중심이다.
//   - 추천/비교는 외부 AI가 아니라 내부 규칙으로만 한다(이 파일은 fetch를 쓰지 않는다).
//   - 상대는 익명(닉네임/평균)으로만 표현하고 실명·반·연락처·ID를 노출하지 않는다.
//   - 승패 압박이 아니라 성장률/정확도/꾸준함/집중도 비교로 표현한다.
//
// 입력은 이미 시스템에 있는 값(내/상대 프로필, 최근 테스트 추이)뿐이며, 결정적으로 계산된다.

export interface MiniTrendPoint {
  label: string; // 요일/주차 라벨
  value: number; // 0~100 정규화 값
}

export interface MatchupLane {
  key: 'accuracy' | 'consistency' | 'focus';
  label: string;      // 정확도 / 꾸준함 / 집중도
  mine: number;       // 0~100
  rival: number;      // 0~100
}

export interface RivalMatchup {
  myWeeklyGrowthPct: number;    // 이번 주 성장률(%)
  rivalWeeklyGrowthPct: number; // Rival 평균 성장률(%)
  myPercentileLabel: string;    // "상위 32%" 등
  rivalPercentileLabel: string;
  myTrend: MiniTrendPoint[];
  rivalTrend: MiniTrendPoint[];
  lanes: MatchupLane[];
  leadingThisWeek: boolean;     // 이번 주 내가 앞서는가
  encouragement: string;        // 낙인/압박 없는 격려 문구
}

// 0~100 clamp
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * 결과 기반 성장률/추이 산출.
 * @param myResultPcts   내 최근 테스트 달성률(%) 오름차순(시간순)
 * @param rivalResultPcts Rival(또는 유사군 평균) 최근 달성률(%) 오름차순
 * @param seeds 정확도/꾸준함/집중도 lane 값(있으면 사용, 없으면 결과에서 추정)
 */
export function buildRivalMatchup(input: {
  myResultPcts: number[];
  rivalResultPcts: number[];
  myLaneSeeds?: { accuracy?: number; consistency?: number; focus?: number };
  rivalLaneSeeds?: { accuracy?: number; consistency?: number; focus?: number };
  trendLabels?: string[];
}): RivalMatchup {
  const { myResultPcts, rivalResultPcts, myLaneSeeds, rivalLaneSeeds } = input;
  const labels = input.trendLabels ?? ['4주 전', '3주 전', '2주 전', '지난주', '이번 주'];

  const growthOf = (arr: number[]): number => {
    if (arr.length < 2) return 0;
    return Math.round((arr[arr.length - 1] - arr[0]) * 10) / 10;
  };
  const myWeeklyGrowthPct = growthOf(myResultPcts);
  const rivalWeeklyGrowthPct = growthOf(rivalResultPcts);

  const toTrend = (arr: number[]): MiniTrendPoint[] => {
    const tail = arr.slice(-labels.length);
    // 라벨 수보다 데이터가 적으면 앞을 첫 값으로 패딩
    const padded = tail.length < labels.length
      ? [...Array(labels.length - tail.length).fill(tail[0] ?? 0), ...tail]
      : tail;
    return padded.map((v, i) => ({ label: labels[i], value: clamp(v) }));
  };

  const avg = (arr: number[]): number => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
  const myAvg = avg(myResultPcts);
  const rivalAvg = avg(rivalResultPcts);

  // lane 값: seed가 있으면 사용, 없으면 평균/성장률에서 결정적으로 추정
  const myLanes = {
    accuracy: clamp(myLaneSeeds?.accuracy ?? myAvg),
    consistency: clamp(myLaneSeeds?.consistency ?? (myAvg - 6 + Math.min(12, myResultPcts.length * 2))),
    focus: clamp(myLaneSeeds?.focus ?? (myAvg - 2 + myWeeklyGrowthPct / 2)),
  };
  const rivalLanes = {
    accuracy: clamp(rivalLaneSeeds?.accuracy ?? rivalAvg),
    consistency: clamp(rivalLaneSeeds?.consistency ?? (rivalAvg - 6)),
    focus: clamp(rivalLaneSeeds?.focus ?? (rivalAvg - 2 + rivalWeeklyGrowthPct / 2)),
  };

  const lanes: MatchupLane[] = [
    { key: 'accuracy', label: '정확도', mine: myLanes.accuracy, rival: rivalLanes.accuracy },
    { key: 'consistency', label: '꾸준함', mine: myLanes.consistency, rival: rivalLanes.consistency },
    { key: 'focus', label: '집중도', mine: myLanes.focus, rival: rivalLanes.focus },
  ];

  // 백분위 라벨(성장률 기반, 대략적 표현 — "상위 N%")
  const pctLabel = (growth: number): string => {
    const p = Math.max(5, Math.min(95, Math.round(60 - growth * 1.6)));
    return `상위 ${p}%`;
  };

  const leadingThisWeek = myWeeklyGrowthPct >= rivalWeeklyGrowthPct;
  const encouragement = leadingThisWeek
    ? '꾸준한 학습으로 더 큰 성장을 만들어보세요.'
    : '조금만 더 집중하면 이번 주 흐름을 바꿀 수 있어요.';

  return {
    myWeeklyGrowthPct,
    rivalWeeklyGrowthPct,
    myPercentileLabel: pctLabel(myWeeklyGrowthPct),
    rivalPercentileLabel: pctLabel(rivalWeeklyGrowthPct),
    myTrend: toTrend(myResultPcts),
    rivalTrend: toTrend(rivalResultPcts),
    lanes,
    leadingThisWeek,
    encouragement,
  };
}

// ─── Rival 추천(내부 규칙 기반) ────────────────────────────────────────
// 같은 학년/유사 과정 + 최근 평균 유사 + 성장률 유사(약간 앞선) + IF 약점 축 유사.
// 이 함수는 후보 점수만 계산한다(실제 매칭/저장은 GrowthContext/관리자 정책이 담당).
export interface RivalCandidateInput {
  studentId: string;
  gradeLevel?: string;
  recentAvgPct: number;
  weeklyGrowthPct: number;
  topIfAxis?: 'calculationError' | 'conceptLack' | 'timeShortage' | null;
}

export function scoreRivalCandidate(me: RivalCandidateInput, other: RivalCandidateInput): number {
  if (me.studentId === other.studentId) return -Infinity;
  let score = 100;
  // 학년/과정 유사
  if (me.gradeLevel && other.gradeLevel && me.gradeLevel !== other.gradeLevel) score -= 30;
  // 최근 평균 유사(가까울수록 좋음)
  score -= Math.abs(me.recentAvgPct - other.recentAvgPct) * 1.2;
  // 성장률: 나와 비슷하거나 약간 앞선 상대 선호
  const gDiff = other.weeklyGrowthPct - me.weeklyGrowthPct;
  score -= Math.abs(gDiff - 2) * 0.8; // +2%p 정도 앞선 상대가 최고점
  // IF 약점 축 유사
  if (me.topIfAxis && other.topIfAxis && me.topIfAxis === other.topIfAxis) score += 12;
  return Math.round(score);
}
