// AXIS LMS v1.2 - TeacherGrades (Scope Guard Fix)
// 강사 전용 담당 학생 테스트 결과 확인 화면.
// - 평균/최고점/최저점/응시자 수 모두 담당 학생(assignedStudentIds) submissions 기준
// - 담당 학생 데이터가 없는 시험은 목록에서 제외

import { BarChart2 } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';
import { TEACHER_CREATABLE_EXAM_CATEGORY_IDS, isGradedSubmission } from '@/lib/assessmentData';

export default function TeacherGrades() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const { students } = useStudents();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  // 담당 학생의 submissions만 사용
  const mySubmissions = submissions.filter((s) => myStudentIds.has(s.studentId));

  // 성적 확인 가능한 시험:
  //   - 담당 반 시험 or 학원 전체 시험
  //   - 담당 학생 중 채점완료 submissions가 있어야 표시
  //   - [교사 화면 시험 구조 정리] 입학테스트/인증평가/수능실전모의고사(성적 입력 자료로
  //     재분류)는 이 목록에서 제외한다 — 단원평가/내신대비모의고사만 대상.
  const gradedExams = exams
    .filter(
      (e) =>
        (TEACHER_CREATABLE_EXAM_CATEGORY_IDS as readonly string[]).includes(e.categoryId) &&
        (assignedClassIds.includes(e.classId ?? '') || !e.classId) &&
        mySubmissions.some((s) => s.examId === e.id && isGradedSubmission(s))
    )
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  // 바 차트용 담당 학생 목록
  const assignedStudents = students.filter((s) => assignedStudentIds.includes(s.id));

  return (
    <TeacherLayout title="학생별 성적">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {gradedExams.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <BarChart2 size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>표시할 테스트 결과 데이터가 없습니다.</div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>
              담당 학생의 채점이 완료되면 여기에 표시됩니다.
            </div>
          </div>
        ) : (
          gradedExams.map((exam) => {
            // 담당 학생 기준 채점완료 submissions
            const examSubs = mySubmissions.filter(
              (s) => s.examId === exam.id && isGradedSubmission(s)
            );
            const scores = examSubs.map((s) => s.totalScore ?? 0);
            const stats =
              scores.length > 0
                ? {
                    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
                    max: Math.max(...scores),
                    min: Math.min(...scores),
                  }
                : null;

            return (
              <div key={exam.id} className="axis-card p-4">
                {/* 시험 헤더 */}
                <div className="mb-3">
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                    {exam.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    {exam.subject} · {exam.examDate} · 만점 {exam.totalScore}점 · 담당 학생 {examSubs.length}명
                  </div>
                </div>

                {/* 담당 학생 기준 통계 */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: '담당 평균', value: stats.avg, color: '#081F4D' },
                      { label: '최고점',   value: stats.max, color: 'oklch(0.45 0.15 160)' },
                      { label: '최저점',   value: stats.min, color: 'oklch(0.55 0.2 27)' },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="rounded-lg p-2 text-center"
                        style={{ background: 'oklch(0.97 0.004 250)' }}
                      >
                        <div className="font-bold tabular-nums text-sm" style={{ color }}>{value}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 담당 학생별 점수 바 */}
                <div className="space-y-1.5">
                  {assignedStudents.map((student) => {
                    const sub = examSubs.find((s) => s.studentId === student.id);
                    if (!sub) return null;
                    const score = sub.totalScore ?? 0;
                    const pct = exam.totalScore > 0 ? Math.round((score / exam.totalScore) * 100) : 0;
                    return (
                      <div key={student.id} className="flex items-center gap-2">
                        <div className="text-xs w-14 truncate" style={{ color: 'oklch(0.35 0.02 250)' }}>
                          {student.name}
                        </div>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ background: 'oklch(0.93 0.006 250)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct >= 80
                                  ? 'oklch(0.45 0.15 160)'
                                  : pct >= 60
                                  ? '#081F4D'
                                  : 'oklch(0.55 0.2 27)',
                            }}
                          />
                        </div>
                        <div
                          className="text-xs font-bold tabular-nums w-14 text-right"
                          style={{ color: 'oklch(0.3 0.02 250)' }}
                        >
                          {score}/{exam.totalScore}
                        </div>
                      </div>
                    );
                  })}
                  {examSubs.length > 0 &&
                    assignedStudents.every((s) => !examSubs.find((sub) => sub.studentId === s.id)) && (
                      <div className="text-xs text-center py-2" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        담당 학생 응시 데이터가 없습니다.
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}

      </div>
    </TeacherLayout>
  );
}
