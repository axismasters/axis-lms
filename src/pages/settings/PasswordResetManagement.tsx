// AXIS LMS v1.2 - 시스템설정 > 비밀번호 초기화 관리
// HR & RBAC Stabilization v1
//
// 계정 검색 → 결과 목록 → 행별 "비밀번호 초기화" 버튼 → 확인 모달 → 1건 실행.
// ⛔ 전체/모든 학생/모든 직원/선택 전체 초기화, 계정 직접 생성, 최고관리자 초기화 — 모두 제공하지 않는다.
// 직원 계정은 EmployeeContext에서 가져온다 (DEV_USERS 의존 제거).

import { useMemo, useState } from 'react';
import { KeyRound, Search, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useEmployees } from '@/contexts/EmployeeContext';
import { AccountType, ACCOUNT_TYPE_LABEL, AccountStatus, POSITION_LABEL } from '@/lib/rbac';

interface AccountRow {
  accountId: string;
  name: string;
  accountType: AccountType;
  position: string;
  phone: string;
  status: AccountStatus;
  studentId?: string;
}

export default function PasswordResetManagement() {
  const { can, canResetPassword } = useAuth();
  const { students } = useStudents();
  const { employees } = useEmployees();

  const hasAccess = can('student.passwordReset') || can('employee.passwordReset') || can('system.passwordReset');

  const [searched, setSearched] = useState(false);
  const [qName, setQName] = useState('');
  const [qPhone, setQPhone] = useState('');
  const [qType, setQType] = useState<AccountType | '전체'>('전체');
  const [qPosition, setQPosition] = useState('전체');
  const [qStatus, setQStatus] = useState<AccountStatus | '전체'>('전체');
  const [confirmTarget, setConfirmTarget] = useState<AccountRow | null>(null);

  // 검색 대상 계정 풀
  const allAccounts: AccountRow[] = useMemo(() => {
    // 직원 계정 — EmployeeContext 기반
    const staffAccounts: AccountRow[] = employees.map((emp) => ({
      accountId: emp.accountId,
      name: emp.name,
      accountType: (emp.position === 'SUPER_ADMIN' ? 'SUPER_ADMIN'
        : emp.position === 'DIRECTOR' ? 'DIRECTOR'
        : emp.position === 'TEACHER' ? 'TEACHER'
        : 'STAFF') as AccountType,
      position: POSITION_LABEL[emp.position],
      phone: emp.phone,
      status: emp.accountStatus,
    }));

    // 학생 계정
    const studentAccounts: AccountRow[] = students.map((s) => ({
      accountId: `student-account-${s.id}`,
      name: s.name,
      accountType: 'STUDENT' as AccountType,
      position: '학생',
      phone: s.phone,
      status: (s.status === '퇴원' ? '비활성' : '활성') as AccountStatus,
      studentId: s.id,
    }));

    // 보호자 계정: 학생의 guardians를 훑어 휴대폰번호 기준으로 dedupe
    const guardianByPhone = new Map<string, AccountRow>();
    students.forEach((s) => {
      s.guardians.forEach((g) => {
        const normalizedPhone = g.phone.replace(/-/g, '');
        if (!normalizedPhone) return;
        if (!guardianByPhone.has(normalizedPhone)) {
          guardianByPhone.set(normalizedPhone, {
            accountId: `guardian-account-${normalizedPhone}`,
            name: g.name,
            accountType: 'GUARDIAN' as AccountType,
            position: '보호자',
            phone: g.phone,
            status: '활성',
          });
        }
      });
    });
    const guardianAccounts: AccountRow[] = Array.from(guardianByPhone.values());

    return [...staffAccounts, ...guardianAccounts, ...studentAccounts];
  }, [employees, students]);

  const positionOptions = useMemo(() => Array.from(new Set(allAccounts.map((a) => a.position))), [allAccounts]);

  const results = useMemo(() => {
    if (!searched) return [];
    return allAccounts.filter((a) => {
      if (qName.trim() && !a.name.includes(qName.trim())) return false;
      if (qPhone.trim() && !a.phone.replace(/-/g, '').includes(qPhone.trim().replace(/-/g, ''))) return false;
      if (qType !== '전체' && a.accountType !== qType) return false;
      if (qPosition !== '전체' && a.position !== qPosition) return false;
      if (qStatus !== '전체' && a.status !== qStatus) return false;
      return true;
    });
  }, [allAccounts, searched, qName, qPhone, qType, qPosition, qStatus]);

  const resetSearch = () => { setQName(''); setQPhone(''); setQType('전체'); setQPosition('전체'); setQStatus('전체'); setSearched(false); };

  const canResetRow = (row: AccountRow) => canResetPassword(row.accountId, row.accountType, row.studentId);

  const doConfirm = () => {
    if (!confirmTarget) return;
    toast.success(`${confirmTarget.name}(${ACCOUNT_TYPE_LABEL[confirmTarget.accountType]}) 계정의 비밀번호가 초기화되었습니다.`);
    setConfirmTarget(null);
  };

  if (!hasAccess) {
    return (
      <AdminLayout title="비밀번호 초기화 관리" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '비밀번호 초기화 관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>비밀번호 초기화 관리 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const selectCls = 'text-sm rounded-md px-2.5 py-2 bg-white';
  const selectStyle = { border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' };

  return (
    <AdminLayout title="비밀번호 초기화 관리" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '비밀번호 초기화 관리' }]}>
      <div className="mb-5">
        <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>비밀번호 초기화 관리</h1>
        <p className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>계정을 검색한 뒤, 대상 1건을 선택해 비밀번호를 초기화합니다.</p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
        <Info size={13} /> 전체 초기화·일괄 초기화·계정 직접 생성·최고관리자 초기화는 제공되지 않습니다. 항상 1건씩만 처리됩니다.
      </div>

      {/* 검색 조건 */}
      <div className="axis-card p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>이름</span>
            <input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="이름" className="text-sm px-2.5 py-2 rounded-md" style={selectStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>휴대폰번호</span>
            <input value={qPhone} onChange={(e) => setQPhone(e.target.value)} placeholder="010-0000-0000" className="text-sm px-2.5 py-2 rounded-md tabular-nums" style={selectStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>계정유형</span>
            <select className={selectCls} style={selectStyle} value={qType} onChange={(e) => setQType(e.target.value as AccountType | '전체')}>
              <option value="전체">전체</option>
              {(['SUPER_ADMIN', 'DIRECTOR', 'STAFF', 'TEACHER', 'STUDENT', 'GUARDIAN'] as AccountType[]).map((t) => (
                <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>직급</span>
            <select className={selectCls} style={selectStyle} value={qPosition} onChange={(e) => setQPosition(e.target.value)}>
              <option value="전체">전체</option>
              {positionOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>상태</span>
            <select className={selectCls} style={selectStyle} value={qStatus} onChange={(e) => setQStatus(e.target.value as AccountStatus | '전체')}>
              {(['전체', '활성', '비활성', '정지'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={resetSearch} className="px-3 py-2 rounded-md text-sm border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>초기화</button>
          <button onClick={() => setSearched(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium text-white" style={{ background: '#040D1E' }}>
            <Search size={14} /> 검색
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {searched && (
        <div className="axis-card overflow-hidden">
          <div className="px-4 py-2.5 text-xs" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)', color: 'oklch(0.5 0.015 250)' }}>
            검색 결과 <b style={{ color: 'oklch(0.1605 0.0394 259.41)' }}>{results.length}</b>건
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ background: 'oklch(0.98 0.004 247)', borderBottom: '1px solid oklch(0.9 0.008 250)' }}>
                  {['이름', '계정유형', '직급', '휴대폰번호', '상태', '관리'].map((h) => (
                    <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((a) => {
                  const allowed = canResetRow(a);
                  return (
                    <tr key={a.accountId} style={{ borderBottom: '1px solid oklch(0.95 0.006 250)' }}>
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: 'oklch(0.2 0.02 250)' }}>{a.name}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{ACCOUNT_TYPE_LABEL[a.accountType]}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{a.position}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.4 0.015 250)' }}>{a.phone}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{a.status}</td>
                      <td className="px-3 py-2.5">
                        {allowed ? (
                          <button onClick={() => setConfirmTarget(a)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>
                            <KeyRound size={12} /> 비밀번호 초기화
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>권한 없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'oklch(0.55 0.015 250)' }}>조건에 맞는 계정이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
        <Info size={11} /> 직원 계정은 직원관리(EmployeeContext) 기반입니다. 보호자 계정은 학생의 보호자 정보에서 자동 집계됩니다.
      </p>

      {/* 확인 모달 — 1건만 처리 */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg w-full max-w-sm modal-enter" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>비밀번호 초기화</h3>
              <button onClick={() => setConfirmTarget(null)}><X size={16} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
            </div>
            <div className="p-4">
              <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
                <b>{confirmTarget.name}</b>({ACCOUNT_TYPE_LABEL[confirmTarget.accountType]}) 계정의 비밀번호를 초기화합니다.
              </p>
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}><Info size={11} /> 이 계정 1건만 처리됩니다.</p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setConfirmTarget(null)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={doConfirm} className="px-3 py-1.5 rounded-md text-sm text-white" style={{ background: '#040D1E' }}>초기화 실행</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
