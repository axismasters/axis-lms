// AXIS LMS v1.2 - 출결관리 데이터 구조
// 출결 상태: 출석, 지각, 조퇴, 결석, 보강출석, 공결
// 알림: 결석/조퇴만 자동 발송 (카카오 알림톡 기본, 예외 시 SMS/LMS)

export type AttendanceStatus =
  | '출석'
  | '지각'
  | '조퇴'
  | '결석'
  | '보강출석'
  | '공결';

export type NotifyChannel = '카카오알림톡' | 'SMS' | 'LMS' | '미발송';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;           // YYYY-MM-DD
  status: AttendanceStatus;
  reason?: string;        // 결석은 필수, 그 외 선택
  note?: string;          // 운영 메모
  notified: boolean;      // 알림 발송 여부
  notifyChannel?: NotifyChannel;
  notifyTime?: string;    // HH:MM
  createdBy: string;      // 세션을 시작한 처리자(전체 출석 초기화 시점)
  createdAt: string;
  updatedBy?: string;     // 이 레코드의 상태를 마지막으로 변경(저장)한 처리자 — 결석/지각 등 개별 수정 시 기록
  updatedAt?: string;
}

// 출결 세션: 특정 날짜 특정 반의 출결 체크 단위
export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  checkedAt?: string;     // 체크 완료 시각
  checkedBy?: string;
  isLocked: boolean;      // 잠금 여부 (체크 완료 후)
  records: AttendanceRecord[];
}

// 알림 발송 대상 상태
export const NOTIFY_STATUSES: AttendanceStatus[] = ['결석', '조퇴'];
// 알림 미발송 상태
export const NO_NOTIFY_STATUSES: AttendanceStatus[] = ['지각', '보강출석', '공결'];

// 알림상태 표시 라벨 — 출결현황 목록 등에서 사용.
// 정책: 결석/조퇴 = 발송됨(발송 처리 후)/미발송(아직 처리 전), 지각/보강출석/공결 = 항상 미발송,
//      출석 = 알림 발송 대상이 아니므로 "해당없음".
export function notificationStatusLabel(status: AttendanceStatus, notified: boolean): '발송됨' | '미발송' | '해당없음' {
  if (status === '출석') return '해당없음';
  if (NOTIFY_STATUSES.includes(status)) return notified ? '발송됨' : '미발송';
  return '미발송'; // 지각, 보강출석, 공결 — 정책상 자동 발송 대상이 아님(항상 미발송으로 표시)
}

// 상태별 스타일
export const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  notify: boolean;
}> = {
  '출석': {
    label: '출석',
    bg: 'oklch(0.94 0.08 160)',
    text: 'oklch(0.28 0.15 160)',
    border: 'oklch(0.85 0.1 160)',
    notify: false,
  },
  '지각': {
    label: '지각',
    bg: 'oklch(0.95 0.08 60)',
    text: 'oklch(0.42 0.14 60)',
    border: 'oklch(0.88 0.1 60)',
    notify: false,
  },
  '조퇴': {
    label: '조퇴',
    bg: 'oklch(0.95 0.07 30)',
    text: 'oklch(0.42 0.14 30)',
    border: 'oklch(0.88 0.09 30)',
    notify: true,
  },
  '결석': {
    label: '결석',
    bg: 'oklch(0.96 0.08 27)',
    text: 'oklch(0.45 0.2 27)',
    border: 'oklch(0.88 0.12 27)',
    notify: true,
  },
  '보강출석': {
    label: '보강출석',
    bg: 'oklch(0.95 0.06 250)',
    text: 'oklch(0.38 0.18 250)',
    border: 'oklch(0.88 0.1 250)',
    notify: false,
  },
  '공결': {
    label: '공결',
    bg: 'oklch(0.96 0.005 250)',
    text: 'oklch(0.5 0.015 250)',
    border: 'oklch(0.9 0.005 250)',
    notify: false,
  },
};

// 더미 출결 데이터 생성 헬퍼
function makeId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

// 로컬(한국) 날짜 기준 YYYY-MM-DD 포맷터.
// toISOString()은 UTC 기준이라 한국 시간 새벽(0~9시)에는 날짜가 하루 밀려 나올 수 있어 사용하지 않는다.
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 날짜 범위 생성 (최근 30일 중 수업일만)
function getRecentDates(daysBack: number, count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = daysBack; i >= 0 && dates.length < count; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay(); // 0=일, 1=월 ...
    if (dow !== 0 && dow !== 6) { // 평일만
      dates.push(formatLocalDate(d));
    }
  }
  return dates;
}

// 더미 출결 세션 생성
export function generateDummySessions(): AttendanceSession[] {
  const sessions: AttendanceSession[] = [];
  let recId = 1;

  // cls-001: 고3 수학 심화반 (월수금 18:00~20:00)
  // 수강생: stu-001(김지수), stu-002(이준혁), stu-003(최민서), stu-004(송민준)
  const cls001Students = ['stu-001', 'stu-002', 'stu-003', 'stu-004'];
  const cls001Dates = getRecentDates(30, 8);

  cls001Dates.forEach((date, di) => {
    const records: AttendanceRecord[] = cls001Students.map((stuId, si) => {
      // 패턴: 대부분 출석, 일부 예외
      let status: AttendanceStatus = '출석';
      if (stuId === 'stu-003' && di === 2) status = '결석';
      if (stuId === 'stu-003' && di === 5) status = '지각';
      if (stuId === 'stu-002' && di === 3) status = '조퇴';
      if (stuId === 'stu-001' && di === 6) status = '공결';
      if (stuId === 'stu-004' && di === 1) status = '보강출석';

      const needNotify = NOTIFY_STATUSES.includes(status);
      return {
        id: makeId('att', recId++),
        classId: 'cls-001',
        studentId: stuId,
        date,
        status,
        reason: status === '결석' ? '개인 사정' : status === '조퇴' ? '몸이 좋지 않음' : undefined,
        notified: needNotify && di < cls001Dates.length - 1,
        notifyChannel: needNotify ? '카카오알림톡' : undefined,
        notifyTime: needNotify && di < cls001Dates.length - 1 ? '20:05' : undefined,
        createdBy: '강사',
        createdAt: `${date}T20:00:00`,
      };
    });

    sessions.push({
      id: makeId('sess', di + 1),
      classId: 'cls-001',
      date,
      checkedAt: di < cls001Dates.length - 1 ? `${date}T20:05:00` : undefined,
      checkedBy: di < cls001Dates.length - 1 ? '김민준' : undefined,
      isLocked: di < cls001Dates.length - 1,
      records,
    });
  });

  // cls-002: 고2 영어 독해반 (화목 17:00~19:00)
  // 수강생: stu-001(김지수), stu-005(정하은), stu-006(한도현)
  const cls002Students = ['stu-001', 'stu-005', 'stu-006'];
  const cls002Dates = getRecentDates(20, 5);

  cls002Dates.forEach((date, di) => {
    const records: AttendanceRecord[] = cls002Students.map((stuId) => {
      let status: AttendanceStatus = '출석';
      if (stuId === 'stu-006' && di === 1) status = '결석';
      if (stuId === 'stu-005' && di === 3) status = '지각';

      const needNotify = NOTIFY_STATUSES.includes(status);
      return {
        id: makeId('att', recId++),
        classId: 'cls-002',
        studentId: stuId,
        date,
        status,
        reason: status === '결석' ? '병원 방문' : undefined,
        notified: needNotify && di < cls002Dates.length - 1,
        notifyChannel: needNotify ? '카카오알림톡' : undefined,
        notifyTime: needNotify && di < cls002Dates.length - 1 ? '19:10' : undefined,
        createdBy: '강사',
        createdAt: `${date}T19:00:00`,
      };
    });

    sessions.push({
      id: makeId('sess', 100 + di),
      classId: 'cls-002',
      date,
      checkedAt: di < cls002Dates.length - 1 ? `${date}T19:05:00` : undefined,
      checkedBy: di < cls002Dates.length - 1 ? '이서연' : undefined,
      isLocked: di < cls002Dates.length - 1,
      records,
    });
  });

  return sessions;
}

export const DUMMY_SESSIONS = generateDummySessions();
