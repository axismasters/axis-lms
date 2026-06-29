// AXIS LMS v1.2 - TeacherExamGrading (QA Fix)
// 강사 전용 채점 상세 화면.
// - 담당 학생 submissions만 표시 (assignedStudentIds 기준)
// - Scope 강화: classId 있는 시험 → assignedClassIds 포함 여부 확인
//              classId 없는 학원 전체 시험 → 담당 학생 submission 1개 이상일 때만 허용
// - mock/local state 저장 후 "채점 대기" → "채점 완료" 섹션으로 즉시 이동 (UX 반영)
// - exam.status 내부값 노출 금지

import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';

interface LocalGrade {
  score: string;
  comment: string;
  saved: boolean;
}

/** 접근 불가/시험 없음 화면 */
function NotFoundScreen() {
  return (
    <TeacherLayout title="채점">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            시험 목록
          </div>
        </Link>
        <div className="axis-card p-10 text-center">
          <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>
            시험을 찾을 수 없습니다.
          </div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
            담당 범위에 없거나 응시 데이터가 없습니다.
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

export default function TeacherExamGrading() {
  const { examId } = useParams<{ examId: string }>();
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const { students } = useStudents();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  const [grades, setGrades] = useState<Record<string, LocalGrade>>({});

  // 1. Raw exam (ID만 매칭, 범위 미확인)
  const rawExam = examId ? exams.find((e) => e.id === examId) : undefined;

  // 2. 담당 학생의 이 시험 submissions (범위 확인용 + 채점용)
  const mySubmissions = submissions.filter(
    (s) => s.examId === examId && myStudentIds.has(s.studentId)
  );

  // 3. Scope 강화:
  //    - classId 있는 시험: assignedClassIds에 포함될 때만 허용
  //    - classId 없는 학원 전체 시험: 담당 학생 submission 1개 이상일 때만 허용
  const exam = (() => {
    if (!rawExam) return undefined;
    if (rawExam.classId) {
      return assignedClassIds.includes(rawExam.classId) ? rawExam : undefined;
    }
    // 학원 전체 시험: 담당 학생 submission이 있어야 함
    return mySubmissions.length > 0 ? rawExam : undefined;
  })();

  if (!exam) return <NotFoundScreen />;

  const assignedStudents = students.filter((s) => assignedStudentIds.includes(s.id));

  // 4. 실제 미채점 (채점중) — 로컬 저장된 것은 제외
  const ungradedSubs = mySubmissions.filter(
    (s) => s.status === '채점중' && !grades[s.studentId]?.saved
  );

  // 5. 로컬에서 방금 채점 저장한 제출 (원래 채점중이었던 것)
  const locallyGradedSubs = mySubmissions.filter(
    (s) => s.status === '채점중' && grades[s.studentId]?.saved
  );

  // 6. 실제 채점완료
  const realGradedSubs = mySubmissions.filter((s) => s.status === '채점완료');

  const pendingCount = ungradedSubs.length;
  const completedCount = realGradedSubs.length + locallyGradedSubs.length;

  function getGrade(studentId: string): LocalGrade {
    return grades[studentId] ?? { score: '', comment: '', saved: false };
  }

  function updateGrade(studentId: string, updates: Partial<LocalGrade>) {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...getGrade(studentId), ...updates, saved: false },
    }));
  }

  function saveGrade(studentId: string) {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...getGrade(studentId), saved: true },
    }));
  }

  return (
    <TeacherLayout title="채점">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            시험 목록
          </div>
        </Link>

        {/* 시험 정보 (담당 학생 기준 counts) */}
        <div className="axis-card p-4">
          <div className="font-semibold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {exam.subject} · {exam.examDate} · 만점 {exam.totalScore}점
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
            <span className="flex items-center gap-1">
              <AlertCircle size={11} style={{ color: pendingCount > 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.7 0.01 250)' }} />
              미채점 {pendingCount}명
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} style={{ color: 'oklch(0.5 0.15 160)' }} />
              채점완료 {completedCount}명
            </span>
          </div>
        </div>

        {/* 담당 학생 응시 데이터 없음 */}
        {mySubmissions.length === 0 && (
          <div className="axis-card p-8 text-center">
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              담당 학생 응시 데이터가 없습니다.
            </div>
          </div>
        )}

        {/* ── 채점 대기: 미채점이고 로컬 미저장인 학생 ── */}
        {ungradedSubs.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              채점 대기 ({ungradedSubs.length}명)
            </div>
            <div className="space-y-3">
              {ungradedSubs.map((sub) => {
                const student = assignedStudents.find((s) => s.id === sub.studentId);
                if (!student) return null;
                const g = getGrade(sub.studentId);
                const scoreNum = parseFloat(g.score);
                const isValidScore = !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= exam.totalScore;
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
                          점수 <span style={{ color: 'oklch(0.6 0.015 250)' }}>(0~{exam.totalScore}점)</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={exam.totalScore}
                          value={g.score}
                          onChange={(e) => updateGrade(sub.studentId, { score: e.target.value })}
                          placeholder="점수 입력"
                          className="w-full text-sm rounded-md px-3 py-2 border"
                          style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'oklch(0.5 0.015 250)' }}>코멘트 (선택)</label>
                        <input
                          type="text"
                          value={g.comment}
                          onChange={(e) => updateGrade(sub.studentId, { comment: e.target.value })}
                          placeholder="간단한 피드백"
                          className="w-full text-sm rounded-md px-3 py-2 border"
                          style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                        />
                      </div>
                      <button
                        onClick={() => saveGrade(sub.studentId)}
                        disabled={!isValidScore}
                        className="w-full py-2 rounded-lg text-sm font-medium text-white"
                        style={{
                          background: isValidScore ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.85 0.01 250)',
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

        {/* ── 채점 완료: local 저장됨 + 실제 채점완료 ── */}
        {(locallyGradedSubs.length > 0 || realGradedSubs.length > 0) && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              채점 완료 ({completedCount}명)
            </div>
            <div className="space-y-2">
              {/* 로컬에서 방금 저장한 항목 (mock 채점) */}
              {locallyGradedSubs.map((sub) => {
                const student = assignedStudents.find((s) => s.id === sub.studentId);
                if (!student) return null;
                const g = grades[sub.studentId];
                return (
                  <div key={sub.studentId} className="axis-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ background: 'oklch(0.45 0.15 160)' }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {student.name}
                        </span>
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'oklch(0.96 0.04 160)', color: 'oklch(0.35 0.12 160)' }}
                        >
                          저장됨
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} style={{ color: 'oklch(0.45 0.15 160)' }} />
                      <span className="text-sm font-bold tabular-nums" style={{ color: 'oklch(0.3 0.02 250)' }}>
                        {g?.score}/{exam.totalScore}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* 실제 채점완료 항목 */}
              {realGradedSubs.map((sub) => {
                const student = assignedStudents.find((s) => s.id === sub.studentId);
                if (!student) return null;
                return (
                  <div key={sub.studentId} className="axis-card p-3 flex items-center justify-between">
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
                        {sub.totalScore ?? '?'}/{exam.totalScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </TeacherLayout>
  );
}
