// AXIS LMS v1.2 - AttendanceContext
// 출결 상태 관리: 세션 조회, 출결 기록 생성/수정, 알림 발송 시뮬레이션

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  AttendanceSession, AttendanceRecord, AttendanceStatus,
  NOTIFY_STATUSES, DUMMY_SESSIONS,
} from '@/lib/attendanceData';

interface AttendanceContextType {
  sessions: AttendanceSession[];

  // 세션 조회
  getSession: (classId: string, date: string) => AttendanceSession | undefined;
  getSessionsByClass: (classId: string) => AttendanceSession[];
  getSessionsByDate: (date: string) => AttendanceSession[];

  // 출결 체크 - 전체 자동 출석 생성
  initSession: (classId: string, date: string, studentIds: string[], createdBy: string) => AttendanceSession;

  // 개별 출결 수정
  updateRecord: (sessionId: string, studentId: string, status: AttendanceStatus, reason?: string, note?: string) => void;

  // 세션 잠금 (체크 완료)
  lockSession: (sessionId: string, checkedBy: string) => void;

  // 세션 잠금 해제 (행정 권한)
  unlockSession: (sessionId: string) => void;

  // 알림 발송 시뮬레이션
  sendNotification: (sessionId: string, studentId: string) => void;

  // 통계 계산
  getStats: (classId: string, from?: string, to?: string) => {
    total: number;
    present: number;
    late: number;
    earlyLeave: number;
    absent: number;
    makeup: number;
    official: number;
    attendanceRate: number;
  };
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<AttendanceSession[]>(DUMMY_SESSIONS);

  const getSession = (classId: string, date: string) =>
    sessions.find(s => s.classId === classId && s.date === date);

  const getSessionsByClass = (classId: string) =>
    sessions.filter(s => s.classId === classId).sort((a, b) => b.date.localeCompare(a.date));

  const getSessionsByDate = (date: string) =>
    sessions.filter(s => s.date === date);

  // 전체 자동 출석으로 세션 초기화
  const initSession = (classId: string, date: string, studentIds: string[], createdBy: string): AttendanceSession => {
    const existing = getSession(classId, date);
    if (existing) return existing;

    const now = new Date().toISOString();
    const records: AttendanceRecord[] = studentIds.map((stuId, i) => ({
      id: `att-new-${classId}-${date}-${i}`,
      classId,
      studentId: stuId,
      date,
      status: '출석' as AttendanceStatus,
      notified: false,
      createdBy,
      createdAt: now,
    }));

    const newSession: AttendanceSession = {
      id: `sess-new-${classId}-${date}`,
      classId,
      date,
      isLocked: false,
      records,
    };

    setSessions(prev => [...prev, newSession]);
    return newSession;
  };

  // 개별 출결 수정
  const updateRecord = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    reason?: string,
    note?: string,
  ) => {
    setSessions(prev => prev.map(sess => {
      if (sess.id !== sessionId) return sess;
      const now = new Date().toISOString();
      const needNotify = NOTIFY_STATUSES.includes(status);
      return {
        ...sess,
        records: sess.records.map(rec => {
          if (rec.studentId !== studentId) return rec;
          return {
            ...rec,
            status,
            reason: reason ?? rec.reason,
            note: note ?? rec.note,
            updatedAt: now,
            // 알림 대상 상태로 변경 시 미발송 상태로 초기화
            notified: needNotify ? false : rec.notified,
            notifyChannel: needNotify ? '카카오알림톡' : rec.notifyChannel,
          };
        }),
      };
    }));
  };

  // 세션 잠금
  const lockSession = (sessionId: string, checkedBy: string) => {
    setSessions(prev => prev.map(sess => {
      if (sess.id !== sessionId) return sess;
      return {
        ...sess,
        isLocked: true,
        checkedAt: new Date().toISOString(),
        checkedBy,
      };
    }));
  };

  // 세션 잠금 해제 (행정)
  const unlockSession = (sessionId: string) => {
    setSessions(prev => prev.map(sess => {
      if (sess.id !== sessionId) return sess;
      return { ...sess, isLocked: false, checkedAt: undefined, checkedBy: undefined };
    }));
  };

  // 알림 발송 시뮬레이션
  const sendNotification = (sessionId: string, studentId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSessions(prev => prev.map(sess => {
      if (sess.id !== sessionId) return sess;
      return {
        ...sess,
        records: sess.records.map(rec => {
          if (rec.studentId !== studentId) return rec;
          return {
            ...rec,
            notified: true,
            notifyChannel: '카카오알림톡',
            notifyTime: timeStr,
          };
        }),
      };
    }));
  };

  // 통계
  const getStats = (classId: string, from?: string, to?: string) => {
    const classSessions = getSessionsByClass(classId).filter(s => {
      if (from && s.date < from) return false;
      if (to && s.date > to) return false;
      return true;
    });

    let total = 0, present = 0, late = 0, earlyLeave = 0, absent = 0, makeup = 0, official = 0;
    classSessions.forEach(sess => {
      sess.records.forEach(rec => {
        total++;
        if (rec.status === '출석') present++;
        else if (rec.status === '지각') late++;
        else if (rec.status === '조퇴') earlyLeave++;
        else if (rec.status === '결석') absent++;
        else if (rec.status === '보강출석') makeup++;
        else if (rec.status === '공결') official++;
      });
    });

    const attendanceRate = total > 0 ? Math.round(((present + makeup + official) / total) * 100) : 0;
    return { total, present, late, earlyLeave, absent, makeup, official, attendanceRate };
  };

  return (
    <AttendanceContext.Provider value={{
      sessions,
      getSession,
      getSessionsByClass,
      getSessionsByDate,
      initSession,
      updateRecord,
      lockSession,
      unlockSession,
      sendNotification,
      getStats,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}
