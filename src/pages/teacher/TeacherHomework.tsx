// src/pages/teacher/TeacherHomework.tsx
// AXIS LMS v1.2 — Homework Foundation v1
// 강사 담당 반 숙제 등록/공개/삭제
// NGD2 연동 없음 · 자동채점 없음 · 파일 업로드 없음

import { useState } from 'react';
import { ClipboardList, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useHomework } from '@/contexts/HomeworkContext';
import { getLocalDateStr } from '@/utils/dateUtils';
import type { Homework } from '@/lib/homeworkData';

const todayStr = getLocalDateStr();

export default function TeacherHomework() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { addHomework, updateHomework, deleteHomework, getByTeacher } = useHomework();

  // assignedClassIds 스코프 가드 — 담당 반만
  const assignedClassIds: string[] = currentUser.assignedClassIds ?? [];
  const activeClasses = classes.filter(
    c => assignedClassIds.includes(c.id) && c.status === '운영중',
  );

  const [showForm, setShowForm] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState({
    classId: activeClasses[0]?.id ?? '',
    title: '',
    description: '',
    dueDate: todayStr,
    status: 'published' as 'draft' | 'published',
  });

  const myHomework: Homework[] = getByTeacher(currentUser.id, assignedClassIds)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleSave() {
    if (!form.classId || !form.title.trim()) return;
    if (!assignedClassIds.includes(form.classId)) return;
    addHomework({
      classId: form.classId,
      teacherId: currentUser.id,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      status: form.status,
    });
    setForm({
      classId: activeClasses[0]?.id ?? '',
      title: '',
      description: '',
      dueDate: todayStr,
      status: 'published',
    });
    setShowForm(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function toggleStatus(hw: Homework) {
    updateHomework(hw.id, {
      status: hw.status === 'published' ? 'draft' : 'published',
    });
  }

  const classNameOf = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? classId;

  const statusBadge = (status: 'draft' | 'published') =>
    status === 'published'
      ? { label: '공개', bg: 'oklch(0.92 0.06 145)', fg: 'oklch(0.3 0.1 145)' }
      : { label: '미공개', bg: 'oklch(0.92 0.01 250)', fg: 'oklch(0.5 0.01 250)' };

  return (
    <TeacherLayout title="숙제 관리">
      <div className="p-6 max-w-2xl mx-auto space-y-5">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} style={{ color: 'oklch(0.45 0.1 250)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>
              숙제 관리
            </h1>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'oklch(0.2 0.02 250)', color: '#fff' }}
          >
            <Plus size={15} />
            숙제 등록
          </button>
        </div>

        {savedFlash && (
          <p className="text-sm" style={{ color: 'oklch(0.45 0.15 145)' }}>✓ 숙제가 저장되었습니다.</p>
        )}

        {/* 등록 폼 */}
        {showForm && (
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: 'oklch(0.88 0.008 250)', background: 'oklch(0.98 0.003 250)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.35 0.015 250)' }}>
              새 숙제
            </h2>

            {/* 반 선택 */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                반 <span style={{ color: 'oklch(0.55 0.18 30)' }}>*</span>
              </label>
              {activeClasses.length === 0 ? (
                <p className="text-xs" style={{ color: 'oklch(0.6 0.01 250)' }}>담당 중인 운영 반이 없습니다.</p>
              ) : (
                <select
                  value={form.classId}
                  onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 py-2 border appearance-none"
                  style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                >
                  {activeClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                제목 <span style={{ color: 'oklch(0.55 0.18 30)' }}>*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="숙제 제목을 입력하세요"
                className="w-full text-sm rounded-lg px-3 py-2 border"
                style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                내용/설명
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="숙제 내용, 페이지, 문제 번호 등"
                className="w-full text-sm rounded-lg px-3 py-2 border resize-none"
                style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
              />
            </div>

            {/* 마감일 */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                마감일
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 py-2 border"
                style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
              />
            </div>

            {/* 공개 여부 */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                공개 여부
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                className="w-full text-sm rounded-lg px-3 py-2 border appearance-none"
                style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
              >
                <option value="published">공개 (학생 즉시 조회 가능)</option>
                <option value="draft">미공개 (임시저장)</option>
              </select>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!form.classId || !form.title.trim()}
                className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: 'oklch(0.2 0.02 250)', color: '#fff' }}
              >
                저장
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'oklch(0.5 0.01 250)' }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 숙제 목록 */}
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.01 250)' }}>
            등록된 숙제 ({myHomework.length}건)
          </p>

          {myHomework.length === 0 && (
            <div
              className="rounded-xl p-6 text-center text-sm"
              style={{ background: 'oklch(0.97 0.003 250)', color: 'oklch(0.6 0.01 250)' }}
            >
              등록된 숙제가 없습니다.
            </div>
          )}

          {myHomework.map(hw => {
            const badge = statusBadge(hw.status);
            return (
              <div
                key={hw.id}
                className="rounded-2xl border p-4 space-y-2"
                style={{ borderColor: 'oklch(0.9 0.008 250)', background: '#fff' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'oklch(0.15 0.02 250)' }}>
                      {hw.title}
                    </p>
                    <p className="text-xs" style={{ color: 'oklch(0.55 0.01 250)' }}>
                      {classNameOf(hw.classId)} · 마감 {hw.dueDate}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: badge.bg, color: badge.fg }}
                  >
                    {badge.label}
                  </span>
                </div>

                {hw.description && (
                  <p className="text-xs line-clamp-2" style={{ color: 'oklch(0.45 0.01 250)' }}>
                    {hw.description}
                  </p>
                )}

                {/* 액션 */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleStatus(hw)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.45 0.01 250)' }}
                  >
                    {hw.status === 'published'
                      ? <><EyeOff size={12} /> 미공개로 변경</>
                      : <><Eye size={12} /> 공개하기</>}
                  </button>
                  <button
                    onClick={() => deleteHomework(hw.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'oklch(0.88 0.008 250)', color: 'oklch(0.55 0.12 30)' }}
                  >
                    <Trash2 size={12} />
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TeacherLayout>
  );
}
