// AXIS LMS v1.2 - 알림관리 > 발송이력
// 발송이력 조회 + 상세보기 + 재발송 + 수동발송 모달

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  NotificationMessage,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  RecipientType,
  RelatedEntityType,
  NOTIFICATION_TYPE_LABEL,
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_STATUS_LABEL,
  RECIPIENT_TYPE_LABEL,
  canAccessNotifications,
  canSendManualNotification,
  countByStatus,
  countByChannel,
  getTodayMessages,
} from '@/lib/notificationData';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────
// 수동발송 모달
// ────────────────────────────────────────────────────────────
interface ManualSendModalProps {
  open: boolean;
  onClose: () => void;
  currentUserName: string;
}

function ManualSendModal({ open, onClose, currentUserName }: ManualSendModalProps) {
  const { sendMockNotification } = useNotification();
  const [recipientType, setRecipientType] = useState<RecipientType>('GUARDIAN');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [channel, setChannel] = useState<NotificationChannel>('KAKAO');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memo, setMemo] = useState('');

  if (!open) return null;

  function handleSend() {
    if (!recipientName.trim() || !recipientPhone.trim() || !title.trim() || !content.trim()) {
      toast.error('수신자명, 연락처, 제목, 내용은 필수입니다.');
      return;
    }
    sendMockNotification({
      type: 'MANUAL',
      channel,
      recipientType,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      relatedEntityType: 'MANUAL',
      title: title.trim(),
      content: content.trim(),
      requestedBy: currentUserName,
      memo: memo.trim() || undefined,
    });
    toast.success('수동 발송이 완료되었습니다. (mock)');
    setRecipientType('GUARDIAN');
    setRecipientName('');
    setRecipientPhone('');
    setChannel('KAKAO');
    setTitle('');
    setContent('');
    setMemo('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'oklch(0.92 0.01 250)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>수동 발송</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.5 0.015 250)' }}>✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>수신자 유형</label>
            <div className="flex gap-2">
              {(['STUDENT', 'GUARDIAN', 'STAFF'] as RecipientType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setRecipientType(t)}
                  className="flex-1 py-2 rounded-lg border text-xs font-medium transition-colors"
                  style={{
                    background: recipientType === t ? 'oklch(0.25 0.05 250)' : 'white',
                    color: recipientType === t ? 'white' : 'oklch(0.4 0.02 250)',
                    borderColor: recipientType === t ? 'oklch(0.25 0.05 250)' : 'oklch(0.88 0.01 250)',
                  }}
                >
                  {RECIPIENT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>수신자명 *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
                placeholder="이름 입력"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>연락처 *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
                placeholder="010-0000-0000"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>
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
                    background: channel === c ? 'oklch(0.75 0.18 85)' : 'white',
                    color: channel === c ? 'oklch(0.2 0.05 85)' : 'oklch(0.4 0.02 250)',
                    borderColor: channel === c ? 'oklch(0.75 0.18 85)' : 'oklch(0.88 0.01 250)',
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
              placeholder="알림 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>내용 *</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              rows={4}
              placeholder="발송할 내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>메모 (선택)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
              placeholder="내부 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.4 0.02 250)' }}
            >
              취소
            </button>
            <button
              onClick={handleSend}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'oklch(0.25 0.05 250)', color: 'white' }}
            >
              발송 (mock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 상세보기 모달
// ────────────────────────────────────────────────────────────
interface DetailModalProps {
  message: NotificationMessage | null;
  onClose: () => void;
  onResend: (id: string) => void;
  onMemoSave: (id: string, memo: string) => void;
}

function DetailModal({ message, onClose, onResend, onMemoSave }: DetailModalProps) {
  const [memo, setMemo] = useState(message?.memo ?? '');

  if (!message) return null;

  const statusColor: Record<NotificationStatus, string> = {
    READY: 'oklch(0.65 0.12 250)',
    SENT: 'oklch(0.55 0.18 145)',
    FAILED: 'oklch(0.55 0.22 25)',
    CANCELED: 'oklch(0.6 0.01 250)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'oklch(0.92 0.01 250)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>발송 상세</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.5 0.015 250)' }}>✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>알림유형</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{NOTIFICATION_TYPE_LABEL[message.type]}</p></div>
            <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>채널</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{NOTIFICATION_CHANNEL_LABEL[message.channel]}</p></div>
            <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>수신자</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{message.recipientName} ({RECIPIENT_TYPE_LABEL[message.recipientType]})</p></div>
            <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>연락처</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{message.recipientPhone}</p></div>
            {message.studentName && (
              <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>학생명</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{message.studentName}</p></div>
            )}
            <div>
              <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>상태</span>
              <p className="font-semibold mt-0.5" style={{ color: statusColor[message.status] }}>{NOTIFICATION_STATUS_LABEL[message.status]}</p>
            </div>
            <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>처리자</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{message.requestedBy}</p></div>
            <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>생성일시</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{message.createdAt.slice(0, 16).replace('T', ' ')}</p></div>
            {message.sentAt && (
              <div><span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>발송일시</span><p className="font-medium mt-0.5" style={{ color: 'oklch(0.2 0.02 250)' }}>{message.sentAt.slice(0, 16).replace('T', ' ')}</p></div>
            )}
          </div>
          <div>
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>제목</span>
            <p className="text-sm font-medium mt-0.5 p-3 rounded-lg" style={{ background: 'oklch(0.97 0.005 250)', color: 'oklch(0.2 0.02 250)' }}>{message.title}</p>
          </div>
          <div>
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>내용</span>
            <pre className="text-sm mt-0.5 p-3 rounded-lg whitespace-pre-wrap" style={{ background: 'oklch(0.97 0.005 250)', color: 'oklch(0.2 0.02 250)', fontFamily: 'inherit' }}>{message.content}</pre>
          </div>
          {message.failedReason && (
            <div className="p-3 rounded-lg" style={{ background: 'oklch(0.97 0.03 25)' }}>
              <span className="text-xs font-medium" style={{ color: 'oklch(0.5 0.2 25)' }}>실패 사유</span>
              <p className="text-sm mt-0.5" style={{ color: 'oklch(0.4 0.15 25)' }}>{message.failedReason}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'oklch(0.45 0.02 250)' }}>메모</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.2 0.02 250)' }}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="내부 메모"
              />
              <button
                onClick={() => { onMemoSave(message.id, memo); toast.success('메모 저장됨'); }}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: 'oklch(0.97 0.01 250)', color: 'oklch(0.35 0.03 250)', border: '1px solid oklch(0.88 0.01 250)' }}
              >저장</button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {message.status === 'FAILED' && (
              <button
                onClick={() => { onResend(message.id); onClose(); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'oklch(0.55 0.22 25)', color: 'white' }}
              >재발송 (mock)</button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'oklch(0.88 0.01 250)', color: 'oklch(0.4 0.02 250)' }}
            >닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────────────────
export default function NotificationHistory() {
  const { currentUser } = useAuth();
  const { getNotificationHistory, resendMockNotification, updateMessageMemo } = useNotification();

  const [manualOpen, setManualOpen] = useState(false);
  const [detailMsg, setDetailMsg] = useState<NotificationMessage | null>(null);

  // 필터 상태
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterChannel, setFilterChannel] = useState<NotificationChannel | ''>('');
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | ''>('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filterStudent, setFilterStudent] = useState('');

  // 접근 권한 체크
  if (!canAccessNotifications(currentUser.accountType)) {
    return (
      <AdminLayout title="알림관리" breadcrumbs={[{ label: '알림관리' }, { label: '발송이력' }]}>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-2xl">🔒</span>
          <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>알림관리에 접근할 수 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const allMessages = getNotificationHistory();

  // 요약 카드용 데이터
  const todayMsgs = getTodayMessages(allMessages);
  const todayStatus = countByStatus(todayMsgs);
  const todayChannel = countByChannel(todayMsgs);

  // 필터 적용
  const filtered = useMemo(() => {
    return allMessages.filter((m) => {
      if (filterFrom && m.createdAt.slice(0, 10) < filterFrom) return false;
      if (filterTo && m.createdAt.slice(0, 10) > filterTo) return false;
      if (filterType && m.type !== filterType) return false;
      if (filterChannel && m.channel !== filterChannel) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (filterRecipient && !m.recipientName.includes(filterRecipient)) return false;
      if (filterStudent && !(m.studentName ?? '').includes(filterStudent)) return false;
      return true;
    });
  }, [allMessages, filterFrom, filterTo, filterType, filterChannel, filterStatus, filterRecipient, filterStudent]);

  function handleResend(id: string) {
    const result = resendMockNotification(id);
    if (result.ok) toast.success('재발송 처리되었습니다. (mock)');
    else toast.error(result.reason ?? '재발송 실패');
  }

  const statusBadge = (status: NotificationStatus) => {
    const map: Record<NotificationStatus, { bg: string; text: string }> = {
      READY: { bg: 'oklch(0.93 0.05 250)', text: 'oklch(0.35 0.1 250)' },
      SENT: { bg: 'oklch(0.92 0.08 145)', text: 'oklch(0.35 0.15 145)' },
      FAILED: { bg: 'oklch(0.93 0.07 25)', text: 'oklch(0.45 0.2 25)' },
      CANCELED: { bg: 'oklch(0.93 0.01 250)', text: 'oklch(0.5 0.01 250)' },
    };
    const c = map[status];
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: c.bg, color: c.text }}>
        {NOTIFICATION_STATUS_LABEL[status]}
      </span>
    );
  };

  const notifTypes = Object.entries(NOTIFICATION_TYPE_LABEL) as [NotificationType, string][];

  return (
    <AdminLayout title="발송이력" breadcrumbs={[{ label: '알림관리' }, { label: '발송이력' }]}>
      <ManualSendModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        currentUserName={currentUser.name}
      />
      <DetailModal
        message={detailMsg}
        onClose={() => setDetailMsg(null)}
        onResend={handleResend}
        onMemoSave={updateMessageMemo}
      />

      <div className="flex flex-col gap-5">
        {/* 상단 액션 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>발송이력</h2>
          {canSendManualNotification(currentUser.accountType) && (
            <button
              onClick={() => setManualOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
              style={{ background: 'oklch(0.25 0.05 250)', color: 'white' }}
            >
              ✉ 수동 발송
            </button>
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: '오늘 발송', value: todayMsgs.length, color: 'oklch(0.25 0.05 250)' },
            { label: '성공', value: todayStatus.SENT, color: 'oklch(0.45 0.18 145)' },
            { label: '실패', value: todayStatus.FAILED, color: 'oklch(0.5 0.22 25)' },
            { label: '대기', value: todayStatus.READY, color: 'oklch(0.5 0.1 250)' },
            { label: '카카오', value: todayChannel.KAKAO, color: 'oklch(0.65 0.18 85)' },
            { label: 'SMS/LMS', value: todayChannel.SMS + todayChannel.LMS, color: 'oklch(0.55 0.15 200)' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl p-4 bg-white shadow-sm border" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
              <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{card.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>기간 (시작)</label>
            <input type="date" className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>기간 (종료)</label>
            <input type="date" className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>알림유형</label>
            <select className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterType} onChange={(e) => setFilterType(e.target.value as NotificationType | '')}>
              <option value="">전체</option>
              {notifTypes.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>상태</label>
            <select className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as NotificationStatus | '')}>
              <option value="">전체</option>
              <option value="READY">대기</option>
              <option value="SENT">발송완료</option>
              <option value="FAILED">실패</option>
              <option value="CANCELED">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>수신자 / 학생</label>
            <div className="flex gap-1">
              <input className="w-1/2 border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} placeholder="수신자" value={filterRecipient} onChange={(e) => setFilterRecipient(e.target.value)} />
              <input className="w-1/2 border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: 'oklch(0.88 0.01 250)' }} placeholder="학생" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'oklch(0.93 0.01 250)' }}>
            <span className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>총 {filtered.length}건</span>
          </div>
          <div className="axis-table-scroll" style={{ maxHeight: 620 }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'oklch(0.97 0.005 250)' }}>
                  {['발송일시', '알림유형', '채널', '수신자', '학생명', '제목', '상태', '처리자', '관리'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', background: 'oklch(0.97 0.005 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.006 250)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-sm" style={{ color: 'oklch(0.6 0.01 250)' }}>발송이력이 없습니다.</td>
                  </tr>
                ) : (
                  filtered.map((msg, idx) => (
                    <tr key={msg.id} className="border-t" style={{ borderColor: 'oklch(0.95 0.005 250)', background: idx % 2 === 0 ? 'white' : 'oklch(0.99 0.002 250)' }}>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.01 250)' }}>{(msg.sentAt ?? msg.createdAt).slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.3 0.02 250)' }}>{NOTIFICATION_TYPE_LABEL[msg.type]}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.45 0.02 250)' }}>{NOTIFICATION_CHANNEL_LABEL[msg.channel]}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.3 0.02 250)' }}>{msg.recipientName}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.4 0.02 250)' }}>{msg.studentName ?? '-'}</td>
                      <td className="px-4 py-3 text-xs max-w-[180px] truncate" style={{ color: 'oklch(0.3 0.02 250)' }}>{msg.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{statusBadge(msg.status)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.01 250)' }}>{msg.requestedBy}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailMsg(msg)}
                            className="px-2 py-1 rounded-md text-xs"
                            style={{ background: 'oklch(0.95 0.01 250)', color: 'oklch(0.35 0.02 250)' }}
                          >상세</button>
                          {msg.status === 'FAILED' && (
                            <button
                              onClick={() => handleResend(msg.id)}
                              className="px-2 py-1 rounded-md text-xs font-medium"
                              style={{ background: 'oklch(0.93 0.07 25)', color: 'oklch(0.45 0.2 25)' }}
                            >재발송</button>
                          )}
                        </div>
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
