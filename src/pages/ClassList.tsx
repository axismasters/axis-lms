// AXIS LMS v1.2 - 반 목록
// Design: Structured Authority

import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useClasses } from '@/contexts/ClassContext';
import { ClassRoom, ClassStatus, SubjectType, TEACHERS, DAY_ORDER } from '@/lib/classData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ClassFormModal from '@/components/ClassFormModal';
import {
  Plus, Search, Eye, Edit2, Trash2, BookOpen,
  Users, Clock, ChevronRight, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '수학': { bg: 'oklch(0.95 0.04 250)', text: 'oklch(0.35 0.18 250)', border: 'oklch(0.85 0.08 250)' },
  '영어': { bg: 'oklch(0.95 0.05 160)', text: 'oklch(0.32 0.15 160)', border: 'oklch(0.85 0.08 160)' },
  '국어': { bg: 'oklch(0.95 0.05 30)', text: 'oklch(0.38 0.12 30)', border: 'oklch(0.85 0.08 30)' },
  '과학': { bg: 'oklch(0.95 0.04 200)', text: 'oklch(0.35 0.12 200)', border: 'oklch(0.85 0.07 200)' },
  '사회': { bg: 'oklch(0.95 0.04 320)', text: 'oklch(0.38 0.12 320)', border: 'oklch(0.85 0.07 320)' },
  '한국사': { bg: 'oklch(0.95 0.04 60)', text: 'oklch(0.38 0.1 60)', border: 'oklch(0.85 0.07 60)' },
  '기타': { bg: 'oklch(0.96 0.005 250)', text: 'oklch(0.45 0.015 250)', border: 'oklch(0.9 0.005 250)' },
};

const STATUS_STYLE: Record<ClassStatus, { bg: string; text: string }> = {
  '운영중': { bg: 'oklch(0.94 0.08 160)', text: 'oklch(0.32 0.15 160)' },
  '개설예정': { bg: 'oklch(0.95 0.06 250)', text: 'oklch(0.35 0.18 250)' },
  '종강': { bg: 'oklch(0.95 0.005 250)', text: 'oklch(0.5 0.015 250)' },
};

function formatSchedule(timeSlots: ClassRoom['timeSlots']) {
  if (!timeSlots.length) return '-';
  const sorted = [...timeSlots].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const grouped: Record<string, string[]> = {};
  sorted.forEach(ts => {
    const time = `${ts.startTime}~${ts.endTime}`;
    if (!grouped[time]) grouped[time] = [];
    grouped[time].push(ts.day);
  });
  return Object.entries(grouped)
    .map(([time, days]) => `${days.join('')} ${time}`)
    .join(' / ');
}

function CapacityBar({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0;
  const isFull = enrolled >= capacity;
  const isNearFull = pct >= 80;
  const barColor = isFull
    ? 'oklch(0.577 0.245 27.325)'
    : isNearFull
    ? 'oklch(0.7 0.18 60)'
    : 'oklch(0.511 0.262 276.966)';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.92 0.005 250)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{
        color: isFull ? 'oklch(0.577 0.245 27.325)' : isNearFull ? 'oklch(0.6 0.15 60)' : 'oklch(0.4 0.015 250)'
      }}>
        {enrolled}/{capacity}
      </span>
    </div>
  );
}

export default function ClassList() {
  const [, navigate] = useLocation();
  const { classes, deleteClass } = useClasses();

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  // AdminLayout의 "반 등록" 메뉴는 /classes?new=1로 진입한다(별도 /classes/new 페이지 없음).
  const [formModal, setFormModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<ClassRoom | null>(null);

  // ClassList는 /classes에 머무는 동안 사이드바의 "반 등록"(→ /classes?new=1)을 다시 눌러도
  // 컴포넌트가 재마운트되지 않으므로, useState lazy initializer만으로는 두 번째 진입을 감지하지 못한다.
  // wouter의 useSearch()는 쿼리스트링이 바뀔 때마다 새 값을 반환하므로, 이를 의존성으로 둔 useEffect로
  // new=1 변화를 감지해 모달을 연다(최초 마운트 시에도 이 effect가 1회 실행되어 기존 동작을 그대로 포함한다).
  const searchStr = useSearch();
  useEffect(() => {
    const sp = new URLSearchParams(searchStr);
    if (sp.get('new') !== '1') return;
    // 이미 수정 모달(editId 있음)이 열려 있는 상태라면 new=1 처리로 덮어쓰지 않는다(충돌 방지).
    setFormModal(prev => (prev.open && prev.editId ? prev : { open: true, editId: undefined }));
  }, [searchStr]);

  const filtered = useMemo(() => {
    return classes.filter(c => {
      if (search && !c.name.includes(search) && !c.teacher.includes(search)) return false;
      if (filterSubject !== 'all' && c.subject !== filterSubject) return false;
      if (filterTeacher !== 'all' && c.teacher !== filterTeacher) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterLevel !== 'all' && c.level !== filterLevel) return false;
      return true;
    });
  }, [classes, search, filterSubject, filterTeacher, filterStatus, filterLevel]);

  // 요약 통계
  const stats = useMemo(() => ({
    total: classes.length,
    active: classes.filter(c => c.status === '운영중').length,
    totalEnrolled: classes.reduce((s, c) => s + c.enrolledCount, 0),
    totalCapacity: classes.reduce((s, c) => s + c.capacity, 0),
    full: classes.filter(c => c.enrolledCount >= c.capacity && c.status === '운영중').length,
  }), [classes]);

  // 등록/수정 모달 닫기 — state를 초기화하고, ?new=1로 진입했던 URL이라면 /classes로 정리한다.
  // replace로 이동해 뒤로가기 시 모달이 다시 열리는 히스토리 엔트리가 남지 않도록 한다.
  const closeFormModal = () => {
    setFormModal({ open: false });
    const sp = new URLSearchParams(searchStr);
    if (sp.get('new') === '1') {
      navigate('/classes', { replace: true });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClass(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(`'${deleteTarget.name}' 반이 삭제되었습니다.`);
  };

  const subjectList = Array.from(new Set(classes.map(c => c.subject)));
  const levelList = Array.from(new Set(classes.map(c => c.level)));

  return (
      <AdminLayout breadcrumbs={[{ label: '수업관리' }, { label: '반 목록' }]}>
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>반 목록</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            전체 {stats.total}개 · 운영중 {stats.active}개 · 수강생 {stats.totalEnrolled}명
          </p>
        </div>
        <Button
          onClick={() => setFormModal({ open: true })}
          className="gap-2 text-sm font-semibold h-9"
          style={{ background: 'oklch(0.511 0.262 276.966)' }}
        >
          <Plus size={15} /> 반 개설
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: '전체 반', value: stats.total, sub: `운영중 ${stats.active}개`, color: 'oklch(0.511 0.262 276.966)' },
          { label: '총 수강생', value: stats.totalEnrolled, sub: `정원 ${stats.totalCapacity}명`, color: 'oklch(0.5 0.15 160)' },
          { label: '정원 마감', value: stats.full, sub: '운영중 기준', color: 'oklch(0.577 0.245 27.325)' },
          { label: '평균 충원율', value: `${stats.totalCapacity > 0 ? Math.round((stats.totalEnrolled / stats.totalCapacity) * 100) : 0}%`, sub: '운영중 반 기준', color: 'oklch(0.6 0.15 60)' },
        ].map((s, i) => (
          <div key={i} className="axis-card p-4">
            <div className="text-xs font-medium mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.01 250)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="반 이름 또는 강사 검색"
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="과목" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">과목 전체</SelectItem>
              {subjectList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTeacher} onValueChange={setFilterTeacher}>
            <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="강사" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">강사 전체</SelectItem>
              {TEACHERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="h-8 text-xs w-24"><SelectValue placeholder="수준" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">수준 전체</SelectItem>
              {levelList.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">상태 전체</SelectItem>
              <SelectItem value="운영중">운영중</SelectItem>
              <SelectItem value="개설예정">개설예정</SelectItem>
              <SelectItem value="종강">종강</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs ml-auto" style={{ color: 'oklch(0.6 0.015 250)' }}>
            검색 결과 {filtered.length}개
          </span>
        </div>
      </div>

      {/* 반 목록 테이블 */}
      <div className="axis-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} style={{ color: 'oklch(0.8 0.01 250)' }} />
            <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>조건에 맞는 반이 없습니다.</p>
            <Button variant="outline" size="sm" onClick={() => setFormModal({ open: true })}>반 개설하기</Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid oklch(0.92 0.005 250)', background: 'oklch(0.985 0.003 250)' }}>
                {['반 이름', '과목 / 수준', '담당 강사', '시간표', '정원 현황', '강의실', '상태', '관리'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(cls => {
                const subjectColor = SUBJECT_COLORS[cls.subject] || SUBJECT_COLORS['기타'];
                const statusStyle = STATUS_STYLE[cls.status];
                const isFull = cls.enrolledCount >= cls.capacity;

                return (
                  <tr
                    key={cls.id}
                    className="axis-table-row border-b cursor-pointer"
                    style={{ borderColor: 'oklch(0.95 0.003 250)' }}
                    onClick={() => navigate(`/classes/${cls.id}`)}
                  >
                    {/* 반 이름 */}
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'oklch(0.15 0.02 250)' }}>{cls.name}</div>
                      {cls.description && (
                        <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
                          {cls.description}
                        </div>
                      )}
                    </td>

                    {/* 과목 / 수준 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                          background: subjectColor.bg,
                          color: subjectColor.text,
                          border: `1px solid ${subjectColor.border}`,
                        }}>
                          {cls.subject}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.003 250)', color: 'oklch(0.5 0.015 250)' }}>
                          {cls.level}
                        </span>
                      </div>
                    </td>

                    {/* 강사 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'oklch(0.55 0.15 250)' }}>
                          {cls.teacher[0]}
                        </div>
                        <span className="text-sm" style={{ color: 'oklch(0.3 0.015 250)' }}>{cls.teacher}</span>
                      </div>
                    </td>

                    {/* 시간표 */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1.5">
                        <Clock size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.6 0.015 250)' }} />
                        <span className="text-xs" style={{ color: 'oklch(0.4 0.015 250)', lineHeight: 1.5 }}>
                          {formatSchedule(cls.timeSlots)}
                        </span>
                      </div>
                    </td>

                    {/* 정원 현황 */}
                    <td className="px-4 py-3 min-w-28">
                      {isFull && (
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle size={10} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
                          <span className="text-xs font-medium" style={{ color: 'oklch(0.577 0.245 27.325)' }}>정원 마감</span>
                        </div>
                      )}
                      <CapacityBar enrolled={cls.enrolledCount} capacity={cls.capacity} />
                    </td>

                    {/* 강의실 */}
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{cls.room || '-'}</span>
                    </td>

                    {/* 상태 */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}>
                        {cls.status}
                      </span>
                    </td>

                    {/* 관리 버튼 */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/classes/${cls.id}`)}
                          className="p-1.5 rounded transition-colors hover:bg-indigo-50"
                          title="상세보기"
                        >
                          <Eye size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                        </button>
                        <button
                          onClick={() => setFormModal({ open: true, editId: cls.id })}
                          className="p-1.5 rounded transition-colors hover:bg-slate-100"
                          title="수정"
                        >
                          <Edit2 size={14} style={{ color: 'oklch(0.55 0.015 250)' }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cls)}
                          className="p-1.5 rounded transition-colors hover:bg-rose-50"
                          title="삭제"
                        >
                          <Trash2 size={14} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 반 생성/수정 모달 */}
      <ClassFormModal
        open={formModal.open}
        editId={formModal.editId}
        onClose={closeFormModal}
      />

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>반 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>'{deleteTarget?.name}'</strong> 반을 삭제하시겠습니까?<br />
              수강생 {deleteTarget?.enrolledCount}명의 수강 이력이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: 'oklch(0.577 0.245 27.325)' }}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
