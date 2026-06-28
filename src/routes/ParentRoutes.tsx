// AXIS LMS v1.2 - ParentRoutes
// /parent/** — GUARDIAN 계정 전용.

import { Route, Switch } from 'wouter';
import { RoleRoute } from './RoleRoute';
import ParentHome from '@/pages/parent/ParentHome';
import ParentLayout from '@/layouts/ParentLayout';

function ParentPlaceholder({ title }: { title: string }) {
  return (
    <ParentLayout title={title}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'oklch(0.95 0.04 250)' }}>
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-sm font-medium text-center" style={{ color: 'oklch(0.4 0.015 250)' }}>
          {title} 화면은 다음 단계에서 구현됩니다.
        </p>
      </div>
    </ParentLayout>
  );
}

export default function ParentRoutes() {
  return (
    <RoleRoute allow={['GUARDIAN']}>
      <Switch>
        <Route path="/parent" component={ParentHome} />
        <Route path="/parent/attendance" component={() => <ParentPlaceholder title="자녀 출결" />} />
        <Route path="/parent/finance" component={() => <ParentPlaceholder title="수납 내역" />} />
        <Route path="/parent/notices" component={() => <ParentPlaceholder title="알림" />} />
        <Route component={() => <ParentPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
