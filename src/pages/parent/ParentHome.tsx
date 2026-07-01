// AXIS LMS v1.2 - ParentHome (Parent Finance Home Bridge v1 → Phase 3D v3-r2 개편)
// 보호자 전용 홈: 자녀 선택 / 수강 반 요약 / 출결 요약 / 공개 테스트 결과 / 성장 리포트 진입 / 수납 상태.
//
// ⚠ 학부모 페이지 헌법 (docs/PARENT_PAGE_CONSTITUTION.md 참조):
//   1. 학부모 페이지는 "확인 화면"이 아니라 "자녀 성장을 계속 들여다보고 싶은 화면"이다.
//   2. 중심은 납부 확인이 아니라 자녀 성장 확인이다 — 수납은 보조 정보로 낮춘다.
//   3. 클릭 가능한 카드/요약/상세 진입 요소는 버튼/카드 버튼처럼 명확히 보이게 만든다.
//   4. 학부모는 확인자다 — 입력/수정 기능은 어떤 화면에도 넣지 않는다.
//   5. 상담 기록 원문은 학부모에게 노출하지 않는다(내부 기록용, 공개 코멘트는 선생님이 별도 작성).
//   6. 학생용 게임형 지표는 학부모 화면에 노출하지 않는다 — 대신 테스트 변화·출결 흐름·
//      대학추천·학습 리포트 중심의 "성장 리포트"로 보여준다(자세한 내용은
//      /parent/growth = ParentGrowthReport.tsx 참조).
//
// ✅ 테스트: getPublishedResultsForStudent 정책 준수 (결석/미채점/미공개 제외)
// ✅ 출결: 자녀 소속 반 세션만 필터링
// ✅ 수납 상태: 총액 대신 미납 유무 배지만 표시(총액 과시형 화면 금지)
// 🚫 학생용 게임형 지표 노출 금지, 라이벌 상세(상대 식별)/경쟁 정보 노출 금지
// 🚫 납부 등록/환불 요청/수정/삭제 버튼 없음
// 🚫 선생님 상담 기록 원문 노출 금지("상담 리포트" 카드는 v2에서 이미 제거)

import { useState } from 'react';
import { Link } from 'wouter';
import { CalendarCheck, ClipboardList, CreditCard, ChevronDown, BookOpen, ChevronRight, Play, FileText, Link2, X, CalendarClock, CheckCircle2, TrendingUp, BarChart2, MessageSquare } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useContent } from '@/contexts/ContentContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';
import { useFinance } from '@/contexts/FinanceContext';
import { getPublishedResultsForStudent } from '@/lib/assessmentData';
import type { ContentItem } from '@/lib/contentData';
import { loadIfRecords } from '@/lib/studentIfRecord';
import { computeSubjectGaps } from '@/lib/observationSignals';
import type { StudentSignalBundle } from '@/lib/observationSignals';
import { computeParentInsight } from '@/lib/parentInsightEngine';
import { computeBriefing } from '@/lib/studentBriefingEngine';

function scoreColor(pct: number) {
  return pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)';
}

// Phase 3D v3-r4-r1: 객관 지표 카드의 톤(positive/neutral/watch)별 색상.
// 감정적 경고가 아니라 객관 톤 구분용이므로 채도를 낮게 유지한다.
function toneColor(tone: 'positive' | 'neutral' | 'watch') {
  if (tone === 'positive') return 'oklch(0.45 0.15 160)';
  if (tone === 'watch') return 'oklch(0.5 0.14 60)';
  return 'oklch(0.45 0.015 250)';
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
  const { getInvoicesByStudent, getUnpaidAmount } = useFinance();
  // useGrowth() 의존 제거(위 주석 참조 — 학생용 게임형 지표 미노출 방침)

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

  // 수납 요약 — selectedChildId 기준, CANCELED 제외. Phase 3D v2: 총액은 계산만 하고
  // 화면에는 "미납 유무"만 노출한다(총액 과시형 화면 금지).
  const childInvoices = selectedChildId
    ? getInvoicesByStudent(selectedChildId).filter(inv => inv.status !== 'CANCELED')
    : [];
  const financeUnpaid = childInvoices.reduce((s, inv) => s + getUnpaidAmount(inv.id), 0);
  const hasUnpaid = financeUnpaid > 0;

  // Phase 3D v3-r4-r1: 학부모 객관 지표 + 상담 전 확인 카드 + 자녀에게 해줄 말 —
  // 화면 표시용으로 위에서 이미 슬라이스한 데이터(publishedResults 2건/childRecords 10건)와
  // 별개로, 신호 계산에는 전체 데이터를 사용해야 "최근 2회 연속 하락" 같은 판정이 정확하다.
  // Rival/Emblem/SP/Tier 등 학생용 게임형 지표는 여기서도 전혀 참조하지 않는다.
  const allChildResults = selectedChildId
    ? getPublishedResultsForStudent(exams, submissions, selectedChildId)
    : [];
  const allChildAttendance = sessions
    .filter(sess => childClassIds.has(sess.classId))
    .flatMap(sess =>
      sess.records
        .filter(r => r.studentId === selectedChildId)
        .map(r => ({ date: sess.date, status: r.status }))
    );
  const childHomeworkLite = childHomework.map(hw => ({
    date: hw.createdAt.slice(0, 10),
    completed: getStatus(hw.id, selectedChildId)?.status === 'completed',
  }));
  const childSubjectGaps = computeSubjectGaps(allChildResults, (examId) => exams.find(e => e.id === examId)?.subject);
  const childSignalBundle: StudentSignalBundle = {
    studentId: selectedChildId,
    studentName: child?.name ?? '',
    results: allChildResults,
    ifRecords: selectedChildId ? loadIfRecords(selectedChildId) : [],
    attendanceRecords: allChildAttendance,
    homeworkItems: childHomeworkLite,
    subjectGaps: childSubjectGaps,
  };
  const parentInsight = computeParentInsight(childSignalBundle);
  const parentBriefing = computeBriefing(childSignalBundle, parentInsight);

  // 성장 리포트 진입점 — 학부모 홈에서 "눌러보고 싶은" 카드로 사용.
  // 학생용 게임형 지표는 학부모 화면에 노출하지 않으므로 GrowthContext 의존을 두지 않는다.

  const classNameOf = (classId: string) => (
    childActiveClasses.find(c => c.id === classId)?.name
    ?? classes.find(c => c.id === classId)?.name
    ?? classId
  );
  const dueBadge = (dueDate: string) => {
    if (dueDate < today) return { label: '마감', color: 'oklch(0.55 0.015 250)' };
    if (dueDate === today) return { label: '오늘 마감', color: 'oklch(0.577 0.245 27.325)' };
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
    return { label: `D-${diff}`, color: '#081F4D' };
  };
  const homeworkStatusLabel = (homeworkId: string) => {
    const status = getStatus(homeworkId, selectedChildId)?.status ?? 'assigned';
    if (status === 'completed') return { label: '완료', color: 'oklch(0.45 0.15 160)' };
    if (status === 'seen') return { label: '확인함', color: '#081F4D' };
    return { label: '미확인', color: 'oklch(0.55 0.015 250)' };
  };

  return (
    <ParentLayout title="AXIS 학부모">
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 py-5 space-y-4">

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
            {/* [Phase 3D v3-r7-r1] PC 최적화: 데스크톱에서는 좌측(메인: 수강반/출결/테스트/
                숙제/수업자료/성장리포트) + 우측(요약: 객관지표/상담전확인카드/자녀에게해줄말/
                수납상태/목표대학) 2컬럼으로 재구성한다. */}
            <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5">
              <div className="space-y-4 lg:col-span-2">

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

            {/* 테스트 요약 (공개 결과만) */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 테스트</span>
                </div>
                <Link href="/parent/grades">
                  <div className="flex items-center gap-0.5 text-xs cursor-pointer" style={{ color: 'oklch(0.45 0.15 160)' }}>
                    전체 보기 <ChevronRight size={12} />
                  </div>
                </Link>
              </div>
              {publishedResults.length === 0 ? (
                <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  공개된 테스트 결과가 없습니다.
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
                        ? <FileText size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#081F4D' }} />
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

            {/* 성장 리포트 — 학부모 페이지 헌법 원칙: 납부 확인이 아니라 자녀 성장 확인이 중심이다.
                학생용 게임형 지표 대신 테스트·출결·대학추천 요약으로 눌러서 더 보고 싶게 만드는 진입 카드. */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <TrendingUp size={15} style={{ color: '#081F4D' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>성장 리포트</span>
              </div>
              <Link href="/parent/growth" style={{ display: 'block' }}>
                <div
                  className="axis-card axis-card-clickable p-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #081F4D14, white)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                      style={{ background: '#081F4D' }}
                    >
                      {child?.name.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                        {child?.name ?? '자녀'}의 성장 리포트
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        <TrendingUp size={11} /> 테스트 변화 · 출결 흐름 · 대학추천 — 눌러서 자세히 보기
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'oklch(0.6 0.015 250)', flexShrink: 0 }} />
                </div>
              </Link>
            </section>

              </div>

              <div className="space-y-4 lg:col-span-1">

            {/* Phase 3D v3-r4-r1: 객관 지표 — 감정적 경고가 아니라 수치 기반 객관 정보로 표시.
                Rival/Emblem/SP/Tier 등 학생용 게임형 지표는 포함하지 않는다. */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <BarChart2 size={15} style={{ color: '#081F4D' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>객관 지표</span>
              </div>
              <div className="axis-card p-4 grid grid-cols-2 gap-3">
                {[
                  parentInsight.recentTestChange,
                  parentInsight.averagePosition,
                  parentInsight.attendanceStability,
                  parentInsight.homeworkFlow,
                  parentInsight.ifMissedChange,
                ].map((m, i) => (
                  <div key={i}>
                    <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{m.label}</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: toneColor(m.tone) }}>{m.value}</div>
                  </div>
                ))}
                <div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>목표 대비 보완 과목</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    {parentInsight.targetGapSubjects.length === 0
                      ? '해당 없음'
                      : parentInsight.targetGapSubjects.map(g => `${g.subject}(${g.gapToTarget}%p)`).join(' · ')}
                  </div>
                </div>
              </div>
              {(parentInsight.improvedPoints.length > 0 || parentInsight.checkPoints.length > 0) && (
                <div className="axis-card p-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.45 0.15 160)' }}>좋아진 지표</div>
                    {parentInsight.improvedPoints.length === 0 ? (
                      <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>아직 특별히 눈에 띄는 변화는 없습니다.</div>
                    ) : (
                      <ul className="space-y-0.5">
                        {parentInsight.improvedPoints.map((p, i) => (
                          <li key={i} className="text-xs" style={{ color: 'oklch(0.35 0.02 250)' }}>· {p}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.5 0.14 60)' }}>확인할 지점</div>
                    {parentInsight.checkPoints.length === 0 ? (
                      <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>지금은 특별히 확인할 지점이 없습니다.</div>
                    ) : (
                      <ul className="space-y-0.5">
                        {parentInsight.checkPoints.map((p, i) => (
                          <li key={i} className="text-xs" style={{ color: 'oklch(0.35 0.02 250)' }}>· {p}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Phase 3D v3-r4-r1: 상담 전 확인 카드 — 규칙 기반 자동 브리핑(AI 호출 없음, 입력 없음).
                상담 기록 원문은 포함하지 않는다(학부모 노출 절대 금지 원칙 유지). */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <MessageSquare size={15} style={{ color: '#081F4D' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>상담 전 확인 카드</span>
              </div>
              <div className="axis-card p-4 space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.3 0.02 250)' }}>
                  {parentBriefing.parentBriefing}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parentBriefing.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: 'oklch(0.96 0.004 250)', color: 'oklch(0.4 0.02 250)' }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>선생님께 물어보면 좋은 질문</div>
                  <ul className="space-y-0.5">
                    {parentBriefing.suggestedQuestions.map((q, i) => (
                      <li key={i} className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>· {q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Phase 3D v3-r4-r1: 자녀에게 해줄 말 추천 — 낙인/압박/불안 조장 문구 금지,
                항상 협력적·격려형 어투로만 구성된다. */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CheckCircle2 size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>자녀에게 해줄 말</span>
              </div>
              <div
                className="axis-card p-4"
                style={{ background: 'linear-gradient(135deg, oklch(0.45 0.15 160 / 0.06), white)' }}
              >
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'oklch(0.3 0.1 160)' }}>
                  "{parentBriefing.parentTalkSuggestion}"
                </p>
              </div>
            </section>

            {/* 수납 상태 — Phase 3D v2: 총 청구액/총 납부액 등 총액성 금액 표시를 제거하고
                미납 유무 배지만 표시한다(상태 확인 중심, 총액 과시형 화면 금지). */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CreditCard size={15} style={{ color: 'oklch(0.45 0.15 160)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수납 상태</span>
              </div>
              <Link href="/parent/finance">
                <div className="axis-card axis-card-clickable p-4 flex items-center justify-between">
                  {childInvoices.length === 0 ? (
                    <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                      수납 내역이 없습니다
                    </div>
                  ) : (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={hasUnpaid
                        ? { background: 'oklch(0.93 0.1 25)',   color: 'oklch(0.45 0.15 25)' }
                        : { background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.12 145)' }
                      }
                    >
                      {hasUnpaid ? '미납 있음' : '미납 없음'}
                    </span>
                  )}
                  <ChevronRight size={14} style={{ color: 'oklch(0.7 0.01 250)' }} />
                </div>
              </Link>
            </section>

            {/* 목표대학 추천 / 대학추천 요약 — Phase 3D v2: "상담 리포트" 카드는 제거했다
                (선생님 상담 기록 원문은 학부모에게 노출하지 않는다). */}
            <section className="space-y-2">
              <div className="px-1 text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>
                추가 정보
              </div>
              <Link href="/parent/target-summary" style={{ display: 'block' }}>
                <div className="axis-card axis-card-clickable p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F8F0DC' }}>
                      <span style={{ fontSize: 18 }}>🎓</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>목표대학 추천 요약</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>자녀의 준비 상태와 방향을 확인하세요</div>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'oklch(0.7 0.01 250)' }} />
                </div>
              </Link>
            </section>

              </div>
            </div>
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
