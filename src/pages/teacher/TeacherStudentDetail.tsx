// AXIS LMS v1.2 - TeacherStudentDetail (Workflow Foundation v1)
// 강사 전용 담당 학생 상세 화면 (읽기 전용).
// - 담당 학생만 조회 가능 (assignedStudentIds 기준)
// - 보호자/재무/권한 정보 노출 금지
// - 상담관리 독립 기능 없음

import { useParams, Link } from 'wouter';
import { ChevronLeft, BarChart2, CalendarCheck, FileText } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAttendance } from '@/contexts/AttendanceContext';

export default function TeacherStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();
  const { sessions } = useAttendance();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  const notAllowed = (
    <TeacherLayout title="학생 상세">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Link href="/teacher/students">
          <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            담당 학생 목록
          </div>
        </Link>
        <div className="axis-card p-10 text-center">
          <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>접근 권한이 없습니다.</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 학생만 조회할 수 있습니다.</div>
        </div>
      </div>
    </TeacherLayout>
  );

  if (!studentId || !myStudentIds.has(studentId)) return notAllowed;

  const student = students.find((s) => s.id === studentId);
  if (!student) return notAllowed;

  // 담당 반에 속한 수업만 표시
  const myClasses = student.classes.filter(
    (c) => assignedClassIds.includes(c.id) && c.status === '수강중'
  );

  // 담당 범위 시험 ID 집합
  const myExamIds = new Set(
    exams
      .filter((e) => assignedClassIds.includes(e.classId ?? '') || !e.classId)
      .map((e) => e.id)
  );

  // 이 학생의 채점완료 submissions (담당 시험 기준, 최근 3건)
  const studentSubs = submissions
    .filter((s) => s.studentId === studentId && myExamIds.has(s.examId) && s.status === '채점완료')
    .sort((a, b) => {
      const ea = exams.find((e) => e.id === a.examId);
      const eb = exams.find((e) => e.id === b.examId);
      return (eb?.examDate ?? '').localeCompare(ea?.examDate ?? '');
    })
    .slice(0, 3);

  // 출결 요약 (담당 반 세션, 최근 10건)
  const attendanceRecords = sessions
    .filter((sess) => assignedClassIds.includes(sess.classId))
    .flatMap((sess) => sess.records.filter((r) => r.studentId === studentId))
    .slice(-10)
    .reverse();

  const presentCount = attendanceRecords.filter(
    (r) => r.status === '출석' || r.status === '보강출석'
  ).length;
  const absentCount = attendanceRecords.filter((r) => r.status === '결석').length;
  const lateCount = attendanceRecords.filter(
    (r) => r.status === '지각' || r.status === '조퇴'
  ).length;

  return (
    <TeacherLayout title="학생 상세">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/teacher/students">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            담당 학생 목록
          </div>
        </Link>

        {/* 기본 정보 */}
        <div className="axis-card p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
            style={{ background: 'oklch(0.511 0.262 276.966)' }}
          >
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{student.phone}</div>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: student.status === '재원' ? 'oklch(0.94 0.08 160)' : 'oklch(0.95 0.005 250)',
              color: student.status === '재원' ? 'oklch(0.35 0.12 160)' : 'oklch(0.5 0.015 250)',
            }}
          >
            {student.status}
          </span>
        </div>

        {/* 담당 수업 */}
        <section>
          <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
            담당 수업
          </div>
          {myClasses.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              현재 수강 중인 담당 반이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {myClasses.map((cls) => (
                <div key={cls.id} className="axis-card p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{cls.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{cls.subject}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                    수강중
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 출결 요약 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <CalendarCheck size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
              출결 요약 (최근 10건)
            </span>
          </div>
          {attendanceRecords.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              출결 기록이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '출석',     value: presentCount, color: 'oklch(0.45 0.15 160)' },
                { label: '지각/조퇴', value: lateCount,    color: 'oklch(0.55 0.15 80)' },
                { label: '결석',     value: absentCount,  color: 'oklch(0.55 0.2 27)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-lg tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 최근 성적 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <BarChart2 size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>최근 성적</span>
          </div>
          {studentSubs.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              성적 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {studentSubs.map((sub) => {
                const exam = exams.find((e) => e.id === sub.examId);
                if (!exam) return null;
                const score = sub.totalScore ?? 0;
                const pct = exam.totalScore > 0 ? Math.round((score / exam.totalScore) * 100) : 0;
                return (
                  <div key={sub.id} className="axis-card p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        {exam.subject} · {exam.examDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold tabular-nums text-sm"
                        style={{
                          color:
                            pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.55 0.2 27)',
                        }}
                      >
                        {score}/{exam.totalScore}
                      </div>
                      <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 수업노트 바로가기 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <FileText size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>수업노트</span>
          </div>
          <div className="axis-card p-4 text-center">
            <Link href="/teacher/notes">
              <span className="text-sm cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                수업노트 작성/확인하기 →
              </span>
            </Link>
          </div>
        </section>

      </div>
    </TeacherLayout>
  );
}
