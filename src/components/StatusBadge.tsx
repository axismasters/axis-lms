// AXIS LMS - 상태 배지 컴포넌트
import { StudentStatus } from '@/lib/dummyData';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: StudentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cls = {
    '재원': 'badge-active',
    '휴원': 'badge-pause',
    '퇴원': 'badge-leave',
    '대기': 'badge-pending',
  }[status];

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cls, className)}>
      {status}
    </span>
  );
}

export function AttendanceBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '출석': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    '지각': 'bg-amber-50 text-amber-700 border border-amber-200',
    '결석': 'bg-rose-50 text-rose-700 border border-rose-200',
    '조퇴': 'bg-orange-50 text-orange-700 border border-orange-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', styles[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

export function GradeBadge({ grade }: { grade: number }) {
  const colors = [
    '', // 0 unused
    'bg-[#E7EBF3] text-[#040D1E] border border-[#B8C2D9]', // 1 — [Phase 3D v3-r8] 구 indigo → Navy 브랜드색
    'bg-blue-50 text-blue-700 border border-blue-200', // 2
    'bg-sky-50 text-sky-700 border border-sky-200', // 3
    'bg-amber-50 text-amber-700 border border-amber-200', // 4
    'bg-orange-50 text-orange-700 border border-orange-200', // 5
    'bg-rose-50 text-rose-700 border border-rose-200', // 6
    'bg-red-50 text-red-700 border border-red-200', // 7
    'bg-slate-50 text-slate-700 border border-slate-200', // 8
    'bg-slate-100 text-slate-600 border border-slate-300', // 9
  ];
  return (
    <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', colors[grade] || colors[9])}>
      {grade}
    </span>
  );
}

export function formatPhone(phone: string) {
  return phone;
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
}
