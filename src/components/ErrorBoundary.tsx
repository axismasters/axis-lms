// AXIS LMS v1.2 - Error Boundary
// 최소 형태로 생성 — 실제 원본 파일을 받지 못해 빌드 가능한 최소 클래스 컴포넌트로 작성.

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'oklch(0.2 0.02 250)' }}>문제가 발생했습니다</h1>
          <p style={{ fontSize: 13, color: 'oklch(0.5 0.015 250)' }}>{this.state.message ?? '알 수 없는 오류'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
