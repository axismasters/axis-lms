// AXIS LMS v1.2 — Phase 3D v3-r6: ScoreExportPage (관리자 성적 출력)
// 학원 전체 시험 성적 Excel/PDF 출력 — 최고관리자/원장 전용.
// 화면은 권한 판단 + 데이터 취합만 담당하고, 실제 계산/생성은
// scoreExportEngine.ts(모듈) + ScoreExportPanel.tsx(공용 UI)에 위임한다.

import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { canExportAcademyWideScores } from '@/lib/rbac';
import ScoreExportPanel from '@/components/ScoreExportPanel';

export default function ScoreExportPage() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const { students } = useStudents();
  const { classes } = useClasses();

  const allowed = canExportAcademyWideScores(currentUser.accountType);

  if (!allowed) {
    return (
      <AdminLayout title="성적 출력" breadcrumbs={[{ label: '시험 및 성적 관리', path: '/admin/scores' }, { label: '성적 출력' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>접근 권한이 없습니다.</p>
          <p className="text-xs" style={{ color: 'oklch(0.47 0.015 250)' }}>
            학원 전체 시험 성적 출력은 최고관리자·원장 계정만 이용할 수 있습니다.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="성적 출력" breadcrumbs={[{ label: '시험 및 성적 관리', path: '/admin/scores' }, { label: '성적 출력' }]}>
      <div className="mb-5">
        <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>성적 출력</h1>
        <p className="text-xs mt-0.5" style={{ color: 'oklch(0.4 0.015 250)' }}>
          학원 전체 시험 성적을 Excel 또는 A4 인쇄용 PDF로 출력합니다.
        </p>
      </div>
      <ScoreExportPanel
        scopeLabel="학원 전체"
        availableExams={exams}
        students={students}
        classes={classes}
        submissions={submissions}
      />
    </AdminLayout>
  );
}
