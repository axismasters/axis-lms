// AXIS LMS v1.2 - TeacherHome
// 강사 전용 홈 화면: 오늘 수업 / 담당 학생 / 미채점 시험 / 수업 콘텐츠 카드.

import { BookOpen, Users, BarChart2, Play, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import type { ClassRoom } from '@/lib/classData';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const;

function useTodayClasses(assignedClassIds: string[]): ClassRoom[] {
  const { classes } = useClasses();
  const today = DAY_LABEL[new Date().getDay()];
  return classes.filter(
    (c) =>
      assignedClassIds.includes(c.id) &&
      c.timeSlots.some((s) => s.day === today)
  );
}

export default function TeacherHome() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const todayClasses = useTodayClasses(currentUser.assignedClassIds);

  const ungradedExams = exams.filter(
    (e) =>
      e.status === '채점중' &&
      (currentUser.assignedClassIds.includes(e.classId ?? '') || e.classId === null)
  );

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
            오늘 수업 {todayClasses.length}개 · 담당 학생 {currentUser.assignedStudentIds.length}명
          </div>
        </div>

        {/* 오늘 수업 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <BookOpen size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>오늘 수업</span>
          </div>
          {todayClasses.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              오늘 예정된 수업이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((cls) => {
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

        {/* 담당 학생 */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>담당 학생</span>
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
              {currentUser.assignedStudentIds.length}명
            </span>
          </div>
          <div className="axis-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: 'oklch(0.511 0.262 276.966)', fontSize: 16 }}>
                {currentUser.assignedStudentIds.length}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>
                  총 담당 학생
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  반 배정 기반 자동 산출
                </div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'oklch(0.7 0.01 250)' }} />
          </div>
        </section>

        {/* 미채점 시험 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <BarChart2 size={15} style={{ color: ungradedExams.length > 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>미채점 시험</span>
            {ungradedExams.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{ background: 'oklch(0.577 0.245 27.325)' }}>
                {ungradedExams.length}
              </span>
            )}
          </div>
          {ungradedExams.length === 0 ? (
            <div className="axis-card p-4 flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'oklch(0.5 0.15 160)' }} />
              <span className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>미채점 시험이 없습니다</span>
            </div>
          ) : (
            <div className="space-y-2">
              {ungradedExams.slice(0, 3).map((exam) => {
                const pendingCount = submissions.filter(
                  (s) => s.examId === exam.id && s.status === '채점중'
                ).length;
                return (
                  <div key={exam.id} className="axis-card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{exam.subject} · {exam.examDate}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={14} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
                      <span className="text-xs font-bold" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
                        {pendingCount}명 대기
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 수업 콘텐츠 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Play size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수업 콘텐츠</span>
          </div>
          <div className="axis-card p-4 text-center" style={{ color: 'oklch(0.6 0.015 250)' }}>
            <Play size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm">수업 영상/자료 업로드 기능은 다음 단계에서 구현됩니다</div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>콘텐츠 관리 엔진 v1 예정</div>
          </div>
        </section>

      </div>
    </TeacherLayout>
  );
}
