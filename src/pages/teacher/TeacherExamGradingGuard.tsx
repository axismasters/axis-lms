// AXIS LMS v1.2 — Phase 3C: TeacherExamGradingGuard
// TeacherExamGrading.tsx는 불변 파일(MD5 고정)이라 직접 수정하지 않는다.
// 대신 이 래퍼가 라우트 레벨에서 먼저 "다른 교사의 개인 시험(TEACHER_PRIVATE)인지"를 확인하고,
// 소유자가 아니면 채점 화면 자체를 렌더링하지 않는다.
//
// 정책: 교사는 다른 교사 개인 시험을 채점/수정할 수 없다(공통 시험 채점은 기존과 동일하게 허용).

import { useParams, Link } from 'wouter';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import TeacherExamGrading from './TeacherExamGrading';

export default function TeacherExamGradingGuard() {
  const { examId } = useParams();
  const { currentUser } = useAuth();
  const { getExam } = useAssessment();

  const exam = examId ? getExam(examId) : undefined;
  const isOtherTeachersPrivateExam =
    !!exam && exam.scope === 'TEACHER_PRIVATE' && !!exam.ownerTeacherId && exam.ownerTeacherId !== currentUser.id;

  if (isOtherTeachersPrivateExam) {
    return (
      <TeacherLayout title="채점">
        <div className="max-w-lg mx-auto px-4 py-5">
          <Link href="/teacher/exams">
            <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
              <ChevronLeft size={14} />
              시험 목록
            </div>
          </Link>
          <div className="axis-card p-10 text-center">
            <ShieldAlert size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.55 0.2 27)' }} />
            <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>
              다른 선생님의 개인 시험지입니다.
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              선생님 개인 시험지는 만든 선생님만 채점할 수 있습니다.
            </div>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return <TeacherExamGrading />;
}
