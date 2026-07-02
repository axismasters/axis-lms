// AXIS LMS v1.2 — Phase 2F: StudentHome (Student Portal Core Rebuild v1)
// 학생 홈 — 인사 / 빠른 이동 / 목표대학 입구 / Rival / 성장 진열장 / 최근 성적 / 숙제
//
// Phase 2F 변경:
//   ✅ 성장 진열장 / Rival / 마이페이지 카드 추가
//   ✅ 목표대학 추천 / 대학추천 입구 학년별 분기 유지
//   ✅ 재무/수납 섹션 완전 제거 유지
//
// ⚠ Phase 2F 금지:
//   - 합격률/합격 가능성/합격 보장/불합격 표현 금지
//   - 학생 화면에 수납/재무/청구/미납/환불 노출 금지

import { useState } from 'react';
import { Link } from 'wouter';
import {
  Trophy, Zap, Award, BarChart2, BookOpen, CalendarCheck,
  ClipboardList, CalendarClock, CheckCircle2, ChevronRight,
  GraduationCap, User, TrendingUp,
} from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';
import { TIER_LABELS, TIER_COLORS, MATERIAL_BADGE } from '@/lib/growthData';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import type { StudentExamResult } from '@/lib/assessmentData';
import { STUDENT_HIDDEN_CATEGORY_IDS } from '@/lib/phase2dData';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import { loadStudentProfile, canUseRival } from '@/lib/studentProfile';
import { ResultDetailModal } from '@/pages/student/StudentGrades';
import { isRivalEnabled } from '@/lib/systemFeatureFlags';
import FeatureDisabledNotice from '@/components/FeatureDisabledNotice';

export default function StudentHome() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { getProfile, getStudentEmblems, getRivalInfo, emblems } = useGrowth();
  const { exams, submissions } = useAssessment();
  const { getForStudent } = useHomework();
  const { getStatus } = useHomeworkStatus();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const enrolledClassIds =
    student?.classes.filter(c => c.status === '수강중').map(c => c.id) ?? [];

  // 학년 감지
  const gradeLevel = detectStudentGradeLevel(student);
  const universityLabel = getUniversityMenuLabel(gradeLevel);

  // 닉네임 / Rival
  const storedProfile = loadStudentProfile(myStudentId);
  const hasNickname = canUseRival(myStudentId);
  const rivalInfo = hasNickname ? getRivalInfo(myStudentId) : null;

  // Growth
  const profile = getProfile(myStudentId);
  const myEmblems = getStudentEmblems(myStudentId).filter(e => e.achieved);
  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '-';

  // [Phase 3D v3-r12] 시스템 기능 온/오프
  const rivalEnabled = isRivalEnabled();

  // 최근 성적 (입학테스트 제외)
  const allPublishedResults = getPublishedResultsForStudent(exams, submissions, myStudentId)
    .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any));
  const publishedResults = allPublishedResults.slice(0, 3);

  // Phase 3D v3: 최근 성적 카드를 클릭하면 "테스트" 메뉴로 다시 들어가지 않고 바로 성적표
  // 상세(IF 요약 포함, 조회 전용)가 열리도록 한다.
  const [selectedResult, setSelectedResult] = useState<StudentExamResult | null>(null);

  // 숙제
  const myHomework = getForStudent(enrolledClassIds);
  const incompleteHomework = myHomework.filter(hw => {
    const status = getStatus(hw.id, myStudentId);
    return status?.status !== 'completed';
  });
  const upcomingHomework = [...incompleteHomework]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);
  const classNameOf = (id: string) => classes.find(c => c.id === id)?.name ?? id;
  const dueBadge = (dueDate: string) => {
    if (dueDate < today) return { label: '마감', color: 'oklch(0.55 0.015 250)' };
    if (dueDate === today) return { label: '오늘 마감', color: 'oklch(0.577 0.245 27.325)' };
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
    return { label: `D-${diff}`, color: '#040D1E' };
  };

  return (
    <StudentLayout title="AXIS 학생">
      <div className="max-w-lg lg:max-w-6xl mx-auto px-4 py-5">
        {/* [Phase 3D v3-r7-r1] PC 최적화: 데스크톱에서는 인사만 전체 폭, 그 아래는
            좌측(메인: 빠른이동/숙제/최근 성적) + 우측(요약 패널: Rival/성장/목표대학)
            2컬럼 구조로 재구성한다. 모바일은 기존과 동일한 단일 세로 스택(space-y-4). */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5">

          {/* 인사 — 전체 폭 */}
          <div className="axis-card p-4 lg:col-span-3">
            <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
            <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>
              안녕하세요, {currentUser.name}님 ✨
            </div>
            <div className="flex items-center gap-2 mt-1">
              {gradeLevel && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F8F0DC', color: '#C8A15A' }}>
                  {gradeLevel}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: tierColor + '18', color: tierColor, border: `1px solid ${tierColor}44` }}>
                {tierLabel}
              </span>
              <span className="text-xs font-medium" style={{ color: 'oklch(0.5 0.06 80)' }}>
                누적 성장 {profile?.totalSP.toLocaleString() ?? 0}
              </span>
            </div>
          </div>

          {/* 좌측/메인: 빠른 이동 · 숙제 · 최근 성적 */}
          <div className="space-y-4 lg:col-span-2">
            {/* 빠른 이동 3×2 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ClipboardList, label: '테스트',    path: '/student/grades',          color: '#040D1E' },
                { icon: BookOpen,      label: '내 반',      path: '/student/classes',          color: 'oklch(0.45 0.15 160)' },
                { icon: CalendarCheck, label: '출결',       path: '/student/attendance',       color: 'oklch(0.55 0.15 80)' },
                { icon: Trophy,        label: '진열장',     path: '/student/growth',           color: 'oklch(0.7 0.18 80)' },
                ...(rivalEnabled ? [{ icon: TrendingUp, label: 'Rival', path: '/student/rival', color: '#0B1B33' }] : []),
                { icon: GraduationCap, label: universityLabel, path: '/student/target-preview', color: '#C8A15A' },
              ].map(({ icon: Icon, label, path, color }) => (
                <Link key={`${path}-${label}`} href={path} style={{ display: 'block' }}>
                  <div className="axis-card p-3 flex flex-col items-center gap-1.5 cursor-pointer">
                    <Icon size={20} style={{ color }} />
                    <span className="text-xs font-medium text-center" style={{ color: 'oklch(0.3 0.02 250)', fontSize: 10 }}>{label}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* 숙제 요약 */}
            <section>
                        <div className="flex items-center justify-between mb-2 px-1">
                          <div className="flex items-center gap-2">
                            <ClipboardList size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>숙제</span>
                            {incompleteHomework.length > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                                style={{ background: 'oklch(0.577 0.245 27.325)' }}>
                                {incompleteHomework.length}
                              </span>
                            )}
                          </div>
                          <Link href="/student/homework">
                            <span className="text-xs cursor-pointer" style={{ color: '#040D1E' }}>내 숙제 보기</span>
                          </Link>
                        </div>
                        {myHomework.length === 0 ? (
                          <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>배정된 숙제가 없습니다</div>
                        ) : incompleteHomework.length === 0 ? (
                          <div className="axis-card p-4 flex items-center gap-2">
                            <CheckCircle2 size={16} style={{ color: 'oklch(0.45 0.15 160)' }} />
                            <span className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>미완료 숙제가 없습니다</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {upcomingHomework.map(hw => {
                              const badge = dueBadge(hw.dueDate);
                              return (
                                <Link key={hw.id} href="/student/homework" style={{ display: 'block' }}>
                                  <div className="axis-card p-4 flex items-center justify-between">
                                    <div className="min-w-0">
                                      <div className="font-medium text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>{hw.title}</div>
                                      <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                                        <CalendarClock size={11} />
                                        {classNameOf(hw.classId)} · {hw.dueDate}
                                      </div>
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2"
                                      style={{ background: 'oklch(0.95 0.005 250)', color: badge.color }}>
                                      {badge.label}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </section>

            {/* 최근 공개 테스트 결과 — [Phase 3D v3-r8] "성적" → "테스트" 표현 통일 */}
            <section>
                        <div className="flex items-center justify-between mb-2 px-1">
                          <div className="flex items-center gap-2">
                            <BarChart2 size={15} style={{ color: '#040D1E' }} />
                            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 테스트</span>
                          </div>
                          <Link href="/student/grades">
                            <span className="text-xs cursor-pointer" style={{ color: '#040D1E' }}>전체 보기</span>
                          </Link>
                        </div>
                        {publishedResults.length === 0 ? (
                          <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>공개된 테스트 결과가 없습니다</div>
                        ) : (
                          <div className="space-y-2">
                            {publishedResults.map(r => {
                              const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                              return (
                                <button
                                  key={r.examId}
                                  type="button"
                                  onClick={() => setSelectedResult(r)}
                                  className="axis-card axis-card-clickable p-4 w-full flex items-center justify-between text-left"
                                >
                                  <div>
                                    <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{r.title}</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{r.examDate}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold tabular-nums text-sm"
                                      style={{ color: pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)' }}>
                                      {r.earnedScore}/{r.totalPoints}
                                    </div>
                                    <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </section>
          </div>

          {/* 우측 요약 패널: Rival · 성장 진열장 · 목표대학 */}
          <div className="space-y-4 lg:col-span-1">
        {/* Rival 현황 카드 — [Phase 3D v3-r12] rivalEnabled가 false면 비활성 안내로 대체 */}
        {!rivalEnabled ? (
          <FeatureDisabledNotice compact description="Rival 시스템이 현재 비활성화되어 있습니다." />
        ) : hasNickname && rivalInfo?.relation ? (
          <Link href="/student/rival" style={{ display: 'block' }}>
            <div className="axis-card p-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#E7EBF3' }}>
                    <TrendingUp size={18} style={{ color: '#0B1B33' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                      나의 성장 비교 @{storedProfile.nickname}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                      이번 주 나의 성장 매치업을 확인해보세요
                    </div>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: 'oklch(0.7 0.01 250)' }} />
              </div>
            </div>
          </Link>
        ) : !hasNickname ? (
          <Link href="/student/my" style={{ display: 'block' }}>
            <div className="axis-card p-4 cursor-pointer" style={{ borderLeft: '3px solid #0B1B33' }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: '#0B1B33' }} />
                <div className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
                  닉네임을 설정하면 <strong>Rival</strong> 성장 비교를 사용할 수 있습니다
                </div>
              </div>
              <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
                마이페이지 → 닉네임 설정
              </div>
            </div>
          </Link>
        ) : null}

        {/* 성장 요약 */}
        <Link href="/student/growth" style={{ display: 'block' }}>
          <div className="axis-card p-4 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: tierColor + '18' }}>
                  <TrendingUp size={18} style={{ color: tierColor }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                    성장 진열장
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    성장 활동 {profile?.totalSP.toLocaleString() ?? 0} · 엠블럼 {myEmblems.length}개 보유
                  </div>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: 'oklch(0.7 0.01 250)' }} />
            </div>
          </div>
        </Link>

        {/* 목표대학 추천 / 대학추천 입구 */}
        <Link href="/student/target-preview" style={{ display: 'block' }}>
          <div className="axis-card p-4 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#F8F0DC' }}>
                  <GraduationCap size={18} style={{ color: '#C8A15A' }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                    {universityLabel}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    {gradeLevel === '고3'
                      ? '수능실전 결과 기반 준비 상태 확인'
                      : '테스트 기반 목표 방향 준비'}
                  </div>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: 'oklch(0.7 0.01 250)' }} />
            </div>
          </div>
        </Link>
          </div>
        </div>
      </div>

      {/* Phase 3D v3: 홈에서 바로 성적표 상세(IF 요약 포함) — "테스트" 메뉴를 다시 거치지 않는다 */}
      {selectedResult && (
        <ResultDetailModal
          result={selectedResult}
          sameCategoryResults={allPublishedResults
            .filter(r => r.categoryId === selectedResult.categoryId)
            .sort((a, b) => a.examDate.localeCompare(b.examDate))}
          studentId={myStudentId}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </StudentLayout>
  );
}
