// 타입체크 검증용 — HTML 내장 태그(div, table, button 등)를 위한 최소 JSX 네임스페이스 스텁.
// 실제 호스트 빌드에서는 @types/react가 이 역할을 대체한다.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: any;
  }
}

// CSS side-effect import (main.tsx의 './index.css') — 실제 Vite 빌드에서는 자동 처리되지만,
// 격리 타입체크 환경에는 CSS 모듈 선언이 없어 별도로 추가한다.
declare module '*.css';
