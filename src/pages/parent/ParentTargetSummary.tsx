// AXIS LMS v1.2 — Phase 3A: ParentTargetSummary
// 학부모용 목표대학 추천 / 대학추천 요약
//
// 정책:
//   - 고1/고2 자녀: "목표대학 추천" 요약 (성장 방향 중심)
//   - 고3 자녀: "대학추천" 요약 (수능실전 누적 중심)
//   - 학생용보다 설명형
//   - 합격 관련 표현 금지
//
// 경로: /parent/target-summary

import { GraduationCap, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import { getNationalMocksForStudent, getSchoolRecordsForStudent, STUDENT_HIDDEN_CATEGORY_IDS } from '@/lib/phase2dData';
import { UNIVERSITY_BAND_PREVIEW, getUniversityPreviewState, getPreviewChecklist } from '@/lib/studentUniversityPreview';

export default function ParentTargetSummary() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();

  const myStudentIds = currentUser.assignedStudentIds ?? [];
  const [selectedId, setSelectedId] = useState(myStudentIds[0] ?? '');
  const student = students.find(s => s.id === selectedId);

  const gradeLevel = detectStudentGradeLevel(student);
  const universityLabel = getUniversityMenuLabel(gradeLevel);
  const isGrade3 = gradeLevel === '고3';

  const publishedResults = getPublishedResultsForStudent(exams, submissions, selectedId)
    .filter(r => !STUDENT_HIDDEN_CATEGORY_IDS.includes(r.categoryId as any));
  const nationalMocks = getNationalMocksForStudent(selectedId);
  const schoolRecords = getSchoolRecordsForStudent(selectedId);

  const previewState = getUniversityPreviewState(publishedResults);
  const checklist = getPreviewChecklist(previewState);
  const readyCount = checklist.filter(c => c.done).length;
  const suneungRounds = previewState.suneungRounds;

  return (
    <ParentLayout title={universityLabel}>
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

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

        {/* 헤더 */}
        <div className="axis-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EDE9FE' }}>
              <GraduationCap size={20} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {student?.name ?? '자녀'} — {universityLabel}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                {isGrade3
                  ? '수능실전모의고사와 누적 성적을 바탕으로 대학추천 준비 상태를 안내합니다.'
                  : '지금 성적과 목표를 바탕으로 앞으로의 목표대학 방향을 안내합니다.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gradeLevel && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                {gradeLevel}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={previewState.status === 'ready'
                ? { background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.15 145)' }
                : { background: 'oklch(0.93 0.006 250)', color: 'oklch(0.5 0.01 250)' }}>
              {previewState.statusLabel}
            </span>
          </div>
        </div>

        {/* 설명형 안내 (학부모용) */}
        <div className="axis-card p-4 text-sm" style={{ lineHeight: 1.7 }}>
          {isGrade3 ? (
            <p style={{ color: 'oklch(0.4 0.015 250)' }}>
              <strong>{student?.name}</strong> 학생의 수능실전 모의고사 결과가
              쌓일수록 대학추천 분석의 정확도가 높아집니다.
              현재까지 <strong>{suneungRounds}회</strong>의 수능실전 결과가 누적되어 있습니다.
              {suneungRounds < 3 ? ' 3회 이상 누적 시 추이 분석이 가능합니다.' : ' 추이 분석이 가능한 상태입니다.'}
            </p>
          ) : (
            <p style={{ color: 'oklch(0.4 0.015 250)' }}>
              <strong>{student?.name}</strong> 학생은 현재 {gradeLevel ?? '학년'} 과정에 있습니다.
              내신과 모의고사 성적이 지속적으로 쌓이면
              목표대학 방향을 구체화할 수 있습니다.
              현재 내신 기록 {schoolRecords.length}건, 모의고사 기록 {nationalMocks.length}회가 누적되어 있습니다.
            </p>
          )}
        </div>

        {/* 데이터 준비 현황 */}
        <div className="axis-card">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
              데이터 준비 현황 ({readyCount}/{checklist.length})
            </span>
          </div>
          {checklist.map(({ item, done, doneLabel, pendingLabel }) => (
            <div key={item} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
              {done
                ? <CheckCircle2 size={16} style={{ color: 'oklch(0.45 0.15 145)', flexShrink: 0 }} />
                : <Clock size={16} style={{ color: 'oklch(0.65 0.015 250)', flexShrink: 0 }} />
              }
              <div>
                <div className="text-sm font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>{item}</div>
                <div className="text-xs mt-0.5" style={{ color: done ? 'oklch(0.45 0.15 145)' : 'oklch(0.6 0.015 250)' }}>
                  {done ? doneLabel : pendingLabel}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 밴드 잠금 안내 */}
        <div className="rounded-xl p-4 text-center" style={{ background: 'oklch(0.95 0.04 250)' }}>
          <GraduationCap size={24} className="mx-auto mb-2" style={{ color: '#7C3AED' }} />
          <div className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.35 0.015 250)' }}>
            {isGrade3 ? '대학추천 분석 준비 중' : '목표대학 추천 분석 준비 중'}
          </div>
          <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {isGrade3
              ? '수능실전 결과 누적 후 선생님과 함께 상담 리포트를 확인하게 됩니다.'
              : '내신·모의고사 성장 흐름을 바탕으로 앞으로의 목표 방향을 논의하게 됩니다.'}
          </div>
        </div>

        {/* 상담 리포트 안내 */}
        <div className="axis-card p-4 flex items-center justify-between"
          style={{ borderLeft: '3px solid #7C3AED' }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
              상담 리포트는 선생님에게 문의하세요
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
              상세 분석 리포트는 선생님이 관리자 화면에서 준비합니다.
            </div>
          </div>
          <ChevronRight size={15} style={{ color: '#7C3AED' }} />
        </div>

      </div>
    </ParentLayout>
  );
}
