// AXIS LMS v1.2 - ParentHome (Parent Portal Foundation v1)
// 보호자 전용 홈: 자녀 선택 / 수강 반 요약 / 출결 요약 / 공개 성적 / 수납 상태.
// ✅ 성적: getPublishedResultsForStudent 정책 준수 (결석/미채점/미공개 제외)
// ✅ 출결: 자녀 소속 반 세션만 필터링
// 🚫 라이벌/엠블럼/경쟁 정보 노출 금지
// 🚫 상담관리 독립 메뉴 없음

import { useState } from 'react';
import { Link } from 'wouter';
import { CalendarCheck, BarChart2, CreditCard, ChevronDown, BookOpen, ChevronRight, Play, FileText, Link2, X, ClipboardList, CalendarClock, CheckCircle2 } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useContent } from '@/contexts/ContentContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import type { ContentItem } from '@/lib/contentData';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
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

        <div className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.15 160)' }}>
          {typeLabel[item.type] ?? item.type} · 학부모 공개
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
            style={{ color: 'oklch(0.45 0.15 160)' }}>
            <Link2 size={14} /> 링크 열기
          </a>
        )}
      </div>
    </div>
  );
}

export default function ParentHome() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { sessions } = useAttendance();
  const { exams, submissions } = useAssessment();
  const { getVisibleForClass } = useContent();
  const { getForStudent } = useHomework();
  const { getStatus } = useHomeworkStatus();

  // 연결된 자녀 목록 (assignedStudentIds 기준)
  const myChildren = students.filter((s) =>
    (currentUser.assignedStudentIds ?? []).includes(s.id)
  );

  const [selectedChildId, setSelectedChildId] = useState<string>(
    myChildren[0]?.id ?? ''
  );
  const [selectedItem, setSelectedItem] = useState<{ item: ContentItem; className: string } | null>(null);
  const child = myChildren.find((s) => s.id === selectedChildId);

  // 자녀 소속 반 (수강중만)
  const childActiveClasses = (child?.classes ?? [])
    .filter(c => c.status === '수강중')
    .map(ci => ({ ...ci, room: classes.find(r => r.id === ci.id) }));

  // 자녀 출결: 소속 반 세션만 스코프
  const childClassIds = new Set((child?.classes ?? []).map(c => c.id));
  const childRecords = sessions
    .filter(sess => childClassIds.has(sess.classId))
    .flatMap(sess => sess.records.filter(r => r.studentId === selectedChildId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const presentCount = childRecords.filter(r => r.status === '출석' || r.status === '보강출석').length;
  const lateCount = childRecords.filter(r => r.status === '지각' || r.status === '조퇴').length;
  const absentCount = childRecords.filter(r => r.status === '결석').length;

  // 자녀 성적: visibility 정책 준수 (공개/반영 결과만)
  const publishedResults = selectedChildId
    ? getPublishedResultsForStudent(exams, submissions, selectedChildId).slice(0, 2)
    : [];

  // 자녀 학부모 공개 콘텐츠 — parentVisible만 표시 (studentVisible 제외)
  const parentContent = childActiveClasses
    .flatMap(ci =>
      getVisibleForClass(ci.id, 'parentVisible').map(item => ({
        ...item,
        className: ci.name,
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // 자녀 숙제: 학부모는 조회만 가능, 완료 처리/제출/채점 없음
  const childEnrolledClassIds = childActiveClasses.map(ci => ci.id);
  const childHomework = selectedChildId ? getForStudent(childEnrolledClassIds) : [];
  const incompleteHomework = childHomework.filter(hw => {
    const status = getStatus(hw.id, selectedChildId);
    return status?.status !== 'completed';
  });
  const upcomingHomework = [...incompleteHomework]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);
  const classNameOf = (classId: string) => (
    childActiveClasses.find(c => c.id === classId)?.name
    ?? classes.find(c => c.id === classId)?.name
    ?? classId
  );
  const dueBadge = (dueDate: string) => {
    if (dueDate < today) return { label: '마감', color: 'oklch(0.55 0.015 250)' };
    if (dueDate === today) return { label: '오늘 마감', color: 'oklch(0.577 0.245 27.325)' };
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
    return { label: `D-${diff}`, color: 'oklch(0.511 0.262 276.966)' };
  };
  const homeworkStatusLabel = (homeworkId: string) => {
    const status = getStatus(homeworkId, selectedChildId)?.status ?? 'assigned';
    if (status === 'completed') return { label: '완료', color: 'oklch(0.45 0.15 160)' };
    if (status === 'seen') return { label: '확인함', color: 'oklch(0.511 0.262 276.966)' };
    return { label: '미확인', color: 'oklch(0.55 0.015 250)' };
  };

  return (
    <ParentLayout title="AXIS 학부모">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        <div className="axis-card p-4">
          <div className="text-xs mb-2 font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>자녀 선택</div>
          {myChildren.length === 0 ? (
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              연결된 자녀 정보가 없습니다. 학원에 문의해주세요.
            </div>
          ) : myChildren.length === 1 ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base"
                style={{ background: 'oklch(0.45 0.15 160)' }}
              >
                {child?.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{child?.name}</div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{child?.status}</div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 appearance-none"
                style={{ border: '1px solid oklch(0.9 0.008 250)', background: 'white', color: 'oklch(0.2 0.02 250)' }}
              >
                {myChildren.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'oklch(0.5 0.015 250)' }} />
            </div>
          )}
        </div>

        {child && (
          <>
            {/* 수강 반 */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <BookOpen size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수강 반</span>
              </div>
              {childActiveClasses.length === 0 ? (
                <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  현재 수강 중인 반이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {childActiveClasses.map(ci => (
                    <div key={ci.id} className="axis-card p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{ci.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {ci.subject}{ci.teacher ? ` · ${ci.teacher}` : ''}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                        수강중
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 출결 요약 */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>출결 요약</span>
                  <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>최근 {childRecords.length}건</span>
                </div>
                <Link href="/parent/attendance">
                  <div className="flex items-center gap-0.5 text-xs cursor-pointer" style={{ color: 'oklch(0.45 0.15 160)' }}>
                    전체 보기 <ChevronRight size={12} />
                  </div>
                </Link>
              </div>
              {childRecords.length === 0 ? (
                <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  출결 기록이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '출석',     value: presentCount, color: 'oklch(0.45 0.15 160)' },
                    { label: '지각/조퇴', value: lateCount,    color: 'oklch(0.6 0.15 80)' },
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

            {/* 성적 요약 (공개 결과만) */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <BarChart2 size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 성적</span>
                </div>
                <Link href="/parent/grades">
                  <div className="flex items-center gap-0.5 text-xs cursor-pointer" style={{ color: 'oklch(0.45 0.15 160)' }}>
                    전체 보기 <ChevronRight size={12} />
                  </div>
                </Link>
              </div>
              {publishedResults.length === 0 ? (
                <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  공개된 성적이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {publishedResults.map(r => {
                    const pct = r.totalPoints > 0 ? Math.round(r.earnedScore / r.totalPoints * 100) : 0;
                    return (
                      <div key={r.examId} className="axis-card p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{r.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{r.examDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold tabular-nums text-sm" style={{ color: scoreColor(pct) }}>
                            {r.earnedScore}/{r.totalPoints}
                          </div>
                          <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 숙제 현황 (조회 전용) */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>숙제 현황</span>
                  {incompleteHomework.length > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                      style={{ background: 'oklch(0.577 0.245 27.325)' }}
                    >
                      {incompleteHomework.length}
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>조회 전용</span>
              </div>

              {childHomework.length === 0 ? (
                <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  배정된 숙제가 없습니다.
                </div>
              ) : incompleteHomework.length === 0 ? (
                <div className="axis-card p-4 flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: 'oklch(0.45 0.15 160)' }} />
                  <span className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>미완료 숙제가 없습니다.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingHomework.map(hw => {
                    const due = dueBadge(hw.dueDate);
                    const status = homeworkStatusLabel(hw.id);
                    return (
                      <div key={hw.id} className="axis-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>
                              {hw.title}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                              <CalendarClock size={11} />
                              {classNameOf(hw.classId)} · {hw.dueDate}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'oklch(0.95 0.005 250)', color: due.color }}
                            >
                              {due.label}
                            </span>
                            <span className="text-xs" style={{ color: status.color }}>{status.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 공개 수업자료 (parentVisible) */}
            {parentContent.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <FileText size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>공개 수업자료</span>
                  <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{parentContent.length}건</span>
                </div>
                <div className="space-y-2">
                  {parentContent.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem({ item, className: item.className })}
                      className="axis-card p-3 flex items-start gap-3 w-full text-left"
                    >
                      {item.type === 'note'
                        ? <FileText size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                        : <Play size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.45 0.15 160)' }} />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>
                          {item.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {item.className} · {item.date}
                        </div>
                        {item.type === 'note' && item.content && (
                          <div className="text-xs mt-1 line-clamp-2" style={{ color: 'oklch(0.45 0.015 250)' }}>
                            {item.content}
                          </div>
                        )}
                        {item.url && (
                          <span
                            className="inline-flex items-center gap-1 mt-1 text-xs"
                            style={{ color: 'oklch(0.45 0.15 160)' }}>
                            <Link2 size={11} /> 링크 열기
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 수납 상태 요약 (placeholder) */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CreditCard size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수납 상태</span>
              </div>
              <Link href="/parent/finance">
                <div className="axis-card p-4 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>이번 달 수강료</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                      수납 탭에서 상세 내역을 확인하세요
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                      완납
                    </span>
                    <ChevronRight size={14} style={{ color: 'oklch(0.7 0.01 250)' }} />
                  </div>
                </div>
              </Link>
            </section>
          </>
        )}

      </div>
      {selectedItem && (
        <ContentDetailModal
          item={selectedItem.item}
          className={selectedItem.className}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </ParentLayout>
  );
}
