// AXIS LMS v1.2 - 출결현황 화면
// Design: Structured Authority
// 출결현황은 입력 중심 화면이 아니라 조회/판단 화면이다. 수정은 출결체크 화면에서 처리한다(관리 → 체크 이동).
// 기본 조회 조건: 이번 달 · 전체 반(권한 범위 내) · 전체 상태
// 권한: 강사(본인 담당 반만), 행정/원장/최고관리자(전체 반) — canAccessClass()로 반 단위 접근 제어

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { AttendanceStatus as AStatus, STATUS_CONFIG, NOTIFY_STATUSES, notificationStatusLabel } from '@/lib/attendanceData';
import { timeSlotsToSchedule } from '@/lib/studentDerived';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CalendarCheck, Send, ChevronRight, Search, ListChecks,
} from 'lucide-react';

// 로컬(한국) 날짜 기준 YYYY-MM-DD 포맷터.
// toISOString()은 UTC 기준이라 한국 시간 새벽(0~9시)에는 날짜가 하루 밀려 나올 수 있어 사용하지 않는다.
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return formatLocalDate(new Date());
}

// 이번 달(현재 월의 1일 ~ 말일) 범위 계산 — 출결현황 기본 조회 조건
function thisMonthRange(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: formatLocalDate(first), to: formatLocalDate(last) };
}

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatLocalDate(d);
}

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const STATUS_LIST: AStatus[] = ['출석', '지각', '조퇴', '결석', '보강출석', '공결'];

type PeriodPreset = 'thisMonth' | '7' | '30' | 'custom';

// 출결현황 목록에 표시할 평면(denormalized) 레코드 — 세션/출결 레코드를 반·학생 정보와 조인한 화면용 뷰.
// 저장 데이터 자체(AttendanceSession/AttendanceRecord)는 그대로 두고, 화면 레이어에서만 조인한다.
interface AttendanceRow {
  recordId: string;
  date: string;
  dayLabel: string;
  classId: string;
  className: string;
  classType: string;   // 반유형 — classData.ts의 ClassRoom에는 별도 category 필드가 없어 subject로 표시(기존 코드베이스 관례와 동일)
  classTime: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  guardianPhone: string;
  status: AStatus;
  reason: string;
  notificationLabel: '발송됨' | '미발송' | '해당없음';
  notifyChannel?: string;
  processedBy: string;
  processedAt: string;
}

export default function AttendanceStatusPage() {
  const [, navigate] = useLocation();
  const { can, canAccessClass } = useAuth();
  const { sessions } = useAttendance();
  const { classes, getClass } = useClasses();
  const { students } = useStudents();

  // AXIS 확정 정책: 강사는 본인 담당 반만, 행정/원장/최고관리자는 전체 반.
  // "전체 반" 필터는 시스템 전체가 아니라 "현재 사용자가 접근 가능한 반 전체"를 의미한다.
  const availableClasses = useMemo(() => classes.filter(c => canAccessClass(c.id)), [classes, canAccessClass]);

  const [selectedClassId, setSelectedClassId] = useState<string>('all'); // 기본: 전체 반
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('thisMonth');
  const initialRange = thisMonthRange();
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AStatus | 'all'>('all'); // 기본: 전체 상태

  const handlePeriodChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    if (preset === 'thisMonth') {
      const r = thisMonthRange();
      setFromDate(r.from);
      setToDate(r.to);
    } else if (preset === '7' || preset === '30') {
      setFromDate(nDaysAgo(Number(preset)));
      setToDate(todayStr());
    }
  };

  // 학생 id → 정보 lookup (가벼운 맵)
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  // 평면 레코드 목록 — 기간 + 반(권한 범위) 기준으로 먼저 구성한다(학생 검색/상태 필터는 아래에서 별도 적용).
  const baseRows = useMemo(() => {
    const rows: AttendanceRow[] = [];
    sessions.forEach(sess => {
      if (sess.date < fromDate || sess.date > toDate) return;
      if (!canAccessClass(sess.classId)) return; // 권한 범위 밖 반은 "전체 반" 선택 시에도 노출하지 않음
      if (selectedClassId !== 'all' && sess.classId !== selectedClassId) return;

      const cls = getClass(sess.classId);
      const dt = new Date(sess.date);
      sess.records.forEach(rec => {
        const stu = studentMap.get(rec.studentId);
        rows.push({
          recordId: rec.id,
          date: sess.date,
          dayLabel: DAY_LABEL[dt.getDay()],
          classId: sess.classId,
          className: cls?.name ?? '-',
          classType: cls?.subject ?? '-',
          classTime: cls ? timeSlotsToSchedule(cls.timeSlots) : '-',
          studentId: rec.studentId,
          studentName: stu?.name ?? '-',
          studentPhone: stu?.phone ?? '-',
          guardianPhone: stu?.guardians[0]?.phone ?? '-',
          status: rec.status,
          reason: rec.reason ?? '',
          notificationLabel: notificationStatusLabel(rec.status, rec.notified),
          notifyChannel: rec.notifyChannel,
          processedBy: rec.updatedBy ?? rec.createdBy,
          processedAt: rec.updatedAt ?? rec.createdAt,
        });
      });
    });
    // 최신 날짜 우선, 동일 날짜면 반명 → 학생명 순
    rows.sort((a, b) => b.date.localeCompare(a.date) || a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName));
    return rows;
  }, [sessions, fromDate, toDate, selectedClassId, canAccessClass, getClass, studentMap]);

  // 요약 카드 — 기간+반 범위 기준(학생 검색/상태 필터는 적용하지 않음: 전체 분포를 보여주기 위함)
  const summary = useMemo(() => {
    const counts: Record<AStatus, number> = { '출석': 0, '지각': 0, '조퇴': 0, '결석': 0, '보강출석': 0, '공결': 0 };
    let notifySent = 0;
    baseRows.forEach(r => {
      counts[r.status]++;
      if (r.notificationLabel === '발송됨') notifySent++;
    });
    return { total: baseRows.length, counts, notifySent };
  }, [baseRows]);

  // 목록에 표시할 최종 행 — 학생 검색 + 상태 필터까지 적용
  const visibleRows = useMemo(() => {
    const kw = studentSearch.trim();
    return baseRows.filter(r => {
      if (kw && !r.studentName.includes(kw) && !r.studentPhone.replace(/-/g, '').includes(kw.replace(/-/g, ''))) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [baseRows, studentSearch, filterStatus]);

  if (!can('attendance.view')) {
    return (
      <AdminLayout breadcrumbs={[{ label: '출결관리' }, { label: '출결현황' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>출결현황 조회 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const canEdit = can('attendance.check');

  const SUMMARY_CARDS: { key: 'total' | AStatus | 'notify'; label: string; value: number; color: string }[] = [
    { key: 'total', label: '전체 출결 건수', value: summary.total, color: 'oklch(0.38 0.18 250)' },
    { key: '출석', label: '출석', value: summary.counts['출석'], color: STATUS_CONFIG['출석'].text },
    { key: '지각', label: '지각', value: summary.counts['지각'], color: STATUS_CONFIG['지각'].text },
    { key: '조퇴', label: '조퇴', value: summary.counts['조퇴'], color: STATUS_CONFIG['조퇴'].text },
    { key: '결석', label: '결석', value: summary.counts['결석'], color: STATUS_CONFIG['결석'].text },
    { key: '보강출석', label: '보강출석', value: summary.counts['보강출석'], color: STATUS_CONFIG['보강출석'].text },
    { key: '공결', label: '공결', value: summary.counts['공결'], color: STATUS_CONFIG['공결'].text },
    { key: 'notify', label: '알림 발송 건수', value: summary.notifySent, color: 'oklch(0.5 0.15 160)' },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: '출결관리' }, { label: '출결현황' }]}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>출결현황</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            출결 이력 조회 화면입니다. 상태 변경은 출결체크에서 처리합니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/attendance/check')} className="h-8 text-xs gap-1.5">
          <CalendarCheck size={12} /> 출결체크로 이동
        </Button>
      </div>

      {/* 필터 영역 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 반 선택 (전체 반 기본) */}
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="반 선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 반</SelectItem>
              {availableClasses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.subject})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 기간 프리셋 (이번 달 기본) */}
          <div className="flex items-center gap-1">
            {([
              { key: 'thisMonth' as PeriodPreset, label: '이번 달' },
              { key: '7' as PeriodPreset, label: '최근 7일' },
              { key: '30' as PeriodPreset, label: '최근 30일' },
            ]).map(p => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  background: periodPreset === p.key ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.97 0.003 250)',
                  color: periodPreset === p.key ? 'white' : 'oklch(0.5 0.015 250)',
                  border: `1px solid ${periodPreset === p.key ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.005 250)'}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 기간 직접 입력 */}
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

          {/* 학생 검색 */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
            <Input
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="학생명 또는 휴대폰번호 검색"
              className="h-9 w-52 pl-8 text-sm"
            />
          </div>

          {/* 상태 필터 (전체 상태 기본) */}
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as AStatus | 'all')}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">상태 전체</SelectItem>
              {STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2.5 mb-4">
        {SUMMARY_CARDS.map(card => (
          <div key={card.key} className="axis-card p-3 text-center">
            <div className="text-xs mb-1 truncate" style={{ color: 'oklch(0.6 0.015 250)' }}>{card.label}</div>
            <div className="text-xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 출결 이력 목록 */}
      <div className="axis-card overflow-hidden">
        {visibleRows.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
            <ListChecks size={28} style={{ color: 'oklch(0.82 0.01 250)', margin: '0 auto 10px' }} />
            조회 조건에 해당하는 출결 이력이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 1180 }}>
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['날짜', '요일', '반명', '반유형', '수업시간', '학생명', '휴대폰번호', '보호자 연락처', '출결상태', '결석사유', '알림상태', '처리자', '처리일시', '관리'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(row => {
                  const cfg = STATUS_CONFIG[row.status];
                  const isToday = row.date === todayStr();
                  return (
                    <tr key={row.recordId} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs tabular-nums" style={{ color: 'oklch(0.25 0.02 250)' }}>
                        {row.date}{isToday && <span className="ml-1 text-xs px-1 py-0.5 rounded" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>오늘</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{row.dayLabel}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.3 0.015 250)' }}>{row.className}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{row.classType}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{row.classTime}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button onClick={() => navigate(`/students/${row.studentId}?tab=attendance`)} className="text-xs font-medium hover:underline" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                          {row.studentName}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{row.studentPhone}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{row.guardianPhone}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs max-w-[160px] truncate" style={{ color: 'oklch(0.45 0.015 250)' }} title={row.reason || undefined}>
                        {row.reason || '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {row.notificationLabel === '발송됨' ? (
                          <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'oklch(0.5 0.15 160)' }}><Send size={10} /> 발송됨</span>
                        ) : row.notificationLabel === '미발송' ? (
                          <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>미발송</span>
                        ) : (
                          <span className="text-xs" style={{ color: 'oklch(0.82 0.005 250)' }}>해당없음</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{row.processedBy}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        {row.processedAt ? `${row.processedAt.slice(0, 10)} ${row.processedAt.slice(11, 16)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {canEdit ? (
                          <button
                            onClick={() => navigate(`/attendance/check?classId=${row.classId}&date=${row.date}`)}
                            className="flex items-center gap-0.5 text-xs hover:underline"
                            style={{ color: 'oklch(0.511 0.262 276.966)' }}
                          >
                            상세/수정 <ChevronRight size={11} />
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: 'oklch(0.8 0.01 250)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
