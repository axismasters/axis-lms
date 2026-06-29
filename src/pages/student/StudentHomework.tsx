// src/pages/student/StudentHomework.tsx
// AXIS LMS v1.2 — Homework Foundation v1
// 학생 — 수강 중인 반의 공개된(published) 숙제만 조회
// draft / 미수강 반 숙제는 절대 노출 안 됨

import { useEffect, useState } from 'react';
import { ClipboardList, CalendarClock, CheckCircle2, Circle, Eye, X } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';
import type { Homework } from '@/lib/homeworkData';
import type { HomeworkStatusValue } from '@/lib/homeworkStatusData';

export default function StudentHomework() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { getForStudent } = useHomework();
  const { getStatus, setStatus } = useHomeworkStatus();
  const [detailHomework, setDetailHomework] = useState<Homework | null>(null);

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);
  const enrolledClassIds: string[] =
    student?.classes.filter(c => c.status === '수강중').map(c => c.id) ?? [];

  // published + 수강 중인 반만 — draft는 getForStudent 내부에서 완전 차단
  const myHomework = getForStudent(enrolledClassIds)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)); // 마감일 오름차순

  useEffect(() => {
    if (!myStudentId) return;
    myHomework.forEach(hw => {
      const status = getStatus(hw.id, myStudentId);
      if (!status || status.status === 'assigned') {
        setStatus(hw.id, myStudentId, 'seen');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStudentId, myHomework.map(hw => hw.id).join(',')]);

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

  const statusConfig: Record<HomeworkStatusValue, { label: string; color: string }> = {
    assigned:  { label: '미확인', color: 'oklch(0.65 0.01 250)' },
    seen:      { label: '확인함', color: 'oklch(0.5 0.1 250)' },
    completed: { label: '완료',   color: 'oklch(0.45 0.15 145)' },
  };

  function renderStatusIcon(statusValue: HomeworkStatusValue, size: number) {
    if (statusValue === 'completed') return <CheckCircle2 size={size} />;
    if (statusValue === 'seen') return <Eye size={size} />;
    return <Circle size={size} />;
  }

  function HomeworkDetailModal({
    hw,
    onClose,
  }: {
    hw: Homework;
    onClose: () => void;
  }) {
    const status = myStudentId ? getStatus(hw.id, myStudentId) : null;
    const statusValue: HomeworkStatusValue = status?.status ?? 'assigned';
    const { label: statusLabel, color: statusColor } = statusConfig[statusValue];
    const isCompleted = statusValue === 'completed';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15, 23, 42, 0.48)' }}
        onClick={onClose}
      >
        <div
          className="axis-card w-full max-w-md p-5 relative space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full"
            style={{ color: 'oklch(0.55 0.015 250)' }}
            aria-label="닫기"
          >
            <X size={18} />
          </button>

          <div className="pr-8 font-bold text-base leading-snug" style={{ color: 'oklch(0.2 0.02 250)' }}>
            {hw.title}
          </div>
          <div className="text-xs space-y-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
            <div>반: {classNameOf(hw.classId)}</div>
            <div>마감일: {hw.dueDate}</div>
          </div>

          {hw.description && (
            <div className="text-sm whitespace-pre-wrap rounded-lg p-3"
              style={{ background: 'oklch(0.97 0.004 250)', color: 'oklch(0.3 0.02 250)' }}>
              {hw.description}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5" style={{ color: statusColor }}>
              {renderStatusIcon(statusValue, 15)}
              <span className="text-sm font-medium">{statusLabel}</span>
              {status?.completedAt && (
                <span className="text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>
                  · {status.completedAt.slice(0, 10)}
                </span>
              )}
            </div>

            {!isCompleted && myStudentId && (
              <button
                onClick={() => setStatus(hw.id, myStudentId, 'completed')}
                className="text-sm px-4 py-2 rounded-lg font-semibold border"
                style={{
                  borderColor: 'oklch(0.85 0.06 145)',
                  color: 'oklch(0.35 0.1 145)',
                  background: 'oklch(0.97 0.015 145)',
                }}
              >
                완료로 표시
              </button>
            )}
          </div>
        </div>
      </div>
    );
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
          const status = myStudentId ? getStatus(hw.id, myStudentId) : null;
          const statusValue: HomeworkStatusValue = status?.status ?? 'assigned';
          const { label: statusLabel, color: statusColor } = statusConfig[statusValue];
          const isCompleted = statusValue === 'completed';
          return (
            <div
              key={hw.id}
              className="rounded-2xl border p-5 space-y-3"
              style={{
                borderColor: isCompleted ? 'oklch(0.88 0.06 145)' : 'oklch(0.9 0.008 250)',
                background: isCompleted ? 'oklch(0.98 0.01 145)' : '#fff',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="font-semibold text-sm flex-1"
                  style={{
                    color: isCompleted ? 'oklch(0.4 0.08 145)' : 'oklch(0.15 0.02 250)',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    opacity: isCompleted ? 0.75 : 1,
                  }}
                >
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

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5" style={{ color: statusColor }}>
                  {renderStatusIcon(statusValue, 14)}
                  <span className="text-xs font-medium">{statusLabel}</span>
                  {status?.completedAt && (
                    <span className="text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>
                      · {status.completedAt.slice(0, 10)}
                    </span>
                  )}
                </div>

                {!isCompleted && myStudentId && (
                  <button
                    onClick={() => setStatus(hw.id, myStudentId, 'completed')}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium border"
                    style={{
                      borderColor: 'oklch(0.85 0.06 145)',
                      color: 'oklch(0.35 0.1 145)',
                      background: 'oklch(0.97 0.015 145)',
                    }}
                  >
                    완료로 표시
                  </button>
                )}
              </div>

              <button
                onClick={() => setDetailHomework(hw)}
                className="text-xs px-3 py-1.5 rounded-lg border"
                style={{
                  borderColor: 'oklch(0.88 0.008 250)',
                  color: 'oklch(0.45 0.01 250)',
                }}
              >
                상세 보기
              </button>
            </div>
          );
        })}
      </div>
      {detailHomework && (
        <HomeworkDetailModal
          hw={detailHomework}
          onClose={() => setDetailHomework(null)}
        />
      )}
    </StudentLayout>
  );
}
