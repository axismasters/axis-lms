// AXIS LMS v1.2 — Phase 3C: TeacherExamGradingGuard
// TeacherExamGrading.tsx 진입 전 라우트 레벨 접근 제어 래퍼.
// "다른 교사의 개인 시험(TEACHER_PRIVATE)인지"를 먼저 확인하고, 소유자가 아니면 채점
// 화면 자체를 렌더링하지 않는다.
//
// 정책: 교사는 다른 교사 개인 시험을 채점/수정할 수 없다(공통 시험 채점은 기존과 동일하게 허용).
// [교사 화면 시험 구조 정리] 입학테스트/인증평가(관리자 전용 출제)·수능실전모의고사(성적
// 입력 자료로 재분류)는 "내 시험지 관리"에서 이미 제외되지만, URL 직접 접근 방어를 위해
// 이 래퍼에서도 카테고리를 다시 확인한다(이중 방어).

import { useParams, Link } from 'wouter';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { TEACHER_CREATABLE_EXAM_CATEGORY_IDS } from '@/lib/assessmentData';
import TeacherExamGrading from './TeacherExamGrading';

export default function TeacherExamGradingGuard() {
  const { examId } = useParams();
  const { currentUser } = useAuth();
  const { getExam } = useAssessment();

  const exam = examId ? getExam(examId) : undefined;
  const isOtherTeachersPrivateExam =
    !!exam && exam.scope === 'TEACHER_PRIVATE' && !!exam.ownerTeacherId && exam.ownerTeacherId !== currentUser.id;
  const isNonTeacherCategory =
    !!exam && !(TEACHER_CREATABLE_EXAM_CATEGORY_IDS as readonly string[]).includes(exam.categoryId);

  if (isOtherTeachersPrivateExam || isNonTeacherCategory) {
    return (
      <TeacherLayout title="내 시험지 관리">
        <div className="max-w-lg mx-auto px-4 py-5">
          <Link href="/teacher/exams">
            <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: '#040D1E' }}>
              <ChevronLeft size={14} />
              시험 목록
            </div>
          </Link>
          <div className="axis-card p-10 text-center">
            <ShieldAlert size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.55 0.2 27)' }} />
            <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>
              {isNonTeacherCategory ? '이 화면에서 채점할 수 없는 시험입니다.' : '다른 선생님의 개인 시험지입니다.'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
              {isNonTeacherCategory
                ? '관리자 전용 시험이거나 성적 입력 자료입니다. 성적 입력은 대학추천 데이터 화면을 이용해주세요.'
                : '선생님 개인 시험지는 만든 선생님만 채점할 수 있습니다.'}
            </div>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return <TeacherExamGrading />;
}
