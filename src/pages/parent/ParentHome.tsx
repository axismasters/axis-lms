// AXIS LMS v1.2 - ParentHome
// 보호자 전용 홈: 자녀 선택 / 출결 요약 / 최근 성적 / 수납 상태 / 알림 카드.
// 라이벌/엠블럼/경쟁 정보 절대 노출 금지.

import { useState } from 'react';
import { CalendarCheck, BarChart2, CreditCard, Bell, ChevronDown } from 'lucide-react';
import ParentLayout from '@/layouts/ParentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useAssessment } from '@/contexts/AssessmentContext';

export default function ParentHome() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { sessions } = useAttendance();
  const { exams, submissions } = useAssessment();

  // 연결된 자녀 목록
  const myChildren = students.filter((s) =>
    currentUser.assignedStudentIds.includes(s.id)
  );

  const [selectedChildId, setSelectedChildId] = useState<string>(
    myChildren[0]?.id ?? ''
  );
  const child = myChildren.find((s) => s.id === selectedChildId);

  // 선택 자녀 최근 출결 (sessions에서 해당 학생 record 추출, 최근 10건)
  const childRecords = sessions
    .flatMap((sess) => sess.records.filter((r) => r.studentId === selectedChildId))
    .slice(-10)
    .reverse();
  const presentCount = childRecords.filter((r) => r.status === '출석').length;
  const absentCount = childRecords.filter((r) => r.status === '결석').length;
  const lateCount = childRecords.filter((r) => r.status === '지각').length;

  // 최근 공개된 성적 (최근 3건)
  const childResults = submissions
    .filter((s) => s.studentId === selectedChildId && s.status === '채점완료')
    .slice(-3)
    .reverse();

  // 더미 알림 목록
  const dummyNotices = [
    { id: 1, text: '3월 수강료 청구서가 발행되었습니다.', time: '어제' },
    { id: 2, text: '김민준 선생님이 출결을 기록했습니다.', time: '2일 전' },
    { id: 3, text: '중간고사 성적이 공개되었습니다.', time: '5일 전' },
  ];

  return (
    <ParentLayout title="AXIS 학부모">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 자녀 선택 */}
        <div className="axis-card p-4">
          <div className="text-xs mb-2" style={{ color: 'oklch(0.55 0.015 250)' }}>자녀 선택</div>
          {myChildren.length === 0 ? (
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              연결된 자녀 정보가 없습니다.
            </div>
          ) : myChildren.length === 1 ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base"
                style={{ background: 'oklch(0.45 0.15 160)' }}>
                {child?.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{child?.name}</div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  {child?.status}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full text-sm rounded-md px-3 py-2.5 appearance-none"
                style={{ border: '1px solid oklch(0.9 0.008 250)', background: 'white', color: 'oklch(0.2 0.02 250)' }}
              >
                {myChildren.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'oklch(0.5 0.015 250)' }} />
            </div>
          )}
        </div>

        {!child ? null : (
          <>
            {/* 출결 요약 */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CalendarCheck size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>출결 요약</span>
                <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>최근 10건</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '출석', value: presentCount, color: 'oklch(0.45 0.15 160)' },
                  { label: '지각', value: lateCount,   color: 'oklch(0.6 0.15 80)' },
                  { label: '결석', value: absentCount, color: 'oklch(0.55 0.2 27)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="axis-card p-3 text-center">
                    <div className="font-bold text-lg tabular-nums" style={{ color }}>{value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 최근 성적 */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <BarChart2 size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 성적</span>
              </div>
              {childResults.length === 0 ? (
                <div className="axis-card p-4 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                  공개된 성적이 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {childResults.map((sub) => {
                    const exam = exams.find((e) => e.id === sub.examId);
                    if (!exam) return null;
                    const total = exam.questions.reduce((s, q) => s + q.points, 0);
                    const score = sub.totalScore ?? 0;
                    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                    return (
                      <div key={sub.id} className="axis-card p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{exam.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{exam.subject} · {exam.examDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold tabular-nums" style={{
                            color: pct >= 80 ? 'oklch(0.45 0.15 160)' : pct >= 60 ? 'oklch(0.55 0.15 80)' : 'oklch(0.55 0.2 27)',
                          }}>
                            {score}/{total}
                          </div>
                          <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 수납 상태 */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CreditCard size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>수납 상태</span>
              </div>
              <div className="axis-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'oklch(0.2 0.02 250)' }}>이번 달 수강료</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    상세 내역은 수납 탭에서 확인하세요
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                  완납
                </span>
              </div>
            </section>
          </>
        )}

        {/* 알림 */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Bell size={15} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>최근 알림</span>
          </div>
          <div className="axis-card divide-y" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
            {dummyNotices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: 'oklch(0.511 0.262 276.966)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>{n.text}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.01 250)' }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </ParentLayout>
  );
}
