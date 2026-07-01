// AXIS LMS v1.2 - TeacherClasses (강사 포털 Foundation v1)
// 강사 전용 담당 반 목록 화면.

import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import type { TimeSlot } from '@/lib/classData';

function formatSchedule(timeSlots: TimeSlot[]): string {
  if (timeSlots.length === 0) return '미정';
  const days = [...new Set(timeSlots.map((s) => s.day))].join('·');
  const first = timeSlots[0];
  return `${days} ${first.startTime}–${first.endTime}`;
}

export default function TeacherClasses() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();

  const assignedClasses = classes.filter((c) => currentUser.assignedClassIds.includes(c.id));
  const activeClasses = assignedClasses.filter((c) => c.status === '운영중');
  const otherClasses = assignedClasses.filter((c) => c.status !== '운영중');

  return (
    <TeacherLayout title="담당 반">
      <div className="max-w-lg lg:max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* 요약 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '담당 반', value: assignedClasses.length, color: '#040D1E' },
            { label: '운영중',  value: activeClasses.length,   color: 'oklch(0.45 0.15 160)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="axis-card p-3 text-center">
              <div className="font-bold text-xl tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 운영중 반 */}
        {activeClasses.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>운영중</div>
            <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
              {activeClasses.map((cls) => (
                <Link key={cls.id} href={`/teacher/classes/${cls.id}`} style={{ display: 'block' }}>
                  <div className="axis-card axis-card-clickable p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-1" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {cls.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {cls.subject} · {cls.level}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          <Clock size={11} />
                          {formatSchedule(cls.timeSlots)}
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0 flex items-center gap-2">
                        <div>
                          <div className="font-bold tabular-nums text-sm" style={{ color: '#040D1E' }}>
                            {cls.enrolledCount}
                            <span className="text-xs font-normal" style={{ color: 'oklch(0.6 0.015 250)' }}>
                              /{cls.capacity}명
                            </span>
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>수강생</div>
                        </div>
                        <ChevronRight size={16} style={{ color: 'oklch(0.7 0.01 250)' }} />
                      </div>
                    </div>
                    {cls.room && (
                      <div className="mt-2 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        강의실 {cls.room}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 기타 반 */}
        {otherClasses.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>기타</div>
            <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
              {otherClasses.map((cls) => (
                <div key={cls.id} className="axis-card p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{cls.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        {cls.subject} · {cls.level}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'oklch(0.95 0.005 250)', color: 'oklch(0.5 0.015 250)' }}
                    >
                      {cls.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {assignedClasses.length === 0 && (
          <div className="axis-card p-10 text-center">
            <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>배정된 반이 없습니다</div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>반 배정은 관리자에게 문의하세요</div>
          </div>
        )}

      </div>
    </TeacherLayout>
  );
}
