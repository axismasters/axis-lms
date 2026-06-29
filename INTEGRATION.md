# AXIS LMS v1.2 — University Report Preview Foundation v1

## ChatGPT QA 판정

이번 zip은 대학추천 본체가 아니라, Back Office 학생 상세 안에 상담용 리포트 미리보기 섹션을 추가하는 Foundation 단계다.

실제 대학명 추천, 학과 추천, 합격 가능성 계산, 목표대학 분석, AI 분석, PDF Export는 구현하지 않는다.

## 현재 확정 baseline

- Teacher Workflow Persistence v1 buildfix
- Student Portal Foundation v1
- TeacherExamGrading scopedExam 타입픽스
- Parent Portal Foundation v1
- Admin Back Office QA Cleanup v1
- Teacher Content Engine v1
- Content Visibility Bridge v1
- Content Persistence v1 buildfix
- Content Detail UX v1
- Homework Foundation v1
- Homework Status / Completion v1
- Homework Detail UX v1
- Homework Home Bridge v1
- Parent Homework Bridge v1
- Homework QA Cleanup v1
- Attendance Home Bridge QA v1
- Assessment Home Bridge QA v1
- Portal Home Regression QA v1
- Student Parent Portal Scope QA v1
- Parent Finance View Foundation v1
- Parent Finance Home Bridge v1
- Student Finance View Foundation v1
- Student Finance Home Bridge v1
- Assessment Publish Stability Bridge v1 buildfix
- Mock Exam Result Foundation v1
- Senior Weekly Mock Routine Foundation v1
- Senior Mock Accumulation Bridge v1
- University Recommendation Readiness Foundation v1

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/StudentDetail.tsx` | Back Office 학생 상세의 성적조회 탭에 `상담 리포트 미리보기` 섹션 추가 |

## 구현 범위

기존 `대학추천 데이터 상태` Area 아래에 읽기 전용 상담 리포트 미리보기 섹션을 추가한다.

표시 항목:
- 학생명
- 현재 대학추천 데이터 준비 상태
- 내신 입력 여부
- 모의고사 입력 여부
- 수능실전모의 응시 회차 수
- 최근 실전모의 데이터 존재 여부
- 최근 3회 평균 산출 가능 여부
- 안내 문구: `실제 대학명·합격 가능성·추천 순위는 다음 단계에서 계산됩니다.`

## QA 확인

| 항목 | 상태 |
|------|------|
| Back Office `StudentDetail.tsx` 내부에만 표시 | 정상 |
| 기존 `대학추천 데이터 상태` Area 유지 | 정상 |
| 기존 helper만 사용 | 정상 |
| 학생/학부모 포털 노출 없음 | 정상 |
| 대학명/학과명/합격 가능성/추천 순위 미표시 | 정상 |
| PDF Export 버튼 없음 | 정상 |
| AI 분석 버튼 없음 | 정상 |
| `assessmentData.ts` 변경 없음 | 정상 |
| `AssessmentContext.tsx` 변경 없음 | 정상 |
| 라우트 변경 없음 | 정상 |
| `TeacherExamGrading.tsx` 미변경 | 정상 |

## 변경하지 않은 파일

- `src/lib/assessmentData.ts`
- `src/contexts/AssessmentContext.tsx`
- `src/pages/student/StudentHome.tsx`
- `src/pages/parent/ParentHome.tsx`
- `src/routes/StudentRoutes.tsx`
- `src/routes/ParentRoutes.tsx`
- `src/pages/teacher/TeacherExamGrading.tsx`
- 학생/학부모 포털 전체

## 보류 유지

- 대학추천 시스템 본체 구현 없음
- 목표대학 분석 구현 없음
- 합격 가능성 계산 없음
- 대학명/학과명 추천 없음
- PDF Export 추가 없음
- AI 분석 추가 없음
- 문제은행/NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam → if (!scopedExam) return → const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
