// shadcn/ui 스타일 Dialog — 최소 구현. Radix 의존성 없이 고정 오버레이 + 카드로 동일한 외부 인터페이스만 재현한다.
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function DialogContent({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('w-full rounded-lg bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto', className)}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children?: ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children?: ReactNode }) {
  return <h2 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h2>;
}

export function DialogFooter({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn('mt-4 flex items-center justify-end gap-2', className)}>{children}</div>;
}
