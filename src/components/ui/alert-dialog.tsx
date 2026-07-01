// shadcn/ui 스타일 AlertDialog — 최소 구현. Dialog와 동일한 패턴이며 Action/Cancel 버튼만 추가로 제공한다.
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function AlertDialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function AlertDialogContent({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn('w-full max-w-sm rounded-lg bg-white p-5 shadow-xl', className)}>{children}</div>;
}

export function AlertDialogHeader({ children }: { children?: ReactNode }) {
  return <div className="mb-2">{children}</div>;
}

export function AlertDialogTitle({ className, children }: { className?: string; children?: ReactNode }) {
  return <h2 className={cn('text-base font-semibold text-slate-900', className)}>{children}</h2>;
}

export function AlertDialogDescription({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={cn('text-sm text-slate-500 mt-1', className)}>{children}</p>;
}

export function AlertDialogFooter({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn('mt-4 flex items-center justify-end gap-2', className)}>{children}</div>;
}

export function AlertDialogCancel({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('h-8 px-3 rounded-md text-sm border border-slate-200 bg-white hover:bg-slate-50', className)} {...props}>
      {children}
    </button>
  );
}

export function AlertDialogAction({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('h-8 px-3 rounded-md text-sm text-white', className)} {...props}>
      {children}
    </button>
  );
}
