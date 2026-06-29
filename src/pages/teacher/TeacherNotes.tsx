// AXIS LMS v1.2 - TeacherNotes (Teacher Content Engine v1)
// 강사 전용 수업노트 작성/조회 — ContentContext 기반 저장.
// - 담당 반만 선택 가능 (assignedClassIds 스코프 가드)
// - 새로고침 시 초기화 (Context state — DB 연동은 다음 단계)

import { useState } from 'react';
import { Link } from 'wouter';
import { FileText, Edit2, Plus, Trash2 } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useContent } from '@/contexts/ContentContext';
import { getLocalDateStr } from '@/utils/dateUtils';

const todayStr = getLocalDateStr();

export default function TeacherNotes() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { addContent, deleteContent, getByTeacher } = useContent();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const activeClasses = classes.filter(
    (c) => assignedClassIds.includes(c.id) && c.status === '운영중'
  );

  const [showForm, setShowForm] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState({
    classId: activeClasses[0]?.id ?? '',
    date: todayStr,
    topic: '',
    content: '',
    homework: '',
  });

  // ContentContext에서 본인 수업노트 조회
  const myNotes = getByTeacher(currentUser.id, assignedClassIds, 'note');

  const canSave =
    form.topic.trim().length > 0 &&
    form.content.trim().length > 0 &&
    !!form.classId;

  function handleSave() {
    if (!canSave) return;
    // 스코프 가드: classId가 assignedClassIds에 포함된 경우만 저장
    if (!assignedClassIds.includes(form.classId)) return;

    addContent({
      type: 'note',
      classId: form.classId,
      teacherId: currentUser.id,
      title: form.topic.trim(),
      content: form.content.trim(),
      homework: form.homework.trim() || undefined,
      date: form.date,
      visibility: 'teacherOnly',  // v1: 학생·학부모 포털 미노출
    });

    setForm({
      classId: activeClasses[0]?.id ?? '',
      date: todayStr,
      topic: '',
      content: '',
      homework: '',
    });
    setShowForm(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 3000);
  }

  function handleDelete(id: string) {
    deleteContent(id);
  }

  return (
    <TeacherLayout title="수업노트">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 수업영상 / 수업노트 탭 */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <Link href="/teacher/videos">
            <div className="py-2 rounded-md text-center text-sm font-medium cursor-pointer w-full"
              style={{ color: 'oklch(0.5 0.015 250)' }}>
              수업영상
            </div>
          </Link>
          <div className="py-2 rounded-md text-center text-sm font-medium"
            style={{ background: 'white', color: 'oklch(0.511 0.262 276.966)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)' }}>
            수업노트
          </div>
        </div>

        {activeClasses.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <FileText size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 반이 없습니다.</div>
          </div>
        ) : (
          <>
            {/* 작성 버튼 */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'oklch(0.511 0.262 276.966)' }}
              >
                <Plus size={16} />
                수업노트 작성
              </button>
            )}

            {/* 저장 완료 */}
            {savedFlash && (
              <div className="axis-card px-4 py-3 text-sm text-center"
                style={{ color: 'oklch(0.35 0.12 160)', background: 'oklch(0.96 0.04 160)' }}>
                ✓ 수업노트가 저장되었습니다.
              </div>
            )}

            {/* 작성 폼 */}
            {showForm && (
              <div className="axis-card p-4 space-y-3">
                <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>수업노트 작성</div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>담당 반</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                    className="w-full text-sm rounded-md px-3 py-2 border appearance-none"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  >
                    {activeClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>날짜</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full text-sm rounded-md px-3 py-2 border"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    수업 주제 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    placeholder="예: 수학 — 수열과 극한"
                    className="w-full text-sm rounded-md px-3 py-2 border"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    수업 내용 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="오늘 수업에서 다룬 내용을 기록하세요"
                    rows={3}
                    className="w-full text-sm rounded-md px-3 py-2 border resize-none"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    과제 / 다음 수업 안내
                  </label>
                  <textarea
                    value={form.homework}
                    onChange={(e) => setForm((f) => ({ ...f, homework: e.target.value }))}
                    placeholder="과제 또는 다음 수업 준비 사항 (선택)"
                    rows={2}
                    className="w-full text-sm rounded-md px-3 py-2 border resize-none"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="py-2.5 rounded-xl text-sm font-medium"
                    style={{ flex: 1, background: 'oklch(0.95 0.005 250)', color: 'oklch(0.5 0.015 250)' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{
                      flex: 2,
                      background: canSave ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.85 0.01 250)',
                      cursor: canSave ? 'pointer' : 'not-allowed',
                    }}
                  >
                    저장
                  </button>
                </div>
              </div>
            )}

            {/* 수업노트 목록 */}
            <section>
              <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                최근 수업노트{myNotes.length > 0 ? ` (${myNotes.length}건)` : ''}
              </div>
              {myNotes.length === 0 ? (
                <div className="axis-card p-8 text-center">
                  <Edit2 size={22} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                  <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>수업노트가 아직 없습니다.</div>
                  <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
                    위 버튼으로 새 수업노트를 작성하세요.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {myNotes.map((note) => {
                    const cls = activeClasses.find(c => c.id === note.classId);
                    return (
                      <div key={note.id} className="axis-card p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-semibold text-sm flex-1 min-w-0 pr-2" style={{ color: 'oklch(0.2 0.02 250)' }}>
                            {note.title}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{note.date}</div>
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={12} style={{ color: 'oklch(0.65 0.15 27)' }} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs mb-2" style={{ color: 'oklch(0.55 0.015 250)' }}>
                          {cls?.name ?? note.classId}
                        </div>
                        <div className="text-sm whitespace-pre-wrap" style={{ color: 'oklch(0.35 0.02 250)' }}>
                          {note.content}
                        </div>
                        {note.homework && (
                          <div
                            className="mt-2 text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: 'oklch(0.96 0.01 250)', color: 'oklch(0.5 0.015 250)' }}
                          >
                            📌 {note.homework}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </TeacherLayout>
  );
}
