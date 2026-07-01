// AXIS LMS v1.2 — Phase 2F: StudentGrowthShowcase (Student Portal Core Rebuild v1)
// 학생 성적 진열장 — 최고 기록 / 최근 상승 / 과목별 성장 / IF 성과 / 엠블럼 / SP / 목표 상태
//
// Phase 2F 정책:
//   - 이 화면은 학생이 직접 보는 화면 (관리자 성장현황과 별개)
//   - placeholder 금지 — 실제 성장 데이터 표시
//
// ⚠ 금지:
//   - 합격률 / 합격 가능성 / 합격 보장 / 불합격 표현 금지
//   - 수납/재무 노출 금지

import { useState } from 'react';
import { Trophy, Zap, Award, BarChart2, TrendingUp, Star, Target, ChevronRight, Lightbulb } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import { STUDENT_HIDDEN_CATEGORY_IDS, getSchoolRecordsForStudent, getNationalMocksForStudent } from '@/lib/phase2dData';
import { TIER_LABELS, TIER_COLORS, MATERIAL_BADGE } from '@/lib/growthData';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';

// ─── SP 로그 타입 (간략) ─────────────────────────────────────────────────────
function SPLogBar({ label, amount, maxAmount }: { label: string; amount: number; maxAmount: number }) {
  const pct = maxAmount > 0 ? Math.min((amount / maxAmount) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs w-20 truncate flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#040D1E' }} />
      </div>
      <div className="text-xs tabular-nums font-bold w-10 text-right flex-shrink-0"
        style={{ color: '#040D1E' }}>+{amount}</div>
    </div>
  );
}

export default function StudentGrowthShowcase() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { getProfile, getStudentEmblems, getRecentEmblems, getSPLogs, getRivalInfo, emblems } = useGrowth();
  const { exams, submissions } = useAssessment();
  const [activeSection, setActiveSection] = useState<'scores' | 'emblems' | 'sp' | 'rival'>('scores');

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const profile = getProfile(myStudentId);
  const myEmblems = getStudentEmblems(myStudentId).filter(e => e.achieved);
  const recentEmblems = getRecentEmblems(myStudentId, 3);
  const spLogs = getSPLogs(myStudentId, 5);
  const rivalInfo = getRivalInfo(myStudentId);

  const gradeLevel = detectStudentGradeLevel(student);
  const universityLabel = getUniversityMenuLabel(gradeLevel);
  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '-';

  // 성적 데이터
  const allResults = getPublishedResultsForStudent(exams, submissions, myStudentId)
    .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any));
  const schoolRecords = getSchoolRecordsForStudent(myStudentId);
  const nationalMocks = getNationalMocksForStudent(myStudentId);

  // 최고 달성률 계산
  const bestResult = [...allResults].sort((a, b) => {
    const pa = a.totalPoints > 0 ? a.earnedScore / a.totalPoints : 0;
    const pb = b.totalPoints > 0 ? b.earnedScore / b.totalPoints : 0;
    return pb - pa;
  })[0];
  const bestPct = bestResult && bestResult.totalPoints > 0
    ? Math.round((bestResult.earnedScore / bestResult.totalPoints) * 100) : 0;

  // 최근 상승 (마지막 2개 비교)
  const sortedResults = [...allResults].sort((a, b) => a.examDate.localeCompare(b.examDate));
  const latestTwo = sortedResults.slice(-2);
  const scoreTrend = latestTwo.length === 2 && latestTwo[0].totalPoints > 0 && latestTwo[1].totalPoints > 0
    ? Math.round((latestTwo[1].earnedScore / latestTwo[1].totalPoints) * 100) -
      Math.round((latestTwo[0].earnedScore / latestTwo[0].totalPoints) * 100)
    : null;

  // 최근 내신 등급
  const bestInternalGrade = schoolRecords.length > 0
    ? Math.min(...schoolRecords.map(r => r.grade)) : null;

  // 최근 전국모의 등급
  const bestMockGrade = nationalMocks.length > 0
    ? Math.min(...nationalMocks.map(r => r.grade)) : null;

  // SP 로그 최대값
  const maxSP = spLogs.reduce((m, l) => Math.max(m, l.amount), 0);

  const SECTIONS = [
    { id: 'scores', label: '테스트 기록', icon: BarChart2 },
    { id: 'emblems', label: '엠블럼', icon: Award },
    { id: 'sp', label: 'SP 내역', icon: Zap },
    { id: 'rival', label: 'Rival', icon: Trophy },
  ] as const;

  return (
    <StudentLayout title="성장 진열장">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 나의 성장 프로필 */}
        <div className="axis-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{ background: tierColor }}>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {currentUser.name}의 성장 진열장
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {gradeLevel && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F8F0DC', color: '#C8A15A' }}>
                    {gradeLevel}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tierColor + '18', color: tierColor, border: `1px solid ${tierColor}44` }}>
                  {tierLabel}
                </span>
              </div>
            </div>
          </div>

          {/* 핵심 지표 4칸 */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '시험 기록', value: `${allResults.length + schoolRecords.length + nationalMocks.length}건`, color: '#040D1E' },
              { label: '누적 SP', value: profile?.totalSP.toLocaleString() ?? '0', color: 'oklch(0.4 0.1 80)' },
              { label: '엠블럼', value: `${myEmblems.length}개`, color: 'oklch(0.45 0.15 160)' },
              { label: 'Rival 승', value: profile ? `${profile.rivalWins}승` : '-', color: '#040D1E' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                <div className="font-black text-sm tabular-nums" style={{ color }}>{value}</div>
                <div style={{ fontSize: 10, color: 'oklch(0.55 0.015 250)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 최고 기록 하이라이트 */}
        {(bestPct > 0 || bestInternalGrade || bestMockGrade) && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={15} style={{ color: 'oklch(0.7 0.18 80)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>나의 최고 기록</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {bestPct > 0 && (
                <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.95 0.06 260)' }}>
                  <div className="font-black text-xl tabular-nums" style={{ color: '#040D1E' }}>{bestPct}%</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>학원 최고 달성률</div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>{bestResult?.title}</div>
                </div>
              )}
              {bestInternalGrade && (
                <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.92 0.08 145)' }}>
                  <div className="font-black text-xl tabular-nums" style={{ color: 'oklch(0.3 0.15 145)' }}>{bestInternalGrade}등급</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.4 0.1 145)' }}>최고 내신 등급</div>
                </div>
              )}
              {bestMockGrade && (
                <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.93 0.06 27)' }}>
                  <div className="font-black text-xl tabular-nums" style={{ color: 'oklch(0.45 0.2 27)' }}>{bestMockGrade}등급</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.15 27)' }}>최고 모의고사 등급</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 최근 상승 */}
        {scoreTrend !== null && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} style={{ color: scoreTrend >= 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 테스트 변화</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-black tabular-nums ${scoreTrend >= 0 ? '' : ''}`}
                style={{ color: scoreTrend > 0 ? 'oklch(0.45 0.15 145)' : scoreTrend < 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.5 0.015 250)' }}>
                {scoreTrend > 0 ? `+${scoreTrend}%p` : scoreTrend < 0 ? `${scoreTrend}%p` : '동일'}
              </div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                {latestTwo[0].examDate} → {latestTwo[1].examDate}
              </div>
            </div>
          </div>
        )}

        {/* IF 채점 성과 */}
        <div className="axis-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} style={{ color: '#040D1E' }} />
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>IF 채점 활용</span>
          </div>
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'oklch(0.95 0.06 260)', color: 'oklch(0.3 0.1 260)' }}>
            테스트 탭에서 시험 카드를 클릭하면 IF 채점 분석을 볼 수 있습니다.
            "맞출 수 있었던 문제를 맞혔다면?" 시나리오로 점수 향상 가능성을 확인하세요.
          </div>
          <Link href="/student/grades">
            <div className="mt-2 flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#040D1E' }}>
              테스트 화면으로 이동 <ChevronRight size={12} />
            </div>
          </Link>
        </div>

        {/* 섹션 탭 */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveSection(id)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{
                background: activeSection === id ? '#040D1E' : 'oklch(0.95 0.004 250)',
                color: activeSection === id ? 'white' : 'oklch(0.5 0.015 250)',
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* 테스트 기록 섹션 — [Phase 3D v3-r8] "성적"→"테스트" 표현 정리 */}
        {activeSection === 'scores' && (
          <div className="space-y-2">
            {allResults.length === 0 && schoolRecords.length === 0 && nationalMocks.length === 0 ? (
              <div className="axis-card p-8 text-center">
                <BarChart2 size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 기록된 테스트 결과가 없습니다.</div>
              </div>
            ) : (
              <>
                {allResults.slice(0, 5).map(r => {
                  const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                  return (
                    <div key={r.examId} className="axis-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>{r.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{r.examDate}</div>
                        </div>
                        <div className="font-bold text-sm ml-3 tabular-nums"
                          style={{ color: pct >= 80 ? 'oklch(0.45 0.15 145)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)' }}>
                          {r.earnedScore}/{r.totalPoints} ({pct}%)
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#040D1E' }} />
                      </div>
                    </div>
                  );
                })}
                {schoolRecords.slice(0, 3).map(r => (
                  <div key={r.id} className="axis-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {r.semester} {r.subject} {r.examType}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>실제내신</div>
                      </div>
                      <div className="font-bold text-sm"
                        style={{ color: r.grade <= 2 ? 'oklch(0.45 0.15 145)' : r.grade <= 4 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)' }}>
                        {r.grade}등급
                      </div>
                    </div>
                  </div>
                ))}
                {nationalMocks.slice(0, 3).map(r => (
                  <div key={r.id} className="axis-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{r.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>전국모의 · {r.subject}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm"
                          style={{ color: r.grade <= 2 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
                          {r.grade}등급
                        </div>
                        <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>
                          백분위 {r.percentile}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/student/grades">
                  <div className="axis-card p-3 flex items-center justify-center gap-1 cursor-pointer"
                    style={{ color: '#040D1E' }}>
                    <span className="text-sm font-semibold">전체 테스트 보기</span>
                    <ChevronRight size={15} />
                  </div>
                </Link>
              </>
            )}
          </div>
        )}

        {/* 엠블럼 섹션 */}
        {activeSection === 'emblems' && (
          <div className="axis-card p-4">
            {myEmblems.length === 0 ? (
              <div className="py-8 text-center">
                <Award size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 획득한 엠블럼이 없습니다.</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {myEmblems.map(se => {
                  const def = emblems.find(e => e.id === se.emblemId);
                  if (!def) return null;
                  const badge = MATERIAL_BADGE[def.material];
                  return (
                    <div key={se.id} className="flex flex-col items-center gap-1 p-3 rounded-xl"
                      style={{ background: badge.bg }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ border: `2px solid ${badge.border}` }}>🏅</div>
                      <div className="text-xs font-semibold text-center" style={{ color: 'oklch(0.25 0.02 250)' }}>{def.name}</div>
                      <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)', fontSize: 10 }}>{se.acquiredAt}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SP 내역 섹션 */}
        {activeSection === 'sp' && (
          <div className="axis-card p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>SP 내역</span>
              <span className="font-black text-base tabular-nums" style={{ color: 'oklch(0.4 0.1 80)' }}>
                총 {profile?.totalSP.toLocaleString() ?? 0} SP
              </span>
            </div>
            {spLogs.length === 0 ? (
              <div className="text-center py-4 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>SP 내역이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {spLogs.map(log => (
                  <SPLogBar key={log.id} label={log.reason} amount={log.amount} maxAmount={maxSP} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rival 요약 섹션 */}
        {activeSection === 'rival' && (
          <div className="axis-card p-4">
            {rivalInfo.relation ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold mb-2" style={{ color: 'oklch(0.25 0.02 250)' }}>Rival 현황</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '승', value: `${rivalInfo.relation.wins}승`, color: 'oklch(0.45 0.15 145)' },
                    { label: '패', value: `${rivalInfo.relation.losses}패`, color: 'oklch(0.55 0.2 27)' },
                    { label: '승률', value: `${rivalInfo.relation.winRate.toFixed(1)}%`, color: '#040D1E' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                      <div className="font-black text-lg" style={{ color }}>{value}</div>
                      <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  {rivalInfo.relation.streak > 0 ? `🔥 현재 ${rivalInfo.relation.streak}연승 중!` :
                   rivalInfo.relation.streak < 0 ? `연패 중 (${Math.abs(rivalInfo.relation.streak)}연패)` :
                   '승패 균형'}
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  나를 Rival로 지정한 학생: {rivalInfo.challengersCount}명
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Trophy size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 Rival이 없습니다.</div>
                <Link href="/student/rival">
                  <div className="mt-3 inline-flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#040D1E' }}>
                    Rival 화면으로 이동 <ChevronRight size={12} />
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 목표대학 추천 입구 */}
        <Link href="/student/target-preview" style={{ display: 'block' }}>
          <div className="axis-card p-4 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F8F0DC' }}>
                <Target size={18} style={{ color: '#C8A15A' }} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{universityLabel}</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>준비 상태 확인하기</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'oklch(0.7 0.01 250)' }} />
          </div>
        </Link>

      </div>
    </StudentLayout>
  );
}
