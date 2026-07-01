// AXIS LMS v1.2 — Phase 3A-1+: StudentTargetPreview (대학추천/목표대학추천)
//
// 선생님이 입력한 확정 데이터를 바탕으로 표시
//   - 내신성적 (TeacherSchoolRecordInput) 요약
//   - 전국연합모의고사 (TeacherMockExamInput) 요약
//   - 수능실전 요약 (고3)
//   - 수학 향상 시나리오
//   - 대학추천 준비 상태
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격/안정 합격 표현 금지
// 학생: 조회만 (성적 입력 버튼 없음)

import { GraduationCap, CheckCircle2, Clock, BarChart2, TrendingUp, ChevronRight } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import { getSchoolRecordsForStudentAll, SCHOOL_SUBJECTS } from '@/lib/teacherSchoolRecordInput';
import { getNationalMockRecordsForStudent, getSuneungRecordsForStudent, getMockExamLabel } from '@/lib/teacherMockExamInput';
import { buildUniversityRecommendationPayloadForStudent, getReadinessLabel, getRecommendationFitScore, getSubjectImprovementNeeds } from '@/lib/universityPayloadAdapter';

function gradeColor(g: number) {
  return g <= 2 ? 'oklch(0.45 0.15 145)' : g <= 4 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

export default function StudentTargetPreview() {
  const { currentUser } = useAuth();
  const { students } = useStudents();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const gradeLevel = detectStudentGradeLevel(student);
  const menuLabel = getUniversityMenuLabel(gradeLevel);
  const isGrade3 = gradeLevel === '고3';

  // 데이터 로드
  const schoolRecords = getSchoolRecordsForStudentAll(myStudentId);
  const nationalMocks = getNationalMockRecordsForStudent(myStudentId);
  const suneungMocks = getSuneungRecordsForStudent(myStudentId);

  // 전체 payload
  const payload = buildUniversityRecommendationPayloadForStudent(myStudentId, gradeLevel);
  const readiness = getReadinessLabel(payload);
  const fitScore = getRecommendationFitScore(payload);
  const improvementNeeds = getSubjectImprovementNeeds(payload).slice(0, 5);

  // 데이터 체크리스트
  const checklist = [
    { label: '실제내신 성적', done: payload.dataCompleteness.hasInternalGrades },
    { label: '전국연합모의고사', done: payload.dataCompleteness.hasMockExams },
    ...(isGrade3 ? [{ label: '수능실전 모의고사', done: payload.dataCompleteness.hasSuneungMocks }] : []),
  ];

  // 최근 모의고사 성적 요약
  const latestMock = nationalMocks[0];
  const latestMock2 = nationalMocks[1];

  // 내신 대표 과목 (반영 포함, 등급 있는 것)
  const mainInternalRecord = schoolRecords[0];
  const includedSubjects = mainInternalRecord?.subjectGrades
    .filter(sg => sg.includeInPayload && sg.gradeRank !== undefined)
    .slice(0, 4) ?? [];

  return (
    <StudentLayout title={menuLabel}>
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 헤더 */}
        <div className="axis-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EDE9FE' }}>
              <GraduationCap size={20} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>{menuLabel}</div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                {isGrade3
                  ? '선생님이 입력한 내신·모의고사 성적을 바탕으로 대학추천 준비 상태를 확인합니다.'
                  : '선생님이 입력한 내신·모의고사 성적을 바탕으로 목표대학 방향을 준비합니다.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {gradeLevel && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                {gradeLevel}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: readiness.color + '18', color: readiness.color }}>
              {readiness.label}
            </span>
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
              {payload.dataCompleteness.totalDataPoints}개 확정 데이터
            </span>
          </div>
        </div>

        {/* 추천 적합도 (0~100 + 5단계 라벨) */}
        {payload.dataCompleteness.readyForAnalysis && (
          <div className="axis-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>추천 적합도</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: fitScore.color + '18', color: fitScore.color }}>
                {fitScore.label}
              </span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-black tabular-nums" style={{ color: fitScore.color }}>{fitScore.score}</span>
              <span className="text-sm font-medium mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>/ 100</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'oklch(0.93 0.006 250)' }}>
              <div className="h-full rounded-full" style={{ width: `${fitScore.score}%`, background: fitScore.color }} />
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{fitScore.description}</div>
          </div>
        )}

        {/* 보완 필요 과목 (과목별 0~100) */}
        {improvementNeeds.length > 0 && (
          <div className="axis-card">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>보완 필요 과목</span>
            </div>
            <div className="p-4 space-y-2.5">
              {improvementNeeds.map(n => (
                <div key={n.subjectName + n.source} className="flex items-center gap-2">
                  <div className="text-xs w-16 flex-shrink-0" style={{ color: 'oklch(0.4 0.015 250)' }}>{n.subjectName}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${n.needScore}%`,
                      background: n.needScore >= 60 ? 'oklch(0.55 0.2 27)' : n.needScore >= 30 ? 'oklch(0.55 0.15 80)' : 'oklch(0.45 0.15 145)',
                    }} />
                  </div>
                  <div className="text-xs font-bold tabular-nums w-8 text-right flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{n.needScore}</div>
                </div>
              ))}
              <div className="text-xs pt-1" style={{ color: 'oklch(0.65 0.015 250)' }}>
                ※ 점수가 높을수록 보완이 더 필요한 과목입니다. 등급 기준 참고 지표입니다.
              </div>
            </div>
          </div>
        )}
        <div className="axis-card">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>데이터 준비 현황</span>
          </div>
          {checklist.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
              {done ? <CheckCircle2 size={16} style={{ color: 'oklch(0.45 0.15 145)', flexShrink: 0 }} />
                    : <Clock size={16} style={{ color: 'oklch(0.65 0.015 250)', flexShrink: 0 }} />}
              <span className="text-sm font-medium flex-1" style={{ color: 'oklch(0.25 0.02 250)' }}>{label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={done
                  ? { background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.15 145)' }
                  : { background: 'oklch(0.93 0.006 250)', color: 'oklch(0.5 0.01 250)' }}>
                {done ? '완료' : '대기'}
              </span>
            </div>
          ))}
        </div>

        {/* 내신 성적 요약 */}
        {includedSubjects.length > 0 && mainInternalRecord && (
          <section>
            <div className="flex items-center gap-2 mb-2 px-1">
              <BarChart2 size={15} style={{ color: 'oklch(0.45 0.15 145)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>실제내신 성적</span>
              <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                {mainInternalRecord.academicYear} {mainInternalRecord.semester} {mainInternalRecord.examType}
              </span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.15 145)' }}>
                확정 성적
              </span>
            </div>
            <div className="axis-card p-4">
              {payload.dataCompleteness.weightedInternalGradeAvg !== undefined && (
                <div className="mb-3 flex items-center gap-3">
                  <div className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>가중 평균등급</div>
                  <div className="font-black text-xl" style={{ color: gradeColor(Math.round(payload.dataCompleteness.weightedInternalGradeAvg)) }}>
                    {payload.dataCompleteness.weightedInternalGradeAvg.toFixed(2)}등급
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                {includedSubjects.map(sg => {
                  const def = SCHOOL_SUBJECTS.find(s => s.id === sg.subjectId);
                  return (
                    <div key={sg.subjectId} className="flex items-center gap-2">
                      <div className="text-xs w-20 flex-shrink-0" style={{ color: 'oklch(0.5 0.015 250)' }}>{def?.name ?? sg.subjectId}</div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                        <div className="h-full rounded-full" style={{ width: `${((9 - (sg.gradeRank ?? 5)) / 8) * 100}%`, background: gradeColor(sg.gradeRank ?? 5) }} />
                      </div>
                      <div className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: gradeColor(sg.gradeRank ?? 5), width: 28 }}>
                        {sg.gradeRank}등급
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 전국연합모의고사 요약 */}
        {nationalMocks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 px-1">
              <BarChart2 size={15} style={{ color: '#081F4D' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>전국연합모의고사</span>
              <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{nationalMocks.length}회</span>
            </div>
            {/* 최신 모의고사 */}
            {latestMock && (
              <div className="axis-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{getMockExamLabel(latestMock)}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.15 145)' }}>확정</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '국어', grade: latestMock.korean.grade, std: latestMock.korean.standardScore },
                    { label: '수학', grade: latestMock.math.grade, std: latestMock.math.standardScore },
                    { label: '영어', grade: latestMock.english.grade, std: undefined },
                    { label: '탐구1', grade: latestMock.explore1.grade, std: latestMock.explore1.standardScore },
                  ].map(({ label, grade, std }) => (
                    <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                      <div className="font-black text-base" style={{ color: grade ? gradeColor(grade) : 'oklch(0.6 0.015 250)' }}>
                        {grade ? `${grade}등급` : '-'}
                      </div>
                      {std && <div className="text-xs tabular-nums" style={{ color: 'oklch(0.6 0.015 250)' }}>{std}</div>}
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* 국어·수학 추이 (최근 2회) */}
                {latestMock2 && (
                  <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                    수학 등급 추이:
                    <span style={{ color: latestMock2.math.grade ? gradeColor(latestMock2.math.grade) : 'oklch(0.6 0.015 250)' }}>
                      {latestMock2.math.grade ? ` ${latestMock2.math.grade}등급` : ' -'}
                    </span>
                    →
                    <span style={{ color: latestMock.math.grade ? gradeColor(latestMock.math.grade) : 'oklch(0.6 0.015 250)' }}>
                      {latestMock.math.grade ? ` ${latestMock.math.grade}등급` : ' -'}
                    </span>
                    {latestMock.math.grade && latestMock2.math.grade && (
                      <span style={{ color: latestMock.math.grade < latestMock2.math.grade ? 'oklch(0.45 0.15 145)' : 'oklch(0.55 0.2 27)' }}>
                        {latestMock.math.grade < latestMock2.math.grade ? ' ▲향상' : latestMock.math.grade > latestMock2.math.grade ? ' ▼하락' : ' 동일'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 수능실전 (고3) */}
        {isGrade3 && suneungMocks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingUp size={15} style={{ color: 'oklch(0.55 0.2 27)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수능실전 모의고사</span>
              <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{suneungMocks.length}회 누적</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '응시 횟수', value: `${suneungMocks.length}회`, color: '#081F4D' },
                { label: '최고 수학 등급', value: suneungMocks.some(r => r.math.grade) ? `${Math.min(...suneungMocks.filter(r => r.math.grade).map(r => r.math.grade!))}등급` : '-', color: 'oklch(0.45 0.15 145)' },
                { label: '최고 국어 등급', value: suneungMocks.some(r => r.korean.grade) ? `${Math.min(...suneungMocks.filter(r => r.korean.grade).map(r => r.korean.grade!))}등급` : '-', color: 'oklch(0.45 0.15 145)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-black text-base" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 수학 향상 시나리오 */}
        {payload.mathImprovementScenarios.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingUp size={15} style={{ color: '#7C3AED' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수학 성적 향상 시 목표 변화</span>
            </div>
            <div className="axis-card p-4 space-y-2">
              <div className="text-xs mb-2" style={{ color: 'oklch(0.55 0.015 250)' }}>
                현재 최신 수학 {payload.dataCompleteness.latestMathGrade ?? '-'}등급 기준 시나리오
              </div>
              {payload.mathImprovementScenarios.map(s => (
                <div key={s.improvedGrade} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{s.scenarioLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: gradeColor(s.improvedGrade) }}>{s.improvedGrade}등급</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                      → {s.direction}
                    </span>
                  </div>
                </div>
              ))}
              <div className="text-xs pt-2 border-t" style={{ borderColor: 'oklch(0.93 0.006 250)', color: 'oklch(0.65 0.015 250)' }}>
                ※ 수학 점수 향상을 가정한 방향 안내입니다. 상담 참고용으로만 활용하세요.
              </div>
            </div>
          </section>
        )}

        {/* 상태 요약 */}
        <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'oklch(0.95 0.04 250)' }}>
          <div className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.35 0.015 250)' }}>{readiness.label}</div>
          <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{readiness.description}</div>
        </div>

        {/* 데이터 없을 때 안내 */}
        {payload.dataCompleteness.totalDataPoints === 0 && (
          <div className="axis-card p-6 text-center">
            <GraduationCap size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.7 0.01 250)' }} />
            <div className="font-semibold text-sm" style={{ color: 'oklch(0.35 0.015 250)' }}>
              아직 입력된 성적이 없습니다
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              선생님이 내신성적 또는 전국연합모의고사 성적을 입력하면 이 화면에 표시됩니다.
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
