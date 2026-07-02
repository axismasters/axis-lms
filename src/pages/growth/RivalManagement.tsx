// AXIS LMS v1.2 - 라이벌관리 (Growth Showcase Foundation v2)
// 관리자는 전체 연결 관계를 볼 수 있음.
// 학생에게 누가 자신을 지정했는지 절대 노출하지 않음.
// 라이벌 이력 삭제 없음 — 관계 종료만 제공.
//
// [Phase 3D v3-r14-r4] 학생 성장/Rival/Emblem 프리미엄 UI 정리 — 이 화면(관리자 성장관리
// 중 학생 화면과 직결되는 라이벌 데이터 관리)도 함께 정리한다.
//   - Swords(칼) 아이콘·강한 red 배지를 걷어냈다 — "Rival은 전투가 아니라 성장 자극
//     장치"라는 원칙이 관리자 화면에도 예외 없이 적용되어야 한다.
//   - 승/패 관련 색상을 Tailwind 기본 green/red 대신 AXIS 팔레트(CHART_TEAL/CHART_AMBER)로
//     통일했다(brandColors.ts의 기존 원칙 "강한 red 남발 금지 → warm amber로 제한"과 동일).
//   - 진짜 파괴적 액션(관계 종료 확정)만 기존 공용 Button destructive 변형과 동일한 rose
//     톤을 유지한다 — 이건 "전투 표현"이 아니라 UX상 정당한 위험 신호다.

import { useState } from 'react';
import { Users, Plus, Minus, StopCircle, Info, ArrowRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useGrowth } from '@/contexts/GrowthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';
import { canManageRivals, canAccessGrowth } from '@/lib/rbac';
import { TIER_LABELS, TIER_COLORS, StudentTier, RivalRelation } from '@/lib/growthData';
import { AXIS_NAVY, AXIS_GOLD, CHART_TEAL, CHART_AMBER } from '@/lib/brandColors';
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
          <p className="text-xs" style={{ color: 'oklch(0.47 0.015 250)' }}>
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
          <Users size={18} style={{ color: AXIS_NAVY }} />
          <h1 className="text-lg font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>라이벌관리</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: '#F1EEE4', color: '#8A6D2E' }}>
            활성 {activeChallengeCount}건
          </span>
        </div>
        <p className="text-xs" style={{ color: 'oklch(0.42 0.015 250)' }}>
          라이벌 연결 관계 및 성장 비교 기록을 관리합니다. (관리자 전용 화면)
        </p>
      </div>

      {/* 안내 배너 */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-xs font-medium"
        style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
        <Info size={14} />
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
              <tr><td colSpan={10} className="px-4 py-10 text-center text-sm" style={{ color: 'oklch(0.47 0.015 250)' }}>성장 프로필이 없습니다.</td></tr>
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
                  <td className="px-4 py-2.5 text-sm italic" style={{ color: 'oklch(0.35 0.015 250)' }}>
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
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: CHART_TEAL }}>
                    {profile.rivalWins}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: CHART_AMBER }}>
                    {profile.rivalLosses}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {relation ? (
                      <span className="font-semibold text-sm" style={{ color: relation.winRate >= 50 ? CHART_TEAL : CHART_AMBER }}>
                        {relation.winRate}%
                      </span>
                    ) : <span style={{ color: 'oklch(0.75 0.01 250)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {relation ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: relation.streak > 0 ? 'oklch(0.94 0.06 195)' : relation.streak < 0 ? 'oklch(0.95 0.08 70)' : 'oklch(0.95 0.004 250)',
                          color: relation.streak > 0 ? '#0F6E56' : relation.streak < 0 ? '#854F0B' : 'oklch(0.5 0.015 250)',
                        }}>
                        {relation.streak > 0 ? `${relation.streak}연승` : relation.streak < 0 ? `${Math.abs(relation.streak)}연패` : '—'}
                      </span>
                    ) : <span style={{ color: 'oklch(0.75 0.01 250)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: challengersCount > 0 ? '#F1EEE4' : 'oklch(0.95 0.004 250)', color: challengersCount > 0 ? '#8A6D2E' : 'oklch(0.6 0.015 250)' }}>
                      {challengersCount}명
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'oklch(0.42 0.015 250)' }}>
                    {relation?.nextChangeAvailableAt?.slice(0, 10) ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {canManage && relation ? (
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => handleWin(relation)}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all duration-150 hover:brightness-95 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ background: 'oklch(0.94 0.06 195)', color: '#0F6E56', border: '1px solid oklch(0.88 0.07 195)', outlineColor: CHART_TEAL }}>
                          <Plus size={10} />승
                        </button>
                        <button onClick={() => handleLoss(relation)}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all duration-150 hover:brightness-95 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ background: 'oklch(0.95 0.08 70)', color: '#854F0B', border: '1px solid oklch(0.89 0.09 70)', outlineColor: CHART_AMBER }}>
                          <Minus size={10} />패
                        </button>
                        <button onClick={() => setConfirmEnd(relation)}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded text-xs cursor-pointer transition-all duration-150 hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.4 0.015 250)', border: '1px solid oklch(0.87 0.006 250)', outlineColor: 'oklch(0.6 0.015 250)' }}>
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
          전체 라이벌 연결 관계 <span className="text-xs font-normal ml-1" style={{ color: 'oklch(0.5 0.015 250)' }}>관리자 전용</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {rivalRelations.filter(r => r.status === 'ACTIVE').map(r => {
            const challenger = students.find(s => s.id === r.challengerStudentId);
            const target = students.find(s => s.id === r.targetStudentId);
            return (
              <div key={r.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
                style={{ background: 'oklch(0.97 0.004 250)', border: '1px solid oklch(0.92 0.006 250)' }}>
                <span className="font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{challenger?.name}</span>
                <ArrowRight size={11} style={{ color: AXIS_GOLD }} />
                <span className="font-semibold" style={{ color: 'oklch(0.3 0.02 250)' }}>{target?.name}</span>
                <span style={{ color: 'oklch(0.47 0.015 250)' }}>({r.wins}승 {r.losses}패)</span>
              </div>
            );
          })}
          {rivalRelations.filter(r => r.status === 'ACTIVE').length === 0 && (
            <p className="text-sm" style={{ color: 'oklch(0.47 0.015 250)' }}>활성 라이벌 관계가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 관계 종료 확인 모달 */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="font-bold text-base mb-2" style={{ color: 'oklch(0.15 0.02 250)' }}>라이벌 관계 종료</h3>
            <p className="text-sm mb-5" style={{ color: 'oklch(0.35 0.015 250)' }}>
              라이벌 관계를 종료합니다. 기록은 유지되며 삭제되지 않습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmEnd(null)}
                className="px-4 py-1.5 text-sm rounded-md border transition-colors hover:bg-slate-50 active:scale-95"
                style={{ borderColor: 'oklch(0.87 0.006 250)', color: 'oklch(0.4 0.015 250)' }}>취소</button>
              <button onClick={() => handleEnd(confirmEnd)}
                className="px-4 py-1.5 text-sm rounded-md font-semibold transition-colors hover:brightness-90 active:scale-95"
                style={{ background: '#E11D48', color: '#fff' }}>종료 확인</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
