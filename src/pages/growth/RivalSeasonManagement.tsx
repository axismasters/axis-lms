// AXIS LMS v1.2 — Phase 2F: RivalSeasonManagement (Student Portal Core Rebuild v1)
// 관리자 Rival 시즌 관리
//
// Phase 2F 정책:
//   - 관리자만 전체 Rival 연결 관계 조회 가능
//   - 학생에게 전체 연결 관계, 실명, 누가 지정했는지 절대 노출 금지
//   - 시즌 생성/종료/보상 기준은 관리자만 설정 가능
//
// 경로: /admin/growth/rival-seasons

import { useState } from 'react';
import { Plus, Play, StopCircle, Trophy, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessGrowth } from '@/lib/rbac';
import { MOCK_RIVAL_SEASONS, getActiveSeason } from '@/lib/rivalSeasonData';
import type { RivalSeason, RivalSeasonStatus } from '@/lib/rivalSeasonData';
import { toast } from 'sonner';

// ─── 상태 배지 스타일 ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: RivalSeasonStatus }) {
  const style = {
    '진행중': { bg: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.15 145)' },
    '예정':   { bg: 'oklch(0.93 0.06 80)',  color: 'oklch(0.4 0.15 80)' },
    '종료':   { bg: 'oklch(0.93 0.006 250)', color: 'oklch(0.5 0.01 250)' },
  }[status];
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={style}>
      {status}
    </span>
  );
}

// ─── 시즌 상세 확장 패널 ───────────────────────────────────────────────
function SeasonDetail({ season }: { season: RivalSeason }) {
  return (
    <div className="px-4 pb-4 space-y-3">
      {/* 기간/대상 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: '기간', value: `${season.startDate} ~ ${season.endDate}` },
          { label: '대상 학년', value: season.targetGrades.join(', ') },
          { label: '참여 학생', value: `${season.participantCount}명` },
          { label: '활성 Rival', value: `${season.activeRivalCount}쌍` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg p-2" style={{ background: 'oklch(0.97 0.003 250)' }}>
            <div style={{ color: 'oklch(0.55 0.015 250)', marginBottom: 2 }}>{label}</div>
            <div className="font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>{value}</div>
          </div>
        ))}
      </div>
      {/* 승패 기준 */}
      <div className="rounded-lg p-3 text-xs" style={{ background: 'oklch(0.97 0.003 250)' }}>
        <div className="font-semibold mb-1" style={{ color: 'oklch(0.3 0.02 250)' }}>승패 기준</div>
        <div className="space-y-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
          <div><span className="font-semibold" style={{ color: 'oklch(0.45 0.15 145)' }}>WIN: </span>{season.winCondition}</div>
          <div><span className="font-semibold" style={{ color: 'oklch(0.55 0.2 27)' }}>LOSE: </span>{season.loseCondition}</div>
          <div><span className="font-semibold">무승부: </span>{season.drawCondition}</div>
        </div>
      </div>
      {/* 보상 기준 */}
      <div className="rounded-lg p-3 text-xs" style={{ background: 'oklch(0.97 0.003 250)' }}>
        <div className="font-semibold mb-1" style={{ color: 'oklch(0.3 0.02 250)' }}>보상 기준</div>
        <div className="space-y-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
          <div className="flex gap-2">
            <span className="font-semibold text-green-600">SP 승리: +{season.spReward.win}</span>
            <span className="font-semibold text-gray-500">패배: +{season.spReward.loss}</span>
            <span className="font-semibold text-blue-500">무: +{season.spReward.draw}</span>
          </div>
          <div><span className="font-semibold">연승 보너스: </span>{season.streakBonus}</div>
          <div><span className="font-semibold">복수 보너스: </span>{season.revengeBonus}</div>
          <div><span className="font-semibold">엠블럼: </span>{season.emblemCondition}</div>
        </div>
      </div>
      {season.status === '진행중' && (
        <button type="button"
          onClick={() => toast.success('시즌 종료 처리는 관리자 승인 후 실행됩니다. (mock)')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'oklch(0.55 0.2 27)', color: 'white' }}>
          <StopCircle size={15} /> 시즌 종료 처리 (관리자 승인 필요)
        </button>
      )}
      <div className="text-xs text-center" style={{ color: 'oklch(0.65 0.015 250)' }}>
        시즌 종료 후 기록은 영구 보관됩니다. SP/엠블럼 지급은 관리자가 수동 처리합니다.
      </div>
    </div>
  );
}

// ─── 신규 시즌 생성 폼 ────────────────────────────────────────────────
function CreateSeasonModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [winSP, setWinSP] = useState('20');
  const [loseSP, setLoseSP] = useState('5');
  const [drawSP, setDrawSP] = useState('10');
  const [streakBonus, setStreakBonus] = useState('연승 3회 시 SP +50');
  const [revengeBonus, setRevengeBonus] = useState('복수 성공 시 SP +30');
  const [emblemCond, setEmblemCond] = useState('');

  const GRADE_OPTIONS = ['고1', '고2', '고3', 'N수'];
  const toggleGrade = (g: string) =>
    setGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const inputStyle = {
    width: '100%', border: '1px solid oklch(0.9 0.008 250)', borderRadius: 8,
    padding: '7px 12px', fontSize: 13, background: 'oklch(0.98 0.002 250)', outline: 'none',
  };
  const labelStyle = { fontSize: 11, color: 'oklch(0.55 0.015 250)', marginBottom: 4, display: 'block' as const };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl"
        style={{ maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>시즌 생성 (mock)</div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ color: 'oklch(0.5 0.015 250)' }}>닫기</button>
        </div>
        <div className="px-5 pb-6 space-y-4">
          <div>
            <label style={labelStyle}>시즌명 *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="예: 2025 AXIS Summer Rival" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>시작일 *</label>
              <input type="date" style={inputStyle} value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>종료일 *</label>
              <input type="date" style={inputStyle} value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>대상 학년</label>
            <div className="flex gap-2">
              {GRADE_OPTIONS.map(g => (
                <button key={g} type="button" onClick={() => toggleGrade(g)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: grades.includes(g) ? '#040D1E' : 'oklch(0.95 0.004 250)',
                    color: grades.includes(g) ? 'white' : 'oklch(0.5 0.015 250)',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>SP 지급 기준</label>
            <div className="grid grid-cols-3 gap-2">
              {[['승리', winSP, setWinSP], ['패배', loseSP, setLoseSP], ['무승부', drawSP, setDrawSP]].map(
                ([label, val, setter]) => (
                  <div key={label as string}>
                    <div style={{ ...labelStyle, marginBottom: 2 }}>{label as string}</div>
                    <input type="number" style={inputStyle} value={val as string}
                      onChange={e => (setter as (v: string) => void)(e.target.value)} />
                  </div>
                )
              )}
            </div>
          </div>
          <div>
            <label style={labelStyle}>연승 보너스 설명</label>
            <input style={inputStyle} value={streakBonus} onChange={e => setStreakBonus(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>복수 성공 보너스 설명</label>
            <input style={inputStyle} value={revengeBonus} onChange={e => setRevengeBonus(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>엠블럼 지급 조건</label>
            <input style={inputStyle} value={emblemCond} onChange={e => setEmblemCond(e.target.value)}
              placeholder="예: 시즌 5승 이상 시 특별 엠블럼 지급" />
          </div>
          <button type="button"
            onClick={() => { toast.success(`시즌 "${name || '(미입력)'}" 생성 요청됨 (mock — 실제 DB 저장 미구현)`); onClose(); }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: '#040D1E', color: 'white' }}>
            시즌 생성 (mock)
          </button>
          <div className="text-xs text-center" style={{ color: 'oklch(0.65 0.015 250)' }}>
            실제 DB 저장은 Phase 3+ API 연동 시 구현됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────
export default function RivalSeasonManagement() {
  const { currentUser } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (!canAccessGrowth(currentUser.accountType)) {
    return (
      <AdminLayout title="Rival 시즌 관리"
        breadcrumbs={[{ label: '성장관리', path: '/admin/growth/overview' }, { label: 'Rival 시즌 관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>접근 권한이 없습니다.</p>
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>Rival 시즌 관리는 최고관리자·원장·행정 계정만 접근할 수 있습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const activeSeason = getActiveSeason();
  const seasons = MOCK_RIVAL_SEASONS;

  return (
    <AdminLayout title="Rival 시즌 관리"
      breadcrumbs={[{ label: '성장관리', path: '/admin/growth/overview' }, { label: 'Rival 시즌 관리' }]}>
      <div className="max-w-2xl space-y-4">

        {/* 현재 시즌 요약 */}
        {activeSeason ? (
          <div className="axis-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Play size={15} style={{ color: 'oklch(0.45 0.15 145)' }} />
              <span className="font-semibold text-sm">진행 중인 시즌</span>
              <StatusBadge status={activeSeason.status} />
            </div>
            <div className="font-bold text-base mb-1" style={{ color: 'oklch(0.15 0.02 250)' }}>{activeSeason.name}</div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: '기간', value: `${activeSeason.startDate.slice(5)} ~ ${activeSeason.endDate.slice(5)}` },
                { label: '참여 학생', value: `${activeSeason.participantCount}명` },
                { label: '활성 Rival', value: `${activeSeason.activeRivalCount}쌍` },
                { label: '대상', value: activeSeason.targetGrades.join('/') },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'oklch(0.97 0.003 250)' }}>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>{value}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="axis-card p-4 text-center">
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>진행 중인 시즌이 없습니다.</div>
          </div>
        )}

        {/* 시즌 생성 버튼 */}
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: '#040D1E', color: 'white' }}>
            <Plus size={15} /> 새 시즌 생성
          </button>
        </div>

        {/* 시즌 목록 */}
        <div className="space-y-2">
          <div className="px-1 text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>
            전체 시즌 ({seasons.length}개)
          </div>
          {seasons.map(season => (
            <div key={season.id} className="axis-card overflow-hidden">
              <button type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedId(prev => prev === season.id ? null : season.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: season.status === '진행중' ? 'oklch(0.92 0.08 145)' : 'oklch(0.95 0.004 250)' }}>
                    <Trophy size={14} style={{ color: season.status === '진행중' ? 'oklch(0.3 0.15 145)' : 'oklch(0.6 0.015 250)' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{season.name}</span>
                      <StatusBadge status={season.status} />
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                      <Calendar size={10} className="inline mr-1" />
                      {season.startDate} ~ {season.endDate}
                      <Users size={10} className="inline ml-2 mr-1" />
                      {season.participantCount}명 · {season.targetGrades.join(', ')}
                    </div>
                  </div>
                </div>
                {expandedId === season.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {expandedId === season.id && <SeasonDetail season={season} />}
            </div>
          ))}
        </div>

        {/* 기록 보관 안내 */}
        <div className="axis-card p-4 text-xs" style={{ borderLeft: '3px solid #040D1E', color: 'oklch(0.5 0.015 250)' }}>
          <strong>시즌 기록 보관 정책:</strong> 종료된 시즌의 승패 기록과 SP 지급 내역은 영구 보관됩니다.
          학생에게는 자신의 기록만 공개되며, 전체 Rival 연결 관계는 관리자만 조회할 수 있습니다.
        </div>

      </div>

      {showCreate && <CreateSeasonModal onClose={() => setShowCreate(false)} />}
    </AdminLayout>
  );
}
