// AXIS LMS v1.2 - GrowthContext (성장관리 Foundation v1)
// 성장 프로필 / 엠블럼 / 라이벌 상태 관리.
// 주의: 학생/보호자 포털 화면을 만들지 않는다. 관리자 Back Office 전용.
// Assessment IF placeholder 연동 준비: linkIfAnalysis() — 다음 단계에서 실제 자동화 연결.

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  MOCK_GROWTH_PROFILES,
  MOCK_EMBLEMS,
  MOCK_STUDENT_EMBLEMS,
  MOCK_RIVAL_RELATIONS,
  calcTierFromSP,
  StudentGrowthProfile,
  Emblem,
  StudentEmblem,
  RivalRelation,
  EmblemSourceType,
} from '@/lib/growthData';

// ────────────────────────────────────────────────────────────
// Context 타입
// ────────────────────────────────────────────────────────────

interface GrowthContextType {
  // 원본 데이터
  profiles: StudentGrowthProfile[];
  emblems: Emblem[];
  studentEmblems: StudentEmblem[];
  rivalRelations: RivalRelation[];

  // 프로필 조회
  getProfile: (studentId: string) => StudentGrowthProfile | undefined;

  // 엠블럼 조회
  getStudentEmblems: (studentId: string) => StudentEmblem[];
  getAchievedEmblems: (studentId: string) => StudentEmblem[];
  getRecentEmblems: (studentId: string, limit?: number) => StudentEmblem[];
  getEmblemById: (emblemId: string) => Emblem | undefined;

  // SP / 티어 (mock 수동 지급)
  addStudentSP: (studentId: string, amount: number) => { ok: boolean; reason?: string };

  // 엠블럼 수동 지급 (mock)
  awardEmblemMock: (studentId: string, emblemId: string, sourceType: EmblemSourceType) => { ok: boolean; reason?: string };

  // 엠블럼 관리
  addEmblem: (data: Omit<Emblem, 'id' | 'createdAt'>) => { ok: boolean; reason?: string };
  updateEmblem: (emblemId: string, patch: Partial<Emblem>) => { ok: boolean; reason?: string };
  toggleEmblemActive: (emblemId: string) => { ok: boolean };
  toggleEmblemHidden: (emblemId: string) => { ok: boolean };

  // 라이벌 관리
  getRivalInfo: (studentId: string) => {
    currentRivalProfile?: StudentGrowthProfile;
    challengersCount: number;
    relation?: RivalRelation;
  };
  addRivalWin: (relationId: string) => { ok: boolean; reason?: string };
  addRivalLoss: (relationId: string) => { ok: boolean; reason?: string };
  endRivalRelation: (relationId: string) => { ok: boolean };

  // 통계
  getOverviewStats: () => {
    profileCount: number;
    totalEmblemsIssued: number;
    seasonSPTotal: number;
    activeRivals: number;
    hiddenEmblems: number;
  };

  // Assessment IF placeholder 연동 준비 — 다음 단계에서 자동화
  linkIfAnalysis: (studentId: string, examId: string, ifKeys: string[]) => void;
}

const GrowthContext = createContext<GrowthContextType | null>(null);

// ────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────

export function GrowthProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<StudentGrowthProfile[]>(MOCK_GROWTH_PROFILES);
  const [emblems, setEmblems] = useState<Emblem[]>(MOCK_EMBLEMS);
  const [studentEmblems, setStudentEmblems] = useState<StudentEmblem[]>(MOCK_STUDENT_EMBLEMS);
  const [rivalRelations, setRivalRelations] = useState<RivalRelation[]>(MOCK_RIVAL_RELATIONS);

  // ── 프로필 조회
  const getProfile = useCallback((studentId: string) =>
    profiles.find(p => p.studentId === studentId),
  [profiles]);

  // ── 엠블럼 조회
  const getStudentEmblems = useCallback((studentId: string) =>
    studentEmblems.filter(se => se.studentId === studentId),
  [studentEmblems]);

  const getAchievedEmblems = useCallback((studentId: string) =>
    studentEmblems.filter(se => se.studentId === studentId && se.achieved),
  [studentEmblems]);

  const getRecentEmblems = useCallback((studentId: string, limit = 5) =>
    studentEmblems
      .filter(se => se.studentId === studentId && se.achieved)
      .sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt))
      .slice(0, limit),
  [studentEmblems]);

  const getEmblemById = useCallback((emblemId: string) =>
    emblems.find(e => e.id === emblemId),
  [emblems]);

  // ── SP / 티어
  const addStudentSP = useCallback((studentId: string, amount: number): { ok: boolean; reason?: string } => {
    if (amount <= 0) return { ok: false, reason: 'SP는 양수여야 합니다.' };
    setProfiles(prev => prev.map(p => {
      if (p.studentId !== studentId) return p;
      const newTotal = p.totalSP + amount;
      return {
        ...p,
        totalSP: newTotal,
        seasonSP: p.seasonSP + amount,
        tier: calcTierFromSP(newTotal),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
    }));
    return { ok: true };
  }, []);

  // ── 엠블럼 수동 지급 (mock)
  const awardEmblemMock = useCallback((
    studentId: string,
    emblemId: string,
    sourceType: EmblemSourceType,
  ): { ok: boolean; reason?: string } => {
    const emblem = emblems.find(e => e.id === emblemId);
    if (!emblem) return { ok: false, reason: '엠블럼을 찾을 수 없습니다.' };
    if (!emblem.active) return { ok: false, reason: '비활성 엠블럼입니다.' };
    const already = studentEmblems.find(se => se.studentId === studentId && se.emblemId === emblemId && se.achieved);
    if (already) return { ok: false, reason: '이미 획득한 엠블럼입니다.' };

    const newRecord: StudentEmblem = {
      id: `se-${Date.now()}`,
      studentId,
      emblemId,
      acquiredAt: new Date().toISOString().slice(0, 10),
      progressCount: 1,
      achieved: true,
      sourceType,
    };
    setStudentEmblems(prev => [...prev, newRecord]);
    // 엠블럼 획득 시 +50 SP 자동 지급 (mock 규칙)
    addStudentSP(studentId, 50);
    return { ok: true };
  }, [emblems, studentEmblems, addStudentSP]);

  // ── 엠블럼 관리 (삭제 없음 — 비활성으로만 처리)
  const addEmblem = useCallback((data: Omit<Emblem, 'id' | 'createdAt'>): { ok: boolean; reason?: string } => {
    if (!data.name.trim()) return { ok: false, reason: '엠블럼 이름을 입력하세요.' };
    const newEmblem: Emblem = {
      ...data,
      id: `emb-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setEmblems(prev => [...prev, newEmblem]);
    return { ok: true };
  }, []);

  const updateEmblem = useCallback((emblemId: string, patch: Partial<Emblem>): { ok: boolean; reason?: string } => {
    setEmblems(prev => prev.map(e => e.id === emblemId ? { ...e, ...patch } : e));
    return { ok: true };
  }, []);

  const toggleEmblemActive = useCallback((emblemId: string): { ok: boolean } => {
    setEmblems(prev => prev.map(e => e.id === emblemId ? { ...e, active: !e.active } : e));
    return { ok: true };
  }, []);

  const toggleEmblemHidden = useCallback((emblemId: string): { ok: boolean } => {
    setEmblems(prev => prev.map(e => e.id === emblemId ? { ...e, hidden: !e.hidden } : e));
    return { ok: true };
  }, []);

  // ── 라이벌 관리
  const getRivalInfo = useCallback((studentId: string) => {
    const profile = profiles.find(p => p.studentId === studentId);
    const relation = rivalRelations.find(r => r.challengerStudentId === studentId && r.status === 'ACTIVE');
    const currentRivalProfile = profile?.currentRivalId
      ? profiles.find(p => p.studentId === profile.currentRivalId)
      : undefined;
    // 나를 라이벌로 지정한 학생 수 (target 기준 — 학생에게는 노출 안 함, 관리자만)
    const challengersCount = rivalRelations.filter(
      r => r.targetStudentId === studentId && r.status === 'ACTIVE',
    ).length;
    return { currentRivalProfile, challengersCount, relation };
  }, [profiles, rivalRelations]);

  const addRivalWin = useCallback((relationId: string): { ok: boolean; reason?: string } => {
    const rel = rivalRelations.find(r => r.id === relationId);
    if (!rel) return { ok: false, reason: '라이벌 관계를 찾을 수 없습니다.' };
    const newWins = rel.wins + 1;
    const total = newWins + rel.losses;
    const newStreak = rel.streak >= 0 ? rel.streak + 1 : 1;
    setRivalRelations(prev => prev.map(r => r.id === relationId ? {
      ...r, wins: newWins,
      winRate: total > 0 ? Math.round((newWins / total) * 1000) / 10 : 0,
      streak: newStreak,
    } : r));
    setProfiles(prev => prev.map(p =>
      p.studentId === rel.challengerStudentId ? { ...p, rivalWins: p.rivalWins + 1 } : p,
    ));
    return { ok: true };
  }, [rivalRelations]);

  const addRivalLoss = useCallback((relationId: string): { ok: boolean; reason?: string } => {
    const rel = rivalRelations.find(r => r.id === relationId);
    if (!rel) return { ok: false, reason: '라이벌 관계를 찾을 수 없습니다.' };
    const newLosses = rel.losses + 1;
    const total = rel.wins + newLosses;
    const newStreak = rel.streak <= 0 ? rel.streak - 1 : -1;
    setRivalRelations(prev => prev.map(r => r.id === relationId ? {
      ...r, losses: newLosses,
      winRate: total > 0 ? Math.round((rel.wins / total) * 1000) / 10 : 0,
      streak: newStreak,
    } : r));
    setProfiles(prev => prev.map(p =>
      p.studentId === rel.challengerStudentId ? { ...p, rivalLosses: p.rivalLosses + 1 } : p,
    ));
    return { ok: true };
  }, [rivalRelations]);

  const endRivalRelation = useCallback((relationId: string): { ok: boolean } => {
    setRivalRelations(prev => prev.map(r => r.id === relationId ? { ...r, status: 'ENDED' } : r));
    return { ok: true };
  }, []);

  // ── 통계
  const getOverviewStats = useCallback(() => ({
    profileCount: profiles.length,
    totalEmblemsIssued: studentEmblems.filter(se => se.achieved).length,
    seasonSPTotal: profiles.reduce((s, p) => s + p.seasonSP, 0),
    activeRivals: rivalRelations.filter(r => r.status === 'ACTIVE').length,
    hiddenEmblems: emblems.filter(e => e.hidden && e.active).length,
  }), [profiles, studentEmblems, rivalRelations, emblems]);

  // ── Assessment IF placeholder 연동 준비
  // 다음 단계에서 AssessmentContext와 연동하여 ifKeys 기반 엠블럼 진행도 업데이트 예정
  const linkIfAnalysis = useCallback((_studentId: string, _examId: string, _ifKeys: string[]) => {
    // TODO(growth-if): IF 분석 결과 → 연동 엠블럼 progressCount 자동 업데이트
    // ifKeys 예: ['calculationError', 'conceptLack', 'timeShortage', 'carelessMistake']
  }, []);

  return (
    <GrowthContext.Provider value={{
      profiles, emblems, studentEmblems, rivalRelations,
      getProfile,
      getStudentEmblems, getAchievedEmblems, getRecentEmblems, getEmblemById,
      addStudentSP, awardEmblemMock,
      addEmblem, updateEmblem, toggleEmblemActive, toggleEmblemHidden,
      getRivalInfo, addRivalWin, addRivalLoss, endRivalRelation,
      getOverviewStats,
      linkIfAnalysis,
    }}>
      {children}
    </GrowthContext.Provider>
  );
}

export function useGrowth(): GrowthContextType {
  const ctx = useContext(GrowthContext);
  if (!ctx) throw new Error('useGrowth must be used within GrowthProvider');
  return ctx;
}
