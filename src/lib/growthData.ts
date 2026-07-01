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

export type StudentTier =
  | 'UNRANKED' | 'WOOD' | 'STONE' | 'BRONZE' | 'IRON' | 'SILVER' | 'GOLD' | 'DIAMOND';

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
  createdAt: string;
}

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
  streak: number;                // 양수: 연승, 음수: 연패
  createdAt: string;
  nextChangeAvailableAt: string;
}

// ────────────────────────────────────────────────────────────
// 상수 / 레이블
// ────────────────────────────────────────────────────────────

export const TIER_LABELS: Record<StudentTier, string> = {
  UNRANKED: '미분류', WOOD: '우드', STONE: '스톤', BRONZE: '브론즈',
  IRON: '아이언', SILVER: '실버', GOLD: '골드', DIAMOND: '다이아몬드',
};

export const TIER_COLORS: Record<StudentTier, string> = {
  UNRANKED: 'oklch(0.6 0.01 250)',
  WOOD:     'oklch(0.45 0.08 55)',
  STONE:    'oklch(0.5 0.02 250)',
  BRONZE:   'oklch(0.55 0.1 55)',
  IRON:     'oklch(0.35 0.02 250)',
  SILVER:   'oklch(0.65 0.05 240)',
  GOLD:     'oklch(0.72 0.16 80)',
  DIAMOND:  'oklch(0.35 0.10 262)',
};

export const CATEGORY_LABELS: Record<EmblemCategory, string> = {
  LIFE: '생활', GROWTH: '성장', ASSESSMENT: '시험',
  RIVAL: '라이벌', SKILL: '스킬', SPECIAL: '특별',
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

export const CATEGORY_BADGE: Record<EmblemCategory, { bg: string; text: string }> = {
  LIFE:       { bg: '#F0FDF4', text: '#166534' },
  GROWTH:     { bg: '#EFF6FF', text: '#1E40AF' },
  ASSESSMENT: { bg: '#FFF7ED', text: '#9A3412' },
  RIVAL:      { bg: '#FEF2F2', text: '#991B1B' },
  SKILL:      { bg: '#E7EBF3', text: '#081F4D' },
  SPECIAL:    { bg: '#FFFBEB', text: '#92400E' },
};

export const SOURCE_TYPE_LABELS: Record<GrowthSourceType, string> = {
  ATTENDANCE: '출결', ASSESSMENT: '성적', ENROLLMENT: '수강',
  RIVAL: '라이벌', MANUAL: '수동 지급',
};

export const SP_TIER_THRESHOLDS: Record<StudentTier, number> = {
  UNRANKED: 0, WOOD: 50, STONE: 150, BRONZE: 350,
  IRON: 700, SILVER: 1200, GOLD: 2000, DIAMOND: 3500,
};

export function calcTierFromSP(totalSP: number): StudentTier {
  const tiers: StudentTier[] = ['DIAMOND', 'GOLD', 'SILVER', 'IRON', 'BRONZE', 'STONE', 'WOOD'];
  for (const tier of tiers) {
    if (totalSP >= SP_TIER_THRESHOLDS[tier]) return tier;
  }
  return 'UNRANKED';
}

// ────────────────────────────────────────────────────────────
// 목 데이터 — 엠블럼 (수정 6: 카테고리별 보강)
// ────────────────────────────────────────────────────────────

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
  { id: 'emb-012', name: '첫 승리', category: 'RIVAL', material: 'STONE',
    description: '라이벌 대결 첫 승리', conditionText: '라이벌 대결 1승', requiredCount: 1,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-013', name: '연승 질주', category: 'RIVAL', material: 'BRONZE',
    description: '라이벌 대결 3연승', conditionText: '라이벌 3연승', requiredCount: 3,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-014', name: '라이벌 챔피언', category: 'RIVAL', material: 'GOLD',
    description: '라이벌 대결 10승 달성', conditionText: '라이벌 총 10승 이상', requiredCount: 10,
    hidden: false, active: true, createdAt: '2025-03-01' },
  { id: 'emb-023', name: '리벤지 성공', category: 'RIVAL', material: 'SILVER',
    description: '연패 후 연승 전환', conditionText: '연패 후 3연승 달성', requiredCount: 3,
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
    description: '시즌 내 처음으로 GOLD 티어 달성', conditionText: '이번 시즌 첫 GOLD 달성', requiredCount: 1,
    hidden: true, active: true, createdAt: '2025-03-01' },
];

// ────────────────────────────────────────────────────────────
// 목 데이터 — 성장 프로필
// ────────────────────────────────────────────────────────────

export const MOCK_GROWTH_PROFILES: StudentGrowthProfile[] = [
  { studentId: 'stu-001', nickname: '수학킹', tier: 'GOLD', totalSP: 1250, seasonSP: 380,
    representativeEmblemIds: ['emb-008', 'emb-003', 'emb-014'],
    currentRivalId: 'stu-002', rivalWins: 8, rivalLosses: 3,
    createdAt: '2025-03-01', updatedAt: '2025-06-15' },
  { studentId: 'stu-002', nickname: '도전자', tier: 'SILVER', totalSP: 870, seasonSP: 220,
    representativeEmblemIds: ['emb-002', 'emb-005'],
    currentRivalId: 'stu-003', rivalWins: 4, rivalLosses: 6,
    createdAt: '2025-03-15', updatedAt: '2025-06-14' },
  { studentId: 'stu-003', nickname: '꾸준이', tier: 'BRONZE', totalSP: 540, seasonSP: 160,
    representativeEmblemIds: ['emb-001', 'emb-004'],
    currentRivalId: 'stu-001', rivalWins: 2, rivalLosses: 5,
    createdAt: '2025-04-01', updatedAt: '2025-06-13' },
  { studentId: 'stu-004', nickname: '조용한강자', tier: 'IRON', totalSP: 310, seasonSP: 95,
    representativeEmblemIds: ['emb-004'],
    currentRivalId: undefined, rivalWins: 0, rivalLosses: 0,
    createdAt: '2025-04-10', updatedAt: '2025-06-10' },
  { studentId: 'stu-005', nickname: '신흥강자', tier: 'STONE', totalSP: 180, seasonSP: 180,
    representativeEmblemIds: ['emb-004', 'emb-012'],
    currentRivalId: 'stu-004', rivalWins: 1, rivalLosses: 1,
    createdAt: '2025-05-01', updatedAt: '2025-06-12' },
];

// ────────────────────────────────────────────────────────────
// 목 데이터 — SP 이력
// ────────────────────────────────────────────────────────────

export const MOCK_SP_LOGS: StudentSPLog[] = [
  { id: 'spl-001', studentId: 'stu-001', amount: 50, reason: '엠블럼 획득: 90점 클럽', sourceType: 'ASSESSMENT', sourceId: 'emb-008', createdAt: '2025-05-10', createdBy: 'SYSTEM' },
  { id: 'spl-002', studentId: 'stu-001', amount: 100, reason: '관리자 수동 지급 - 시험 준비 노력 인정', sourceType: 'MANUAL', createdAt: '2025-05-20', createdBy: '한태준' },
  { id: 'spl-003', studentId: 'stu-001', amount: 50, reason: '엠블럼 획득: 라이벌 챔피언', sourceType: 'RIVAL', sourceId: 'emb-014', createdAt: '2025-06-01', createdBy: 'SYSTEM' },
  { id: 'spl-004', studentId: 'stu-001', amount: 30, reason: '월 개근 달성 (6월)', sourceType: 'ATTENDANCE', createdAt: '2025-06-30', createdBy: 'SYSTEM' },
  { id: 'spl-005', studentId: 'stu-002', amount: 50, reason: '엠블럼 획득: 성실의 증거', sourceType: 'ATTENDANCE', sourceId: 'emb-002', createdAt: '2025-06-01', createdBy: 'SYSTEM' },
  { id: 'spl-006', studentId: 'stu-002', amount: 30, reason: '단원평가 우수 성적', sourceType: 'ASSESSMENT', createdAt: '2025-06-10', createdBy: '원장' },
  { id: 'spl-007', studentId: 'stu-003', amount: 50, reason: '엠블럼 획득: 개근왕', sourceType: 'ATTENDANCE', sourceId: 'emb-001', createdAt: '2025-05-01', createdBy: 'SYSTEM' },
  { id: 'spl-008', studentId: 'stu-004', amount: 20, reason: '첫 시험 응시', sourceType: 'ASSESSMENT', createdAt: '2025-04-20', createdBy: 'SYSTEM' },
  { id: 'spl-009', studentId: 'stu-005', amount: 50, reason: '엠블럼 획득: 첫 승리', sourceType: 'RIVAL', sourceId: 'emb-012', createdAt: '2025-05-20', createdBy: 'SYSTEM' },
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
