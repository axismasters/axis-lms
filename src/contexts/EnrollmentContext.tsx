// AXIS LMS v1.2 - EnrollmentContext (수강 연결 관리)
// ClassContext.tsx/AttendanceContext.tsx/AssessmentContext.tsx와 동일한 Context 패턴을 따른다.
//
// AXIS 확정 원칙: 재무관리는 학생 기준이 아니라 수강(Enrollment) 기준으로 관리한다. 이 Context가
// 그 단일 진실 공급원(source of truth)이 되며, Finance Engine 본체가 다음 단계에서 그대로 사용한다.
//
// 중요 — 기존 구조와의 동기화:
// 이 Context가 추가되기 전부터 "학생-반 연결"은 이미 두 곳에 흩어져 있었다.
//   1) ClassContext의 studentClassMap — AttendanceCheck.tsx(출결 대상자), AssessmentFormModal.tsx/
//      assessmentData.ts(시험 응시 대상자)가 getClassStudents()로 이 데이터를 직접 참조한다.
//   2) StudentContext의 Student.classes(임베디드 배열) — StudentList.tsx(반 필터/배지),
//      studentDerived.ts의 getFinance()(재무탭 청구 대상 반 판단), AuthContext.tsx의
//      studentIdsInClasses()(강사의 assignedStudentIds를 assignedClassIds로부터 계산)가 참조한다.
// 이 두 군데를 그대로 둔 채 Enrollment만 추가하면 "반에 등록했는데 출결/시험 대상에는 없다",
// "강사가 새로 등록한 학생에게 접근 권한이 없다" 같은 불일치가 생긴다. 그래서 이 Context의
// addEnrollment/endEnrollment/withdrawEnrollment는 자기 자신의 enrollments state를 갱신한 뒤,
// ClassContext.addStudentToClass/removeStudentFromClass와 StudentContext.assignClass/removeFromClass를
// 함께 호출해 세 저장소를 동기화한다. (Finance Engine 본체 단계에서 완전한 단일화를 검토할 수 있다.)

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Enrollment, EnrollmentStatus, DUMMY_ENROLLMENTS,
  getEnrollmentsByStudent, getEnrollmentsByClass,
  getActiveEnrollmentsByStudent, getActiveEnrollmentsByClass,
  isStudentActivelyEnrolled,
} from '@/lib/enrollmentData';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { timeSlotsToSchedule } from '@/lib/studentDerived';

interface AddEnrollmentInput {
  studentId: string;
  classId: string;
  startDate: string;
  tuitionAmount?: number;
  memo?: string;
}

interface EnrollmentContextType {
  enrollments: Enrollment[];

  // 조회 — Finance Engine 연동 준비용 helper(요청하신 그대로의 이름)
  getEnrollmentsByStudent: (studentId: string) => Enrollment[];
  getEnrollmentsByClass: (classId: string) => Enrollment[];
  getActiveEnrollmentsByStudent: (studentId: string) => Enrollment[];
  getActiveEnrollmentsByClass: (classId: string) => Enrollment[];
  isStudentActivelyEnrolled: (studentId: string, classId: string) => boolean;

  // 변경 — status 변경 방식만 제공한다(삭제 기능 없음)
  addEnrollment: (input: AddEnrollmentInput) => { ok: boolean; reason?: string; enrollment?: Enrollment };
  endEnrollment: (enrollmentId: string, endDate: string, memo?: string) => void;   // 수강중 → 종료
  withdrawEnrollment: (enrollmentId: string, endDate: string, memo?: string) => void; // 수강중 → 퇴원
  updateEnrollmentMemo: (enrollmentId: string, memo: string) => void;
}

const EnrollmentContext = createContext<EnrollmentContextType | null>(null);

export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(DUMMY_ENROLLMENTS);
  const { getClass, addStudentToClass, removeStudentFromClass } = useClasses();
  const { assignClass, removeFromClass } = useStudents();

  const addEnrollment = useCallback((input: AddEnrollmentInput): { ok: boolean; reason?: string; enrollment?: Enrollment } => {
    if (isStudentActivelyEnrolled(enrollments, input.studentId, input.classId)) {
      return { ok: false, reason: '이미 수강 중인 반입니다.' };
    }
    const klass = getClass(input.classId);
    if (!klass) {
      return { ok: false, reason: '반 정보를 찾을 수 없습니다.' };
    }

    const now = new Date().toISOString();
    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId: input.studentId,
      classId: input.classId,
      status: '수강중',
      startDate: input.startDate,
      tuitionAmount: input.tuitionAmount,
      memo: input.memo,
      createdAt: now,
      updatedAt: now,
    };
    setEnrollments((prev) => [...prev, newEnrollment]);

    // 동기화 1: ClassContext의 studentClassMap/enrolledCount — Attendance/Assessment Engine이
    // getClassStudents()로 직접 참조하므로, 새 수강생이 즉시 출결·시험 대상자로 인식되어야 한다.
    addStudentToClass(input.classId, input.studentId);

    // 동기화 2: StudentContext의 Student.classes(임베디드) — StudentList 필터/배지, 재무탭
    // (getFinance), 강사 권한 범위 계산(studentIdsInClasses)이 이 필드를 참조한다.
    assignClass(input.studentId, {
      id: klass.id,
      name: klass.name,
      subject: klass.subject,
      teacher: klass.teacher,
      schedule: timeSlotsToSchedule(klass.timeSlots),
      startDate: input.startDate,
      status: '수강중',
    });

    return { ok: true, enrollment: newEnrollment };
  }, [enrollments, getClass, addStudentToClass, assignClass]);

  const finishEnrollment = useCallback((enrollmentId: string, status: EnrollmentStatus, endDate: string, memo?: string) => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!target) return;

    setEnrollments((prev) => prev.map((e) =>
      e.id === enrollmentId
        ? { ...e, status, endDate, memo: memo ?? e.memo, updatedAt: new Date().toISOString() }
        : e
    ));

    // 동기화 1: studentClassMap에서 제거 — 더 이상 그 반의 출결·시험 대상이 아니다.
    removeStudentFromClass(target.classId, target.studentId);
    // 동기화 2: Student.classes의 해당 항목을 종료 상태로 갱신.
    removeFromClass(target.studentId, target.classId, endDate, memo);
  }, [enrollments, removeStudentFromClass, removeFromClass]);

  const endEnrollment = useCallback((enrollmentId: string, endDate: string, memo?: string) => {
    finishEnrollment(enrollmentId, '종료', endDate, memo);
  }, [finishEnrollment]);

  const withdrawEnrollment = useCallback((enrollmentId: string, endDate: string, memo?: string) => {
    finishEnrollment(enrollmentId, '퇴원', endDate, memo);
  }, [finishEnrollment]);

  const updateEnrollmentMemo = useCallback((enrollmentId: string, memo: string) => {
    setEnrollments((prev) => prev.map((e) =>
      e.id === enrollmentId ? { ...e, memo, updatedAt: new Date().toISOString() } : e
    ));
  }, []);

  return (
    <EnrollmentContext.Provider value={{
      enrollments,
      getEnrollmentsByStudent: (studentId) => getEnrollmentsByStudent(enrollments, studentId),
      getEnrollmentsByClass: (classId) => getEnrollmentsByClass(enrollments, classId),
      getActiveEnrollmentsByStudent: (studentId) => getActiveEnrollmentsByStudent(enrollments, studentId),
      getActiveEnrollmentsByClass: (classId) => getActiveEnrollmentsByClass(enrollments, classId),
      isStudentActivelyEnrolled: (studentId, classId) => isStudentActivelyEnrolled(enrollments, studentId, classId),
      addEnrollment,
      endEnrollment,
      withdrawEnrollment,
      updateEnrollmentMemo,
    }}>
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const ctx = useContext(EnrollmentContext);
  if (!ctx) throw new Error('useEnrollment must be used within EnrollmentProvider');
  return ctx;
}
