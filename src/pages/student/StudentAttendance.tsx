// AXIS LMS v1.2 - StudentAttendance (Student Portal Foundation v1)
// 학생 전용 출결 조회 — 읽기 전용. 본인 데이터만 표시.

import { CalendarCheck } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import type { AttendanceStatus } from '@/lib/attendanceData';

const STATUS_STYLE: Record<AttendanceStatus, { bg: string; text: string }> = {
  '출석':    { bg: 'oklch(0.94 0.08 160)',  text: 'oklch(0.35 0.12 160)' },
  '지각':    { bg: 'oklch(0.95 0.08 80)',   text: 'oklch(0.45 0.15 80)' },
  '조퇴':    { bg: 'oklch(0.91 0.035 262)',  text: 'oklch(0.254 0.090 262.09)' },
  '결석':    { bg: 'oklch(0.95 0.08 27)',   text: 'oklch(0.45 0.15 27)' },
  '보강출석': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.35 0.12 160)' },
  '공결':    { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.45 0.015 250)' },
};

export default function StudentAttendance() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { sessions } = useAttendance();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);

  // 본인이 소속된 반 ID 집합
  const myClassIds = new Set(student?.classes.map(c => c.id) ?? []);

  // 본인의 출결 기록 (최근 30건, 역순)
  const myRecords = sessions
    .filter(sess => myClassIds.has(sess.classId))
    .flatMap(sess =>
      sess.records
        .filter(r => r.studentId === myStudentId)
        .map(r => ({
          ...r,
          className: classes.find(c => c.id === sess.classId)?.name ?? sess.classId,
        }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  // 출결 통계
  const stats = {
    출석: myRecords.filter(r => r.status === '출석' || r.status === '보강출석').length,
    지각: myRecords.filter(r => r.status === '지각').length,
    조퇴: myRecords.filter(r => r.status === '조퇴').length,
    결석: myRecords.filter(r => r.status === '결석').length,
    공결: myRecords.filter(r => r.status === '공결').length,
  };

  const total = myRecords.length;
  const attendanceRate = total > 0
    ? Math.round(((stats.출석 + stats.공결) / total) * 100)
    : null;

  return (
    <StudentLayout title="출결 확인">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {myRecords.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <CalendarCheck size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>출결 기록이 없습니다.</div>
          </div>
        ) : (
          <>
            {/* 출결 통계 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '출석',     value: stats.출석, color: 'oklch(0.45 0.15 160)' },
                { label: '지각/조퇴', value: stats.지각 + stats.조퇴, color: 'oklch(0.55 0.15 80)' },
                { label: '결석',     value: stats.결석, color: 'oklch(0.55 0.2 27)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-xl tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 출석률 */}
            {attendanceRate !== null && (
              <div className="axis-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>
                    출석률 (최근 {total}회 기준)
                  </span>
                  <span className="font-bold tabular-nums text-sm"
                    style={{ color: attendanceRate >= 90 ? 'oklch(0.45 0.15 160)' : attendanceRate >= 70 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)' }}>
                    {attendanceRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.006 250)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${attendanceRate}%`,
                      background: attendanceRate >= 90 ? 'oklch(0.45 0.15 160)' : attendanceRate >= 70 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* 출결 기록 목록 */}
            <section>
              <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                최근 출결 기록
              </div>
              <div className="space-y-2">
                {myRecords.map(r => {
                  const style = STATUS_STYLE[r.status];
                  return (
                    <div key={r.id} className="axis-card p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.3 0.02 250)' }}>
                            {r.date}
                          </span>
                          <span className="text-xs text-truncate" style={{ color: 'oklch(0.55 0.015 250)' }}>
                            {r.className}
                          </span>
                        </div>
                        {r.reason && (
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>
                            사유: {r.reason}
                          </div>
                        )}
                      </div>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-2"
                        style={{ background: style.bg, color: style.text }}
                      >
                        {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

      </div>
    </StudentLayout>
  );
}
