// AXIS LMS v1.2 - 반 목록
// Design: Structured Authority

import { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
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
    : '#040D1E';

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
  const { canAccessClass } = useAuth();
  const { classes, deleteClass } = useClasses();
  const { getActiveEnrollmentsByClass } = useEnrollment();

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

  // 권한 범위(F항목): 강사는 본인 담당 반만 본다. 최고관리자/원장/행정은 canAccessClass가
  // 항상 true(ALL_ACADEMY)이므로 기존처럼 전체 반이 그대로 보인다.
  const visibleClasses = useMemo(() => classes.filter((c) => canAccessClass(c.id)), [classes, canAccessClass]);

  // 현재인원(E항목): ClassRoom.enrolledCount(하드코딩 필드) 대신, status가 '수강중'인 Enrollment 수로
  // 계산한다. 매 렌더마다 함수 호출이 반복되지 않도록 반 id별로 한 번만 계산해 Map에 담아 재사용한다.
  const currentCounts = useMemo(() => {
    const map = new Map<string, number>();
    visibleClasses.forEach((c) => map.set(c.id, getActiveEnrollmentsByClass(c.id).length));
    return map;
  }, [visibleClasses, getActiveEnrollmentsByClass]);
  const countOf = (classId: string) => currentCounts.get(classId) ?? 0;

  const filtered = useMemo(() => {
    return visibleClasses.filter(c => {
      if (search && !c.name.includes(search) && !c.teacher.includes(search)) return false;
      if (filterSubject !== 'all' && c.subject !== filterSubject) return false;
      if (filterTeacher !== 'all' && c.teacher !== filterTeacher) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterLevel !== 'all' && c.level !== filterLevel) return false;
      return true;
    });
  }, [visibleClasses, search, filterSubject, filterTeacher, filterStatus, filterLevel]);

  // 요약 통계
  const stats = useMemo(() => ({
    total: visibleClasses.length,
    active: visibleClasses.filter(c => c.status === '운영중').length,
    totalEnrolled: visibleClasses.reduce((s, c) => s + countOf(c.id), 0),
    totalCapacity: visibleClasses.reduce((s, c) => s + c.capacity, 0),
    full: visibleClasses.filter(c => countOf(c.id) >= c.capacity && c.status === '운영중').length,
  }), [visibleClasses, currentCounts]);

  // 등록/수정 모달 닫기 — state를 초기화하고, ?new=1로 진입했던 URL이라면 /classes로 정리한다.
  // replace로 이동해 뒤로가기 시 모달이 다시 열리는 히스토리 엔트리가 남지 않도록 한다.
  const closeFormModal = () => {
    setFormModal({ open: false });
    const sp = new URLSearchParams(searchStr);
    if (sp.get('new') === '1') {
      navigate('/admin/classes', { replace: true });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    // AXIS 정책: 수강 이력은 삭제하지 않으며, 활성 수강생이 있는 반은 삭제할 수 없다.
    // 먼저 수강 종료 또는 퇴원 처리(Enrollment status 변경)를 해야 currentCount가 0이 된다.
    if (countOf(deleteTarget.id) > 0) {
      toast.error('현재 수강생이 있는 반은 삭제할 수 없습니다. 먼저 수강 종료 또는 퇴원 처리를 해주세요.');
      setDeleteTarget(null);
      return;
    }
    deleteClass(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(`'${deleteTarget.name}' 반이 삭제되었습니다.`);
  };

  const subjectList = Array.from(new Set(visibleClasses.map(c => c.subject)));
  const levelList = Array.from(new Set(visibleClasses.map(c => c.level)));

  return (
      <AdminLayout breadcrumbs={[{ label: '반관리' }, { label: '반 목록' }]}>
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>반 목록</h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.42 0.015 250)' }}>
            전체 {stats.total}개 · 운영중 {stats.active}개 · 수강생 {stats.totalEnrolled}명
          </p>
        </div>
        <Button
          onClick={() => setFormModal({ open: true })}
          className="gap-2 text-sm font-semibold h-9"
          style={{ background: '#040D1E' }}
        >
          <Plus size={15} /> 반 개설
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: '전체 반', value: stats.total, sub: `운영중 ${stats.active}개`, color: '#040D1E' },
          { label: '총 수강생', value: stats.totalEnrolled, sub: `정원 ${stats.totalCapacity}명`, color: 'oklch(0.4 0.15 160)' },
          { label: '정원 마감', value: stats.full, sub: '운영중 기준', color: 'oklch(0.447 0.245 27.325)' },
          { label: '평균 충원율', value: `${stats.totalCapacity > 0 ? Math.round((stats.totalEnrolled / stats.totalCapacity) * 100) : 0}%`, sub: '운영중 반 기준', color: 'oklch(0.47 0.15 60)' },
        ].map((s, i) => (
          <div key={i} className="axis-card p-4">
            <div className="text-xs font-medium mb-1" style={{ color: 'oklch(0.42 0.015 250)' }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.49 0.01 250)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="axis-card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.49 0.01 250)' }} />
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
          <span className="text-xs ml-auto" style={{ color: 'oklch(0.47 0.015 250)' }}>
            검색 결과 {filtered.length}개
          </span>
        </div>
      </div>

      {/* 반 목록 테이블 */}
      <div className="axis-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} style={{ color: 'oklch(0.8 0.01 250)' }} />
            <p className="text-sm" style={{ color: 'oklch(0.47 0.015 250)' }}>조건에 맞는 반이 없습니다.</p>
            <Button variant="outline" size="sm" onClick={() => setFormModal({ open: true })}>반 개설하기</Button>
          </div>
        ) : (
          <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
          <table className="w-full text-sm" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid oklch(0.92 0.005 250)', background: 'oklch(0.985 0.003 250)' }}>
                {['반 이름', '과목 / 수준', '담당 강사', '시간표', '정원 현황', '강의실', '상태', '관리'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'oklch(0.4 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(cls => {
                const subjectColor = SUBJECT_COLORS[cls.subject] || SUBJECT_COLORS['기타'];
                const statusStyle = STATUS_STYLE[cls.status];
                const enrolledNow = countOf(cls.id);
                const isFull = enrolledNow >= cls.capacity;

                return (
                  <tr
                    key={cls.id}
                    className="axis-table-row border-b cursor-pointer"
                    style={{ borderColor: 'oklch(0.95 0.003 250)' }}
                    onClick={() => navigate(`/admin/classes/${cls.id}`)}
                  >
                    {/* 반 이름 */}
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'oklch(0.15 0.02 250)' }}>{cls.name}</div>
                      {cls.description && (
                        <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'oklch(0.47 0.015 250)' }}>
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
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.96 0.003 250)', color: 'oklch(0.4 0.015 250)' }}>
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
                        <Clock size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.47 0.015 250)' }} />
                        <span className="text-xs" style={{ color: 'oklch(0.4 0.015 250)', lineHeight: 1.5 }}>
                          {formatSchedule(cls.timeSlots)}
                        </span>
                      </div>
                    </td>

                    {/* 정원 현황 */}
                    <td className="px-4 py-3 min-w-28">
                      {isFull && (
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle size={10} style={{ color: 'oklch(0.447 0.245 27.325)' }} />
                          <span className="text-xs font-medium" style={{ color: 'oklch(0.447 0.245 27.325)' }}>정원 마감</span>
                        </div>
                      )}
                      <CapacityBar enrolled={enrolledNow} capacity={cls.capacity} />
                    </td>

                    {/* 강의실 */}
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'oklch(0.4 0.015 250)' }}>{cls.room || '-'}</span>
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
                          onClick={() => navigate(`/admin/classes/${cls.id}`)}
                          className="p-1.5 rounded transition-colors hover:bg-[#E7EBF3]"
                          title="상세보기"
                        >
                          <Eye size={14} style={{ color: '#040D1E' }} />
                        </button>
                        <button
                          onClick={() => setFormModal({ open: true, editId: cls.id })}
                          className="p-1.5 rounded transition-colors hover:bg-slate-100"
                          title="수정"
                        >
                          <Edit2 size={14} style={{ color: 'oklch(0.42 0.015 250)' }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cls)}
                          disabled={enrolledNow > 0}
                          className="p-1.5 rounded transition-colors hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          title={enrolledNow > 0 ? '현재 수강생이 있는 반은 삭제할 수 없습니다. 먼저 수강 종료 또는 퇴원 처리를 해주세요.' : '삭제'}
                        >
                          <Trash2 size={14} style={{ color: 'oklch(0.447 0.245 27.325)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 반 생성/수정 모달 */}
      <ClassFormModal
        open={formModal.open}
        editId={formModal.editId}
        onClose={closeFormModal}
      />

      {/* 삭제 확인 — 활성 수강생이 있는 반은 삭제할 수 없다(AXIS 정책: 수강 이력은 삭제하지 않고
          status 변경으로만 처리, Finance Engine이 Enrollment 기준으로 청구/정산을 해야 함).
          버튼 자체가 enrolledNow > 0이면 비활성화되어 이 다이얼로그가 열리지 않지만, 방어적으로
          여기서도 동일하게 막는다(ClassDetail.tsx와 동일한 패턴). */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>반 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && countOf(deleteTarget.id) > 0 ? (
                '현재 수강생이 있는 반은 삭제할 수 없습니다. 먼저 수강 종료 또는 퇴원 처리를 해주세요.'
              ) : (
                <><strong>'{deleteTarget?.name}'</strong> 반을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{deleteTarget && countOf(deleteTarget.id) > 0 ? '확인' : '취소'}</AlertDialogCancel>
            {(!deleteTarget || countOf(deleteTarget.id) === 0) && (
              <AlertDialogAction onClick={handleDelete} style={{ background: 'oklch(0.577 0.245 27.325)' }}>
                삭제
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
