// AXIS LMS v1.2 — Phase 3A-1: StudentGrades (테스트 화면)
// 단원평가 + 내신대비 모의고사 중심 테스트 결과 조회
//
// Phase 3A-1 변경:
//   ✅ 화면명 "성적" → "테스트"
//   ✅ 탭: 단원평가 + 내신대비 모의고사 (2탭)
//   ✅ 점수 추이 그래프 + 내 점수 vs 평균 막대 추가
//   ✅ 최근 3회 평균 / 최고 기록 / 이전 대비 변화 표시
//   ✅ 성적표 상세 + IF 채점 유지
//   ✅ 학생 직접 입력 버튼 제거 (선생님이 입력)
//   ✅ 실제내신/전국연합/수능실전 → 대학추천 화면으로 이동
//
// ⚠ 금지:
//   - 합격률 / 합격 가능성 / 합격 보장 / 불합격 표현 금지
//   - 학생 화면 수납/재무 노출 금지
//   - 학생 성적 직접 입력 금지 (선생님이 입력)

import { useState } from 'react';
import { X, ClipboardList, Lightbulb, BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import {
  STUDENT_HIDDEN_CATEGORY_IDS,
  getSchoolGradeColor,
} from '@/lib/phase2dData';
import type { StudentExamResult, ExamSubmission } from '@/lib/assessmentData';
import { IF_REASONS, calcIfAnalysis, getIfMotivationComment, calcIfAnalysisFromQuestions, getIfMotivationCommentFromQuestions } from '@/lib/studentIfAnalysis';
import type { IfReason, IfQuestionEntry } from '@/lib/studentIfAnalysis';

// ─── 성적 색상 ────────────────────────────────────────────────────────
function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 145)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

// ─── 탭 정의 (2탭) ────────────────────────────────────────────────────
interface TestTab {
  id: string;
  label: string;
  categoryIds: string[];
  color: string;
  accentBg: string;
  description: string;
}

const TEST_TABS: TestTab[] = [
  {
    id: 'unit-eval',
    label: '단원평가',
    categoryIds: ['unit-eval', 'certification'],
    color: 'oklch(0.511 0.262 276.966)',
    accentBg: 'oklch(0.95 0.06 260)',
    description: '단원별 평가 결과 — 단원평가 + 인증평가',
  },
  {
    id: 'mock-school',
    label: '내신대비',
    categoryIds: ['mock-school'],
    color: 'oklch(0.45 0.15 160)',
    accentBg: 'oklch(0.94 0.06 145)',
    description: '내신 대비 모의고사 결과',
  },
];

// ─── 인라인 SVG 추이 그래프 ─────────────────────────────────────────
function TrendChart({ results }: { results: StudentExamResult[] }) {
  if (results.length < 2) return null;
  const last5 = results.slice(-5);
  const pcts = last5.map(r => r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0);
  const W = 220, H = 80, pad = 16;
  const minPct = Math.max(0, Math.min(...pcts) - 10);
  const maxPct = Math.min(100, Math.max(...pcts) + 10);
  const range = maxPct - minPct || 10;
  const xs = pcts.map((_, i) => pad + (i / (pcts.length - 1)) * (W - 2 * pad));
  const ys = pcts.map(p => H - pad - ((p - minPct) / range) * (H - 2 * pad));
  const trend = pcts[pcts.length - 1] - pcts[0];

  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const areaPoints = `${xs[0]},${H - pad} ${points} ${xs[xs.length - 1]},${H - pad}`;

  const color = trend > 0 ? 'oklch(0.45 0.15 145)' : trend < 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.511 0.262 276.966)';

  return (
    <div className="axis-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
          <span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 250)' }}>점수 추이</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color }}>
          {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
          {trend > 0 ? `+${trend}%p` : trend < 0 ? `${trend}%p` : '동일'}
        </div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polygon points={areaPoints} fill={color} fillOpacity="0.1" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r={4} fill="white" stroke={color} strokeWidth="1.5" />
            <text x={x} y={H - 1} fontSize={9} textAnchor="middle" fill="oklch(0.65 0.015 250)">
              {last5[i].examDate.slice(5)}
            </text>
            <text x={x} y={ys[i] - 7} fontSize={9} textAnchor="middle" fontWeight="700" fill={color}>
              {pcts[i]}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── 내 점수 vs 평균 막대 그래프 ────────────────────────────────────
function ScoreVsAvgBar({ result }: { result: StudentExamResult }) {
  const myPct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const avgPct = result.averageScore != null && result.totalPoints > 0
    ? Math.round(result.averageScore / result.totalPoints * 100) : null;
  if (avgPct === null) return null;
  const diff = myPct - avgPct;
  const myColor = scoreColor(myPct);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'oklch(0.55 0.015 250)' }}>내 점수</div>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <div className="h-full rounded-full" style={{ width: `${myPct}%`, background: myColor }} />
        </div>
        <div className="text-xs font-bold w-8 text-right tabular-nums flex-shrink-0" style={{ color: myColor }}>{myPct}%</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'oklch(0.55 0.015 250)' }}>평균</div>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: 'oklch(0.7 0.01 250)' }} />
        </div>
        <div className="text-xs font-bold w-8 text-right tabular-nums flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{avgPct}%</div>
      </div>
      {diff !== 0 && (
        <div className="text-xs text-center" style={{ color: diff > 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
          평균 대비 {diff > 0 ? `+${diff}%p` : `${diff}%p`}
        </div>
      )}
    </div>
  );
}

// ─── 성적표 상세 모달 (IF 채점 포함) ────────────────────────────────
function ResultDetailModal({ result, onClose }: { result: StudentExamResult; onClose: () => void }) {
  const pct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const avgPct = result.averageScore != null && result.totalPoints > 0
    ? Math.round(result.averageScore / result.totalPoints * 100) : null;
  const color = scoreColor(pct);
  const maxRecoverable = result.totalPoints - result.earnedScore;
  const pointStep = result.totalPoints >= 100 ? 5 : 2;
  const recoveryOptions = Array.from(
    { length: Math.floor(maxRecoverable / pointStep) + 1 },
    (_, i) => i * pointStep
  ).slice(0, 9);

  const [ifOpen, setIfOpen] = useState(false);
  // 문항별 quick-tap 방식(오답 문항이 있는 시험) — 문항ID → 선택된 이유
  const [questionReasons, setQuestionReasons] = useState<Record<string, IfReason | null>>({});
  const hasQuestionLevelData = result.wrongQuestions.length > 0;
  const questionEntries: IfQuestionEntry[] = result.wrongQuestions.map(wq => ({
    questionId: wq.questionId, no: wq.no, points: wq.points,
    reason: questionReasons[wq.questionId] ?? null,
  }));
  const ifQuestionResult = hasQuestionLevelData
    ? calcIfAnalysisFromQuestions({
        examId: result.examId, examTitle: result.title,
        actualScore: result.earnedScore, totalPoints: result.totalPoints,
        questions: questionEntries,
      })
    : null;

  // Fallback: 문항별 채점 데이터가 없는 legacy 시험은 기존 시험 전체 단위 방식을 그대로 사용한다.
  const [ifReason, setIfReason] = useState<IfReason>(IF_REASONS[0]);
  const [ifPoints, setIfPoints] = useState(0);
  const ifResult = !hasQuestionLevelData && ifPoints > 0
    ? calcIfAnalysis({ examId: result.examId, examTitle: result.title, actualScore: result.earnedScore, totalPoints: result.totalPoints, recoveredPoints: ifPoints, reason: ifReason })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="axis-card w-full max-w-sm" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'oklch(0.55 0.2 27)' }}>테스트 성적표</div>
            <h2 className="font-bold text-sm leading-snug" style={{ color: 'oklch(0.15 0.02 250)' }}>{result.title}</h2>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{result.examDate}</div>
          </div>
          <button onClick={onClose} className="p-1" aria-label="닫기"><X size={18} style={{ color: 'oklch(0.55 0.015 250)' }} /></button>
        </div>

        {/* 점수 */}
        <div className="px-5 pb-3">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black tabular-nums" style={{ color }}>{result.earnedScore}</span>
            <span className="text-lg font-semibold mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>/ {result.totalPoints}</span>
            <span className="text-sm font-bold mb-1.5" style={{ color }}>({pct}%)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-2 px-5 pb-3">
          {[
            { label: '내 점수', value: `${result.earnedScore}/${result.totalPoints}`, highlight: true },
            ...(avgPct !== null ? [{ label: '평균', value: `${result.averageScore?.toFixed(1) ?? '-'}점 (${avgPct}%)` }] : []),
            ...(result.highestScore !== undefined ? [{ label: '최고점', value: `${result.highestScore}점` }] : []),
            ...(result.participantCount !== undefined ? [{ label: '응시인원', value: `${result.participantCount}명` }] : []),
            ...(result.myRank !== undefined && result.participantCount !== undefined
              ? [{ label: '내 등수', value: `${result.myRank}등/${result.participantCount}명` }] : []),
          ].map(({ label, value, highlight }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: 'oklch(0.97 0.004 247)' }}>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
              <div className="font-bold text-sm tabular-nums mt-0.5" style={{ color: highlight ? color : 'oklch(0.35 0.02 250)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 내 점수 vs 평균 바 */}
        {avgPct !== null && (
          <div className="px-5 pb-4">
            <ScoreVsAvgBar result={result} />
          </div>
        )}

        {/* IF 채점 블록 */}
        {maxRecoverable > 0 && (
          <div className="mx-5 mb-5 rounded-xl overflow-hidden border" style={{ borderColor: 'oklch(0.88 0.04 260)' }}>
            <button type="button" onClick={() => setIfOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: ifOpen ? 'oklch(0.94 0.04 260)' : 'oklch(0.97 0.02 260)' }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                <span className="text-sm font-bold" style={{ color: 'oklch(0.25 0.02 250)' }}>IF 채점</span>
                <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>맞출 수 있었던 문제를 맞혔다면?</span>
              </div>
              <span className="text-xs font-medium" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{ifOpen ? '닫기' : '분석'}</span>
            </button>
            {ifOpen && (
              <div className="px-4 py-4 space-y-4 bg-white">
                {hasQuestionLevelData ? (
                  <>
                    {/* 문항별 quick-tap: 오답 문항만 리스트업, 문항마다 3버튼 중 1탭 */}
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>
                        오답 문항 {result.wrongQuestions.length}개 — 문항별로 놓친 이유를 선택하세요
                      </div>
                      <div className="space-y-2">
                        {result.wrongQuestions.map(wq => {
                          const selected = questionReasons[wq.questionId] ?? null;
                          return (
                            <div key={wq.questionId} className="rounded-lg p-2.5" style={{ background: 'oklch(0.97 0.004 250)' }}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold" style={{ color: 'oklch(0.3 0.02 250)' }}>{wq.no}번 문항</span>
                                <span className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>배점 {wq.points}점</span>
                              </div>
                              <div className="flex gap-1.5">
                                {IF_REASONS.map(r => (
                                  <button key={r} type="button"
                                    onClick={() => setQuestionReasons(prev => ({ ...prev, [wq.questionId]: prev[wq.questionId] === r ? null : r }))}
                                    className="flex-1 py-1.5 rounded-md text-xs font-semibold"
                                    style={{ background: selected === r ? 'oklch(0.511 0.262 276.966)' : 'white', color: selected === r ? 'white' : 'oklch(0.45 0.015 250)', border: '1px solid ' + (selected === r ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.008 250)') }}>
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {ifQuestionResult && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '실제 점수', value: `${ifQuestionResult.actualScore}점`, c: color },
                            { label: 'IF 점수', value: `${ifQuestionResult.ifScore}점`, c: 'oklch(0.511 0.262 276.966)' },
                            { label: '놓친 점수', value: `${ifQuestionResult.missedPoints}점`, c: 'oklch(0.55 0.2 27)' },
                            { label: '상승 가능성', value: `+${ifQuestionResult.improvementPct}%p`, c: '#059669' },
                          ].map(({ label, value, c }) => (
                            <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.97 0.004 247)' }}>
                              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                              <div className="font-black text-base tabular-nums" style={{ color: c }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-center" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {ifQuestionResult.selectedCount}/{ifQuestionResult.totalWrongCount}개 문항 선택됨
                        </div>
                        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'oklch(0.95 0.06 260)', color: 'oklch(0.3 0.1 260)' }}>
                          {getIfMotivationCommentFromQuestions(ifQuestionResult)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Fallback: 문항별 채점 데이터가 없는 시험(legacy) — 시험 전체 단위로 계산 */}
                    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'oklch(0.96 0.02 80)', color: 'oklch(0.4 0.08 80)' }}>
                      이 시험은 문항별 채점 데이터가 없어 전체 단위로 계산합니다.
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>놓친 이유</div>
                      <div className="flex gap-2">
                        {IF_REASONS.map(r => (
                          <button key={r} type="button" onClick={() => setIfReason(r)}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: ifReason === r ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.95 0.004 250)', color: ifReason === r ? 'white' : 'oklch(0.45 0.015 250)' }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>더 받을 수 있었던 점수</div>
                      <div className="flex flex-wrap gap-1.5">
                        {recoveryOptions.map(pts => (
                          <button key={pts} type="button" onClick={() => setIfPoints(pts)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: ifPoints === pts ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.95 0.004 250)', color: ifPoints === pts ? 'white' : 'oklch(0.45 0.015 250)' }}>
                            {pts === 0 ? '선택 안함' : `+${pts}점`}
                          </button>
                        ))}
                      </div>
                    </div>
                    {ifResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '실제 점수', value: `${ifResult.actualScore}점`, c: color },
                            { label: 'IF 점수', value: `${ifResult.ifScore}점`, c: 'oklch(0.511 0.262 276.966)' },
                            { label: '놓친 점수', value: `${ifResult.missedPoints}점`, c: 'oklch(0.55 0.2 27)' },
                            { label: '상승 가능성', value: `+${ifResult.improvementPct}%p`, c: '#059669' },
                          ].map(({ label, value, c }) => (
                            <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.97 0.004 247)' }}>
                              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                              <div className="font-black text-base tabular-nums" style={{ color: c }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'oklch(0.95 0.06 260)', color: 'oklch(0.3 0.1 260)' }}>
                          {getIfMotivationComment(ifResult)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>
                        위에서 점수를 선택하면 IF 분석 결과가 표시됩니다.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 시험 카드 ────────────────────────────────────────────────────────
function TestCard({ result, onClick }: { result: StudentExamResult; onClick: () => void }) {
  const pct = result.totalPoints > 0 ? Math.round(result.earnedScore / result.totalPoints * 100) : 0;
  const color = scoreColor(pct);
  const avgPct = result.averageScore != null && result.totalPoints > 0
    ? Math.round(result.averageScore / result.totalPoints * 100) : null;

  return (
    <button type="button" onClick={onClick} className="axis-card p-4 w-full text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>{result.title}</div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {result.examDate}
            {result.participantCount && ` · 응시 ${result.participantCount}명`}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-black text-lg tabular-nums" style={{ color }}>{pct}%</div>
          <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>
            {result.earnedScore}/{result.totalPoints}
          </div>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      {avgPct !== null && (
        <div className="mt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)', width: 24 }}>나</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs tabular-nums" style={{ color }}>{pct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)', width: 24 }}>평균</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
              <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: 'oklch(0.75 0.01 250)' }} />
            </div>
            <span className="text-xs tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{avgPct}%</span>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── 탭 콘텐츠 ────────────────────────────────────────────────────────
function TestTabContent({ results, tab }: { results: StudentExamResult[]; tab: TestTab }) {
  const [selectedResult, setSelectedResult] = useState<StudentExamResult | null>(null);
  const sorted = [...results].sort((a, b) => b.examDate.localeCompare(a.examDate));

  // 요약 지표
  const pcts = sorted.map(r => r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0);
  const recent3Avg = pcts.slice(0, 3).length > 0
    ? Math.round(pcts.slice(0, 3).reduce((s, p) => s + p, 0) / pcts.slice(0, 3).length) : null;
  const bestPct = pcts.length > 0 ? Math.max(...pcts) : null;
  const prevChange = pcts.length >= 2 ? pcts[0] - pcts[1] : null;

  if (sorted.length === 0) {
    return (
      <div className="axis-card p-8 text-center">
        <ClipboardList size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
        <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
          아직 등록된 {tab.label} 성적이 없습니다.
        </div>
        <div className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>
          선생님이 성적을 입력하면 여기에 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 요약 지표 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '최근 3회 평균', value: recent3Avg !== null ? `${recent3Avg}%` : '-', color: scoreColor(recent3Avg ?? 0) },
          { label: '최고 기록', value: bestPct !== null ? `${bestPct}%` : '-', color: 'oklch(0.511 0.262 276.966)' },
          { label: '이전 대비', value: prevChange !== null ? (prevChange >= 0 ? `+${prevChange}%p` : `${prevChange}%p`) : '-',
            color: prevChange !== null ? (prevChange > 0 ? 'oklch(0.45 0.15 145)' : prevChange < 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.5 0.015 250)') : 'oklch(0.5 0.015 250)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="axis-card p-3 text-center">
            <div className="font-black text-base tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 추이 그래프 */}
      <TrendChart results={sorted} />

      {/* 시험 카드 목록 */}
      <div className="space-y-2">
        {sorted.map(r => (
          <TestCard key={r.examId} result={r} onClick={() => setSelectedResult(r)} />
        ))}
      </div>

      {/* 상세 모달 */}
      {selectedResult && (
        <ResultDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────
export default function StudentGrades() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const [activeTabId, setActiveTabId] = useState<string>('unit-eval');

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';

  // 학원 평가 성적 (입학테스트 제외)
  const allResults = myStudentId
    ? getPublishedResultsForStudent(exams, submissions, myStudentId)
        .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any))
    : [];

  const activeTab = TEST_TABS.find(t => t.id === activeTabId) ?? TEST_TABS[0];
  const tabResults = allResults.filter(r => activeTab.categoryIds.includes(r.categoryId));

  const tabCounts: Record<string, number> = {
    'unit-eval':   allResults.filter(r => ['unit-eval', 'certification'].includes(r.categoryId)).length,
    'mock-school': allResults.filter(r => r.categoryId === 'mock-school').length,
  };

  return (
    <StudentLayout title="테스트">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

        {/* 안내 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}>
          단원평가와 내신대비 모의고사 결과를 확인하세요. 카드를 탭하면 성적표 상세와 IF 채점을 볼 수 있습니다.
        </div>

        {/* 탭 */}
        <div className="flex gap-2">
          {TEST_TABS.map(tab => {
            const count = tabCounts[tab.id] ?? 0;
            const isActive = activeTabId === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTabId(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold flex-1"
                style={{
                  background: isActive ? tab.color : 'oklch(0.95 0.004 250)',
                  color: isActive ? 'white' : 'oklch(0.5 0.015 250)',
                  border: isActive ? `1px solid ${tab.color}` : '1px solid oklch(0.9 0.008 250)',
                }}>
                {tab.label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-black leading-none"
                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : tab.accentBg, color: isActive ? 'white' : tab.color, fontSize: 10 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 탭 설명 */}
        <div className="text-xs px-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{activeTab.description}</div>

        {/* 탭 콘텐츠 */}
        <TestTabContent results={tabResults} tab={activeTab} />

        {/* 대학추천 안내 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
          💡 실제내신 · 전국연합모의고사 · 수능실전 성적은 홈의 <strong>대학추천</strong> 카드에서 확인하세요.
        </div>

      </div>
    </StudentLayout>
  );
}
