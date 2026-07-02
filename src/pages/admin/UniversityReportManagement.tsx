// AXIS LMS v1.2 — Phase 3A: UniversityReportManagement
// 관리자 대학추천/목표대학 관리자 상세 리포트 입구
//
// - 관리자용 상세 분석 및 상담 리포트 관리
// - 학생용 프리뷰와 분리된 상세 화면
//
// 경로: /admin/university-reports
//
// [Phase 3E v3-r16-r1] "핵심 상담 흐름만 연결" 원칙에 따라 정리:
//   - "PDF 다운로드"/"상담 리포트 생성" 버튼은 클릭해도 토스트만 뜨는 더미였고, PDF 내보내기는
//     이 프로젝트의 영구 금지 항목이라 애초에 만들 수 없는 기능이었다 — 제거했다.
//   - 학생 성적을 이 화면에서 다시 나열하는 대신, 실제 대학추천 분석 도구(어댑터/게이트/
//     Phase 5.1 연동)가 이미 갖춰진 학생 상세 화면(StudentDetail.tsx GradesTab)으로
//     바로 연결한다 — 같은 기능을 두 곳에서 다르게 만들지 않는다.
// [Phase 3E v3-r16-r2] 화면에 실제로 노출되는 문구에서 "Phase 5.1 연동"/"어댑터" 같은
// 개발자용 표현을 제거했다(이 파일 상단 주석은 개발 문서이므로 그대로 둔다). 로직 변경 없음.
// [Phase 3E v3-r16-r2 추가] 학생 선택 시 상담 요약 엔진(universityCounselingSummary.ts)을
// 연결해 현재 위치/보완 필요 과목/상담 준비 상태를 보여준다.
// [Phase 3E v3-r16-r3] 기존 "상담 준비 상태" 카드 안에 신뢰도 등급 배지 + 요약 문장만
// 추가했다(새 카드 아님 — 지시서 §6 "카드에 신뢰도 요약 추가" 그대로). 배치표 원점수/
// 컷/합격 관련 표현은 여전히 이 파일 어디에도 없다.
// ⚠ 참고: 이 화면 상단의 "데이터 현황 요약"(모의고사/내신 건수)은 Assessment Engine
//   데이터(student.mockExamScores/internalScores)를 쓰고, 새로 추가한 "상담 준비 상태"는
//   교사 입력 데이터(universityPayloadAdapter.ts, TeacherUniversityData.tsx와 동일 소스)를
//   쓴다 — 이 프로젝트에 대학추천 데이터 파이프라인이 두 갈래로 존재하기 때문이다(§ CHANGES
//   문서에 통합 제안 있음). 두 값이 다르게 보일 수 있음을 알고 있어야 한다.
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격/안정 합격 표현 금지

import { useState } from 'react';
import { Link } from 'wouter';
import { GraduationCap, ChevronRight, ArrowRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import { buildUniversityRecommendationPayloadForStudent, getReadinessLabel } from '@/lib/universityPayloadAdapter';
import { buildUniversityCounselingSummary } from '@/lib/universityCounselingSummary';

export default function UniversityReportManagement() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'detail'>('list');

  // 대학추천 분석이 가능한 학생 (고3 우선)
  const eligibleStudents = students.filter(s => s.status === '재원');

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const gradeLevel = detectStudentGradeLevel(selectedStudent);
  const universityLabel = getUniversityMenuLabel(gradeLevel);
  // [Phase 3E v3-r16-r2] 상담 요약 엔진 연결 — 학생 선택 시 현재 위치/보완 과목/상담
  // 준비 상태를 요약해서 보여준다(§ 지시서 4-8). PDF/리포트 생성 버튼은 추가하지 않는다.
  const counselingSummary = selectedStudent
    ? buildUniversityCounselingSummary(
        buildUniversityRecommendationPayloadForStudent(selectedStudent.id, gradeLevel),
        selectedStudent.name,
      )
    : null;

  return (
    <AdminLayout title="대학추천/목표대학 관리자 리포트"
      breadcrumbs={[{ label: '대학추천/목표대학' }, { label: '관리자 리포트' }]}>
      <div className="max-w-3xl space-y-4">

        {/* 안내 배너 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ borderLeft: '3px solid #040D1E', color: 'oklch(0.4 0.015 250)' }}>
          이 화면은 관리자·원장 전용 상세 리포트 입구입니다. 학생용 프리뷰(목표 변화 방향)와
          분리되어 있으며, 학생을 선택하면 상세 분석 도구가 갖춰진
          학생 상세 화면으로 이동합니다.
          <strong className="block mt-1" style={{ color: 'oklch(0.35 0.2 27)' }}>
            ⚠ 확정 결과를 단정하는 표현 대신, 추천 적합도·보완 필요도 중심의 참고 지표만 사용합니다.
          </strong>
        </div>

        {/* 학생 목록 + 상태 */}
        {activeSection === 'list' && (
          <>
            <div className="flex items-center gap-2 mb-2 px-1">
              <GraduationCap size={15} style={{ color: '#040D1E' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>
                재원생 대학추천/목표대학 현황
              </span>
            </div>
            <div className="space-y-2">
              {eligibleStudents.map(student => {
                const gl = detectStudentGradeLevel(student);
                const label = getUniversityMenuLabel(gl);
                const hasMockData = student.mockExamScores.length > 0;
                const hasInternal = student.internalScores.length > 0;
                return (
                  <div key={student.id} className="axis-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: gl === '고3' ? '#040D1E' : 'oklch(0.6 0.15 145)' }}>
                          {gl ?? '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>
                            {student.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ background: 'oklch(0.93 0.04 250)', color: 'oklch(0.4 0.1 250)' }}>
                              {label}
                            </span>
                            <span className="text-xs" style={{ color: hasMockData ? 'oklch(0.45 0.15 145)' : 'oklch(0.65 0.015 250)' }}>
                              모의고사 {student.mockExamScores.length}회
                            </span>
                            <span className="text-xs" style={{ color: hasInternal ? 'oklch(0.45 0.15 145)' : 'oklch(0.65 0.015 250)' }}>
                              내신 {student.internalScores.length}건
                            </span>
                          </div>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => { setSelectedStudentId(student.id); setActiveSection('detail'); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.4 0.1 250)' }}>
                        확인 <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {eligibleStudents.length === 0 && (
                <div className="axis-card p-8 text-center text-sm" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  재원 중인 학생이 없습니다.
                </div>
              )}
            </div>
          </>
        )}

        {/* 학생 상세 — 데이터 요약만 보여주고, 상세 분석은 학생 상세 화면으로 연결한다 */}
        {activeSection === 'detail' && selectedStudent && (
          <>
            <button type="button" onClick={() => setActiveSection('list')}
              className="text-xs flex items-center gap-1"
              style={{ color: '#040D1E' }}>
              ← 목록으로
            </button>

            <div className="axis-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                  style={{ background: '#040D1E' }}>
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                    {selectedStudent.name} — {universityLabel}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.42 0.015 250)' }}>
                    {gradeLevel ?? '학년 미확인'}
                  </div>
                </div>
              </div>

              {/* 데이터 현황 요약 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: '모의고사 기록', value: `${selectedStudent.mockExamScores.length}회`, ok: selectedStudent.mockExamScores.length > 0 },
                  { label: '내신 기록', value: `${selectedStudent.internalScores.length}건`, ok: selectedStudent.internalScores.length > 0 },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: ok ? 'oklch(0.92 0.08 145)' : 'oklch(0.95 0.004 250)' }}>
                    <div className="text-xs" style={{ color: 'oklch(0.42 0.015 250)' }}>{label}</div>
                    <div className="font-bold text-sm" style={{ color: ok ? 'oklch(0.3 0.15 145)' : 'oklch(0.55 0.015 250)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* 상담 준비 상태 요약 — 현재 위치 / 보완 필요 과목 */}
              {counselingSummary && (
                <div className="rounded-lg p-3.5 mb-4" style={{ background: 'oklch(0.97 0.04 250)', border: '1px solid oklch(0.93 0.008 250)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.015 250)' }}>상담 준비 상태</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
                      style={{ background: counselingSummary.dataReadiness.color + '18', color: counselingSummary.dataReadiness.color }}>
                      {counselingSummary.dataReadiness.label}
                    </span>
                    {/* [Phase 3E v3-r16-r3] 신뢰도 등급 배지 — 기존 카드 안에 추가 */}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: counselingSummary.reliability.grade.color + '18', color: counselingSummary.reliability.grade.color }}>
                      신뢰도 {counselingSummary.reliability.grade.grade}등급
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'oklch(0.3 0.02 250)' }}>{counselingSummary.oneLiner}</p>
                  {counselingSummary.currentPosition.available && (
                    <p className="text-xs mb-1" style={{ color: 'oklch(0.42 0.015 250)' }}>{counselingSummary.currentPosition.summary}</p>
                  )}
                  {counselingSummary.topWeakSubjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>보완 필요 과목:</span>
                      {counselingSummary.topWeakSubjects.map(n => (
                        <span key={n.subjectName + n.source} className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.35 0.02 250)' }}>
                          {n.subjectName}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* [Phase 3E v3-r16-r3] 신뢰도 요약 한 줄 — 부족 데이터 근거 포함 */}
                  <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid oklch(0.9 0.006 250)', color: 'oklch(0.45 0.015 250)' }}>
                    {counselingSummary.reliability.teacherHeadline}
                  </div>
                </div>
              )}

              {/* 상세 분석 도구로 이동 — 중복 화면을 만들지 않고 기존 도구로 연결한다 */}
              <Link href={`/admin/students/${selectedStudent.id}?tab=grades`}>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
                  style={{ background: '#040D1E' }}>
                  <div>
                    <div className="font-semibold text-sm text-white">학생 상세에서 상세 분석 확인</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.85 0.01 250)' }}>
                      대학추천 데이터 상태 · 상담 리포트 미리보기 · 상세 분석 도구 연결
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: '#C8A15A' }} />
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
