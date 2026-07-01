// AXIS LMS v1.2 — Phase 2F: rivalSeasonData.ts
// Rival 시즌 데이터 — mock 구조
//
// Phase 2F 정책:
//   - 관리자만 전체 연결 관계 조회 가능
//   - 학생은 닉네임 기반 자기 데이터만 조회
//   - 누가 나를 Rival로 지정했는지 학생에게 노출 금지

export type RivalSeasonStatus = '예정' | '진행중' | '종료';

export interface RivalSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: RivalSeasonStatus;
  targetGrades: string[];          // ['고3'] 등
  targetClassIds: string[];
  participantCount: number;
  activeRivalCount: number;
  // 승패 기준
  winCondition: string;
  loseCondition: string;
  drawCondition: string;
  // 보상
  streakBonus: string;             // 예: '연승 3회 시 SP +50'
  revengeBonus: string;            // 예: '복수 성공 시 SP +30'
  spReward: {
    win: number;
    loss: number;
    draw: number;
  };
  emblemCondition: string;
  createdAt: string;
  createdBy: string;
}

// ─── Mock 시즌 데이터 ────────────────────────────────────────────────
export const MOCK_RIVAL_SEASONS: RivalSeason[] = [
  {
    id: 'season-001',
    name: '2024 AXIS Summer Rival',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: '종료',
    targetGrades: ['고3'],
    targetClassIds: ['cls-001', 'cls-006', 'cls-008'],
    participantCount: 24,
    activeRivalCount: 12,
    winCondition: '단원평가 점수 상대보다 5점 이상 높을 때',
    loseCondition: '단원평가 점수 상대보다 5점 이상 낮을 때',
    drawCondition: '5점 이내 차이',
    streakBonus: '연승 3회 시 SP +50, 연승 5회 시 SP +100',
    revengeBonus: '이전 패배 상대 승리 시 SP +30',
    spReward: { win: 20, loss: 5, draw: 10 },
    emblemCondition: '시즌 5승 이상: "Rival Conqueror" 엠블럼 지급',
    createdAt: '2024-05-20',
    createdBy: '한태준',
  },
  {
    id: 'season-002',
    name: '2024 AXIS Fall Rival',
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    status: '종료',
    targetGrades: ['고2', '고3'],
    targetClassIds: ['cls-001', 'cls-002', 'cls-004', 'cls-006'],
    participantCount: 32,
    activeRivalCount: 16,
    winCondition: '전국모의 수학 점수 상대보다 높을 때',
    loseCondition: '전국모의 수학 점수 상대보다 낮을 때',
    drawCondition: '동점',
    streakBonus: '연승 3회 시 SP +60',
    revengeBonus: '복수 성공 시 SP +40',
    spReward: { win: 25, loss: 5, draw: 10 },
    emblemCondition: '시즌 승률 70% 이상: "Fall Champion" 엠블럼',
    createdAt: '2024-08-25',
    createdBy: '한태준',
  },
  {
    id: 'season-003',
    name: '2025 AXIS Spring Rival',
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    status: '진행중',
    targetGrades: ['고1', '고2', '고3'],
    targetClassIds: ['cls-001', 'cls-002', 'cls-003', 'cls-004'],
    participantCount: 18,
    activeRivalCount: 9,
    winCondition: '단원평가 100점 만점 기준 점수 비교',
    loseCondition: '상대 점수가 더 높을 때',
    drawCondition: '동점 또는 5점 이내',
    streakBonus: '연승 3회: SP +50 / 연승 5회: SP +120 + 엠블럼 후보',
    revengeBonus: '복수 성공: SP +35',
    spReward: { win: 20, loss: 5, draw: 8 },
    emblemCondition: '시즌 MVP (최다 승리 학생): "Spring MVP" 특별 엠블럼',
    createdAt: '2025-02-15',
    createdBy: '한태준',
  },
];

// ─── 활성 시즌 ────────────────────────────────────────────────────────
export function getActiveSeason(): RivalSeason | null {
  return MOCK_RIVAL_SEASONS.find(s => s.status === '진행중') ?? null;
}

// ─── 종료 시즌 목록 ──────────────────────────────────────────────────
export function getEndedSeasons(): RivalSeason[] {
  return MOCK_RIVAL_SEASONS.filter(s => s.status === '종료');
}
