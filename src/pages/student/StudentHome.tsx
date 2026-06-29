// AXIS LMS v1.2 - StudentHome (Student Portal Foundation v1)
// 학생 홈: 인사 / 빠른 이동 / 나의 진열장 / 최근 공개 성적.
// 성적은 getPublishedResultsForStudent() 정책에 따라 공개/반영 결과만 표시.

import { Link } from 'wouter';
import { Trophy, Zap, Award, BarChart2, BookOpen, CalendarCheck, ClipboardList } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { TIER_LABELS, TIER_COLORS, MATERIAL_BADGE } from '@/lib/growthData';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';

const QUICK_ACTIONS = [
  { icon: BookOpen,     label: '내 반',  path: '/student/classes',    color: 'oklch(0.511 0.262 276.966)' },
  { icon: ClipboardList, label: '숙제',   path: '/student/homework',   color: 'oklch(0.45 0.15 160)' },
  { icon: BarChart2,    label: '성적',   path: '/student/grades',     color: 'oklch(0.45 0.15 160)' },
  { icon: CalendarCheck, label: '출결',  path: '/student/attendance', color: 'oklch(0.55 0.15 80)' },
];

export default function StudentHome() {
  const { currentUser } = useAuth();
  const { getProfile, getStudentEmblems, emblems } = useGrowth();
  const { exams, submissions } = useAssessment();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const profile = myStudentId ? getProfile(myStudentId) : undefined;
  const myStudentEmblems = myStudentId ? getStudentEmblems(myStudentId) : [];

  const myEmblemsWithDef = myStudentEmblems
    .filter((se) => se.achieved)
    .map((se) => ({ se, def: emblems.find((e) => e.id === se.emblemId) }))
    .filter((x): x is { se: typeof x.se; def: NonNullable<typeof x.def> } => x.def !== undefined);

  // 공개/반영된 성적만 (visibility 정책 준수)
  const publishedResults = myStudentId
    ? getPublishedResultsForStudent(exams, submissions, myStudentId).slice(0, 3)
    : [];

  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '-';

  return (
    <StudentLayout title="AXIS 학생">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 인사 */}
        <div className="axis-card p-4">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
          <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>
            안녕하세요, {currentUser.name}님 ✨
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>
            오늘도 목표를 향해 나아가요!
          </div>
        </div>

        {/* 빠른 이동 */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map(({ icon: Icon, label, path, color }) => (
            <Link key={path} href={path} style={{ display: 'block' }}>
              <div className="axis-card p-3 flex flex-col items-center gap-1.5 cursor-pointer">
                <Icon size={20} style={{ color }} />
                <span className="text-xs font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 티어 + SP */}
        <div className="grid grid-cols-2 gap-3">
          <div className="axis-card p-4 flex flex-col items-center gap-1">
            <Trophy size={24} style={{ color: tierColor }} />
            <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>현재 티어</div>
            <div className="font-bold text-sm" style={{ color: tierColor }}>{tierLabel}</div>
          </div>
          <div className="axis-card p-4 flex flex-col items-center gap-1">
            <Zap size={24} style={{ color: 'oklch(0.7 0.18 80)' }} />
            <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>누적 SP</div>
            <div className="font-bold text-sm tabular-nums" style={{ color: 'oklch(0.4 0.1 80)' }}>
              {profile?.totalSP.toLocaleString() ?? 0}
            </div>
          </div>
        </div>

        {/* 나의 진열장 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Award size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>나의 진열장</span>
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
              {myEmblemsWithDef.length}개 보유
            </span>
          </div>
          <div className="axis-card p-4">
            {myEmblemsWithDef.length === 0 ? (
              <div className="text-center py-4 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                아직 획득한 엠블럼이 없습니다. 열심히 공부해서 첫 엠블럼을 획득해보세요!
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {myEmblemsWithDef.slice(0, 6).map(({ se, def }) => {
                  const badge = MATERIAL_BADGE[def.material];
                  return (
                    <div key={se.id} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ background: badge.bg, border: `2px solid ${badge.border}` }}
                      >
                        🏅
                      </div>
                      <div className="text-xs text-center truncate" style={{ color: 'oklch(0.5 0.015 250)', maxWidth: 52 }}>
                        {def.name}
                      </div>
                    </div>
                  );
                })}
                {myEmblemsWithDef.length > 6 && (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'oklch(0.95 0.005 250)', color: 'oklch(0.5 0.015 250)' }}>
                      +{myEmblemsWithDef.length - 6}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 최근 공개 성적 */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <BarChart2 size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 성적</span>
            </div>
            <Link href="/student/grades">
              <span className="text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>전체 보기</span>
            </Link>
          </div>
          {publishedResults.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              공개된 성적이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {publishedResults.map((r) => {
                const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                return (
                  <div key={r.examId} className="axis-card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{r.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        {r.examDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold tabular-nums text-sm"
                        style={{
                          color: pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)',
                        }}
                      >
                        {r.earnedScore}/{r.totalPoints}
                      </div>
                      <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </StudentLayout>
  );
}
