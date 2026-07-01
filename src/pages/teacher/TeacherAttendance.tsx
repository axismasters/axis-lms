// AXIS LMS v1.2 - TeacherAttendance (Persistence v1)
// 강사 전용 출결 체크 화면.
// - 담당 반 / 담당 학생만 표시 (assignedClassIds / assignedStudentIds 기준)
// - 전체 자동 출석 기본값, 예외만 수정
// - 결석은 사유 필수 — 미입력 시 저장 차단 + 안내 문구
// - 저장 시 AttendanceContext.saveTeacherAttendance 호출 (Context persistence)
// - 날짜/반 변경 시 기존 Context 세션 데이터로 초기화 (편집 연속성 지원)

import { useState, useRef, useEffect } from 'react';
import { CalendarCheck } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useStudents } from '@/contexts/StudentContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import type { AttendanceStatus } from '@/lib/attendanceData';
import { getLocalDateStr } from '@/utils/dateUtils';

type LocalRecord = { status: AttendanceStatus; reason: string };

const STATUS_OPTIONS: AttendanceStatus[] = ['출석', '지각', '조퇴', '결석', '보강출석', '공결'];

const STATUS_STYLE: Record<AttendanceStatus, { bg: string; text: string }> = {
  '출석':    { bg: 'oklch(0.45 0.15 160)',  text: 'white' },
  '지각':    { bg: 'oklch(0.55 0.15 80)',   text: 'white' },
  '조퇴':    { bg: 'oklch(0.254 0.090 262.09)',   text: 'white' },
  '결석':    { bg: 'oklch(0.55 0.2 27)',    text: 'white' },
  '보강출석': { bg: 'oklch(0.45 0.12 160)', text: 'white' },
  '공결':    { bg: 'oklch(0.55 0.015 250)', text: 'white' },
};

/** 사유 입력이 표시되는 상태 */
const REQUIRES_REASON: AttendanceStatus[] = ['지각', '조퇴', '결석', '공결'];
/** 사유 입력이 필수인 상태 (결석만) */
const REASON_MANDATORY: AttendanceStatus[] = ['결석'];

export default function TeacherAttendance() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { sessions, saveTeacherAttendance } = useAttendance();

  const assignedClassIds = currentUser.assignedClassIds ?? [];
  const assignedStudentIds = new Set(currentUser.assignedStudentIds ?? []);

  const assignedClasses = classes.filter(
    (c) => assignedClassIds.includes(c.id) && c.status === '운영중'
  );

  const [selectedClassId, setSelectedClassId] = useState(assignedClasses[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr);
  const [records, setRecords] = useState<Record<string, LocalRecord>>({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // sessions ref: 날짜/반 변경 시 최신 Context 세션을 읽기 위해 사용 (불필요한 effect 재실행 방지)
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  // 날짜 또는 반 변경 시: Context에 기존 세션이 있으면 그 데이터로 초기화 (편집 연속성)
  useEffect(() => {
    const existingSession = sessionsRef.current.find(
      s => s.classId === selectedClassId && s.date === selectedDate
    );
    if (existingSession) {
      const loaded: Record<string, LocalRecord> = {};
      existingSession.records.forEach(r => {
        if (assignedStudentIds.has(r.studentId)) {
          loaded[r.studentId] = { status: r.status, reason: r.reason ?? '' };
        }
      });
      setRecords(loaded);
      setSaved(true); // 이미 저장된 데이터
    } else {
      setRecords({});
      setSaved(false);
    }
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedDate]);

  // 선택한 반의 담당 학생만 (수강중 + 재원)
  const classStudents = students.filter(
    (s) =>
      assignedStudentIds.has(s.id) &&
      s.status === '재원' &&
      s.classes.some((c) => c.id === selectedClassId && c.status === '수강중')
  );

  function getRecord(studentId: string): LocalRecord {
    return records[studentId] ?? { status: '출석', reason: '' };
  }

  function setRecord(studentId: string, updates: Partial<LocalRecord>) {
    setSaved(false);
    setSaveError(null);
    setRecords((prev) => ({ ...prev, [studentId]: { ...getRecord(studentId), ...updates } }));
  }

  function handleClassChange(classId: string) {
    setSelectedClassId(classId);
    // records/saved/error는 useEffect가 처리
  }

  function handleDateChange(date: string) {
    setSelectedDate(date);
    // records/saved/error는 useEffect가 처리
  }

  function handleSave() {
    // 1차: 결석 사유 필수 검사 (UI 레벨)
    const missingReason = classStudents.filter((s) => {
      const rec = getRecord(s.id);
      return REASON_MANDATORY.includes(rec.status) && !rec.reason.trim();
    });
    if (missingReason.length > 0) {
      setSaveError(
        `결석 사유를 입력해주세요: ${missingReason.map((s) => s.name).join(', ')}`
      );
      return;
    }

    // 출결 기록 맵 구성
    const recordMap: Record<string, { status: AttendanceStatus; reason: string }> = {};
    classStudents.forEach((s) => {
      recordMap[s.id] = getRecord(s.id);
    });

    // Context mutation 호출 (Context에서 2차 방어)
    const result = saveTeacherAttendance(
      selectedClassId,
      selectedDate,
      classStudents.map((s) => s.id),
      recordMap,
      currentUser.name,
    );

    if (result.ok) {
      setSaveError(null);
      setSaved(true);
    } else {
      setSaveError(result.reason ?? '저장에 실패했습니다.');
    }
  }

  return (
    <TeacherLayout title="출결 체크">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {assignedClasses.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <CalendarCheck size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 반이 없습니다.</div>
          </div>
        ) : (
          <>
            {/* 날짜 / 반 선택 */}
            <div className="axis-card p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>날짜</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full text-sm rounded-md px-3 py-2 border"
                  style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'oklch(0.45 0.015 250)' }}>담당 반</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full text-sm rounded-md px-3 py-2 border appearance-none"
                  style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.2 0.02 250)' }}
                >
                  {assignedClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 안내 */}
            <div
              className="axis-card px-4 py-3 text-xs"
              style={{ borderLeft: '3px solid #081F4D', color: 'oklch(0.5 0.015 250)' }}
            >
              전체 자동 출석 기준입니다. 예외 사항만 변경하세요.
              <br />
              <span style={{ color: 'oklch(0.55 0.2 27)' }}>결석</span>은 사유 입력이 필수입니다.
            </div>

            {/* 학생별 출결 */}
            {classStudents.length === 0 ? (
              <div className="axis-card p-6 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                오늘 출결을 체크할 학생이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {classStudents.map((student) => {
                  const rec = getRecord(student.id);
                  const activeStyle = STATUS_STYLE[rec.status];
                  const needsReason = REQUIRES_REASON.includes(rec.status);
                  const isMandatory = REASON_MANDATORY.includes(rec.status);
                  const missingMandatory = isMandatory && !rec.reason.trim();
                  return (
                    <div
                      key={student.id}
                      className="axis-card p-4"
                      style={
                        missingMandatory && saveError
                          ? { borderColor: 'oklch(0.577 0.245 27.325)', borderWidth: '1.5px' }
                          : {}
                      }
                    >
                      {/* 학생명 + 현재 상태 배지 */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: '#081F4D' }}
                          >
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                            {student.name}
                          </span>
                        </div>
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={{ background: activeStyle.bg, color: activeStyle.text }}
                        >
                          {rec.status}
                        </span>
                      </div>

                      {/* 상태 선택 버튼 */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {STATUS_OPTIONS.map((s) => {
                          const isSelected = rec.status === s;
                          const st = STATUS_STYLE[s];
                          return (
                            <button
                              key={s}
                              onClick={() => setRecord(student.id, { status: s, reason: '' })}
                              className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                              style={{
                                background: isSelected ? st.bg : 'oklch(0.95 0.005 250)',
                                color: isSelected ? st.text : 'oklch(0.5 0.015 250)',
                              }}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>

                      {/* 사유 입력 */}
                      {needsReason && (
                        <div>
                          <input
                            type="text"
                            value={rec.reason}
                            onChange={(e) => setRecord(student.id, { reason: e.target.value })}
                            placeholder={isMandatory ? '결석 사유 입력 (필수)' : '사유 입력 (선택)'}
                            className="w-full text-xs rounded-md px-3 py-1.5 border"
                            style={{
                              borderColor: missingMandatory
                                ? 'oklch(0.577 0.245 27.325)'
                                : 'oklch(0.9 0.008 250)',
                              color: 'oklch(0.3 0.02 250)',
                            }}
                          />
                          {isMandatory && (
                            <div className="mt-0.5 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
                              결석 사유는 필수 입력입니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 저장 오류 안내 */}
            {saveError && (
              <div
                className="axis-card px-4 py-3 text-xs font-medium"
                style={{
                  borderLeft: '3px solid oklch(0.577 0.245 27.325)',
                  color: 'oklch(0.5 0.2 27)',
                  background: 'oklch(0.98 0.02 27)',
                }}
              >
                {saveError}
              </div>
            )}

            {/* 저장 버튼 */}
            {classStudents.length > 0 && (
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: saved ? 'oklch(0.45 0.15 160)' : '#081F4D' }}
              >
                {saved ? `✓ ${selectedDate} 출결 저장 완료` : `${selectedDate} 출결 저장`}
              </button>
            )}
          </>
        )}
      </div>
    </TeacherLayout>
  );
}
