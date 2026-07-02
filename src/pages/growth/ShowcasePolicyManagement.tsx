// AXIS LMS v1.2 — Phase 3A: ShowcasePolicyManagement
// 관리자 성적 진열장 노출 정책 관리 화면
//
// 성적 진열장 노출 범위, 공개 기준, 학생 표시 항목을 관리자가 설정한다.
//
// 경로: /admin/growth/showcase-policy

import { useState } from 'react';
import { Trophy, Eye, EyeOff, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessGrowth } from '@/lib/rbac';
import { toast } from 'sonner';

interface ShowcasePolicy {
  showBestScore: boolean;
  showScoreTrend: boolean;
  showInternalGrade: boolean;
  showMockGrade: boolean;
  showEmblems: boolean;
  showSP: boolean;
  showRivalSummary: boolean;
  showTargetPreviewEntry: boolean;
  studentCanSeeRankInShowcase: boolean;
  parentCanSeeShowcase: boolean;
}

const DEFAULT_POLICY: ShowcasePolicy = {
  showBestScore: true,
  showScoreTrend: true,
  showInternalGrade: true,
  showMockGrade: true,
  showEmblems: true,
  showSP: true,
  showRivalSummary: true,
  showTargetPreviewEntry: true,
  studentCanSeeRankInShowcase: false,
  parentCanSeeShowcase: true,
};

const POLICY_ITEMS: { key: keyof ShowcasePolicy; label: string; desc: string; risk?: string }[] = [
  { key: 'showBestScore',          label: '최고 기록 표시',        desc: '학생 진열장에 과목별 최고 달성률/등급을 표시' },
  { key: 'showScoreTrend',         label: '성적 변화 추이',         desc: '최근 시험 대비 점수 변화(%p) 표시' },
  { key: 'showInternalGrade',      label: '내신 등급 표시',         desc: '실제 내신 최고 등급을 진열장에 노출' },
  { key: 'showMockGrade',          label: '모의고사 등급 표시',      desc: '전국모의/수능실전 최고 등급 노출' },
  { key: 'showEmblems',            label: '엠블럼 표시',            desc: '보유 엠블럼 목록을 진열장에 노출' },
  { key: 'showSP',                 label: 'SP 내역 표시',           desc: 'SP 포인트 내역 및 막대 그래프 표시' },
  { key: 'showRivalSummary',       label: 'Rival 요약 표시',        desc: '진열장 내 Rival 탭에 성장 비교 요약 표시' },
  { key: 'showTargetPreviewEntry', label: '목표대학 추천 입구',      desc: '진열장 하단 목표대학 추천/대학추천 링크' },
  { key: 'studentCanSeeRankInShowcase', label: '학생 등수 표시',   desc: '진열장에서 학반 내 등수 노출 (기본 비활성)', risk: '경쟁 심화 우려' },
  { key: 'parentCanSeeShowcase',   label: '학부모 진열장 접근',      desc: '학부모 포털에서 자녀 성장 진열장 요약 조회 가능' },
];

export default function ShowcasePolicyManagement() {
  const { currentUser } = useAuth();
  const [policy, setPolicy] = useState<ShowcasePolicy>(DEFAULT_POLICY);

  if (!canAccessGrowth(currentUser.accountType)) {
    return (
      <AdminLayout title="성적 진열장 정책 관리"
        breadcrumbs={[{ label: '성장관리', path: '/admin/growth/overview' }, { label: '진열장 정책' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>
            접근 권한이 없습니다. 최고관리자·원장 계정만 접근할 수 있습니다.
          </p>
        </div>
      </AdminLayout>
    );
  }

  function toggle(key: keyof ShowcasePolicy) {
    setPolicy(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    toast.success('진열장 정책이 저장되었습니다. (mock)');
  }

  const enabledCount = Object.values(policy).filter(Boolean).length;

  return (
    <AdminLayout title="성적 진열장 노출 정책"
      breadcrumbs={[{ label: '성장관리', path: '/admin/growth/overview' }, { label: '진열장 정책' }]}>
      <div className="max-w-2xl lg:max-w-3xl space-y-4">

        {/* 요약 */}
        <div className="axis-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'oklch(0.95 0.06 260)' }}>
              <Trophy size={18} style={{ color: '#040D1E' }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                성적 진열장 노출 정책
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.42 0.015 250)' }}>
                학생·학부모 진열장 화면에서 보여줄 항목을 제어합니다.
                현재 {enabledCount}/{POLICY_ITEMS.length}개 항목 활성화.
              </div>
            </div>
          </div>
        </div>

        {/* 정책 항목 토글 */}
        <div className="axis-card">
          {POLICY_ITEMS.map(({ key, label, desc, risk }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0"
              style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{label}</span>
                  {risk && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'oklch(0.93 0.06 27)', color: 'oklch(0.35 0.2 27)' }}>
                      {risk}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.47 0.015 250)' }}>{desc}</div>
              </div>
              <button type="button" onClick={() => toggle(key)}
                className="flex-shrink-0 flex items-center gap-1"
                style={{ color: policy[key] ? 'oklch(0.45 0.15 145)' : 'oklch(0.65 0.015 250)' }}>
                {policy[key]
                  ? <><ToggleRight size={26} /><Eye size={13} /></>
                  : <><ToggleLeft size={26} /><EyeOff size={13} /></>
                }
              </button>
            </div>
          ))}
        </div>

        {/* 저장 */}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setPolicy(DEFAULT_POLICY)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.4 0.015 250)' }}>
            기본값 복원
          </button>
          <button type="button" onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: '#040D1E', color: 'white' }}>
            <Save size={14} /> 정책 저장 (mock)
          </button>
        </div>

        <div className="axis-card px-4 py-3 text-xs" style={{ color: 'oklch(0.47 0.015 250)' }}>
          ※ mock 저장입니다. 실제 운영 시 DB 정책 연동 필요.
          성적 진열장은 학생·학부모에게만 노출되며, 관리자 화면의 성장현황과 분리됩니다.
        </div>
      </div>
    </AdminLayout>
  );
}
