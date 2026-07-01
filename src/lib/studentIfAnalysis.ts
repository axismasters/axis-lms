// AXIS LMS v1.2 — Phase 2E: Student IF Analysis Library
// "맞출 수 있었던 문제를 맞혔다면?" — IF 채점 분석 엔진
//
// Phase 2E 확정 사양:
//   - IF 이유: 계산 실수 / 개념 부족 / 시간 부족 (3개 고정)
//   - IF 결과: 실제 점수 / IF 점수 / 놓친 점수 / 상승 가능성 (4개 고정)
//   - source 필드 보존: 추후 Rival / Emblem / SP 시스템 연결 예정
//
// ⚠ Phase 2E 금지:
//   - 합격률 / 합격 가능성 / 합격 보장 / 불합격 표현 사용 금지
//   - 학원 입학테스트 결과 노출 금지
//   - 학생 화면에 수납/재무/청구/미납/환불 노출 금지

// ─── IF 이유 (3개 고정) ──────────────────────────────────────────────
export const IF_REASONS = ['계산 실수', '개념 부족', '시간 부족'] as const;
export type IfReason = typeof IF_REASONS[number];

// ─── IF 분석 입력값 ──────────────────────────────────────────────────
export interface IfAnalysisInput {
  examId: string;
  examTitle: string;
  actualScore: number;         // 실제 점수
  totalPoints: number;         // 만점
  recoveredPoints: number;     // 되찾을 수 있었던 점수 (선택값)
  reason: IfReason;            // IF 이유
}

// ─── IF 분석 결과 ────────────────────────────────────────────────────
export interface IfAnalysisResult {
  examId: string;
  examTitle: string;
  actualScore: number;         // 실제 점수
  ifScore: number;             // IF 점수 (actualScore + recoveredPoints, ≤ totalPoints)
  missedPoints: number;        // 놓친 점수 (= recoveredPoints)
  improvementPct: number;      // 상승 가능성 (퍼센트 포인트)
  actualPct: number;           // 실제 달성률 (%)
  ifPct: number;               // IF 달성률 (%)
  reason: IfReason;
  // ─── 추후 연결을 위한 source 필드 ─────────────────────────────────
  // Rival / Emblem / SP 시스템과 연결 시 이 필드를 사용한다
  source: {
    system: 'phase2e-if-analysis';     // 고정
    version: '1.0';
    rivalAvailable: false;             // Phase 3에서 true로 변경
    emblemAvailable: false;            // Phase 3에서 true로 변경
    spAvailable: false;                // Phase 3에서 true로 변경
    spPotential?: number;              // IF 달성 시 SP 예상치 (미래 연결용)
  };
}

// ─── IF 분석 계산 ────────────────────────────────────────────────────
export function calcIfAnalysis(input: IfAnalysisInput): IfAnalysisResult {
  const { examId, examTitle, actualScore, totalPoints, recoveredPoints, reason } = input;
  const capped = Math.min(actualScore + recoveredPoints, totalPoints);
  const missed = capped - actualScore;
  const actualPct = totalPoints > 0 ? Math.round((actualScore / totalPoints) * 100) : 0;
  const ifPct = totalPoints > 0 ? Math.round((capped / totalPoints) * 100) : 0;

  return {
    examId,
    examTitle,
    actualScore,
    ifScore: capped,
    missedPoints: missed,
    improvementPct: ifPct - actualPct,
    actualPct,
    ifPct,
    reason,
    source: {
      system: 'phase2e-if-analysis',
      version: '1.0',
      rivalAvailable: false,
      emblemAvailable: false,
      spAvailable: false,
    },
  };
}

// ─── IF 달성 시 동기부여 코멘트 ──────────────────────────────────────
export function getIfMotivationComment(result: IfAnalysisResult): string {
  const { reason, improvementPct, missedPoints } = result;
  if (improvementPct <= 0) return '이미 최선을 다했습니다. 지금처럼만 하면 됩니다!';

  const reasonComments: Record<IfReason, string> = {
    '계산 실수': `계산 실수만 잡아도 ${missedPoints}점을 더 받을 수 있었습니다. 풀이 과정을 꼼꼼히 확인하는 습관을 만들어봐요.`,
    '개념 부족': `개념을 완전히 익혔다면 ${missedPoints}점을 더 받을 수 있었습니다. 해당 단원 개념을 다시 정리해보세요.`,
    '시간 부족': `시간만 충분했다면 ${missedPoints}점을 더 받을 수 있었습니다. 시간 배분 전략을 연습해봐요.`,
  };

  return reasonComments[reason];
}

// ─── Phase 3A-2: 문항별 quick-tap IF 분석 ──────────────────────────
// 오답 문항만 리스트업해서 문항별로 IF 사유 3개 중 하나를 탭 한 번으로 선택하는 구조.
// 문항별 배점(points)을 기준으로 놓친 점수를 계산하므로, 배점이 문항마다 다른 시험
// (내신 서술형 포함 등)에서도 균등배점 가정 없이 정확하게 계산된다.
// 문항별 데이터가 없는 legacy 시험은 위 calcIfAnalysis(시험 전체 단위)를 fallback으로 사용한다.

export interface IfQuestionEntry {
  questionId: string;
  no: number;              // 문항 번호
  points: number;          // 문항 배점
  reason: IfReason | null; // 학생이 quick-tap으로 선택한 이유. null = 아직 선택 안 함(놓친 점수에 미포함)
}

export interface IfReasonBreakdownEntry {
  count: number;   // 해당 사유로 선택된 문항 수
  points: number;  // 해당 사유로 회복 가능한 점수 합
}

export interface IfAnalysisQuestionResult {
  examId: string;
  examTitle: string;
  actualScore: number;
  totalPoints: number;
  ifScore: number;              // actualScore + 선택된 문항 배점 합 (totalPoints 상한)
  missedPoints: number;         // 선택된 문항들의 배점 합(상한 적용 후)
  improvementPct: number;
  actualPct: number;
  ifPct: number;
  selectedCount: number;        // 사유를 선택한 문항 수
  totalWrongCount: number;      // 전체 오답 문항 수
  reasonBreakdown: Record<IfReason, IfReasonBreakdownEntry>;
  topReason: IfReason | null;   // 가장 많이 선택된 사유(동률이면 배점 합이 큰 쪽)
  source: IfAnalysisResult['source'];
}

export function calcIfAnalysisFromQuestions(input: {
  examId: string;
  examTitle: string;
  actualScore: number;
  totalPoints: number;
  questions: IfQuestionEntry[];
}): IfAnalysisQuestionResult {
  const { examId, examTitle, actualScore, totalPoints, questions } = input;
  const selected = questions.filter((q): q is IfQuestionEntry & { reason: IfReason } => q.reason !== null);
  const recoveredPoints = selected.reduce((sum, q) => sum + q.points, 0);
  const capped = Math.min(actualScore + recoveredPoints, totalPoints);
  const missed = capped - actualScore;
  const actualPct = totalPoints > 0 ? Math.round((actualScore / totalPoints) * 100) : 0;
  const ifPct = totalPoints > 0 ? Math.round((capped / totalPoints) * 100) : 0;

  const reasonBreakdown: Record<IfReason, IfReasonBreakdownEntry> = {
    '계산 실수': { count: 0, points: 0 },
    '개념 부족': { count: 0, points: 0 },
    '시간 부족': { count: 0, points: 0 },
  };
  selected.forEach((q) => {
    reasonBreakdown[q.reason].count += 1;
    reasonBreakdown[q.reason].points += q.points;
  });
  const topReason = (Object.entries(reasonBreakdown) as [IfReason, IfReasonBreakdownEntry][])
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => (b[1].count - a[1].count) || (b[1].points - a[1].points))[0]?.[0] ?? null;

  return {
    examId, examTitle, actualScore, totalPoints,
    ifScore: capped,
    missedPoints: missed,
    improvementPct: ifPct - actualPct,
    actualPct, ifPct,
    selectedCount: selected.length,
    totalWrongCount: questions.length,
    reasonBreakdown,
    topReason,
    source: {
      system: 'phase2e-if-analysis',
      version: '1.0',
      rivalAvailable: false,
      emblemAvailable: false,
      spAvailable: false,
    },
  };
}

// ─── 문항별 IF 결과 기반 동기부여 코멘트 (사유별로 요약) ───────────────
export function getIfMotivationCommentFromQuestions(result: IfAnalysisQuestionResult): string {
  if (result.selectedCount === 0) {
    return '오답 문항을 탭해서 놓친 이유를 선택하면 IF 분석 결과가 표시됩니다.';
  }
  if (result.improvementPct <= 0) {
    return '이미 최선을 다했습니다. 지금처럼만 하면 됩니다!';
  }
  const parts: string[] = [];
  (['계산 실수', '개념 부족', '시간 부족'] as const).forEach((reason) => {
    const entry = result.reasonBreakdown[reason];
    if (entry.count > 0) parts.push(`${reason} ${entry.count}문항(${entry.points}점)`);
  });
  return `${parts.join(' · ')}만 잡아도 ${result.missedPoints}점을 더 받을 수 있었습니다. 다음 시험에서는 가장 많이 놓친 "${result.topReason}" 유형을 집중적으로 대비해봐요.`;
}


// (추후 Rival / SP 시스템과 연결 시 사용)
export interface IfAccumulationSummary {
  totalAnalyzed: number;
  totalRecovered: number;        // 누적 되찾을 수 있었던 점수 합
  mostCommonReason: IfReason | null;
  avgImprovementPct: number | null;
}

export function getIfAccumulationSummary(results: IfAnalysisResult[]): IfAccumulationSummary {
  if (results.length === 0) {
    return { totalAnalyzed: 0, totalRecovered: 0, mostCommonReason: null, avgImprovementPct: null };
  }
  const reasonCounts: Record<IfReason, number> = { '계산 실수': 0, '개념 부족': 0, '시간 부족': 0 };
  results.forEach(r => { reasonCounts[r.reason]++; });
  const topReason = (Object.entries(reasonCounts) as [IfReason, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    totalAnalyzed: results.length,
    totalRecovered: results.reduce((s, r) => s + r.missedPoints, 0),
    mostCommonReason: topReason,
    avgImprovementPct: Math.round(
      results.reduce((s, r) => s + r.improvementPct, 0) / results.length
    ),
  };
}
