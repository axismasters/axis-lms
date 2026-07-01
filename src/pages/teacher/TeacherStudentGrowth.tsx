// AXIS LMS v1.2 — Phase 3A: TeacherStudentGrowth
// 강사용 담당 학생 성장 요약 — IF 상승 가능성 / SP / Emblem / Rival 현황
//
// 강사 금지:
//   - 재무/수납 접근 금지
//   - 관리자 Rival 시즌 정책 변경 금지
//   - 대학추천 상세 리포트/PDF 접근 금지
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격 표현 금지

import { useState } from 'react';
import { TrendingUp, Award, Zap, Swords, BarChart2, Lightbulb, ChevronRight } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import { TIER_LABELS, TIER_COLORS, MATERIAL_BADGE } from '@/lib/growthData';
import { AxisEmblemBadge } from '@/components/brand/AxisEmblemBadge';
import { detectStudentGradeLevel } from '@/lib/universityMenuLabel';
import { getSchoolRecordsForStudent, getNationalMocksForStudent } from '@/lib/phase2dData';
import { estimateIfPotentialFromAveragePct } from '@/lib/ifAnalysisEngine';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 145)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

function GrowthCard({ studentId }: { studentId: string }) {
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();
  const { getProfile, getStudentEmblems, getRivalInfo, emblems } = useGrowth();

  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const profile = getProfile(studentId);
  const myEmblems = getStudentEmblems(studentId).filter(e => e.achieved);
  const recentEmblems = myEmblems.slice(0, 3).map(e => ({ e, def: emblems.find(d => d.id === e.emblemId) })).filter(x => x.def);
  const rivalInfo = getRivalInfo(studentId);
  const gradeLevel = detectStudentGradeLevel(student);

  const publishedResults = getPublishedResultsForStudent(exams, submissions, studentId);
  const schoolRecords = getSchoolRecordsForStudent(studentId);
  const nationalMocks = getNationalMocksForStudent(studentId);

  // [Phase 3D v3-r9] IF 상승 가능성 계산은 컴포넌트 밖 IF Analysis Engine으로 이동
  // (화면 컴포넌트에 판단/계산 로직을 직접 넣지 않는다는 원칙 준수).
  const avgPct = publishedResults.length > 0
    ? Math.round(publishedResults.reduce((s, r) => s + (r.totalPoints > 0 ? r.earnedScore / r.totalPoints * 100 : 0), 0) / publishedResults.length)
    : null;
  const ifPotential = estimateIfPotentialFromAveragePct(avgPct);

  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '-';

  return (
    <Link href={`/teacher/students/${studentId}`} style={{ display: 'block' }}>
      <div className="axis-card p-4 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{ background: tierColor }}>
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</span>
              {gradeLevel && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#F8F0DC', color: '#C8A15A' }}>
                  {gradeLevel}
                </span>
              )}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: tierColor + '18', color: tierColor }}>
                {tierLabel}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
              SP {profile?.totalSP.toLocaleString() ?? 0} · 엠블럼 {myEmblems.length}개
            </div>
          </div>
          <ChevronRight size={14} style={{ color: 'oklch(0.7 0.01 250)', flexShrink: 0 }} />
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: '학원 평균', value: avgPct !== null ? `${avgPct}%` : '-', color: avgPct !== null ? scoreColor(avgPct) : 'oklch(0.6 0.015 250)' },
            { label: 'IF 잠재력', value: ifPotential !== null ? `+${ifPotential}%p` : '-', color: '#040D1E' },
            { label: 'Rival 승', value: profile ? `${profile.rivalWins}승` : '-', color: '#040D1E' },
            { label: '모의 등급', value: nationalMocks.length > 0 ? `${Math.min(...nationalMocks.map(m => m.grade))}등급` : '-', color: 'oklch(0.45 0.15 145)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
              <div className="font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
              <div style={{ fontSize: 9, color: 'oklch(0.6 0.015 250)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 최근 엠블럼 */}
        {recentEmblems.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>최근 엠블럼:</span>
            {recentEmblems.map(({ e, def }) => (
              <span key={e.id} className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'oklch(0.98 0.006 90)', color: 'oklch(0.3 0.02 250)', border: '1px solid oklch(0.9 0.01 90)' }}>
                <AxisEmblemBadge iconKey={def!.iconKey} level={def!.level} size={20} />
                {def!.name}
              </span>
            ))}
          </div>
        )}

        {/* IF 채점 안내 */}
        {ifPotential !== null && ifPotential > 5 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: '#040D1E' }}>
            <Lightbulb size={11} />
            IF 채점 활용 시 약 +{ifPotential}%p 향상 가능성 (추정)
          </div>
        )}
      </div>
    </Link>
  );
}

export default function TeacherStudentGrowth() {
  const { currentUser } = useAuth();
  const { getProfile } = useGrowth();
  const [sortBy, setSortBy] = useState<'sp' | 'name'>('sp');

  const assignedStudentIds = currentUser.assignedStudentIds ?? [];

  // SP 기준으로 정렬 (옵션)
  const sortedIds = [...assignedStudentIds].sort((a, b) => {
    if (sortBy === 'sp') {
      const pa = getProfile(a)?.totalSP ?? 0;
      const pb = getProfile(b)?.totalSP ?? 0;
      return pb - pa;
    }
    return 0; // 기본 순서 유지
  });

  return (
    <TeacherLayout title="학생 성장 현황">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* 안내 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ borderLeft: '3px solid #040D1E', color: 'oklch(0.5 0.015 250)' }}>
          담당 학생의 성장 지표를 한눈에 확인합니다. IF 상승 가능성이 높은 학생에게 집중 피드백을 제공하세요.
        </div>

        {/* 전체 요약 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: BarChart2, label: '담당 학생', value: `${assignedStudentIds.length}명`, color: '#040D1E' },
            { icon: Zap, label: '평균 SP', value: assignedStudentIds.length > 0 ? `${Math.round(assignedStudentIds.reduce((s, id) => s + (getProfile(id)?.totalSP ?? 0), 0) / assignedStudentIds.length).toLocaleString()}` : '-', color: 'oklch(0.4 0.1 80)' },
            { icon: Lightbulb, label: 'IF 분석 안내', value: '성적 탭', color: '#040D1E' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="axis-card p-3 text-center">
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <div className="font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>정렬:</span>
          {[['sp', 'SP 높은 순'], ['name', '기본 순서']] .map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSortBy(key as 'sp' | 'name')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: sortBy === key ? '#040D1E' : 'oklch(0.95 0.004 250)',
                color: sortBy === key ? 'white' : 'oklch(0.5 0.015 250)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* 학생 성장 카드 목록 */}
        {assignedStudentIds.length === 0 ? (
          <div className="axis-card p-8 text-center">
            <TrendingUp size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 학생이 없습니다.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedIds.map(id => <GrowthCard key={id} studentId={id} />)}
          </div>
        )}

        {/* IF 채점 이동 */}
        <Link href="/teacher/grades" style={{ display: 'block' }}>
          <div className="axis-card p-4 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} style={{ color: '#040D1E' }} />
              <div>
                <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>시험별 IF 채점 분석</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>성적 화면 → 시험 클릭 → IF 채점 블록</div>
              </div>
            </div>
            <ChevronRight size={15} style={{ color: 'oklch(0.7 0.01 250)' }} />
          </div>
        </Link>

      </div>
    </TeacherLayout>
  );
}
