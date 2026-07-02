// AXIS LMS v1.2 — Phase 3D v3-r10-r1: StudentRival (Rival Dashboard Rebuild)
// [Phase 3D v3-r14-r4] 유사 수준 비교 차트의 막대 높이 계산 버그 수정(퍼센트 → 픽셀,
// BAR_MAX_PX 참고) — 학생 성장/Rival/Emblem 프리미엄 UI 정리 작업의 일부.
//
// ⚠ Rival 철학(코드에도 박아둔다):
//   - Rival은 싸움/전투 게임이 아니다. "나와 비슷한 수준의 상대가 있다"는 성장 자극 장치다.
//   - 성적 압박이 아니라 성장 경쟁이다. "누구를 눌렀다"가 아니라 "이번 주 나는 얼마나
//     성장했는가"가 중심이다.
//   - 실명/전화번호/반/학교 등 식별 정보는 노출하지 않는다(닉네임/평균만).
//   - 학생은 누가 자신을 Rival로 지정했는지 알 수 없다 — "나를 선택한 수"만 확인 가능.
//   - 추천/비교는 외부 AI가 아니라 내부 규칙 기반(rivalMatchupEngine).
//
// 화면 구성(02-rival-dashboard-screen.png 기준, 승인된 01 매치업 카드 포함):
//   - 상단: "나 vs Rival" 매치업 카드(RivalMatchupCard)
//   - 유사 수준 비교 / 최근 성장 변화 / 나를 선택한 수
//   - Rival 도전 기록(익명·닉네임 전용) / 성장을 위한 제안(규칙 기반)
//
// 금지: 공격/방어/처치/전투/몬스터/무기/아이템/현질형 표현, 실명 노출, 학부모 직접 노출.

import { useMemo, useRef } from 'react';
import { Link } from 'wouter';
import { Users, TrendingUp, Lightbulb, ChevronRight, Info } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { loadStudentProfile, canUseRival } from '@/lib/studentProfile';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import { STUDENT_HIDDEN_CATEGORY_IDS } from '@/lib/phase2dData';
import { buildRivalMatchup } from '@/lib/rivalMatchupEngine';
import { RivalMatchupCard } from '@/components/growth/RivalMatchupCard';
import { CHART_TEAL, CHART_BLUE } from '@/lib/brandColors';

const MINE_COLOR = CHART_TEAL;
const RIVAL_COLOR = CHART_BLUE;
// [Phase 3D v3-r14-r4] 막대 최대 높이(px) — 아래 유사 수준 비교 차트에서 퍼센트(%) 높이
// 대신 픽셀 고정값으로 계산하는 데 쓴다(버그 수정 근거는 사용처 주석 참고).
const BAR_MAX_PX = 108;

function toPcts(results: { earnedScore: number; totalPoints: number; examDate: string }[]): number[] {
  return [...results]
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .map(r => (r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0));
}

export default function StudentRival() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();
  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const { getProfile, getRivalInfo } = useGrowth();
  const detailRef = useRef<HTMLDivElement>(null);

  const storedProfile = loadStudentProfile(myStudentId);
  const hasNickname = canUseRival(myStudentId);
  const profile = getProfile(myStudentId);
  const rivalInfo = hasNickname ? getRivalInfo(myStudentId) : null;

  // 내/상대 최근 테스트 달성률(익명) — 매치업/비교 차트에 사용
  const myResults = useMemo(() =>
    getPublishedResultsForStudent(exams, submissions, myStudentId)
      .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any)),
    [exams, submissions, myStudentId]);
  const rivalId = rivalInfo?.currentRivalProfile?.studentId;
  const rivalResults = useMemo(() =>
    rivalId ? getPublishedResultsForStudent(exams, submissions, rivalId)
      .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any)) : [],
    [exams, submissions, rivalId]);

  const myPcts = toPcts(myResults);
  // 상대 데이터가 없으면 "Rival 평균"을 내 흐름 기반의 유사군 평균으로 결정적 생성
  const rivalPcts = rivalResults.length >= 2
    ? toPcts(rivalResults)
    : myPcts.map((v, i) => Math.max(0, Math.min(100, v - 6 + (i - myPcts.length / 2))));

  const matchup = useMemo(() => buildRivalMatchup({
    myResultPcts: myPcts.length >= 2 ? myPcts : [64, 68, 71, 76, 82],
    rivalResultPcts: rivalPcts.length >= 2 ? rivalPcts : [58, 60, 63, 66, 70],
  }), [myPcts, rivalPcts]);

  if (!hasNickname) {
    return (
      <StudentLayout title="Rival">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
          <div className="axis-card p-8 text-center">
            <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'oklch(0.75 0.01 250)' }} />
            <div className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.3 0.02 250)' }}>
              닉네임을 먼저 설정해주세요
            </div>
            <div className="text-xs mb-4" style={{ color: 'oklch(0.55 0.015 250)' }}>
              Rival 기능은 닉네임 설정 후 사용할 수 있습니다. 실명은 상대방에게 노출되지 않습니다.
            </div>
            <Link href="/student/my">
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0B1B33' }}>
                마이페이지에서 설정하기
              </button>
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const challengersCount = rivalInfo?.challengersCount ?? 0;

  // 유사 수준 비교(과목별) — 결정적 데모 값(실데이터 연동 전 자리, 규칙 기반)
  const subjectCompare = [
    { subject: '국어', mine: 78, rival: 65 },
    { subject: '수학', mine: 82, rival: 74 },
    { subject: '영어', mine: 69, rival: 61 },
    { subject: '탐구', mine: 75, rival: 68 },
  ];
  const maxSub = 100;

  // 도전 기록(익명·닉네임 전용) — 실명/식별정보 없음
  const challengeLog = [
    { date: '2025.05.20', type: '주간 테스트', subject: '수학', result: '성장', gap: '+12.4점', growth: '+8.7%' },
    { date: '2025.05.13', type: '주간 테스트', subject: '영어', result: '성장', gap: '+7.8점', growth: '+6.2%' },
    { date: '2025.05.06', type: '주간 테스트', subject: '국어', result: '보완', gap: '-4.3점', growth: '-2.1%' },
    { date: '2025.04.29', type: '주간 테스트', subject: '탐구', result: '성장', gap: '+9.1점', growth: '+7.5%' },
  ];

  const suggestions = [
    '오답 노트를 활용하여 취약 유형을 보완해보세요.',
    '수학 고난도 문제 풀이에 시간을 조금 더 배분해보세요.',
    '주간 목표를 설정하고 꾸준히 실천해보세요.',
  ];

  return (
    <StudentLayout title="Rival">
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 py-5 space-y-5">

        {/* 헤더 */}
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>현재 Rival 현황</h1>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.45 0.015 250)' }}>함께 성장하며 더 높은 목표를 향해 나아가세요.</p>
        </div>

        {/* ── 승인된 "나 vs Rival" 매치업 카드 ── */}
        <RivalMatchupCard
          matchup={matchup}
          myNickname={storedProfile.nickname ?? undefined}
          rivalLabel="Rival 평균"
          onDetail={() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />

        {/* 2컬럼: 유사 수준 비교 + 최근 성장 변화 / 나를 선택한 수 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 유사 수준 비교 */}
          <div className="axis-card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>유사 수준 비교</span>
              <Info size={12} style={{ color: 'oklch(0.6 0.015 250)' }} />
              <div className="flex items-center gap-3 ml-auto text-xs">
                <span className="flex items-center gap-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: MINE_COLOR }} /> 나
                </span>
                <span className="flex items-center gap-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: RIVAL_COLOR }} /> Rival 평균
                </span>
              </div>
            </div>
            {/* [Phase 3D v3-r14-r4] 버그 수정: 막대 높이를 퍼센트(%)로 주면 그 부모(내용 기반
                auto-height flex item)에 명시적 높이가 없어 퍼센트가 정상적으로 계산되지 않아
                막대가 찌그러지는 문제가 있었다(§ CHANGES 문서 참고). 픽셀 고정값 기반으로
                바꿔 컨테이너 높이와 무관하게 항상 올바른 비율로 그려지도록 했다. */}
            <div className="flex items-end justify-around gap-3 h-40 pt-2">
              {subjectCompare.map(({ subject, mine, rival }) => (
                <div key={subject} className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex items-end gap-2 h-32">
                    <div className="flex flex-col items-center justify-end">
                      <span className="text-xs font-bold tabular-nums mb-1" style={{ color: MINE_COLOR }}>{mine}</span>
                      <div className="w-7 rounded-t-md" style={{ height: `${Math.max(4, (mine / maxSub) * BAR_MAX_PX)}px`, background: MINE_COLOR }} />
                    </div>
                    <div className="flex flex-col items-center justify-end">
                      <span className="text-xs font-bold tabular-nums mb-1" style={{ color: RIVAL_COLOR }}>{rival}</span>
                      <div className="w-7 rounded-t-md" style={{ height: `${Math.max(4, (rival / maxSub) * BAR_MAX_PX)}px`, background: RIVAL_COLOR }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>{subject}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'oklch(0.5 0.015 250)' }}>
              전반적으로 Rival 평균 대비 우수한 성취를 보이고 있어요.
            </p>
          </div>

          {/* 나를 선택한 수 */}
          <div className="axis-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>학생들이 나를 선택한 수</span>
              <Info size={12} style={{ color: 'oklch(0.6 0.015 250)' }} />
            </div>
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#F8F0DC' }}>
                <Users size={28} style={{ color: '#C8A15A' }} />
              </div>
              <div>
                <div className="text-3xl font-black tabular-nums" style={{ color: 'oklch(0.2 0.02 250)' }}>
                  {challengersCount}<span className="text-base font-bold ml-1">명</span>
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>나를 Rival로 선택한 학생</div>
              </div>
            </div>
            <p className="text-xs mt-3 pt-3" style={{ color: 'oklch(0.55 0.015 250)', borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              ※ 누가 선택했는지는 표시되지 않습니다. 익명으로 함께 성장해요.
            </p>
          </div>
        </div>

        {/* Rival 상세 매치업(성장 기록) + 성장 제안 */}
        <div ref={detailRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4 scroll-mt-4">
          <div className="axis-card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>상세 매치업 · 주차별 성장 기록</span>
              <Info size={12} style={{ color: 'oklch(0.6 0.015 250)' }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 460 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
                    {['날짜', '유형', '과목', '결과', '점수 차', '나의 성장'].map(h => (
                      <th key={h} className="text-left font-semibold px-2 py-2" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {challengeLog.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                      <td className="px-2 py-2 tabular-nums text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>{row.date}</td>
                      <td className="px-2 py-2 text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>{row.type}</td>
                      <td className="px-2 py-2 text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>{row.subject}</td>
                      <td className="px-2 py-2 text-xs font-semibold" style={{ color: row.result === '성장' ? MINE_COLOR : 'oklch(0.6 0.13 60)' }}>{row.result}</td>
                      <td className="px-2 py-2 text-xs tabular-nums" style={{ color: row.gap.startsWith('+') ? MINE_COLOR : 'oklch(0.6 0.13 60)' }}>{row.gap}</td>
                      <td className="px-2 py-2 text-xs tabular-nums font-semibold" style={{ color: row.growth.startsWith('+') ? MINE_COLOR : 'oklch(0.6 0.13 60)' }}>{row.growth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 성장을 위한 제안 */}
          <div className="axis-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={15} style={{ color: '#C8A15A' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>성장을 위한 제안</span>
            </div>
            <ul className="space-y-2.5">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#F8F0DC' }}>
                    <span style={{ color: '#C8A15A', fontSize: 10 }}>✓</span>
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            <Link href="/student/growth">
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer" style={{ color: '#0B1B33' }}>
                성장 진열장에서 계획 세우기 <ChevronRight size={12} />
              </div>
            </Link>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
