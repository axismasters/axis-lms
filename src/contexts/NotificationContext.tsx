// AXIS LMS v1.2 - NotificationContext (v2 - Event Integration)
// 알림 발송이력 / 템플릿 / 알림설정을 관리하는 Context.
// 실제 API 연동 없음 — mock 처리만.
// v2: createNotificationFromEvent 추가 — 출결/수강/재무 이벤트에서 직접 호출 가능.

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
  NotificationVars,
  INITIAL_NOTIFICATION_MESSAGES,
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_NOTIFICATION_SETTINGS,
  generateMessageId,
  generateTemplateId,
  buildNotificationContent,
  getNotificationSettingByType,
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

// 이벤트 기반 알림 생성 페이로드
export interface NotificationEventPayload {
  studentId?: string;
  studentName?: string;
  guardianName?: string;
  guardianPhone?: string;
  className?: string;
  relatedEntityId?: string;
  relatedEntityType: RelatedEntityType;
  vars?: NotificationVars;
  requestedBy?: string;
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

  // 이벤트 기반 자동 알림 생성
  createNotificationFromEvent: (eventType: NotificationType, payload: NotificationEventPayload) => void;

  // 템플릿
  templates: NotificationTemplate[];
  getDefaultTemplate: (eventType: NotificationType) => NotificationTemplate | undefined;
  updateNotificationTemplate: (templateId: string, data: Partial<NotificationTemplate>) => { ok: boolean; reason?: string };
  addNotificationTemplate: (data: Omit<NotificationTemplate, 'id' | 'updatedAt'>) => NotificationTemplate;
  toggleNotificationTemplate: (templateId: string) => void;

  // 알림설정
  settings: NotificationSetting[];
  shouldAutoSend: (eventType: NotificationType) => boolean;
  getNotificationSetting: (eventType: NotificationType) => NotificationSetting | undefined;
  updateNotificationSetting: (settingId: string, data: Partial<NotificationSetting>) => void;
  saveAllSettings: (newSettings: NotificationSetting[]) => void;
  buildContent: (template: string, vars: NotificationVars) => string;
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

  // ── 이벤트 기반 알림 생성 ────────────────────────────────
  // 출결/수강/재무 이벤트에서 호출. 알림설정(enabled)을 확인한 후 mock 이력 생성.
  const createNotificationFromEvent = useCallback((
    eventType: NotificationType,
    payload: NotificationEventPayload,
  ) => {
    const setting = getNotificationSettingByType(settings, eventType);
    // 설정이 없거나 비활성화된 경우 생성하지 않음
    if (!setting || !setting.enabled) return;

    const now = new Date().toISOString();
    const channel: NotificationChannel = setting.defaultChannel;
    const by = payload.requestedBy ?? '시스템';

    // 공통 변수
    const vars: NotificationVars = {
      학원연락처: '02-0000-0000',
      날짜: now.slice(0, 10),
      ...payload.vars,
    };
    if (payload.studentName) vars['학생명'] = payload.studentName;
    if (payload.guardianName) vars['보호자명'] = payload.guardianName;
    if (payload.className) vars['반명'] = payload.className;

    // 기본 템플릿 제목/내용 조회
    const tpl = templates.find((t) => t.type === eventType && t.isActive);
    const baseTitle = tpl ? buildNotificationContent(tpl.title, vars) : `[AXIS] ${eventType}`;
    const baseContent = tpl ? buildNotificationContent(tpl.content, vars) : JSON.stringify(vars);

    const newMessages: NotificationMessage[] = [];

    // 보호자 발송
    if (setting.sendToGuardian) {
      const hasGuardian = !!(payload.guardianPhone);
      newMessages.push({
        id: '', // 아래에서 batch 생성 후 ID 부여
        type: eventType,
        channel,
        recipientType: 'GUARDIAN',
        recipientName: payload.guardianName ?? '보호자',
        recipientPhone: payload.guardianPhone ?? '',
        studentId: payload.studentId,
        studentName: payload.studentName,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        title: baseTitle,
        content: baseContent,
        status: 'SENT',
        requestedBy: by,
        sentAt: now,
        createdAt: now,
        memo: hasGuardian ? undefined : '보호자 연락처 없음 (mock)',
      });
    }

    // 학생 발송
    if (setting.sendToStudent) {
      newMessages.push({
        id: '',
        type: eventType,
        channel,
        recipientType: 'STUDENT',
        recipientName: payload.studentName ?? '학생',
        recipientPhone: '',
        studentId: payload.studentId,
        studentName: payload.studentName,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        title: baseTitle,
        content: baseContent,
        status: 'SENT',
        requestedBy: by,
        sentAt: now,
        createdAt: now,
      });
    }

    if (newMessages.length === 0) return;

    // ID 부여 후 상태에 추가
    setMessages((prev) => {
      let currentMax = prev.reduce((max, m) => {
        const n = parseInt(m.id.replace('msg-', ''), 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const withIds = newMessages.map((msg) => ({
        ...msg,
        id: `msg-${String(++currentMax).padStart(3, '0')}`,
      }));
      return [...withIds, ...prev];
    });
  }, [messages, settings, templates]);

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

  const getNotificationSetting = useCallback((eventType: NotificationType): NotificationSetting | undefined => {
    return getNotificationSettingByType(settings, eventType);
  }, [settings]);

  const updateNotificationSetting = useCallback((settingId: string, data: Partial<NotificationSetting>) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === settingId ? { ...s, ...data } : s))
    );
  }, []);

  const saveAllSettings = useCallback((newSettings: NotificationSetting[]) => {
    setSettings(newSettings);
  }, []);

  const buildContent = useCallback((template: string, vars: NotificationVars): string => {
    return buildNotificationContent(template, vars);
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
        createNotificationFromEvent,
        templates,
        getDefaultTemplate,
        updateNotificationTemplate,
        addNotificationTemplate,
        toggleNotificationTemplate,
        settings,
        shouldAutoSend,
        getNotificationSetting,
        updateNotificationSetting,
        saveAllSettings,
        buildContent,
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
