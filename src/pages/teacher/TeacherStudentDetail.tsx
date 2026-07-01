// AXIS LMS v1.2 - TeacherStudentDetail (Workflow Foundation v1)
// 강사 전용 담당 학생 상세 화면 (읽기 전용).
// - 담당 학생만 조회 가능 (assignedStudentIds 기준)
// - 보호자/재무/권한 정보 노출 금지
// - 상담관리 독립 기능 없음

import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronLeft, BarChart2, CalendarCheck, FileText, MessageSquare, Plus, X, KeyRound, UserCog } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import {
  CounselingRecord, CounselingType, CounselingTarget,
  COUNSELING_TYPES, COUNSELING_TARGETS,
  getCounselingRecordsForStudent, addCounselingRecord,
} from '@/lib/counselingData';
import { resetStudentNickname } from '@/lib/studentProfile';
import { logAccountAction } from '@/lib/accountActionLog';
import { getParentCommentsForStudent, addParentComment, ParentComment } from '@/lib/parentComments';
import { getLocalDateStr } from '@/utils/dateUtils';

export default function TeacherStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const { currentUser, activeMode, canResetPassword, canResetNickname } = useAuth();
  const { students } = useStudents();
  const { exams, submissions } = useAssessment();
  const { sessions } = useAttendance();

  // Phase 3D v2: 상담 기록 관련 상태 — Rules of Hooks 준수를 위해 아래 조기 return보다
  // 반드시 앞에 선언해야 한다(이 컴포넌트는 studentId 유효성에 따라 조기 return이 있다).
  const [showCounselingForm, setShowCounselingForm] = useState(false);
  const [counselingRecords, setCounselingRecords] = useState<CounselingRecord[]>(() =>
    studentId ? getCounselingRecordsForStudent(studentId) : []
  );
  const [form, setForm] = useState({
    date: getLocalDateStr(),
    type: COUNSELING_TYPES[0] as CounselingType,
    target: COUNSELING_TARGETS[0] as CounselingTarget,
    content: '',
  });
  // Phase 3D v3-r1: 학부모 공개 코멘트 상태(마찬가지로 조기 return보다 앞에 선언)
  const [parentComments, setParentComments] = useState<ParentComment[]>(() =>
    studentId ? getParentCommentsForStudent(studentId) : []
  );
  const [showParentCommentForm, setShowParentCommentForm] = useState(false);
  const [parentCommentText, setParentCommentText] = useState('');
  // Phase 3D v3-r1: 비밀번호/닉네임 초기화 확인 모달 상태(마찬가지로 조기 return보다 앞에 선언)
  const [confirmAction, setConfirmAction] = useState<'password' | 'nickname' | null>(null);

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];
  const myStudentIds = new Set(assignedStudentIds);

  const notAllowed = (
    <TeacherLayout title="학생 상세">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Link href="/teacher/students">
          <div className="flex items-center gap-1 text-xs cursor-pointer mb-4" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            담당 학생 목록
          </div>
        </Link>
        <div className="axis-card p-10 text-center">
          <div className="text-sm font-medium" style={{ color: 'oklch(0.5 0.015 250)' }}>접근 권한이 없습니다.</div>
          <div className="text-xs mt-1" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 학생만 조회할 수 있습니다.</div>
        </div>
      </div>
    </TeacherLayout>
  );

  if (!studentId || !myStudentIds.has(studentId)) return notAllowed;

  const student = students.find((s) => s.id === studentId);
  if (!student) return notAllowed;

  // 담당 반에 속한 수업만 표시
  const myClasses = student.classes.filter(
    (c) => assignedClassIds.includes(c.id) && c.status === '수강중'
  );

  // 담당 범위 시험 ID 집합
  const myExamIds = new Set(
    exams
      .filter((e) => assignedClassIds.includes(e.classId ?? '') || !e.classId)
      .map((e) => e.id)
  );

  // 이 학생의 채점완료 submissions (담당 시험 기준, 최근 3건)
  const studentSubs = submissions
    .filter((s) => s.studentId === studentId && myExamIds.has(s.examId) && s.status === '채점완료')
    .sort((a, b) => {
      const ea = exams.find((e) => e.id === a.examId);
      const eb = exams.find((e) => e.id === b.examId);
      return (eb?.examDate ?? '').localeCompare(ea?.examDate ?? '');
    })
    .slice(0, 3);

  // 출결 요약 (담당 반 세션, 최근 10건)
  const attendanceRecords = sessions
    .filter((sess) => assignedClassIds.includes(sess.classId))
    .flatMap((sess) => sess.records.filter((r) => r.studentId === studentId))
    .slice(-10)
    .reverse();

  const presentCount = attendanceRecords.filter(
    (r) => r.status === '출석' || r.status === '보강출석'
  ).length;
  const absentCount = attendanceRecords.filter((r) => r.status === '결석').length;
  const lateCount = attendanceRecords.filter(
    (r) => r.status === '지각' || r.status === '조퇴'
  ).length;

  // Phase 3D v3-r1: 학부모 공개 코멘트 — 상담 기록 원문과 별개로, 학부모에게 보여줄
  // 문장을 선생님이 직접 다시 써서 저장한다.
  const handleAddParentComment = () => {
    if (!parentCommentText.trim()) return;
    const comment = addParentComment({
      studentId,
      date: getLocalDateStr(),
      content: parentCommentText.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
    });
    setParentComments((prev) => [comment, ...prev]);
    setParentCommentText('');
    setShowParentCommentForm(false);
  };

  const handleAddCounseling = () => {
    if (!form.content.trim()) return;
    const record = addCounselingRecord({
      studentId,
      date: form.date,
      type: form.type,
      target: form.target,
      content: form.content.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      activeMode,
    });
    setCounselingRecords((prev) => [record, ...prev]);
    setForm({ date: getLocalDateStr(), type: COUNSELING_TYPES[0], target: COUNSELING_TARGETS[0], content: '' });
    setShowCounselingForm(false);
  };

  // Phase 3D v3: 비밀번호 초기화 — 기존 비밀번호는 절대 보여주지 않는다(데모 환경에서도
  // "새 비밀번호는 휴대폰 뒤 4자리로 초기화됩니다" 같은 안내만 하고 실제 값을 노출하지 않음).
  const handleConfirmPasswordReset = () => {
    logAccountAction({
      action: 'PASSWORD_RESET',
      targetStudentId: student.id,
      targetStudentName: student.name,
      actorId: currentUser.id,
      actorName: currentUser.name,
      activeMode,
    });
    toast.success(`${student.name} 학생의 비밀번호가 초기화되었습니다.`);
    setConfirmAction(null);
  };

  // 닉네임 초기화 — 닉네임을 비우고 14일 제한도 함께 해제해 학생이 바로 다시 설정할 수 있게 한다.
  const handleConfirmNicknameReset = () => {
    resetStudentNickname(student.id);
    logAccountAction({
      action: 'NICKNAME_RESET',
      targetStudentId: student.id,
      targetStudentName: student.name,
      actorId: currentUser.id,
      actorName: currentUser.name,
      activeMode,
    });
    toast.success(`${student.name} 학생의 닉네임이 초기화되었습니다. 학생이 다시 설정할 수 있습니다.`);
    setConfirmAction(null);
  };

  return (
    <TeacherLayout title="학생 상세">
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* 뒤로가기 */}
        <Link href="/teacher/students">
          <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
            <ChevronLeft size={14} />
            담당 학생 목록
          </div>
        </Link>

        {/* 기본 정보 */}
        <div className="axis-card p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
            style={{ background: 'oklch(0.511 0.262 276.966)' }}
          >
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{student.phone}</div>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: student.status === '재원' ? 'oklch(0.94 0.08 160)' : 'oklch(0.95 0.005 250)',
              color: student.status === '재원' ? 'oklch(0.35 0.12 160)' : 'oklch(0.5 0.015 250)',
            }}
          >
            {student.status}
          </span>
        </div>

        {/* 계정 관리 — Phase 3D v3 신규. 본인 담당 학생에게만 실행 가능(canAccessStudent 스코프). */}
        {(canResetPassword('', 'STUDENT', student.id) || canResetNickname(student.id)) && (
          <div className="axis-card p-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.45 0.015 250)' }}>계정 관리</div>
            <div className="flex gap-2 flex-wrap">
              {canResetPassword('', 'STUDENT', student.id) && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfirmAction('password')}>
                  <KeyRound size={13} /> 비밀번호 초기화
                </Button>
              )}
              {canResetNickname(student.id) && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfirmAction('nickname')}>
                  <UserCog size={13} /> 닉네임 초기화
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 담당 수업 */}
        <section>
          <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'oklch(0.45 0.015 250)' }}>
            담당 수업
          </div>
          {myClasses.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              현재 수강 중인 담당 반이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {myClasses.map((cls) => (
                <div key={cls.id} className="axis-card p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{cls.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{cls.subject}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                    수강중
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 출결 요약 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <CalendarCheck size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
              출결 요약 (최근 10건)
            </span>
          </div>
          {attendanceRecords.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              출결 기록이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '출석',     value: presentCount, color: 'oklch(0.45 0.15 160)' },
                { label: '지각/조퇴', value: lateCount,    color: 'oklch(0.55 0.15 80)' },
                { label: '결석',     value: absentCount,  color: 'oklch(0.55 0.2 27)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="axis-card p-3 text-center">
                  <div className="font-bold text-lg tabular-nums" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 최근 테스트 결과 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <BarChart2 size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>최근 테스트 결과</span>
          </div>
          {studentSubs.length === 0 ? (
            <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              테스트 결과 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {studentSubs.map((sub) => {
                const exam = exams.find((e) => e.id === sub.examId);
                if (!exam) return null;
                const score = sub.totalScore ?? 0;
                const pct = exam.totalScore > 0 ? Math.round((score / exam.totalScore) * 100) : 0;
                return (
                  <div key={sub.id} className="axis-card p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                        {exam.subject} · {exam.examDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold tabular-nums text-sm"
                        style={{
                          color:
                            pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.55 0.2 27)',
                        }}
                      >
                        {score}/{exam.totalScore}
                      </div>
                      <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 수업자료에서 수업노트 확인 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <FileText size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>수업자료</span>
          </div>
          <div className="axis-card p-4 text-center">
            <Link href="/teacher/materials?tab=notes">
              <span className="text-sm cursor-pointer" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
                수업자료 열기 →
              </span>
            </Link>
          </div>
        </section>

        {/* 학부모 공개 코멘트 — Phase 3D v3-r1 신규. 상담 기록(내부용)과 달리 학부모 성장
            리포트 화면에 그대로 노출된다. 선생님이 학부모용으로 다시 쓴 문장만 저장한다. */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} style={{ color: 'oklch(0.45 0.15 160)' }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
                학부모 공개 코멘트 ({parentComments.length}건)
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.94 0.06 160)', color: 'oklch(0.35 0.12 160)' }}>학부모 화면 노출</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowParentCommentForm(true)} className="h-7 text-xs gap-1">
              <Plus size={12} /> 코멘트 작성
            </Button>
          </div>
          {parentComments.length === 0 ? (
            <div className="axis-card p-4 text-center text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
              작성된 학부모 공개 코멘트가 없습니다.
            </div>
          ) : (
            <div className="space-y-1.5">
              {parentComments.map((c) => (
                <div key={c.id} className="axis-card p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>{c.authorName}</span>
                    <span style={{ color: 'oklch(0.6 0.015 250)' }}>{c.date}</span>
                  </div>
                  <p style={{ color: 'oklch(0.35 0.02 250)' }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 상담 기록 — Phase 3D v2 신규. 내부 기록용(학부모/학생 노출 없음).
            PC 웹 최적화: 컴팩트 테이블 형태로 스캔하기 쉽게 구성. */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.015 250)' }}>
                상담 기록 ({counselingRecords.length}건)
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCounselingForm(true)} className="h-7 text-xs gap-1">
              <Plus size={12} /> 상담 기록 추가
            </Button>
          </div>

          {counselingRecords.length === 0 ? (
            <div className="axis-card p-6 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              등록된 상담 기록이 없습니다.
            </div>
          ) : (
            <div className="axis-card overflow-hidden">
              <div className="axis-table-wrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'oklch(0.985 0.003 250)' }}>
                      {['상담일', '유형', '대상', '내용', '작성자'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                          style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {counselingRecords.map((rec) => (
                      <tr key={rec.id} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                        <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.4 0.015 250)' }}>{rec.date}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.95 0.02 277)', color: 'oklch(0.45 0.2 277)' }}>
                            {rec.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{rec.target}</td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: 'oklch(0.3 0.02 250)', maxWidth: 320 }}>
                          <span className="line-clamp-2">{rec.content}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.55 0.015 250)' }}>{rec.authorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* 학부모 공개 코멘트 작성 모달 */}
      {showParentCommentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowParentCommentForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <h2 className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>학부모 공개 코멘트 작성</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowParentCommentForm(false)} className="h-8 w-8" aria-label="닫기">
                <X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} />
              </Button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                이 코멘트는 학부모 성장 리포트 화면에 그대로 보여집니다. 상담 기록 원문을 그대로
                붙여넣지 말고, 학부모가 보기에 알맞은 문장으로 다시 써주세요.
              </p>
              <textarea
                value={parentCommentText}
                onChange={(e) => setParentCommentText(e.target.value)}
                rows={4}
                placeholder="예: 이번 달 수학 개념 이해도가 눈에 띄게 좋아졌습니다. 다음 시험까지 계산 실수만 줄이면 더 좋은 결과가 기대됩니다."
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                style={{ borderColor: 'oklch(0.87 0.006 250)' }}
              />
            </div>
            <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <Button variant="outline" onClick={() => setShowParentCommentForm(false)}>취소</Button>
              <Button onClick={handleAddParentComment} style={{ background: 'oklch(0.45 0.15 160)' }}>학부모 화면에 공개</Button>
            </div>
          </div>
        </div>
      )}

      {/* 상담 기록 추가 모달 */}
      {showCounselingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowCounselingForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <h2 className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>상담 기록 추가</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCounselingForm(false)} className="h-8 w-8" aria-label="닫기">
                <X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} />
              </Button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>상담일</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>상담 유형</label>
                  <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CounselingType }))}
                    className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}>
                    {COUNSELING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>상담 대상</label>
                <select value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value as CounselingTarget }))}
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}>
                  {COUNSELING_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>상담 내용</label>
                <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={4} className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                이 기록은 내부용입니다. 학부모/학생 화면에는 노출되지 않습니다.
              </p>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <Button variant="outline" onClick={() => setShowCounselingForm(false)}>취소</Button>
              <Button onClick={handleAddCounseling} style={{ background: 'oklch(0.511 0.262 276.966)' }}>저장</Button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호/닉네임 초기화 확인 모달 — 실행 전 반드시 확인을 받는다 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <h2 className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {confirmAction === 'password' ? '비밀번호 초기화' : '닉네임 초기화'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setConfirmAction(null)} className="h-8 w-8" aria-label="닫기">
                <X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} />
              </Button>
            </div>
            <div className="p-5 text-sm space-y-2" style={{ color: 'oklch(0.3 0.02 250)' }}>
              <p><b>{student.name}</b> 학생의 {confirmAction === 'password' ? '비밀번호' : '닉네임'}을 초기화합니다.</p>
              {confirmAction === 'password' ? (
                <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  기존 비밀번호는 표시되지 않습니다. 초기화 후 학생에게 새 비밀번호 안내가 필요합니다.
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  현재 닉네임이 비워지고, 14일 변경 제한도 함께 해제되어 학생이 즉시 새 닉네임을 설정할 수 있습니다.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <Button variant="outline" onClick={() => setConfirmAction(null)}>취소</Button>
              <Button
                onClick={confirmAction === 'password' ? handleConfirmPasswordReset : handleConfirmNicknameReset}
                style={{ background: 'oklch(0.577 0.245 27.325)' }}
              >
                초기화 실행
              </Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
