// AXIS LMS v1.2 — Phase 3A: UniversityReportManagement
// 관리자 대학추천/목표대학 관리자 상세 리포트 입구
//
// - 관리자용 상세 분석 및 상담 리포트 관리
// - 학생용 프리뷰와 분리된 상세 화면
// - PDF 출력 준비 (Phase 4+)
//
// 경로: /admin/university-reports
//
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격/안정 합격 표현 금지

import { useState } from 'react';
import { GraduationCap, FileText, Download, ChevronRight, BookOpen } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import { toast } from 'sonner';

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

  return (
    <AdminLayout title="대학추천/목표대학 관리자 리포트"
      breadcrumbs={[{ label: '대학추천/목표대학' }, { label: '관리자 리포트' }]}>
      <div className="max-w-3xl space-y-4">

        {/* 안내 배너 */}
        <div className="axis-card px-4 py-3 text-xs" style={{ borderLeft: '3px solid #040D1E', color: 'oklch(0.5 0.015 250)' }}>
          이 화면은 관리자·원장 전용 상세 리포트 화면입니다.
          학생용 프리뷰(목표 변화 방향)와 분리되어 있으며, 상담 참고 리포트 및 PDF 준비에 사용됩니다.
          <strong className="block mt-1" style={{ color: 'oklch(0.45 0.2 27)' }}>
            ⚠ 이 화면에서는 확정 결과를 단정하는 표현 대신, 추천 적합도·보완 필요도 중심의 참고 지표만 사용합니다.
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
                        리포트 <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 학생 상세 리포트 */}
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
                    {selectedStudent.name} — {universityLabel} 관리자 리포트
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    {gradeLevel ?? '학년 미확인'} · 관리자 전용 상세 화면
                  </div>
                </div>
              </div>

              {/* 성적 데이터 현황 */}
              <div className="space-y-3">
                <div className="text-xs font-semibold px-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
                  데이터 현황
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '모의고사 기록', value: `${selectedStudent.mockExamScores.length}회`, ok: selectedStudent.mockExamScores.length > 0 },
                    { label: '내신 기록', value: `${selectedStudent.internalScores.length}건`, ok: selectedStudent.internalScores.length > 0 },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: ok ? 'oklch(0.92 0.08 145)' : 'oklch(0.95 0.004 250)' }}>
                      <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                      <div className="font-bold text-sm" style={{ color: ok ? 'oklch(0.3 0.15 145)' : 'oklch(0.55 0.015 250)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* 성적 목록 */}
                {selectedStudent.mockExamScores.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.5 0.015 250)' }}>모의고사 성적</div>
                    {selectedStudent.mockExamScores.map(score => (
                      <div key={score.id} className="axis-card p-3 mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{score.examName}</div>
                            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                              {score.examDate} · {score.grade}
                            </div>
                          </div>
                          <div className="text-right">
                            {score.math && (
                              <div className="text-xs font-medium" style={{ color: 'oklch(0.35 0.15 250)' }}>
                                수학 {score.math.grade}등급 ({score.math.percentile}%)
                              </div>
                            )}
                            {score.korean && (
                              <div className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                                국어 {score.korean.grade}등급
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 리포트/PDF 섹션 */}
                <div className="rounded-xl p-4" style={{ background: 'oklch(0.95 0.04 260)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={15} style={{ color: '#040D1E' }} />
                    <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
                      상담 리포트 / PDF 준비
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: 'oklch(0.93 0.06 80)', color: 'oklch(0.4 0.15 80)' }}>
                      Phase 4+
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '상담 리포트 생성', icon: BookOpen },
                      { label: 'PDF 다운로드 (준비 중)', icon: Download },
                    ].map(({ label, icon: Icon }) => (
                      <button key={label} type="button"
                        onClick={() => toast.info(`${label} — Phase 4+에서 구현됩니다.`)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'white', color: 'oklch(0.4 0.015 250)', border: '1px solid oklch(0.9 0.008 250)' }}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
