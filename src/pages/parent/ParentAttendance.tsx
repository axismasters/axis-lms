// AXIS LMS v1.2 - ParentAttendance (Parent Portal Foundation v1)
// 보호자 전용 자녀 출결 조회 — 읽기 전용.
// 자녀 소속 반 세션만 필터링. 본인 assignedStudentIds 범위만 조회 가능.

import { useState } from 'react';
import { CalendarCheck, ChevronDown } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import type { AttendanceStatus } from '@/lib/attendanceData';

const STATUS_STYLE: Record<AttendanceStatus, { bg: string; text: string }> = {
  '출석':    { bg: 'oklch(0.94 0.08 160)',  text: 'oklch(0.35 0.12 160)' },
  '지각':    { bg: 'oklch(0.95 0.08 80)',   text: 'oklch(0.45 0.15 80)' },
  '조퇴':    { bg: 'oklch(0.91 0.035 262)',  text: 'oklch(0.1605 0.0394 259.41)' },
  '결석':    { bg: 'oklch(0.95 0.08 27)',   text: 'oklch(0.45 0.15 27)' },
  '보강출석': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.35 0.12 160)' },
  '공결':    { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.45 0.015 250)' },
};

export default function ParentAttendance() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { sessions } = useAttendance();

  const myChildren = students.filter(s =>
    (currentUser.assignedStudentIds ?? []).includes(s.id)
  );
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id ?? '');
  const child = myChildren.find(s => s.id === selectedChildId);

  // 자녀 소속 반 세션만 스코프
  const childClassIds = new Set((child?.classes ?? []).map(c => c.id));
  const childRecords = sessions
    .filter(sess => childClassIds.has(sess.classId))
    .flatMap(sess =>
      sess.records
        .filter(r => r.studentId === selectedChildId)
        .map(r => ({
          ...r,
          className: classes.find(c => c.id === sess.classId)?.name ?? sess.classId,
        }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  const presentCount = childRecords.filter(r => r.status === '출석' || r.status === '보강출석').length;
  const officialCount = childRecords.filter(r => r.status === '공결').length;
  const lateCount = childRecords.filter(r => r.status === '지각' || r.status === '조퇴').length;
  const absentCount = childRecords.filter(r => r.status === '결석').length;
  const total = childRecords.length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + officialCount) / total) * 100) : null;

  return (
    <ParentLayout title="자녀 출결">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        {myChildren.length > 1 && (
          <div className="axis-card p-4">
            <div className="text-xs mb-2 font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>자녀 선택</div>
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 appearance-none"
                style={{ border: '1px solid oklch(0.9 0.008 250)', background: 'white', color: 'oklch(0.2 0.02 250)' }}
              >
                {myChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'oklch(0.5 0.015 250)' }} />
            </div>
          </div>
        )}

        {!child ? (
          <div className="axis-card p-10 text-center">
            <CalendarCheck size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>연결된 자녀 정보가 없습니다.</div>
          </div>
        ) : childRecords.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <CalendarCheck size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>{child.name}</div>
            <div className="text-sm mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>출결 기록이 없습니다.</div>
          </div>
        ) : (
          <>
            {/* 자녀 표시 (단일 자녀) */}
            {myChildren.length === 1 && (
              <div className="axis-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'oklch(0.45 0.15 160)' }}>
                  {child.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{child.name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{child.status}</div>
                </div>
              </div>
            )}

            {/* 출결 통계 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '출석',     value: presentCount, color: 'oklch(0.45 0.15 160)' },
                { label: '지각/조퇴', value: lateCount,    color: 'oklch(0.55 0.15 80)' },
                { label: '결석',     value: absentCount,  color: 'oklch(0.55 0.2 27)' },
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
                  <div className="h-full rounded-full"
                    style={{
                      width: `${attendanceRate}%`,
                      background: attendanceRate >= 90 ? 'oklch(0.45 0.15 160)' : attendanceRate >= 70 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)',
                    }} />
                </div>
              </div>
            )}

            {/* 출결 기록 목록 */}
            <section>
              <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                최근 출결 기록
              </div>
              <div className="space-y-2">
                {childRecords.map(r => {
                  const style = STATUS_STYLE[r.status];
                  return (
                    <div key={r.id} className="axis-card p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.3 0.02 250)' }}>
                            {r.date}
                          </span>
                          <span className="text-xs truncate" style={{ color: 'oklch(0.55 0.015 250)' }}>
                            {r.className}
                          </span>
                        </div>
                        {r.reason && (
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>
                            사유: {r.reason}
                          </div>
                        )}
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-2"
                        style={{ background: style.bg, color: style.text }}>
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
    </ParentLayout>
  );
}
