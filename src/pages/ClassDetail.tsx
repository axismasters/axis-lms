// AXIS LMS v1.2 - 반 상세 페이지
// Design: Structured Authority
// 탭: 수강생 목록 / 시간표 / 정원 현황

import { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { ClassRoom, DAY_ORDER } from '@/lib/classData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ClassFormModal from '@/components/ClassFormModal';
import {
  Edit2, Trash2, Users, Clock, BookOpen, ChevronLeft,
  Plus, UserMinus, AlertCircle, Calendar, DollarSign,
  GraduationCap, Phone, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'students' | 'schedule' | 'capacity';

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  '운영중': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.32 0.15 160)' },
  '개설예정': { bg: 'oklch(0.95 0.06 250)', text: 'oklch(0.35 0.18 250)' },
  '종강': { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.5 0.015 250)' },
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '수학': { bg: 'oklch(0.95 0.04 250)', text: 'oklch(0.35 0.18 250)', border: 'oklch(0.85 0.08 250)' },
  '영어': { bg: 'oklch(0.95 0.05 160)', text: 'oklch(0.32 0.15 160)', border: 'oklch(0.85 0.08 160)' },
  '국어': { bg: 'oklch(0.95 0.05 30)', text: 'oklch(0.38 0.12 30)', border: 'oklch(0.85 0.08 30)' },
  '과학': { bg: 'oklch(0.95 0.04 200)', text: 'oklch(0.35 0.12 200)', border: 'oklch(0.85 0.07 200)' },
  '기타': { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.45 0.015 250)', border: 'oklch(0.9 0.005 250)' },
};

const STUDENT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  '재원': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.32 0.15 160)' },
  '휴원': { bg: 'oklch(0.95 0.06 60)', text: 'oklch(0.45 0.12 60)' },
  '퇴원': { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.5 0.015 250)' },
  '대기': { bg: 'oklch(0.95 0.06 250)', text: 'oklch(0.35 0.18 250)' },
};

// 주간 시간표 그리드 컴포넌트
function WeeklySchedule({ cls }: { cls: ClassRoom }) {
  const activeDays = Array.from(new Set(cls.timeSlots.map(ts => ts.day)));
  const displayDays = DAY_ORDER.filter(d => activeDays.includes(d));

  // 시간 범위 계산
  const allTimes = cls.timeSlots.flatMap(ts => [ts.startTime, ts.endTime]);
  const minHour = allTimes.length > 0
    ? Math.max(9, Math.min(...allTimes.map(t => parseInt(t))) - 1)
    : 9;
  const maxHour = allTimes.length > 0
    ? Math.min(23, Math.max(...allTimes.map(t => parseInt(t))) + 1)
    : 22;

  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  const getSlotStyle = (day: string, hour: number) => {
    const match = cls.timeSlots.find(ts => {
      const sh = parseInt(ts.startTime);
      const eh = parseInt(ts.endTime);
      return ts.day === day && hour >= sh && hour < eh;
    });
    if (!match) return null;
    const isStart = parseInt(match.startTime) === hour;
    return { match, isStart };
  };

  const subjectColor = SUBJECT_COLORS[cls.subject] || SUBJECT_COLORS['기타'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-96">
        {/* 헤더 */}
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${displayDays.length}, 1fr)` }}>
          <div className="p-2" />
          {displayDays.map(day => (
            <div key={day} className="p-2 text-center text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)' }}>
              {day}요일
            </div>
          ))}
        </div>

        {/* 시간 그리드 */}
        {hours.map(hour => (
          <div key={hour} className="grid" style={{ gridTemplateColumns: `60px repeat(${displayDays.length}, 1fr)`, borderTop: '1px solid oklch(0.94 0.003 250)' }}>
            <div className="px-2 py-1.5 text-xs text-right" style={{ color: 'oklch(0.65 0.01 250)' }}>
              {String(hour).padStart(2, '0')}:00
            </div>
            {displayDays.map(day => {
              const slot = getSlotStyle(day, hour);
              return (
                <div key={day} className="relative min-h-8">
                  {slot && (
                    <div
                      className="absolute inset-x-1 inset-y-0.5 rounded flex items-center justify-center"
                      style={{ background: subjectColor.bg, border: `1px solid ${subjectColor.border}` }}
                    >
                      {slot.isStart && (
                        <span className="text-xs font-semibold" style={{ color: subjectColor.text }}>
                          {cls.subject}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClassDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { getClass, deleteClass, removeStudentFromClass, addStudentToClass } = useClasses();
  const { students } = useStudents();

  const searchStr = typeof window !== 'undefined' ? window.location.search : '';
  const urlTab = new URLSearchParams(searchStr).get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(urlTab || 'students');

  const [formModal, setFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const cls = getClass(params.id);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab') as TabKey | null;
    if (tab) setActiveTab(tab);
  }, []);

  if (!cls) {
    return (
      <AdminLayout breadcrumbs={[{ label: '수업관리' }, { label: '반 목록', path: '/classes' }, { label: '반 없음' }]}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <BookOpen size={40} style={{ color: 'oklch(0.8 0.01 250)' }} />
          <p style={{ color: 'oklch(0.5 0.015 250)' }}>존재하지 않는 반입니다.</p>
          <Button variant="outline" onClick={() => navigate('/classes')}>반 목록으로</Button>
        </div>
      </AdminLayout>
    );
  }

  // 수강생 목록 (ClassContext의 studentClassMap 기반)
  const { getClassStudents } = useClasses();
  const enrolledIds = getClassStudents(cls.id);
  const enrolledStudents = students.filter(s => enrolledIds.includes(s.id));

  // 추가 가능한 학생 (현재 미수강 + 재원)
  const availableStudents = students.filter(
    s => !enrolledIds.includes(s.id) && s.status === '재원'
  );

  const isFull = cls.enrolledCount >= cls.capacity;
  const fillRate = cls.capacity > 0 ? Math.round((cls.enrolledCount / cls.capacity) * 100) : 0;
  const subjectColor = SUBJECT_COLORS[cls.subject] || SUBJECT_COLORS['기타'];
  const statusStyle = STATUS_STYLE[cls.status];

  const handleDeleteClass = () => {
    deleteClass(cls.id);
    toast.success(`'${cls.name}' 반이 삭제되었습니다.`);
    navigate('/classes');
  };

  const handleRemoveStudent = () => {
    if (!removeTarget) return;
    removeStudentFromClass(cls.id, removeTarget);
    const s = students.find(s => s.id === removeTarget);
    toast.success(`${s?.name || '수강생'}이 반에서 제외되었습니다.`);
    setRemoveTarget(null);
  };

  const handleAddStudent = () => {
    if (!selectedStudentId) return;
    // 정원 초과 시 경고만 표시 (자동 차단 안 함 - 담당자가 직접 관리)
    if (isFull) { toast.warning('정원이 초과됩니다. 정원을 확인해주세요.'); }
    addStudentToClass(cls.id, selectedStudentId);
    const s = students.find(s => s.id === selectedStudentId);
    toast.success(`${s?.name || '수강생'}이 반에 추가되었습니다.`);
    setSelectedStudentId('');
    setAddStudentDialog(false);
  };

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'students', label: '수강생 목록', icon: <Users size={13} /> },
    { key: 'schedule', label: '시간표', icon: <Clock size={13} /> },
    { key: 'capacity', label: '정원 현황', icon: <GraduationCap size={13} /> },
  ];

  return (
    <AdminLayout breadcrumbs={[
      { label: '수업관리' },
      { label: '반 목록', path: '/classes' },
      { label: cls.name },
    ]}>
      {/* 반 헤더 카드 */}
      <div className="axis-card p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* 과목 아이콘 */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-base"
              style={{ background: subjectColor.bg, color: subjectColor.text, border: `1px solid ${subjectColor.border}` }}>
              {cls.subject[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>{cls.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                  {cls.status}
                </span>
                {isFull && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'oklch(0.97 0.06 27)', color: 'oklch(0.45 0.15 27)' }}>
                    정원 마감
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-sm flex-wrap" style={{ color: 'oklch(0.55 0.015 250)' }}>
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'oklch(0.55 0.15 250)' }}>
                    {cls.teacher[0]}
                  </div>
                  {cls.teacher}
                </span>
                <span>·</span>
                <span>{cls.subject} · {cls.level}</span>
                {cls.room && <><span>·</span><span>{cls.room}</span></>}
                <span>·</span>
                <span>개강 {cls.startDate}</span>
              </div>
              {cls.description && (
                <p className="text-xs mt-1.5" style={{ color: 'oklch(0.6 0.015 250)' }}>{cls.description}</p>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setFormModal(true)} className="h-8 text-xs gap-1.5">
              <Edit2 size={12} /> 수정
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog(true)} className="h-8 text-xs gap-1.5 hover:bg-rose-50 hover:border-rose-200" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
              <Trash2 size={12} /> 삭제
            </Button>
          </div>
        </div>

        {/* 정원 바 */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'oklch(0.93 0.005 250)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>수강생 현황</span>
            <span className="text-xs font-bold" style={{ color: isFull ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.3 0.015 250)' }}>
              {cls.enrolledCount} / {cls.capacity}명 ({fillRate}%)
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${fillRate}%`,
                background: isFull ? 'oklch(0.577 0.245 27.325)' : fillRate >= 80 ? 'oklch(0.7 0.18 60)' : 'oklch(0.511 0.262 276.966)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="axis-card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-5 py-3 text-xs font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key ? 'border-indigo-600' : 'border-transparent hover:border-slate-200'
              )}
              style={{ color: activeTab === tab.key ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.55 0.015 250)' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── 탭 1: 수강생 목록 ── */}
          {activeTab === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.015 250)' }}>
                  수강생 {enrolledStudents.length}명
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddStudentDialog(true)}
                  className="h-8 text-xs gap-1.5"
                  style={{ background: 'oklch(0.511 0.262 276.966)' }}
                >
                  <Plus size={12} /> 수강생 추가
                  {isFull && <span className="ml-1 text-xs" style={{ color: 'oklch(0.97 0.06 27)' }}>(정원초과)</span>}
                </Button>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="text-center py-12 rounded-lg" style={{ background: 'oklch(0.985 0.003 250)', border: '2px dashed oklch(0.9 0.005 250)' }}>
                  <Users size={28} style={{ color: 'oklch(0.8 0.01 250)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>수강생이 없습니다.</p>
                  <Button variant="outline" size="sm" onClick={() => setAddStudentDialog(true)} className="mt-3 h-7 text-xs gap-1">
                    <Plus size={11} /> 수강생 추가
                  </Button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid oklch(0.92 0.005 250)', background: 'oklch(0.985 0.003 250)' }}>
                      {['#', '학생명', '휴대폰번호', '상태', '보호자', '관리'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((stu, idx) => {
                      const stuStatus = STUDENT_STATUS_STYLE[stu.status] || STUDENT_STATUS_STYLE['재원'];
                      return (
                        <tr key={stu.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                          <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                                {stu.name[0]}
                              </div>
                              <button
                                onClick={() => navigate(`/students/${stu.id}`)}
                                className="font-medium hover:underline text-left"
                                style={{ color: 'oklch(0.511 0.262 276.966)' }}
                              >
                                {stu.name}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.45 0.015 250)' }}>
                            <div className="flex items-center gap-1">
                              <Phone size={10} />
                              {stu.phone}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: stuStatus.bg, color: stuStatus.text }}>
                              {stu.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                            {stu.guardians.length > 0
                              ? `${stu.guardians[0].name} (${stu.guardians[0].relation})`
                              : '-'}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setRemoveTarget(stu.id)}
                              className="p-1.5 rounded hover:bg-rose-50 transition-colors"
                              title="수강 제외"
                            >
                              <UserMinus size={13} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
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

          {/* ── 탭 2: 시간표 ── */}
          {activeTab === 'schedule' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.015 250)' }}>
                  주간 시간표
                </div>
                <Button variant="outline" size="sm" onClick={() => setFormModal(true)} className="h-7 text-xs gap-1">
                  <Edit2 size={11} /> 시간표 수정
                </Button>
              </div>

              {cls.timeSlots.length === 0 ? (
                <div className="text-center py-12 rounded-lg" style={{ background: 'oklch(0.985 0.003 250)', border: '2px dashed oklch(0.9 0.005 250)' }}>
                  <Clock size={28} style={{ color: 'oklch(0.8 0.01 250)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>등록된 시간표가 없습니다.</p>
                </div>
              ) : (
                <>
                  {/* 시간표 슬롯 요약 */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {[...cls.timeSlots]
                      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
                      .map(ts => {
                        const [sh, sm] = ts.startTime.split(':').map(Number);
                        const [eh, em] = ts.endTime.split(':').map(Number);
                        const mins = (eh * 60 + em) - (sh * 60 + sm);
                        const duration = `${Math.floor(mins / 60)}시간${mins % 60 > 0 ? ` ${mins % 60}분` : ''}`;
                        return (
                          <div key={ts.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: subjectColor.bg, border: `1px solid ${subjectColor.border}` }}>
                            <Clock size={12} style={{ color: subjectColor.text }} />
                            <span className="text-xs font-semibold" style={{ color: subjectColor.text }}>
                              {ts.day}요일 {ts.startTime} ~ {ts.endTime}
                            </span>
                            <span className="text-xs" style={{ color: subjectColor.text, opacity: 0.7 }}>({duration})</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* 주간 그리드 */}
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid oklch(0.92 0.005 250)' }}>
                    <WeeklySchedule cls={cls} />
                  </div>

                  {/* 주간 수업 시간 합계 */}
                  <div className="mt-3 text-xs text-right" style={{ color: 'oklch(0.6 0.015 250)' }}>
                    주간 총 수업 시간: {(() => {
                      const total = cls.timeSlots.reduce((sum, ts) => {
                        const [sh, sm] = ts.startTime.split(':').map(Number);
                        const [eh, em] = ts.endTime.split(':').map(Number);
                        return sum + (eh * 60 + em) - (sh * 60 + sm);
                      }, 0);
                      return `${Math.floor(total / 60)}시간 ${total % 60 > 0 ? `${total % 60}분` : ''}`;
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── 탭 3: 정원 현황 ── */}
          {activeTab === 'capacity' && (
            <div>
              <div className="text-sm font-semibold mb-4" style={{ color: 'oklch(0.3 0.015 250)' }}>정원 현황</div>

              {/* 정원 요약 카드들 */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: '최대 정원', value: `${cls.capacity}명`, color: 'oklch(0.511 0.262 276.966)' },
                  { label: '현재 수강생', value: `${cls.enrolledCount}명`, color: isFull ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.5 0.15 160)' },
                  { label: '잔여 자리', value: `${Math.max(0, cls.capacity - cls.enrolledCount)}명`, color: 'oklch(0.5 0.015 250)' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-lg text-center" style={{ background: 'oklch(0.985 0.003 250)', border: '1px solid oklch(0.92 0.005 250)' }}>
                    <div className="text-xs mb-1" style={{ color: 'oklch(0.6 0.015 250)' }}>{item.label}</div>
                    <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* 충원율 바 */}
              <div className="p-4 rounded-lg mb-5" style={{ background: 'oklch(0.985 0.003 250)', border: '1px solid oklch(0.92 0.005 250)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)' }}>충원율</span>
                  <span className="text-sm font-bold" style={{ color: isFull ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.511 0.262 276.966)' }}>
                    {fillRate}%
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${fillRate}%`,
                      background: isFull ? 'oklch(0.577 0.245 27.325)' : fillRate >= 80 ? 'oklch(0.7 0.18 60)' : 'oklch(0.511 0.262 276.966)',
                    }}
                  />
                </div>
                {isFull && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
                    <AlertCircle size={12} />
                    정원이 마감되었습니다. 수강생 추가가 불가합니다.
                  </div>
                )}
              </div>

              {/* 자리 시각화 */}
              <div className="p-4 rounded-lg mb-5" style={{ background: 'oklch(0.985 0.003 250)', border: '1px solid oklch(0.92 0.005 250)' }}>
                <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.4 0.015 250)' }}>자리 현황</div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: cls.capacity }).map((_, i) => {
                    const occupied = i < cls.enrolledCount;
                    return (
                      <div
                        key={i}
                        className="w-7 h-7 rounded flex items-center justify-center text-xs font-medium"
                        title={occupied ? `${i + 1}번 (수강중)` : `${i + 1}번 (빈 자리)`}
                        style={{
                          background: occupied ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.92 0.005 250)',
                          color: occupied ? 'white' : 'oklch(0.7 0.01 250)',
                        }}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: 'oklch(0.511 0.262 276.966)' }} />
                    수강중 ({cls.enrolledCount}명)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: 'oklch(0.92 0.005 250)' }} />
                    빈 자리 ({Math.max(0, cls.capacity - cls.enrolledCount)}명)
                  </div>
                </div>
              </div>

              {/* 수강료 정보 */}
              {cls.fee && cls.fee > 0 && (
                <div className="p-4 rounded-lg" style={{ background: 'oklch(0.97 0.04 250)', border: '1px solid oklch(0.9 0.06 250)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'oklch(0.4 0.12 250)' }}>수강료 현황</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div style={{ color: 'oklch(0.55 0.015 250)' }}>월 수강료</div>
                      <div className="font-bold mt-0.5" style={{ color: 'oklch(0.3 0.015 250)' }}>{cls.fee.toLocaleString()}원</div>
                    </div>
                    <div>
                      <div style={{ color: 'oklch(0.55 0.015 250)' }}>현재 월 매출</div>
                      <div className="font-bold mt-0.5" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                        {(cls.enrolledCount * cls.fee).toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'oklch(0.55 0.015 250)' }}>정원 마감 시 매출</div>
                      <div className="font-bold mt-0.5" style={{ color: 'oklch(0.5 0.15 160)' }}>
                        {(cls.capacity * cls.fee).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 반 수정 모달 */}
      <ClassFormModal open={formModal} editId={cls.id} onClose={() => setFormModal(false)} />

      {/* 반 삭제 확인 */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>반 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>'{cls.name}'</strong> 반을 삭제하시겠습니까?<br />
              수강생 {cls.enrolledCount}명의 수강 이력이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} style={{ background: 'oklch(0.577 0.245 27.325)' }}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 수강생 제외 확인 */}
      <AlertDialog open={!!removeTarget} onOpenChange={open => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수강생 제외</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{students.find(s => s.id === removeTarget)?.name}</strong> 학생을 이 반에서 제외하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveStudent} style={{ background: 'oklch(0.577 0.245 27.325)' }}>제외</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 수강생 추가 다이얼로그 */}
      <Dialog open={addStudentDialog} onOpenChange={setAddStudentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">수강생 추가</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs mb-3" style={{ color: 'oklch(0.55 0.015 250)' }}>
              현재 재원 중이며 이 반에 미등록된 학생만 표시됩니다.
            </p>
            {availableStudents.length === 0 ? (
              <div className="text-center py-6 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                추가 가능한 학생이 없습니다.
              </div>
            ) : (
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="학생 선택" /></SelectTrigger>
                <SelectContent>
                  {availableStudents.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddStudentDialog(false)} className="h-8 text-xs">취소</Button>
            <Button size="sm" onClick={handleAddStudent} disabled={!selectedStudentId} className="h-8 text-xs" style={{ background: 'oklch(0.511 0.262 276.966)' }}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
