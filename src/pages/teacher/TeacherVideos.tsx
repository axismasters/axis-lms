// AXIS LMS v1.2 - TeacherVideos (Teacher Content Engine v1)
// 강사 전용 수업영상/학습자료 관리 — ContentContext 기반 저장.
// - 담당 반만 선택 가능 (assignedClassIds 스코프 가드)
// - 외부 영상 플랫폼 실제 연동 없음 — URL만 저장
// - 새로고침 시 초기화 (Context state — DB 연동은 다음 단계)

import { useState } from 'react';
import { Link } from 'wouter';
import { Play, Link2, Plus, Trash2, FileText } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useContent } from '@/contexts/ContentContext';
import { getLocalDateStr } from '@/utils/dateUtils';
import type { ContentType, ContentVisibility } from '@/lib/contentData';

const todayStr = getLocalDateStr();

const TYPE_LABEL: Record<'video' | 'material', string> = {
  video:    '수업영상',
  material: '학습자료',
};

const TYPE_ICON = {
  video:    Play,
  material: FileText,
} as const;

export default function TeacherVideos() {
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

  // ContentContext에서 수업영상 + 학습자료 조회
  const myVideos = getByTeacher(currentUser.id, assignedClassIds)
    .filter(item => item.type === 'video' || item.type === 'material');

  const canSave =
    form.title.trim().length > 0 &&
    form.url.trim().length > 0 &&
    !!form.classId;

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

    setForm({
      classId: activeClasses[0]?.id ?? '',
      type: 'video',
      date: todayStr,
      title: '',
      url: '',
      visibility: 'teacherOnly',
    });
    setShowForm(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 3000);
  }

  return (
    <TeacherLayout title="수업영상">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 수업영상 / 수업노트 탭 */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <div
            className="py-2 rounded-md text-center text-sm font-medium"
            style={{ background: 'white', color: 'oklch(0.511 0.262 276.966)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)' }}
          >
            수업영상
          </div>
          <Link href="/teacher/notes">
            <div className="py-2 rounded-md text-center text-sm font-medium cursor-pointer w-full"
              style={{ color: 'oklch(0.5 0.015 250)' }}>
              수업노트
            </div>
          </Link>
        </div>

        {/* 안내 */}
        <div className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}>
          수업영상·학습자료 URL을 반별로 등록하고 관리합니다. 외부 링크만 저장되며 실제 파일 업로드는 지원하지 않습니다.
        </div>

        {activeClasses.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <Play size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>운영중인 담당 반이 없습니다</div>
          </div>
        ) : (
          <>
            {/* 등록 버튼 */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'oklch(0.511 0.262 276.966)' }}
              >
                <Plus size={16} />
                영상 / 자료 등록
              </button>
            )}

            {/* 저장 완료 */}
            {savedFlash && (
              <div className="axis-card px-4 py-3 text-sm text-center"
                style={{ color: 'oklch(0.35 0.12 160)', background: 'oklch(0.96 0.04 160)' }}>
                ✓ 등록되었습니다.
              </div>
            )}

            {/* 등록 폼 */}
            {showForm && (
              <div className="axis-card p-4 space-y-3">
                <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>영상 / 자료 등록</div>

                {/* 종류 선택 */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>종류</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['video', 'material'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, type: t }))}
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

                {/* 담당 반 */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>담당 반</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm(f => ({ ...f, classId: e.target.value }))}
                    className="w-full text-sm rounded-md px-3 py-2 border appearance-none"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  >
                    {activeClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 날짜 */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>날짜</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full text-sm rounded-md px-3 py-2 border"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                {/* 제목 */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    제목 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="예: 3월 4주차 수열 수업 영상"
                    className="w-full text-sm rounded-md px-3 py-2 border"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    링크 (URL) <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
                  </label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full text-sm rounded-md px-3 py-2 border font-mono"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                    공개 범위
                  </label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm(f => ({ ...f, visibility: e.target.value as ContentVisibility }))}
                    className="w-full text-sm rounded-md px-3 py-2 border appearance-none"
                    style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                  >
                    <option value="teacherOnly">내부용 (강사만)</option>
                    <option value="studentVisible">학생 공개</option>
                    <option value="parentVisible">학부모 공개</option>
                  </select>
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
                    등록
                  </button>
                </div>
              </div>
            )}

            {/* 목록 */}
            <section>
              <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
                등록된 영상·자료{myVideos.length > 0 ? ` (${myVideos.length}건)` : ''}
              </div>
              {myVideos.length === 0 ? (
                <div className="axis-card p-8 text-center">
                  <Play size={22} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
                  <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>등록된 영상·자료가 없습니다.</div>
                  <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
                    위 버튼으로 등록하세요.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {myVideos.map((item) => {
                    const cls = activeClasses.find(c => c.id === item.classId);
                    const Icon = TYPE_ICON[item.type as 'video' | 'material'] ?? Play;
                    return (
                      <div key={item.id} className="axis-card p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: item.type === 'video' ? 'oklch(0.94 0.06 276)' : 'oklch(0.96 0.04 160)' }}>
                            <Icon size={14}
                              style={{ color: item.type === 'video' ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.45 0.15 160)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                                {item.title}
                              </div>
                              <button
                                onClick={() => deleteContent(item.id)}
                                className="p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                                title="삭제"
                              >
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
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-1.5 text-xs"
                                style={{ color: 'oklch(0.511 0.262 276.966)' }}
                              >
                                <Link2 size={11} />
                                링크 열기
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
        )}

      </div>
    </TeacherLayout>
  );
}
