// AXIS LMS v1.2 - 직원 등록 모달
// HR & RBAC Stabilization v1
//
// AXIS 확정 원칙: 계정 생성 메뉴 없음. 직원 등록 시 휴대폰번호 기반 계정 자동 생성(mock).
// 조교 직급 없음.

import { useState } from 'react';
import { X, Info, UserPlus } from 'lucide-react';
import { useEmployees } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Position, POSITION_LABEL } from '@/lib/rbac';

interface Props {
  mode: 'create';
  onClose: () => void;
  onSaved: () => void;
}

// 기본 직급 목록 (SUPER_ADMIN은 최고관리자만 선택 가능 — 런타임에 필터링)
const ALL_EMPLOYEE_POSITIONS: Position[] = [
  'SUPER_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'HEAD_MANAGER', 'TEAM_LEAD', 'TEACHER', 'STAFF',
];

export default function EmployeeFormModal({ onClose, onSaved }: Props) {
  const { addEmployee } = useEmployees();
  const { currentUser } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // SUPER_ADMIN 직급 선택은 현재 로그인 사용자가 SUPER_ADMIN인 경우에만 허용
  const validPositions: Position[] = currentUser.position === 'SUPER_ADMIN'
    ? ALL_EMPLOYEE_POSITIONS
    : ALL_EMPLOYEE_POSITIONS.filter((p) => p !== 'SUPER_ADMIN');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    position: 'TEACHER' as Position,
    status: '재직' as const,
    joinDate: today,
    memo: '',
  });
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    setError('');
    if (!form.name.trim()) { setError('성명을 입력해주세요.'); return; }
    if (!form.phone.trim()) { setError('휴대폰번호를 입력해주세요.'); return; }
    if (!form.joinDate) { setError('입사일을 입력해주세요.'); return; }

    const r = addEmployee({
      name: form.name.trim(),
      phone: form.phone.trim(),
      position: form.position,
      status: form.status,
      joinDate: form.joinDate,
      memo: form.memo.trim() || undefined,
    });

    if (!r.ok) { setError(r.reason ?? '등록 중 오류가 발생했습니다.'); return; }
    onSaved();
  };

  const inputCls = 'text-sm px-2.5 py-2 rounded-md w-full';
  const inputStyle = { border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'oklch(0.2 0.02 250)' }}>
            <UserPlus size={15} /> 직원 등록
          </h3>
          <button onClick={onClose}><X size={16} style={{ color: 'oklch(0.4 0.015 250)' }} /></button>
        </div>

        {/* 안내 */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
            <Info size={12} />
            직원 등록 시 휴대폰번호 기반 계정이 자동 생성됩니다. 계정을 별도로 생성하지 않아도 됩니다.
          </div>
        </div>

        {/* 폼 */}
        <div className="p-4 space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>성명 *</span>
            <input className={inputCls} style={inputStyle} placeholder="성명" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>휴대폰번호 * <span className="font-normal" style={{ color: 'oklch(0.42 0.015 250)' }}>(계정 ID)</span></span>
            <input className={inputCls} style={inputStyle} placeholder="010-0000-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>직급 *</span>
            <select className={`${inputCls} bg-white`} style={inputStyle}
              value={form.position} onChange={(e) => set('position', e.target.value as Position)}>
              {validPositions.map((p) => (
                <option key={p} value={p}>{POSITION_LABEL[p]}</option>
              ))}
            </select>
            <span className="text-xs" style={{ color: 'oklch(0.47 0.015 250)' }}>
              권한은 직급 기본값으로 설정됩니다. 시스템설정 &gt; 권한설정에서 조정할 수 있습니다.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>입사일 *</span>
            <input type="date" className={inputCls} style={inputStyle} value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>메모 (선택)</span>
            <textarea rows={2} className={`${inputCls} resize-none`} style={inputStyle}
              placeholder="담당 과목, 특이사항 등" value={form.memo}
              onChange={(e) => set('memo', e.target.value)} />
          </label>

          {error && (
            <p className="text-xs px-2 py-1.5 rounded" style={{ background: 'oklch(0.96 0.06 25)', color: 'oklch(0.35 0.2 25)' }}>{error}</p>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
            style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
          <button onClick={handleSubmit} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium text-white"
            style={{ background: '#040D1E' }}>
            <UserPlus size={13} /> 등록
          </button>
        </div>
      </div>
    </div>
  );
}
