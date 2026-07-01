// AXIS LMS v1.2 - 직원관리 > 직원 목록
// HR & RBAC Stabilization v1
//
// 권한: employee.view (조회) / employee.update (수정) / employee.resign (퇴직)
// 조교 직급 없음. 계정 생성 메뉴 없음.
// 직원 등록은 ?new=1 쿼리로 모달 진입 (ClassList 패턴 동일).

import { useMemo, useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { UserPlus, X, Info, ChevronRight, Briefcase, Phone, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/contexts/EmployeeContext';
import { Employee, EmployeeStatus, EMPLOYEE_STATUS_COLOR, EMPLOYEE_STATUS_LABEL } from '@/lib/employeeData';
import { Position, POSITION_LABEL } from '@/lib/rbac';
import EmployeeFormModal from '@/components/EmployeeFormModal';

// ────────────────────────────────────────────────────────────
// 상태 뱃지
// ────────────────────────────────────────────────────────────
function EmpStatusBadge({ status }: { status: EmployeeStatus }) {
  const c = EMPLOYEE_STATUS_COLOR[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {EMPLOYEE_STATUS_LABEL[status]}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// 퇴직 확인 모달
// ────────────────────────────────────────────────────────────
function ResignModal({ target, onCancel, onConfirm }: { target: Employee; onCancel: () => void; onConfirm: (leaveDate: string) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={onCancel}>
      <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>퇴직 처리</h3>
          <button onClick={onCancel}><X size={16} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
            <b>{target.name}</b> ({POSITION_LABEL[target.position]}) 직원을 퇴직 처리합니다.
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            <Info size={11} /> 퇴직 처리 시 계정이 비활성화됩니다.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>퇴직일</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="text-sm px-2.5 py-2 rounded-md"
              style={{ border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' }} />
          </label>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
          <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
            style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
          <button onClick={() => onConfirm(date)} className="px-3 py-1.5 rounded-md text-sm text-white"
            style={{ background: 'oklch(0.55 0.2 25)' }}>퇴직 처리</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────
export default function EmployeeList() {
  const [, navigate] = useLocation();
  const { can, currentUser } = useAuth();
  const { employees, updateEmployee, resignEmployee } = useEmployees();

  const canView = can('employee.view');
  const canCreate = can('employee.create');
  const canEdit = can('employee.update');
  const canResign = can('employee.resign');

  // SUPER_ADMIN 보호 정책:
  //   - SUPER_ADMIN 직원은 SUPER_ADMIN만 퇴직 처리 가능
  //   - SUPER_ADMIN 자기 자신은 퇴직 처리 불가 (실수 방지)
  const isCurrentUserEmployee = (emp: Employee) =>
    emp.id === currentUser.id || emp.accountId === currentUser.id;

  const canResignEmployee = (emp: Employee): boolean => {
    if (!canResign) return false;
    if (emp.status === '퇴직') return false;
    if (emp.position === 'SUPER_ADMIN' && currentUser.position !== 'SUPER_ADMIN') return false;
    if (currentUser.position === 'SUPER_ADMIN' && isCurrentUserEmployee(emp)) return false;
    return true;
  };

  // [실사용 버그 수정] 기존에는 window.location.search를 렌더 시점에 직접 읽어 showNewModal을
  // 계산했는데, wouter의 useLocation()은 pathname만 추적하고 querystring 변화에는 리렌더를
  // 트리거하지 않는다. 그 결과 "직원 등록" 버튼을 눌러 /admin/employees?new=1로 navigate해도
  // 컴포넌트가 다시 렌더되지 않아 등록 모달이 열리지 않는 경우가 있었다(ClassList.tsx는 이미
  // useSearch()로 이 문제를 올바르게 처리하고 있었음 — 동일 패턴으로 통일한다).
  const searchStr = useSearch();
  const [newModalOpen, setNewModalOpen] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(searchStr);
    if (sp.get('new') !== '1') return;
    if (!canCreate) {
      navigate('/admin/employees');
      toast.error('직원 등록 권한이 없습니다.');
      return;
    }
    setNewModalOpen(true);
  }, [searchStr, canCreate, navigate]);

  const closeNewModal = () => {
    setNewModalOpen(false);
    navigate('/admin/employees');
  };

  // 검색 상태
  const [qName, setQName] = useState('');
  const [qPosition, setQPosition] = useState<Position | '전체'>('전체');
  const [qStatus, setQStatus] = useState<EmployeeStatus | '전체'>('전체');
  const [qAccountStatus, setQAccountStatus] = useState<'활성' | '비활성' | '전체'>('전체');

  // 퇴직 모달
  const [resignTarget, setResignTarget] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (qName.trim() && !e.name.includes(qName.trim())) return false;
      if (qPosition !== '전체' && e.position !== qPosition) return false;
      if (qStatus !== '전체' && e.status !== qStatus) return false;
      if (qAccountStatus !== '전체' && e.accountStatus !== qAccountStatus) return false;
      return true;
    });
  }, [employees, qName, qPosition, qStatus, qAccountStatus]);

  // [실사용 버그 수정] 기존에는 계정상태(활성/비활성)가 배지로 표시만 되고 실제로 전환할
  // 방법이 없었다. 퇴직 처리된 직원은 계정상태가 퇴직 처리 절차로만 바뀌도록 토글에서 제외한다.
  const canToggleAccountStatus = (emp: Employee): boolean => canEdit && emp.status !== '퇴직';

  const handleToggleAccountStatus = (emp: Employee) => {
    if (!canToggleAccountStatus(emp)) return;
    const next = emp.accountStatus === '활성' ? '비활성' : '활성';
    const r = updateEmployee(emp.id, { accountStatus: next });
    if (r.ok) {
      toast.success(`${emp.name} 직원 계정이 ${next}(으)로 전환되었습니다.`);
    } else {
      toast.error(r.reason ?? '계정 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleResign = (leaveDate: string) => {
    if (!resignTarget) return;
    // 방어: 버튼 노출 외 상태 조작 경로로 진입해도 차단
    if (!canResignEmployee(resignTarget)) {
      toast.error('해당 직원은 현재 계정으로 퇴직 처리할 수 없습니다.');
      setResignTarget(null);
      return;
    }
    const r = resignEmployee(resignTarget.id, leaveDate);
    if (r.ok) {
      toast.success(`${resignTarget.name} 직원이 퇴직 처리되었습니다.`);
    } else {
      toast.error(r.reason ?? '퇴직 처리 중 오류가 발생했습니다.');
    }
    setResignTarget(null);
  };

  if (!canView) {
    return (
      <AdminLayout title="직원 목록" breadcrumbs={[{ label: '직원관리', path: '/admin/employees' }, { label: '직원 목록' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>직원 목록 조회 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const selectStyle = { border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' };
  const selectCls = 'text-sm rounded-md px-2.5 py-2 bg-white';

  // 재직/휴직/퇴직 counts
  const counts = { 재직: 0, 휴직: 0, 퇴직: 0 } as Record<EmployeeStatus, number>;
  employees.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });

  return (
    <AdminLayout title="직원 목록" breadcrumbs={[{ label: '직원관리', path: '/admin/employees' }, { label: '직원 목록' }]}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'oklch(0.2 0.02 250)' }}>
            <Briefcase size={18} /> 직원 목록
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>
            전체 {employees.length}명 &nbsp;·&nbsp;
            재직 {counts['재직']}명 &nbsp;·&nbsp;
            휴직 {counts['휴직']}명 &nbsp;·&nbsp;
            퇴직 {counts['퇴직']}명
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/admin/employees?new=1')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium text-white"
            style={{ background: '#040D1E' }}>
            <UserPlus size={14} /> 직원 등록
          </button>
        )}
      </div>

      {/* 검색 필터 */}
      <div className="axis-card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>이름</span>
            <input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="이름 검색"
              className="text-sm px-2.5 py-2 rounded-md" style={selectStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>직급</span>
            <select className={selectCls} style={selectStyle} value={qPosition} onChange={(e) => setQPosition(e.target.value as Position | '전체')}>
              <option value="전체">전체 직급</option>
              {(['SUPER_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'HEAD_MANAGER', 'TEAM_LEAD', 'TEACHER', 'STAFF'] as Position[]).map((p) => (
                <option key={p} value={p}>{POSITION_LABEL[p]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>재직상태</span>
            <select className={selectCls} style={selectStyle} value={qStatus} onChange={(e) => setQStatus(e.target.value as EmployeeStatus | '전체')}>
              <option value="전체">전체</option>
              <option value="재직">재직</option>
              <option value="휴직">휴직</option>
              <option value="퇴직">퇴직</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>계정상태</span>
            <select className={selectCls} style={selectStyle} value={qAccountStatus} onChange={(e) => setQAccountStatus(e.target.value as '활성' | '비활성' | '전체')}>
              <option value="전체">전체</option>
              <option value="활성">활성</option>
              <option value="비활성">비활성</option>
            </select>
          </label>
        </div>
      </div>

      {/* 직원 목록 */}
      <div className="axis-card overflow-hidden">
        <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
          <table className="w-full text-sm" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'oklch(0.98 0.004 247)', borderBottom: '1px solid oklch(0.9 0.008 250)' }}>
                {['이름', '직급', '휴대폰번호', '재직상태', '입사일', '계정상태', '관리'].map((h) => (
                  <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap"
                    style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12, background: 'oklch(0.98 0.004 247)', boxShadow: 'inset 0 -1px 0 oklch(0.9 0.008 250)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  조건에 맞는 직원이 없습니다.
                </td></tr>
              )}
              {filtered.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid oklch(0.95 0.006 250)' }}
                  className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: '#040D1E' }}>
                        {emp.name.charAt(0)}
                      </div>
                      {emp.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>
                    {POSITION_LABEL[emp.position]}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>
                    <span className="inline-flex items-center gap-1"><Phone size={11} /> {emp.phone}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <EmpStatusBadge status={emp.status} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>
                    {emp.joinDate}
                    {emp.leaveDate && <span className="text-xs ml-1" style={{ color: 'oklch(0.55 0.015 250)' }}>~ {emp.leaveDate}</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: emp.accountStatus === '활성' ? 'oklch(0.94 0.08 160)' : 'oklch(0.94 0.01 250)',
                        color: emp.accountStatus === '활성' ? 'oklch(0.35 0.12 160)' : 'oklch(0.5 0.015 250)',
                      }}>
                      {emp.accountStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/employees/${emp.id}`)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-slate-50"
                        style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>
                        <ChevronRight size={11} /> 상세
                      </button>
                      {canToggleAccountStatus(emp) && (
                        <button
                          onClick={() => handleToggleAccountStatus(emp)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-slate-50"
                          style={{
                            borderColor: 'oklch(0.9 0.008 250)',
                            color: emp.accountStatus === '활성' ? 'oklch(0.5 0.015 250)' : 'oklch(0.45 0.15 160)',
                          }}
                          title={emp.accountStatus === '활성' ? '계정을 비활성화합니다' : '계정을 활성화합니다'}
                        >
                          {emp.accountStatus === '활성'
                            ? <><ShieldOff size={11} /> 비활성화</>
                            : <><ShieldCheck size={11} /> 활성화</>}
                        </button>
                      )}
                      {canResignEmployee(emp) && (
                        <button
                          onClick={() => setResignTarget(emp)}
                          className="text-xs px-2 py-1 rounded border hover:bg-red-50"
                          style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.5 0.15 25)' }}>
                          퇴직
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
        <Info size={11} />
        직원 계정은 휴대폰번호 기반으로 자동 생성됩니다. 계정 직접 생성 메뉴는 제공되지 않습니다.
      </p>

      {/* 직원 등록 모달 */}
      {newModalOpen && canCreate && (
        <EmployeeFormModal
          mode="create"
          onClose={closeNewModal}
          onSaved={() => { toast.success('직원이 등록되었습니다.'); closeNewModal(); }}
        />
      )}

      {/* 퇴직 확인 모달 */}
      {resignTarget && (
        <ResignModal
          target={resignTarget}
          onCancel={() => setResignTarget(null)}
          onConfirm={handleResign}
        />
      )}
    </AdminLayout>
  );
}
