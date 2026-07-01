// AXIS LMS v1.2 - 라이벌관리 (Growth Showcase Foundation v2)
// 관리자는 전체 연결 관계를 볼 수 있음.
// 학생에게 누가 자신을 지정했는지 절대 노출하지 않음.
// 라이벌 이력 삭제 없음 — 관계 종료만 제공.

import { useState } from 'react';
import { Swords, Plus, Minus, StopCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useGrowth } from '@/contexts/GrowthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';
import { canManageRivals, canAccessGrowth } from '@/lib/rbac';
import { TIER_LABELS, TIER_COLORS, StudentTier, RivalRelation } from '@/lib/growthData';
import { toast } from 'sonner';

export default function RivalManagement() {
  const { profiles, rivalRelations, addRivalWin, addRivalLoss, endRivalRelation } = useGrowth();
  const { students } = useStudents();
  const { currentUser } = useAuth();
  const canManage = canManageRivals(currentUser.accountType);

  // Phase 3D v3-r1: Rules of Hooks 준수 — 아래 접근 권한 조기 return보다 반드시 앞에 선언.
  const [confirmEnd, setConfirmEnd] = useState<RivalRelation | null>(null);

  // 페이지 진입 가드 — TEACHER 및 STUDENT/GUARDIAN 차단 (URL 직접 입력 시에도 적용)
  // 전체 라이벌 연결 관계는 SUPER_ADMIN / DIRECTOR / STAFF 만 조회 가능
  if (!canAccessGrowth(currentUser.accountType)) {
    return (
      <AdminLayout title="라이벌관리" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '라이벌관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>접근 권한이 없습니다.</p>
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
            라이벌 전체 관리는 최고관리자·원장·행정 계정만 접근할 수 있습니다.
          </p>
        </div>
      </AdminLayout>
    );
  }

  const handleWin = (rel: RivalRelation) => {
    const res = addRivalWin(rel.id);
    if (res.ok) toast.success('승리 기록 추가됨');
    else toast.error(res.reason ?? '오류');
  };

  const handleLoss = (rel: RivalRelation) => {
    const res = addRivalLoss(rel.id);
    if (res.ok) toast.success('패배 기록 추가됨');
    else toast.error(res.reason ?? '오류');
  };

  const handleEnd = (rel: RivalRelation) => {
    endRivalRelation(rel.id);
    toast.success('라이벌 관계가 종료되었습니다.');
    setConfirmEnd(null);
  };

  // 학생별 라이벌 행 (challenger 기준)
  const rows = profiles.map(profile => {
    const student = students.find(s => s.id === profile.studentId);
    const relation = rivalRelations.find(r => r.challengerStudentId === profile.studentId && r.status === 'ACTIVE');
    const targetStudent = relation ? students.find(s => s.id === relation.targetStudentId) : undefined;
    const targetProfile = relation ? profiles.find(p => p.studentId === relation.targetStudentId) : undefined;
    // 나를 라이벌로 지정한 학생 수 (관리자만 조회 가능, 학생에게 노출 금지)
    const challengersCount = rivalRelations.filter(r => r.targetStudentId === profile.studentId && r.status === 'ACTIVE').length;
    return { student, profile, relation, targetStudent, targetProfile, challengersCount };
  }).filter(r => r.student);

  const activeChallengeCount = rivalRelations.filter(r => r.status === 'ACTIVE').length;

  return (
    <AdminLayout title="라이벌관리" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '라이벌관리' }]}>
      {/* 헤더 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Swords size={18} style={{ color: '#EF4444' }} />
          <h1 className="text-lg font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>라이벌관리</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: '#FEE2E2', color: '#991B1B' }}>
            활성 {activeChallengeCount}건
          </span>
        </div>
        <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
          라이벌 연결 관계 및 승패 기록을 관리합니다. (관리자 전용 화면)
        </p>
      </div>

      {/* 보안 안내 배너 */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-xs font-medium"
        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
        <AlertTriangle size={14} />
        지정받은 학생에게는 누가 자신을 라이벌로 설정했는지 절대 노출되지 않습니다.
        관리자 화면에서만 전체 연결 관계를 확인할 수 있습니다.
      </div>

      {/* 메인 테이블 */}
      <div className="axis-card overflow-hidden mb-5">
        <div className="axis-table-scroll" style={{ maxHeight: 560 }}>
        <table className="w-full text-sm border-collapse" style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ background: 'oklch(0.97 0.004 250)' }}>
              {['학생명', '닉네임', '현재 라이벌', '승', '패', '승률', '연승/연패', '나를 지정', '다음 변경', '관리'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)', background: 'oklch(0.97 0.004 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.006 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>성장 프로필이 없습니다.</td></tr>
            )}
            {rows.map(({ student, profile, relation, targetStudent, targetProfile, challengersCount }) => {
              const tier = (profile.tier ?? 'UNRANKED') as StudentTier;
              if (!student) return null;
              return (
                <tr key={profile.studentId} style={{ borderBottom: '1px solid oklch(0.95 0.004 250)' }}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold" style={{ color: 'oklch(0.18 0.02 250)' }}>{student.name}</div>
                    <div className="text-xs font-semibold" style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]}</div>
                  </td>
                  <td className="px-4 py-2.5 text-sm italic" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    {profile.nickname}
                  </td>
                  <td className="px-4 py-2.5">
                    {targetStudent && targetProfile ? (
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'oklch(0.18 0.02 250)' }}>{targetStudent.name}</div>
                        <div className="text-xs font-semibold" style={{ color: TIER_COLORS[targetProfile.tier as StudentTier] }}>
                          {TIER_LABELS[targetProfile.tier as StudentTier]}
                        </div>
                      </div>
                    ) : <span className="text-xs" style={{ color: 'oklch(0.75 0.01 250)' }}>없음</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: '#059669' }}>
                    {profile.rivalWins}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: '#DC2626' }}>
                    {profile.rivalLosses}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {relation ? (
                      <span className="font-semibold text-sm" style={{ color: relation.winRate >= 50 ? '#059669' : '#DC2626' }}>
                        {relation.winRate}%
                      </span>
                    ) : <span style={{ color: 'oklch(0.75 0.01 250)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {relation ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: relation.streak > 0 ? '#D1FAE5' : relation.streak < 0 ? '#FEE2E2' : 'oklch(0.95 0.004 250)',
                          color: relation.streak > 0 ? '#065F46' : relation.streak < 0 ? '#991B1B' : 'oklch(0.5 0.015 250)',
                        }}>
                        {relation.streak > 0 ? `${relation.streak}연승` : relation.streak < 0 ? `${Math.abs(relation.streak)}연패` : '—'}
                      </span>
                    ) : <span style={{ color: 'oklch(0.75 0.01 250)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: challengersCount > 0 ? '#E7EBF3' : 'oklch(0.95 0.004 250)', color: challengersCount > 0 ? '#4F46E5' : 'oklch(0.6 0.015 250)' }}>
                      {challengersCount}명
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    {relation?.nextChangeAvailableAt?.slice(0, 10) ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {canManage && relation ? (
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => handleWin(relation)}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all duration-150 hover:brightness-95 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', outlineColor: '#059669' }}>
                          <Plus size={10} />승
                        </button>
                        <button onClick={() => handleLoss(relation)}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all duration-150 hover:brightness-95 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', outlineColor: '#DC2626' }}>
                          <Minus size={10} />패
                        </button>
                        <button onClick={() => setConfirmEnd(relation)}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded text-xs cursor-pointer transition-all duration-150 hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.5 0.015 250)', border: '1px solid oklch(0.87 0.006 250)', outlineColor: 'oklch(0.6 0.015 250)' }}>
                          <StopCircle size={10} />종료
                        </button>
                      </div>
                    ) : <span style={{ color: 'oklch(0.8 0.01 250)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* 전체 라이벌 연결 관계 (관리자 전용 뷰) */}
      <div className="axis-card p-4">
        <h3 className="text-sm font-bold mb-3" style={{ color: 'oklch(0.15 0.02 250)' }}>
          전체 라이벌 연결 관계 <span className="text-xs font-normal ml-1" style={{ color: '#EF4444' }}>관리자 전용</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {rivalRelations.filter(r => r.status === 'ACTIVE').map(r => {
            const challenger = students.find(s => s.id === r.challengerStudentId);
            const target = students.find(s => s.id === r.targetStudentId);
            return (
              <div key={r.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
                style={{ background: 'oklch(0.97 0.004 250)', border: '1px solid oklch(0.92 0.006 250)' }}>
                <span className="font-semibold" style={{ color: '#1D4ED8' }}>{challenger?.name}</span>
                <Swords size={11} style={{ color: '#EF4444' }} />
                <span className="font-semibold" style={{ color: 'oklch(0.3 0.02 250)' }}>{target?.name}</span>
                <span style={{ color: 'oklch(0.6 0.015 250)' }}>({r.wins}승 {r.losses}패)</span>
              </div>
            );
          })}
          {rivalRelations.filter(r => r.status === 'ACTIVE').length === 0 && (
            <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>활성 라이벌 관계가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 관계 종료 확인 모달 */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="font-bold text-base mb-2" style={{ color: 'oklch(0.15 0.02 250)' }}>라이벌 관계 종료</h3>
            <p className="text-sm mb-5" style={{ color: 'oklch(0.45 0.015 250)' }}>
              라이벌 관계를 종료합니다. 기록은 유지되며 삭제되지 않습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmEnd(null)}
                className="px-4 py-1.5 text-sm rounded-md border transition-colors hover:bg-slate-50 active:scale-95"
                style={{ borderColor: 'oklch(0.87 0.006 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
              <button onClick={() => handleEnd(confirmEnd)}
                className="px-4 py-1.5 text-sm rounded-md font-semibold transition-colors hover:brightness-90 active:scale-95"
                style={{ background: '#EF4444', color: '#fff' }}>종료 확인</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
