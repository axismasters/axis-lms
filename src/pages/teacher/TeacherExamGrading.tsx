// AXIS LMS v1.2 - TeacherExamGrading (Persistence v1)
// 강사 전용 채점 상세 화면.
// - 담당 학생 submissions만 표시 (assignedStudentIds 기준)
// - AssessmentContext.gradeSubmissionByTeacher 호출 → Context state 업데이트 → 화면 자동 반영
// - local state는 입력 폼값(score/comment)만 관리, 저장 상태는 Context submissions에서 파생
// - exam.status 내부값 노출 금지
// - classId 없는 학원 전체 시험: 담당 학생 submission 1개 이상일 때만 허용
// [Phase 3D v3-r7-r1] 미채점/채점완료 판정은 항상 isPendingGrading()/isGradedSubmission()
// (assessmentData.ts)를 통해서만 한다 — status 문자열 직접 비교 금지.

import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';
import { isPendingGrading, isGradedSubmission } from '@/lib/assessmentData';

type FormInput = { score: string; comment: string };

function NotFoundScreen() {
  return (
    <TeacherLayout title="채점">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: '#081F4D' }}>
            <ChevronLeft size={14} />
            시험 목록
          </div>
        </Link>
        <div className="axis-card p-10 text-center">
          <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>
            시험을 찾을 수 없습니다.
          </div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
            담당 범위에 없거나 담당 학생 응시 데이터가 없습니다.
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

export default function TeacherExamGrading() {
  const { examId } = useParams<{ examId: string }>();
  const { currentUser } = useAuth();
  const { exams, submissions, gradeSubmissionByTeacher } = useAssessment();
  const { students } = useStudents();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  // 폼 입력값 (ephemeral): 저장 완료 시 해당 항목 제거
  const [inputs, setInputs] = useState<Record<string, FormInput>>({});
  // 저장 오류 (per-student)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Raw exam lookup (범위 미확인 — rawExam)
  const rawExam = examId ? exams.find((e) => e.id === examId) : undefined;

  // 2. 담당 학생 submissions (범위 확인 + 채점 데이터)
  const mySubmissions = submissions.filter(
    (s) => s.examId === examId && myStudentIds.has(s.studentId)
  );

  // 3. Scope 강화 — IIFE 결과를 scopedExam으로 받고, 조기 반환 후 visibleExam에 재할당.
  //    const visibleExam = (() => ...)() 방식은 TypeScript가 클로저(handleGrade 등)에서
  //    visibleExam을 Exam|undefined로 추론해 "possibly undefined" 오류를 냄.
  //    scopedExam(Exam|undefined) → 조기 반환 → visibleExam(Exam) 2단계로 해소.
  const scopedExam = (() => {
    if (!rawExam) return undefined;
    if (rawExam.classId) {
      return assignedClassIds.includes(rawExam.classId) ? rawExam : undefined;
    }
    return mySubmissions.length > 0 ? rawExam : undefined;
  })();
  if (!scopedExam) return <NotFoundScreen />;
  const visibleExam = scopedExam;

  const assignedStudents = students.filter((s) => assignedStudentIds.includes(s.id));

  // Context에서 파생 — 저장 즉시 Context 업데이트 → 자동 반영
  const ungradedSubs = mySubmissions.filter((s) => isPendingGrading(s));
  const gradedSubs = mySubmissions.filter((s) => isGradedSubmission(s));

  function getInput(studentId: string): FormInput {
    return inputs[studentId] ?? { score: '', comment: '' };
  }

  function updateInput(studentId: string, updates: Partial<FormInput>) {
    setInputs((prev) => ({ ...prev, [studentId]: { ...getInput(studentId), ...updates } }));
    // 입력 변경 시 해당 학생 오류 초기화
    if (errors[studentId]) {
      setErrors((prev) => { const n = { ...prev }; delete n[studentId]; return n; });
    }
  }

  function handleGrade(studentId: string) {
    const inp = getInput(studentId);
    const scoreNum = parseFloat(inp.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > visibleExam.totalScore) {
      setErrors((prev) => ({
        ...prev,
        [studentId]: `0~${visibleExam.totalScore}점 범위의 숫자를 입력해주세요.`,
      }));
      return;
    }

    const result = gradeSubmissionByTeacher(
      visibleExam.id,
      studentId,
      scoreNum,
      currentUser.name,
      inp.comment.trim() || undefined,
    );

    if (result.ok) {
      // 입력 폼 초기화 — Context 업데이트로 UI가 자동 반영됨
      setInputs((prev) => { const n = { ...prev }; delete n[studentId]; return n; });
      setErrors((prev) => { const n = { ...prev }; delete n[studentId]; return n; });
    } else {
      setErrors((prev) => ({ ...prev, [studentId]: result.reason ?? '저장에 실패했습니다.' }));
    }
  }

  return (
    <TeacherLayout title="채점">
      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#081F4D' }}>
            <ChevronLeft size={14} />
            시험 목록
          </div>
        </Link>

        {/* 시험 정보 헤더 (담당 학생 기준 counts) */}
        <div className="axis-card p-4">
          <div className="font-semibold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>{visibleExam.title}</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {visibleExam.subject} · {visibleExam.examDate} · 만점 {visibleExam.totalScore}점
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
            <span className="flex items-center gap-1">
              <AlertCircle
                size={11}
                style={{ color: ungradedSubs.length > 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.7 0.01 250)' }}
              />
              미채점 {ungradedSubs.length}명
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} style={{ color: 'oklch(0.5 0.15 160)' }} />
              채점완료 {gradedSubs.length}명
            </span>
          </div>
        </div>

        {/* 응시 데이터 없음 */}
        {mySubmissions.length === 0 && (
          <div className="axis-card p-8 text-center">
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              담당 학생 응시 데이터가 없습니다.
            </div>
          </div>
        )}

        {/* [Phase 3D v3-r7-r1] PC 최적화: 데스크톱에서는 채점 대기(메인, 넓게)와
            채점 완료(요약, 좁게)를 2컬럼으로 나란히 배치한다. */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5">
          <div className="lg:col-span-2">

        {/* ── 채점 대기 ── */}
        {ungradedSubs.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              채점 대기 ({ungradedSubs.length}명)
            </div>
            <div className="space-y-3">
              {ungradedSubs.map((sub) => {
                const student = assignedStudents.find((s) => s.id === sub.studentId);
                if (!student) return null;
                const inp = getInput(sub.studentId);
                const scoreNum = parseFloat(inp.score);
                const isValidScore =
                  !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= visibleExam.totalScore;
                const errMsg = errors[sub.studentId];
                return (
                  <div key={sub.studentId} className="axis-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: 'oklch(0.577 0.245 27.325)' }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                        {student.name}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
                          점수 <span style={{ color: 'oklch(0.6 0.015 250)' }}>(0~{visibleExam.totalScore}점)</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={visibleExam.totalScore}
                          value={inp.score}
                          onChange={(e) => updateInput(sub.studentId, { score: e.target.value })}
                          placeholder="점수 입력"
                          className="w-full text-sm rounded-md px-3 py-2 border"
                          style={{
                            borderColor: errMsg ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.9 0.008 250)',
                            color: 'oklch(0.2 0.02 250)',
                          }}
                        />
                        {errMsg && (
                          <div className="mt-0.5 text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>
                            {errMsg}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
                          코멘트 (선택)
                        </label>
                        <input
                          type="text"
                          value={inp.comment}
                          onChange={(e) => updateInput(sub.studentId, { comment: e.target.value })}
                          placeholder="간단한 피드백"
                          className="w-full text-sm rounded-md px-3 py-2 border"
                          style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                        />
                      </div>
                      <button
                        onClick={() => handleGrade(sub.studentId)}
                        disabled={!isValidScore}
                        className="w-full py-2 rounded-lg text-sm font-medium text-white"
                        style={{
                          background: isValidScore ? '#081F4D' : 'oklch(0.85 0.01 250)',
                          cursor: isValidScore ? 'pointer' : 'not-allowed',
                        }}
                      >
                        채점 저장
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

          </div>

          <div className="lg:col-span-1">

        {/* ── 채점 완료 (Context state 기반) ── */}
        {gradedSubs.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              채점 완료 ({gradedSubs.length}명)
            </div>
            <div className="space-y-2">
              {gradedSubs.map((sub) => {
                const student = assignedStudents.find((s) => s.id === sub.studentId);
                if (!student) return null;
                return (
                  <div key={sub.studentId} className="axis-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                          style={{ background: 'oklch(0.45 0.15 160)' }}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {student.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} style={{ color: 'oklch(0.45 0.15 160)' }} />
                        <span className="text-sm font-bold tabular-nums" style={{ color: 'oklch(0.3 0.02 250)' }}>
                          {sub.totalScore ?? '?'}/{visibleExam.totalScore}
                        </span>
                      </div>
                    </div>
                    {sub.teacherNote && (
                      <div className="mt-1.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        💬 {sub.teacherNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

          </div>
        </div>

      </div>
    </TeacherLayout>
  );
}
