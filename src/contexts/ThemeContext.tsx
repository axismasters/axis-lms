// AXIS LMS v1.2 - Theme Context
// 최소 형태로 생성 — 실제 원본 파일을 받지 못해 빌드 가능한 최소 Provider로 작성.
// App.tsx는 defaultTheme="light"로만 사용하므로, 다크모드 등 새 기능은 추가하지 않고
// children을 그대로 렌더링하는 패스스루 Provider로 둔다.

import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
