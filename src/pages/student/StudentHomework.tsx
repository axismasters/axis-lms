// src/pages/student/StudentHomework.tsx
// AXIS LMS v1.2 — Homework Foundation v1
// 학생 — 수강 중인 반의 공개된(published) 숙제만 조회
// draft / 미수강 반 숙제는 절대 노출 안 됨

import { ClipboardList, CalendarClock } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useHomework } from '@/contexts/HomeworkContext';

export default function StudentHomework() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { getForStudent } = useHomework();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const enrolledClassIds: string[] =
    student?.classes.filter(c => c.status === '수강중').map(c => c.id) ?? [];

  // published + 수강 중인 반만 — draft는 getForStudent 내부에서 완전 차단
  const myHomework = getForStudent(enrolledClassIds)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)); // 마감일 오름차순

  const classNameOf = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? classId;

  const today = new Date().toISOString().slice(0, 10);

  function dueBadge(dueDate: string) {
    if (dueDate < today)
      return { label: '마감', bg: 'oklch(0.92 0.01 250)', fg: 'oklch(0.55 0.01 250)' };
    if (dueDate === today)
      return { label: '오늘 마감', bg: 'oklch(0.93 0.1 30)', fg: 'oklch(0.4 0.15 30)' };
    return { label: `D-${Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000)}`, bg: 'oklch(0.93 0.05 250)', fg: 'oklch(0.3 0.08 250)' };
  }

  return (
    <StudentLayout title="내 숙제">
      <div className="p-6 max-w-2xl mx-auto space-y-5">

        <div className="flex items-center gap-2">
          <ClipboardList size={20} style={{ color: 'oklch(0.45 0.1 250)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>
            내 숙제
          </h1>
        </div>

        {myHomework.length === 0 && (
          <div
            className="rounded-xl p-8 text-center text-sm"
            style={{ background: 'oklch(0.97 0.003 250)', color: 'oklch(0.6 0.01 250)' }}
          >
            배정된 숙제가 없습니다.
          </div>
        )}

        {myHomework.map(hw => {
          const badge = dueBadge(hw.dueDate);
          return (
            <div
              key={hw.id}
              className="rounded-2xl border p-5 space-y-2"
              style={{ borderColor: 'oklch(0.9 0.008 250)', background: '#fff' }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm flex-1" style={{ color: 'oklch(0.15 0.02 250)' }}>
                  {hw.title}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {badge.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.55 0.01 250)' }}>
                <CalendarClock size={12} />
                {classNameOf(hw.classId)} · 마감 {hw.dueDate}
              </div>

              {hw.description && (
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'oklch(0.35 0.015 250)' }}>
                  {hw.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </StudentLayout>
  );
}
