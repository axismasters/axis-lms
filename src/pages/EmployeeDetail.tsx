// AXIS LMS v1.2 - 직원관리 > 직원 상세
// HR & RBAC Stabilization v1
//
// 기본 정보 조회 + 수정. 퇴직 처리는 목록에서도 가능하지만 여기서도 제공.

import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { ChevronLeft, Briefcase, Phone, Info, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/contexts/EmployeeContext';
import { Employee, EmployeeStatus, EMPLOYEE_STATUS_COLOR, EMPLOYEE_STATUS_LABEL } from '@/lib/employeeData';
import { Position, POSITION_LABEL, POSITIONS } from '@/lib/rbac';

function EmpStatusBadge({ status }: { status: EmployeeStatus }) {
  const c = EMPLOYEE_STATUS_COLOR[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {EMPLOYEE_STATUS_LABEL[status]}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5" style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
      <div className="text-xs mb-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
      <div className="text-sm" style={{ color: 'oklch(0.22 0.02 250)' }}>{children}</div>
    </div>
  );
}

export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { can, currentUser } = useAuth();
  const { getEmployee, updateEmployee, resignEmployee } = useEmployees();

  const emp = getEmployee(params.id);
  const canEdit = can('employee.update');
  const canResign = can('employee.resign');

  // SUPER_ADMIN 보호 정책:
  //   - 현재 사용자가 SUPER_ADMIN이 아니면 대상 직원이 SUPER_ADMIN인 경우 수정/퇴직 불가
  //   - SUPER_ADMIN은 자기 자신을 퇴직 처리할 수 없음 (실수 방지)
  //
  // currentUser.id = AuthContext id (예: 'u-super')
  // emp.id = EmployeeContext id (예: 'emp-001')
  // emp.accountId = AuthContext id와 매핑되는 계정 ID (예: 'u-super')
  // → emp.id와 currentUser.id가 다른 구조이므로 accountId도 함께 비교해야 함
  const isCurrentUserEmployee =
    !!emp && (emp.id === currentUser.id || emp.accountId === currentUser.id);
  const isSelfSuperAdmin =
    currentUser.position === 'SUPER_ADMIN' && isCurrentUserEmployee;
  const targetIsSuperAdmin = emp?.position === 'SUPER_ADMIN';
  const canProtectedEdit = canEdit && (currentUser.position === 'SUPER_ADMIN' || !targetIsSuperAdmin);
  const canProtectedResign =
    canResign &&
    !isSelfSuperAdmin &&
    (currentUser.position === 'SUPER_ADMIN' || !targetIsSuperAdmin);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Pick<Employee, 'name' | 'phone' | 'position' | 'memo' | 'joinDate'>>>({});
  const [showResignModal, setShowResignModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);

  if (!emp) {
    return (
      <AdminLayout title="직원 상세" breadcrumbs={[{ label: '직원관리', path: '/employees' }, { label: '직원 상세' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>직원을 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/admin/employees')} className="mt-3 text-sm font-medium" style={{ color: 'oklch(0.45 0.2 277)' }}>← 직원 목록</button>
        </div>
      </AdminLayout>
    );
  }

  if (!can('employee.view')) {
    return (
      <AdminLayout title="직원 상세" breadcrumbs={[{ label: '직원관리', path: '/employees' }, { label: emp.name }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>직원 정보 조회 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const startEdit = () => {
    if (!canProtectedEdit) {
      toast.error('최고관리자 직원 정보는 최고관리자만 수정할 수 있습니다.');
      return;
    }
    setForm({ name: emp.name, phone: emp.phone, position: emp.position, memo: emp.memo, joinDate: emp.joinDate });
    setEditing(true);
  };

  const saveEdit = () => {
    const r = updateEmployee(emp.id, form);
    if (r.ok) {
      toast.success('직원 정보가 수정되었습니다.');
      setEditing(false);
    } else {
      toast.error(r.reason ?? '수정 중 오류가 발생했습니다.');
    }
  };

  const doResign = () => {
    // 방어: 상태 조작으로 모달이 열려도 한 번 더 차단
    if (!canProtectedResign) {
      toast.error('해당 직원은 현재 계정으로 퇴직 처리할 수 없습니다.');
      setShowResignModal(false);
      return;
    }
    const r = resignEmployee(emp.id, leaveDate);
    if (r.ok) {
      toast.success(`${emp.name} 직원이 퇴직 처리되었습니다.`);
      setShowResignModal(false);
    } else {
      toast.error(r.reason ?? '퇴직 처리 중 오류가 발생했습니다.');
    }
  };

  const inputCls = 'text-sm px-2.5 py-2 rounded-md w-full';
  const inputStyle = { border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' };

  return (
    <AdminLayout title={emp.name} breadcrumbs={[
      { label: '직원관리', path: '/employees' },
      { label: '직원 목록', path: '/employees' },
      { label: emp.name },
    ]}>
      <button onClick={() => navigate('/admin/employees')} className="inline-flex items-center gap-1 text-xs mb-3 hover:underline" style={{ color: 'oklch(0.5 0.015 250)' }}>
        <ChevronLeft size={13} /> 직원 목록
      </button>

      {/* 헤더 카드 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              {emp.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>{emp.name}</h1>
                <EmpStatusBadge status={emp.status} />
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                <span className="flex items-center gap-1"><Briefcase size={11} /> {POSITION_LABEL[emp.position]}</span>
                <span className="flex items-center gap-1"><Phone size={11} /> {emp.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canProtectedEdit && !editing && (
              <button onClick={startEdit} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>수정</button>
            )}
            {canProtectedResign && emp.status !== '퇴직' && (
              <button onClick={() => setShowResignModal(true)}
                className="px-3 py-1.5 rounded-md text-sm text-white"
                style={{ background: 'oklch(0.55 0.2 25)' }}>퇴직 처리</button>
            )}
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="axis-card p-4">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'oklch(0.25 0.02 250)' }}>기본 정보</h2>
        {editing ? (
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>성명 *</span>
              <input className={inputCls} style={inputStyle} value={form.name ?? ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>휴대폰번호 *</span>
              <input className={inputCls} style={inputStyle} value={form.phone ?? ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>직급 *</span>
              <select className={`${inputCls} bg-white`} style={inputStyle}
                value={form.position ?? ''} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value as Position }))}>
                {(['SUPER_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'HEAD_MANAGER', 'TEAM_LEAD', 'TEACHER', 'STAFF'] as Position[])
                  .filter((p) => currentUser.position === 'SUPER_ADMIN' || p !== 'SUPER_ADMIN')
                  .map((p) => (
                    <option key={p} value={p}>{POSITION_LABEL[p]}</option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>입사일</span>
              <input type="date" className={inputCls} style={inputStyle} value={form.joinDate ?? ''} onChange={(e) => setForm((p) => ({ ...p, joinDate: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>메모</span>
              <textarea rows={2} className={`${inputCls} resize-none`} style={inputStyle} value={form.memo ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={saveEdit} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium text-white"
                style={{ background: 'oklch(0.511 0.262 276.966)' }}><Save size={13} /> 저장</button>
            </div>
          </div>
        ) : (
          <div>
            <Field label="성명">{emp.name}</Field>
            <Field label="직급">{POSITION_LABEL[emp.position]}</Field>
            <Field label="휴대폰번호">{emp.phone}</Field>
            <Field label="재직상태"><EmpStatusBadge status={emp.status} /></Field>
            <Field label="입사일">{emp.joinDate}</Field>
            {emp.leaveDate && <Field label="퇴직일">{emp.leaveDate}</Field>}
            <Field label="계정상태">
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: emp.accountStatus === '활성' ? 'oklch(0.94 0.08 160)' : 'oklch(0.94 0.01 250)',
                  color: emp.accountStatus === '활성' ? 'oklch(0.35 0.12 160)' : 'oklch(0.5 0.015 250)',
                }}>
                {emp.accountStatus}
              </span>
            </Field>
            <Field label="권한그룹">{emp.permissionGroupId}</Field>
            {emp.memo && <Field label="메모">{emp.memo}</Field>}
          </div>
        )}
      </div>

      {/* 퇴직 모달 */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setShowResignModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>퇴직 처리</h3>
              <button onClick={() => setShowResignModal(false)}><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}><b>{emp.name}</b> 직원을 퇴직 처리합니다.</p>
              <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
                <Info size={11} /> 퇴직 처리 시 계정이 비활성화됩니다.
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>퇴직일</span>
                <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </label>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setShowResignModal(false)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={doResign} className="px-3 py-1.5 rounded-md text-sm text-white"
                style={{ background: 'oklch(0.55 0.2 25)' }}>퇴직 처리</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
