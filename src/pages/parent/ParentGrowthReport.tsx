// AXIS LMS v1.2 — Phase 3D v3-r2: ParentGrowthReport
// 학부모용 자녀 성장 리포트.
//
// ⚠ 학부모 페이지 헌법(docs/PARENT_PAGE_CONSTITUTION.md) 원칙:
//   - 학생용 게임형 지표는 학부모 화면에 노출하지 않는다.
//   - 대신 실제 테스트 결과/출결/대학추천 등 객관적 데이터를 "성장 리포트" 형태로 보여준다.
//   - 학부모가 오래 머무르며 눌러볼 수 있게: 탭 + 기간 필터 + 그래프 + 상세 모달.
//   - 선생님 내부 상담 기록 원문은 노출하지 않는다 — "학부모 공개 코멘트"(선생님이 별도
//     작성한 요약 문장)만 보여준다.
//   - 총 청구액/총 미납액 등 금액 과시형 UI 없음(이 화면은 애초에 재무 정보를 다루지 않음).
//   - 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현 금지.
//   - IF는 조회 전용으로만 보여준다(학생이 이미 완료한 회고 결과 요약).
//
// 데이터 소스: getPublishedResultsForStudent(공개된 성적만), studentIfRecord(IF 회고 —
// 같은 브라우저에서 학생 계정으로 저장한 기록을 읽는 데모 환경 한계가 있음, QA 문서 참조),
// 출결 세션, 숙제 완료 현황, 선생님 공개 코멘트(parentComments.ts).
//
// 경로: /parent/growth

import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  TrendingUp, Lightbulb, BarChart2, CalendarCheck, GraduationCap,
  ClipboardList, MessageSquare, X, ChevronRight, BookOpen,
} from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import type { StudentExamResult } from '@/lib/assessmentData';
import { STUDENT_HIDDEN_CATEGORY_IDS } from '@/lib/phase2dData';
import { IF_REASON_COLOR } from '@/lib/brandColors';
import { STATUS_CONFIG } from '@/lib/attendanceData';
import { loadIfRecords, getIfCumulativeSummary, IF_REASONS } from '@/lib/ifAnalysisEngine';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import { getParentCommentsForStudent } from '@/lib/parentComments';
import { getLocalDateStr } from '@/utils/dateUtils';

type Tab = 'test' | 'attendance' | 'university' | 'report';
type Period = 'month' | '3months' | 'all';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 145)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

function periodFromDaysAgo(period: Period): string | null {
  if (period === 'all') return null;
  const days = period === 'month' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getLocalDateStr(d);
}

// ════════════════════════════════════════════════════════════
// 재사용 그래프 컴포넌트 — 외부 차트 라이브러리 없이 순수 SVG/CSS로 구현
// ════════════════════════════════════════════════════════════

/** 라벨 + 값 + 최대값 기준 가로 막대 (내 점수 vs 평균 vs 최고점 비교 등에 사용) */
function HBar({ label, value, max, color, valueLabel }: { label: string; value: number; max: number; color: string; valueLabel?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs w-16 flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{label}</div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs font-bold tabular-nums w-12 text-right flex-shrink-0" style={{ color }}>
        {valueLabel ?? value}
      </div>
    </div>
  );
}

/** 최근 N회 점수 추이 — 간단한 SVG 선 그래프. 1회뿐이면 점 하나만 띄우지 않고
 * "첫 기준점"으로 안내한다(부모 화면이라 StudentGrades처럼 3분할까지는 하지 않고
 * 한 줄 요약으로 충분히 다음 회차를 기대하게 한다). */
function TrendSparkline({ points }: { points: { label: string; pct: number }[] }) {
  if (points.length === 0) return null;

  if (points.length === 1) {
    const p = points[0];
    return (
      <div className="rounded-lg px-3 py-3 flex items-center gap-3" style={{ background: 'oklch(0.97 0.004 250)' }}>
        <div className="text-2xl font-black tabular-nums" style={{ color: scoreColor(p.pct) }}>{p.pct}%</div>
        <div className="text-xs leading-snug" style={{ color: 'oklch(0.5 0.015 250)' }}>
          <span style={{ color: 'oklch(0.3 0.02 250)', fontWeight: 600 }}>첫 기준점</span>({p.label})입니다.
          <br />다음 결과가 공개되면 이 지점과 비교한 변화 추이가 쌓입니다.
        </div>
      </div>
    );
  }

  const W = 100, H = 36, PAD = 4;
  const step = (W - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = PAD + step * i;
    const y = H - PAD - ((H - PAD * 2) * p.pct) / 100;
    return { x, y, pct: p.pct };
  });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 64 }} preserveAspectRatio="none">
        <polyline points={coords.map(c => `${c.x},${c.y}`).join(' ')} fill="none" stroke="#040D1E" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="1.6" fill={scoreColor(c.pct)} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <div key={i} className="text-center" style={{ width: `${100 / points.length}%` }}>
            <div className="text-xs font-bold tabular-nums" style={{ color: scoreColor(p.pct) }}>{p.pct}%</div>
            <div className="text-[10px] truncate" style={{ color: 'oklch(0.6 0.015 250)' }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** IF 이유 3종 비율 — 가로 스택 막대 */
function ReasonRatioStack({ ratios }: { ratios: { reason: string; pct: number }[] }) {
  const colors: Record<string, string> = IF_REASON_COLOR;
  const total = ratios.reduce((s, r) => s + r.pct, 0);
  if (total === 0) return <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 집계된 IF 회고가 없습니다.</p>;
  return (
    <div>
      <div className="h-3 rounded-full overflow-hidden flex">
        {ratios.map(r => (
          <div key={r.reason} style={{ width: `${r.pct}%`, background: colors[r.reason] ?? '#999' }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {ratios.map(r => (
          <div key={r.reason} className="flex items-center gap-1 text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: colors[r.reason] ?? '#999' }} />
            {r.reason} {r.pct}%
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 시험 상세 모달 — 실제점수/평균/최고점 비교, IF 요약, 문항별 정오
// ════════════════════════════════════════════════════════════
function TestDetailModal({ result, onClose }: { result: StudentExamResult; onClose: () => void }) {
  const pct = result.totalPoints > 0 ? Math.round((result.earnedScore / result.totalPoints) * 100) : 0;
  const avgPct = result.averageScore != null && result.totalPoints > 0 ? Math.round((result.averageScore / result.totalPoints) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>{result.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{result.examDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-50" aria-label="닫기"><X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} /></button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto min-h-0">
          {/* 실제 점수 요약 */}
          <div className="text-center">
            <div className="text-3xl font-black tabular-nums" style={{ color: scoreColor(pct) }}>{result.earnedScore}<span className="text-base font-normal" style={{ color: 'oklch(0.6 0.015 250)' }}>/{result.totalPoints}</span></div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
              {result.myRank ? `전체 ${result.participantCount ?? '-'}명 중 ${result.myRank}위 · ` : ''}{pct}%
            </div>
          </div>

          {/* 내 점수 vs 평균 vs 최고점 */}
          {(avgPct !== null || result.highestScore != null) && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.4 0.015 250)' }}>점수 비교</div>
              <div className="space-y-2">
                <HBar label="내 점수" value={result.earnedScore} max={result.totalPoints} color="#040D1E" valueLabel={`${result.earnedScore}점`} />
                {result.averageScore != null && (
                  <HBar label="반 평균" value={result.averageScore} max={result.totalPoints} color="oklch(0.6 0.015 250)" valueLabel={`${Math.round(result.averageScore)}점`} />
                )}
                {result.highestScore != null && (
                  <HBar label="최고점" value={result.highestScore} max={result.totalPoints} color="oklch(0.45 0.15 145)" valueLabel={`${result.highestScore}점`} />
                )}
              </div>
            </div>
          )}

          {/* 문항별 정오 — wrongQuestions만 오답으로 표시(자동채점 문항 기준) */}
          {result.wrongQuestions.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.4 0.015 250)' }}>
                놓친 문항 ({result.wrongQuestions.length}개, {result.wrongQuestions.reduce((s, q) => s + q.points, 0)}점)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.wrongQuestions.map(q => (
                  <span key={q.questionId} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
                    style={{ background: 'oklch(0.96 0.06 27)', color: 'oklch(0.5 0.2 27)' }}>
                    {q.no}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
            ※ 문항별 놓친 이유(IF) 회고는 학생이 "테스트" 화면에서 직접 진행합니다. 전체 누적 경향은
            아래 "테스트" 탭의 IF 요약에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ParentGrowthReport() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();
  const { sessions } = useAttendance();
  const { getForStudent } = useHomework();
  const { getStatus } = useHomeworkStatus();

  const myStudentIds = currentUser.assignedStudentIds ?? [];
  const [selectedId, setSelectedId] = useState(myStudentIds[0] ?? '');
  const [tab, setTab] = useState<Tab>('test');
  const [period, setPeriod] = useState<Period>('3months');
  const [detailResult, setDetailResult] = useState<StudentExamResult | null>(null);

  const student = students.find(s => s.id === selectedId);
  const gradeLevel = detectStudentGradeLevel(student);
  const universityLabel = getUniversityMenuLabel(gradeLevel);

  const periodFrom = periodFromDaysAgo(period);

  const allPublishedResults = getPublishedResultsForStudent(exams, submissions, selectedId)
    .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any))
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  const publishedResults = periodFrom ? allPublishedResults.filter(r => r.examDate >= periodFrom) : allPublishedResults;

  const recent5 = allPublishedResults.slice(-5);
  const trendPoints = recent5.map(r => ({
    label: r.examDate.slice(5),
    pct: r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0,
  }));
  const scoreTrend = trendPoints.length >= 2 ? trendPoints[trendPoints.length - 1].pct - trendPoints[0].pct : null;

  // 과목별 보완 필요도 — exam.subject 기준 평균 % 오름차순(낮을수록 보완 필요).
  // v3-r3: 목표(90%) 대비 격차, 최근 절반 vs 이전 절반 비교로 "과목별 변화"까지 함께 계산.
  const SUBJECT_TARGET_PCT = 90;
  const subjectStats = useMemo(() => {
    const map = new Map<string, { pct: number; date: string }[]>();
    publishedResults.forEach(r => {
      const exam = exams.find(e => e.id === r.examId);
      const subject = exam?.subject ?? '기타';
      const pct = r.totalPoints > 0 ? (r.earnedScore / r.totalPoints) * 100 : 0;
      const list = map.get(subject) ?? [];
      list.push({ pct, date: r.examDate });
      map.set(subject, list);
    });
    return Array.from(map.entries())
      .map(([subject, list]) => {
        const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
        const avgPct = Math.round(sorted.reduce((s, x) => s + x.pct, 0) / sorted.length);
        const mid = Math.floor(sorted.length / 2);
        const earlierHalf = sorted.slice(0, mid);
        const laterHalf = sorted.slice(mid);
        const changeVsEarlier = earlierHalf.length > 0 && laterHalf.length > 0
          ? Math.round(laterHalf.reduce((s, x) => s + x.pct, 0) / laterHalf.length)
            - Math.round(earlierHalf.reduce((s, x) => s + x.pct, 0) / earlierHalf.length)
          : null;
        return { subject, avgPct, count: sorted.length, gapToTarget: SUBJECT_TARGET_PCT - avgPct, changeVsEarlier };
      })
      .sort((a, b) => a.avgPct - b.avgPct);
  }, [publishedResults, exams]);

  // IF 누적 요약(데모 환경: 같은 브라우저에서 학생 계정으로 저장한 기록 기준)
  const ifRecords = selectedId ? loadIfRecords(selectedId) : [];
  const ifSummary = getIfCumulativeSummary(ifRecords);
  const reasonRatios = IF_REASONS.map(reason => {
    const found = ifSummary.reasonRatios.find(r => r.reason === reason);
    return { reason, pct: found?.pct ?? 0 };
  });

  // 출결
  const childEnrolledClassIds = student?.classes.filter(c => c.status === '수강중').map(c => c.id) ?? [];
  const allAttRecords = sessions
    .filter(sess => childEnrolledClassIds.includes(sess.classId))
    .flatMap(sess => sess.records.filter(r => r.studentId === selectedId).map(r => ({ ...r, date: sess.date, classId: sess.classId })))
    .sort((a, b) => b.date.localeCompare(a.date));
  const attRecords = periodFrom ? allAttRecords.filter(r => r.date >= periodFrom) : allAttRecords;
  const attCounts = attRecords.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const recentAtt10 = allAttRecords.slice(0, 10).reverse();

  // 숙제(리포트 탭 — 이번 주/이번 달 완료율)
  const homeworkList = selectedId ? getForStudent(childEnrolledClassIds) : [];
  const weekAgoStr = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return getLocalDateStr(d); })();
  const monthAgoStr = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return getLocalDateStr(d); })();
  const homeworkInRange = (fromStr: string) => homeworkList.filter(hw => hw.status === 'published' && hw.createdAt.slice(0, 10) >= fromStr);
  const homeworkCompletionRate = (list: typeof homeworkList) => {
    if (list.length === 0) return null;
    const done = list.filter(hw => getStatus(hw.id, selectedId)?.status === 'completed').length;
    return Math.round((done / list.length) * 100);
  };
  const weeklyHomework = homeworkInRange(weekAgoStr);
  const monthlyHomework = homeworkInRange(monthAgoStr);
  const weeklyHomeworkRate = homeworkCompletionRate(weeklyHomework);
  const monthlyHomeworkRate = homeworkCompletionRate(monthlyHomework);
  const weeklyAtt = allAttRecords.filter(r => r.date >= weekAgoStr);
  const monthlyAtt = allAttRecords.filter(r => r.date >= monthAgoStr);
  const monthlyExams = allPublishedResults.filter(r => r.examDate >= monthAgoStr);
  const monthlyAvgPct = monthlyExams.length > 0
    ? Math.round(monthlyExams.reduce((s, r) => s + (r.totalPoints > 0 ? (r.earnedScore / r.totalPoints) * 100 : 0), 0) / monthlyExams.length)
    : null;

  // v3-r3: "주간 변화" — 지난주(8~14일 전) 대비 이번 주 비교
  const twoWeeksAgoStr = (() => { const d = new Date(); d.setDate(d.getDate() - 14); return getLocalDateStr(d); })();
  const prevWeekAtt = allAttRecords.filter(r => r.date >= twoWeeksAgoStr && r.date < weekAgoStr);
  const prevWeekHomework = homeworkList.filter(hw => hw.status === 'published' && hw.createdAt.slice(0, 10) >= twoWeeksAgoStr && hw.createdAt.slice(0, 10) < weekAgoStr);
  const prevWeekHomeworkRate = homeworkCompletionRate(prevWeekHomework);
  const attendRate = (list: typeof allAttRecords) => list.length === 0 ? null : Math.round((list.filter(r => r.status === '출석' || r.status === '보강출석').length / list.length) * 100);
  const weeklyAttRate = attendRate(weeklyAtt);
  const prevWeekAttRate = attendRate(prevWeekAtt);
  const homeworkRateDelta = weeklyHomeworkRate !== null && prevWeekHomeworkRate !== null ? weeklyHomeworkRate - prevWeekHomeworkRate : null;
  const attRateDelta = weeklyAttRate !== null && prevWeekAttRate !== null ? weeklyAttRate - prevWeekAttRate : null;

  const parentComments = selectedId ? getParentCommentsForStudent(selectedId) : [];

  const TABS: { key: Tab; label: string; icon: typeof BarChart2 }[] = [
    { key: 'test', label: '테스트', icon: BarChart2 },
    { key: 'attendance', label: '출결', icon: CalendarCheck },
    { key: 'university', label: '목표대학', icon: GraduationCap },
    { key: 'report', label: '리포트', icon: ClipboardList },
  ];

  return (
    <ParentLayout title="자녀 성장 리포트">
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        {myStudentIds.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {myStudentIds.map(id => {
              const s = students.find(st => st.id === id);
              return (
                <button key={id} type="button" onClick={() => setSelectedId(id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{
                    background: selectedId === id ? '#040D1E' : 'oklch(0.95 0.004 250)',
                    color: selectedId === id ? 'white' : 'oklch(0.5 0.015 250)',
                  }}>
                  {s?.name ?? id}
                </button>
              );
            })}
          </div>
        )}

        {/* 인사 + 이번 달 변화 요약 — PC에서 2컬럼 히어로 밴드 */}
        <div className="axis-card p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-5 items-center">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: '#040D1E' }}>
                {student?.name.charAt(0) ?? '?'}
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: 'oklch(0.15 0.02 250)' }}>{student?.name ?? '자녀'} 성장 리포트</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  {scoreTrend === null ? '아직 비교할 테스트 기록이 부족합니다.' :
                    scoreTrend > 0 ? `최근 테스트 점수가 ${scoreTrend}%p 올랐습니다` :
                    scoreTrend < 0 ? `최근 테스트 점수가 ${Math.abs(scoreTrend)}%p 내렸습니다` : '최근 테스트 점수가 비슷하게 유지되고 있습니다'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                <div className="font-black text-lg tabular-nums" style={{ color: '#040D1E' }}>{allPublishedResults.length}건</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>테스트 기록</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                <div className="font-black text-lg tabular-nums" style={{ color: 'oklch(0.45 0.15 145)' }}>{monthlyAvgPct !== null ? `${monthlyAvgPct}%` : '-'}</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>최근 한 달 평균</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                <div className="font-black text-lg tabular-nums" style={{ color: subjectStats[0] ? scoreColor(subjectStats[0].avgPct) : 'oklch(0.6 0.015 250)' }}>
                  {subjectStats[0]?.subject ?? '-'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>보완 필요 과목</div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-lg lg:max-w-2xl" style={{ background: 'oklch(0.93 0.006 250)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="py-2 rounded-md text-center text-xs font-medium transition-colors flex items-center justify-center gap-1"
              style={tab === t.key
                ? { background: 'white', color: '#040D1E', boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)' }
                : { color: 'oklch(0.5 0.015 250)' }}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* 기간 필터 (테스트/출결 탭에 적용) */}
        {(tab === 'test' || tab === 'attendance') && (
          <div className="flex items-center gap-1.5">
            {([{ k: 'month' as Period, l: '이번 달' }, { k: '3months' as Period, l: '최근 3개월' }, { k: 'all' as Period, l: '전체' }]).map(p => (
              <button key={p.k} onClick={() => setPeriod(p.k)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={period === p.k
                  ? { background: '#040D1E', color: 'white' }
                  : { background: 'oklch(0.96 0.004 250)', color: 'oklch(0.5 0.015 250)' }}>
                {p.l}
              </button>
            ))}
          </div>
        )}

        {/* ── 테스트 탭 ── */}
        {tab === 'test' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* 좌측: 추이 + 과목별 보완 필요도 */}
            <div className="space-y-4">
            {trendPoints.length > 0 && (
              <div className="axis-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={15} style={{ color: '#040D1E' }} />
                  <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>점수 변화 추이 (최근 {trendPoints.length}회)</span>
                </div>
                <TrendSparkline points={trendPoints} />
              </div>
            )}

            {subjectStats.length > 0 && (
              <div className="axis-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={15} style={{ color: 'oklch(0.45 0.15 145)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>과목별 보완 필요도</span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  목표 {SUBJECT_TARGET_PCT}% 기준으로 부족한 과목부터 정렬했습니다.
                </p>
                <div className="space-y-3">
                  {subjectStats.slice(0, 5).map(s => (
                    <div key={s.subject}>
                      <HBar label={s.subject} value={s.avgPct} max={100} color={scoreColor(s.avgPct)} valueLabel={`${s.avgPct}%`} />
                      <div className="flex items-center gap-2 mt-1 ml-[72px] text-xs">
                        {s.gapToTarget > 0 && (
                          <span style={{ color: 'oklch(0.55 0.2 27)' }}>목표까지 {s.gapToTarget}%p</span>
                        )}
                        {s.changeVsEarlier !== null && s.changeVsEarlier !== 0 && (
                          <span style={{ color: s.changeVsEarlier > 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
                            이전 대비 {s.changeVsEarlier > 0 ? `▲+${s.changeVsEarlier}%p` : `▼${s.changeVsEarlier}%p`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* 우측: IF 요약 + 최근 테스트 상세 */}
            <div className="space-y-4">
            {ifSummary.totalRecordsAnalyzed > 0 && (
              <div className="axis-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={15} style={{ color: '#040D1E' }} />
                  <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>놓친 점수 원인 요약(IF)</span>
                </div>
                <p className="text-sm mb-3" style={{ color: 'oklch(0.35 0.02 250)' }}>
                  최근 테스트에서 놓친 점수 중 실수로 놓친 부분을 모두 맞혔다면 평균
                  약 <strong style={{ color: '#040D1E' }}>+{ifSummary.avgImprovementPct ?? 0}%p</strong> 향상 여지가 있습니다.
                </p>
                <ReasonRatioStack ratios={reasonRatios} />
              </div>
            )}

            <div>
              <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>최근 테스트 상세</div>
              {publishedResults.length === 0 ? (
                <div className="axis-card p-6 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>선택한 기간에 공개된 테스트 결과가 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  {[...publishedResults].reverse().map(r => {
                    const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                    return (
                      <button key={r.examId} type="button" onClick={() => setDetailResult(r)}
                        className="axis-card axis-card-clickable p-4 w-full flex items-center justify-between text-left">
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{r.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{r.examDate}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-bold tabular-nums text-sm" style={{ color: scoreColor(pct) }}>{r.earnedScore}/{r.totalPoints}</div>
                            <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                          </div>
                          <ChevronRight size={14} style={{ color: 'oklch(0.7 0.01 250)' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* ── 출결 탭 ── */}
        {tab === 'attendance' && (
          <>
            <div className="axis-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck size={15} style={{ color: '#040D1E' }} />
                <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 출결 흐름</span>
              </div>
              {recentAtt10.length === 0 ? (
                <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>출결 기록이 없습니다.</p>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {recentAtt10.map((r, i) => {
                    const cfg = STATUS_CONFIG[r.status];
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: cfg.bg, color: cfg.text }}>
                          {r.status.charAt(0)}
                        </div>
                        <div className="text-[10px]" style={{ color: 'oklch(0.6 0.015 250)' }}>{r.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(attCounts).map(([status, count]) => {
                const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                return (
                  <div key={status} className="axis-card p-3 text-center">
                    <div className="font-black text-lg tabular-nums" style={{ color: cfg?.text ?? 'oklch(0.3 0.02 250)' }}>{count}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{status}</div>
                  </div>
                );
              })}
              {Object.keys(attCounts).length === 0 && (
                <div className="col-span-3 axis-card p-6 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>선택한 기간에 출결 기록이 없습니다.</div>
              )}
            </div>
          </>
        )}

        {/* ── 목표대학 탭 ── */}
        {tab === 'university' && (
          <Link href="/parent/target-summary" style={{ display: 'block' }}>
            <div className="axis-card axis-card-clickable p-5">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap size={20} style={{ color: '#C8A15A' }} />
                <span className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{universityLabel}</span>
              </div>
              <p className="text-sm" style={{ color: 'oklch(0.45 0.015 250)' }}>
                {student?.name ?? '자녀'}의 누적 성적을 바탕으로 한 {universityLabel} 상세 화면으로 이동합니다.
                시간이 지나며 데이터가 쌓일수록 더 정확한 방향을 확인할 수 있습니다.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: '#040D1E' }}>
                자세히 보기 <ChevronRight size={12} />
              </div>
            </div>
          </Link>
        )}

        {/* ── 리포트 탭 ── */}
        {tab === 'report' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-4">
            <div className="axis-card p-4">
              <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.45 0.015 250)' }}>주간 학습 리포트 (최근 7일 · 전주 대비)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3" style={{ background: 'oklch(0.96 0.004 250)' }}>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>출결</div>
                  <div className="font-bold text-sm mt-0.5" style={{ color: 'oklch(0.3 0.02 250)' }}>
                    {weeklyAtt.length === 0 ? '기록 없음' : `${weeklyAtt.filter(r => r.status === '출석' || r.status === '보강출석').length}/${weeklyAtt.length}회 출석`}
                  </div>
                  {attRateDelta !== null && attRateDelta !== 0 && (
                    <div className="text-xs mt-0.5" style={{ color: attRateDelta > 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
                      전주 대비 {attRateDelta > 0 ? `▲+${attRateDelta}%p` : `▼${attRateDelta}%p`}
                    </div>
                  )}
                </div>
                <div className="rounded-lg p-3" style={{ background: 'oklch(0.96 0.004 250)' }}>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>숙제 완료율</div>
                  <div className="font-bold text-sm mt-0.5" style={{ color: 'oklch(0.3 0.02 250)' }}>
                    {weeklyHomeworkRate !== null ? `${weeklyHomeworkRate}%` : '해당 숙제 없음'}
                  </div>
                  {homeworkRateDelta !== null && homeworkRateDelta !== 0 && (
                    <div className="text-xs mt-0.5" style={{ color: homeworkRateDelta > 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
                      전주 대비 {homeworkRateDelta > 0 ? `▲+${homeworkRateDelta}%p` : `▼${homeworkRateDelta}%p`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="axis-card p-4">
              <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.45 0.015 250)' }}>월간 성장 리포트 (최근 30일)</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                  <div className="font-black text-base tabular-nums" style={{ color: 'oklch(0.45 0.15 145)' }}>{monthlyAvgPct !== null ? `${monthlyAvgPct}%` : '-'}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>테스트 평균</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                  <div className="font-black text-base tabular-nums" style={{ color: '#040D1E' }}>{monthlyHomeworkRate !== null ? `${monthlyHomeworkRate}%` : '-'}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>숙제 완료율</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                  <div className="font-black text-base tabular-nums" style={{ color: 'oklch(0.45 0.2 27)' }}>
                    {monthlyAtt.filter(r => r.status === '결석').length}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>이번 달 결석</div>
                </div>
              </div>
            </div>
            </div>

            <div className="space-y-4">
            <div className="axis-card p-4" style={{ borderLeft: '3px solid #040D1E' }}>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={15} style={{ color: '#040D1E' }} />
                <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>상담용 요약</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'oklch(0.6 0.015 250)' }}>
                선생님과 상담하실 때 참고하실 수 있도록 이번 달 흐름을 한 문단으로 정리했습니다.
              </p>
              <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: 'oklch(0.97 0.004 250)', color: 'oklch(0.3 0.02 250)' }}>
                {student?.name ?? '자녀'}은(는) 최근 한 달간 테스트 평균 {monthlyAvgPct !== null ? `${monthlyAvgPct}%` : '기록 없음'}
                {scoreTrend !== null && (scoreTrend > 0 ? `(직전 대비 +${scoreTrend}%p 상승)` : scoreTrend < 0 ? `(직전 대비 ${scoreTrend}%p 하락)` : '(직전과 비슷한 수준)')}
                를 기록했습니다.
                {subjectStats[0] && ` 보완이 가장 필요한 과목은 ${subjectStats[0].subject}(평균 ${subjectStats[0].avgPct}%)입니다.`}
                {' '}이번 달 결석은 {monthlyAtt.filter(r => r.status === '결석').length}회,
                숙제 완료율은 {monthlyHomeworkRate !== null ? `${monthlyHomeworkRate}%` : '집계된 숙제 없음'}입니다.
              </div>
            </div>

            <div className="axis-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>선생님 코멘트</span>
              </div>
              {parentComments.length === 0 ? (
                <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 등록된 코멘트가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {parentComments.map(c => (
                    <div key={c.id} className="rounded-lg p-3" style={{ background: 'oklch(0.96 0.04 160)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'oklch(0.3 0.12 160)' }}>{c.authorName} 선생님</span>
                        <span className="text-xs" style={{ color: 'oklch(0.5 0.1 160)' }}>{c.date}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        )}

      </div>

      {detailResult && <TestDetailModal result={detailResult} onClose={() => setDetailResult(null)} />}
    </ParentLayout>
  );
}
