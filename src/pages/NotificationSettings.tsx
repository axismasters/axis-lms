// AXIS LMS v1.2 - 알림관리 > 알림설정

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  NotificationSetting,
  NotificationChannel,
  NOTIFICATION_CHANNEL_LABEL,
  RELATED_ENTITY_TYPE_LABEL,
  NOTIFICATION_TYPE_LABEL,
  canAccessNotifications,
  canManageNotificationSettings,
} from '@/lib/notificationData';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────
// 토글 버튼 컴포넌트
// ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="relative w-9 h-5 rounded-full transition-colors"
      style={{
        background: value ? 'oklch(0.55 0.18 145)' : 'oklch(0.78 0.01 250)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: value ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// 관련 기능 레이블 (알림유형 prefix 기반)
function getCategoryLabel(eventType: string): string {
  if (eventType.startsWith('ATTENDANCE')) return RELATED_ENTITY_TYPE_LABEL.ATTENDANCE;
  if (eventType.startsWith('ENROLLMENT')) return RELATED_ENTITY_TYPE_LABEL.ENROLLMENT;
  if (eventType.startsWith('FINANCE')) return RELATED_ENTITY_TYPE_LABEL.FINANCE;
  if (eventType.startsWith('ASSESSMENT')) return RELATED_ENTITY_TYPE_LABEL.ASSESSMENT;
  return RELATED_ENTITY_TYPE_LABEL.MANUAL;
}

// ────────────────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────────────────
export default function NotificationSettingsPage() {
  const { currentUser } = useAuth();
  const { settings, saveAllSettings } = useNotification();

  // 로컬 편집 상태 (저장 전 draft)
  const [draft, setDraft] = useState<NotificationSetting[]>(() => settings.map((s) => ({ ...s })));
  const [dirty, setDirty] = useState(false);

  if (!canAccessNotifications(currentUser.accountType)) {
    return (
      <AdminLayout title="알림설정" breadcrumbs={[{ label: '알림관리' }, { label: '알림설정' }]}>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-2xl">🔒</span>
          <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>알림관리에 접근할 수 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const canManage = canManageNotificationSettings(currentUser.accountType);

  function updateDraft(id: string, field: keyof NotificationSetting, value: unknown) {
    setDraft((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
    setDirty(true);
  }

  function handleSave() {
    saveAllSettings(draft);
    setDirty(false);
    toast.success('알림설정이 저장되었습니다.');
  }

  function handleReset() {
    setDraft(settings.map((s) => ({ ...s })));
    setDirty(false);
    toast.info('변경사항이 취소되었습니다.');
  }

  // 요약 통계
  const autoOnCount = draft.filter((s) => s.enabled && s.autoSend).length;
  const guardianOnCount = draft.filter((s) => s.sendToGuardian).length;
  const studentOnCount = draft.filter((s) => s.sendToStudent).length;
  const smsOnCount = draft.filter((s) => s.fallbackSmsEnabled).length;

  const channels: NotificationChannel[] = ['KAKAO', 'SMS', 'LMS'];

  return (
    <AdminLayout title="알림설정" breadcrumbs={[{ label: '알림관리' }, { label: '알림설정' }]}>
      <div className="flex flex-col gap-5">
        {/* 상단 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>알림설정</h2>
          {canManage && (
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border text-sm"
                  style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.35 0.02 250)' }}
                >취소</button>
              )}
              <button
                onClick={handleSave}
                disabled={!dirty}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity"
                style={{
                  background: 'oklch(0.25 0.05 250)',
                  color: 'white',
                  opacity: dirty ? 1 : 0.5,
                }}
              >저장</button>
            </div>
          )}
        </div>

        {!canManage && (
          <div className="rounded-xl p-3 text-sm" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.35 0.05 250)', border: '1px solid oklch(0.9 0.03 250)' }}>
            현재 계정은 알림설정을 조회만 할 수 있습니다. 변경은 최고관리자/원장만 가능합니다.
          </div>
        )}

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '자동발송 ON', value: autoOnCount, color: 'oklch(0.35 0.18 145)' },
            { label: '보호자 발송 ON', value: guardianOnCount, color: 'oklch(0.4 0.15 85)' },
            { label: '학생 발송 ON', value: studentOnCount, color: 'oklch(0.4 0.12 200)' },
            { label: 'SMS fallback ON', value: smsOnCount, color: 'oklch(0.4 0.1 25)' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl p-4 bg-white shadow-sm border" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
              <p className="text-xs" style={{ color: 'oklch(0.42 0.015 250)' }}>{card.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* 설정 테이블 */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'oklch(0.97 0.005 250)' }}>
                  {['이벤트명', '관련기능', '활성화', '자동발송', '기본채널', '학생', '보호자', '직원', 'SMS fallback'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.35 0.015 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.map((setting, idx) => (
                  <tr key={setting.id} className="border-t" style={{ borderColor: 'oklch(0.95 0.005 250)', background: idx % 2 === 0 ? 'white' : 'oklch(0.99 0.002 250)' }}>
                    {/* 이벤트명 */}
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>
                        {NOTIFICATION_TYPE_LABEL[setting.eventType]}
                      </div>
                    </td>

                    {/* 관련기능 */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={{ background: 'oklch(0.95 0.02 250)', color: 'oklch(0.4 0.04 250)' }}>
                        {getCategoryLabel(setting.eventType)}
                      </span>
                    </td>

                    {/* 활성화 */}
                    <td className="px-4 py-3">
                      <Toggle
                        value={setting.enabled}
                        onChange={(v) => updateDraft(setting.id, 'enabled', v)}
                        disabled={!canManage}
                      />
                    </td>

                    {/* 자동발송 */}
                    <td className="px-4 py-3">
                      <Toggle
                        value={setting.autoSend}
                        onChange={(v) => updateDraft(setting.id, 'autoSend', v)}
                        disabled={!canManage || !setting.enabled}
                      />
                    </td>

                    {/* 기본채널 */}
                    <td className="px-4 py-3">
                      <select
                        disabled={!canManage || !setting.enabled}
                        className="border rounded-lg px-2 py-1 text-xs"
                        style={{
                          borderColor: 'oklch(0.88 0.01 250)',
                          color: 'oklch(0.3 0.02 250)',
                          opacity: (!canManage || !setting.enabled) ? 0.5 : 1,
                        }}
                        value={setting.defaultChannel}
                        onChange={(e) => updateDraft(setting.id, 'defaultChannel', e.target.value as NotificationChannel)}
                      >
                        {channels.map((c) => (
                          <option key={c} value={c}>{NOTIFICATION_CHANNEL_LABEL[c]}</option>
                        ))}
                      </select>
                    </td>

                    {/* 학생 */}
                    <td className="px-4 py-3">
                      <Toggle
                        value={setting.sendToStudent}
                        onChange={(v) => updateDraft(setting.id, 'sendToStudent', v)}
                        disabled={!canManage || !setting.enabled}
                      />
                    </td>

                    {/* 보호자 */}
                    <td className="px-4 py-3">
                      <Toggle
                        value={setting.sendToGuardian}
                        onChange={(v) => updateDraft(setting.id, 'sendToGuardian', v)}
                        disabled={!canManage || !setting.enabled}
                      />
                    </td>

                    {/* 직원 */}
                    <td className="px-4 py-3">
                      <Toggle
                        value={setting.sendToStaff}
                        onChange={(v) => updateDraft(setting.id, 'sendToStaff', v)}
                        disabled={!canManage || !setting.enabled}
                      />
                    </td>

                    {/* SMS fallback */}
                    <td className="px-4 py-3">
                      <Toggle
                        value={setting.fallbackSmsEnabled}
                        onChange={(v) => updateDraft(setting.id, 'fallbackSmsEnabled', v)}
                        disabled={!canManage || !setting.enabled}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 정책 안내 */}
        <div className="rounded-xl p-4 text-xs" style={{ background: 'oklch(0.97 0.01 250)', border: '1px solid oklch(0.92 0.02 250)', color: 'oklch(0.35 0.02 250)', lineHeight: 1.8 }}>
          <p className="font-semibold mb-1" style={{ color: 'oklch(0.3 0.03 250)' }}>알림설정 정책 안내</p>
          <p>• 기본 알림 채널은 카카오 알림톡입니다. SMS/LMS는 예외 상황에서 사용합니다.</p>
          <p>• 이번 단계에서는 실제 API 연동 없이 mock 발송으로 처리됩니다.</p>
          <p>• 자동발송은 출결 결석/조퇴 이벤트에만 기본 ON으로 설정되어 있습니다.</p>
          <p>• 지각/보강출석/공결은 자동발송 대상이 아닙니다 (알림설정 항목에 포함되지 않습니다).</p>
          <p>• 성적 공개 알림은 학생 ON, 보호자 OFF가 기본값입니다.</p>
          <p>• 알림설정 변경은 최고관리자/원장만 가능합니다.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
