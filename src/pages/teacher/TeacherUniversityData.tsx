// AXIS LMS v1.2 — Phase 3A-1+: TeacherUniversityData
// 선생님 대학추천 데이터 관리 (내신/모의고사 입력 + 현황 + payload)
//
// 탭 구조:
//   1. 내신성적 입력 (과목별 고정 테이블)
//   2. 전국연합모의고사 입력 (성적표 구조)
//   3. 수능실전모의고사 입력 (수능 구조)
//   4. 학생별 데이터 현황
//   5. Payload 미리보기
//
// 경로: /teacher/university-data
// ⚠ 금지: 합격률/합격 가능성/합격 보장/불합격 표현 금지

import { useState, useMemo, Fragment } from 'react';
import {
  GraduationCap, BarChart2, FileText, Save, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { detectStudentGradeLevel, getUniversityMenuLabel } from '@/lib/universityMenuLabel';
import {
  SCHOOL_SUBJECTS, CATEGORY_LABELS,
  createEmptySchoolRecord, saveSchoolRecord, getSchoolRecordsForStudentAll,
} from '@/lib/teacherSchoolRecordInput';
import type { TeacherSchoolRecordInput, SubjectCategory } from '@/lib/teacherSchoolRecordInput';
import {
  SOCIAL_SUBJECTS, SCIENCE_SUBJECTS, SECOND_LANGUAGE_SUBJECTS,
  createEmptyMockExamInput, saveMockExamInput,
  getMockExamRecordsForStudent, getSuneungRecordsForStudent, getNationalMockRecordsForStudent,
  getMockExamLabel,
} from '@/lib/teacherMockExamInput';
import type { TeacherMockExamInput, ExploreTrack, KoreanOptSubject, MathOptSubject } from '@/lib/teacherMockExamInput';
import {
  buildUniversityRecommendationPayloadForStudent, getReadinessLabel, getRecommendationFitScore, ENGINE_CONNECTED,
} from '@/lib/universityPayloadAdapter';
import { toast } from 'sonner';

type TabId = 'school-record' | 'national-mock' | 'suneung-mock' | 'data-status' | 'payload';

const TABS: { id: TabId; label: string }[] = [
  { id: 'school-record',  label: '내신성적' },
  { id: 'national-mock',  label: '전국연합' },
  { id: 'suneung-mock',   label: '수능실전' },
  { id: 'data-status',    label: '데이터 현황' },
  { id: 'payload',        label: 'Payload' },
];

const inputStyle = {
  width: '100%', border: '1px solid oklch(0.9 0.008 250)', borderRadius: 6,
  padding: '5px 8px', fontSize: 12, background: 'oklch(0.98 0.002 250)', outline: 'none',
  textAlign: 'center' as const,
};
const selectStyle = { ...inputStyle, textAlign: 'left' as const, padding: '5px 6px' };

// ─── 내신성적 입력 탭 ────────────────────────────────────────────────
function SchoolRecordTab({ teacherId, assignedStudentIds }: { teacherId: string; assignedStudentIds: string[] }) {
  const { students } = useStudents();
  const [selectedId, setSelectedId] = useState(assignedStudentIds[0] ?? '');
  const [record, setRecord] = useState<TeacherSchoolRecordInput>(() =>
    createEmptySchoolRecord(selectedId, teacherId, String(new Date().getFullYear()))
  );
  // "+ 과목 추가"로 수동으로 펼친 과목(학생 변경 시 초기화)
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(() => new Set());
  const [showAddPicker, setShowAddPicker] = useState(false);

  function updateGrade<K extends keyof TeacherSchoolRecordInput['subjectGrades'][0]>(
    subjectId: string, field: K, value: TeacherSchoolRecordInput['subjectGrades'][0][K]
  ) {
    setRecord(prev => ({
      ...prev,
      subjectGrades: prev.subjectGrades.map(sg =>
        sg.subjectId === subjectId ? { ...sg, [field]: value } : sg
      ),
    }));
  }

  function handleStudentChange(id: string) {
    setSelectedId(id);
    setRecord(createEmptySchoolRecord(id, teacherId, String(new Date().getFullYear())));
    setExpandedSubjectIds(new Set());
  }

  function handleSave() {
    if (!selectedId) { toast.error('학생을 선택하세요'); return; }
    const saved = { ...record, studentId: selectedId };
    saveSchoolRecord(saved);
    toast.success(`${students.find(s => s.id === selectedId)?.name} 내신성적이 저장되었습니다.`);
  }

  // 기본 노출 과목: 대학 반영 기본값(requiredForUniv) 과목 + 이미 값이 입력된 과목 + 수동으로 펼친 과목.
  // 26과목을 한 번에 다 보여주지 않고, 학생이 실제로 반영할 가능성이 높은 과목만 먼저 보여준다.
  function hasAnyValue(sg: typeof record.subjectGrades[0]): boolean {
    return sg.rawScore !== undefined || sg.gradeRank !== undefined || sg.achievementLevel !== undefined;
  }
  const visibleSubjectIds = useMemo(() => {
    const ids = new Set(SCHOOL_SUBJECTS.filter(s => s.requiredForUniv).map(s => s.id));
    record.subjectGrades.forEach(sg => { if (hasAnyValue(sg)) ids.add(sg.subjectId); });
    expandedSubjectIds.forEach(id => ids.add(id));
    return ids;
  }, [record, expandedSubjectIds]);
  const hiddenSubjects = SCHOOL_SUBJECTS.filter(s => !visibleSubjectIds.has(s.id));

  const catOrder: SubjectCategory[] = ['common', 'social', 'science', 'elective'];

  return (
    <div className="space-y-4">
      {/* 헤더 옵션 */}
      <div className="axis-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>학생 *</label>
            <select style={selectStyle} value={selectedId} onChange={e => handleStudentChange(e.target.value)}>
              <option value="">선택하세요</option>
              {assignedStudentIds.map(id => {
                const s = students.find(st => st.id === id);
                return <option key={id} value={id}>{s?.name ?? id}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>학년</label>
            <select style={selectStyle} value={record.gradeLevel}
              onChange={e => setRecord(p => ({ ...p, gradeLevel: e.target.value as any }))}>
              <option>고1</option><option>고2</option><option>고3</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>학기</label>
            <select style={selectStyle} value={record.semester}
              onChange={e => setRecord(p => ({ ...p, semester: e.target.value as any }))}>
              <option>1학기</option><option>2학기</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>종류</label>
            <select style={selectStyle} value={record.examType}
              onChange={e => setRecord(p => ({ ...p, examType: e.target.value as any }))}>
              <option>중간</option><option>기말</option><option>수행</option><option>학기말</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>계열</label>
            <select style={selectStyle} value={record.track}
              onChange={e => setRecord(p => ({ ...p, track: e.target.value as any }))}>
              <option>인문</option><option>자연</option><option>통합</option>
            </select>
          </div>
        </div>
      </div>

      {/* 과목별 입력표 */}
      <div className="axis-card overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.3 0.02 250)' }}>
          과목별 내신 성적 입력 (대학 반영 기본 과목만 우선 표시, 나머지는 아래 "+ 과목 추가"로 펼치세요)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 780, fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'oklch(0.97 0.003 250)' }}>
                <th className="text-left px-3 py-2 font-semibold w-32" style={{ color: 'oklch(0.4 0.015 250)' }}>과목명</th>
                <th className="px-2 py-2 font-semibold w-16" style={{ color: 'oklch(0.4 0.015 250)' }}>원점수</th>
                <th className="px-2 py-2 font-semibold w-16" style={{ color: 'oklch(0.4 0.015 250)' }}>과목평균</th>
                <th className="px-2 py-2 font-semibold w-16" style={{ color: 'oklch(0.4 0.015 250)' }}>표준편차</th>
                <th className="px-2 py-2 font-semibold w-14" style={{ color: 'oklch(0.4 0.015 250)' }}>석차등급</th>
                <th className="px-2 py-2 font-semibold w-14" style={{ color: 'oklch(0.4 0.015 250)' }}>성취도</th>
                <th className="px-2 py-2 font-semibold w-14" style={{ color: 'oklch(0.4 0.015 250)' }}>수강자</th>
                <th className="px-2 py-2 font-semibold w-12" style={{ color: 'oklch(0.4 0.015 250)' }}>단위수</th>
                <th className="px-2 py-2 font-semibold w-12" style={{ color: 'oklch(0.4 0.015 250)' }}>반영</th>
              </tr>
            </thead>
            <tbody>
              {catOrder.map(cat => {
                const subjects = SCHOOL_SUBJECTS.filter(s => s.category === cat && visibleSubjectIds.has(s.id));
                if (subjects.length === 0) return null;
                return (
                  <Fragment key={`cat-${cat}`}>
                    <tr style={{ background: 'oklch(0.95 0.04 250)' }}>
                      <td colSpan={9} className="px-3 py-1 font-semibold text-xs" style={{ color: 'oklch(0.4 0.1 250)' }}>
                        {CATEGORY_LABELS[cat]}
                      </td>
                    </tr>
                    {subjects.map(subj => {
                      const sg = record.subjectGrades.find(g => g.subjectId === subj.id);
                      if (!sg) return null;
                      const isAbsolute = subj.evaluationType === 'absolute';
                      return (
                        <tr key={subj.id} className="border-b" style={{ borderColor: 'oklch(0.94 0.006 250)' }}>
                          <td className="px-3 py-1.5 font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>
                            {subj.name}
                            {isAbsolute && (
                              <span className="ml-1 text-xs font-normal" style={{ color: 'oklch(0.6 0.015 250)' }}>(성취평가)</span>
                            )}
                          </td>
                          <td className="px-1 py-1.5">
                            <input type="number" style={inputStyle} placeholder="-" min={0} max={100}
                              value={sg.rawScore ?? ''} onChange={e => updateGrade(subj.id, 'rawScore', e.target.value ? Number(e.target.value) : undefined)} />
                          </td>
                          <td className="px-1 py-1.5">
                            <input type="number" style={inputStyle} placeholder="-" step="0.1"
                              value={sg.subjectAverage ?? ''} onChange={e => updateGrade(subj.id, 'subjectAverage', e.target.value ? Number(e.target.value) : undefined)} />
                          </td>
                          <td className="px-1 py-1.5">
                            <input type="number" style={inputStyle} placeholder="-" step="0.1"
                              value={sg.stdDev ?? ''} onChange={e => updateGrade(subj.id, 'stdDev', e.target.value ? Number(e.target.value) : undefined)} />
                          </td>
                          {/* 석차등급: 상대평가 과목만 입력 가능. 성취평가제 과목은 개념상 석차등급이 없다. */}
                          <td className="px-1 py-1.5">
                            {isAbsolute ? (
                              <div style={{ ...inputStyle, color: 'oklch(0.75 0.01 250)' }}>해당없음</div>
                            ) : (
                              <select style={selectStyle} value={sg.gradeRank ?? ''}
                                onChange={e => updateGrade(subj.id, 'gradeRank', e.target.value ? Number(e.target.value) : undefined)}>
                                <option value="">-</option>
                                {[1,2,3,4,5,6,7,8,9].map(g => <option key={g}>{g}</option>)}
                              </select>
                            )}
                          </td>
                          {/* 성취도: 성취평가제(절대평가) 과목만 입력. 상대평가 과목은 성취도 개념을 쓰지 않는다. */}
                          <td className="px-1 py-1.5">
                            {isAbsolute ? (
                              <select style={selectStyle} value={sg.achievementLevel ?? ''}
                                onChange={e => updateGrade(subj.id, 'achievementLevel', e.target.value || undefined)}>
                                <option value="">-</option>
                                {['A','B','C','D','E'].map(a => <option key={a}>{a}</option>)}
                              </select>
                            ) : (
                              <div style={{ ...inputStyle, color: 'oklch(0.75 0.01 250)' }}>해당없음</div>
                            )}
                          </td>
                          <td className="px-1 py-1.5">
                            <input type="number" style={inputStyle} placeholder="-"
                              value={sg.enrolledCount ?? ''} onChange={e => updateGrade(subj.id, 'enrolledCount', e.target.value ? Number(e.target.value) : undefined)} />
                          </td>
                          <td className="px-1 py-1.5">
                            <input type="number" style={inputStyle} placeholder="-" min={1} max={6}
                              value={sg.creditUnit ?? ''} onChange={e => updateGrade(subj.id, 'creditUnit', e.target.value ? Number(e.target.value) : undefined)} />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <input type="checkbox" checked={sg.includeInPayload}
                              onChange={e => updateGrade(subj.id, 'includeInPayload', e.target.checked)} />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* + 과목 추가: 기본 노출되지 않은 나머지 과목을 필요할 때만 펼친다 */}
      {hiddenSubjects.length > 0 && (
        <div className="axis-card overflow-hidden">
          <button type="button" onClick={() => setShowAddPicker(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.511 0.262 276.966)' }}>
              + 과목 추가 ({hiddenSubjects.length}개 과목 더 있음)
            </span>
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{showAddPicker ? '접기' : '펼치기'}</span>
          </button>
          {showAddPicker && (
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
              {hiddenSubjects.map(s => (
                <button key={s.id} type="button"
                  onClick={() => setExpandedSubjectIds(prev => new Set(prev).add(s.id))}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.4 0.015 250)' }}>
                  + {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
        style={{ background: 'oklch(0.511 0.262 276.966)', color: 'white' }}>
        <Save size={15} /> 내신성적 확정 저장 (TEACHER_CONFIRMED)
      </button>
    </div>
  );
}

// ─── 모의고사 입력 탭 (공통) ────────────────────────────────────────
function MockExamTab({
  teacherId, assignedStudentIds, isSuneung
}: { teacherId: string; assignedStudentIds: string[]; isSuneung: boolean }) {
  const { students } = useStudents();
  const [selectedId, setSelectedId] = useState(assignedStudentIds[0] ?? '');
  const [record, setRecord] = useState<TeacherMockExamInput>(() =>
    createEmptyMockExamInput(selectedId, teacherId)
  );

  const U = (field: keyof TeacherMockExamInput, val: any) => setRecord(p => ({ ...p, [field]: val }));
  const US = <K extends keyof TeacherMockExamInput>(subject: K, field: string, val: any) =>
    setRecord(p => ({ ...p, [subject]: { ...(p[subject] as any), [field]: val === '' ? undefined : val } }));

  const MONTHS = isSuneung ? [1,4,5,6,7,8,9,10,11] : [3,4,6,7,9,10,11];

  function handleSave() {
    if (!selectedId) { toast.error('학생을 선택하세요'); return; }
    const saved = { ...record, studentId: selectedId, examType: isSuneung ? '수능실전' : record.examType };
    saveMockExamInput(saved);
    toast.success(`${students.find(s => s.id === selectedId)?.name} 모의고사 성적이 저장되었습니다.`);
  }

  const n = (v: string) => v === '' ? undefined : Number(v);

  const SubjectRow = ({
    label, fields
  }: {
    label: string;
    fields: React.ReactNode;
  }) => (
    <div className="border-b" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
      <div className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'oklch(0.35 0.1 250)', background: 'oklch(0.97 0.004 250)' }}>
        {label}
      </div>
      <div className="px-3 py-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {fields}
      </div>
    </div>
  );

  const ScoreField = ({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string }) => (
    <div>
      <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
      <input type="number" style={inputStyle} placeholder={placeholder ?? '-'} value={value ?? ''}
        onChange={e => onChange(n(e.target.value))} />
    </div>
  );

  const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
    <div>
      <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
      <select style={selectStyle} value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">-</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  const GradeSelect = ({ label, value, onChange }: { label: string; value?: number; onChange: (v?: number) => void }) => (
    <div>
      <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
      <select style={selectStyle} value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}>
        <option value="">-</option>
        {[1,2,3,4,5,6,7,8,9].map(g => <option key={g}>{g}등급</option>)}
      </select>
    </div>
  );

  const socialSubjects = ['생활과 윤리','윤리와 사상','한국지리','세계지리','동아시아사','세계사','경제','정치와 법','사회문화'];
  const scienceSubjects = ['물리학Ⅰ','화학Ⅰ','생명과학Ⅰ','지구과학Ⅰ','물리학Ⅱ','화학Ⅱ','생명과학Ⅱ','지구과학Ⅱ'];
  const getExploreSubjects = (track?: string) => track === '사회탐구' ? socialSubjects : track === '과학탐구' ? scienceSubjects : [];

  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <div className="axis-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="학생 *" value={selectedId}
            options={assignedStudentIds.map(id => students.find(s => s.id === id)?.name ?? id)}
            onChange={v => {
              const id = assignedStudentIds.find(id => (students.find(s => s.id === id)?.name ?? id) === v) ?? v;
              setSelectedId(id);
              setRecord(createEmptyMockExamInput(id, teacherId));
            }} />
          <SelectField label="학년" value={record.gradeLevel} options={['고1','고2','고3']} onChange={v => U('gradeLevel', v)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>시행연도</div>
            <input type="number" style={inputStyle} value={record.examYear} onChange={e => U('examYear', e.target.value)} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>시행월</div>
            <select style={selectStyle} value={record.examMonth} onChange={e => U('examMonth', Number(e.target.value))}>
              {MONTHS.map(m => <option key={m}>{m}월</option>)}
            </select>
          </div>
          {!isSuneung && (
            <SelectField label="시험 종류" value={record.examType}
              options={['전국연합','교육청','평가원','학원실전']}
              onChange={v => U('examType', v)} />
          )}
          {isSuneung && (
            <SelectField label="시험 종류" value="수능실전모의고사" options={['수능실전모의고사']} onChange={() => {}} />
          )}
        </div>
        <SelectField label="계열" value={record.track} options={['인문','자연','통합']} onChange={v => U('track', v)} />
      </div>

      {/* 과목별 성적 입력표 */}
      <div className="axis-card overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.3 0.02 250)' }}>
          {isSuneung ? '수능실전모의고사 성적표 입력' : '전국연합모의고사 성적표 입력'}
        </div>

        {/* 국어 */}
        <SubjectRow label="국어" fields={<>
          <SelectField label="선택과목" value={record.korean.optSubject ?? ''} options={['화법과작문','언어와매체']} onChange={v => US('korean','optSubject',v)} />
          <ScoreField label="원점수" value={record.korean.rawScore} onChange={v => US('korean','rawScore',v)} />
          <ScoreField label="표준점수" value={record.korean.standardScore} onChange={v => US('korean','standardScore',v)} />
          <ScoreField label="백분위" value={record.korean.percentile} onChange={v => US('korean','percentile',v)} />
          <GradeSelect label="등급" value={record.korean.grade} onChange={v => US('korean','grade',v)} />
        </>} />

        {/* 수학 */}
        <SubjectRow label="수학" fields={<>
          <SelectField label="선택과목" value={record.math.optSubject ?? ''} options={['확률과통계','미적분','기하']} onChange={v => US('math','optSubject',v)} />
          <ScoreField label="원점수" value={record.math.rawScore} onChange={v => US('math','rawScore',v)} />
          <ScoreField label="표준점수" value={record.math.standardScore} onChange={v => US('math','standardScore',v)} />
          <ScoreField label="백분위" value={record.math.percentile} onChange={v => US('math','percentile',v)} />
          <GradeSelect label="등급" value={record.math.grade} onChange={v => US('math','grade',v)} />
        </>} />

        {/* 영어 */}
        <SubjectRow label="영어" fields={<>
          <ScoreField label="원점수" value={record.english.rawScore} onChange={v => US('english','rawScore',v)} />
          <GradeSelect label="등급" value={record.english.grade} onChange={v => US('english','grade',v)} />
        </>} />

        {/* 한국사 */}
        <SubjectRow label="한국사" fields={<>
          <ScoreField label="원점수" value={record.history.rawScore} onChange={v => US('history','rawScore',v)} />
          <GradeSelect label="등급" value={record.history.grade} onChange={v => US('history','grade',v)} />
        </>} />

        {/* 탐구1 */}
        <SubjectRow label="탐구1" fields={<>
          <SelectField label="영역" value={record.explore1.track ?? ''} options={['사회탐구','과학탐구','직업탐구']} onChange={v => US('explore1','track',v)} />
          <SelectField label="과목명" value={record.explore1.subjectName ?? ''} options={getExploreSubjects(record.explore1.track)} onChange={v => US('explore1','subjectName',v)} />
          <ScoreField label="원점수" value={record.explore1.rawScore} onChange={v => US('explore1','rawScore',v)} />
          <ScoreField label="표준점수" value={record.explore1.standardScore} onChange={v => US('explore1','standardScore',v)} />
          <ScoreField label="백분위" value={record.explore1.percentile} onChange={v => US('explore1','percentile',v)} />
          <GradeSelect label="등급" value={record.explore1.grade} onChange={v => US('explore1','grade',v)} />
        </>} />

        {/* 탐구2 */}
        <SubjectRow label="탐구2" fields={<>
          <SelectField label="영역" value={record.explore2.track ?? ''} options={['사회탐구','과학탐구','직업탐구']} onChange={v => US('explore2','track',v)} />
          <SelectField label="과목명" value={record.explore2.subjectName ?? ''} options={getExploreSubjects(record.explore2.track)} onChange={v => US('explore2','subjectName',v)} />
          <ScoreField label="원점수" value={record.explore2.rawScore} onChange={v => US('explore2','rawScore',v)} />
          <ScoreField label="표준점수" value={record.explore2.standardScore} onChange={v => US('explore2','standardScore',v)} />
          <ScoreField label="백분위" value={record.explore2.percentile} onChange={v => US('explore2','percentile',v)} />
          <GradeSelect label="등급" value={record.explore2.grade} onChange={v => US('explore2','grade',v)} />
        </>} />

        {/* 제2외국어/한문 */}
        <SubjectRow label="제2외국어/한문" fields={<>
          <SelectField label="과목명" value={record.secondLang.subjectName ?? ''} options={SECOND_LANGUAGE_SUBJECTS} onChange={v => US('secondLang','subjectName',v)} />
          <ScoreField label="원점수" value={record.secondLang.rawScore} onChange={v => US('secondLang','rawScore',v)} />
          <GradeSelect label="등급" value={record.secondLang.grade} onChange={v => US('secondLang','grade',v)} />
        </>} />

        {/* 전체 통계 */}
        <div className="px-3 py-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ScoreField label="전체 응시인원" value={record.totalParticipants} onChange={v => U('totalParticipants',v)} placeholder="예: 467304" />
          <ScoreField label="내 등수" value={record.myOverallRank} onChange={v => U('myOverallRank',v)} placeholder="예: 35000" />
          <ScoreField label="반 평균" value={record.classAverage} onChange={v => U('classAverage',v)} placeholder="예: 68.2" />
          <ScoreField label="반 최고점" value={record.classHighest} onChange={v => U('classHighest',v)} placeholder="예: 99" />
        </div>

        {/* 메모 */}
        <div className="px-3 pb-3">
          <div className="text-xs mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>메모</div>
          <textarea style={{ ...inputStyle, resize: 'none', height: 48, textAlign: 'left' }}
            value={record.memo ?? ''} onChange={e => U('memo', e.target.value)} placeholder="메모" />
        </div>
      </div>

      <button type="button" onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
        style={{ background: 'oklch(0.511 0.262 276.966)', color: 'white' }}>
        <Save size={15} /> {isSuneung ? '수능실전' : '전국연합'} 성적 확정 저장
      </button>
    </div>
  );
}

// ─── 데이터 현황 탭 ──────────────────────────────────────────────────
function DataStatusTab({ assignedStudentIds }: { assignedStudentIds: string[] }) {
  const { students } = useStudents();

  return (
    <div className="space-y-3">
      {assignedStudentIds.map(studentId => {
        const student = students.find(s => s.id === studentId);
        const gradeLevel = detectStudentGradeLevel(student);
        const universityLabel = getUniversityMenuLabel(gradeLevel);
        const schoolRecords = getSchoolRecordsForStudentAll(studentId);
        const nationalMocks = getNationalMockRecordsForStudent(studentId);
        const suneungMocks = getSuneungRecordsForStudent(studentId);
        const payload = buildUniversityRecommendationPayloadForStudent(studentId, gradeLevel);
        const readiness = getReadinessLabel(payload);
        const fitScore = getRecommendationFitScore(payload);

        return (
          <div key={studentId} className="axis-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{student?.name ?? studentId}</span>
                {gradeLevel && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>{gradeLevel}</span>}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: readiness.color + '18', color: readiness.color }}>
                  {readiness.label}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>{universityLabel}</span>
            </div>
            {payload.dataCompleteness.readyForAnalysis && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>추천 적합도</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: fitScore.color + '18', color: fitScore.color }}>
                  {fitScore.score}점 · {fitScore.label}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '내신성적', count: schoolRecords.length, color: schoolRecords.length > 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.6 0.015 250)' },
                { label: '전국연합', count: nationalMocks.length, color: nationalMocks.length > 0 ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.6 0.015 250)' },
                { label: '수능실전', count: suneungMocks.length, color: suneungMocks.length > 0 ? 'oklch(0.55 0.2 27)' : 'oklch(0.6 0.015 250)' },
              ].map(({ label, count, color }) => (
                <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
                  <div className="font-black text-base tabular-nums" style={{ color }}>{count}건</div>
                  <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
                </div>
              ))}
            </div>
            {payload.dataCompleteness.weightedInternalGradeAvg !== undefined && (
              <div className="mt-2 text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>
                가중 내신 평균등급: {payload.dataCompleteness.weightedInternalGradeAvg.toFixed(2)}
                {payload.dataCompleteness.latestMathGrade && ` · 최신 수학: ${payload.dataCompleteness.latestMathGrade}등급`}
              </div>
            )}
            <div className="text-xs mt-1" style={{ color: readiness.color }}>{readiness.description}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Payload 미리보기 탭 ────────────────────────────────────────────
function PayloadTab({ assignedStudentIds }: { assignedStudentIds: string[] }) {
  const { students } = useStudents();
  const [selectedId, setSelectedId] = useState(assignedStudentIds[0] ?? '');
  const student = students.find(s => s.id === selectedId);
  const gradeLevel = detectStudentGradeLevel(student);
  const payload = buildUniversityRecommendationPayloadForStudent(selectedId, gradeLevel);
  const fitScore = getRecommendationFitScore(payload);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {assignedStudentIds.map(id => {
          const s = students.find(st => st.id === id);
          return (
            <button key={id} type="button" onClick={() => setSelectedId(id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{ background: selectedId === id ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.95 0.004 250)', color: selectedId === id ? 'white' : 'oklch(0.5 0.015 250)' }}>
              {s?.name ?? id}
            </button>
          );
        })}
      </div>

      <div className="axis-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>Payload 미리보기</span>
          <span className="text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>
            Engine: {ENGINE_CONNECTED ? '✅ 연결' : '⚠️ 미연결 (Phase 4+)'}
          </span>
        </div>
        <pre className="rounded-lg p-3 text-xs overflow-x-auto overflow-y-auto"
          style={{ background: 'oklch(0.97 0.003 250)', color: 'oklch(0.3 0.02 250)', maxHeight: 360, fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify({
            studentId: payload.studentId,
            gradeLevel: payload.gradeLevel,
            track: payload.track,
            payloadVersion: payload.payloadVersion,
            adapterVersion: payload.adapterVersion,
            engineConnected: payload.engineConnected,
            dataCompleteness: payload.dataCompleteness,
            fitScore: { score: fitScore.score, label: fitScore.label },
            internalGradeCount: payload.internalGrades.length,
            mockExamCount: payload.mockExamRecords.length,
            suneungMockCount: payload.suneungMockRecords.length,
            mathImprovementScenarios: payload.mathImprovementScenarios,
            builtAt: payload.builtAt,
          }, null, 2)}
        </pre>
        <div className="mt-2 text-xs" style={{ color: 'oklch(0.65 0.015 250)' }}>
          ※ 실제 대학추천 엔진 연결은 Phase 4+에서 구현됩니다. 이 payload는 AnalyzeRequest 구조와 연결 가능한 형식입니다.
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────
export default function TeacherUniversityData() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('school-record');
  const assignedStudentIds = currentUser.assignedStudentIds ?? [];

  return (
    <TeacherLayout title="대학추천 데이터">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <div className="axis-card px-4 py-3 text-xs" style={{ borderLeft: '3px solid #7C3AED', color: 'oklch(0.5 0.015 250)' }}>
          선생님이 학생 내신·모의고사 성적을 입력합니다. 입력된 성적은 확정 성적으로 학생 대학추천 화면에 표시됩니다.
        </div>

        {/* 탭 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className="px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{
                background: activeTab === tab.id ? 'oklch(0.511 0.262 276.966)' : 'oklch(0.95 0.004 250)',
                color: activeTab === tab.id ? 'white' : 'oklch(0.5 0.015 250)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'school-record'  && <SchoolRecordTab teacherId={currentUser.id} assignedStudentIds={assignedStudentIds} />}
        {activeTab === 'national-mock'  && <MockExamTab teacherId={currentUser.id} assignedStudentIds={assignedStudentIds} isSuneung={false} />}
        {activeTab === 'suneung-mock'   && <MockExamTab teacherId={currentUser.id} assignedStudentIds={assignedStudentIds} isSuneung={true} />}
        {activeTab === 'data-status'    && <DataStatusTab assignedStudentIds={assignedStudentIds} />}
        {activeTab === 'payload'        && <PayloadTab assignedStudentIds={assignedStudentIds} />}
      </div>
    </TeacherLayout>
  );
}
