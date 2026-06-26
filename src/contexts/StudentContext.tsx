// AXIS LMS v1.2 - 학생 데이터 Context
// 현재: 더미 데이터 기반 (DB 미연동)
// 향후: API 연동 시 이 Context의 함수들만 교체하면 됨
//
// 이 파일은 받은 AXIS LMS v1.2 수정 파일들(StudentDetail.tsx, StudentList.tsx, StudentNew.tsx)이
// 실제로 호출하는 함수 시그니처(setStudentStatus, assignClass(studentId, ClassInfo),
// removeFromClass(studentId, classId, endDate, reason?), addOperationMemo 등)에 맞춰 작성했습니다.

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Student, STUDENTS, ClassInfo, StudentStatus, EXISTING_GUARDIAN_PHONES } from '@/lib/dummyData';

interface StudentContextType {
  students: Student[];
  getStudent: (id: string) => Student | undefined;
  addStudent: (student: Omit<Student, 'id' | 'registeredAt' | 'internalScores' | 'mockExamScores' | 'consultRecords' | 'operationMemos'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  setStudentStatus: (id: string, status: StudentStatus) => void;
  assignClass: (studentId: string, enrollment: ClassInfo) => void;
  removeFromClass: (studentId: string, classId: string, endDate: string, reason?: string) => void;
  checkGuardianPhone: (phone: string) => (typeof EXISTING_GUARDIAN_PHONES)[string] | null;
  addConsultRecord: (studentId: string, record: Omit<Student['consultRecords'][0], 'id' | 'createdAt'>) => void;
  addOperationMemo: (studentId: string, memo: Omit<Student['operationMemos'][0], 'id' | 'createdAt'>) => void;
  addInternalScore: (studentId: string, score: Omit<Student['internalScores'][0], 'id'>) => void;
  addMockExamScore: (studentId: string, score: Omit<Student['mockExamScores'][0], 'id'>) => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

let tempIdCounter = 0;
function tempId(prefix: string): string {
  tempIdCounter += 1;
  return `${prefix}-${Date.now()}-${tempIdCounter}`;
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>(STUDENTS);

  const getStudent = useCallback((id: string) => students.find((s) => s.id === id), [students]);

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'registeredAt' | 'internalScores' | 'mockExamScores' | 'consultRecords' | 'operationMemos'>) => {
    const newStudent: Student = {
      ...studentData,
      id: tempId('stu'),
      registeredAt: new Date().toISOString().split('T')[0],
      internalScores: [],
      mockExamScores: [],
      consultRecords: [],
      operationMemos: [],
    };
    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  }, []);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // 재원 상태 변경(퇴원/휴원/재원 전환). 실제 삭제가 아니라 상태값만 바꾼다(soft 처리).
  const setStudentStatus = useCallback((id: string, status: StudentStatus) => {
    const today = new Date().toISOString().split('T')[0];
    setStudents((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const next: Student = { ...s, status, statusChangedAt: today };
      if (status === '퇴원') next.withdrawnAt = today;
      return next;
    }));
  }, []);

  // 수강반 추가 — StudentDetail.tsx의 EnrollmentTab이 만든 ClassInfo 객체를 그대로 받는다.
  const assignClass = useCallback((studentId: string, enrollment: ClassInfo) => {
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      const alreadyIn = s.classes.some((c) => c.id === enrollment.id && c.status === '수강중');
      if (alreadyIn) return s;
      return { ...s, classes: [...s.classes, enrollment] };
    }));
  }, []);

  // 수강 종료 — 기존 반은 유지하되 종료일/사유를 기록하고 상태를 '수강완료'로 바꾼다.
  const removeFromClass = useCallback((studentId: string, classId: string, endDate: string, reason?: string) => {
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        classes: s.classes.map((c) =>
          c.id === classId && c.status === '수강중'
            ? { ...c, status: '수강완료', endDate, endReason: reason }
            : c
        ),
      };
    }));
  }, []);

  const checkGuardianPhone = useCallback((phone: string) => {
    const normalized = phone.replace(/-/g, '');
    const results: (typeof EXISTING_GUARDIAN_PHONES)[string] = [];
    students.forEach((student) => {
      student.guardians.forEach((g) => {
        if (g.phone.replace(/-/g, '') === normalized) {
          results.push({ studentId: student.id, studentName: student.name, relation: g.relation, guardianName: g.name });
        }
      });
    });
    return results.length > 0 ? results : null;
  }, [students]);

  const addConsultRecord = useCallback((studentId: string, record: Omit<Student['consultRecords'][0], 'id' | 'createdAt'>) => {
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return { ...s, consultRecords: [{ ...record, id: tempId('cr'), createdAt: new Date().toISOString() }, ...s.consultRecords] };
    }));
  }, []);

  const addOperationMemo = useCallback((studentId: string, memo: Omit<Student['operationMemos'][0], 'id' | 'createdAt'>) => {
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return { ...s, operationMemos: [{ ...memo, id: tempId('om'), createdAt: new Date().toISOString() }, ...s.operationMemos] };
    }));
  }, []);

  const addInternalScore = useCallback((studentId: string, score: Omit<Student['internalScores'][0], 'id'>) => {
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return { ...s, internalScores: [{ ...score, id: tempId('is') }, ...s.internalScores] };
    }));
  }, []);

  const addMockExamScore = useCallback((studentId: string, score: Omit<Student['mockExamScores'][0], 'id'>) => {
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return { ...s, mockExamScores: [{ ...score, id: tempId('me') }, ...s.mockExamScores] };
    }));
  }, []);

  return (
    <StudentContext.Provider value={{
      students, getStudent, addStudent, updateStudent, deleteStudent, setStudentStatus,
      assignClass, removeFromClass, checkGuardianPhone,
      addConsultRecord, addOperationMemo, addInternalScore, addMockExamScore,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudents must be used within StudentProvider');
  return ctx;
}
