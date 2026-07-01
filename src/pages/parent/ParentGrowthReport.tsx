// AXIS LMS v1.2 — Phase 3A: ParentGrowthReport
// 학부모용 자녀 성장 리포트 — 성적 변화 / IF 요약 / 엠블럼 / SP
//
// 학부모 정책:
//   - 자녀 성장 데이터 읽기 전용
//   - Rival/경쟁 정보 과다 노출 금지 (Rival 연결 관계/닉네임 상세 금지)
//   - 합격 관련 표현 금지
//   - 수납 내역은 /parent/finance에서만
//
// 경로: /parent/growth

import { useState } from 'react';
import { TrendingUp, Award, Zap, Lightbulb, BarChart2 } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import { STUDENT_HIDDEN_CATEGORY_IDS, getSchoolRecordsForStudent, getNationalMocksForStudent } from '@/lib/phase2dData';
import { TIER_LABELS, TIER_COLORS, MATERIAL_BADGE } from '@/lib/growthData';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 145)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

export default function ParentGrowthReport() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();
  const { getProfile, getStudentEmblems, getSPLogs, emblems } = useGrowth();

  // 보호자 자녀 선택
  const myStudentIds = currentUser.assignedStudentIds ?? [];
  const [selectedId, setSelectedId] = useState(myStudentIds[0] ?? '');
  const student = students.find(s => s.id === selectedId);
  const profile = getProfile(selectedId);
  const myEmblems = getStudentEmblems(selectedId).filter(e => e.achieved);
  const spLogs = getSPLogs(selectedId, 5);

  const publishedResults = getPublishedResultsForStudent(exams, submissions, selectedId)
    .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any));
  const schoolRecords = getSchoolRecordsForStudent(selectedId);
  const nationalMocks = getNationalMocksForStudent(selectedId);

  // 성적 추이 (최근 5회)
  const sortedResults = [...publishedResults].sort((a, b) => a.examDate.localeCompare(b.examDate)).slice(-5);
  const scoreTrend = sortedResults.length >= 2
    ? Math.round((sortedResults[sortedResults.length-1].earnedScore / sortedResults[sortedResults.length-1].totalPoints * 100) -
                 (sortedResults[0].earnedScore / sortedResults[0].totalPoints * 100))
    : null;

  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '-';
  const avgPct = sortedResults.length > 0
    ? Math.round(sortedResults.reduce((s, r) => s + (r.totalPoints > 0 ? r.earnedScore / r.totalPoints * 100 : 0), 0) / sortedResults.length)
    : null;
  const ifPotential = avgPct !== null ? Math.min(100 - avgPct, 20) : null;

  return (
    <ParentLayout title="자녀 성장 리포트">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        {myStudentIds.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {myStudentIds.map(id => {
              const s = students.find(st => st.id === id);
              return (
                <button key={id} type="button" onClick={() => setSelectedId(id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{
                    background: selectedId === id ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.95 0.004 250)',
                    color: selectedId === id ? 'white' : 'oklch(0.5 0.015 250)',
                  }}>
                  {s?.name ?? id}
                </button>
              );
            })}
          </div>
        )}

        {/* 성장 현황 요약 */}
        <div className="axis-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: tierColor }}>
              {student?.name.charAt(0) ?? '?'}
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {student?.name ?? '자녀'} 성장 리포트
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tierColor + '18', color: tierColor, border: `1px solid ${tierColor}44` }}>
                  {tierLabel}
                </span>
                <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.1 80)' }}>
                  ⚡ {profile?.totalSP.toLocaleString() ?? 0} SP
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '시험 기록', value: `${publishedResults.length + schoolRecords.length}건`, color: 'oklch(0.511 0.262 276.966)' },
              { label: '엠블럼', value: `${myEmblems.length}개`, color: 'oklch(0.45 0.15 160)' },
              { label: '모의고사', value: `${nationalMocks.length}회`, color: 'oklch(0.45 0.2 27)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                <div className="font-black text-base tabular-nums" style={{ color }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 성적 추이 */}
        {sortedResults.length > 0 && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 성적 추이</span>
              {scoreTrend !== null && (
                <span className="text-xs font-bold"
                  style={{ color: scoreTrend >= 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
                  {scoreTrend >= 0 ? `▲+${scoreTrend}%p` : `▼${scoreTrend}%p`}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {sortedResults.map(r => {
                const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                return (
                  <div key={r.examId} className="flex items-center gap-2">
                    <div className="text-xs w-24 truncate flex-shrink-0" style={{ color: 'oklch(0.55 0.015 250)' }}>
                      {r.examDate.slice(5)} {r.title.slice(0, 8)}
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreColor(pct) }} />
                    </div>
                    <div className="text-xs font-bold tabular-nums w-8 text-right flex-shrink-0"
                      style={{ color: scoreColor(pct) }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 내신 성적 */}
        {schoolRecords.length > 0 && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} style={{ color: 'oklch(0.45 0.15 145)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>내신 성적</span>
            </div>
            {schoolRecords.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-b-0"
                style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
                <div className="text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
                  {r.semester} {r.subject} {r.examType}
                </div>
                <div className="font-bold text-sm"
                  style={{ color: r.grade <= 2 ? 'oklch(0.45 0.15 145)' : r.grade <= 4 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)' }}>
                  {r.grade}등급
                </div>
              </div>
            ))}
          </div>
        )}

        {/* IF 요약 */}
        {ifPotential !== null && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>IF 채점 요약</span>
            </div>
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'oklch(0.95 0.06 260)', color: 'oklch(0.3 0.1 260)' }}>
              최근 시험 평균 {avgPct}%를 기준으로, 실수로 놓친 문제를 모두 맞혔다면
              약 <strong>+{ifPotential}%p</strong> 향상 가능성이 있습니다.
              IF 채점은 학생 화면에서 직접 확인할 수 있습니다.
            </div>
          </div>
        )}

        {/* 획득 엠블럼 */}
        {myEmblems.length > 0 && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
                획득 엠블럼 ({myEmblems.length}개)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {myEmblems.slice(0, 6).map(se => {
                const def = emblems.find(e => e.id === se.emblemId);
                if (!def) return null;
                const badge = MATERIAL_BADGE[def.material];
                return (
                  <div key={se.id} className="flex flex-col items-center gap-1 w-16">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                      style={{ background: badge.bg, border: `2px solid ${badge.border}` }}>🏅</div>
                    <div className="text-xs text-center truncate w-full" style={{ color: 'oklch(0.5 0.015 250)', fontSize: 10 }}>
                      {def.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SP 내역 요약 */}
        {spLogs.length > 0 && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} style={{ color: 'oklch(0.7 0.18 80)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
                최근 SP 획득 내역
              </span>
              <span className="font-black text-sm tabular-nums" style={{ color: 'oklch(0.4 0.1 80)' }}>
                총 {profile?.totalSP.toLocaleString() ?? 0} SP
              </span>
            </div>
            <div className="space-y-1.5">
              {spLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'oklch(0.5 0.015 250)' }}>{log.reason}</span>
                  <span className="font-bold tabular-nums" style={{ color: 'oklch(0.4 0.1 80)' }}>+{log.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </ParentLayout>
  );
}
