// shadcn/ui 스타일 TooltipProvider — 최소 구현. 이 프로젝트에서 Tooltip 콘텐츠 자체는 사용하지 않으므로
// (App.tsx가 Provider만 감싸는 용도로 사용) Radix 의존성 없이 패스스루로 둔다.
import { ReactNode } from 'react';

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
