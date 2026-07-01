// AXIS LMS v1.2 - TeacherMaterials (Phase 3D v3)
// 강사 전용 "수업자료" 화면 — 기존 TeacherVideos.tsx(수업영상/학습자료)와 TeacherNotes.tsx
// (수업노트)를 하나의 화면 안 2개 탭으로 통합했다.
//
// v3 반려 사유 §2 대응: 강사 홈에 "수업노트"/"수업자료" 카드가 따로 있어 중복처럼 보였다.
// 이제 홈에는 "수업자료" 카드 하나만 남고, 이 화면 안에서 탭으로 수업영상/수업노트를
// 오간다(v1까지는 두 화면이 서로를 <Link>로 가리키는 "가짜 탭"이었을 뿐 실제로는 페이지
// 전환이었다 — 이번에 진짜 로컬 상태 탭으로 바꿨다).
//
// /teacher/videos, /teacher/notes는 이 화면으로 리다이렉트되며(TeacherRoutes.tsx),
// 각각 대응하는 탭이 기본 선택되도록 쿼리스트링(?tab=)을 함께 넘긴다.

import { useState } from 'react';
import { useSearch } from 'wouter';
import { Play, Link2, Plus, Trash2, FileText, Edit2 } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useContent } from '@/contexts/ContentContext';
import { getLocalDateStr } from '@/utils/dateUtils';
import type { ContentType, ContentVisibility } from '@/lib/contentData';

const todayStr = getLocalDateStr();

type MaterialsTab = 'videos' | 'notes';

const TYPE_LABEL: Record<'video' | 'material', string> = {
  video: '수업영상',
  material: '학습자료',
};

const TYPE_ICON = {
  video: Play,
  material: FileText,
} as const;

// ════════════════════════════════════════════════════════════
// 수업영상/학습자료 탭 (구 TeacherVideos.tsx 본문)
// ════════════════════════════════════════════════════════════
function VideoMaterialTabContent() {
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
    type: 'video' as 'video' | 'material',
    date: todayStr,
    title: '',
    url: '',
    visibility: 'teacherOnly' as ContentVisibility,
  });

  const myVideos = getByTeacher(currentUser.id, assignedClassIds)
    .filter((item) => item.type === 'video' || item.type === 'material');

  const canSave = form.title.trim().length > 0 && form.url.trim().length > 0 && !!form.classId;

  function handleSave() {
    if (!canSave) return;
    if (!assignedClassIds.includes(form.classId)) return; // 스코프 가드

    addContent({
      type: form.type as ContentType,
      classId: form.classId,
      teacherId: currentUser.id,
      title: form.title.trim(),
      url: form.url.trim(),
      date: form.date,
      visibility: form.visibility,
    });

    setForm({ classId: activeClasses[0]?.id ?? '', type: 'video', date: todayStr, title: '', url: '', visibility: 'teacherOnly' });
    setShowForm(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 3000);
  }

  if (activeClasses.length === 0) {
    return (
      <div className="axis-card p-10 text-center">
        <Play size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
        <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>운영중인 담당 반이 없습니다</div>
      </div>
    );
  }

  return (
    <>
      <div className="axis-card px-4 py-3 text-xs"
        style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}>
        수업영상·학습자료 URL을 반별로 등록하고 관리합니다. 외부 링크만 저장되며 실제 파일 업로드는 지원하지 않습니다.
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: 'oklch(0.511 0.262 276.966)' }}
        >
          <Plus size={16} /> 영상 / 자료 등록
        </button>
      )}

      {savedFlash && (
        <div className="axis-card px-4 py-3 text-sm text-center" style={{ color: 'oklch(0.35 0.12 160)', background: 'oklch(0.96 0.04 160)' }}>
          ✓ 등록되었습니다.
        </div>
      )}

      {showForm && (
        <div className="axis-card p-4 space-y-3">
          <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>영상 / 자료 등록</div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>종류</label>
            <div className="grid grid-cols-2 gap-2">
              {(['video', 'material'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{
                    borderColor: form.type === t ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.9 0.008 250)',
                    background: form.type === t ? 'oklch(0.96 0.06 276)' : 'white',
                    color: form.type === t ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.5 0.015 250)',
                  }}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>담당 반</label>
            <select
              value={form.classId}
              onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              className="w-full text-sm rounded-md px-3 py-2 border appearance-none"
              style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            >
              {activeClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>날짜</label>
            <input
              type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full text-sm rounded-md px-3 py-2 border" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              제목 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <input
              type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="예: 3월 4주차 수열 수업 영상"
              className="w-full text-sm rounded-md px-3 py-2 border" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              링크 (URL) <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <input
              type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className="w-full text-sm rounded-md px-3 py-2 border font-mono" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>공개 범위</label>
            <select
              value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as ContentVisibility }))}
              className="w-full text-sm rounded-md px-3 py-2 border appearance-none" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            >
              <option value="teacherOnly">내부용 (강사만)</option>
              <option value="studentVisible">학생 공개</option>
              <option value="parentVisible">학부모 공개</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="py-2.5 rounded-xl text-sm font-medium" style={{ flex: 1, background: 'oklch(0.95 0.005 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
            <button
              onClick={handleSave} disabled={!canSave}
              className="py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ flex: 2, background: canSave ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.85 0.01 250)', cursor: canSave ? 'pointer' : 'not-allowed' }}
            >
              등록
            </button>
          </div>
        </div>
      )}

      <section>
        <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
          등록된 영상·자료{myVideos.length > 0 ? ` (${myVideos.length}건)` : ''}
        </div>
        {myVideos.length === 0 ? (
          <div className="axis-card p-8 text-center">
            <Play size={22} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>등록된 영상·자료가 없습니다.</div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>위 버튼으로 등록하세요.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {myVideos.map((item) => {
              const cls = activeClasses.find((c) => c.id === item.classId);
              const Icon = TYPE_ICON[item.type as 'video' | 'material'] ?? Play;
              return (
                <div key={item.id} className="axis-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: item.type === 'video' ? 'oklch(0.94 0.06 276)' : 'oklch(0.96 0.04 160)' }}>
                      <Icon size={14} style={{ color: item.type === 'video' ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.45 0.15 160)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{item.title}</div>
                        <button onClick={() => deleteContent(item.id)} className="p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0" title="삭제">
                          <Trash2 size={12} style={{ color: 'oklch(0.65 0.15 27)' }} />
                        </button>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        {cls?.name ?? item.classId} · {item.date} ·{' '}
                        <span className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: item.type === 'video' ? 'oklch(0.94 0.06 276)' : 'oklch(0.96 0.04 160)', color: item.type === 'video' ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.45 0.15 160)' }}>
                          {TYPE_LABEL[item.type as 'video' | 'material'] ?? item.type}
                        </span>
                      </div>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                          <Link2 size={11} /> 링크 열기
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// 수업노트 탭 (구 TeacherNotes.tsx 본문)
// ════════════════════════════════════════════════════════════
function NotesTabContent() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { addContent, deleteContent, getByTeacher } = useContent();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const activeClasses = classes.filter((c) => assignedClassIds.includes(c.id) && c.status === '운영중');

  const [showForm, setShowForm] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState({
    classId: activeClasses[0]?.id ?? '',
    date: todayStr,
    topic: '',
    content: '',
    homework: '',
    visibility: 'teacherOnly' as ContentVisibility,
  });

  const myNotes = getByTeacher(currentUser.id, assignedClassIds, 'note');

  const canSave = form.topic.trim().length > 0 && form.content.trim().length > 0 && !!form.classId;

  function handleSave() {
    if (!canSave) return;
    if (!assignedClassIds.includes(form.classId)) return;

    addContent({
      type: 'note',
      classId: form.classId,
      teacherId: currentUser.id,
      title: form.topic.trim(),
      content: form.content.trim(),
      homework: form.homework.trim() || undefined,
      date: form.date,
      visibility: form.visibility,
    });

    setForm({ classId: activeClasses[0]?.id ?? '', date: todayStr, topic: '', content: '', homework: '', visibility: 'teacherOnly' });
    setShowForm(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 3000);
  }

  if (activeClasses.length === 0) {
    return (
      <div className="axis-card p-10 text-center">
        <FileText size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
        <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 반이 없습니다.</div>
      </div>
    );
  }

  return (
    <>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: 'oklch(0.511 0.262 276.966)' }}
        >
          <Plus size={16} /> 수업노트 작성
        </button>
      )}

      {savedFlash && (
        <div className="axis-card px-4 py-3 text-sm text-center" style={{ color: 'oklch(0.35 0.12 160)', background: 'oklch(0.96 0.04 160)' }}>
          ✓ 수업노트가 저장되었습니다.
        </div>
      )}

      {showForm && (
        <div className="axis-card p-4 space-y-3">
          <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>수업노트 작성</div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>담당 반</label>
            <select
              value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              className="w-full text-sm rounded-md px-3 py-2 border appearance-none" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            >
              {activeClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>날짜</label>
            <input
              type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full text-sm rounded-md px-3 py-2 border" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              수업 주제 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <input
              type="text" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="예: 수학 — 수열과 극한"
              className="w-full text-sm rounded-md px-3 py-2 border" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
              수업 내용 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <textarea
              value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="오늘 수업에서 다룬 내용을 기록하세요" rows={3}
              className="w-full text-sm rounded-md px-3 py-2 border resize-none" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>과제 / 다음 수업 안내</label>
            <textarea
              value={form.homework} onChange={(e) => setForm((f) => ({ ...f, homework: e.target.value }))}
              placeholder="과제 또는 다음 수업 준비 사항 (선택)" rows={2}
              className="w-full text-sm rounded-md px-3 py-2 border resize-none" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>공개 범위</label>
            <select
              value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as ContentVisibility }))}
              className="w-full text-sm rounded-md px-3 py-2 border appearance-none" style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
            >
              <option value="teacherOnly">내부용 (강사만)</option>
              <option value="studentVisible">학생 공개</option>
              <option value="parentVisible">학부모 공개</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="py-2.5 rounded-xl text-sm font-medium" style={{ flex: 1, background: 'oklch(0.95 0.005 250)', color: 'oklch(0.5 0.015 250)' }}>취소</button>
            <button
              onClick={handleSave} disabled={!canSave}
              className="py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ flex: 2, background: canSave ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.85 0.01 250)', cursor: canSave ? 'pointer' : 'not-allowed' }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      <section>
        <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
          최근 수업노트{myNotes.length > 0 ? ` (${myNotes.length}건)` : ''}
        </div>
        {myNotes.length === 0 ? (
          <div className="axis-card p-8 text-center">
            <Edit2 size={22} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>수업노트가 아직 없습니다.</div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>위 버튼으로 새 수업노트를 작성하세요.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {myNotes.map((note) => {
              const cls = activeClasses.find((c) => c.id === note.classId);
              return (
                <div key={note.id} className="axis-card p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-sm flex-1 min-w-0 pr-2" style={{ color: 'oklch(0.2 0.02 250)' }}>{note.title}</div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{note.date}</div>
                      <button onClick={() => deleteContent(note.id)} className="p-1 rounded hover:bg-red-50 transition-colors" title="삭제">
                        <Trash2 size={12} style={{ color: 'oklch(0.65 0.15 27)' }} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'oklch(0.55 0.015 250)' }}>{cls?.name ?? note.classId}</div>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: 'oklch(0.35 0.02 250)' }}>{note.content}</div>
                  {note.homework && (
                    <div className="mt-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'oklch(0.96 0.01 250)', color: 'oklch(0.5 0.015 250)' }}>
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
  );
}

// ════════════════════════════════════════════════════════════
// 메인 — 실제 로컬 상태 탭(페이지 전환 없음)
// ════════════════════════════════════════════════════════════
export default function TeacherMaterials() {
  const searchStr = useSearch();
  const initialTab: MaterialsTab = new URLSearchParams(searchStr).get('tab') === 'notes' ? 'notes' : 'videos';
  const [tab, setTab] = useState<MaterialsTab>(initialTab);

  return (
    <TeacherLayout title="수업자료">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 수업영상 / 수업노트 탭 — 실제 로컬 상태(페이지 이동 없음) */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg" style={{ background: 'oklch(0.93 0.006 250)' }}>
          {([{ key: 'videos' as MaterialsTab, label: '수업영상' }, { key: 'notes' as MaterialsTab, label: '수업노트' }]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="py-2 rounded-md text-center text-sm font-medium transition-colors"
              style={tab === t.key
                ? { background: 'white', color: 'oklch(0.511 0.262 276.966)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)' }
                : { color: 'oklch(0.5 0.015 250)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'videos' ? <VideoMaterialTabContent /> : <NotesTabContent />}

      </div>
    </TeacherLayout>
  );
}
