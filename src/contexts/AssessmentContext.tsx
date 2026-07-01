// AXIS LMS v1.2 - AssessmentContext
// 시험 생성/채점/공개/정정을 관리한다. ClassContext.tsx/AttendanceContext.tsx와 동일한
// "더미 데이터를 useState로 보관하고 CRUD 함수를 노출"하는 패턴을 따른다.
//
// 성적 수정은 직접 수정이 아니라 "정정(correction)" 처리 구조로 준비한다 — 공개완료 이후의 점수
// 변경은 correctScore를 통해서만 가능하며 사유와 이력이 함께 기록된다. 공개 전(채점 단계)에는
// gradeAnswer/setStudentAnswer로 자유롭게 입력/수정할 수 있다.
//
// AXIS 확정 정책(시험 상태 관리 축소 / 공개 흐름 분리):
//   - 반 단위 시험(classId 있음)은 전원 채점완료 시 별도 "공개" 액션 없이 학생 성적조회에 반영된다.
//   - 학원 전체 시험(classId 없음)만 명시적 publishExam()을 거쳐야 하며, 미채점 인원이 있으면 거부된다.
//   - "준비중/응시중/채점중" 같은 사용자 운영 상태는 화면에 노출하지 않고, 공개 여부(publishedAt)와
//     채점 완료 여부(canPublishExam/getExamPhase)로만 진행 상황을 판단한다.

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Exam, ExamSubmission, ExamQuestionDef, SubmissionStatus, ScoreCorrectionLog,
  StudentExamResult, ExamScope,
  DUMMY_EXAMS, DUMMY_SUBMISSIONS,
  applyAutoGrading, recalcTotalScore, canPublishExam, isSubmissionGraded, requiresPublishAction,
  getPublishedResultsForStudent as filterPublishedResultsForStudent,
} from '@/lib/assessmentData';
import { useNotification } from '@/contexts/NotificationContext';
import { useStudents } from '@/contexts/StudentContext';
import { useEmployees } from '@/contexts/EmployeeContext';

interface NewExamInput {
  title: string;
  categoryId: string;
  classId?: string;
  subject?: string;
  examDate: string;
  questions: ExamQuestionDef[];
  createdBy: string;
  // ─── Phase 3C: scope 분리 — 호출부(관리자 폼/교사 폼)가 명시적으로 지정한다 ─────
  scope: ExamScope;
  ownerTeacherId?: string | null;   // TEACHER_PRIVATE일 때 생성 교사 id
  targetGrade?: string;             // GRADE_COMMON일 때 대상 학년
  targetCourseId?: string;          // COURSE_COMMON일 때 대상 과정 id
}

interface AssessmentContextType {
  exams: Exam[];
  submissions: ExamSubmission[];

  getExam: (id: string) => Exam | undefined;
  getSubmissionsByExam: (examId: string) => ExamSubmission[];
  getSubmission: (examId: string, studentId: string) => ExamSubmission | undefined;

  // 시험 생성 — 대상 학생 id 목록을 받아 "응시예정" 상태의 submission을 함께 만든다.
  addExam: (input: NewExamInput, targetStudentIds: string[]) => Exam;
  updateExam: (id: string, patch: Partial<Pick<Exam, 'title' | 'categoryId' | 'classId' | 'examDate' | 'questions' | 'totalScore'>>) => void;

  // 응시 상태
  markAbsent: (examId: string, studentId: string) => void;
  markAttended: (examId: string, studentId: string) => void; // 결석 취소(응시로 환원)

  // 채점 — 문항 단위. 자동채점 대상 문항(객관식/OX/단답형)은 학생 답안을 입력해야 자동채점이 가능하다.
  autoGradeSubmission: (examId: string, studentId: string) => void;
  gradeAnswer: (examId: string, studentId: string, questionId: string, score: number, gradedBy: string) => void;
  // 자동채점 대상 문항의 학생 답안 입력 — 입력 즉시 그 문항만 정답과 비교해 자동 채점된다
  // (score/isCorrect/gradedBy/gradedAt이 함께 채워짐). 새 시험 생성 시 비어 있던 studentAnswer를
  // 메우는 용도이며, 문제은행/OMR/학생 제출 포털 없이 관리자·강사가 직접 입력하는 MVP 수준이다.
  setStudentAnswer: (examId: string, studentId: string, questionId: string, answer: string) => void;

  // 공개 — 미채점 응시자가 있으면 거부한다(AXIS 확정 정책).
  canPublish: (examId: string) => boolean;
  publishExam: (examId: string, publishedBy: string) => { ok: boolean; reason?: string };

  // 정정 — 공개완료 후 점수를 바꿀 때 사용. 직접 덮어쓰지 않고 이력을 남긴다.
  correctScore: (examId: string, studentId: string, questionId: string | undefined, newScore: number, reason: string, correctedBy: string) => void;

  // ── 학생/보호자 포털 전용 — 공개 필터 ─────────────────────────────
  // 공개 기준: 반 단위 시험은 채점완료 시, 학원 전체 시험은 publishedAt 확정 후.
  // 결석/미채점은 항상 제외. 포털 화면은 반드시 이 함수를 통해 성적을 조회한다.
  getPublishedResultsForStudent: (studentId: string) => StudentExamResult[];

  // ── 강사 포털 전용 ──────────────────────────────────────────────
  // 총점 직접 입력 방식 채점 — 문항별 breakdown 없이 totalScore만 지정한다.
  // 담당 학생 범위 검증은 TeacherExamGrading.tsx에서 1차 처리.
  // Context는 점수 범위·결석 여부를 2차 방어한다.
  gradeSubmissionByTeacher: (
    examId: string,
    studentId: string,
    totalScore: number,
    gradedBy: string,
    note?: string,
  ) => { ok: boolean; reason?: string };
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>(DUMMY_EXAMS);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(DUMMY_SUBMISSIONS);
  const { createAssessmentPublishedNotification } = useNotification();
  const { students } = useStudents();
  const { getEmployeeByAccountId } = useEmployees();

  const getExam = useCallback((id: string) => exams.find((e) => e.id === id), [exams]);
  const getSubmissionsByExam = useCallback((examId: string) => submissions.filter((s) => s.examId === examId), [submissions]);
  const getSubmission = useCallback(
    (examId: string, studentId: string) => submissions.find((s) => s.examId === examId && s.studentId === studentId),
    [submissions]
  );

  const addExam = useCallback((input: NewExamInput, targetStudentIds: string[]): Exam => {
    const id = `exam-${Date.now()}`;
    const totalScore = input.questions.reduce((sum, q) => sum + q.points, 0);
    // Phase 3C: TEACHER_PRIVATE는 visibility/ownerTeacherId를 서버(mock) 단에서도 한 번 더 강제한다.
    // 호출부가 scope는 TEACHER_PRIVATE로 넘기면서 ownerTeacherId를 빠뜨리는 실수를 막기 위함.
    const isPrivate = input.scope === 'TEACHER_PRIVATE';
    const newExam: Exam = {
      id,
      title: input.title,
      categoryId: input.categoryId,
      classId: input.classId,
      subject: input.subject,
      examDate: input.examDate,
      totalScore,
      questions: input.questions,
      status: '준비중',
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      scope: input.scope,
      ownerTeacherId: isPrivate ? (input.ownerTeacherId ?? input.createdBy) : null,
      targetGrade: input.targetGrade,
      targetCourseId: input.targetCourseId,
      sourceType: isPrivate ? 'TEACHER_PRIVATE' : 'ADMIN_COMMON',
      visibility: isPrivate ? 'OWNER_ONLY' : 'COMMON',
    };
    setExams((prev) => [newExam, ...prev]);
    setSubmissions((prev) => [
      ...prev,
      ...targetStudentIds.map((studentId) => ({
        id: `sub-${id}-${studentId}`,
        examId: id,
        studentId,
        status: '응시예정' as SubmissionStatus,
        answers: input.questions.map((q) => ({ questionId: q.id })),
        totalScore: undefined,
        corrections: [] as ScoreCorrectionLog[],
      })),
    ]);
    return newExam;
  }, []);

  const updateExam = useCallback((id: string, patch: Partial<Pick<Exam, 'title' | 'categoryId' | 'classId' | 'examDate' | 'questions' | 'totalScore'>>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  // 결석 처리 — answers를 빈 답안으로 초기화해 이전에 채점된 score/isCorrect/studentAnswer가
  // 잔존하지 않게 한다(결석 처리 시 점수 잔존 버그 수정). recalcTotalScore는 status가 '결석'이면
  // 항상 totalScore를 undefined로 두므로, 결석 학생은 성적 계산(평균/최고/최저, 성적조회 반영)에서
  // 자연히 제외된다.
  const markAbsent = useCallback((examId: string, studentId: string) => {
    setSubmissions((prev) => prev.map((s) => {
      if (s.examId !== examId || s.studentId !== studentId) return s;
      const clearedAnswers = s.answers.map((a) => ({ questionId: a.questionId }));
      return recalcTotalScore({ ...s, status: '결석', answers: clearedAnswers });
    }));
  }, []);

  // 결석 취소 — 다시 응시 대상으로 되돌린다. answers를 동일하게 빈 답안으로 리셋해
  // "미채점" 상태에서 새로 채점을 시작하도록 한다(결석 이전의 채점 데이터를 그대로 복원하지 않음).
  const markAttended = useCallback((examId: string, studentId: string) => {
    setSubmissions((prev) => prev.map((s) => {
      if (s.examId !== examId || s.studentId !== studentId) return s;
      const clearedAnswers = s.answers.map((a) => ({ questionId: a.questionId }));
      return recalcTotalScore({ ...s, status: '응시예정', answers: clearedAnswers });
    }));
  }, []);

  // 자동채점 적용 — 객관식/OX/단답형 문항에 한해 정답과 비교해 점수를 매긴다.
  const autoGradeSubmission = useCallback((examId: string, studentId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    setSubmissions((prev) => prev.map((s) => {
      if (s.examId !== examId || s.studentId !== studentId) return s;
      const graded = applyAutoGrading(s, exam.questions);
      const withStatus = { ...graded, status: isSubmissionGraded(graded) ? ('채점완료' as SubmissionStatus) : ('채점중' as SubmissionStatus) };
      return recalcTotalScore(withStatus);
    }));
  }, [exams]);

  // 자동채점 대상 문항(객관식/OX/단답형)의 학생 답안 입력 — 입력 즉시 그 문항만 자동채점까지 수행한다.
  // 새 시험 생성 시 studentAnswer가 비어 있어 자동채점이 동작하지 않던 문제(공개가 막히는 원인)를
  // 해소한다. applyAutoGrading은 시험 전체 문항을 순회하므로, 여기서는 먼저 studentAnswer만 갱신한
  // submission을 만들어 그 결과에 applyAutoGrading을 적용한다(수동채점 문항은 그대로 유지됨).
  const setStudentAnswer = useCallback((examId: string, studentId: string, questionId: string, answer: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    setSubmissions((prev) => prev.map((s) => {
      if (s.examId !== examId || s.studentId !== studentId) return s;
      const withAnswer = { ...s, answers: s.answers.map((a) => (a.questionId === questionId ? { ...a, studentAnswer: answer } : a)) };
      const graded = applyAutoGrading(withAnswer, exam.questions);
      const allGraded = isSubmissionGraded(graded);
      return recalcTotalScore({ ...graded, status: allGraded ? '채점완료' : '채점중' });
    }));
  }, [exams]);

  // 수동채점 — 문항 1개의 점수를 입력한다(서술형/증명형/풀이형 등). 자동채점 문항도 필요 시 수기로 덮어쓸 수 있다.
  // 점수는 항상 0 이상, 해당 문항 배점 이하로 clamp한다(음수·만점 초과 점수가 저장되지 않도록 방어).
  const gradeAnswer = useCallback((examId: string, studentId: string, questionId: string, score: number, gradedBy: string) => {
    const exam = exams.find((e) => e.id === examId);
    const maxPoints = exam?.questions.find((q) => q.id === questionId)?.points ?? score;
    const clamped = Math.max(0, Math.min(score, maxPoints));
    setSubmissions((prev) => prev.map((s) => {
      if (s.examId !== examId || s.studentId !== studentId) return s;
      const answers = s.answers.map((a) => (a.questionId === questionId ? { ...a, score: clamped, gradedBy, gradedAt: new Date().toISOString() } : a));
      const next = { ...s, answers };
      const graded = isSubmissionGraded(next);
      return recalcTotalScore({ ...next, status: graded ? '채점완료' : '채점중' });
    }));
  }, [exams]);

  // 공개 가능 여부 — 해당 시험의 모든 응시자(결석 포함)가 채점 처리되어 있어야 한다.
  const canPublish = useCallback((examId: string) => {
    const subs = submissions.filter((s) => s.examId === examId);
    return canPublishExam(subs);
  }, [submissions]);

  const publishExam = useCallback((examId: string, publishedBy: string): { ok: boolean; reason?: string } => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return { ok: false, reason: '시험을 찾을 수 없습니다.' };
    if (!requiresPublishAction(exam)) {
      // 반 단위 시험은 공개 액션 자체가 없다(채점 완료 시 자동 반영) — 잘못 호출되는 경우를 방어한다.
      return { ok: false, reason: '반 단위 시험은 별도 공개 절차가 없습니다. 채점이 완료되면 자동으로 반영됩니다.' };
    }
    const subs = submissions.filter((s) => s.examId === examId);
    if (!canPublishExam(subs)) {
      return { ok: false, reason: '미채점 응시자가 있어 공개할 수 없습니다. 모든 응시자의 채점을 완료해주세요.' };
    }
    const now = new Date().toISOString();
    setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, publishedBy, publishedAt: now } : e)));

    // 성적 공개 알림 이력 생성 — 각 응시자마다 개별 이력 생성
    // 기본 정책: 학생 ON, 보호자 OFF (NotificationContext 설정 기준)
    subs.forEach((sub) => {
      const student = students.find((s) => s.id === sub.studentId);
      if (!student) return;
      const guardian = student.guardians?.[0];
      createAssessmentPublishedNotification({
        studentId: sub.studentId,
        studentName: student.name,
        guardianName: guardian?.name,
        guardianPhone: guardian?.phone,
        assessmentId: examId,
        assessmentName: exam.title,
        publishedAt: now,
        requestedBy: publishedBy,
      });
    });

    return { ok: true };
  }, [exams, submissions, students, createAssessmentPublishedNotification]);

  // 정정 처리 — 점수를 직접 덮어쓰지 않고 이전 값/사유/처리자/시각을 이력으로 남긴 뒤 점수를 갱신한다.
  const correctScore = useCallback((
    examId: string,
    studentId: string,
    questionId: string | undefined,
    newScore: number,
    reason: string,
    correctedBy: string,
  ) => {
    const exam = exams.find((e) => e.id === examId);
    // 점수 정정 범위 제한 — 문항 단위 정정은 그 문항의 배점, 총점 단위 정정은 시험 만점을 상한으로 한다.
    // 음수 점수나 만점 초과 점수가 저장되지 않도록 항상 clamp한다.
    const maxScore = questionId
      ? (exam?.questions.find((q) => q.id === questionId)?.points ?? newScore)
      : (exam?.totalScore ?? newScore);
    const clampedScore = Math.max(0, Math.min(newScore, maxScore));

    setSubmissions((prev) => prev.map((s) => {
      if (s.examId !== examId || s.studentId !== studentId) return s;

      const log: ScoreCorrectionLog = {
        id: `corr-${Date.now()}`,
        questionId,
        previousScore: questionId
          ? (s.answers.find((a) => a.questionId === questionId)?.score ?? 0)
          : (s.totalScore ?? 0),
        newScore: clampedScore,
        reason,
        correctedBy,
        correctedAt: new Date().toISOString(),
      };

      const answers = questionId
        ? s.answers.map((a) => (a.questionId === questionId ? { ...a, score: clampedScore, gradedBy: correctedBy, gradedAt: log.correctedAt } : a))
        : s.answers;

      const next = recalcTotalScore({ ...s, answers, corrections: [...s.corrections, log] });
      // 문항 단위 정정이 아니라 총점 단위 정정이면(questionId 없음) totalScore를 직접 지정한다.
      return questionId ? next : { ...next, totalScore: clampedScore };
    }));
  }, [exams]);

  // ── 학생/보호자 포털 전용: 공개 필터 ────────────────────────────
  // isResultVisibleForStudent()를 내부에서 호출하므로, 호출부(StudentGrades/ParentGrades 등)는
  // exams/submissions를 직접 다룰 필요가 없다.
  const getPublishedResultsForStudentMemo = useCallback(
    (studentId: string): StudentExamResult[] =>
      filterPublishedResultsForStudent(exams, submissions, studentId),
    [exams, submissions]
  );

  // ── 강사 포털 전용: 총점 직접 입력 채점 ────────────────────────────
  // 문항별 breakdown 없이 totalScore를 직접 지정해 채점완료 상태로 전환한다.
  // 관리자 채점(gradeAnswer)과 별개 경로이므로 기존 로직에 영향 없음.
  const gradeSubmissionByTeacher = useCallback((
    examId: string,
    studentId: string,
    totalScore: number,
    gradedBy: string,
    note?: string,
  ): { ok: boolean; reason?: string } => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return { ok: false, reason: '시험을 찾을 수 없습니다.' };

    // Phase 3C v2 반려 대응(2차 방어): TeacherExamGradingGuard가 라우트 레벨에서 이미 막지만,
    // Context 데이터 계층에서도 한 번 더 검증한다. gradeSubmissionByTeacher는 gradedBy로 이름
    // 문자열만 받으므로(TeacherExamGrading.tsx가 currentUser.name을 그대로 넘김 — 이 파일은
    // 불변이라 시그니처를 바꿀 수 없다), ownerTeacherId(계정 id)를 이름으로 역조회해 비교한다.
    // 동명이인이 있으면 이 이름 비교만으로는 완벽하지 않지만, 라우트 가드가 1차로 이미 막고
    // 있어 실질적으로는 이중 방어 중 두 번째 안전망 역할이다.
    if (exam.scope === 'TEACHER_PRIVATE' && exam.ownerTeacherId) {
      const ownerName = getEmployeeByAccountId(exam.ownerTeacherId)?.name;
      if (ownerName && ownerName !== gradedBy) {
        return { ok: false, reason: '다른 선생님의 개인 시험지는 채점할 수 없습니다.' };
      }
    }

    const sub = submissions.find(s => s.examId === examId && s.studentId === studentId);
    if (!sub) return { ok: false, reason: '응시 기록을 찾을 수 없습니다.' };
    if (sub.status === '결석') return { ok: false, reason: '결석 처리된 학생은 채점할 수 없습니다.' };

    // 점수 범위 검증 — silent clamp 없이 명시적 오류 반환
    if (totalScore < 0 || totalScore > exam.totalScore) {
      return {
        ok: false,
        reason: `점수는 0 이상 ${exam.totalScore}점 이하여야 합니다. (입력: ${totalScore})`,
      };
    }

    setSubmissions(prev => prev.map(s => {
      if (s.examId !== examId || s.studentId !== studentId) return s;
      return {
        ...s,
        totalScore,
        status: '채점완료' as SubmissionStatus,
        teacherNote: note?.trim() || s.teacherNote,
      };
    }));

    return { ok: true };
  }, [exams, submissions, getEmployeeByAccountId]);

  return (
    <AssessmentContext.Provider value={{
      exams, submissions,
      getExam, getSubmissionsByExam, getSubmission,
      addExam, updateExam,
      markAbsent, markAttended,
      autoGradeSubmission, gradeAnswer, setStudentAnswer,
      canPublish, publishExam,
      correctScore,
      getPublishedResultsForStudent: getPublishedResultsForStudentMemo,
      gradeSubmissionByTeacher,
    }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
