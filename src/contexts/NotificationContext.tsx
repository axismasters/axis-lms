// AXIS LMS v1.2 - NotificationContext
// 알림 발송이력 / 템플릿 / 알림설정을 관리하는 Context.
// 실제 API 연동 없음 — mock 처리만.

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  NotificationMessage,
  NotificationTemplate,
  NotificationSetting,
  NotificationType,
  NotificationChannel,
  RecipientType,
  RelatedEntityType,
  NotificationStatus,
  INITIAL_NOTIFICATION_MESSAGES,
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_NOTIFICATION_SETTINGS,
  generateMessageId,
  generateTemplateId,
} from '@/lib/notificationData';

// ────────────────────────────────────────────────────────────
// 수동 발송 페이로드 타입
// ────────────────────────────────────────────────────────────
export interface SendNotificationPayload {
  type: NotificationType;
  channel: NotificationChannel;
  recipientType: RecipientType;
  recipientName: string;
  recipientPhone: string;
  studentId?: string;
  studentName?: string;
  guardianId?: string;
  relatedEntityType: RelatedEntityType;
  relatedEntityId?: string;
  title: string;
  content: string;
  requestedBy: string;
  memo?: string;
}

// ────────────────────────────────────────────────────────────
// Context 타입
// ────────────────────────────────────────────────────────────
interface NotificationContextType {
  // 발송이력
  messages: NotificationMessage[];
  getNotificationHistory: () => NotificationMessage[];
  getNotificationsByType: (type: NotificationType) => NotificationMessage[];
  getNotificationsByRelatedEntity: (entityType: RelatedEntityType, entityId: string) => NotificationMessage[];
  sendMockNotification: (payload: SendNotificationPayload) => NotificationMessage;
  resendMockNotification: (notificationId: string) => { ok: boolean; reason?: string };
  updateMessageMemo: (id: string, memo: string) => void;

  // 템플릿
  templates: NotificationTemplate[];
  getDefaultTemplate: (eventType: NotificationType) => NotificationTemplate | undefined;
  updateNotificationTemplate: (templateId: string, data: Partial<NotificationTemplate>) => { ok: boolean; reason?: string };
  addNotificationTemplate: (data: Omit<NotificationTemplate, 'id' | 'updatedAt'>) => NotificationTemplate;
  toggleNotificationTemplate: (templateId: string) => void;

  // 알림설정
  settings: NotificationSetting[];
  shouldAutoSend: (eventType: NotificationType) => boolean;
  updateNotificationSetting: (settingId: string, data: Partial<NotificationSetting>) => void;
  saveAllSettings: (newSettings: NotificationSetting[]) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<NotificationMessage[]>(INITIAL_NOTIFICATION_MESSAGES);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_NOTIFICATION_TEMPLATES);
  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_NOTIFICATION_SETTINGS);

  // ── 발송이력 ─────────────────────────────────────────────
  const getNotificationHistory = useCallback(() => {
    return [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages]);

  const getNotificationsByType = useCallback((type: NotificationType) => {
    return messages.filter((m) => m.type === type);
  }, [messages]);

  const getNotificationsByRelatedEntity = useCallback((entityType: RelatedEntityType, entityId: string) => {
    return messages.filter((m) => m.relatedEntityType === entityType && m.relatedEntityId === entityId);
  }, [messages]);

  const sendMockNotification = useCallback((payload: SendNotificationPayload): NotificationMessage => {
    const now = new Date().toISOString();
    const newMsg: NotificationMessage = {
      id: generateMessageId(messages),
      ...payload,
      status: 'SENT' as NotificationStatus,
      sentAt: now,
      createdAt: now,
    };
    setMessages((prev) => [newMsg, ...prev]);
    return newMsg;
  }, [messages]);

  const resendMockNotification = useCallback((notificationId: string): { ok: boolean; reason?: string } => {
    const msg = messages.find((m) => m.id === notificationId);
    if (!msg) return { ok: false, reason: '발송이력을 찾을 수 없습니다.' };
    if (msg.status !== 'FAILED') return { ok: false, reason: '실패 상태인 건만 재발송할 수 있습니다.' };

    const now = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === notificationId
          ? { ...m, status: 'SENT' as NotificationStatus, sentAt: now, failedReason: undefined }
          : m
      )
    );
    return { ok: true };
  }, [messages]);

  const updateMessageMemo = useCallback((id: string, memo: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, memo } : m)));
  }, []);

  // ── 템플릿 ───────────────────────────────────────────────
  const getDefaultTemplate = useCallback((eventType: NotificationType): NotificationTemplate | undefined => {
    return templates.find((t) => t.type === eventType && t.isDefault && t.isActive);
  }, [templates]);

  const updateNotificationTemplate = useCallback((
    templateId: string,
    data: Partial<NotificationTemplate>
  ): { ok: boolean; reason?: string } => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return { ok: false, reason: '템플릿을 찾을 수 없습니다.' };
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? { ...t, ...data, updatedAt: new Date().toISOString() }
          : t
      )
    );
    return { ok: true };
  }, [templates]);

  const addNotificationTemplate = useCallback((
    data: Omit<NotificationTemplate, 'id' | 'updatedAt'>
  ): NotificationTemplate => {
    const newTpl: NotificationTemplate = {
      id: generateTemplateId(templates),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [...prev, newTpl]);
    return newTpl;
  }, [templates]);

  const toggleNotificationTemplate = useCallback((templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  // ── 알림설정 ─────────────────────────────────────────────
  const shouldAutoSend = useCallback((eventType: NotificationType): boolean => {
    const setting = settings.find((s) => s.eventType === eventType);
    return setting ? setting.enabled && setting.autoSend : false;
  }, [settings]);

  const updateNotificationSetting = useCallback((settingId: string, data: Partial<NotificationSetting>) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === settingId ? { ...s, ...data } : s))
    );
  }, []);

  const saveAllSettings = useCallback((newSettings: NotificationSetting[]) => {
    setSettings(newSettings);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        messages,
        getNotificationHistory,
        getNotificationsByType,
        getNotificationsByRelatedEntity,
        sendMockNotification,
        resendMockNotification,
        updateMessageMemo,
        templates,
        getDefaultTemplate,
        updateNotificationTemplate,
        addNotificationTemplate,
        toggleNotificationTemplate,
        settings,
        shouldAutoSend,
        updateNotificationSetting,
        saveAllSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
