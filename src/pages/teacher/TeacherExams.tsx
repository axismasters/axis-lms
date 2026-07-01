// AXIS LMS v1.2 - TeacherExams (Phase 3D v3: "내 시험지 관리"로 개편)
// 강사 전용 내 시험지 관리 화면 — 시험지를 만들고, 학생별 성적을 확인하고, 필요하면 채점까지
// 이어지는 공간이다. "채점"은 더 이상 화면 제목이 아니라 시험지 내부 액션 중 하나일 뿐이다.
// - 모든 counts/stats는 담당 학생(assignedStudentIds) submissions 기준
// - exam.status 내부값 노출 금지 → 현장 친화적 표현 사용
// - 담당 학생 데이터 없는 학원 전체 시험은 전체 탭에서 제외
// - Phase 3C: 공통 시험(ACADEMY_COMMON/GRADE_COMMON/COURSE_COMMON) + 본인 소유 TEACHER_PRIVATE만 노출.
//   다른 교사의 TEACHER_PRIVATE 시험은 이 화면에 절대 나타나지 않는다.

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckCircle2, AlertCircle, ChevronRight, Plus, Lock, Users } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import type { ExamSubmission } from '@/lib/assessmentData';
import AssessmentFormModal from '@/components/AssessmentFormModal';
import { Button } from '@/components/ui/button';

type Tab = '미채점' | '전체';

// 담당 학생 submissions 기준으로 강사 화면용 상태 배지 계산
function getExamBadge(examId: string, mySubmissions: ExamSubmission[]) {
  const subs = mySubmissions.filter((s) => s.examId === examId);
  if (subs.length === 0) {
    return { label: '진행 전', bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.55 0.015 250)' };
  }
  const hasPending = subs.some((s) => s.status === '채점중');
  const hasGraded = subs.some((s) => s.status === '채점완료');
  if (hasPending) {
    return { label: '미채점', bg: 'oklch(0.95 0.1 60)', text: 'oklch(0.45 0.15 60)' };
  }
  if (hasGraded) {
    return { label: '성적 확인 가능', bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.35 0.12 160)' };
  }
  return { label: '준비 중', bg: 'oklch(0.94 0.06 250)', text: 'oklch(0.4 0.15 250)' };
}

export default function TeacherExams() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('미채점');
  const [formOpen, setFormOpen] = useState(false);

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  // 담당 학생의 submissions만 사용
  const mySubmissions = submissions.filter((s) => myStudentIds.has(s.studentId));

  // Phase 3C: 담당 반/학원 전체 공통 시험 후보 + 본인 소유 개인 시험(TEACHER_PRIVATE) 후보를 분리해서 계산한다.
  // 다른 교사의 TEACHER_PRIVATE 시험은 assignedClassIds/classId 매칭과 무관하게 항상 제외한다(이중 방어).
  const candidateExams = exams.filter((e) => {
    if (e.scope === 'TEACHER_PRIVATE') return e.ownerTeacherId === currentUser.id;
    return assignedClassIds.includes(e.classId ?? '') || !e.classId;
  });

  // 미채점 탭: 담당 학생 중 채점중 항목이 있는 시험
  const ungradedExams = candidateExams.filter((e) =>
    mySubmissions.some((s) => s.examId === e.id && s.status === '채점중')
  );

  // 전체 탭:
  //   - 담당 반 시험(classId 있음): 항상 표시
  //   - 학원 전체 시험(classId 없음): 담당 학생 submissions가 있는 경우만 표시
  const allMyExams = candidateExams
    .filter((e) => {
      if (e.classId) return true; // 담당 반 시험은 항상 표시
      return mySubmissions.some((s) => s.examId === e.id); // 학원 전체 시험은 담당 학생 데이터 있을 때만
    })
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  const displayExams = tab === '미채점' ? ungradedExams : allMyExams;

  return (
    <TeacherLayout title="내 시험지 관리">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Phase 3C: 내 시험 만들기 */}
        <button type="button" onClick={() => setFormOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'oklch(0.511 0.262 276.966)', color: 'white' }}>
          <Plus size={15} /> 내 시험 만들기
        </button>

        {/* 탭 */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'oklch(0.93 0.006 250)' }}>
          {(['미채점', '전체'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.5 0.015 250)',
                boxShadow: tab === t ? '0 1px 3px oklch(0 0 0 / 0.1)' : 'none',
              }}
            >
              {t}
              {t === '미채점' && ungradedExams.length > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ background: 'oklch(0.577 0.245 27.325)' }}
                >
                  {ungradedExams.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {displayExams.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.5 0.15 160)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              {tab === '미채점' ? '아직 채점할 시험이 없습니다.' : '등록된 시험이 없습니다.'}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {displayExams.map((exam) => {
              // 담당 학생 기준 counts
              const myExamSubs = mySubmissions.filter((s) => s.examId === exam.id);
              const pendingCount = myExamSubs.filter((s) => s.status === '채점중').length;
              const gradedCount = myExamSubs.filter((s) => s.status === '채점완료').length;
              const badge = getExamBadge(exam.id, mySubmissions);

              return (
                <div
                  key={exam.id}
                  className="axis-card axis-card-clickable p-4"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/teacher/exams/${exam.id}/scores`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/teacher/exams/${exam.id}/scores`); }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'oklch(0.2 0.02 250)' }}>
                        {exam.title}
                        {exam.scope === 'TEACHER_PRIVATE' && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                            <Lock size={9} /> 내 수업
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        {exam.subject} · {exam.examDate}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* 담당 학생 기준 세부 정보 */}
                  {pendingCount > 0 && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        <span className="flex items-center gap-1">
                          <AlertCircle size={11} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
                          미채점 {pendingCount}명
                        </span>
                        {gradedCount > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={11} style={{ color: 'oklch(0.5 0.15 160)' }} />
                            완료 {gradedCount}명
                          </span>
                        )}
                      </div>
                      <Link href={`/teacher/exams/${exam.id}/grading`}>
                        <Button size="sm" className="h-7 text-xs gap-0.5" onClick={(e) => e.stopPropagation()} style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                          채점하기 <ChevronRight size={12} />
                        </Button>
                      </Link>
                    </div>
                  )}
                  {pendingCount === 0 && gradedCount > 0 && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        담당 학생 {gradedCount}명 채점 완료 · 만점 {exam.totalScore}점
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                        <Users size={11} /> 학생별 성적 <ChevronRight size={11} />
                      </span>
                    </div>
                  )}
                  {myExamSubs.length === 0 && (
                    <div className="mt-2 text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>
                      담당 학생 응시 데이터가 없습니다.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      <AssessmentFormModal open={formOpen} onClose={() => setFormOpen(false)} createdBy={currentUser.name} mode="teacher" />
    </TeacherLayout>
  );
}
