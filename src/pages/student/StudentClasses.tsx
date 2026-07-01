// AXIS LMS v1.2 - StudentClasses (Student Portal Foundation v1)
// 학생 전용 내 반/수업 조회 — 읽기 전용.

import { useState } from 'react';
import { BookOpen, Clock, Play, FileText, Link2, X } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useContent } from '@/contexts/ContentContext';
import type { ContentItem } from '@/lib/contentData';
import type { TimeSlot } from '@/lib/classData';

const DAY_ORDER = ['월', '화', '수', '목', '금', '토', '일'];

function formatSchedule(timeSlots: TimeSlot[]): string {
  if (timeSlots.length === 0) return '시간표 미정';
  const days = [...new Set(timeSlots.map(s => s.day))]
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .join('·');
  const first = timeSlots[0];
  return `${days} ${first.startTime}–${first.endTime}`;
}

function ContentDetailModal({
  item,
  className,
  onClose,
}: {
  item: ContentItem;
  className: string;
  onClose: () => void;
}) {
  const typeLabel: Record<string, string> = {
    note: '수업노트',
    video: '수업영상',
    material: '학습자료',
  };

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

        <div className="text-xs font-semibold" style={{ color: '#040D1E' }}>
          {typeLabel[item.type] ?? item.type}
        </div>
        <div className="pr-8 font-bold text-base leading-snug" style={{ color: 'oklch(0.2 0.02 250)' }}>
          {item.title}
        </div>
        <div className="text-xs space-y-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
          <div>반: {className}</div>
          <div>날짜: {item.date}</div>
        </div>

        {item.type === 'note' && item.content && (
          <div className="text-sm whitespace-pre-wrap rounded-lg p-3"
            style={{ background: 'oklch(0.97 0.004 250)', color: 'oklch(0.3 0.02 250)' }}>
            {item.content}
          </div>
        )}

        {item.homework && (
          <div className="text-xs rounded-lg p-3"
            style={{ background: 'oklch(0.96 0.04 160)', color: 'oklch(0.35 0.12 160)' }}>
            과제: {item.homework}
          </div>
        )}

        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: '#040D1E' }}>
            <Link2 size={14} /> 링크 열기
          </a>
        )}
      </div>
    </div>
  );
}

export default function StudentClasses() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { getVisibleForClass } = useContent();
  const [selectedItem, setSelectedItem] = useState<{ item: ContentItem; className: string } | null>(null);

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);

  // 현재 수강중인 반 (student.classes는 ClassInfo 배열)
  const enrolledNow = student?.classes.filter(c => c.status === '수강중') ?? [];
  const pastClasses = student?.classes.filter(c => c.status !== '수강중') ?? [];

  // ClassRoom 전체 데이터
  function getRoomData(classId: string) {
    return classes.find(c => c.id === classId);
  }

  return (
    <StudentLayout title="내 반">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 요약 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '수강중', value: enrolledNow.length, color: '#040D1E' },
            { label: '수강완료', value: pastClasses.length, color: 'oklch(0.55 0.015 250)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="axis-card p-3 text-center">
              <div className="font-bold text-xl tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 수강중 */}
        {enrolledNow.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              수강중
            </div>
            <div className="space-y-2">
              {enrolledNow.map(ci => {
                const room = getRoomData(ci.id);
                return (
                  <div key={ci.id} className="axis-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {ci.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {ci.subject}
                          {room?.level ? ` · ${room.level}` : ''}
                        </div>
                        {room && (
                          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                            <Clock size={11} />
                            {formatSchedule(room.timeSlots)}
                          </div>
                        )}
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                        style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}
                      >
                        수강중
                      </span>
                    </div>
                    {room?.room && (
                      <div className="mt-2 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        강의실 {room.room}
                      </div>
                    )}
                    {ci.teacher && (
                      <div className="mt-1 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        담당 강사 {ci.teacher}
                      </div>
                    )}
                    <div className="mt-1 text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>
                      수강 시작 {ci.startDate}
                    </div>

                    {/* 공개 수업자료 — studentVisible 이상 */}
                    {(() => {
                      const classContent = getVisibleForClass(ci.id, 'studentVisible');
                      if (classContent.length === 0) return null;
                      return (
                        <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
                          <div className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
                            수업자료 ({classContent.length})
                          </div>
                          {classContent.slice(0, 5).map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedItem({ item, className: ci.name })}
                              className="w-full flex items-start gap-2 text-xs text-left rounded-md px-2 py-1.5"
                              style={{ background: 'oklch(0.98 0.004 250)' }}
                            >
                              {item.type === 'note'
                                ? <FileText size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#040D1E' }} />
                                : <Play size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.45 0.15 160)' }} />
                              }
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate" style={{ color: 'oklch(0.3 0.02 250)' }}>
                                  {item.title}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>
                                  <span>{item.date}</span>
                                  {item.url && (
                                    <span className="inline-flex items-center gap-0.5"
                                      style={{ color: '#040D1E' }}>
                                      <Link2 size={10} /> 링크
                                    </span>
                                  )}
                                </div>
                                {item.type === 'note' && item.content && (
                                  <div className="mt-0.5 line-clamp-2" style={{ color: 'oklch(0.45 0.015 250)' }}>
                                    {item.content}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                          {classContent.length > 5 && (
                            <div className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>
                              외 {classContent.length - 5}건
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 이전 수강 내역 */}
        {pastClasses.length > 0 && (
          <section>
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              이전 수강
            </div>
            <div className="space-y-2">
              {pastClasses.map(ci => (
                <div key={ci.id} className="axis-card p-3 opacity-60 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>{ci.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>{ci.subject}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'oklch(0.95 0.005 250)', color: 'oklch(0.5 0.015 250)' }}>
                    {ci.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {enrolledNow.length === 0 && pastClasses.length === 0 && (
          <div className="axis-card p-10 text-center">
            <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>수강 중인 반이 없습니다.</div>
          </div>
        )}

      </div>
      {selectedItem && (
        <ContentDetailModal
          item={selectedItem.item}
          className={selectedItem.className}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </StudentLayout>
  );
}
