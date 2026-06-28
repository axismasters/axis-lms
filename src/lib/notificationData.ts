// AXIS LMS v1.2 - Notification Foundation v3 데이터 구조
// 출결/수강/재무/시험 이벤트에서 발생하는 알림의 타입, mock 데이터, 헬퍼 함수
//
// AXIS 확정 원칙:
// - 실제 카카오 알림톡 / SMS / LMS API 연동은 하지 않는다 (mock 처리).
// - 발송 이력은 절대 삭제하지 않는다 (소프트 처리 없음, 이력 영구 보존).
// - 템플릿 삭제 기능 없음 — 비활성 처리만 제공.
// - 독립 공지관리 엔진 없음. 상담관리 알림 없음. 대시보드 엔진 없음.

// ────────────────────────────────────────────────────────────
// 알림 유형 (NotificationType)
// ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'ATTENDANCE_ABSENCE'        // 결석 알림 (자동발송 ON)
  | 'ATTENDANCE_EARLY_LEAVE'    // 조퇴 알림 (자동발송 ON)
  | 'ATTENDANCE_LATE'           // 지각 알림 (설정 표시용, 자동발송 OFF)
  | 'ATTENDANCE_MAKEUP'         // 보강출석 알림 (설정 표시용, 자동발송 OFF)
  | 'ATTENDANCE_OFFICIAL'       // 공결 알림 (설정 표시용, 자동발송 OFF)
  | 'ENROLLMENT_CREATED'        // 수강 등록
  | 'ENROLLMENT_ENDED'          // 수강 종료
  | 'ENROLLMENT_WITHDRAWN'      // 퇴원 처리
  | 'FINANCE_INVOICE_ISSUED'    // 청구서 발행
  | 'FINANCE_UNPAID_REMINDER'   // 미납 안내
  | 'FINANCE_REFUND_REQUESTED'  // 환불 요청 접수
  | 'FINANCE_REFUND_APPROVED'   // 환불 승인
  | 'FINANCE_REFUND_REJECTED'   // 환불 반려
  | 'FINANCE_REFUND_COMPLETED'  // 환불 완료
  | 'ASSESSMENT_RESULT_PUBLISHED' // 성적 공개
  | 'MANUAL';                   // 수동 발송

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  ATTENDANCE_ABSENCE: '결석 알림',
  ATTENDANCE_EARLY_LEAVE: '조퇴 알림',
  ATTENDANCE_LATE: '지각 알림',
  ATTENDANCE_MAKEUP: '보강출석 알림',
  ATTENDANCE_OFFICIAL: '공결 알림',
  ENROLLMENT_CREATED: '수강 등록 안내',
  ENROLLMENT_ENDED: '수강 종료 안내',
  ENROLLMENT_WITHDRAWN: '퇴원 처리 안내',
  FINANCE_INVOICE_ISSUED: '청구서 발행 안내',
  FINANCE_UNPAID_REMINDER: '미납 안내',
  FINANCE_REFUND_REQUESTED: '환불 요청 접수',
  FINANCE_REFUND_APPROVED: '환불 승인 안내',
  FINANCE_REFUND_REJECTED: '환불 반려 안내',
  FINANCE_REFUND_COMPLETED: '환불 완료 안내',
  ASSESSMENT_RESULT_PUBLISHED: '성적 공개 안내',
  MANUAL: '수동 발송',
};

export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, string> = {
  ATTENDANCE_ABSENCE: '출결',
  ATTENDANCE_EARLY_LEAVE: '출결',
  ATTENDANCE_LATE: '출결',
  ATTENDANCE_MAKEUP: '출결',
  ATTENDANCE_OFFICIAL: '출결',
  ENROLLMENT_CREATED: '수강',
  ENROLLMENT_ENDED: '수강',
  ENROLLMENT_WITHDRAWN: '수강',
  FINANCE_INVOICE_ISSUED: '재무',
  FINANCE_UNPAID_REMINDER: '재무',
  FINANCE_REFUND_REQUESTED: '재무',
  FINANCE_REFUND_APPROVED: '재무',
  FINANCE_REFUND_REJECTED: '재무',
  FINANCE_REFUND_COMPLETED: '재무',
  ASSESSMENT_RESULT_PUBLISHED: '성적',
  MANUAL: '수동',
};

// ────────────────────────────────────────────────────────────
// 발송 채널
// ────────────────────────────────────────────────────────────
export type NotificationChannel = 'KAKAO' | 'SMS' | 'LMS';

export const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  KAKAO: '카카오 알림톡',
  SMS: 'SMS',
  LMS: 'LMS',
};

// ────────────────────────────────────────────────────────────
// 수신자 유형
// ────────────────────────────────────────────────────────────
export type RecipientType = 'STUDENT' | 'GUARDIAN' | 'STAFF';

export const RECIPIENT_TYPE_LABEL: Record<RecipientType, string> = {
  STUDENT: '학생',
  GUARDIAN: '보호자',
  STAFF: '직원',
};

// ────────────────────────────────────────────────────────────
// 관련 엔티티 유형
// ────────────────────────────────────────────────────────────
export type RelatedEntityType = 'ATTENDANCE' | 'ENROLLMENT' | 'FINANCE' | 'ASSESSMENT' | 'MANUAL';

export const RELATED_ENTITY_TYPE_LABEL: Record<RelatedEntityType, string> = {
  ATTENDANCE: '출결관리',
  ENROLLMENT: '수강등록',
  FINANCE: '재무관리',
  ASSESSMENT: '성적관리',
  MANUAL: '수동',
};

// ────────────────────────────────────────────────────────────
// 발송 상태
// ────────────────────────────────────────────────────────────
export type NotificationStatus = 'READY' | 'SENT' | 'FAILED' | 'CANCELED';

export const NOTIFICATION_STATUS_LABEL: Record<NotificationStatus, string> = {
  READY: '대기',
  SENT: '발송완료',
  FAILED: '실패',
  CANCELED: '취소',
};

// ────────────────────────────────────────────────────────────
// 발송이력 (NotificationMessage)
// ────────────────────────────────────────────────────────────
export interface NotificationMessage {
  id: string;
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
  status: NotificationStatus;
  requestedBy: string;       // 처리자 이름
  sentAt?: string;           // 발송 완료 시각 (ISO)
  failedReason?: string;     // 실패 사유
  memo?: string;
  createdAt: string;         // 이력 생성 시각 (ISO)
}

// ────────────────────────────────────────────────────────────
// 템플릿 (NotificationTemplate)
// ────────────────────────────────────────────────────────────
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  channel: NotificationChannel;
  title: string;
  content: string;
  variables: string[];       // 예: ['{{학생명}}', '{{반명}}', '{{날짜}}']
  isActive: boolean;
  isDefault: boolean;        // 기본 템플릿이면 true (비활성만 가능, 삭제 불가)
  updatedAt: string;         // ISO
  updatedBy: string;
}

// ────────────────────────────────────────────────────────────
// 알림 설정 (NotificationSetting)
// ────────────────────────────────────────────────────────────
export interface NotificationSetting {
  id: string;
  eventType: NotificationType;
  eventName: string;
  enabled: boolean;
  defaultChannel: NotificationChannel;
  sendToStudent: boolean;
  sendToGuardian: boolean;
  sendToStaff: boolean;
  autoSend: boolean;
  fallbackSmsEnabled: boolean;
  memo?: string;
}

// ────────────────────────────────────────────────────────────
// 기본 알림 설정 초기값 (AXIS 확정 정책)
// ────────────────────────────────────────────────────────────
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: 'ns-001',
    eventType: 'ATTENDANCE_ABSENCE',
    eventName: '결석 알림',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: true,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-002',
    eventType: 'ATTENDANCE_EARLY_LEAVE',
    eventName: '조퇴 알림',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: true,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-003',
    eventType: 'ENROLLMENT_CREATED',
    eventName: '수강 등록 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: true,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-004',
    eventType: 'ENROLLMENT_ENDED',
    eventName: '수강 종료 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: true,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-005',
    eventType: 'ENROLLMENT_WITHDRAWN',
    eventName: '퇴원 처리 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: true,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-006',
    eventType: 'FINANCE_INVOICE_ISSUED',
    eventName: '청구서 발행 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-007',
    eventType: 'FINANCE_UNPAID_REMINDER',
    eventName: '미납 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-008',
    eventType: 'FINANCE_REFUND_REQUESTED',
    eventName: '환불 요청 접수',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-009',
    eventType: 'FINANCE_REFUND_APPROVED',
    eventName: '환불 승인 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-010',
    eventType: 'FINANCE_REFUND_REJECTED',
    eventName: '환불 반려 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-011',
    eventType: 'FINANCE_REFUND_COMPLETED',
    eventName: '환불 완료 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: true,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  {
    id: 'ns-012',
    eventType: 'ASSESSMENT_RESULT_PUBLISHED',
    eventName: '성적 공개 안내',
    enabled: true,
    defaultChannel: 'KAKAO',
    sendToStudent: true,
    sendToGuardian: false,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
  },
  // ── 자동발송 OFF 항목 (명시적 표기) ──────────────────────────────────────
  {
    id: 'ns-013',
    eventType: 'ATTENDANCE_LATE',
    eventName: '지각 알림',
    enabled: false,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: false,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
    memo: '지각은 자동발송 대상이 아닙니다. (AXIS 확정 정책)',
  },
  {
    id: 'ns-014',
    eventType: 'ATTENDANCE_MAKEUP',
    eventName: '보강출석 알림',
    enabled: false,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: false,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
    memo: '보강출석은 자동발송 대상이 아닙니다. (AXIS 확정 정책)',
  },
  {
    id: 'ns-015',
    eventType: 'ATTENDANCE_OFFICIAL',
    eventName: '공결 알림',
    enabled: false,
    defaultChannel: 'KAKAO',
    sendToStudent: false,
    sendToGuardian: false,
    sendToStaff: false,
    autoSend: false,
    fallbackSmsEnabled: false,
    memo: '공결은 자동발송 대상이 아닙니다. (AXIS 확정 정책)',
  },
];

// ────────────────────────────────────────────────────────────
// 기본 템플릿 (9종)
// ────────────────────────────────────────────────────────────
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-001',
    type: 'ATTENDANCE_ABSENCE',
    name: '결석 알림',
    channel: 'KAKAO',
    title: '[AXIS] 결석 안내',
    content: '안녕하세요. {{학생명}} 학생의 {{날짜}} {{반명}} 수업 결석을 안내드립니다.\n\n사유가 있으신 경우 학원으로 연락 부탁드립니다.\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{날짜}}', '{{반명}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-002',
    type: 'ATTENDANCE_EARLY_LEAVE',
    name: '조퇴 알림',
    channel: 'KAKAO',
    title: '[AXIS] 조퇴 안내',
    content: '안녕하세요. {{학생명}} 학생이 {{날짜}} {{반명}} 수업에서 {{조퇴시간}}에 조퇴하였습니다.\n\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{날짜}}', '{{반명}}', '{{조퇴시간}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-003',
    type: 'ENROLLMENT_CREATED',
    name: '수강 등록 안내',
    channel: 'KAKAO',
    title: '[AXIS] 수강 등록 완료 안내',
    content: '안녕하세요. {{학생명}} 학생의 수강 등록이 완료되었습니다.\n\n반명: {{반명}}\n등록일: {{등록일}}\n수강 시작일: {{시작일}}\n\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{반명}}', '{{등록일}}', '{{시작일}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-004',
    type: 'ENROLLMENT_ENDED',
    name: '수강 종료 안내',
    channel: 'KAKAO',
    title: '[AXIS] 수강 종료 안내',
    content: '안녕하세요. {{학생명}} 학생의 {{반명}} 수강이 {{종료일}}자로 종료되었습니다.\n\n그동안 AXIS를 이용해 주셔서 감사합니다.\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{반명}}', '{{종료일}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-005',
    type: 'FINANCE_INVOICE_ISSUED',
    name: '청구서 발행 안내',
    channel: 'KAKAO',
    title: '[AXIS] {{청구월}} 수강료 청구 안내',
    content: '안녕하세요. {{학생명}} 학생의 {{청구월}} 수강료 청구서가 발행되었습니다.\n\n청구 금액: {{청구금액}}원\n납부 기한: {{납부기한}}\n\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{청구월}}', '{{청구금액}}', '{{납부기한}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-006',
    type: 'FINANCE_UNPAID_REMINDER',
    name: '미납 안내',
    channel: 'KAKAO',
    title: '[AXIS] 수강료 미납 안내',
    content: '안녕하세요. {{학생명}} 학생의 {{청구월}} 수강료가 아직 납부되지 않았습니다.\n\n미납 금액: {{미납금액}}원\n납부 기한: {{납부기한}}\n\n빠른 납부 부탁드립니다.\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{청구월}}', '{{미납금액}}', '{{납부기한}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-007',
    type: 'FINANCE_REFUND_REQUESTED',
    name: '환불 요청 접수',
    channel: 'KAKAO',
    title: '[AXIS] 환불 요청 접수 안내',
    content: '안녕하세요. {{학생명}} 학생의 환불 요청이 접수되었습니다.\n\n환불 요청 금액: {{환불금액}}원\n처리 현황은 학원으로 문의 부탁드립니다.\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{환불금액}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-008',
    type: 'FINANCE_REFUND_APPROVED',
    name: '환불 승인 안내',
    channel: 'KAKAO',
    title: '[AXIS] 환불 승인 안내',
    content: '안녕하세요. {{학생명}} 학생의 환불 요청이 승인되었습니다.\n\n환불 금액: {{환불금액}}원\n처리 예정일: {{처리예정일}}\n\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{환불금액}}', '{{처리예정일}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
  {
    id: 'tpl-009',
    type: 'ASSESSMENT_RESULT_PUBLISHED',
    name: '성적 공개 안내',
    channel: 'KAKAO',
    title: '[AXIS] 성적 공개 안내',
    content: '안녕하세요. {{학생명}} 학생의 {{시험명}} 성적이 공개되었습니다.\n\n성적은 학원 포털에서 확인하실 수 있습니다.\n문의: {{학원연락처}}',
    variables: ['{{학생명}}', '{{시험명}}', '{{학원연락처}}'],
    isActive: true,
    isDefault: true,
    updatedAt: '2025-03-01T09:00:00',
    updatedBy: '한태준',
  },
];

// ────────────────────────────────────────────────────────────
// Mock 발송이력 초기 데이터
// ────────────────────────────────────────────────────────────
export const INITIAL_NOTIFICATION_MESSAGES: NotificationMessage[] = [
  {
    id: 'msg-001',
    type: 'ATTENDANCE_ABSENCE',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '김보호자',
    recipientPhone: '010-1111-2222',
    studentId: 'stu-001',
    studentName: '김민준',
    relatedEntityType: 'ATTENDANCE',
    relatedEntityId: 'att-001',
    title: '[AXIS] 결석 안내',
    content: '안녕하세요. 김민준 학생의 2025-03-10 수학 심화반 수업 결석을 안내드립니다.',
    status: 'SENT',
    requestedBy: '한태준',
    sentAt: '2025-03-10T10:05:00',
    createdAt: '2025-03-10T10:05:00',
  },
  {
    id: 'msg-002',
    type: 'ATTENDANCE_EARLY_LEAVE',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '이보호자',
    recipientPhone: '010-2222-3333',
    studentId: 'stu-002',
    studentName: '이서연',
    relatedEntityType: 'ATTENDANCE',
    relatedEntityId: 'att-002',
    title: '[AXIS] 조퇴 안내',
    content: '안녕하세요. 이서연 학생이 2025-03-10 수업에서 14:30에 조퇴하였습니다.',
    status: 'SENT',
    requestedBy: '한태준',
    sentAt: '2025-03-10T14:35:00',
    createdAt: '2025-03-10T14:35:00',
  },
  {
    id: 'msg-003',
    type: 'FINANCE_INVOICE_ISSUED',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '박보호자',
    recipientPhone: '010-3333-4444',
    studentId: 'stu-003',
    studentName: '박지호',
    relatedEntityType: 'FINANCE',
    relatedEntityId: 'inv-001',
    title: '[AXIS] 2025-03 수강료 청구 안내',
    content: '안녕하세요. 박지호 학생의 2025-03 수강료 청구서가 발행되었습니다. 청구 금액: 350,000원',
    status: 'SENT',
    requestedBy: '행정 담당',
    sentAt: '2025-03-01T09:10:00',
    createdAt: '2025-03-01T09:10:00',
  },
  {
    id: 'msg-004',
    type: 'FINANCE_UNPAID_REMINDER',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '최보호자',
    recipientPhone: '010-4444-5555',
    studentId: 'stu-004',
    studentName: '최수빈',
    relatedEntityType: 'FINANCE',
    relatedEntityId: 'inv-002',
    title: '[AXIS] 수강료 미납 안내',
    content: '안녕하세요. 최수빈 학생의 2025-02 수강료가 아직 납부되지 않았습니다. 미납 금액: 300,000원',
    status: 'FAILED',
    requestedBy: '행정 담당',
    failedReason: '수신자 카카오 채널 미연결',
    createdAt: '2025-03-05T11:00:00',
  },
  {
    id: 'msg-005',
    type: 'ENROLLMENT_CREATED',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '정보호자',
    recipientPhone: '010-5555-6666',
    studentId: 'stu-005',
    studentName: '정민서',
    relatedEntityType: 'ENROLLMENT',
    relatedEntityId: 'enr-001',
    title: '[AXIS] 수강 등록 완료 안내',
    content: '안녕하세요. 정민서 학생의 수강 등록이 완료되었습니다. 반명: 수학 기초반, 수강 시작일: 2025-03-03',
    status: 'SENT',
    requestedBy: '행정 담당',
    sentAt: '2025-03-03T10:00:00',
    createdAt: '2025-03-03T10:00:00',
  },
  {
    id: 'msg-006',
    type: 'ASSESSMENT_RESULT_PUBLISHED',
    channel: 'KAKAO',
    recipientType: 'STUDENT',
    recipientName: '김민준',
    recipientPhone: '010-0001-0001',
    studentId: 'stu-001',
    studentName: '김민준',
    relatedEntityType: 'ASSESSMENT',
    relatedEntityId: 'exam-001',
    title: '[AXIS] 성적 공개 안내',
    content: '안녕하세요. 김민준 학생의 3월 모의고사 성적이 공개되었습니다.',
    status: 'SENT',
    requestedBy: '한태준',
    sentAt: '2025-03-15T16:00:00',
    createdAt: '2025-03-15T16:00:00',
  },
  {
    id: 'msg-007',
    type: 'FINANCE_REFUND_REQUESTED',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '강보호자',
    recipientPhone: '010-6666-7777',
    studentId: 'stu-006',
    studentName: '강다은',
    relatedEntityType: 'FINANCE',
    relatedEntityId: 'ref-001',
    title: '[AXIS] 환불 요청 접수 안내',
    content: '안녕하세요. 강다은 학생의 환불 요청이 접수되었습니다. 환불 요청 금액: 150,000원',
    status: 'SENT',
    requestedBy: '행정 담당',
    sentAt: '2025-03-12T13:00:00',
    createdAt: '2025-03-12T13:00:00',
  },
  {
    id: 'msg-008',
    type: 'MANUAL',
    channel: 'SMS',
    recipientType: 'GUARDIAN',
    recipientName: '윤보호자',
    recipientPhone: '010-7777-8888',
    studentId: 'stu-007',
    studentName: '윤재원',
    relatedEntityType: 'MANUAL',
    title: '[AXIS] 안내 말씀',
    content: '다음 주 화요일(3/19) 수업 일정이 변경됩니다. 별도 안내 드리겠습니다.',
    status: 'SENT',
    requestedBy: '한태준',
    sentAt: '2025-03-14T09:30:00',
    createdAt: '2025-03-14T09:30:00',
    memo: '수업 변경 개별 안내',
  },
  {
    id: 'msg-009',
    type: 'ATTENDANCE_ABSENCE',
    channel: 'KAKAO',
    recipientType: 'GUARDIAN',
    recipientName: '임보호자',
    recipientPhone: '010-8888-9999',
    studentId: 'stu-008',
    studentName: '임지수',
    relatedEntityType: 'ATTENDANCE',
    relatedEntityId: 'att-010',
    title: '[AXIS] 결석 안내',
    content: '안녕하세요. 임지수 학생의 2025-03-18 수학 심화반 수업 결석을 안내드립니다.',
    status: 'READY',
    requestedBy: '시스템',
    createdAt: '2025-03-18T10:00:00',
  },
];

// ────────────────────────────────────────────────────────────
// 헬퍼 함수
// ────────────────────────────────────────────────────────────

/** 오늘(로컬 기준) 발송된 이력 목록 */
export function getTodayMessages(messages: NotificationMessage[]): NotificationMessage[] {
  const today = new Date().toISOString().slice(0, 10);
  return messages.filter((m) => m.createdAt.slice(0, 10) === today);
}

/** 상태별 카운트 */
export function countByStatus(messages: NotificationMessage[]): Record<NotificationStatus, number> {
  const counts: Record<NotificationStatus, number> = { READY: 0, SENT: 0, FAILED: 0, CANCELED: 0 };
  messages.forEach((m) => { counts[m.status]++; });
  return counts;
}

/** 채널별 카운트 */
export function countByChannel(messages: NotificationMessage[]): Record<NotificationChannel, number> {
  const counts: Record<NotificationChannel, number> = { KAKAO: 0, SMS: 0, LMS: 0 };
  messages.forEach((m) => { counts[m.channel]++; });
  return counts;
}

/** 다음 메시지 ID 생성 */
export function generateMessageId(messages: NotificationMessage[]): string {
  const maxNum = messages.reduce((max, m) => {
    const n = parseInt(m.id.replace('msg-', ''), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `msg-${String(maxNum + 1).padStart(3, '0')}`;
}

/** 다음 템플릿 ID 생성 */
export function generateTemplateId(templates: NotificationTemplate[]): string {
  const maxNum = templates.reduce((max, t) => {
    const n = parseInt(t.id.replace('tpl-', ''), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `tpl-${String(maxNum + 1).padStart(3, '0')}`;
}

/** 알림 권한 helper */
export function canAccessNotifications(accountType: string): boolean {
  return ['SUPER_ADMIN', 'DIRECTOR', 'STAFF'].includes(accountType);
}

export function canSendManualNotification(accountType: string): boolean {
  return ['SUPER_ADMIN', 'DIRECTOR', 'STAFF'].includes(accountType);
}

export function canManageNotificationTemplates(accountType: string): boolean {
  return ['SUPER_ADMIN', 'DIRECTOR'].includes(accountType);
}

export function canManageNotificationSettings(accountType: string): boolean {
  return ['SUPER_ADMIN', 'DIRECTOR'].includes(accountType);
}

// ────────────────────────────────────────────────────────────
// 이벤트 기반 알림 생성 헬퍼
// ────────────────────────────────────────────────────────────

/** 이벤트로부터 알림 생성 시 사용하는 변수 맵 */
export interface NotificationVars {
  학생명?: string;
  보호자명?: string;
  반명?: string;
  날짜?: string;
  출결상태?: string;
  청구월?: string;
  청구금액?: string;
  미납금액?: string;
  환불금액?: string;
  납부기한?: string;
  수강시작일?: string;
  종료일?: string;
  시험명?: string;
  학원연락처?: string;
  [key: string]: string | undefined;
}

/** 템플릿 content에서 {{변수}} 치환 */
export function buildNotificationContent(template: string, vars: NotificationVars): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? `{{${key.trim()}}}`);
}

/** 알림 설정 조회 */
export function getNotificationSettingByType(
  settings: NotificationSetting[],
  eventType: NotificationType,
): NotificationSetting | undefined {
  return settings.find((s) => s.eventType === eventType);
}
