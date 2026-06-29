// AXIS LMS v1.2 - ParentRoutes (Parent Finance View Foundation v1)
// /parent/** — GUARDIAN 계정 전용. 모든 화면은 읽기 전용.

import { Route, Switch } from 'wouter';
import { RoleRoute } from './RoleRoute';
import ParentHome from '@/pages/parent/ParentHome';
import ParentAttendance from '@/pages/parent/ParentAttendance';
import ParentGrades from '@/pages/parent/ParentGrades';
import ParentFinance from '@/pages/parent/ParentFinance';
import ParentMockExams from '@/pages/parent/ParentMockExams';
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
        {/* 학부모 홈: 자녀 선택 + 수강반/출결/성적/수납 요약 */}
        <Route path="/parent" component={ParentHome} />

        {/* 자녀 출결 조회 */}
        <Route path="/parent/attendance" component={ParentAttendance} />

        {/* 자녀 성적 조회 (공개/반영 결과만) */}
        <Route path="/parent/grades" component={ParentGrades} />

        {/* 자녀 수납 내역 조회 (읽기 전용) */}
        <Route path="/parent/finance" component={ParentFinance} />

        {/* 자녀 모의고사 결과 조회 (읽기 전용) */}
        <Route path="/parent/mock-exams" component={ParentMockExams} />

        {/* 404 */}
        <Route component={() => <ParentPlaceholder title="페이지를 찾을 수 없습니다" />} />
      </Switch>
    </RoleRoute>
  );
}
