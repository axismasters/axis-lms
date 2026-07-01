// AXIS LMS v1.2 — Phase 2E: Student University Preview Adapter
// 목표 변화 프리뷰 — 대학추천 엔진 연결 전 Preview/Adapter 구조
//
// Phase 2E 목적:
//   - 실제 대학추천 엔진 연결 전이지만 학생 화면에 입구와 프리뷰 UI를 제공한다
//   - Phase 6.1에서 실제 analyzeUniversityTargets() 함수와 연결된다
//   - 현재는 데이터 준비 상태 표시 + Preview UI만 제공
//
// ⚠ Phase 2E 금지:
//   - 합격률 / 합격 가능성 / 합격 보장 / 불합격 표현 사용 금지
//   - 실제 대학명 / 학과명 분류 및 확정 데이터 제공 금지 (프리뷰만 허용)

import type { StudentExamResult } from '@/lib/assessmentData';
import { getUniversityRecommendationReadiness } from '@/lib/assessmentData';

// ─── 학생 분석 준비 상태 ─────────────────────────────────────────────
export type PreviewReadyStatus = 'not-ready' | 'preview' | 'ready';

export interface UniversityPreviewState {
  status: PreviewReadyStatus;
  statusLabel: string;
  statusDescription: string;
  suneungRounds: number;
  hasRecentScore: boolean;
  hasCumulativeAvg: boolean;
  hasLast3Avg: boolean;
  // ─── Phase 6.1 연결 예정 필드 ────────────────────────────────────
  // 실제 엔진 연결 시 아래 필드들이 채워진다
  engineConnected: false;       // Phase 6.1에서 true로 변경
  analysisApiEndpoint: string;  // POST /api/university-analysis/analyze
  adapterVersion: '2e-preview'; // Phase 6.1에서 '6.1' 이상으로 변경
}

// ─── 학생 준비 상태 계산 ─────────────────────────────────────────────
export function getUniversityPreviewState(
  publishedResults: StudentExamResult[]
): UniversityPreviewState {
  const readiness = getUniversityRecommendationReadiness(publishedResults);

  if (readiness.suneungRounds === 0) {
    return {
      status: 'not-ready',
      statusLabel: '분석 준비 전',
      statusDescription: '수능실전모의고사 결과가 1회 이상 있어야 프리뷰를 제공할 수 있어요.',
      suneungRounds: 0,
      hasRecentScore: false,
      hasCumulativeAvg: false,
      hasLast3Avg: false,
      engineConnected: false,
      analysisApiEndpoint: '/api/university-analysis/analyze',
      adapterVersion: '2e-preview',
    };
  }

  if (readiness.suneungRounds < 3) {
    return {
      status: 'preview',
      statusLabel: '프리뷰 준비 중',
      statusDescription: `수능실전모의고사 ${readiness.suneungRounds}회 결과가 있어요. 3회 이상이면 목표 변화 분석이 더 정확해집니다.`,
      suneungRounds: readiness.suneungRounds,
      hasRecentScore: readiness.hasRecentScore,
      hasCumulativeAvg: readiness.hasCumulativeAvg,
      hasLast3Avg: readiness.hasLast3Avg,
      engineConnected: false,
      analysisApiEndpoint: '/api/university-analysis/analyze',
      adapterVersion: '2e-preview',
    };
  }

  return {
    status: 'ready',
    statusLabel: '분석 준비 완료',
    statusDescription: `수능실전모의고사 ${readiness.suneungRounds}회 결과를 바탕으로 목표 변화 프리뷰를 확인할 수 있습니다.`,
    suneungRounds: readiness.suneungRounds,
    hasRecentScore: readiness.hasRecentScore,
    hasCumulativeAvg: readiness.hasCumulativeAvg,
    hasLast3Avg: readiness.hasLast3Avg,
    engineConnected: false,
    analysisApiEndpoint: '/api/university-analysis/analyze',
    adapterVersion: '2e-preview',
  };
}

// ─── 목표 대학 밴드 프리뷰 타입 ────────────────────────────────────────
// 실제 엔진 연결 전 프리뷰용 구조체 — Phase 6.1 AnalyzeResponse와 호환
export interface UniversityBandPreviewItem {
  band: 'reach' | 'target' | 'safety';
  bandLabel: string;
  placeholder: string;    // 실제 엔진 연결 전 표시할 안내 문구
  locked: true;           // Phase 6.1 이전까지 항상 잠긴 상태
}

export const UNIVERSITY_BAND_PREVIEW: UniversityBandPreviewItem[] = [
  {
    band: 'reach',
    bandLabel: '도전',
    placeholder: '실제 분석 연결 후 표시됩니다',
    locked: true,
  },
  {
    band: 'target',
    bandLabel: '목표',
    placeholder: '실제 분석 연결 후 표시됩니다',
    locked: true,
  },
  {
    band: 'safety',
    bandLabel: '안정',
    placeholder: '실제 분석 연결 후 표시됩니다',
    locked: true,
  },
];

// ─── 프리뷰 데이터 준비 현황 체크리스트 ─────────────────────────────
export interface PreviewChecklist {
  item: string;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
}

export function getPreviewChecklist(state: UniversityPreviewState): PreviewChecklist[] {
  return [
    {
      item: '수능실전 점수',
      done: state.hasRecentScore,
      doneLabel: '최근 점수 있음',
      pendingLabel: '수능실전모의고사 1회 필요',
    },
    {
      item: '누적 평균 산출',
      done: state.hasCumulativeAvg,
      doneLabel: '평균 산출 가능',
      pendingLabel: '2회 이상 필요',
    },
    {
      item: '최근 3회 추이',
      done: state.hasLast3Avg,
      doneLabel: '추이 분석 가능',
      pendingLabel: '3회 이상 필요',
    },
    {
      item: '분석 엔진 연결',
      done: false,                          // Phase 6.1 전까지 항상 false
      doneLabel: '엔진 연결 완료',
      pendingLabel: 'Phase 6.1 준비 중',
    },
  ];
}
