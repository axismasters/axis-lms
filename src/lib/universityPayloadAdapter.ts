// AXIS LMS v1.2 — Phase 3A-1+: universityPayloadAdapter.ts
// 대학추천 payload 변환 어댑터
//
// 선생님 입력 성적 → 대학추천 엔진 입력 payload 변환
// 모의고사성적누적엔진_기초1_최종호환본 구조 호환
// axis-university-analysis-engine-phase5.1 AnalyzeRequest 구조 연결 가능
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격 표현 금지
// engineConnected: false (Phase 4+에서 API 연결)

import type { TeacherSchoolRecordInput, SubjectGradeEntry } from './teacherSchoolRecordInput';
import type { TeacherMockExamInput } from './teacherMockExamInput';
import type { GradeLevel } from './universityMenuLabel';
import { getSchoolRecordsForStudentAll, SCHOOL_SUBJECTS } from './teacherSchoolRecordInput';
import { getMockExamRecordsForStudent, getSuneungRecordsForStudent, getNationalMockRecordsForStudent } from './teacherMockExamInput';

// ─── Adapter 버전 (payload 스키마 변경 시 함께 올린다) ────────────────
export const ADAPTER_VERSION = '3a2-1' as const;

export const ENGINE_CONNECTED = false;

// ─── 모의고사누적엔진 호환 구조 ──────────────────────────────────────
export interface MockExamAccumulatedScore {
  examDate: string;
  examType: string;
  koreanGrade?: number;
  koreanStd?: number;
  koreanPct?: number;
  mathGrade?: number;
  mathStd?: number;
  mathPct?: number;
  englishGrade?: number;
  totalRank?: number;
}

// ─── 내신 payload 변환 ──────────────────────────────────────────────
export interface InternalGradePayload {
  academicYear: string;
  gradeLevel: string;
  semester: string;
  examType: string;
  track: string;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    gradeRank?: number;
    creditUnit?: number;
    rawScore?: number;
    enrolledCount?: number;
    includeInPayload: boolean;
  }>;
  includedSubjectCount: number;
  weightedGradeAvg?: number;
}

export function convertTeacherSchoolRecordToUniversityPayload(
  record: TeacherSchoolRecordInput
): InternalGradePayload {
  const included = record.subjectGrades.filter(s => s.includeInPayload && s.gradeRank !== undefined);
  const weightedGradeAvg = included.length > 0
    ? included.reduce((sum, s) => {
        const credit = s.creditUnit ?? 1;
        return sum + (s.gradeRank ?? 5) * credit;
      }, 0) / included.reduce((sum, s) => sum + (s.creditUnit ?? 1), 0)
    : undefined;

  return {
    academicYear: record.academicYear,
    gradeLevel: record.gradeLevel,
    semester: record.semester,
    examType: record.examType,
    track: record.track,
    subjects: record.subjectGrades.map(sg => {
      const def = SCHOOL_SUBJECTS.find(s => s.id === sg.subjectId);
      return {
        subjectId: sg.subjectId,
        subjectName: def?.name ?? sg.subjectId,
        gradeRank: sg.gradeRank,
        creditUnit: sg.creditUnit,
        rawScore: sg.rawScore,
        enrolledCount: sg.enrolledCount,
        includeInPayload: sg.includeInPayload,
      };
    }),
    includedSubjectCount: included.length,
    weightedGradeAvg: weightedGradeAvg !== undefined ? Math.round(weightedGradeAvg * 100) / 100 : undefined,
  };
}

// ─── 모의고사 payload 변환 ────────────────────────────────────────────
export interface MockExamPayloadEntry {
  examLabel: string;
  examYear: string;
  examMonth: number;
  examType: string;
  korean: { optSubject?: string; grade?: number; std?: number; pct?: number };
  math: { optSubject?: string; grade?: number; std?: number; pct?: number };
  english: { grade?: number };
  history: { grade?: number };
  explore1: { track?: string; subject?: string; grade?: number; std?: number };
  explore2: { track?: string; subject?: string; grade?: number; std?: number };
  totalParticipants?: number;
}

export function convertTeacherMockExamToUniversityPayload(
  record: TeacherMockExamInput
): MockExamPayloadEntry {
  return {
    examLabel: `${record.examYear}년 ${record.examMonth}월 ${record.examType}`,
    examYear: record.examYear,
    examMonth: record.examMonth,
    examType: record.examType,
    korean: {
      optSubject: record.korean.optSubject,
      grade: record.korean.grade,
      std: record.korean.standardScore,
      pct: record.korean.percentile,
    },
    math: {
      optSubject: record.math.optSubject,
      grade: record.math.grade,
      std: record.math.standardScore,
      pct: record.math.percentile,
    },
    english: { grade: record.english.grade },
    history: { grade: record.history.grade },
    explore1: {
      track: record.explore1.track,
      subject: record.explore1.subjectName,
      grade: record.explore1.grade,
      std: record.explore1.standardScore,
    },
    explore2: {
      track: record.explore2.track,
      subject: record.explore2.subjectName,
      grade: record.explore2.grade,
      std: record.explore2.standardScore,
    },
    totalParticipants: record.totalParticipants,
  };
}

// ─── 전체 대학추천 payload 빌더 ────────────────────────────────────────
export interface UniversityRecommendationFullPayload {
  studentId: string;
  gradeLevel: GradeLevel | null;
  track: string;
  internalGrades: InternalGradePayload[];
  mockExamRecords: MockExamPayloadEntry[];
  suneungMockRecords: MockExamPayloadEntry[];
  dataCompleteness: {
    hasInternalGrades: boolean;
    hasMockExams: boolean;
    hasSuneungMocks: boolean;
    totalDataPoints: number;
    readyForAnalysis: boolean;
    weightedInternalGradeAvg?: number;
    latestMathGrade?: number;
    latestKoreanGrade?: number;
  };
  mathImprovementScenarios: Array<{
    currentGrade: number;
    improvedGrade: number;
    scenarioLabel: string;
    direction: string;
  }>;
  engineConnected: boolean;
  payloadVersion: '3a1-plus';
  adapterVersion: typeof ADAPTER_VERSION;
  builtAt: string;
}

export function buildUniversityRecommendationPayloadForStudent(
  studentId: string,
  gradeLevel: GradeLevel | null
): UniversityRecommendationFullPayload {
  const schoolRecords = getSchoolRecordsForStudentAll(studentId);
  const nationalMocks = getNationalMockRecordsForStudent(studentId);
  const suneungMocks = getSuneungRecordsForStudent(studentId);

  const internalGrades = schoolRecords.map(convertTeacherSchoolRecordToUniversityPayload);
  const mockExamRecords = nationalMocks.map(convertTeacherMockExamToUniversityPayload);
  const suneungMockRecords = suneungMocks.map(convertTeacherMockExamToUniversityPayload);

  const hasInternalGrades = internalGrades.length > 0;
  const hasMockExams = mockExamRecords.length > 0;
  const hasSuneungMocks = suneungMockRecords.length > 0;
  const totalDataPoints = internalGrades.length + nationalMocks.length + suneungMocks.length;

  // 가중 내신 평균
  const avgInternal = internalGrades.length > 0 && internalGrades[0].weightedGradeAvg !== undefined
    ? internalGrades[0].weightedGradeAvg : undefined;

  // 최신 수학 등급
  const latestMathGrade = mockExamRecords.length > 0 ? mockExamRecords[0].math.grade : undefined;
  const latestKoreanGrade = mockExamRecords.length > 0 ? mockExamRecords[0].korean.grade : undefined;

  // 분석 준비 여부
  const readyForAnalysis = gradeLevel === '고3'
    ? hasInternalGrades || (nationalMocks.length >= 2) || hasSuneungMocks
    : hasInternalGrades || hasMockExams;

  // 수학 향상 시나리오 (등급 기준)
  const currentMathGrade = latestMathGrade ?? 5;
  const mathImprovementScenarios = [1, 2].map(inc => {
    const improved = Math.max(1, currentMathGrade - inc);
    return {
      currentGrade: currentMathGrade,
      improvedGrade: improved,
      scenarioLabel: `수학 ${inc}등급 향상 시`,
      direction: improved <= 1 ? '최상위권 방향' : improved <= 2 ? '상위권 방향' : '중상위권 방향',
    };
  });

  const track = schoolRecords[0]?.track ?? nationalMocks[0]?.track ?? '자연';

  return {
    studentId,
    gradeLevel,
    track,
    internalGrades,
    mockExamRecords,
    suneungMockRecords,
    dataCompleteness: {
      hasInternalGrades,
      hasMockExams,
      hasSuneungMocks,
      totalDataPoints,
      readyForAnalysis,
      weightedInternalGradeAvg: avgInternal,
      latestMathGrade,
      latestKoreanGrade,
    },
    mathImprovementScenarios,
    engineConnected: ENGINE_CONNECTED,
    payloadVersion: '3a1-plus',
    adapterVersion: ADAPTER_VERSION,
    builtAt: new Date().toISOString(),
  };
}

// ─── 추천 적합도 (0~100 + 5단계 라벨) ──────────────────────────────────
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격/안정 합격 표현 금지
// "적합도"는 대학 합격 여부와 무관하게, 현재까지 확정된 성적 데이터가
// 보여주는 등급 수준을 0~100 점수로 환산한 것이다(1등급→100점, 9등급→0점 환산 평균).
export type FitLabel = '매우높음' | '높음' | '보통' | '낮음' | '매우낮음';

export interface RecommendationFitScore {
  score: number;        // 0~100
  label: FitLabel;
  color: string;
  description: string;
}

function gradeToScore(grade: number): number {
  // 1등급(최상위) → 100점, 9등급 → 0점
  return Math.max(0, Math.min(100, Math.round((9 - grade) / 8 * 100)));
}

export function getRecommendationFitScore(payload: UniversityRecommendationFullPayload): RecommendationFitScore {
  const grades: number[] = [];
  if (payload.dataCompleteness.weightedInternalGradeAvg !== undefined) grades.push(payload.dataCompleteness.weightedInternalGradeAvg);
  if (payload.dataCompleteness.latestMathGrade !== undefined) grades.push(payload.dataCompleteness.latestMathGrade);
  if (payload.dataCompleteness.latestKoreanGrade !== undefined) grades.push(payload.dataCompleteness.latestKoreanGrade);

  if (grades.length === 0) {
    return {
      score: 0, label: '매우낮음', color: 'oklch(0.6 0.015 250)',
      description: '확정 성적이 없어 적합도를 계산할 수 없습니다.',
    };
  }

  const score = Math.round(grades.reduce((s, g) => s + gradeToScore(g), 0) / grades.length);
  let label: FitLabel; let color: string;
  if (score >= 80)      { label = '매우높음'; color = 'oklch(0.45 0.15 145)'; }
  else if (score >= 60) { label = '높음';     color = 'oklch(0.5 0.14 150)'; }
  else if (score >= 40) { label = '보통';     color = 'oklch(0.55 0.15 80)'; }
  else if (score >= 20) { label = '낮음';     color = 'oklch(0.55 0.18 50)'; }
  else                  { label = '매우낮음'; color = 'oklch(0.55 0.2 27)'; }

  return {
    score, label, color,
    description: `현재 확정 성적 기준 추천 적합도는 ${score}점(${label})입니다. 목표 대비 방향 안내용 참고 지표입니다.`,
  };
}

// ─── 과목별 보완 필요도 (0~100) ────────────────────────────────────────
// 등급이 낮을수록(성적이 아쉬울수록) 보완 필요도 점수가 높다(1등급→0점, 9등급→100점).
export interface SubjectImprovementNeed {
  subjectName: string;
  grade: number;
  needScore: number;   // 0~100, 높을수록 보완 필요
  source: 'internal' | 'mock';
}

function needScoreFromGrade(grade: number): number {
  return Math.max(0, Math.min(100, Math.round((grade - 1) / 8 * 100)));
}

export function getSubjectImprovementNeeds(payload: UniversityRecommendationFullPayload): SubjectImprovementNeed[] {
  const needs: SubjectImprovementNeed[] = [];

  // 실제내신 (가장 최근 레코드 기준, 반영 포함 + 등급 있는 과목만)
  const latestInternal = payload.internalGrades[0];
  latestInternal?.subjects
    .filter(s => s.includeInPayload && s.gradeRank !== undefined)
    .forEach(s => needs.push({
      subjectName: s.subjectName, grade: s.gradeRank!,
      needScore: needScoreFromGrade(s.gradeRank!), source: 'internal',
    }));

  // 전국연합모의고사 (가장 최근 1회 기준 — 국어/수학/영어/탐구1/탐구2)
  const latestMock = payload.mockExamRecords[0];
  if (latestMock) {
    if (latestMock.korean.grade !== undefined) needs.push({ subjectName: '국어', grade: latestMock.korean.grade, needScore: needScoreFromGrade(latestMock.korean.grade), source: 'mock' });
    if (latestMock.math.grade !== undefined) needs.push({ subjectName: '수학', grade: latestMock.math.grade, needScore: needScoreFromGrade(latestMock.math.grade), source: 'mock' });
    if (latestMock.english.grade !== undefined) needs.push({ subjectName: '영어', grade: latestMock.english.grade, needScore: needScoreFromGrade(latestMock.english.grade), source: 'mock' });
    if (latestMock.explore1.grade !== undefined) needs.push({ subjectName: latestMock.explore1.subject ?? '탐구1', grade: latestMock.explore1.grade, needScore: needScoreFromGrade(latestMock.explore1.grade), source: 'mock' });
    if (latestMock.explore2.grade !== undefined) needs.push({ subjectName: latestMock.explore2.subject ?? '탐구2', grade: latestMock.explore2.grade, needScore: needScoreFromGrade(latestMock.explore2.grade), source: 'mock' });
  }

  return needs.sort((a, b) => b.needScore - a.needScore);
}


export function getReadinessLabel(payload: UniversityRecommendationFullPayload): {
  label: string; color: string; description: string;
} {
  if (!payload.dataCompleteness.readyForAnalysis) {
    return {
      label: '데이터 준비 중',
      color: 'oklch(0.55 0.015 250)',
      description: '내신성적 또는 전국연합모의고사 성적이 필요합니다.',
    };
  }
  if (payload.dataCompleteness.totalDataPoints >= 4) {
    return {
      label: '분석 가능',
      color: 'oklch(0.45 0.15 145)',
      description: '충분한 데이터가 있습니다. 선생님과 상담 리포트를 확인하세요.',
    };
  }
  return {
    label: '부분 준비',
    color: 'oklch(0.55 0.15 80)',
    description: '데이터를 더 추가하면 분석 정확도가 높아집니다.',
  };
}
