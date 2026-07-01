// AXIS LMS v1.2 — Phase 3D v3-r6: TeacherScoreExport (강사 성적 출력)
// 강사 본인 실시 시험(TEACHER_PRIVATE 소유) 또는 담당 반/담당 학생 범위 시험 성적만
// Excel/PDF로 출력한다. 화면은 권한 스코프 계산만 담당하고, 실제 계산/생성은
// scoreExportEngine.ts(모듈) + ScoreExportPanel.tsx(공용 UI)에 위임한다.
//
// [교사 화면 시험 구조 정리 유지] 출력 대상 시험은 TEACHER_CREATABLE_EXAM_CATEGORY_IDS
// (단원평가/내신대비모의고사)만 포함한다 — 입학테스트/인증평가/수능실전모의고사 등
// 관리자 전용·성적 입력 자료 카테고리는 강사 성적 출력에도 절대 노출하지 않는다.

import TeacherLayout from '@/layouts/TeacherLayout';
import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import { TEACHER_CREATABLE_EXAM_CATEGORY_IDS } from '@/lib/assessmentData';
import ScoreExportPanel from '@/components/ScoreExportPanel';

export default function TeacherScoreExport() {
  const { currentUser } = useAuth();
  const { exams, submissions } = useAssessment();
  const { students } = useStudents();
  const { classes } = useClasses();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];

  // 강사 출력 범위: 본인 실시(TEACHER_PRIVATE 소유) 시험 + 담당 반/학원 전체 공통 시험.
  // 카테고리는 "내 시험지 관리"와 동일하게 단원평가/내신대비모의고사만 허용한다.
  const teacherExams = exams.filter((e) => {
    if (!(TEACHER_CREATABLE_EXAM_CATEGORY_IDS as readonly string[]).includes(e.categoryId)) return false;
    if (e.scope === 'TEACHER_PRIVATE') return e.ownerTeacherId === currentUser.id;
    return assignedClassIds.includes(e.classId ?? '') || !e.classId;
  });

  // 학생/반도 담당 범위로만 제한 — 다른 반/다른 교사 학생은 선택지에 나타나지 않는다.
  const teacherStudents = students.filter((s) => assignedStudentIds.includes(s.id));
  const teacherClasses = classes.filter((c) => assignedClassIds.includes(c.id));

  return (
    <TeacherLayout title="성적 출력">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <Link href="/teacher/exams">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#040D1E' }}>
            <ChevronLeft size={14} /> 내 시험지 관리
          </div>
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>성적 출력</h1>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
            본인 실시 시험과 담당 반·담당 학생 범위의 성적만 Excel 또는 A4 인쇄용 PDF로 출력합니다.
          </p>
        </div>
        <ScoreExportPanel
          scopeLabel="담당 반·담당 학생"
          availableExams={teacherExams}
          students={teacherStudents}
          classes={teacherClasses}
          submissions={submissions}
        />
      </div>
    </TeacherLayout>
  );
}
