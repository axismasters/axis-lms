// AXIS LMS v1.2 - AttendanceContext (v2 - Notification Integration)
// 출결 상태 관리: 세션 조회, 출결 기록 생성/수정, 알림 발송 시뮬레이션
// v2: 결석/조퇴 저장 시 NotificationContext.createNotificationFromEvent 자동 호출

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  AttendanceSession, AttendanceRecord, AttendanceStatus,
  NOTIFY_STATUSES, DUMMY_SESSIONS,
} from '@/lib/attendanceData';
import { useNotification } from '@/contexts/NotificationContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';

interface AttendanceContextType {
  sessions: AttendanceSession[];

  // 세션 조회
  getSession: (classId: string, date: string) => AttendanceSession | undefined;
  getSessionsByClass: (classId: string) => AttendanceSession[];
  getSessionsByDate: (date: string) => AttendanceSession[];

  // 출결 체크 - 전체 자동 출석 생성
  initSession: (classId: string, date: string, studentIds: string[], createdBy: string) => AttendanceSession;

  // 개별 출결 수정
  updateRecord: (sessionId: string, studentId: string, status: AttendanceStatus, reason?: string, note?: string, by?: string) => void;

  // 세션 잠금 (체크 완료)
  lockSession: (sessionId: string, checkedBy: string) => void;

  // 세션 잠금 해제 (행정 권한)
  unlockSession: (sessionId: string) => void;

  // 알림 발송 시뮬레이션
  sendNotification: (sessionId: string, studentId: string) => void;

  // ── 강사 포털 전용 ──────────────────────────────────────────────
  // 담당 반/담당 학생 범위는 호출 측(TeacherAttendance)이 1차 검증하고,
  // Context는 2차로 잠금 여부·결석사유 누락을 방어한다.
  saveTeacherAttendance: (
    classId: string,
    date: string,
    studentIds: string[],
    recordMap: Record<string, { status: AttendanceStatus; reason: string }>,
    by: string,
  ) => { ok: boolean; reason?: string };

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
  const { createNotificationFromEvent, shouldAutoSend } = useNotification();
  const { students } = useStudents();
  const { classes } = useClasses();

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
  // reason/note 매개변수 시맨틱: 매개변수를 생략하면(undefined) 기존 값을 유지하고,
  // 빈 문자열('')로 명시하면 사유/메모를 지운다(undefined로 저장). 값이 있으면 그 값으로 교체한다.
  // 단, status가 '출석'이면 reason/note는 매개변수 값과 무관하게 항상 지운다(출석은 사유 개념이 없음).
  const updateRecord = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    reason?: string,
    note?: string,
    by?: string,
  ) => {
    // 알림 이력 생성 — 결석/조퇴이고 해당 이벤트가 enabled인 경우에만
    const notifType = status === '결석' ? 'ATTENDANCE_ABSENCE' as const
      : status === '조퇴' ? 'ATTENDANCE_EARLY_LEAVE' as const
      : null;

    if (notifType && shouldAutoSend(notifType)) {
      const session = sessions.find((s) => s.id === sessionId);
      const student = students.find((s) => s.id === studentId);
      const klass = session ? classes.find((c) => c.id === session.classId) : undefined;
      const guardian = student?.guardians?.[0];

      createNotificationFromEvent(notifType, {
        studentId,
        studentName: student?.name,
        guardianName: guardian?.name,
        guardianPhone: guardian?.phone,
        className: klass?.name,
        relatedEntityType: 'ATTENDANCE',
        relatedEntityId: sessionId,
        requestedBy: by ?? '시스템',
        vars: {
          날짜: session?.date ?? new Date().toISOString().slice(0, 10),
          출결상태: status,
          반명: klass?.name,
          학생명: student?.name,
          보호자명: guardian?.name,
        },
      });
    }

    setSessions(prev => prev.map(sess => {
      if (sess.id !== sessionId) return sess;
      const now = new Date().toISOString();
      return {
        ...sess,
        records: sess.records.map(rec => {
          if (rec.studentId !== studentId) return rec;

          const isAttend = status === '출석';
          const needNotify = NOTIFY_STATUSES.includes(status); // 결석/조퇴

          // 사유/메모: 출석이면 무조건 정리. 그 외 상태는 생략=유지, 빈 문자열=지움, 값=교체.
          const nextReason = isAttend ? undefined : (reason === undefined ? rec.reason : (reason || undefined));
          const nextNote = isAttend ? undefined : (note === undefined ? rec.note : (note || undefined));

          // 알림 관련 필드는 상태가 바뀔 때마다 항상 새로 결정한다(이전 상태의 값이 잔존하지 않도록).
          const notified = false;
          const notifyChannel = needNotify ? '카카오알림톡' : undefined;
          const notifyTime = undefined;

          return {
            ...rec,
            status,
            reason: nextReason,
            note: nextNote,
            notified,
            notifyChannel,
            notifyTime,
            updatedAt: now,
            updatedBy: by ?? rec.updatedBy,
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

  // ── 강사 포털 전용: 출결 일괄 저장 ────────────────────────────────
  // 담당 반/학생 범위 검증은 TeacherAttendance.tsx에서 1차 처리.
  // Context는 잠금 여부·결석사유 누락을 2차 방어한다.
  const saveTeacherAttendance = (
    classId: string,
    date: string,
    studentIds: string[],
    recordMap: Record<string, { status: AttendanceStatus; reason: string }>,
    by: string,
  ): { ok: boolean; reason?: string } => {
    // 2차 방어: 결석 사유 누락
    const missingReason = studentIds.filter(id => {
      const r = recordMap[id];
      return r?.status === '결석' && !r.reason.trim();
    });
    if (missingReason.length > 0) {
      return { ok: false, reason: '결석 사유가 없는 학생이 있습니다.' };
    }

    // 잠금 세션 확인 (현재 렌더 closure의 sessions 기준)
    const existingSession = getSession(classId, date);
    if (existingSession?.isLocked) {
      return { ok: false, reason: '잠금된 출결 세션은 수정할 수 없습니다.' };
    }

    const now = new Date().toISOString();

    setSessions(prev => {
      const existing = prev.find(s => s.classId === classId && s.date === date);

      if (existing) {
        // 기존 세션: 레코드 업데이트 + 미포함 학생 추가
        const existingStudentIds = new Set(existing.records.map(r => r.studentId));
        const updatedRecords = existing.records.map(rec => {
          const override = recordMap[rec.studentId];
          if (!override) return rec;
          const isAttend = override.status === '출석';
          return {
            ...rec,
            status: override.status,
            reason: isAttend ? undefined : (override.reason.trim() || undefined),
            updatedAt: now,
            updatedBy: by,
          };
        });
        const addedRecords: AttendanceRecord[] = studentIds
          .filter(id => !existingStudentIds.has(id))
          .map((stuId, i) => {
            const override = recordMap[stuId];
            const status: AttendanceStatus = override?.status ?? '출석';
            const isAttend = status === '출석';
            return {
              id: `att-t-${classId}-${date}-add-${i}`,
              classId,
              studentId: stuId,
              date,
              status,
              reason: isAttend ? undefined : (override?.reason.trim() || undefined),
              notified: false,
              createdBy: by,
              createdAt: now,
            };
          });
        return prev.map(s =>
          s.id === existing.id
            ? { ...existing, records: [...updatedRecords, ...addedRecords] }
            : s
        );
      }

      // 새 세션 생성 (전체 자동 출석 후 예외만 override)
      const newRecords: AttendanceRecord[] = studentIds.map((stuId, i) => {
        const override = recordMap[stuId];
        const status: AttendanceStatus = override?.status ?? '출석';
        const isAttend = status === '출석';
        return {
          id: `att-t-${classId}-${date}-${i}`,
          classId,
          studentId: stuId,
          date,
          status,
          reason: isAttend ? undefined : (override?.reason.trim() || undefined),
          notified: false,
          createdBy: by,
          createdAt: now,
        };
      });
      return [
        ...prev,
        {
          id: `sess-t-${classId}-${date}`,
          classId,
          date,
          isLocked: false,
          records: newRecords,
        },
      ];
    });

    // 결석/조퇴 알림 발송 (기존 updateRecord 패턴 동일)
    const sessionId = existingSession?.id ?? `sess-t-${classId}-${date}`;
    studentIds.forEach(stuId => {
      const r = recordMap[stuId];
      if (!r) return;
      const notifType =
        r.status === '결석' ? ('ATTENDANCE_ABSENCE' as const)
        : r.status === '조퇴' ? ('ATTENDANCE_EARLY_LEAVE' as const)
        : null;
      if (!notifType || !shouldAutoSend(notifType)) return;
      const student = students.find(s => s.id === stuId);
      const klass = classes.find(c => c.id === classId);
      const guardian = student?.guardians?.[0];
      createNotificationFromEvent(notifType, {
        studentId: stuId,
        studentName: student?.name,
        guardianName: guardian?.name,
        guardianPhone: guardian?.phone,
        className: klass?.name,
        relatedEntityType: 'ATTENDANCE',
        relatedEntityId: sessionId,
        requestedBy: by,
        vars: {
          날짜: date,
          출결상태: r.status,
          반명: klass?.name,
          학생명: student?.name,
          보호자명: guardian?.name,
        },
      });
    });

    return { ok: true };
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
      saveTeacherAttendance,
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
