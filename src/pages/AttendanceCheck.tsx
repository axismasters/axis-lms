// AXIS LMS v1.2 - 출결체크 화면
// Design: Structured Authority
// 흐름: 반 선택 → 날짜 선택 → 전체 자동 출석 초기화 → 예외 학생만 수정 → 체크 완료(잠금)
// 권한: 강사(본인 반만), 행정(전체 반)

import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { AttendanceStatus, STATUS_CONFIG, NOTIFY_STATUSES } from '@/lib/attendanceData';
import { POSITION_LABEL } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  CheckCircle2, Clock, AlertCircle, Lock, Unlock,
  Send, ChevronDown, CalendarCheck, Users, Info,
  RefreshCw, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 로컬(한국) 날짜 기준 YYYY-MM-DD 포맷터.
// toISOString()은 UTC 기준이라 한국 시간 새벽(0~9시)에는 날짜가 하루 밀려 나올 수 있어 사용하지 않는다.
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 오늘 날짜
function todayStr() {
  return formatLocalDate(new Date());
}

// 날짜 포맷
function formatDate(d: string) {
  const dt = new Date(d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d} (${days[dt.getDay()]}요일)`;
}

// 상태 선택 버튼 그룹
function StatusSelector({
  value,
  onChange,
  disabled,
}: {
  value: AttendanceStatus;
  onChange: (v: AttendanceStatus) => void;
  disabled?: boolean;
}) {
  const statuses: AttendanceStatus[] = ['출석', '지각', '조퇴', '결석', '보강출석', '공결'];
  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map(s => {
        const cfg = STATUS_CONFIG[s];
        const active = value === s;
        return (
          <button
            key={s}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium transition-all',
              disabled && 'opacity-40 cursor-not-allowed',
              !disabled && 'hover:opacity-90 active:scale-95',
            )}
            style={{
              background: active ? cfg.bg : 'oklch(0.97 0.003 250)',
              color: active ? cfg.text : 'oklch(0.55 0.015 250)',
              border: active ? `1.5px solid ${cfg.border}` : '1.5px solid oklch(0.9 0.005 250)',
              fontWeight: active ? 700 : 500,
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export default function AttendanceCheck() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { currentUser, can, canAccessClass } = useAuth();
  const { sessions, getSession, initSession, updateRecord, lockSession, unlockSession, sendNotification } = useAttendance();
  const { classes, getClassStudents } = useClasses();
  const { students } = useStudents();

  // AXIS 확정 정책: 담당강사는 본인 담당 반만, 행정/원장/최고관리자는 전체 반.
  // canAccessClass()가 dataScope(ALL_ACADEMY/ASSIGNED_CLASSES)를 기준으로 이미 이 규칙을 구현하고 있다.
  const availableClasses = classes.filter(c => c.status === '운영중' && canAccessClass(c.id));
  const canViewAll = can('attendance.viewAll'); // 전체 반 범위 보유자(행정/원장/최고관리자) — 잠금 해제 등 운영 권한 판별용

  // /attendance/check?classId=...&date=... 로 진입 시(출결현황의 "관리" 링크) 해당 반/날짜를 초기값으로 사용.
  const initialParams = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const [selectedClassId, setSelectedClassId] = useState(() => {
    const fromQuery = initialParams.get('classId');
    if (fromQuery && availableClasses.some(c => c.id === fromQuery)) return fromQuery;
    return availableClasses[0]?.id || '';
  });
  const [selectedDate, setSelectedDate] = useState(() => initialParams.get('date') || todayStr());

  // 권한이 없는 반이 선택되어 있으면(예: DEV 계정 전환) 접근 가능한 첫 반으로 보정
  useEffect(() => {
    if (selectedClassId && !availableClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(availableClasses[0]?.id || '');
    }
  }, [availableClasses, selectedClassId]);

  // 사유 입력 모달
  const [reasonModal, setReasonModal] = useState<{
    sessionId: string;
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
    currentReason?: string;
    currentNote?: string;
  } | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const enrolledIds = selectedClassId ? getClassStudents(selectedClassId) : [];
  const enrolledStudents = students.filter(s => enrolledIds.includes(s.id));

  // 현재 세션
  const currentSession = selectedClassId ? getSession(selectedClassId, selectedDate) : undefined;

  // 세션 초기화 (전체 자동 출석)
  const handleInitSession = () => {
    if (!selectedClassId || enrolledStudents.length === 0) return;
    initSession(selectedClassId, selectedDate, enrolledIds, currentUser.name);
    toast.success(`${enrolledStudents.length}명 전체 출석으로 초기화되었습니다.`);
  };

  // 출결 상태 변경 — 출석 외 5개 상태(결석/지각/조퇴/보강출석/공결)는 사유 입력 모달을 거친다.
  // 결석만 사유가 필수이며, 나머지(지각/조퇴/보강출석/공결)는 선택 입력이다.
  const handleStatusChange = (sessionId: string, studentId: string, studentName: string, newStatus: AttendanceStatus, currentReason?: string) => {
    if (newStatus !== '출석') {
      setReasonModal({ sessionId, studentId, studentName, status: newStatus, currentReason });
      setReasonInput(currentReason || '');
      setNoteInput('');
      return;
    }
    // 출석은 사유 개념이 없으므로 바로 변경
    updateRecord(sessionId, studentId, newStatus, undefined, undefined, currentUser.name);
    toast.success(`${studentName} - ${newStatus} 처리되었습니다.`);
  };

  // 사유 저장
  const handleReasonSave = () => {
    if (!reasonModal) return;
    if (reasonModal.status === '결석' && !reasonInput.trim()) {
      toast.error('결석 사유는 필수 입력입니다.');
      return;
    }
    updateRecord(reasonModal.sessionId, reasonModal.studentId, reasonModal.status, reasonInput.trim(), noteInput.trim(), currentUser.name);
    toast.success(`${reasonModal.studentName} - ${reasonModal.status} 처리되었습니다.`);
    setReasonModal(null);
    setReasonInput('');
    setNoteInput('');
  };

  // 체크 완료 (잠금)
  const handleLock = () => {
    if (!currentSession) return;
    lockSession(currentSession.id, currentUser.name);
    // 알림 발송 대상 자동 처리
    const notifyTargets = currentSession.records.filter(
      r => NOTIFY_STATUSES.includes(r.status) && !r.notified
    );
    notifyTargets.forEach(r => sendNotification(currentSession.id, r.studentId));
    if (notifyTargets.length > 0) {
      toast.success(`출결 체크 완료. 결석/조퇴 ${notifyTargets.length}명에게 카카오 알림톡 발송.`);
    } else {
      toast.success('출결 체크가 완료되었습니다.');
    }
  };

  // 잠금 해제 (전체 반 범위 보유자만 — 행정/원장/최고관리자)
  const handleUnlock = () => {
    if (!currentSession || !canViewAll) return;
    unlockSession(currentSession.id);
    toast.info('출결 체크가 수정 가능 상태로 변경되었습니다.');
  };

  // 알림 재발송
  const handleResendNotify = (sessionId: string, studentId: string, studentName: string) => {
    sendNotification(sessionId, studentId);
    toast.success(`${studentName}에게 카카오 알림톡을 재발송했습니다.`);
  };

  // 통계 계산
  const stats = useMemo(() => {
    if (!currentSession) return null;
    const counts: Record<AttendanceStatus, number> = {
      '출석': 0, '지각': 0, '조퇴': 0, '결석': 0, '보강출석': 0, '공결': 0,
    };
    currentSession.records.forEach(r => counts[r.status]++);
    const total = currentSession.records.length;
    const attendRate = total > 0 ? Math.round(((counts['출석'] + counts['보강출석'] + counts['공결']) / total) * 100) : 0;
    return { counts, total, attendRate };
  }, [currentSession, sessions]);

  // 날짜 선택 최근 14일 — 단, 출결현황의 "상세/수정" 링크(?date=...)로 들어온 날짜가
  // 최근 14일 범위 밖이면 Select 표시가 비어 보일 수 있으므로, 그 날짜도 옵션에 포함시켜 보정한다.
  const dateOptions = useMemo(() => {
    const opts: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      opts.push(formatLocalDate(d));
    }
    if (selectedDate && !opts.includes(selectedDate)) {
      opts.push(selectedDate);
      opts.sort((a, b) => b.localeCompare(a));
    }
    return opts;
  }, [selectedDate]);

  if (!can('attendance.check')) {
    return (
      <AdminLayout breadcrumbs={[{ label: '출결관리' }, { label: '출결체크' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>출결체크 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: '출결관리' }, { label: '출결체크' }]}>
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>출결체크</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            {canViewAll ? `전체 운영반 ${availableClasses.length}개` : `담당 반 ${availableClasses.length}개`} · 전체 자동 출석 후 예외 학생만 수정
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
          <Users size={12} />
          {currentUser.name} ({POSITION_LABEL[currentUser.position]})
        </div>
      </div>

      {/* 반/날짜 선택 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>반 선택</label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-9 w-52 text-sm">
                <SelectValue placeholder="반을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.subject})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>날짜</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="h-9 w-52 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map(d => {
                  const dt = new Date(d);
                  const days = ['일', '월', '화', '수', '목', '금', '토'];
                  const isToday = d === todayStr();
                  return (
                    <SelectItem key={d} value={d}>
                      {d} ({days[dt.getDay()]}){isToday ? ' · 오늘' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="text-xs px-2.5 py-1 rounded" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
              {selectedClass.teacher} · {selectedClass.subject} · {selectedClass.level}
            </div>
          )}
        </div>
      </div>

      {/* 세션 없음 → 초기화 안내 */}
      {selectedClassId && !currentSession && (
        <div className="axis-card p-8 text-center">
          <CalendarCheck size={36} style={{ color: 'oklch(0.8 0.01 250)', margin: '0 auto 12px' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'oklch(0.3 0.015 250)' }}>
            {formatDate(selectedDate)} 출결이 아직 시작되지 않았습니다.
          </p>
          <p className="text-xs mb-5" style={{ color: 'oklch(0.6 0.015 250)' }}>
            '출결 시작' 버튼을 누르면 수강생 {enrolledStudents.length}명이 전체 출석으로 초기화됩니다.
          </p>
          {enrolledStudents.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.577 0.245 27.325)' }}>수강생이 없습니다. 반 상세에서 수강생을 추가해주세요.</p>
          ) : (
            <Button onClick={handleInitSession} className="gap-2" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              <CheckCircle2 size={15} />
              출결 시작 (전체 출석 초기화)
            </Button>
          )}
        </div>
      )}

      {/* 세션 있음 → 출결 체크 UI */}
      {currentSession && (
        <>
          {/* 통계 요약 + 잠금 상태 */}
          <div className="axis-card p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* 통계 칩 */}
              <div className="flex items-center gap-2 flex-wrap">
                {stats && Object.entries(stats.counts).map(([status, count]) => {
                  if (count === 0) return null;
                  const cfg = STATUS_CONFIG[status as AttendanceStatus];
                  return (
                    <div key={status} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                      {status} {count}
                    </div>
                  );
                })}
                {stats && (
                  <div className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
                    출석률 {stats.attendRate}%
                  </div>
                )}
              </div>

              {/* 잠금/완료 버튼 */}
              <div className="flex items-center gap-2">
                {currentSession.isLocked ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.28 0.15 160)' }}>
                      <Lock size={11} /> 체크 완료 · {currentSession.checkedBy}
                    </div>
                    {canViewAll && (
                      <Button variant="outline" size="sm" onClick={handleUnlock} className="h-8 text-xs gap-1.5">
                        <Unlock size={11} /> 수정 허용
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="sm" onClick={handleLock} className="h-8 text-xs gap-1.5"
                    style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                    <CheckCircle2 size={12} /> 체크 완료
                  </Button>
                )}
              </div>
            </div>

            {/* 알림 안내 */}
            {!currentSession.isLocked && (
              <div className="flex items-start gap-2 mt-3 pt-3 border-t text-xs" style={{ borderColor: 'oklch(0.93 0.005 250)', color: 'oklch(0.55 0.015 250)' }}>
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                <span>체크 완료 시 결석·조퇴 학생에게 카카오 알림톡이 자동 발송됩니다. 지각·보강출석·공결은 알림이 발송되지 않습니다.</span>
              </div>
            )}
          </div>

          {/* 출결 목록 테이블 */}
          <div className="axis-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'oklch(0.985 0.003 250)', borderBottom: '1px solid oklch(0.92 0.005 250)' }}>
                  {['#', '학생명', '보호자 연락처', '출결 상태', '사유', '알림', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((stu, idx) => {
                  const rec = currentSession.records.find(r => r.studentId === stu.id);
                  if (!rec) return null;
                  const cfg = STATUS_CONFIG[rec.status];
                  const isNotifyTarget = NOTIFY_STATUSES.includes(rec.status);
                  const locked = currentSession.isLocked;

                  return (
                    <tr key={stu.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      {/* 번호 */}
                      <td className="px-4 py-3 text-xs" style={{ color: 'oklch(0.65 0.01 250)', width: 40 }}>{idx + 1}</td>

                      {/* 학생명 */}
                      <td className="px-4 py-3" style={{ width: 140 }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                            {stu.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{stu.name}</div>
                            <div className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>{stu.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* 보호자 연락처 */}
                      <td className="px-4 py-3 text-xs tabular-nums" style={{ width: 130, color: 'oklch(0.5 0.015 250)' }}>
                        {stu.guardians[0]?.phone ?? '-'}
                      </td>

                      {/* 출결 상태 선택 */}
                      <td className="px-4 py-3" style={{ minWidth: 340 }}>
                        <StatusSelector
                          value={rec.status}
                          disabled={locked}
                          onChange={(newStatus) => handleStatusChange(currentSession.id, stu.id, stu.name, newStatus, rec.reason)}
                        />
                      </td>

                      {/* 사유 */}
                      <td className="px-4 py-3" style={{ minWidth: 140 }}>
                        {rec.reason ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: 'oklch(0.45 0.015 250)' }}>{rec.reason}</span>
                            {!locked && (
                              <button
                                onClick={() => {
                                  setReasonModal({ sessionId: currentSession.id, studentId: stu.id, studentName: stu.name, status: rec.status, currentReason: rec.reason, currentNote: rec.note });
                                  setReasonInput(rec.reason || '');
                                  setNoteInput(rec.note || '');
                                }}
                                className="text-xs underline"
                                style={{ color: 'oklch(0.511 0.262 276.966)' }}
                              >
                                수정
                              </button>
                            )}
                          </div>
                        ) : (
                          rec.status !== '출석' && !locked ? (
                            <button
                              onClick={() => {
                                setReasonModal({ sessionId: currentSession.id, studentId: stu.id, studentName: stu.name, status: rec.status });
                                setReasonInput('');
                                setNoteInput('');
                              }}
                              className="text-xs flex items-center gap-1"
                              style={{ color: rec.status === '결석' ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.55 0.015 250)' }}
                            >
                              <MessageSquare size={11} />
                              {rec.status === '결석' ? '사유 입력 (필수)' : '사유 입력 (선택)'}
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: 'oklch(0.75 0.01 250)' }}>-</span>
                          )
                        )}
                      </td>

                      {/* 알림 */}
                      <td className="px-4 py-3" style={{ width: 140 }}>
                        {isNotifyTarget ? (
                          rec.notified ? (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.5 0.15 160)' }}>
                              <Send size={11} />
                              <span>{rec.notifyChannel}</span>
                              {rec.notifyTime && <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>{rec.notifyTime}</span>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>미발송</span>
                              {currentSession.isLocked && (
                                <button
                                  onClick={() => handleResendNotify(currentSession.id, stu.id, stu.name)}
                                  className="text-xs flex items-center gap-0.5 underline"
                                  style={{ color: 'oklch(0.511 0.262 276.966)' }}
                                >
                                  <RefreshCw size={10} /> 재발송
                                </button>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-xs" style={{ color: 'oklch(0.8 0.01 250)' }}>-</span>
                        )}
                      </td>

                      {/* 메모 */}
                      <td className="px-4 py-3" style={{ width: 40 }}>
                        {rec.note && (
                          <div title={rec.note} className="cursor-help">
                            <MessageSquare size={13} style={{ color: 'oklch(0.65 0.01 250)' }} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {enrolledStudents.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                수강생이 없습니다.
              </div>
            )}
          </div>
        </>
      )}

      {/* 사유 입력 모달 */}
      <Dialog open={!!reasonModal} onOpenChange={open => !open && setReasonModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {reasonModal?.studentName} - {reasonModal?.status} 사유
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">
                사유 {reasonModal?.status === '결석' ? <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>(필수)</span> : '(선택)'}
              </Label>
              <Textarea
                value={reasonInput}
                onChange={e => setReasonInput(e.target.value)}
                placeholder={reasonModal?.status === '결석' ? '결석 사유를 입력하세요' : '사유를 입력하세요 (선택)'}
                className="text-sm resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">메모 (선택)</Label>
              <Textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="내부 메모 (보호자에게 발송되지 않음)"
                className="text-sm resize-none"
                rows={2}
              />
            </div>
            {reasonModal && NOTIFY_STATUSES.includes(reasonModal.status) && (
              <div className="flex items-start gap-2 p-2.5 rounded text-xs" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.38 0.18 250)' }}>
                <Send size={11} className="mt-0.5 flex-shrink-0" />
                체크 완료 시 보호자에게 카카오 알림톡이 자동 발송됩니다.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReasonModal(null)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={handleReasonSave} className="h-8 text-xs" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
