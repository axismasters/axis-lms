// AXIS LMS v1.2 - 성장현황 (Growth Showcase Foundation v1)
// 관리자 전용. 학생/보호자 화면 없음.

import { useState } from 'react';
import { Link } from 'wouter';
import { Trophy, Star, Zap, Users, Eye, ChevronRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useGrowth } from '@/contexts/GrowthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessGrowth } from '@/lib/rbac';
import {
  TIER_LABELS, TIER_COLORS, MATERIAL_LABELS, MATERIAL_BADGE,
  StudentTier,
} from '@/lib/growthData';

export default function GrowthOverview() {
  const { currentUser } = useAuth();
  const growth = useGrowth();
  const { students } = useStudents();
  const [search, setSearch] = useState('');

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
      const repEmblems = (profile?.representativeEmblemIds ?? [])
        .map(id => growth.getEmblemById(id))
        .filter((e): e is NonNullable<typeof e> => !!e);
      const rivalName = profile?.currentRivalId
        ? students.find(st => st.id === profile.currentRivalId)?.name
        : undefined;
      return { s, profile, achieved, repEmblems, rivalName };
    })
    .filter(row =>
      row.s.name.includes(search) ||
      (row.profile?.nickname ?? '').includes(search),
    );

  const statCards = [
    { label: '성장 프로필 학생 수', value: stats.profileCount,                    icon: <Users size={18} />, color: '#3B82F6' },
    { label: '총 발급 엠블럼',      value: stats.totalEmblemsIssued,               icon: <Trophy size={18} />, color: '#C9A84C' },
    { label: '이번 시즌 SP 합계',   value: stats.seasonSPTotal.toLocaleString(),   icon: <Zap size={18} />,   color: '#10B981' },
    { label: '활성 라이벌 수',      value: stats.activeRivals,                     icon: <Star size={18} />,  color: '#EF4444' },
    { label: '숨겨진 엠블럼',       value: stats.hiddenEmblems,                    icon: <Eye size={18} />,   color: '#8B5CF6' },
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

      {/* 검색 */}
      <div className="axis-card p-3 mb-3">
        <input
          type="text"
          placeholder="학생명 또는 닉네임 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-sm outline-none"
          style={{ border: 'none', color: 'oklch(0.2 0.02 250)', background: 'transparent' }}
        />
      </div>

      {/* 목록 테이블 */}
      <div className="axis-card overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'oklch(0.97 0.004 250)', borderBottom: '1px solid oklch(0.92 0.006 250)' }}>
              {['학생명', '닉네임', '티어', '누적 SP', '이번 시즌 SP', '대표 엠블럼', '현재 라이벌', '보유 엠블럼', '관리'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  성장 프로필이 있는 학생이 없습니다.
                </td>
              </tr>
            )}
            {rows.map(({ s, profile, achieved, repEmblems, rivalName }) => {
              const tier = (profile?.tier ?? 'UNRANKED') as StudentTier;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid oklch(0.95 0.004 250)' }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'oklch(0.18 0.02 250)' }}>{s.name}</td>
                  <td className="px-4 py-2.5" style={{ color: 'oklch(0.45 0.015 250)', fontStyle: 'italic' }}>
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
                          <span key={e.id} title={e.name}
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
                      style={{
                        background: achieved.length > 0 ? '#EEF2FF' : 'oklch(0.95 0.004 250)',
                        color: achieved.length > 0 ? '#4F46E5' : 'oklch(0.6 0.015 250)',
                      }}>
                      {achieved.length}개
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/students/${s.id}?tab=growth`}>
                      <span className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                        style={{ color: 'oklch(0.45 0.2 277)' }}>
                        상세 <ChevronRight size={11} />
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
