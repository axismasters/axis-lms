// AXIS LMS v1.2 — Phase 3D v3-r6: 시험 성적 Excel/PDF 출력 엔진 (scoreExportEngine)
//
// 목적: 시험 성적 Excel/PDF 출력의 "계산/생성" 로직을 화면(버튼·미리보기 테이블)과
// 완전히 분리한다. 화면은 이 엔진이 만든 결과를 표시하고 다운로드/인쇄 버튼만 담당한다.
//
// 권한 스코프(호출부가 미리 걸러서 넘겨야 함 — 이 엔진 자체는 권한 판정을 하지 않는다):
//   - 최고관리자/원장: 학원 전체 시험 대상(exams 배열 제한 없음).
//   - 강사: 본인 실시 시험(scope===TEACHER_PRIVATE && ownerTeacherId===본인) 또는
//     담당 반/담당 학생 범위 시험만 exams 배열에 담아 넘겨야 한다.
//   - [교사 화면 시험 구조 정리 유지] 강사 범위에는 입학테스트/인증평가/실제내신성적/
//     전국모의고사/수능실전주간루틴을 절대 포함하지 않는다(TEACHER_CREATABLE_EXAM_CATEGORY_IDS
//     기준으로 호출부에서 걸러서 넘길 것).
//
// PDF는 별도 PDF 생성 라이브러리를 추가하지 않고, 브라우저 인쇄(window.print())로 A4
// 인쇄 가능한 화면을 그대로 인쇄/"PDF로 저장"하는 방식을 사용한다(화면 컴포넌트 담당).
// 이 파일은 Excel(.xlsx) 생성과, 인쇄/미리보기 화면이 공통으로 쓰는 행(row) 데이터 생성만 담당한다.

import * as XLSX from 'xlsx';
import type { Exam, ExamSubmission } from './assessmentData';
import type { Student } from './dummyData';
import type { ClassRoom } from './classData';

export interface ScoreExportRow {
  studentId: string;
  studentName: string;
  className: string;
  examId: string;
  examTitle: string;
  examDate: string;
  score: number; // 획득 점수
  totalScore: number; // 총점(만점)
  percentage: number; // 백분율
  vsAverage: number | null; // 평균 대비 위치(내 점수 - 응시자 평균, 소수 첫째자리 반올림)
  ifScore: number | null; // IF 점수(완료된 IF 회고가 있을 때만)
  missedPoints: number | null; // 놓친 점수(완료된 IF 회고가 있을 때만)
}

export interface BuildScoreExportRowsParams {
  exams: Exam[]; // 호출부가 이미 권한 스코프로 걸러서 넘긴 "출력 가능한 시험" 목록
  submissions: ExamSubmission[]; // 전체 submissions(내부에서 examId로 필터링)
  students: Student[];
  classes: ClassRoom[];
  selectedExamIds: string[]; // 사용자가 실제로 선택한 시험
  selectedClassIds?: string[]; // 비어있으면 전체 반
  selectedStudentIds?: string[]; // 비어있으면 전체 학생
  // IF 레코드 조회 — 순수 함수 유지를 위해 호출부(localStorage 접근부)에서 리졸버로 주입한다.
  getIfRecord: (studentId: string, examId: string) => { ifScore: number; missedPoints: number; isComplete: boolean } | undefined;
}

/**
 * 선택된 시험/반/학생 조건으로 성적 출력용 행(row) 배열을 만든다.
 * 결석/미채점(totalScore 미확정) 응시자는 출력 대상에서 제외한다(공개된 확정 점수만).
 */
export function buildScoreExportRows(params: BuildScoreExportRowsParams): ScoreExportRow[] {
  const { exams, submissions, students, classes, selectedExamIds, selectedClassIds, selectedStudentIds, getIfRecord } = params;

  const examMap = new Map(exams.map((e) => [e.id, e]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const classIdFilter = selectedClassIds && selectedClassIds.length > 0 ? new Set(selectedClassIds) : null;
  const studentIdFilter = selectedStudentIds && selectedStudentIds.length > 0 ? new Set(selectedStudentIds) : null;

  const rows: ScoreExportRow[] = [];

  selectedExamIds.forEach((examId) => {
    const exam = examMap.get(examId);
    if (!exam) return;

    // 이 시험의 유효 제출(결석 제외, 총점 확정)만 대상 — 응시자 평균 계산에도 동일 기준 사용
    const validSubs = submissions.filter((s) => s.examId === examId && s.status !== '결석' && s.totalScore !== undefined);
    if (validSubs.length === 0) return;
    const avg = validSubs.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / validSubs.length;

    validSubs.forEach((sub) => {
      const student = studentMap.get(sub.studentId);
      if (!student) return;
      if (studentIdFilter && !studentIdFilter.has(student.id)) return;

      // 반 필터: 이 시험의 classId 기준(반 단위 시험) 또는 학생이 선택된 반에 소속된 경우(학원 전체 시험)
      const examClassId = exam.classId;
      if (classIdFilter) {
        const matchesExamClass = examClassId ? classIdFilter.has(examClassId) : false;
        const matchesStudentClass = student.classes.some((c) => classIdFilter.has(c.id) && c.status === '수강중');
        if (!matchesExamClass && !matchesStudentClass) return;
      }

      const className = examClassId
        ? classMap.get(examClassId)?.name ?? '반 정보 없음'
        : (student.classes.find((c) => c.status === '수강중')?.name ?? '학원 전체');

      const score = sub.totalScore ?? 0;
      const totalScore = exam.totalScore;
      const percentage = totalScore > 0 ? Math.round((score / totalScore) * 1000) / 10 : 0;
      const vsAverage = Math.round((score - avg) * 10) / 10;

      const ifRecord = getIfRecord(student.id, examId);
      const ifComplete = ifRecord?.isComplete ?? false;

      rows.push({
        studentId: student.id,
        studentName: student.name,
        className,
        examId,
        examTitle: exam.title,
        examDate: exam.examDate,
        score,
        totalScore,
        percentage,
        vsAverage,
        ifScore: ifComplete ? ifRecord!.ifScore : null,
        missedPoints: ifComplete ? ifRecord!.missedPoints : null,
      });
    });
  });

  return rows.sort((a, b) => a.examDate.localeCompare(b.examDate) || a.studentName.localeCompare(b.studentName, 'ko'));
}

// 출력 컬럼 헤더(Excel/인쇄 화면 공통) — 요청된 출력 항목 순서 그대로.
export const SCORE_EXPORT_COLUMNS = [
  '학생명', '반', '시험명', '시험일', '점수', '총점', '백분율', '평균 대비 위치', 'IF 점수', '놓친 점수',
] as const;

function rowToArray(r: ScoreExportRow): (string | number)[] {
  return [
    r.studentName,
    r.className,
    r.examTitle,
    r.examDate,
    r.score,
    r.totalScore,
    `${r.percentage}%`,
    r.vsAverage === null ? '-' : (r.vsAverage > 0 ? `+${r.vsAverage}` : `${r.vsAverage}`),
    r.ifScore === null ? '-' : r.ifScore,
    r.missedPoints === null ? '-' : r.missedPoints,
  ];
}

/**
 * 행 데이터를 .xlsx 파일로 생성해 바로 다운로드한다(브라우저 클라이언트 사이드, 서버 전송 없음).
 */
export function exportScoresToExcel(rows: ScoreExportRow[], filename: string): void {
  const sheetData = [Array.from(SCORE_EXPORT_COLUMNS), ...rows.map(rowToArray)];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  // 컬럼 폭 간단 자동 조정(문자 수 기준 근사치)
  worksheet['!cols'] = SCORE_EXPORT_COLUMNS.map((_, colIdx) => {
    const maxLen = sheetData.reduce((m, row) => Math.max(m, String(row[colIdx] ?? '').length), 4);
    return { wch: Math.min(30, maxLen + 2) };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '성적');
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/** 인쇄(PDF) 화면에서 "시험별로 묶어서" 보여주기 위한 그룹핑 헬퍼. */
export function groupRowsByExam(rows: ScoreExportRow[]): { examId: string; examTitle: string; examDate: string; rows: ScoreExportRow[] }[] {
  const map = new Map<string, ScoreExportRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.examId) ?? [];
    list.push(r);
    map.set(r.examId, list);
  });
  return Array.from(map.entries())
    .map(([examId, list]) => ({ examId, examTitle: list[0].examTitle, examDate: list[0].examDate, rows: list }))
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
}
