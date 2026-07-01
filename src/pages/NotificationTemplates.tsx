// AXIS LMS v1.2 - 알림관리 > 템플릿관리

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  NotificationTemplate,
  NotificationType,
  NotificationChannel,
  NOTIFICATION_TYPE_LABEL,
  NOTIFICATION_CHANNEL_LABEL,
  canAccessNotifications,
  canManageNotificationTemplates,
} from '@/lib/notificationData';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────
// 템플릿 추가/수정 모달
// ────────────────────────────────────────────────────────────
interface TemplateModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: NotificationTemplate;
  currentUserName: string;
  onClose: () => void;
  onSave: (data: Omit<NotificationTemplate, 'id' | 'updatedAt'>) => void;
}

const ALL_TYPES = Object.entries(NOTIFICATION_TYPE_LABEL) as [NotificationType, string][];

function TemplateModal({ open, mode, initial, currentUserName, onClose, onSave }: TemplateModalProps) {
  const [type, setType] = useState<NotificationType>(initial?.type ?? 'ATTENDANCE_ABSENCE');
  const [name, setName] = useState(initial?.name ?? '');
  const [channel, setChannel] = useState<NotificationChannel>(initial?.channel ?? 'KAKAO');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [variablesStr, setVariablesStr] = useState(initial?.variables.join(', ') ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  if (!open) return null;

  function handleSave() {
    if (!name.trim() || !title.trim() || !content.trim()) {
      toast.error('템플릿명, 제목, 내용은 필수입니다.');
      return;
    }
    const variables = variablesStr
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    onSave({
      type,
      name: name.trim(),
      channel,
      title: title.trim(),
      content: content.trim(),
      variables,
      isActive,
      isDefault: initial?.isDefault ?? false,
      updatedBy: currentUserName,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'oklch(0.92 0.01 250)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>
            {mode === 'add' ? '템플릿 추가' : '템플릿 수정'}
          </h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.5 0.015 250)' }}>✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>알림유형 *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {ALL_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>템플릿명 *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              placeholder="예: 결석 알림 (보호자용)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>발송 채널</label>
            <div className="flex gap-2">
              {(['KAKAO', 'SMS', 'LMS'] as NotificationChannel[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className="flex-1 py-2 rounded-lg border text-xs font-medium transition-colors"
                  style={{
                    background: channel === c ? 'oklch(0.25 0.05 250)' : 'white',
                    color: channel === c ? 'white' : 'oklch(0.4 0.02 250)',
                    borderColor: channel === c ? 'oklch(0.25 0.05 250)' : 'oklch(0.88 0.01 250)',
                  }}
                >
                  {NOTIFICATION_CHANNEL_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>제목 *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              placeholder="[AXIS] 알림 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>내용 *</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              rows={5}
              placeholder="템플릿 내용. 변수는 {{변수명}} 형식 사용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>변수 (쉼표 구분)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              placeholder="{{학생명}}, {{날짜}}, {{반명}}"
              value={variablesStr}
              onChange={(e) => setVariablesStr(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ background: isActive ? 'oklch(0.55 0.18 145)' : 'oklch(0.75 0.01 250)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: isActive ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-xs" style={{ color: 'oklch(0.4 0.02 250)' }}>
              {isActive ? '활성' : '비활성'}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.4 0.02 250)' }}
            >취소</button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'oklch(0.25 0.05 250)', color: 'white' }}
            >{mode === 'add' ? '추가' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────────────────
export default function NotificationTemplates() {
  const { currentUser } = useAuth();
  const { templates, updateNotificationTemplate, addNotificationTemplate, toggleNotificationTemplate } = useNotification();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NotificationTemplate | null>(null);

  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterChannel, setFilterChannel] = useState<NotificationChannel | ''>('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSearch, setFilterSearch] = useState('');

  if (!canAccessNotifications(currentUser.accountType)) {
    return (
      <AdminLayout title="템플릿관리" breadcrumbs={[{ label: '알림관리' }, { label: '템플릿관리' }]}>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-2xl">🔒</span>
          <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>알림관리에 접근할 수 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const canManage = canManageNotificationTemplates(currentUser.accountType);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (filterType && t.type !== filterType) return false;
      if (filterChannel && t.channel !== filterChannel) return false;
      if (filterActive === 'active' && !t.isActive) return false;
      if (filterActive === 'inactive' && t.isActive) return false;
      if (filterSearch && !t.name.includes(filterSearch) && !t.title.includes(filterSearch)) return false;
      return true;
    });
  }, [templates, filterType, filterChannel, filterActive, filterSearch]);

  const totalActive = templates.filter((t) => t.isActive).length;
  const totalKakao = templates.filter((t) => t.channel === 'KAKAO').length;
  const totalSmsLms = templates.filter((t) => t.channel === 'SMS' || t.channel === 'LMS').length;
  const totalInactive = templates.filter((t) => !t.isActive).length;

  function handleAdd(data: Omit<NotificationTemplate, 'id' | 'updatedAt'>) {
    addNotificationTemplate({ ...data, updatedBy: currentUser.name });
    toast.success('템플릿이 추가되었습니다.');
    setAddOpen(false);
  }

  function handleEdit(data: Omit<NotificationTemplate, 'id' | 'updatedAt'>) {
    if (!editTarget) return;
    updateNotificationTemplate(editTarget.id, { ...data, updatedBy: currentUser.name });
    toast.success('템플릿이 수정되었습니다.');
    setEditTarget(null);
  }

  function handleToggle(t: NotificationTemplate) {
    toggleNotificationTemplate(t.id);
    toast.success(t.isActive ? '템플릿을 비활성 처리했습니다.' : '템플릿을 활성 처리했습니다.');
  }

  const ALL_TYPES = Object.entries(NOTIFICATION_TYPE_LABEL) as [NotificationType, string][];

  return (
    <AdminLayout title="템플릿관리" breadcrumbs={[{ label: '알림관리' }, { label: '템플릿관리' }]}>
      <TemplateModal
        open={addOpen}
        mode="add"
        currentUserName={currentUser.name}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
      {editTarget && (
        <TemplateModal
          open={true}
          mode="edit"
          initial={editTarget}
          currentUserName={currentUser.name}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      <div className="flex flex-col gap-5">
        {/* 상단 액션 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>템플릿관리</h2>
          {canManage && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
              style={{ background: 'oklch(0.25 0.05 250)', color: 'white' }}
            >
              + 템플릿 추가
            </button>
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: '전체 템플릿', value: templates.length, color: 'oklch(0.25 0.05 250)' },
            { label: '활성 템플릿', value: totalActive, color: 'oklch(0.45 0.18 145)' },
            { label: '카카오', value: totalKakao, color: 'oklch(0.65 0.18 85)' },
            { label: 'SMS/LMS', value: totalSmsLms, color: 'oklch(0.55 0.15 200)' },
            { label: '비활성', value: totalInactive, color: 'oklch(0.55 0.01 250)' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl p-4 bg-white shadow-sm border" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
              <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{card.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>알림유형</label>
            <select className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterType} onChange={(e) => setFilterType(e.target.value as NotificationType | '')}>
              <option value="">전체</option>
              {ALL_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>채널</label>
            <select className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterChannel} onChange={(e) => setFilterChannel(e.target.value as NotificationChannel | '')}>
              <option value="">전체</option>
              <option value="KAKAO">카카오</option>
              <option value="SMS">SMS</option>
              <option value="LMS">LMS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>사용 여부</label>
            <select className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterActive} onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}>
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>검색</label>
            <input className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} placeholder="템플릿명/제목" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
            <span className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>총 {filtered.length}건</span>
          </div>
          <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'oklch(0.97 0.005 250)' }}>
                  {['템플릿명', '알림유형', '채널', '사용여부', '기본', '변수', '수정일', '관리'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', background: 'oklch(0.97 0.005 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.006 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.01 250)' }}>템플릿이 없습니다.</td>
                  </tr>
                ) : (
                  filtered.map((tpl, idx) => (
                    <tr key={tpl.id} className="border-t" style={{ borderColor: 'oklch(0.95 0.005 250)', background: idx % 2 === 0 ? 'white' : 'oklch(0.99 0.002 250)' }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>{tpl.name}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.4 0.02 250)' }}>{NOTIFICATION_TYPE_LABEL[tpl.type]}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.45 0.02 250)' }}>{NOTIFICATION_CHANNEL_LABEL[tpl.channel]}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: tpl.isActive ? 'oklch(0.92 0.08 145)' : 'oklch(0.93 0.01 250)', color: tpl.isActive ? 'oklch(0.35 0.15 145)' : 'oklch(0.55 0.01 250)' }}>
                          {tpl.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tpl.isDefault && <span className="text-xs font-bold" style={{ color: 'oklch(0.65 0.18 85)' }}>★</span>}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: 'oklch(0.55 0.015 250)' }} title={tpl.variables.join(', ')}>{tpl.variables.join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.55 0.015 250)' }}>{tpl.updatedAt.slice(0, 10)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canManage ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditTarget(tpl)}
                              className="px-2 py-1 rounded-md text-xs"
                              style={{ background: 'oklch(0.95 0.01 250)', color: 'oklch(0.35 0.02 250)' }}
                            >수정</button>
                            <button
                              onClick={() => handleToggle(tpl)}
                              className="px-2 py-1 rounded-md text-xs"
                              style={{ background: tpl.isActive ? 'oklch(0.93 0.07 25)' : 'oklch(0.92 0.08 145)', color: tpl.isActive ? 'oklch(0.45 0.2 25)' : 'oklch(0.35 0.15 145)' }}
                            >{tpl.isActive ? '비활성' : '활성'}</button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'oklch(0.65 0.01 250)' }}>조회만</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
