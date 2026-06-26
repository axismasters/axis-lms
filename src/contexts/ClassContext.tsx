// AXIS LMS v1.2 - 반 관리 Context
// 현재 상태: 인메모리 (새로고침 시 초기화)

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ClassRoom, DUMMY_CLASSES, CLASS_STUDENT_MAP, TimeSlot } from '@/lib/classData';
import { nanoid } from 'nanoid';

interface ClassContextValue {
  classes: ClassRoom[];
  studentClassMap: Record<string, string[]>; // classId → studentIds

  // CRUD
  addClass: (data: Omit<ClassRoom, 'id' | 'enrolledCount' | 'createdAt'>) => ClassRoom;
  updateClass: (id: string, data: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;

  // 수강생 관리
  addStudentToClass: (classId: string, studentId: string) => void;
  removeStudentFromClass: (classId: string, studentId: string) => void;
  getClassStudents: (classId: string) => string[];

  // 조회
  getClass: (id: string) => ClassRoom | undefined;
  getClassesByTeacher: (teacher: string) => ClassRoom[];
}

const ClassContext = createContext<ClassContextValue | null>(null);

export function ClassProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<ClassRoom[]>(DUMMY_CLASSES);
  const [studentClassMap, setStudentClassMap] = useState<Record<string, string[]>>(CLASS_STUDENT_MAP);

  const getClass = useCallback((id: string) => classes.find(c => c.id === id), [classes]);

  const getClassesByTeacher = useCallback(
    (teacher: string) => classes.filter(c => c.teacher === teacher),
    [classes]
  );

  const addClass = useCallback((data: Omit<ClassRoom, 'id' | 'enrolledCount' | 'createdAt'>): ClassRoom => {
    const newClass: ClassRoom = {
      ...data,
      id: `cls-${nanoid(6)}`,
      enrolledCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClasses(prev => [newClass, ...prev]);
    setStudentClassMap(prev => ({ ...prev, [newClass.id]: [] }));
    return newClass;
  }, []);

  const updateClass = useCallback((id: string, data: Partial<ClassRoom>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setStudentClassMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addStudentToClass = useCallback((classId: string, studentId: string) => {
    setStudentClassMap(prev => {
      const current = prev[classId] || [];
      if (current.includes(studentId)) return prev;
      return { ...prev, [classId]: [...current, studentId] };
    });
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c
    ));
  }, []);

  const removeStudentFromClass = useCallback((classId: string, studentId: string) => {
    setStudentClassMap(prev => ({
      ...prev,
      [classId]: (prev[classId] || []).filter(id => id !== studentId),
    }));
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, enrolledCount: Math.max(0, c.enrolledCount - 1) } : c
    ));
  }, []);

  const getClassStudents = useCallback(
    (classId: string) => studentClassMap[classId] || [],
    [studentClassMap]
  );

  return (
    <ClassContext.Provider value={{
      classes,
      studentClassMap,
      addClass,
      updateClass,
      deleteClass,
      addStudentToClass,
      removeStudentFromClass,
      getClassStudents,
      getClass,
      getClassesByTeacher,
    }}>
      {children}
    </ClassContext.Provider>
  );
}

export function useClasses() {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error('useClasses must be used within ClassProvider');
  return ctx;
}
