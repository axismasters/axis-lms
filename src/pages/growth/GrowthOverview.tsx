// AXIS LMS v1.2 - 성장현황 (Growth Showcase v2)
// SP/엠블럼 수동 지급 + SP 이력 표시 추가.
// 관리자 전용. 학생/보호자 화면 없음.

import { useState } from 'react';
import { Link } from 'wouter';
import { Trophy, Star, Zap, Users, Eye, ChevronRight, Plus, Clock } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useGrowth } from '@/contexts/GrowthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessGrowth, canAwardSP, canAwardEmblem } from '@/lib/rbac';
import {
  TIER_LABELS, TIER_COLORS, MATERIAL_LABELS, MATERIAL_BADGE,
  CATEGORY_LABELS, SOURCE_TYPE_LABELS, StudentTier,
} from '@/lib/growthData';
import { toast } from 'sonner';

export default function GrowthOverview() {
  const { currentUser } = useAuth();
  const growth = useGrowth();
  const { students } = useStudents();

  const canGrant      = canAwardSP(currentUser.accountType);
  const canGrantEmblem = canAwardEmblem(currentUser.accountType);

  // SP 수동 지급 모달 상태
  const [spModal, setSpModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [spAmount, setSpAmount] = useState('');
  const [spReason, setSpReason] = useState('');

  // 엠블럼 수동 지급 모달 상태
  const [embModal, setEmbModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [emblemId, setEmblemId] = useState('');

  const [search, setSearch] = useState('');
  const [showRecentLogs, setShowRecentLogs] = useState(false);

  if (!canAccessGrowth(currentUser.accountType)) {
    return (
      <AdminLayout title="성장현황" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '성장현황' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>접근 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const stats = growth.getOverviewStats();

  const rows = students
    .filter(s => s.status === '재원')
    .map(s => {
      const profile = growth.getProfile(s.id);
      const achieved = growth.getAchievedEmblems(s.id);
      const repEmblems = growth.getRepresentativeEmblems(s.id);
      const rivalName = profile?.currentRivalId
        ? students.find(st => st.id === profile.currentRivalId)?.name
        : undefined;
      return { s, profile, achieved, repEmblems, rivalName };
    })
    .filter(r => r.s.name.includes(search) || (r.profile?.nickname ?? '').includes(search));

  // 최근 SP 이력 (전체, 최근 10건)
  const recentLogs = [...growth.spLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const handleSpSubmit = () => {
    if (!spModal) return;
    const amt = parseInt(spAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('SP는 양수 숫자를 입력하세요.'); return; }
    if (!spReason.trim()) { toast.error('지급 사유를 입력하세요.'); return; }
    const res = growth.addStudentSP(spModal.studentId, amt, spReason, 'MANUAL', undefined, currentUser.name);
    if (res.ok) {
      toast.success(`${spModal.studentName}에게 SP ${amt} 지급 완료`);
      setSpModal(null); setSpAmount(''); setSpReason('');
    } else toast.error(res.reason ?? '오류');
  };

  const handleEmblemSubmit = () => {
    if (!embModal || !emblemId) { toast.error('엠블럼을 선택하세요.'); return; }
    const res = growth.awardEmblemMock(embModal.studentId, emblemId, 'MANUAL', undefined, currentUser.name);
    if (res.ok) {
      const emb = growth.getEmblemById(emblemId);
      toast.success(`${embModal.studentName}에게 '${emb?.name}' 엠블럼 지급 완료`);
      setEmbModal(null); setEmblemId('');
    } else toast.error(res.reason ?? '오류');
  };

  const activeEmblems = growth.emblems.filter(e => e.active);

  const statCards = [
    { label: '성장 프로필 학생 수', value: stats.profileCount,                  icon: <Users size={18} />, color: '#3B82F6' },
    { label: '총 발급 엠블럼',      value: stats.totalEmblemsIssued,             icon: <Trophy size={18} />, color: '#C9A84C' },
    { label: '이번 시즌 SP 합계',   value: stats.seasonSPTotal.toLocaleString(), icon: <Zap size={18} />,   color: '#10B981' },
    { label: '활성 라이벌 수',      value: stats.activeRivals,                   icon: <Star size={18} />,  color: '#EF4444' },
    { label: '숨겨진 엠블럼',       value: stats.hiddenEmblems,                  icon: <Eye size={18} />,   color: '#8B5CF6' },
  ];

  return (
    <AdminLayout title="성장현황" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '성장현황' }]}>
      {/* 요약 카드 5개 */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {statCards.map((card, i) => (
          <div key={i} className="axis-card p-4">
            <div className="flex items-center gap-2 mb-2" style={{ color: card.color }}>
              {card.icon}
              <span className="text-xs font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>{card.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 검색 + 최근 이력 토글 */}
      <div className="flex gap-3 mb-3">
        <div className="axis-card p-3 flex-1">
          <input type="text" placeholder="학생명 또는 닉네임 검색..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm outline-none"
            style={{ border: 'none', color: 'oklch(0.2 0.02 250)', background: 'transparent' }} />
        </div>
        <button onClick={() => setShowRecentLogs(!showRecentLogs)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: showRecentLogs ? '#EEF2FF' : 'oklch(0.97 0.004 250)', color: showRecentLogs ? '#4F46E5' : 'oklch(0.5 0.015 250)', border: '1px solid oklch(0.9 0.006 250)' }}>
          <Clock size={14} /> 최근 SP 이력
        </button>
      </div>

      {/* 최근 SP 이력 패널 */}
      {showRecentLogs && (
        <div className="axis-card p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'oklch(0.15 0.02 250)' }}>최근 SP 지급 이력 (최근 10건)</h3>
          {recentLogs.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>이력 없음</p>
          ) : (
            <div className="axis-table-wrap">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.92 0.006 250)' }}>
                  {['일자', '학생', 'SP', '사유', '출처', '지급자'].map(h => (
                    <th key={h} className="text-left pb-1.5 font-semibold" style={{ color: 'oklch(0.4 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => {
                  const st = students.find(s => s.id === log.studentId);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid oklch(0.96 0.004 250)' }}>
                      <td className="py-1.5" style={{ color: 'oklch(0.5 0.015 250)' }}>{log.createdAt}</td>
                      <td className="py-1.5 font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>{st?.name ?? log.studentId}</td>
                      <td className="py-1.5 font-bold" style={{ color: '#059669' }}>+{log.amount}</td>
                      <td className="py-1.5" style={{ color: 'oklch(0.4 0.015 250)', maxWidth: 200 }}>
                        <span className="block truncate" title={log.reason}>{log.reason}</span>
                      </td>
                      <td className="py-1.5">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#EEF2FF', color: '#4338CA' }}>
                          {SOURCE_TYPE_LABELS[log.sourceType]}
                        </span>
                      </td>
                      <td className="py-1.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{log.createdBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* 학생 목록 테이블 */}
      <div className="axis-card overflow-hidden">
        <div className="axis-table-wrap">
        <table className="w-full text-sm border-collapse" style={{ minWidth: 680 }}>
          <thead>
            <tr style={{ background: 'oklch(0.97 0.004 250)', borderBottom: '1px solid oklch(0.92 0.006 250)' }}>
              {['학생명', '닉네임', '티어', '누적 SP', '이번 시즌 SP', '대표 엠블럼', '현재 라이벌', '보유 엠블럼', '관리'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>성장 프로필이 있는 학생이 없습니다.</td></tr>
            )}
            {rows.map(({ s, profile, achieved, repEmblems, rivalName }) => {
              const tier = (profile?.tier ?? 'UNRANKED') as StudentTier;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid oklch(0.95 0.004 250)' }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'oklch(0.18 0.02 250)' }}>{s.name}</td>
                  <td className="px-4 py-2.5 italic" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    {profile?.nickname ?? <span style={{ color: 'oklch(0.8 0.01 250)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {profile ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                        style={{ background: TIER_COLORS[tier] + '22', color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}44` }}>
                        {TIER_LABELS[tier]}
                      </span>
                    ) : <span className="text-xs" style={{ color: 'oklch(0.75 0.01 250)' }}>미등록</span>}
                  </td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: '#1D4ED8' }}>
                    {profile?.totalSP.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: '#059669' }}>
                    {profile?.seasonSP.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-2.5">
                    {repEmblems.length > 0 ? (
                      <div className="flex gap-1">
                        {repEmblems.map(e => (
                          <span key={e.id} title={`${e.name} (${CATEGORY_LABELS[e.category]})`}
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-bold"
                            style={{ background: MATERIAL_BADGE[e.material].bg, color: MATERIAL_BADGE[e.material].text, border: `1px solid ${MATERIAL_BADGE[e.material].border}` }}>
                            {MATERIAL_LABELS[e.material]}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-xs" style={{ color: 'oklch(0.8 0.01 250)' }}>없음</span>}
                  </td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'oklch(0.35 0.015 250)' }}>
                    {rivalName ?? <span style={{ color: 'oklch(0.8 0.01 250)' }}>없음</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: achieved.length > 0 ? '#EEF2FF' : 'oklch(0.95 0.004 250)', color: achieved.length > 0 ? '#4F46E5' : 'oklch(0.6 0.015 250)' }}>
                      {achieved.length}개
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/students/${s.id}?tab=growth`}>
                        <span className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer" style={{ color: 'oklch(0.45 0.2 277)' }}>
                          상세 <ChevronRight size={11} />
                        </span>
                      </Link>
                      {canGrant && profile && (
                        <button onClick={() => { setSpModal({ studentId: s.id, studentName: s.name }); setSpAmount(''); setSpReason(''); }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                          <Plus size={10} />SP
                        </button>
                      )}
                      {canGrantEmblem && profile && (
                        <button onClick={() => { setEmbModal({ studentId: s.id, studentName: s.name }); setEmblemId(''); }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                          <Trophy size={10} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* SP 수동 지급 모달 */}
      {spModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-80 p-6">
            <h3 className="font-bold text-base mb-1" style={{ color: 'oklch(0.15 0.02 250)' }}>SP 수동 지급</h3>
            <p className="text-xs mb-4" style={{ color: 'oklch(0.55 0.015 250)' }}>대상: <strong>{spModal.studentName}</strong></p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>SP 금액 *</label>
                <input type="number" min={1} value={spAmount} onChange={e => setSpAmount(e.target.value)}
                  placeholder="예: 50"
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>지급 사유 *</label>
                <input value={spReason} onChange={e => setSpReason(e.target.value)}
                  placeholder="예: 우수 성적 달성"
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setSpModal(null)}
                className="px-4 py-1.5 text-sm rounded-md border" style={{ borderColor: 'oklch(0.87 0.006 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
              <button onClick={handleSpSubmit}
                className="px-4 py-1.5 text-sm rounded-md font-semibold"
                style={{ background: '#059669', color: '#fff' }}>지급</button>
            </div>
          </div>
        </div>
      )}

      {/* 엠블럼 수동 지급 모달 */}
      {embModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
            <h3 className="font-bold text-base mb-1" style={{ color: 'oklch(0.15 0.02 250)' }}>엠블럼 수동 지급</h3>
            <p className="text-xs mb-4" style={{ color: 'oklch(0.55 0.015 250)' }}>대상: <strong>{embModal.studentName}</strong></p>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>엠블럼 선택 *</label>
              <select value={emblemId} onChange={e => setEmblemId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}>
                <option value="">— 선택 —</option>
                {activeEmblems.map(e => (
                  <option key={e.id} value={e.id}>
                    [{CATEGORY_LABELS[e.category]}] {e.name} ({MATERIAL_LABELS[e.material]})
                  </option>
                ))}
              </select>
            </div>
            {emblemId && (
              <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'oklch(0.97 0.004 250)', border: '1px solid oklch(0.92 0.006 250)' }}>
                {(() => {
                  const emb = growth.getEmblemById(emblemId);
                  if (!emb) return null;
                  return <>
                    <div className="font-semibold mb-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{emb.name}</div>
                    <div style={{ color: 'oklch(0.5 0.015 250)' }}>{emb.conditionText}</div>
                    {emb.hidden && <div className="mt-1 text-xs" style={{ color: '#8B5CF6' }}>🔒 숨김 엠블럼</div>}
                  </>;
                })()}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setEmbModal(null)}
                className="px-4 py-1.5 text-sm rounded-md border" style={{ borderColor: 'oklch(0.87 0.006 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
              <button onClick={handleEmblemSubmit}
                className="px-4 py-1.5 text-sm rounded-md font-semibold"
                style={{ background: 'oklch(0.15 0.02 250)', color: '#C9A84C' }}>지급</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
