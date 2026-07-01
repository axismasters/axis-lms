// AXIS LMS v1.2 — Phase 3D v3-r6: ScoreExportPanel
// 시험 성적 Excel/PDF 출력 공용 화면 컴포넌트. 계산/생성 로직은 전혀 담지 않고
// scoreExportEngine.ts의 결과를 표시하고 다운로드/인쇄 버튼만 담당한다.
//
// 호출부(관리자/교사 페이지)가 이미 권한 스코프로 걸러서 넘긴 exams/students만 사용하므로,
// 이 컴포넌트 자체는 "학원 전체 vs 담당 반" 같은 권한 판단을 하지 않는다.

import { useMemo, useState } from 'react';
import { Download, Printer, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import type { Exam, ExamSubmission } from '@/lib/assessmentData';
import type { Student } from '@/lib/dummyData';
import type { ClassRoom } from '@/lib/classData';
import { buildScoreExportRows, exportScoresToExcel, groupRowsByExam, SCORE_EXPORT_COLUMNS } from '@/lib/scoreExportEngine';
import { getIfRecordForExam } from '@/lib/studentIfRecord';
import { toast } from 'sonner';

interface ScoreExportPanelProps {
  scopeLabel: string; // 예: "학원 전체" / "담당 반·담당 학생"
  availableExams: Exam[]; // 호출부가 이미 권한/카테고리로 걸러서 넘긴 시험 목록
  students: Student[];
  classes: ClassRoom[];
  submissions: ExamSubmission[];
}

export default function ScoreExportPanel({ scopeLabel, availableExams, students, classes, submissions }: ScoreExportPanelProps) {
  const sortedExams = useMemo(
    () => [...availableExams].sort((a, b) => b.examDate.localeCompare(a.examDate)),
    [availableExams]
  );

  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  // 반 선택지 — 넘겨받은 시험들의 classId ∪ 넘겨받은 학생들이 속한 반
  const availableClasses = useMemo(() => {
    const idsFromExams = new Set(sortedExams.map((e) => e.classId).filter((id): id is string => !!id));
    const idsFromStudents = new Set(students.flatMap((s) => s.classes.filter((c) => c.status === '수강중').map((c) => c.id)));
    const ids = new Set([...idsFromExams, ...idsFromStudents]);
    return classes.filter((c) => ids.has(c.id));
  }, [sortedExams, students, classes]);

  // 학생 선택지 — 반 필터가 있으면 그 반 소속만, 검색어 필터 적용
  const availableStudents = useMemo(() => {
    let list = students;
    if (selectedClassIds.length > 0) {
      const classSet = new Set(selectedClassIds);
      list = list.filter((s) => s.classes.some((c) => classSet.has(c.id) && c.status === '수강중'));
    }
    if (studentSearch.trim()) {
      list = list.filter((s) => s.name.includes(studentSearch.trim()));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [students, selectedClassIds, studentSearch]);

  const rows = useMemo(() => {
    if (selectedExamIds.length === 0) return [];
    return buildScoreExportRows({
      exams: sortedExams,
      submissions,
      students,
      classes,
      selectedExamIds,
      selectedClassIds,
      selectedStudentIds,
      getIfRecord: getIfRecordForExam,
    });
  }, [sortedExams, submissions, students, classes, selectedExamIds, selectedClassIds, selectedStudentIds]);

  const groupedForPrint = useMemo(() => groupRowsByExam(rows), [rows]);

  const handleExcelDownload = () => {
    if (rows.length === 0) {
      toast.error('출력할 성적 데이터가 없습니다. 시험을 선택해주세요.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    exportScoresToExcel(rows, `AXIS_성적출력_${today}`);
    toast.success('Excel 파일이 다운로드되었습니다.');
  };

  const handlePrint = () => {
    if (rows.length === 0) {
      toast.error('출력할 성적 데이터가 없습니다. 시험을 선택해주세요.');
      return;
    }
    window.print();
  };

  const chipStyle = (active: boolean) => ({
    background: active ? '#081F4D' : 'oklch(0.96 0.004 250)',
    color: active ? 'white' : 'oklch(0.4 0.015 250)',
    border: active ? '1px solid #081F4D' : '1px solid oklch(0.9 0.008 250)',
  });

  return (
    <div className="space-y-4">
      <div className="axis-card p-4 text-xs" style={{ borderLeft: '3px solid #081F4D', color: 'oklch(0.5 0.015 250)' }}>
        출력 범위: <b>{scopeLabel}</b>. 시험을 선택하면 반/학생 필터로 일부만 골라 출력할 수 있습니다(비워두면 전체).
      </div>

      {/* 1. 시험 선택 */}
      <div className="axis-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>시험 선택</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedExamIds(sortedExams.map((e) => e.id))}
              className="text-xs px-2 py-1 rounded border transition-colors hover:bg-slate-50"
              style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.5 0.015 250)' }}>전체 선택</button>
            <button onClick={() => setSelectedExamIds([])}
              className="text-xs px-2 py-1 rounded border transition-colors hover:bg-slate-50"
              style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.5 0.015 250)' }}>선택 해제</button>
          </div>
        </div>
        {sortedExams.length === 0 ? (
          <div className="text-xs py-4 text-center" style={{ color: 'oklch(0.6 0.015 250)' }}>출력 가능한 시험이 없습니다.</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {sortedExams.map((exam) => {
              const active = selectedExamIds.includes(exam.id);
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => setSelectedExamIds((prev) => toggleId(prev, exam.id))}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:bg-slate-50"
                  style={{ border: '1px solid oklch(0.93 0.006 250)' }}
                >
                  {active ? <CheckSquare size={14} style={{ color: '#081F4D' }} /> : <Square size={14} style={{ color: 'oklch(0.75 0.01 250)' }} />}
                  <span className="font-medium flex-1 truncate" style={{ color: 'oklch(0.25 0.02 250)' }}>{exam.title}</span>
                  <span style={{ color: 'oklch(0.6 0.015 250)' }}>{exam.examDate}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. 반 선택(선택, 비우면 전체) */}
      {availableClasses.length > 0 && (
        <div className="axis-card p-4">
          <span className="text-sm font-semibold block mb-2" style={{ color: 'oklch(0.25 0.02 250)' }}>반 선택 (선택 사항 — 비우면 전체)</span>
          <div className="flex flex-wrap gap-1.5">
            {availableClasses.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelectedClassIds((prev) => toggleId(prev, c.id))}
                className="text-xs px-2.5 py-1 rounded-full transition-colors" style={chipStyle(selectedClassIds.includes(c.id))}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. 학생 선택(선택, 비우면 전체) */}
      <div className="axis-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>학생 선택 (선택 사항 — 비우면 전체)</span>
          <input
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="이름 검색"
            className="text-xs px-2 py-1 rounded-md"
            style={{ border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {availableStudents.length === 0 ? (
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>조건에 맞는 학생이 없습니다.</span>
          ) : (
            availableStudents.map((s) => (
              <button key={s.id} type="button" onClick={() => setSelectedStudentIds((prev) => toggleId(prev, s.id))}
                className="text-xs px-2.5 py-1 rounded-full transition-colors" style={chipStyle(selectedStudentIds.includes(s.id))}>
                {s.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. 미리보기 + 출력 버튼 */}
      <div className="axis-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>
            미리보기 <span className="font-normal text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>({rows.length}건)</span>
          </span>
          <div className="flex gap-2">
            <button onClick={handleExcelDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'oklch(0.45 0.15 145)' }}>
              <FileSpreadsheet size={13} /> Excel 다운로드
            </button>
            <button onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#081F4D' }}>
              <Printer size={13} /> PDF로 인쇄
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <Download size={24} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>시험을 선택하면 미리보기가 표시됩니다.</div>
          </div>
        ) : (
          <div className="axis-table-wrap">
            <div className="axis-table-scroll" style={{ maxHeight: 400 }}>
              <table className="w-full text-xs" style={{ minWidth: 760 }}>
                <thead>
                  <tr style={{ background: 'oklch(0.985 0.003 250)' }}>
                    {SCORE_EXPORT_COLUMNS.map((h) => (
                      <th key={h} className="px-2.5 py-2 text-left font-semibold whitespace-nowrap"
                        style={{ color: 'oklch(0.5 0.015 250)', background: 'oklch(0.985 0.003 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.005 250)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.examId}-${r.studentId}`} className="axis-table-row border-b" style={{ borderColor: 'oklch(0.95 0.003 250)' }}>
                      <td className="px-2.5 py-1.5 whitespace-nowrap" style={{ color: 'oklch(0.25 0.02 250)' }}>{r.studentName}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.className}</td>
                      <td className="px-2.5 py-1.5" style={{ color: 'oklch(0.35 0.02 250)' }}>{r.examTitle}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.examDate}</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums" style={{ color: 'oklch(0.25 0.02 250)' }}>{r.score}</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.totalScore}</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold" style={{ color: '#081F4D' }}>{r.percentage}%</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums" style={{ color: (r.vsAverage ?? 0) >= 0 ? 'oklch(0.45 0.15 160)' : 'oklch(0.55 0.2 27)' }}>
                        {r.vsAverage === null ? '-' : r.vsAverage > 0 ? `+${r.vsAverage}` : r.vsAverage}
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.ifScore ?? '-'}</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums" style={{ color: 'oklch(0.5 0.015 250)' }}>{r.missedPoints ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 인쇄 전용 영역 — 평소 화면에는 보이지 않고(index.css .axis-print-area), 인쇄 시에만 표시된다.
          A4 인쇄를 기준으로 시험별로 나눠서 표를 구성한다. */}
      <div className="axis-print-area">
        <h1 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>AXIS 시험 성적 출력</h1>
        <p style={{ fontSize: 11, color: '#666', marginBottom: 16 }}>
          출력 범위: {scopeLabel} · 출력일: {new Date().toISOString().slice(0, 10)}
        </p>
        {groupedForPrint.map((g) => (
          <div key={g.examId} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{g.examTitle} <span style={{ fontWeight: 400, color: '#666' }}>({g.examDate})</span></h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  {SCORE_EXPORT_COLUMNS.map((h) => (
                    <th key={h} style={{ border: '1px solid #999', padding: '4px 6px', background: '#f3f3f3', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={`${r.examId}-${r.studentId}`}>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{r.studentName}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{r.className}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{r.examTitle}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{r.examDate}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{r.score}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{r.totalScore}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{r.percentage}%</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{r.vsAverage === null ? '-' : r.vsAverage > 0 ? `+${r.vsAverage}` : r.vsAverage}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{r.ifScore ?? '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{r.missedPoints ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
