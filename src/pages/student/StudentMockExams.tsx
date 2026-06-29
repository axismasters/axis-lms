// AXIS LMS v1.2 - StudentMockExams (Mock Exam Result Foundation v1)
// 학생 전용 모의고사 결과 조회 — 읽기 전용.
// ✅ 내신대비모의고사(mock-school) / 수능실전모의고사(mock-suneung) 결과만 표시
// ✅ getPublishedResultsForStudent() 공개 필터 적용 (미공개/미채점/결석 제외)
// ✅ 본인(assignedStudentIds[0]) 데이터만 조회
// 🚫 대학추천/합격가능성/등급/백분위 미구현 (향후 단계)
// 🚫 라이벌/엠블럼/경쟁 정보 없음

import { TrendingUp } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { EXAM_CATEGORIES } from '@/lib/assessmentData';

const MOCK_EXAM_CATEGORY_IDS = ['mock-school', 'mock-suneung'] as const;
type MockExamCategoryId = typeof MOCK_EXAM_CATEGORY_IDS[number];

function scoreColor(pct: number): string {
  return pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

function categoryBadgeStyle(categoryId: string): { background: string; color: string } {
  if (categoryId === 'mock-suneung') {
    return { background: 'oklch(0.95 0.04 250)', color: 'oklch(0.4 0.15 250)' };
  }
  return { background: 'oklch(0.94 0.08 160)', color: 'oklch(0.28 0.15 160)' };
}

export default function StudentMockExams() {
  const { currentUser } = useAuth();
  const { getPublishedResultsForStudent } = useAssessment();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';

  // 공개된 결과 중 모의고사 카테고리만 필터 (AssessmentContext 공개 필터 경유)
  const allPublished = myStudentId ? getPublishedResultsForStudent(myStudentId) : [];
  const mockResults = allPublished.filter((r) =>
    MOCK_EXAM_CATEGORY_IDS.includes(r.categoryId as MockExamCategoryId)
  );

  const avg =
    mockResults.length > 0
      ? Math.round(
          (mockResults.reduce(
            (sum, r) => sum + (r.totalPoints > 0 ? r.earnedScore / r.totalPoints : 0),
            0
          ) /
            mockResults.length) *
            100
        )
      : null;

  const best =
    mockResults.length > 0
      ? Math.max(
          ...mockResults.map((r) =>
            r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0
          )
        )
      : null;

  return (
    <StudentLayout title="모의고사 결과">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 안내 */}
        <div
          className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}
        >
          내신대비모의고사 및 수능실전모의고사 공개 결과만 표시됩니다. 채점 중이거나 미공개된 결과는 표시되지 않습니다.
        </div>

        {mockResults.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <TrendingUp size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              표시할 모의고사 결과가 없습니다.
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
              모의고사 결과가 공개되면 여기에 표시됩니다.
            </div>
          </div>
        ) : (
          <>
            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '응시 횟수', value: `${mockResults.length}회`, color: 'oklch(0.511 0.262 276.966)' },
                { label: '평균',      value: avg !== null ? `${avg}%` : '-',  color: 'oklch(0.45 0.15 160)' },
                { label: '최고',      value: best !== null ? `${best}%` : '-', color: 'oklch(0.55 0.15 80)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 결과 목록 */}
            <div className="space-y-2">
              {mockResults.map((r) => {
                const pct = r.totalPoints > 0 ? Math.round((r.earnedScore / r.totalPoints) * 100) : 0;
                const category = EXAM_CATEGORIES.find((c) => c.id === r.categoryId);
                const badgeStyle = categoryBadgeStyle(r.categoryId);
                return (
                  <div key={r.examId} className="axis-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {r.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                            {r.examDate}
                          </span>
                          {category && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={badgeStyle}
                            >
                              {category.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-bold tabular-nums text-sm" style={{ color: scoreColor(pct) }}>
                          {r.earnedScore}/{r.totalPoints}
                        </div>
                        <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                    {/* 달성률 바 */}
                    <div
                      className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'oklch(0.93 0.006 250)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: scoreColor(pct) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </StudentLayout>
  );
}
