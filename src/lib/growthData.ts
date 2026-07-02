// AXIS LMS v1.2 - Growth Data (성장관리 Foundation v2)
// 학생 동기부여 기능의 데이터 모델: 성장 프로필 / SP 이력 / 엠블럼 / 학생 엠블럼 / 라이벌
// 주의: 학생/보호자 화면 노출 구조를 만들지 않는다. 관리자 Back Office 전용.

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export type EmblemCategory = 'LIFE' | 'GROWTH' | 'ASSESSMENT' | 'RIVAL' | 'SKILL' | 'SPECIAL';
export type EmblemMaterial = 'WOOD' | 'STONE' | 'BRONZE' | 'IRON' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type RivalStatus = 'ACTIVE' | 'ENDED';
export type GrowthSourceType = 'ATTENDANCE' | 'ASSESSMENT' | 'ENROLLMENT' | 'RIVAL' | 'MANUAL';
/** @deprecated Use GrowthSourceType — kept for backward compat */
export type EmblemSourceType = GrowthSourceType;

// ────────────────────────────────────────────────────────────
// Tier — [Phase 3D v3-r10-r1] AXIS 성장 단계로 전면 재정의
// ────────────────────────────────────────────────────────────
// ⚠ 철학(반드시 코드에도 박아둔다):
//   - Tier는 게임 랭크(WOOD/BRONZE/GOLD…)가 아니다. AXIS "성장 단계"다.
//   - 학생이 자기 성장 위치를 이해하고 "다음 단계"를 바라보게 하는 장치다.
//   - 교사에게는 상담 지표, 학부모에게는 직접 명칭 노출 금지(→ "현재 성장 단계 /
//     다음 성장 목표"로 간접 표현).
// 단계(6): Seed → Foundation → Focus → Strategy → Mastery → Axis Master
// (04-tier-system-board.png 기준. UNRANKED는 데이터 안전용 fallback으로만 남긴다.)
export type StudentTier =
  | 'UNRANKED' | 'SEED' | 'FOUNDATION' | 'FOCUS' | 'STRATEGY' | 'MASTERY' | 'AXIS_MASTER';

/** IF 3사유 축 — Emblem/Rival 추천 등에서 공용으로 쓰는 약점 축 키 */
export type IfAxisKey = 'calculationError' | 'conceptLack' | 'timeShortage';

/** 엠블럼 패밀리 — v3-r10-r1 카탈로그 기준(AXIS_v3-r10_emblem_catalog.md) */
export type EmblemFamily = 'IF_IMPROVEMENT' | 'GROWTH' | 'HABIT' | 'REFLECTION' | 'COUNSELING' | 'LIFE';

/** 엠블럼 성장 무게(레벨) — 현질형 희귀도가 아니라 "성장 무게" 표현용 */
export type EmblemLevel = 'BASIC' | 'GROWTH' | 'FOCUS' | 'SIGNATURE' | 'MASTER';

/** 학생 성장 프로필 */
export interface StudentGrowthProfile {
  studentId: string;
  nickname: string;
  tier: StudentTier;
  totalSP: number;
  seasonSP: number;
  representativeEmblemIds: string[];   // 대표 엠블럼 최대 3개
  currentRivalId?: string;
  rivalWins: number;
  rivalLosses: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * SP 지급 이력 (수정 2)
 * 삭제 기능 없음. 음수 SP 이번 단계 허용 안 함.
 */
export interface StudentSPLog {
  id: string;
  studentId: string;
  amount: number;               // 양수만 허용 (이번 단계)
  reason: string;
  sourceType: GrowthSourceType;
  sourceId?: string;            // 연동된 출결/시험 ID 등
  createdAt: string;
  createdBy: string;            // 지급 주체 (관리자 이름 또는 'SYSTEM')
}

/** 엠블럼 정책 */
export interface Emblem {
  id: string;
  name: string;
  category: EmblemCategory;
  description: string;
  material: EmblemMaterial;
  conditionText: string;
  requiredCount: number;
  hidden: boolean;   // true: 학생에게 조건 미공개
  active: boolean;   // false: 비활성 (삭제 대신 비활성)
  /** Assessment IF 분석 placeholder 연동 키 */
  ifPlaceholderKey?: 'calculationError' | 'conceptLack' | 'timeShortage' | 'carelessMistake';
  /** 출결 연동 hook 키 */
  attendanceHookKey?: 'monthlyPerfect' | 'consecutivePerfect' | 'totalAttendance';
  // ── [v3-r10-r1] 프리미엄 업적 배지 렌더링 + 카탈로그 연동 메타 ──────────
  /** 카탈로그 패밀리(IF Improvement / Growth / Habit / Reflection / Counseling) */
  family?: EmblemFamily;
  /** 성장 무게(레벨) — 테두리/프레임 강도 결정 */
  level?: EmblemLevel;
  /** 배지 아이콘 키(AxisEmblemBadge가 SVG로 렌더 — 단일 이모지 금지) */
  iconKey?: EmblemIconKey;
  /** IF 3사유 직접 연결(계산 실수/개념 부족/시간 부족) */
  linkedIfAxis?: IfAxisKey;
  /** 교사 상담 요약용 한 줄(이 엠블럼이 상담에서 뜻하는 것) */
  teacherSummary?: string;
  /** 학부모 안전 표현(Emblem이라는 단어 대신 노출) */
  parentSafeLabel?: string;
  createdAt: string;
}

/** 배지 아이콘 키 — AxisEmblemBadge 컴포넌트가 이 키로 SVG 심볼을 그린다. */
export type EmblemIconKey =
  | 'calc' | 'concept' | 'time' | 'steady' | 'comeback'
  | 'weekly' | 'focus' | 'reflection' | 'streak' | 'mentor'
  | 'attendance' | 'generic';

/** 학생 엠블럼 획득/진행 기록 */
export interface StudentEmblem {
  id: string;
  studentId: string;
  emblemId: string;
  acquiredAt: string;
  progressCount: number;   // 현재 진행 카운트
  achieved: boolean;
  sourceType: GrowthSourceType;
  sourceId?: string;
}

/** 라이벌 관계 */
export interface RivalRelation {
  id: string;
  challengerStudentId: string;   // 라이벌을 지정한 학생
  targetStudentId: string;       // 지정받은 학생 (학생에게 노출 금지, 관리자만 조회 가능)
  status: RivalStatus;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;                // 양수: 연속 상승 흐름, 음수: 보완 흐름 (내부 비교 데이터)
  createdAt: string;
  nextChangeAvailableAt: string;
}

// ────────────────────────────────────────────────────────────
// 상수 / 레이블
// ────────────────────────────────────────────────────────────

export const TIER_LABELS: Record<StudentTier, string> = {
  UNRANKED: '준비 단계',
  SEED: '씨앗', FOUNDATION: '기초', FOCUS: '집중',
  STRATEGY: '전략', MASTERY: '숙련', AXIS_MASTER: '축의 완성',
};

/** 영문 단계명(Hero/Tier 보드 표기용) */
export const TIER_LABELS_EN: Record<StudentTier, string> = {
  UNRANKED: 'Getting Ready',
  SEED: 'Seed', FOUNDATION: 'Foundation', FOCUS: 'Focus',
  STRATEGY: 'Strategy', MASTERY: 'Mastery', AXIS_MASTER: 'Axis Master',
};

/** 단계 한 줄 철학(04-tier-system-board.png 문구 기반) */
export const TIER_TAGLINE: Record<StudentTier, string> = {
  UNRANKED: '성장 데이터를 모으는 중입니다.',
  SEED: '배움의 첫 시작, 가능성의 씨앗을 심다.',
  FOUNDATION: '기초를 다지고, 학습의 토대를 세우다.',
  FOCUS: '핵심에 집중하며, 이해의 깊이를 더하다.',
  STRATEGY: '전략적으로 사고하고, 실력을 체계화하다.',
  MASTERY: '지식을 내면화하고, 스스로의 기준을 세우다.',
  AXIS_MASTER: '학습의 축을 완성하고, 더 큰 가치를 창조하다.',
};

// 색상 — 04-tier-system-board.png DESIGN SYSTEM GUIDE의 정확한 hex 값을 사용한다.
// (임의 색상 생성 금지 — 참조 이미지에서 제공된 값 그대로.)
export const TIER_COLORS: Record<StudentTier, string> = {
  UNRANKED:    '#8A94A6',
  SEED:        '#7AA9BD',
  FOUNDATION:  '#4C7DB8',
  FOCUS:       '#D18B2E',
  STRATEGY:    '#2F7F86',
  MASTERY:     '#0F1D33',
  AXIS_MASTER: '#888D2A',
};

/** 낮은 단계 → 높은 단계 순서(진행률/다음 단계 계산용) */
export const TIER_ORDER: StudentTier[] = [
  'SEED', 'FOUNDATION', 'FOCUS', 'STRATEGY', 'MASTERY', 'AXIS_MASTER',
];

/** 배지 프레임 스타일(Mastery/Axis Master는 딥 네이비+골드 프리미엄 프레임) */
export const TIER_IS_PREMIUM_FRAME: Record<StudentTier, boolean> = {
  UNRANKED: false, SEED: false, FOUNDATION: false, FOCUS: false,
  STRATEGY: false, MASTERY: true, AXIS_MASTER: true,
};

export const CATEGORY_LABELS: Record<EmblemCategory, string> = {
  LIFE: '생활', GROWTH: '성장', ASSESSMENT: '시험',
  RIVAL: '라이벌', SKILL: '스킬', SPECIAL: '특별',
};

/** 엠블럼 패밀리 라벨(학생/교사 화면 표기) */
export const EMBLEM_FAMILY_LABELS: Record<EmblemFamily, string> = {
  IF_IMPROVEMENT: 'IF 개선', GROWTH: '성장', HABIT: '학습 습관',
  REFLECTION: '복습', COUNSELING: '상담 근거', LIFE: '생활',
};

export const MATERIAL_LABELS: Record<EmblemMaterial, string> = {
  WOOD: '우드', STONE: '스톤', BRONZE: '브론즈', IRON: '아이언',
  SILVER: '실버', GOLD: '골드', DIAMOND: '다이아몬드',
};

export const MATERIAL_BADGE: Record<EmblemMaterial, { bg: string; text: string; border: string }> = {
  WOOD:    { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  STONE:   { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' },
  BRONZE:  { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  IRON:    { bg: '#F1F5F9', text: '#374151', border: '#CBD5E1' },
  SILVER:  { bg: '#F0F9FF', text: '#0C4A6E', border: '#BAE6FD' },
  GOLD:    { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  DIAMOND: { bg: '#EEF1F6', text: '#1F3A66', border: '#C7D0E3' },
};

// ── [v3-r10-r1] 엠블럼 레벨별 배지 팔레트 ──────────────────────────────
// AXIS_v3-r10_emblem_catalog.md의 Rarity/Level Guidance를 브랜드 색으로 매핑.
// 현질형 희귀도가 아니라 "성장 무게"만 표현한다(Basic=옅은 테두리 → Master=네이비+골드 프레임).
export const EMBLEM_LEVEL_STYLE: Record<EmblemLevel, {
  ring: string; plate: string; accent: string; premium: boolean;
}> = {
  BASIC:     { ring: '#C9CFD8', plate: '#38414F', accent: '#7AA9BD', premium: false },
  GROWTH:    { ring: '#2F7F86', plate: '#0F2A3A', accent: '#2F7F86', premium: false },
  FOCUS:     { ring: '#C8A15A', plate: '#12233B', accent: '#C8A15A', premium: false },
  SIGNATURE: { ring: '#C8A15A', plate: '#0B1B33', accent: '#C8A15A', premium: true },
  MASTER:    { ring: '#E4C979', plate: '#081428', accent: '#E4C979', premium: true },
};

export const CATEGORY_BADGE: Record<EmblemCategory, { bg: string; text: string }> = {
  LIFE:       { bg: '#F0FDF4', text: '#166534' },
  GROWTH:     { bg: '#EFF6FF', text: '#1E40AF' },
  ASSESSMENT: { bg: '#FFF7ED', text: '#9A3412' },
  RIVAL:      { bg: '#FEF2F2', text: '#991B1B' },
  SKILL:      { bg: '#E7EBF3', text: '#040D1E' },
  SPECIAL:    { bg: '#FFFBEB', text: '#92400E' },
};

export const SOURCE_TYPE_LABELS: Record<GrowthSourceType, string> = {
  ATTENDANCE: '출결', ASSESSMENT: '성적', ENROLLMENT: '수강',
  RIVAL: '라이벌', MANUAL: '수동 지급',
};

// SP 임계값 — 6단계 성장 단계 기준(게임 랭크 아님). 학생 화면에서는 "다음 단계까지 %"로만
// 표현하고 SP 수치 자체를 재화처럼 크게 강조하지 않는다.
export const SP_TIER_THRESHOLDS: Record<StudentTier, number> = {
  UNRANKED: 0,
  SEED: 0, FOUNDATION: 300, FOCUS: 800,
  STRATEGY: 1600, MASTERY: 2800, AXIS_MASTER: 4200,
};

export function calcTierFromSP(totalSP: number): StudentTier {
  const desc: StudentTier[] = ['AXIS_MASTER', 'MASTERY', 'STRATEGY', 'FOCUS', 'FOUNDATION', 'SEED'];
  for (const tier of desc) {
    if (totalSP >= SP_TIER_THRESHOLDS[tier]) return tier;
  }
  return 'UNRANKED';
}

// ── [v3-r10-r1] 다음 성장 단계까지 진행률 ────────────────────────────────
// 학생 화면 Hero의 "다음 단계까지 72%" + "현재 SP / 다음 단계 SP" 표시에 사용한다.
// SP 수치 자체보다 "다음 단계까지 얼마나 남았는가"를 강조하는 게 Tier 철학이다.
export interface TierProgress {
  current: StudentTier;
  next: StudentTier | null;   // null이면 최종 단계(Axis Master) 도달
  currentFloorSP: number;
  nextThresholdSP: number | null;
  progressPct: number;        // 0~100, 현재 단계 구간 내 진행률
}

export function calcTierProgress(totalSP: number): TierProgress {
  const current = calcTierFromSP(totalSP);
  const idx = TIER_ORDER.indexOf(current);
  // UNRANKED(데이터 부족) 또는 순서 밖이면 첫 단계 진입 전으로 취급
  if (idx === -1) {
    const firstNext = TIER_ORDER[0];
    const nextTh = SP_TIER_THRESHOLDS[firstNext];
    return {
      current, next: firstNext, currentFloorSP: 0, nextThresholdSP: nextTh,
      progressPct: nextTh > 0 ? Math.min(100, Math.round((totalSP / nextTh) * 100)) : 0,
    };
  }
  const next = idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
  const floor = SP_TIER_THRESHOLDS[current];
  if (!next) {
    return { current, next: null, currentFloorSP: floor, nextThresholdSP: null, progressPct: 100 };
  }
  const ceil = SP_TIER_THRESHOLDS[next];
  const span = ceil - floor;
  const progressPct = span > 0 ? Math.min(100, Math.max(0, Math.round(((totalSP - floor) / span) * 100))) : 0;
  return { current, next, currentFloorSP: floor, nextThresholdSP: ceil, progressPct };
}


export const MOCK_EMBLEMS: Emblem[] = [
  // ── LIFE
  { id: 'emb-001', name: '개근왕', category: 'LIFE', material: 'BRONZE',
    description: '한 달 동안 결석 없이 출석', conditionText: '월 출석률 100%', requiredCount: 1,
    hidden: false, active: true, attendanceHookKey: 'monthlyPerfect', createdAt: '2025-03-01' },
  { id: 'emb-002', name: '성실의 증거', category: 'LIFE', material: 'SILVER',
    description: '3개월 연속 개근 달성', conditionText: '3개월 연속 월 개근', requiredCount: 3,
    hidden: false, active: true, attendanceHookKey: 'consecutivePerfect', createdAt: '2025-03-01' },
  { id: 'emb-003', name: '철의 의지', category: 'LIFE', material: 'GOLD',
    description: '6개월 연속 개근 달성', conditionText: '6개월 연속 월 개근', requiredCount: 6,
    hidden: false, active: true, attendanceHookKey: 'consecutivePerfect', createdAt: '2025-03-01' },
  { id: 'emb-017', name: '꾸준한 출석자', category: 'LIFE', material: 'WOOD',
    description: '누적 출석 20회 이상', conditionText: '누적 출석 20회', requiredCount: 20,
    hidden: false, active: true, attendanceHookKey: 'totalAttendance', createdAt: '2025-03-01' },
  { id: 'emb-018', name: '과제 완수자', category: 'LIFE', material: 'STONE',
    description: '과제 10회 연속 제출', conditionText: '과제 10회 연속 제출', requiredCount: 10,
    hidden: false, active: true, createdAt: '2025-03-01' },

  // ── GROWTH
  { id: 'emb-004', name: '성장의 씨앗', category: 'GROWTH', material: 'WOOD',
    description: '첫 시험 응시 완료', conditionText: '첫 번째 시험 응시', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-005', name: '꾸준한 도전자', category: 'GROWTH', material: 'STONE',
    description: '시험 5회 이상 응시', conditionText: '시험 응시 5회 이상', requiredCount: 5,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-006', name: '10점 도약', category: 'GROWTH', material: 'BRONZE',
    description: '직전 동일 시험 대비 +10점', conditionText: '직전 동일 시험 대비 +10점 이상', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-007', name: '개념 정복자', category: 'GROWTH', material: 'SILVER',
    description: '개념 부족 오류 3회 연속 없음', conditionText: '시험 3회 연속 개념 오류 없음', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'conceptLack', createdAt: '2025-03-01' },
  { id: 'emb-019', name: 'SP 누적 500', category: 'GROWTH', material: 'IRON',
    description: 'SP 500 이상 누적', conditionText: '누적 SP 500 이상', requiredCount: 500,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-020', name: 'SP 누적 2000', category: 'GROWTH', material: 'GOLD',
    description: 'SP 2000 이상 누적', conditionText: '누적 SP 2000 이상', requiredCount: 2000,
    hidden: false, active: true, createdAt: '2025-03-01' },

  // ── ASSESSMENT
  { id: 'emb-008', name: '90점 클럽', category: 'ASSESSMENT', material: 'GOLD',
    description: '시험 점수 90점 이상 달성', conditionText: '단일 시험 90점 이상', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-009', name: '만점의 신', category: 'ASSESSMENT', material: 'DIAMOND',
    description: '시험 만점 달성', conditionText: '단일 시험 100점', requiredCount: 1,
    hidden: true, active: true, createdAt: '2025-03-01' },
  { id: 'emb-010', name: '시간 마스터', category: 'ASSESSMENT', material: 'IRON',
    description: '시간 부족 오류 3회 연속 없음', conditionText: '시험 3회 연속 시간 부족 없음', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'timeShortage', createdAt: '2025-03-01' },
  { id: 'emb-011', name: '꼼꼼한 검토자', category: 'ASSESSMENT', material: 'IRON',
    description: '계산 실수 오류 3회 연속 없음', conditionText: '시험 3회 연속 계산 실수 없음', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'carelessMistake', createdAt: '2025-03-01' },
  { id: 'emb-021', name: '단원평가 통과', category: 'ASSESSMENT', material: 'STONE',
    description: '단원평가 70점 이상', conditionText: '단원평가 70점 이상', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-022', name: '성적 공개 후 성장', category: 'ASSESSMENT', material: 'BRONZE',
    description: '성적 공개 이후 다음 시험에서 향상', conditionText: '공개 시험 이후 점수 향상', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },

  // ── RIVAL
  { id: 'emb-012', name: '첫 성장 비교', category: 'RIVAL', material: 'STONE',
    description: '성장 매치업에서 첫 성장 우위', conditionText: '성장 매치업 1회 우위', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-013', name: '연속 상승 흐름', category: 'RIVAL', material: 'BRONZE',
    description: '성장 매치업 3회 연속 상승', conditionText: '성장 매치업 3회 연속 우위', requiredCount: 3,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-014', name: '성장 하이라이트', category: 'RIVAL', material: 'GOLD',
    description: '성장 매치업 누적 10회 우위', conditionText: '성장 매치업 누적 10회 이상 우위', requiredCount: 10,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-023', name: '재도전 성장', category: 'RIVAL', material: 'SILVER',
    description: '보완 흐름에서 상승 흐름으로 전환', conditionText: '보완 흐름 후 3회 연속 상승', requiredCount: 3,
    hidden: false, active: true, createdAt: '2025-03-01' },

  // ── SKILL
  { id: 'emb-015', name: '수학의 기초', category: 'SKILL', material: 'WOOD',
    description: '기초 연산 시험 5회 응시', conditionText: '기초 연산 시험 5회 이상', requiredCount: 5,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-024', name: '계산 정확도 향상', category: 'SKILL', material: 'BRONZE',
    description: '계산 실수 개선 3회 연속', conditionText: '계산 실수 없음 3회 연속', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'calculationError', createdAt: '2025-03-01' },
  { id: 'emb-025', name: '개념 회복', category: 'SKILL', material: 'SILVER',
    description: '개념 부족 보완 성공', conditionText: '개념 부족 오류 0 → 2회 연속 유지', requiredCount: 2,
    hidden: false, active: true, ifPlaceholderKey: 'conceptLack', createdAt: '2025-03-01' },
  { id: 'emb-026', name: '시간관리 달인', category: 'SKILL', material: 'GOLD',
    description: '시간 부족 오류 5회 연속 없음', conditionText: '시간 부족 없음 5회 연속', requiredCount: 5,
    hidden: false, active: true, ifPlaceholderKey: 'timeShortage', createdAt: '2025-03-01' },

  // ── SPECIAL
  { id: 'emb-016', name: '숨겨진 천재', category: 'SPECIAL', material: 'DIAMOND',
    description: '특별한 조건에서만 획득 가능', conditionText: '관리자 수동 지급', requiredCount: 1,
    hidden: true, active: true, createdAt: '2025-03-01' },
  { id: 'emb-027', name: '시즌 한정: 선구자', category: 'SPECIAL', material: 'GOLD',
    description: '시즌 내 처음으로 상위 성장 단계 진입', conditionText: '이번 시즌 첫 상위 단계 진입', requiredCount: 1,
    hidden: true, active: true, level: 'MASTER', iconKey: 'streak', createdAt: '2025-03-01' },

  // ── [v3-r10-r1] AXIS 성장 엠블럼 카탈로그(AXIS_v3-r10_emblem_catalog.md 기준) ──
  //   프리미엄 업적 배지. family/level/iconKey/linkedIfAxis/teacherSummary/parentSafeLabel을
  //   모두 채워 학생(갤러리)·교사(상담 근거)·학부모(간접 표현) 3계층 표시를 하나의
  //   데이터에서 파생한다. IF 3사유 직접 연결 3종은 반드시 유지한다.
  { id: 'calc_precision_01', name: 'Calculation Precision', category: 'SKILL', material: 'SILVER',
    description: '최근 테스트에서 계산 실수로 놓친 점수가 줄어들고 있음', conditionText: '계산 실수 손실 감소', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'calculationError', linkedIfAxis: 'calculationError',
    family: 'IF_IMPROVEMENT', level: 'FOCUS', iconKey: 'calc',
    teacherSummary: '계산 실수가 줄어드는 흐름 — 검산 습관 정착 여부를 확인해보세요.',
    parentSafeLabel: '계산 실수 개선 흐름', createdAt: '2025-03-01' },
  { id: 'concept_mastery_01', name: 'Concept Mastery', category: 'SKILL', material: 'GOLD',
    description: '반복 테스트 후 개념 부족 문항이 개선되고 있음', conditionText: '개념 부족 항목 개선', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'conceptLack', linkedIfAxis: 'conceptLack',
    family: 'IF_IMPROVEMENT', level: 'SIGNATURE', iconKey: 'concept',
    teacherSummary: '개념 약점이 보완되는 중 — 어떤 단원에서 회복됐는지 짚어주세요.',
    parentSafeLabel: '개념 이해 보완', createdAt: '2025-03-01' },
  { id: 'time_control_01', name: 'Time Control', category: 'SKILL', material: 'GOLD',
    description: '시간 부족 손실 감소 또는 후반부 정확도 향상', conditionText: '시간 부족 손실 감소', requiredCount: 3,
    hidden: false, active: true, ifPlaceholderKey: 'timeShortage', linkedIfAxis: 'timeShortage',
    family: 'IF_IMPROVEMENT', level: 'FOCUS', iconKey: 'time',
    teacherSummary: '시간 배분이 개선되는 중 — 후반부 문항 정확도를 함께 확인해보세요.',
    parentSafeLabel: '풀이 시간 개선', createdAt: '2025-03-01' },
  { id: 'steady_improvement_01', name: 'Steady Improvement', category: 'GROWTH', material: 'SILVER',
    description: '여러 테스트에 걸쳐 성장 추세가 이어짐', conditionText: '성장 추세 지속', requiredCount: 3,
    hidden: false, active: true, family: 'GROWTH', level: 'GROWTH', iconKey: 'steady',
    teacherSummary: '안정적인 상승 흐름 — 현재 학습 페이스를 유지하도록 격려해주세요.',
    parentSafeLabel: '꾸준한 성장 변화', createdAt: '2025-03-01' },
  { id: 'comeback_growth_01', name: 'Comeback Growth', category: 'GROWTH', material: 'GOLD',
    description: '낮은 결과 이후 다시 회복함', conditionText: '하락 후 회복', requiredCount: 1,
    hidden: false, active: true, family: 'GROWTH', level: 'SIGNATURE', iconKey: 'comeback',
    teacherSummary: '어려움 이후 회복한 사례 — 회복 요인을 상담에서 짚으면 좋습니다.',
    parentSafeLabel: '회복 성장', createdAt: '2025-03-01' },
  { id: 'weekly_consistency_01', name: 'Weekly Consistency', category: 'LIFE', material: 'BRONZE',
    description: '주간 학습/테스트 루틴을 유지함', conditionText: '주간 루틴 유지', requiredCount: 4,
    hidden: false, active: true, family: 'HABIT', level: 'GROWTH', iconKey: 'weekly',
    teacherSummary: '학습 루틴이 형성되는 중 — 꾸준함을 계속 인정해주세요.',
    parentSafeLabel: '학습 루틴 유지', createdAt: '2025-03-01' },
  { id: 'high_focus_01', name: 'High-Focus Session', category: 'LIFE', material: 'SILVER',
    description: '높은 집중/완료 패턴이 감지됨', conditionText: '고집중 세션 감지', requiredCount: 1,
    hidden: false, active: true, family: 'HABIT', level: 'FOCUS', iconKey: 'focus',
    teacherSummary: '집중 행동이 개선됨 — 어떤 환경에서 집중이 잘 됐는지 확인해보세요.',
    parentSafeLabel: '집중 습관 개선', createdAt: '2025-03-01' },
  { id: 'reflection_complete_01', name: 'Test Reflection Complete', category: 'ASSESSMENT', material: 'IRON',
    description: '테스트 회고/복습을 완료함', conditionText: '테스트 회고 완료', requiredCount: 1,
    hidden: false, active: true, family: 'REFLECTION', level: 'BASIC', iconKey: 'reflection',
    teacherSummary: '복습 활동을 완료함 — 회고 품질(놓친 이유 정확성)을 확인해보세요.',
    parentSafeLabel: '테스트 복습 완료', createdAt: '2025-03-01' },
  { id: 'growth_streak_01', name: 'Growth Streak', category: 'GROWTH', material: 'GOLD',
    description: '연속된 성장 이벤트가 발생함', conditionText: '성장 연속 발생', requiredCount: 3,
    hidden: false, active: true, family: 'GROWTH', level: 'SIGNATURE', iconKey: 'streak',
    teacherSummary: '연속 개선 흐름 — 성취 경험이 쌓이는 시점이라 동기부여에 좋습니다.',
    parentSafeLabel: '연속 개선 흐름', createdAt: '2025-03-01' },
  { id: 'mentor_recommendation_01', name: 'Mentor Recommendation', category: 'SPECIAL', material: 'GOLD',
    description: '상담에 활용할 만한 성장 근거가 감지됨', conditionText: '교사 상담용 성장 근거', requiredCount: 1,
    hidden: false, active: true, family: 'COUNSELING', level: 'MASTER', iconKey: 'mentor',
    teacherSummary: '상담 하이라이트로 쓸 수 있는 성장 포인트가 있습니다.',
    parentSafeLabel: '선생님 추천 성장 포인트', createdAt: '2025-03-01' },
];

// ────────────────────────────────────────────────────────────
// 목 데이터 — 성장 프로필
// ────────────────────────────────────────────────────────────
// [v3-r10-r1] Tier를 AXIS 성장 단계로 갱신(구 GOLD/SILVER/BRONZE/IRON/STONE 게임 랭크 제거).
// 대표 엠블럼에 신규 카탈로그 엠블럼을 섞어 갤러리가 프리미엄 배지로 보이게 한다.

export const MOCK_GROWTH_PROFILES: StudentGrowthProfile[] = [
  { studentId: 'stu-001', nickname: '수학킹', tier: 'STRATEGY', totalSP: 1850, seasonSP: 380,
    representativeEmblemIds: ['concept_mastery_01', 'growth_streak_01', 'time_control_01'],
    currentRivalId: 'stu-002', rivalWins: 8, rivalLosses: 3,
    createdAt: '2025-03-01', updatedAt: '2025-06-15' },
  { studentId: 'stu-002', nickname: '도전자', tier: 'FOCUS', totalSP: 980, seasonSP: 220,
    representativeEmblemIds: ['steady_improvement_01', 'calc_precision_01'],
    currentRivalId: 'stu-003', rivalWins: 4, rivalLosses: 6,
    createdAt: '2025-03-15', updatedAt: '2025-06-14' },
  { studentId: 'stu-003', nickname: '꾸준이', tier: 'FOUNDATION', totalSP: 620, seasonSP: 160,
    representativeEmblemIds: ['weekly_consistency_01', 'reflection_complete_01'],
    currentRivalId: 'stu-001', rivalWins: 2, rivalLosses: 5,
    createdAt: '2025-04-01', updatedAt: '2025-06-13' },
  { studentId: 'stu-004', nickname: '조용한강자', tier: 'FOUNDATION', totalSP: 360, seasonSP: 95,
    representativeEmblemIds: ['reflection_complete_01'],
    currentRivalId: undefined, rivalWins: 0, rivalLosses: 0,
    createdAt: '2025-04-10', updatedAt: '2025-06-10' },
  { studentId: 'stu-005', nickname: '신흥강자', tier: 'SEED', totalSP: 180, seasonSP: 180,
    representativeEmblemIds: ['reflection_complete_01', 'high_focus_01'],
    currentRivalId: 'stu-004', rivalWins: 1, rivalLosses: 1,
    createdAt: '2025-05-01', updatedAt: '2025-06-12' },
];

// ────────────────────────────────────────────────────────────
// 목 데이터 — SP 이력
// ────────────────────────────────────────────────────────────

export const MOCK_SP_LOGS: StudentSPLog[] = [
  { id: 'spl-001', studentId: 'stu-001', amount: 50, reason: '엠블럼 획득: 90점 클럽', sourceType: 'ASSESSMENT', sourceId: 'emb-008', createdAt: '2025-05-10', createdBy: 'SYSTEM' },
  { id: 'spl-002', studentId: 'stu-001', amount: 100, reason: '관리자 수동 지급 - 시험 준비 노력 인정', sourceType: 'MANUAL', createdAt: '2025-05-20', createdBy: '한태준' },
  { id: 'spl-003', studentId: 'stu-001', amount: 50, reason: '엠블럼 획득: 성장 하이라이트', sourceType: 'RIVAL', sourceId: 'emb-014', createdAt: '2025-06-01', createdBy: 'SYSTEM' },
  { id: 'spl-004', studentId: 'stu-001', amount: 30, reason: '월 개근 달성 (6월)', sourceType: 'ATTENDANCE', createdAt: '2025-06-30', createdBy: 'SYSTEM' },
  { id: 'spl-005', studentId: 'stu-002', amount: 50, reason: '엠블럼 획득: 성실의 증거', sourceType: 'ATTENDANCE', sourceId: 'emb-002', createdAt: '2025-06-01', createdBy: 'SYSTEM' },
  { id: 'spl-006', studentId: 'stu-002', amount: 30, reason: '단원평가 우수 성적', sourceType: 'ASSESSMENT', createdAt: '2025-06-10', createdBy: '원장' },
  { id: 'spl-007', studentId: 'stu-003', amount: 50, reason: '엠블럼 획득: 개근왕', sourceType: 'ATTENDANCE', sourceId: 'emb-001', createdAt: '2025-05-01', createdBy: 'SYSTEM' },
  { id: 'spl-008', studentId: 'stu-004', amount: 20, reason: '첫 시험 응시', sourceType: 'ASSESSMENT', createdAt: '2025-04-20', createdBy: 'SYSTEM' },
  { id: 'spl-009', studentId: 'stu-005', amount: 50, reason: '엠블럼 획득: 첫 성장 비교', sourceType: 'RIVAL', sourceId: 'emb-012', createdAt: '2025-05-20', createdBy: 'SYSTEM' },
];

// ────────────────────────────────────────────────────────────
// 목 데이터 — 학생 엠블럼
// ────────────────────────────────────────────────────────────

export const MOCK_STUDENT_EMBLEMS: StudentEmblem[] = [
  { id: 'se-001', studentId: 'stu-001', emblemId: 'emb-001', acquiredAt: '2025-04-01', progressCount: 6, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-002', studentId: 'stu-001', emblemId: 'emb-002', acquiredAt: '2025-06-01', progressCount: 3, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-003', studentId: 'stu-001', emblemId: 'emb-003', acquiredAt: '2025-09-01', progressCount: 6, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-004', studentId: 'stu-001', emblemId: 'emb-004', acquiredAt: '2025-03-15', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-005', studentId: 'stu-001', emblemId: 'emb-008', acquiredAt: '2025-05-10', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-006', studentId: 'stu-001', emblemId: 'emb-014', acquiredAt: '2025-06-01', progressCount: 10, achieved: true, sourceType: 'RIVAL' },
  { id: 'se-007', studentId: 'stu-002', emblemId: 'emb-001', acquiredAt: '2025-04-01', progressCount: 3, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-008', studentId: 'stu-002', emblemId: 'emb-002', acquiredAt: '2025-06-01', progressCount: 3, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-009', studentId: 'stu-002', emblemId: 'emb-004', acquiredAt: '2025-03-20', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-010', studentId: 'stu-002', emblemId: 'emb-005', acquiredAt: '2025-05-15', progressCount: 5, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-011', studentId: 'stu-003', emblemId: 'emb-001', acquiredAt: '2025-05-01', progressCount: 2, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-012', studentId: 'stu-003', emblemId: 'emb-004', acquiredAt: '2025-04-10', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-013', studentId: 'stu-004', emblemId: 'emb-004', acquiredAt: '2025-04-15', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-014', studentId: 'stu-005', emblemId: 'emb-004', acquiredAt: '2025-05-05', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-015', studentId: 'stu-005', emblemId: 'emb-012', acquiredAt: '2025-05-20', progressCount: 1, achieved: true, sourceType: 'RIVAL' },
  // 진행 중 (미달성)
  { id: 'se-016', studentId: 'stu-002', emblemId: 'emb-010', acquiredAt: '', progressCount: 1, achieved: false, sourceType: 'ASSESSMENT' },
  { id: 'se-017', studentId: 'stu-003', emblemId: 'emb-005', acquiredAt: '', progressCount: 3, achieved: false, sourceType: 'ASSESSMENT' },

  // ── [v3-r10-r1] 신규 카탈로그 엠블럼 획득/진행 — stu-001(showcase 데모 주 대상) 위주 ──
  { id: 'se-101', studentId: 'stu-001', emblemId: 'calc_precision_01', acquiredAt: '2025-05-22', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-102', studentId: 'stu-001', emblemId: 'concept_mastery_01', acquiredAt: '2025-04-28', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-103', studentId: 'stu-001', emblemId: 'time_control_01', acquiredAt: '2025-05-10', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-104', studentId: 'stu-001', emblemId: 'steady_improvement_01', acquiredAt: '2025-04-12', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-105', studentId: 'stu-001', emblemId: 'reflection_complete_01', acquiredAt: '2025-05-18', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-106', studentId: 'stu-001', emblemId: 'weekly_consistency_01', acquiredAt: '2025-05-17', progressCount: 4, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-107', studentId: 'stu-001', emblemId: 'growth_streak_01', acquiredAt: '2025-05-18', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  // 진행 중(다음 성장 목표) — 잠금이 아니라 "다음 목표"로 노출
  { id: 'se-108', studentId: 'stu-001', emblemId: 'high_focus_01', acquiredAt: '', progressCount: 23, achieved: false, sourceType: 'ASSESSMENT' },
  { id: 'se-109', studentId: 'stu-001', emblemId: 'comeback_growth_01', acquiredAt: '', progressCount: 0, achieved: false, sourceType: 'ASSESSMENT' },
  { id: 'se-110', studentId: 'stu-001', emblemId: 'mentor_recommendation_01', acquiredAt: '', progressCount: 0, achieved: false, sourceType: 'MANUAL' },
  // 다른 학생 일부 획득
  { id: 'se-111', studentId: 'stu-002', emblemId: 'steady_improvement_01', acquiredAt: '2025-05-20', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-112', studentId: 'stu-002', emblemId: 'calc_precision_01', acquiredAt: '2025-06-02', progressCount: 3, achieved: true, sourceType: 'ASSESSMENT' },
  { id: 'se-113', studentId: 'stu-003', emblemId: 'weekly_consistency_01', acquiredAt: '2025-05-24', progressCount: 4, achieved: true, sourceType: 'ATTENDANCE' },
  { id: 'se-114', studentId: 'stu-003', emblemId: 'reflection_complete_01', acquiredAt: '2025-05-12', progressCount: 1, achieved: true, sourceType: 'ASSESSMENT' },
];

// ────────────────────────────────────────────────────────────
// 목 데이터 — 라이벌 관계
// ────────────────────────────────────────────────────────────

export const MOCK_RIVAL_RELATIONS: RivalRelation[] = [
  { id: 'rr-001', challengerStudentId: 'stu-001', targetStudentId: 'stu-002',
    status: 'ACTIVE', wins: 8, losses: 3, winRate: 72.7, streak: 3,
    createdAt: '2025-04-01', nextChangeAvailableAt: '2025-07-01' },
  { id: 'rr-002', challengerStudentId: 'stu-002', targetStudentId: 'stu-003',
    status: 'ACTIVE', wins: 4, losses: 6, winRate: 40.0, streak: -2,
    createdAt: '2025-04-15', nextChangeAvailableAt: '2025-07-15' },
  { id: 'rr-003', challengerStudentId: 'stu-003', targetStudentId: 'stu-001',
    status: 'ACTIVE', wins: 2, losses: 5, winRate: 28.6, streak: -1,
    createdAt: '2025-05-01', nextChangeAvailableAt: '2025-08-01' },
  { id: 'rr-004', challengerStudentId: 'stu-005', targetStudentId: 'stu-004',
    status: 'ACTIVE', wins: 1, losses: 1, winRate: 50.0, streak: 1,
    createdAt: '2025-05-10', nextChangeAvailableAt: '2025-08-10' },
];
