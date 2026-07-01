// AXIS LMS v1.2 - TeacherClassRoster (Phase 3D v3-r6)
// 강사가 담당 반을 클릭했을 때 진입하는 출석부 형태의 학생 목록 화면.
// - 학생명 / 수강상태 / 출결 요약 / 최근 테스트 / 숙제 상태 / 학생 상세 진입 버튼을 한 표에 표시.
// - PC 웹 기준(넓은 표)으로 안정적으로 보이도록 구성하고, 모바일은 가로 스크롤로 깨지지
//   않는 정도까지만 대응한다(다른 교사 화면의 모바일 카드 UI로 별도 전환하지 않음).
// - 담당 반(assignedClassIds)만 접근 가능 — 다른 반은 이 화면에서 절대 보이지 않는다.

import { useMemo } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronLeft, Users, BarChart2, ClipboardList, CalendarCheck } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { useHomeworkStatus } from '@/contexts/HomeworkStatusContext';

const RECENT_ATT_WINDOW = 10; // 출결 요약에 사용할 최근 세션 수

function NotAllowedScreen() {
  return (
    <TeacherLayout title="담당 반">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Link href="/teacher/classes">
          <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} /> 담당 반 목록
          </div>
        </Link>
        <div className="axis-card p-10 text-center">
          <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>접근 권한이 없습니다.</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 반만 조회할 수 있습니다.</div>
        </div>
      </div>
    </TeacherLayout>
  );
}

export default function TeacherClassRoster() {
  const { classId } = useParams<{ classId: string }>();
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { sessions } = useAttendance();
  const { getPublishedResultsForStudent } = useAssessment();
  const { getForStudent } = useHomework();
  const { getStatus } = useHomeworkStatus();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const isAllowed = !!classId && assignedClassIds.includes(classId);
  const cls = isAllowed ? classes.find((c) => c.id === classId) : undefined;

  // Rules of Hooks 준수: 접근 권한/반 존재 여부 조기 return보다 반드시 앞에 모든 hook을
  // 선언해야 한다(TeacherStudentDetail.tsx와 동일 원칙). 권한이 없거나 반이 없으면
  // roster를 빈 배열로 두고, 실제 조기 return은 이 아래에서 처리한다.
  const roster = useMemo(() => {
    if (!cls) return [];
    return students
      .filter((s) => s.classes.some((c) => c.id === cls.id && c.status === '수강중'))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [students, cls]);

  const rows = useMemo(() => {
    if (!cls) return [];
    return roster.map((student) => {
      // 출결 요약 — 이 반 세션 기준, 최근 RECENT_ATT_WINDOW건
      const attRecords = sessions
        .filter((sess) => sess.classId === cls.id)
        .flatMap((sess) =>
          sess.records
            .filter((r) => r.studentId === student.id)
            .map((r) => ({ date: sess.date, status: r.status }))
        )
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, RECENT_ATT_WINDOW);
      const presentCount = attRecords.filter((r) => r.status === '출석' || r.status === '보강출석').length;
      const absentCount = attRecords.filter((r) => r.status === '결석').length;
      const attRate = attRecords.length > 0 ? Math.round((presentCount / attRecords.length) * 100) : null;

      // 최근 테스트 — 공개된 결과 중 가장 최근 1건
      const results = getPublishedResultsForStudent(student.id).sort((a, b) => b.examDate.localeCompare(a.examDate));
      const latest = results[0];
      const latestPct = latest && latest.totalPoints > 0 ? Math.round((latest.earnedScore / latest.totalPoints) * 100) : null;

      // 숙제 상태 — 이 반에 공개된 숙제 기준
      const homeworkList = getForStudent([cls.id]);
      const hwDone = homeworkList.filter((hw) => getStatus(hw.id, student.id)?.status === 'completed').length;

      return { student, attRecords, attRate, presentCount, absentCount, latest, latestPct, hwTotal: homeworkList.length, hwDone };
    });
  }, [roster, sessions, getPublishedResultsForStudent, getForStudent, getStatus, cls]);

  if (!isAllowed || !cls) return <NotAllowedScreen />;

  return (
    <TeacherLayout title={cls.name}>
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/teacher/classes">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} /> 담당 반 목록
          </div>
        </Link>

        {/* 반 요약 헤더 */}
        <div className="axis-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>{cls.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
              {cls.subject} · {cls.level} {cls.room ? `· 강의실 ${cls.room}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <Users size={15} /> {roster.length}명
          </div>
        </div>

        {/* 학생 목록 — 출석부 형태(PC 웹 기준 넓은 표) */}
        {roster.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <Users size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>현재 수강 중인 학생이 없습니다.</div>
          </div>
        ) : (
          <div className="axis-card overflow-hidden">
            <div className="axis-table-wrap">
              <div className="axis-table-scroll" style={{ maxHeight: 640 }}>
                <table className="w-full text-sm" style={{ minWidth: 860 }}>
                  <thead>
                    <tr style={{ background: 'oklch(0.985 0.003 250)' }}>
                      {['학생명', '수강상태', '출결 요약', '최근 테스트', '숙제 상태', '상세'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap"
                          style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ student, attRate, presentCount, absentCount, attRecords, latest, latestPct, hwTotal, hwDone }) => (
                      <tr key={student.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                        {/* 학생명 */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                              style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</span>
                          </div>
                        </td>

                        {/* 수강상태 */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                            수강중
                          </span>
                        </td>

                        {/* 출결 요약 */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {attRecords.length === 0 ? (
                            <span className="text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>기록 없음</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <CalendarCheck size={12} style={{ color: 'oklch(0.55 0.015 250)' }} />
                              <span className="text-xs font-semibold tabular-nums"
                                style={{ color: (attRate ?? 0) >= 90 ? 'oklch(0.45 0.15 160)' : (attRate ?? 0) >= 75 ? 'oklch(0.5 0.015 250)' : 'oklch(0.55 0.2 27)' }}>
                                출석률 {attRate}%
                              </span>
                              <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                                (최근 {attRecords.length}회 · 결석 {absentCount})
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 최근 테스트 */}
                        <td className="px-3 py-2.5">
                          {!latest ? (
                            <span className="text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>기록 없음</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <BarChart2 size={12} style={{ color: 'oklch(0.55 0.015 250)' }} />
                              <span className="text-xs font-medium truncate max-w-40" style={{ color: 'oklch(0.3 0.02 250)' }} title={latest.title}>
                                {latest.title}
                              </span>
                              <span className="text-xs font-bold tabular-nums flex-shrink-0"
                                style={{ color: (latestPct ?? 0) >= 80 ? 'oklch(0.45 0.15 160)' : (latestPct ?? 0) >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)' }}>
                                {latestPct}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 숙제 상태 */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {hwTotal === 0 ? (
                            <span className="text-xs" style={{ color: 'oklch(0.7 0.01 250)' }}>배정 없음</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <ClipboardList size={12} style={{ color: 'oklch(0.55 0.015 250)' }} />
                              <span className="text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.35 0.02 250)' }}>
                                {hwDone}/{hwTotal}건 완료
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 상세 진입 */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Link href={`/teacher/students/${student.id}`}>
                            <button className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors hover:bg-slate-50 active:scale-95"
                              style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>
                              학생 상세 <ChevronLeft size={11} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
