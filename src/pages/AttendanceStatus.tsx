// AXIS LMS v1.2 - 출결현황 화면
// Design: Structured Authority
// 기능: 반/기간/상태 필터, 학생별 출결 통계, 날짜별 출결 이력 테이블

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { AttendanceStatus as AStatus, STATUS_CONFIG, NOTIFY_STATUSES } from '@/lib/attendanceData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Users, CalendarCheck, TrendingDown, AlertCircle,
  Send, ChevronRight, BarChart2, Clock
} from 'lucide-react';

// 현재 로그인 사용자 시뮬레이션
type UserRole = '강사' | '행정';
const CURRENT_USER = { name: '김민준', role: '강사' as UserRole, assignedClasses: ['cls-001', 'cls-003'] };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type ViewMode = 'student' | 'date';

export default function AttendanceStatusPage() {
  const [, navigate] = useLocation();
  const { sessions, getSessionsByClass } = useAttendance();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { getClassStudents } = useClasses();

  const availableClasses = CURRENT_USER.role === '행정'
    ? classes.filter(c => c.status === '운영중')
    : classes.filter(c => c.status === '운영중' && CURRENT_USER.assignedClasses.includes(c.id));

  const [selectedClassId, setSelectedClassId] = useState(availableClasses[0]?.id || '');
  const [periodPreset, setPeriodPreset] = useState<'7' | '14' | '30' | 'custom'>('30');
  const [fromDate, setFromDate] = useState(nDaysAgo(30));
  const [toDate, setToDate] = useState(todayStr());
  const [filterStatus, setFilterStatus] = useState<AStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('student');

  const handlePeriodChange = (preset: '7' | '14' | '30' | 'custom') => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      setFromDate(nDaysAgo(Number(preset)));
      setToDate(todayStr());
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const enrolledIds = selectedClassId ? getClassStudents(selectedClassId) : [];
  const enrolledStudents = students.filter(s => enrolledIds.includes(s.id));

  // 필터된 세션
  const filteredSessions = useMemo(() => {
    return getSessionsByClass(selectedClassId).filter(s => s.date >= fromDate && s.date <= toDate);
  }, [selectedClassId, fromDate, toDate, sessions]);

  // 학생별 통계
  const studentStats = useMemo(() => {
    return enrolledStudents.map(stu => {
      const counts: Record<AStatus, number> = {
        '출석': 0, '지각': 0, '조퇴': 0, '결석': 0, '보강출석': 0, '공결': 0,
      };
      let total = 0;
      filteredSessions.forEach(sess => {
        const rec = sess.records.find(r => r.studentId === stu.id);
        if (rec) { counts[rec.status as AStatus]++; total++; }
      });
      const attendRate = total > 0
        ? Math.round(((counts['출석'] + counts['보강출석'] + counts['공결']) / total) * 100)
        : 0;
      return { student: stu, counts, total, attendRate };
    });
  }, [enrolledStudents, filteredSessions]);

  // 전체 통계
  const overallStats = useMemo(() => {
    const totals: Record<AStatus, number> = {
      '출석': 0, '지각': 0, '조퇴': 0, '결석': 0, '보강출석': 0, '공결': 0,
    };
    let grandTotal = 0;
    filteredSessions.forEach(sess => {
      sess.records.forEach(rec => {
        totals[rec.status]++;
        grandTotal++;
      });
    });
    const attendRate = grandTotal > 0
      ? Math.round(((totals['출석'] + totals['보강출석'] + totals['공결']) / grandTotal) * 100)
      : 0;
    return { totals, grandTotal, attendRate };
  }, [filteredSessions]);

  // 날짜별 뷰 - 각 날짜의 출결 요약
  const dateRows = useMemo(() => {
    return filteredSessions.map(sess => {
      const counts: Record<AStatus, number> = {
        '출석': 0, '지각': 0, '조퇴': 0, '결석': 0, '보강출석': 0, '공결': 0,
      };
      sess.records.forEach(r => counts[r.status as AStatus]++);
      const notifiedCount = sess.records.filter(r => r.notified).length;
      return { sess, counts, notifiedCount };
    });
  }, [filteredSessions]);

  // 학생별 뷰 필터
  const filteredStudentStats = useMemo(() => {
    if (filterStatus === 'all') return studentStats;
    return studentStats.filter(s => s.counts[filterStatus as AStatus] > 0);
  }, [studentStats, filterStatus]);

  const STATUS_LIST: AStatus[] = ['출석', '지각', '조퇴', '결석', '보강출석', '공결'];

  return (
    <AdminLayout breadcrumbs={[{ label: '출결관리' }, { label: '출결현황' }]}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>출결현황</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            반별 출결 이력 조회 및 통계 확인
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/attendance/check')} className="h-8 text-xs gap-1.5">
          <CalendarCheck size={12} /> 출결체크로 이동
        </Button>
      </div>

      {/* 필터 영역 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 반 선택 */}
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="h-9 w-52 text-sm"><SelectValue placeholder="반 선택" /></SelectTrigger>
            <SelectContent>
              {availableClasses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.subject})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 기간 프리셋 */}
          <div className="flex items-center gap-1">
            {(['7', '14', '30'] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={cn('px-3 py-1.5 rounded text-xs font-medium transition-colors', periodPreset === p ? 'text-white' : '')}
                style={{
                  background: periodPreset === p ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.97 0.003 250)',
                  color: periodPreset === p ? 'white' : 'oklch(0.5 0.015 250)',
                  border: `1px solid ${periodPreset === p ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.005 250)'}`,
                }}
              >
                최근 {p}일
              </button>
            ))}
          </div>

          {/* 날짜 직접 입력 */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPeriodPreset('custom'); }}
              className="h-9 px-2 rounded border text-xs"
              style={{ borderColor: 'oklch(0.9 0.005 250)', color: 'oklch(0.3 0.015 250)' }}
            />
            <span>~</span>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPeriodPreset('custom'); }}
              className="h-9 px-2 rounded border text-xs"
              style={{ borderColor: 'oklch(0.9 0.005 250)', color: 'oklch(0.3 0.015 250)' }}
            />
          </div>

          {/* 상태 필터 */}
          <Select value={filterStatus}               onValueChange={v => setFilterStatus(v as AStatus | 'all')}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">상태 전체</SelectItem>
              {STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 전체 통계 카드 */}
      {selectedClassId && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="axis-card p-4 text-center">
            <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>전체 수업 수</div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>{filteredSessions.length}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.01 250)' }}>{fromDate.slice(5)} ~ {toDate.slice(5)}</div>
          </div>
          <div className="axis-card p-4 text-center">
            <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>평균 출석률</div>
            <div className="text-2xl font-bold" style={{ color: overallStats.attendRate >= 90 ? 'oklch(0.5 0.15 160)' : overallStats.attendRate >= 70 ? 'oklch(0.7 0.18 60)' : 'oklch(0.577 0.245 27.325)' }}>
              {overallStats.attendRate}%
            </div>
          </div>
          <div className="axis-card p-4 text-center">
            <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>총 결석</div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.577 0.245 27.325)' }}>{overallStats.totals['결석']}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.01 250)' }}>조퇴 {overallStats.totals['조퇴']}건 포함</div>
          </div>
          <div className="axis-card p-4 text-center">
            <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>알림 발송</div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.38 0.18 250)' }}>
              {filteredSessions.reduce((sum, s) => sum + s.records.filter(r => r.notified).length, 0)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.01 250)' }}>카카오 알림톡</div>
          </div>
        </div>
      )}

      {/* 뷰 전환 탭 */}
      {selectedClassId && (
        <div className="axis-card overflow-hidden">
          <div className="flex border-b" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
            {([
              { key: 'student' as ViewMode, label: '학생별 현황', icon: <Users size={13} /> },
              { key: 'date' as ViewMode, label: '날짜별 현황', icon: <CalendarCheck size={13} /> },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-3 text-xs font-medium border-b-2 -mb-px transition-colors',
                  viewMode === tab.key ? 'border-indigo-600' : 'border-transparent hover:border-slate-200',
                )}
                style={{ color: viewMode === tab.key ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.55 0.015 250)' }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── 학생별 현황 ── */}
          {viewMode === 'student' && (
            <div className="p-0">
              {filteredStudentStats.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  해당 조건의 데이터가 없습니다.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>학생명</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>출석률</th>
                      {STATUS_LIST.map(s => (
                        <th key={s} className="px-3 py-3 text-center text-xs font-semibold" style={{ color: STATUS_CONFIG[s].text }}>
                          {s}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>총 수업</th>
                      <th className="px-4 py-3 text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentStats.map(({ student, counts, total, attendRate }) => {
                      const rateColor = attendRate >= 90 ? 'oklch(0.5 0.15 160)' : attendRate >= 70 ? 'oklch(0.7 0.18 60)' : 'oklch(0.577 0.245 27.325)';
                      return (
                        <tr key={student.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                                {student.name[0]}
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(`/students/${student.id}`)}
                                  className="font-medium text-sm hover:underline"
                                  style={{ color: 'oklch(0.511 0.262 276.966)' }}
                                >
                                  {student.name}
                                </button>
                                <div className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>{student.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-bold" style={{ color: rateColor }}>{attendRate}%</span>
                              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                                <div className="h-full rounded-full" style={{ width: `${attendRate}%`, background: rateColor }} />
                              </div>
                            </div>
                          </td>
                          {STATUS_LIST.map(s => (
                            <td key={s} className="px-3 py-3 text-center">
                              {counts[s] > 0 ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text }}>
                                  {counts[s]}
                                </span>
                              ) : (
                                <span className="text-xs" style={{ color: 'oklch(0.82 0.005 250)' }}>-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{total}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/students/${student.id}?tab=attendance`)}
                              className="flex items-center gap-0.5 text-xs hover:underline"
                              style={{ color: 'oklch(0.511 0.262 276.966)' }}
                            >
                              상세 <ChevronRight size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── 날짜별 현황 ── */}
          {viewMode === 'date' && (
            <div className="p-0">
              {dateRows.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  해당 기간에 출결 데이터가 없습니다.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>수업일</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>체크 상태</th>
                      {STATUS_LIST.map(s => (
                        <th key={s} className="px-3 py-3 text-center text-xs font-semibold" style={{ color: STATUS_CONFIG[s].text }}>{s}</th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>알림</th>
                      <th className="px-4 py-3 text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateRows.map(({ sess, counts, notifiedCount }) => {
                      const dt = new Date(sess.date);
                      const days = ['일', '월', '화', '수', '목', '금', '토'];
                      const isToday = sess.date === todayStr();
                      return (
                        <tr key={sess.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                              {sess.date} ({days[dt.getDay()]}요일)
                              {isToday && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>오늘</span>}
                            </div>
                            {sess.checkedBy && (
                              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.01 250)' }}>
                                {sess.checkedBy} · {sess.checkedAt?.slice(11, 16)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {sess.isLocked ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.28 0.15 160)' }}>
                                완료
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'oklch(0.95 0.06 60)', color: 'oklch(0.42 0.14 60)' }}>
                                미완료
                              </span>
                            )}
                          </td>
                          {STATUS_LIST.map(s => (
                            <td key={s} className="px-3 py-3 text-center">
                              {counts[s] > 0 ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text }}>
                                  {counts[s]}
                                </span>
                              ) : (
                                <span className="text-xs" style={{ color: 'oklch(0.82 0.005 250)' }}>-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            {notifiedCount > 0 ? (
                              <div className="flex items-center justify-center gap-1 text-xs" style={{ color: 'oklch(0.38 0.18 250)' }}>
                                <Send size={11} /> {notifiedCount}건
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'oklch(0.82 0.005 250)' }}>-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/attendance/check?classId=${sess.classId}&date=${sess.date}`)}
                              className="flex items-center gap-0.5 text-xs hover:underline"
                              style={{ color: 'oklch(0.511 0.262 276.966)' }}
                            >
                              체크 <ChevronRight size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* 반 미선택 안내 */}
      {!selectedClassId && (
        <div className="axis-card p-12 text-center">
          <BarChart2 size={36} style={{ color: 'oklch(0.8 0.01 250)', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>반을 선택하면 출결현황을 조회할 수 있습니다.</p>
        </div>
      )}
    </AdminLayout>
  );
}
