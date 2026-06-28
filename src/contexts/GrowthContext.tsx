// AXIS LMS v1.2 - GrowthContext (Growth Showcase v2)
// SP 이력 / 엠블럼 진행도 / 출결 Hook / IF placeholder Hook 보강.
// 관리자 Back Office 전용. 학생/보호자 포털 없음.

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  MOCK_GROWTH_PROFILES, MOCK_EMBLEMS, MOCK_STUDENT_EMBLEMS,
  MOCK_RIVAL_RELATIONS, MOCK_SP_LOGS,
  calcTierFromSP,
  StudentGrowthProfile, Emblem, StudentEmblem, RivalRelation,
  StudentSPLog, GrowthSourceType,
} from '@/lib/growthData';

// ────────────────────────────────────────────────────────────
// Context 타입
// ────────────────────────────────────────────────────────────

interface GrowthContextType {
  // 원본 상태
  profiles: StudentGrowthProfile[];
  emblems: Emblem[];
  studentEmblems: StudentEmblem[];
  rivalRelations: RivalRelation[];
  spLogs: StudentSPLog[];

  // ── 프로필 조회 (수정 1)
  getProfile: (studentId: string) => StudentGrowthProfile | undefined;
  /** alias: getGrowthProfile */
  getGrowthProfile: (studentId: string) => StudentGrowthProfile | undefined;

  // ── 엠블럼 조회 (수정 1)
  getStudentEmblems: (studentId: string) => StudentEmblem[];
  getAchievedEmblems: (studentId: string) => StudentEmblem[];
  getRecentEmblems: (studentId: string, limit?: number) => StudentEmblem[];
  getEmblemById: (emblemId: string) => Emblem | undefined;
  /** 대표 엠블럼 3개 Emblem 객체 반환 */
  getRepresentativeEmblems: (studentId: string) => Emblem[];
  /** 대표 엠블럼 설정 (최대 3개) */
  setRepresentativeEmblems: (studentId: string, emblemIds: string[]) => { ok: boolean; reason?: string };

  // ── SP 이력 조회
  getSPLogs: (studentId: string, limit?: number) => StudentSPLog[];

  // ── SP 지급 (수정 2: 이력 포함)
  addStudentSP: (
    studentId: string,
    amount: number,
    reason: string,
    sourceType: GrowthSourceType,
    sourceId?: string,
    createdBy?: string,
  ) => { ok: boolean; reason?: string };

  // ── 엠블럼 지급/진행도 (수정 1)
  awardEmblemMock: (
    studentId: string,
    emblemId: string,
    sourceType: GrowthSourceType,
    sourceId?: string,
    createdBy?: string,
  ) => { ok: boolean; reason?: string };
  /** 엠블럼 진행도 증가 (acquired되지 않은 경우) */
  updateEmblemProgress: (studentId: string, emblemId: string, amount: number) => { ok: boolean };

  // ── 엠블럼 정책 관리
  addEmblem: (data: Omit<Emblem, 'id' | 'createdAt'>) => { ok: boolean; reason?: string };
  updateEmblem: (emblemId: string, patch: Partial<Emblem>) => { ok: boolean; reason?: string };
  toggleEmblemActive: (emblemId: string) => { ok: boolean };
  toggleEmblemHidden: (emblemId: string) => { ok: boolean };

  // ── 라이벌 (수정 1)
  getRivalInfo: (studentId: string) => {
    currentRivalProfile?: StudentGrowthProfile;
    challengersCount: number;
    relation?: RivalRelation;
  };
  /** alias: getRivalSummary */
  getRivalSummary: (studentId: string) => {
    currentRivalProfile?: StudentGrowthProfile;
    challengersCount: number;
    relation?: RivalRelation;
  };
  /**
   * 나를 라이벌로 지정한 학생 목록.
   * 관리자 전용 — 학생에게 절대 노출하지 않음.
   */
  getStudentsTargetingMe: (studentId: string) => string[];
  addRivalWin: (relationId: string) => { ok: boolean; reason?: string };
  addRivalLoss: (relationId: string) => { ok: boolean; reason?: string };
  endRivalRelation: (relationId: string) => { ok: boolean };

  // ── 통계
  getOverviewStats: () => {
    profileCount: number;
    totalEmblemsIssued: number;
    seasonSPTotal: number;
    activeRivals: number;
    hiddenEmblems: number;
  };

  // ── 출결 Hook 준비 (수정 4)
  /**
   * 출결 이벤트 → 성장 hook.
   * AttendanceContext에서 호출 가능한 구조. 실제 자동화는 mock 수준.
   * 결석/조퇴에 SP 차감 없음 (이번 단계 정책).
   */
  onAttendanceEvent: (params: {
    studentId: string;
    eventType: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'MAKEUP';
    date: string;
    monthlyPerfect?: boolean;   // 해당 월 전 출석
    consecutiveMonths?: number; // 연속 개근 개월 수
    totalPresentCount?: number; // 누적 출석 수
  }) => void;

  // ── 성적/IF Hook 준비 (수정 5)
  /**
   * Assessment IF 분석 → 성장 hook.
   * AssessmentContext에서 채점 완료 후 호출 가능한 구조.
   */
  onIfAnalysisResult: (params: {
    studentId: string;
    examId: string;
    ifFlags: {
      calculationError: boolean;
      conceptLack: boolean;
      timeShortage: boolean;
      carelessMistake: boolean;
    };
  }) => void;
  /** IF 개선 기록 mock (수동 또는 자동 호출) */
  recordIfReflectionMock: (
    studentId: string,
    ifKey: 'calculationError' | 'conceptLack' | 'timeShortage' | 'carelessMistake',
    improved: boolean,
  ) => void;

  /** @deprecated use onIfAnalysisResult */
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
  const [spLogs, setSPLogs] = useState<StudentSPLog[]>(MOCK_SP_LOGS);

  // ── 프로필 조회
  const getProfile = useCallback((studentId: string) =>
    profiles.find(p => p.studentId === studentId), [profiles]);
  const getGrowthProfile = getProfile;

  // ── 엠블럼 조회
  const getStudentEmblems = useCallback((studentId: string) =>
    studentEmblems.filter(se => se.studentId === studentId), [studentEmblems]);

  const getAchievedEmblems = useCallback((studentId: string) =>
    studentEmblems.filter(se => se.studentId === studentId && se.achieved), [studentEmblems]);

  const getRecentEmblems = useCallback((studentId: string, limit = 5) =>
    studentEmblems
      .filter(se => se.studentId === studentId && se.achieved)
      .sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt))
      .slice(0, limit), [studentEmblems]);

  const getEmblemById = useCallback((emblemId: string) =>
    emblems.find(e => e.id === emblemId), [emblems]);

  const getRepresentativeEmblems = useCallback((studentId: string): Emblem[] => {
    const profile = profiles.find(p => p.studentId === studentId);
    if (!profile) return [];
    return profile.representativeEmblemIds
      .map(id => emblems.find(e => e.id === id))
      .filter((e): e is Emblem => !!e);
  }, [profiles, emblems]);

  const setRepresentativeEmblems = useCallback((studentId: string, emblemIds: string[]): { ok: boolean; reason?: string } => {
    if (emblemIds.length > 3) return { ok: false, reason: '대표 엠블럼은 최대 3개입니다.' };
    setProfiles(prev => prev.map(p =>
      p.studentId === studentId
        ? { ...p, representativeEmblemIds: emblemIds.slice(0, 3), updatedAt: new Date().toISOString().slice(0, 10) }
        : p,
    ));
    return { ok: true };
  }, []);

  // ── SP 이력 조회
  const getSPLogs = useCallback((studentId: string, limit = 10) =>
    spLogs
      .filter(l => l.studentId === studentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit), [spLogs]);

  // ── SP 지급 (이력 포함, 수정 2)
  const addStudentSP = useCallback((
    studentId: string,
    amount: number,
    reason = 'SP 지급',
    sourceType: GrowthSourceType = 'MANUAL',
    sourceId?: string,
    createdBy = 'SYSTEM',
  ): { ok: boolean; reason?: string } => {
    if (amount <= 0) return { ok: false, reason: 'SP는 양수여야 합니다.' };
    const today = new Date().toISOString().slice(0, 10);
    // 프로필 업데이트
    setProfiles(prev => prev.map(p => {
      if (p.studentId !== studentId) return p;
      const newTotal = p.totalSP + amount;
      return { ...p, totalSP: newTotal, seasonSP: p.seasonSP + amount, tier: calcTierFromSP(newTotal), updatedAt: today };
    }));
    // SP 로그 생성 (삭제 없음)
    const log: StudentSPLog = {
      id: `spl-${Date.now()}`,
      studentId, amount, reason, sourceType, sourceId, createdAt: today, createdBy,
    };
    setSPLogs(prev => [...prev, log]);
    return { ok: true };
  }, []);

  // ── 엠블럼 지급 (수정 1)
  const awardEmblemMock = useCallback((
    studentId: string,
    emblemId: string,
    sourceType: GrowthSourceType = 'MANUAL',
    sourceId?: string,
    createdBy = 'SYSTEM',
  ): { ok: boolean; reason?: string } => {
    const emblem = emblems.find(e => e.id === emblemId);
    if (!emblem) return { ok: false, reason: '엠블럼을 찾을 수 없습니다.' };
    if (!emblem.active) return { ok: false, reason: '비활성 엠블럼입니다.' };
    const already = studentEmblems.find(se => se.studentId === studentId && se.emblemId === emblemId && se.achieved);
    if (already) return { ok: false, reason: '이미 획득한 엠블럼입니다.' };

    const today = new Date().toISOString().slice(0, 10);
    const newRecord: StudentEmblem = {
      id: `se-${Date.now()}`,
      studentId, emblemId, acquiredAt: today,
      progressCount: emblem.requiredCount, achieved: true, sourceType, sourceId,
    };
    setStudentEmblems(prev => {
      // 기존 진행 중 레코드 교체 또는 새로 추가
      const existing = prev.findIndex(se => se.studentId === studentId && se.emblemId === emblemId && !se.achieved);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });
    // 엠블럼 획득 시 +50 SP 자동 지급
    addStudentSP(studentId, 50, `엠블럼 획득: ${emblem.name}`, 'MANUAL', emblemId, createdBy);
    return { ok: true };
  }, [emblems, studentEmblems, addStudentSP]);

  // ── 엠블럼 진행도 증가 (수정 1)
  const updateEmblemProgress = useCallback((studentId: string, emblemId: string, amount: number): { ok: boolean } => {
    setStudentEmblems(prev => {
      const existing = prev.find(se => se.studentId === studentId && se.emblemId === emblemId && !se.achieved);
      if (existing) {
        return prev.map(se =>
          se.id === existing.id ? { ...se, progressCount: se.progressCount + amount } : se,
        );
      }
      // 없으면 신규 진행 레코드 생성
      const newRecord: StudentEmblem = {
        id: `se-${Date.now()}`, studentId, emblemId, acquiredAt: '',
        progressCount: amount, achieved: false, sourceType: 'SYSTEM' as GrowthSourceType,
      };
      return [...prev, newRecord];
    });
    return { ok: true };
  }, []);

  // ── 엠블럼 정책 관리
  const addEmblem = useCallback((data: Omit<Emblem, 'id' | 'createdAt'>): { ok: boolean; reason?: string } => {
    if (!data.name.trim()) return { ok: false, reason: '엠블럼 이름을 입력하세요.' };
    setEmblems(prev => [...prev, { ...data, id: `emb-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]);
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

  // ── 라이벌 (수정 1)
  const getRivalInfo = useCallback((studentId: string) => {
    const profile = profiles.find(p => p.studentId === studentId);
    const relation = rivalRelations.find(r => r.challengerStudentId === studentId && r.status === 'ACTIVE');
    const currentRivalProfile = profile?.currentRivalId
      ? profiles.find(p => p.studentId === profile.currentRivalId)
      : undefined;
    const challengersCount = rivalRelations.filter(r => r.targetStudentId === studentId && r.status === 'ACTIVE').length;
    return { currentRivalProfile, challengersCount, relation };
  }, [profiles, rivalRelations]);

  const getRivalSummary = getRivalInfo;

  const getStudentsTargetingMe = useCallback((studentId: string): string[] =>
    rivalRelations
      .filter(r => r.targetStudentId === studentId && r.status === 'ACTIVE')
      .map(r => r.challengerStudentId),
  [rivalRelations]);

  const addRivalWin = useCallback((relationId: string): { ok: boolean; reason?: string } => {
    const rel = rivalRelations.find(r => r.id === relationId);
    if (!rel) return { ok: false, reason: '라이벌 관계를 찾을 수 없습니다.' };
    const newWins = rel.wins + 1;
    const total = newWins + rel.losses;
    setRivalRelations(prev => prev.map(r => r.id === relationId ? {
      ...r, wins: newWins,
      winRate: total > 0 ? Math.round((newWins / total) * 1000) / 10 : 0,
      streak: rel.streak >= 0 ? rel.streak + 1 : 1,
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
    setRivalRelations(prev => prev.map(r => r.id === relationId ? {
      ...r, losses: newLosses,
      winRate: total > 0 ? Math.round((rel.wins / total) * 1000) / 10 : 0,
      streak: rel.streak <= 0 ? rel.streak - 1 : -1,
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

  // ── 출결 Hook (수정 4)
  // 결석/조퇴에 SP 차감 없음. 불이익 구조 만들지 않음.
  const onAttendanceEvent = useCallback((params: {
    studentId: string;
    eventType: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'MAKEUP';
    date: string;
    monthlyPerfect?: boolean;
    consecutiveMonths?: number;
    totalPresentCount?: number;
  }) => {
    const { studentId, eventType, monthlyPerfect, consecutiveMonths, totalPresentCount } = params;

    // 출석 이벤트만 처리 (결석/조퇴는 불이익 없음)
    if (eventType !== 'PRESENT' && eventType !== 'MAKEUP') return;

    // 월 개근 달성 → 개근왕 엠블럼 진행도 증가
    if (monthlyPerfect) {
      updateEmblemProgress(studentId, 'emb-001', 1);
      addStudentSP(studentId, 30, '월 개근 달성', 'ATTENDANCE', undefined, 'SYSTEM');
    }

    // 연속 개근 → 성실의 증거 / 철의 의지 엠블럼 진행도
    if (consecutiveMonths && consecutiveMonths > 0) {
      updateEmblemProgress(studentId, 'emb-002', 1);
      if (consecutiveMonths >= 3) {
        const se2 = studentEmblems.find(se => se.studentId === studentId && se.emblemId === 'emb-002' && !se.achieved);
        if (se2 && se2.progressCount >= 3) {
          awardEmblemMock(studentId, 'emb-002', 'ATTENDANCE', undefined, 'SYSTEM');
        }
      }
    }

    // 누적 출석 → 꾸준한 출석자 엠블럼 진행도
    if (totalPresentCount && totalPresentCount > 0) {
      updateEmblemProgress(studentId, 'emb-017', 1);
    }
  }, [studentEmblems, updateEmblemProgress, addStudentSP, awardEmblemMock]);

  // ── 성적/IF Hook (수정 5)
  const onIfAnalysisResult = useCallback((params: {
    studentId: string;
    examId: string;
    ifFlags: {
      calculationError: boolean;
      conceptLack: boolean;
      timeShortage: boolean;
      carelessMistake: boolean;
    };
  }) => {
    const { studentId, ifFlags } = params;

    // 개선 방향: 오류가 없을 때 관련 엠블럼 진행도 증가
    if (!ifFlags.calculationError) {
      updateEmblemProgress(studentId, 'emb-011', 1); // 꼼꼼한 검토자
      updateEmblemProgress(studentId, 'emb-024', 1); // 계산 정확도 향상
    }
    if (!ifFlags.conceptLack) {
      updateEmblemProgress(studentId, 'emb-007', 1); // 개념 정복자
      updateEmblemProgress(studentId, 'emb-025', 1); // 개념 회복
    }
    if (!ifFlags.timeShortage) {
      updateEmblemProgress(studentId, 'emb-010', 1); // 시간 마스터
      updateEmblemProgress(studentId, 'emb-026', 1); // 시간관리 달인
    }
  }, [updateEmblemProgress]);

  const recordIfReflectionMock = useCallback((
    studentId: string,
    ifKey: 'calculationError' | 'conceptLack' | 'timeShortage' | 'carelessMistake',
    improved: boolean,
  ) => {
    if (!improved) return;
    // IF 개선 기록 → 관련 엠블럼 진행도 업데이트 (mock)
    const keyMap: Record<string, string[]> = {
      calculationError: ['emb-011', 'emb-024'],
      conceptLack:      ['emb-007', 'emb-025'],
      timeShortage:     ['emb-010', 'emb-026'],
      carelessMistake:  ['emb-011'],
    };
    const targets = keyMap[ifKey] ?? [];
    targets.forEach(emblemId => updateEmblemProgress(studentId, emblemId, 1));
  }, [updateEmblemProgress]);

  // @deprecated
  const linkIfAnalysis = useCallback((_studentId: string, _examId: string, _ifKeys: string[]) => {
    // TODO(growth-if): onIfAnalysisResult로 대체
  }, []);

  return (
    <GrowthContext.Provider value={{
      profiles, emblems, studentEmblems, rivalRelations, spLogs,
      getProfile, getGrowthProfile,
      getStudentEmblems, getAchievedEmblems, getRecentEmblems, getEmblemById,
      getRepresentativeEmblems, setRepresentativeEmblems,
      getSPLogs,
      addStudentSP, awardEmblemMock, updateEmblemProgress,
      addEmblem, updateEmblem, toggleEmblemActive, toggleEmblemHidden,
      getRivalInfo, getRivalSummary, getStudentsTargetingMe,
      addRivalWin, addRivalLoss, endRivalRelation,
      getOverviewStats,
      onAttendanceEvent, onIfAnalysisResult, recordIfReflectionMock,
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
