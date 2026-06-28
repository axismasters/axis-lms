// AXIS LMS v1.2 - EmployeeContext
// HR & RBAC Stabilization v1
//
// 직원 CRUD + 권한 변경 이력 관리.
// 삭제는 없음 — 퇴직 처리(status → '퇴직')만 허용.
// 실제 DB 연동 전 mock 상태이며, 새로고침 시 초기 더미 데이터로 복원.

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import {
  Employee, PermissionChangeLog,
  DUMMY_EMPLOYEES, DUMMY_PERMISSION_LOGS,
  nextEmployeeId, nextAccountId,
  EMPLOYEE_POSITIONS,
} from '@/lib/employeeData';
import { Position, PermissionKey, defaultPermissionGroupId, DEFAULT_PERMISSIONS_BY_POSITION } from '@/lib/rbac';

// ────────────────────────────────────────────────────────────
// Context 타입
// ────────────────────────────────────────────────────────────
interface EmployeeContextType {
  employees: Employee[];

  // 조회
  getEmployee: (id: string) => Employee | undefined;
  getEmployeeByAccountId: (accountId: string) => Employee | undefined;

  // 직원 등록 (AXIS 확정: 계정 자동 생성 구조 — mock)
  addEmployee: (
    data: Omit<Employee, 'id' | 'accountId' | 'permissionGroupId' | 'accountStatus'>
  ) => { ok: boolean; employee?: Employee; reason?: string };

  // 직원 정보 수정
  updateEmployee: (id: string, updates: Partial<Pick<Employee, 'name' | 'phone' | 'position' | 'status' | 'joinDate' | 'leaveDate' | 'memo' | 'accountStatus'>>) => { ok: boolean; reason?: string };

  // 퇴직 처리 (soft — status → '퇴직', accountStatus → '비활성')
  resignEmployee: (id: string, leaveDate: string) => { ok: boolean; reason?: string };

  // ── 권한 이력 ──
  permissionLogs: PermissionChangeLog[];

  // 권한 변경 기록 — append-only (삭제 없음)
  recordPermissionChange: (params: {
    targetPosition: Position;
    addedKeys: PermissionKey[];
    removedKeys: PermissionKey[];
    changedBy: string;
    note?: string;
    sourcePosition?: Position;
  }) => void;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);

// ────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────
export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(DUMMY_EMPLOYEES);
  const [permissionLogs, setPermissionLogs] = useState<PermissionChangeLog[]>(DUMMY_PERMISSION_LOGS);

  const getEmployee = useCallback((id: string) => employees.find((e) => e.id === id), [employees]);
  const getEmployeeByAccountId = useCallback((accountId: string) => employees.find((e) => e.accountId === accountId), [employees]);

  // 직원 등록 — 휴대폰번호 중복 체크 후 등록. 계정 ID는 mock으로 자동 생성.
  const addEmployee = useCallback((
    data: Omit<Employee, 'id' | 'accountId' | 'permissionGroupId' | 'accountStatus'>
  ): { ok: boolean; employee?: Employee; reason?: string } => {
    const normalized = data.phone.replace(/-/g, '');
    const dup = employees.find((e) => e.phone.replace(/-/g, '') === normalized);
    if (dup) return { ok: false, reason: '이미 등록된 휴대폰번호입니다.' };

    const newEmp: Employee = {
      ...data,
      id: nextEmployeeId(employees),
      accountId: nextAccountId(employees),
      permissionGroupId: defaultPermissionGroupId(data.position),
      accountStatus: '활성',
    };
    setEmployees((prev) => [...prev, newEmp]);
    return { ok: true, employee: newEmp };
  }, [employees]);

  // 직원 정보 수정
  const updateEmployee = useCallback((
    id: string,
    updates: Partial<Pick<Employee, 'name' | 'phone' | 'position' | 'status' | 'joinDate' | 'leaveDate' | 'memo' | 'accountStatus'>>
  ): { ok: boolean; reason?: string } => {
    const target = employees.find((e) => e.id === id);
    if (!target) return { ok: false, reason: '직원을 찾을 수 없습니다.' };

    // 직급 변경 시 permissionGroupId도 기본값으로 업데이트
    const permissionGroupId = updates.position
      ? defaultPermissionGroupId(updates.position)
      : target.permissionGroupId;

    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, permissionGroupId } : e))
    );
    return { ok: true };
  }, [employees]);

  // 퇴직 처리
  const resignEmployee = useCallback((id: string, leaveDate: string): { ok: boolean; reason?: string } => {
    const target = employees.find((e) => e.id === id);
    if (!target) return { ok: false, reason: '직원을 찾을 수 없습니다.' };
    if (target.status === '퇴직') return { ok: false, reason: '이미 퇴직 처리된 직원입니다.' };

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: '퇴직', leaveDate, accountStatus: '비활성' } : e
      )
    );
    return { ok: true };
  }, [employees]);

  // 권한 변경 이력 기록 — append-only
  const recordPermissionChange = useCallback((params: {
    targetPosition: Position;
    addedKeys: PermissionKey[];
    removedKeys: PermissionKey[];
    changedBy: string;
    note?: string;
    sourcePosition?: Position;
  }) => {
    const newLog: PermissionChangeLog = {
      id: `log-${Date.now()}`,
      targetPosition: params.targetPosition,
      changedAt: new Date().toISOString(),
      changedBy: params.changedBy,
      addedKeys: params.addedKeys,
      removedKeys: params.removedKeys,
      note: params.note,
      sourcePosition: params.sourcePosition,
    };
    setPermissionLogs((prev) => [...prev, newLog]);
  }, []);

  return (
    <EmployeeContext.Provider value={{
      employees,
      getEmployee,
      getEmployeeByAccountId,
      addEmployee,
      updateEmployee,
      resignEmployee,
      permissionLogs,
      recordPermissionChange,
    }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees(): EmployeeContextType {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployees must be used within EmployeeProvider');
  return ctx;
}
