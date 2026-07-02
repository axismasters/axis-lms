// AXIS LMS v1.2 - 성장현황 (Growth Showcase v2)
// [Phase 3D v3-r7-r1] 성장관리 대메뉴 비중 축소 — 이 화면은 전체 현황 요약(통계·최근 SP
// 이력·학생 목록)과 "학생 상세 성장 탭" 진입만 제공한다. SP 수동 지급/엠블럼 지급/라이벌
// 승패·종료 같은 운영 액션은 전부 제거했다 — 그 작업은 StudentDetail.tsx의 "성장/진열장"
// 탭에서만 한다(한 학생을 열어서 처리하는 것이 원칙). 엠블럼/라이벌 전체 관리 화면으로
// 가는 바로가기도 이 화면에서는 제공하지 않는다(주 운영 메뉴처럼 보이지 않게 함).
// 관리자 전용. 학생/보호자 화면 없음.

import { useState } from 'react';
import { Link } from 'wouter';
import { Trophy, Star, Zap, Users, Eye, ChevronRight, Clock } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useGrowth } from '@/contexts/GrowthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessGrowth } from '@/lib/rbac';
import {
  TIER_LABELS, TIER_COLORS,
  CATEGORY_LABELS, SOURCE_TYPE_LABELS, StudentTier,
} from '@/lib/growthData';
import { AxisEmblemBadge } from '@/components/brand/AxisEmblemBadge';

export default function GrowthOverview() {
  const { currentUser } = useAuth();
  const growth = useGrowth();
  const { students } = useStudents();

  const [search, setSearch] = useState('');
  const [showRecentLogs, setShowRecentLogs] = useState(false);

  if (!canAccessGrowth(currentUser.accountType)) {
    return (
      <AdminLayout title="성장현황" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '성장현황' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>접근 권한이 없습니다.</p>
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

  // 최근 SP 이력 (전체, 최근 10건) — 읽기 전용 현황 요약
  const recentLogs = [...growth.spLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const statCards = [
    { label: '성장 프로필 학생 수', value: stats.profileCount,                  icon: <Users size={18} />, color: '#3B82F6' },
    { label: '총 발급 엠블럼',      value: stats.totalEmblemsIssued,             icon: <Trophy size={18} />, color: '#C8A15A' },
    { label: '이번 시즌 SP 합계',   value: stats.seasonSPTotal.toLocaleString(), icon: <Zap size={18} />,   color: '#10B981' },
    { label: '활성 라이벌 수',      value: stats.activeRivals,                   icon: <Star size={18} />,  color: '#EF4444' },
    { label: '숨겨진 엠블럼',       value: stats.hiddenEmblems,                  icon: <Eye size={18} />,   color: '#040D1E' },
  ];

  return (
    <AdminLayout title="성장현황" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '성장현황' }]}>
      {/* 요약 카드 5개 */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {statCards.map((card, i) => (
          <div key={i} className="axis-card p-4">
            <div className="flex items-center gap-2 mb-2" style={{ color: card.color }}>
              {card.icon}
              <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>{card.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 검색 + 최근 이력 토글 — 둘 다 읽기 전용 현황 요약이다(운영 액션 없음) */}
      <div className="flex gap-3 mb-3 flex-wrap">
        <div className="axis-card p-3 flex-1" style={{ minWidth: 200 }}>
          <input type="text" placeholder="학생명 또는 닉네임 검색..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm outline-none"
            style={{ border: 'none', color: 'oklch(0.2 0.02 250)', background: 'transparent' }} />
        </div>
        <button onClick={() => setShowRecentLogs(!showRecentLogs)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: showRecentLogs ? '#E7EBF3' : 'oklch(0.97 0.004 250)', color: showRecentLogs ? '#4F46E5' : 'oklch(0.5 0.015 250)', border: '1px solid oklch(0.9 0.006 250)' }}>
          <Clock size={14} /> 최근 SP 이력
        </button>
      </div>

      {/* 최근 SP 이력 패널(읽기 전용) */}
      {showRecentLogs && (
        <div className="axis-card p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'oklch(0.15 0.02 250)' }}>최근 SP 지급 이력 (최근 10건)</h3>
          {recentLogs.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.47 0.015 250)' }}>이력 없음</p>
          ) : (
            <div className="axis-table-scroll" style={{ maxHeight: 320 }}>
            <table className="w-full text-xs border-collapse" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  {['일자', '학생', 'SP', '사유', '출처', '지급자'].map(h => (
                    <th key={h} className="text-left pb-1.5 font-semibold" style={{ color: 'oklch(0.4 0.015 250)', background: 'white', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.006 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => {
                  const st = students.find(s => s.id === log.studentId);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid oklch(0.96 0.004 250)' }}>
                      <td className="py-1.5" style={{ color: 'oklch(0.4 0.015 250)' }}>{log.createdAt}</td>
                      <td className="py-1.5 font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>{st?.name ?? log.studentId}</td>
                      <td className="py-1.5 font-bold" style={{ color: '#059669' }}>+{log.amount}</td>
                      <td className="py-1.5" style={{ color: 'oklch(0.4 0.015 250)', maxWidth: 200 }}>
                        <span className="block truncate" title={log.reason}>{log.reason}</span>
                      </td>
                      <td className="py-1.5">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#E7EBF3', color: '#040D1E' }}>
                          {SOURCE_TYPE_LABELS[log.sourceType]}
                        </span>
                      </td>
                      <td className="py-1.5" style={{ color: 'oklch(0.42 0.015 250)' }}>{log.createdBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* 학생 목록 테이블 — 읽기 전용 현황. "상세" 버튼만 제공하며, 실제 SP/엠블럼 지급과
          라이벌 승패/종료 조작은 전부 학생 상세(성장/진열장 탭)에서 처리한다. */}
      <div className="axis-card overflow-hidden">
        <div className="axis-table-scroll" style={{ maxHeight: 560 }}>
        <table className="w-full text-sm border-collapse" style={{ minWidth: 680 }}>
          <thead>
            <tr style={{ background: 'oklch(0.97 0.004 250)' }}>
              {['학생명', '닉네임', '티어', '누적 SP', '이번 시즌 SP', '대표 엠블럼', '현재 라이벌', '보유 엠블럼', '상세'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)', background: 'oklch(0.97 0.004 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.006 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: 'oklch(0.47 0.015 250)' }}>성장 프로필이 있는 학생이 없습니다.</td></tr>
            )}
            {rows.map(({ s, profile, achieved, repEmblems, rivalName }) => {
              const tier = (profile?.tier ?? 'UNRANKED') as StudentTier;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid oklch(0.95 0.004 250)' }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'oklch(0.18 0.02 250)' }}>{s.name}</td>
                  <td className="px-4 py-2.5 italic" style={{ color: 'oklch(0.35 0.015 250)' }}>
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
                      <div className="flex items-center gap-1.5">
                        {repEmblems.map(e => (
                          <span key={e.id} title={`${e.name} (${CATEGORY_LABELS[e.category]})`} className="inline-flex items-center">
                            <AxisEmblemBadge iconKey={e.iconKey} level={e.level} size={36} />
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
                      style={{ background: achieved.length > 0 ? '#E7EBF3' : 'oklch(0.95 0.004 250)', color: achieved.length > 0 ? '#4F46E5' : 'oklch(0.6 0.015 250)' }}>
                      {achieved.length}개
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/students/${s.id}?tab=growth`}>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-0.5">
                        상세 <ChevronRight size={11} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </AdminLayout>
  );
}
