// AXIS LMS v1.2 - TeacherHome (Workflow Foundation v1)
// 강사 전용 홈: 인사 / 빠른 실행 / 오늘 수업 / 미채점 시험 / 최근 성적.
// 모든 시험/성적/통계는 담당 학생(assignedStudentIds) 기준으로만 계산.

import { Link } from 'wouter';
import {
  CalendarCheck, BarChart2, Users, Play, FileText,
  Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';
import type { ClassRoom } from '@/lib/classData';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const;

function useTodayClasses(assignedClassIds: string[]): ClassRoom[] {
  const { classes } = useClasses();
  const today = DAY_LABEL[new Date().getDay()];
  return classes.filter(
    (c) => assignedClassIds.includes(c.id) && c.timeSlots.some((s) => s.day === today)
  );
}

const QUICK_ACTIONS = [
  { icon: CalendarCheck, label: '출결 체크', path: '/teacher/attendance', color: 'oklch(0.45 0.15 160)' },
  { icon: BarChart2,     label: '시험 채점', path: '/teacher/exams',      color: 'oklch(0.577 0.245 27.325)' },
  { icon: Users,         label: '담당 학생', path: '/teacher/students',   color: 'oklch(0.511 0.262 276.966)' },
  { icon: FileText,      label: '수업노트',  path: '/teacher/notes',      color: 'oklch(0.511 0.262 276.966)' },
  { icon: Play,          label: '수업자료',  path: '/teacher/videos',     color: 'oklch(0.511 0.262 276.966)' },
];

export default function TeacherHome() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  // 담당 학생의 submissions만 사용
  const mySubmissions = submissions.filter((s) => myStudentIds.has(s.studentId));

  const todayClasses = useTodayClasses(assignedClassIds);
  const assignedClasses = classes.filter((c) => assignedClassIds.includes(c.id));
  const assignedStudents = students.filter((s) => assignedStudentIds.includes(s.id));

  // 담당 반 시험 또는 학원 전체 시험 후보
  const candidateExams = exams.filter(
    (e) => assignedClassIds.includes(e.classId ?? '') || !e.classId
  );

  // 미채점 시험: 담당 학생 submissions에 채점중 항목이 있는 시험
  const ungradedExams = candidateExams.filter((e) =>
    mySubmissions.some((s) => s.examId === e.id && s.status === '채점중')
  );

  // 최근 성적: 담당 학생이 채점완료된 시험 최근 2건
  const recentGradedExams = candidateExams
    .filter((e) => mySubmissions.some((s) => s.examId === e.id && s.status === '채점완료'))
    .sort((a, b) => b.examDate.localeCompare(a.examDate))
    .slice(0, 2);

  return (
    <TeacherLayout title="AXIS 강사">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 인사 */}
        <div className="axis-card p-4">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
          <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>
            안녕하세요, {currentUser.name} 선생님 👋
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>
            오늘 수업 {todayClasses.length}개 · 담당 반 {assignedClasses.length}개 · 담당 학생 {assignedStudents.length}명
          </div>
        </div>

        {/* 빠른 실행 */}
        <section>
          <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>빠른 실행</div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.slice(0, 3).map(({ icon: Icon, label, path, color }) => (
              <Link key={path} href={path} style={{ display: 'block' }}>
                <div className="axis-card p-3 flex flex-col items-center gap-1.5 cursor-pointer">
                  <Icon size={20} style={{ color }} />
                  <span className="text-xs font-medium text-center" style={{ color: 'oklch(0.3 0.02 250)' }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {QUICK_ACTIONS.slice(3).map(({ icon: Icon, label, path, color }) => (
              <Link key={path} href={path} style={{ display: 'block' }}>
                <div className="axis-card p-3 flex flex-col items-center gap-1.5 cursor-pointer">
                  <Icon size={20} style={{ color }} />
                  <span className="text-xs font-medium text-center" style={{ color: 'oklch(0.3 0.02 250)' }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 오늘 수업 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Clock size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>오늘 수업</span>
          </div>
          {todayClasses.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              오늘 예정된 수업이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {todayClasses.slice(0, 2).map((cls) => {
                const today = DAY_LABEL[new Date().getDay()];
                const todaySlots = cls.timeSlots.filter((s) => s.day === today);
                return (
                  <div key={cls.id} className="axis-card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                        {cls.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        <Clock size={11} />
                        {todaySlots.map((s) => `${s.startTime}–${s.endTime}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: 'oklch(0.94 0.06 250)', color: 'oklch(0.4 0.15 250)' }}>
                      {cls.enrolledCount}명
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 미채점 시험 — 담당 학생 기준 */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <BarChart2
                size={15}
                style={{ color: ungradedExams.length > 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.511 0.262 276.966)' }}
              />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>미채점 시험</span>
              {ungradedExams.length > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: 'oklch(0.577 0.245 27.325)' }}
                >
                  {ungradedExams.length}
                </span>
              )}
            </div>
            <Link href="/teacher/exams">
              <span className="text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>채점하기</span>
            </Link>
          </div>
          {ungradedExams.length === 0 ? (
            <div className="axis-card p-4 flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'oklch(0.5 0.15 160)' }} />
              <span className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>채점할 시험이 없습니다</span>
            </div>
          ) : (
            <div className="space-y-2">
              {ungradedExams.slice(0, 1).map((exam) => {
                const pendingCount = mySubmissions.filter(
                  (s) => s.examId === exam.id && s.status === '채점중'
                ).length;
                return (
                  <Link key={exam.id} href={`/teacher/exams/${exam.id}/grading`} style={{ display: 'block' }}>
                    <div className="axis-card p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {exam.subject} · {exam.examDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={14} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
                        <span className="text-xs font-bold" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
                          {pendingCount}명 대기
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {ungradedExams.length > 1 && (
                <Link href="/teacher/exams">
                  <div className="text-center text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                    외 {ungradedExams.length - 1}건 더 보기
                  </div>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* 최근 성적 — 담당 학생 기준 */}
        {recentGradedExams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <BarChart2 size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 성적</span>
              </div>
              <Link href="/teacher/grades">
                <span className="text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>성적 보기</span>
              </Link>
            </div>
            <div className="space-y-2">
              {recentGradedExams.map((exam) => {
                const examSubs = mySubmissions.filter(
                  (s) => s.examId === exam.id && s.status === '채점완료'
                );
                const avg =
                  examSubs.length > 0
                    ? Math.round(
                        examSubs.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / examSubs.length
                      )
                    : null;
                return (
                  <div key={exam.id} className="axis-card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        {exam.subject} · {exam.examDate} · 담당 학생 {examSubs.length}명
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="text-right">
                        <div className="font-bold tabular-nums text-sm" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                          {avg}점
                        </div>
                        <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 평균</div>
                      </div>
                    )}
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
