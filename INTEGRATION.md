# AXIS LMS v1.2 - University Analysis Adapter Input Bridge v1

## ChatGPT QA 판정

이번 zip은 `axis-university-analysis-engine-phase5.1`을 직접 통합하지 않고, LMS 내부 데이터를 `UniversityAnalysisInput` 형태로 변환하기 위한 입력 브릿지 함수만 추가하는 단계다.

코드 변경은 `src/lib/universityAnalysisAdapter.ts` 1개 파일에 한정된다. UI, 라우트, Provider, 학생/학부모/강사 화면은 변경하지 않는다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | LMS 데이터 변환 helper 3종과 null-safe 조립 함수 추가 |

## 추가된 helper

| 함수 | 역할 |
|------|------|
| `adaptReadinessFromLms(...)` | `UniversityRecommendationReadiness`를 어댑터 준비 상태 스냅샷으로 변환 |
| `adaptInternalGradesFromLms(...)` | `Student.internalScores`를 내신 성적 스냅샷으로 변환 |
| `adaptMockSummaryFromLms(...)` | `MockAccumulationSummary`를 모의고사 요약 스냅샷으로 변환 |
| `safeAssembleUniversityAnalysisInput(...)` | null/undefined 입력을 안전하게 기본값으로 대체해 `UniversityAnalysisInput` 조립 |

## Import 범위

Input Bridge v1에서는 bridge 함수의 타입 연결을 위해 LMS 내부 type import만 허용한다.

허용된 import:

- `import type { InternalScore } from '@/lib/dummyData'`
- `import type { UniversityRecommendationReadiness, MockAccumulationSummary } from '@/lib/assessmentData'`

금지 유지:

- `axis-university-analysis-engine-phase5.1` 직접 import
- phase5.1 코드 복사
- 실제 대학추천 계산
- 대학명, 학과명, 합격 가능성, 추천 순위 산출
- PDF Export
- AI 분석 버튼

## QA 확인

| 항목 | 판정 |
|------|------|
| 원본 zip 래퍼 폴더 없음 | 정상 |
| 외부 엔진 import 없음 | 정상 |
| UI 변경 없음 | 정상 |
| 라우트 변경 없음 | 정상 |
| Provider 변경 없음 | 정상 |
| 기존 화면 파일 변경 없음 | 정상 |
| `TeacherExamGrading.tsx` 변경 없음 | 정상 |
| `UniversityRecommendationReadiness` 필드 참조 일치 | 정상 |
| `MockAccumulationSummary` 필드 참조 일치 | 정상 |
| 대학명/학과명/합격 가능성/추천 순위 타입 미포함 | 정상 |

## 빌드 확인

로컬 검사 폴더에 현재 baseline을 순서대로 적용한 뒤 `npm run build`를 실행했으나, 이 환경에는 프로젝트 의존성이 설치되어 있지 않아 `tsc: not found`로 중단되었다.

`npm install`도 레지스트리 정책으로 `@tailwindcss/vite` 다운로드가 403 차단되어 로컬 빌드 완료까지는 확인하지 못했다.

대신 실제 타입명과 필드 대조는 완료했다. GitHub Actions 통과 기준으로 최종 main 반영을 승인한다.

## 업로드 판단

GitHub 업로드 권장.

업로드 파일:

`axis-lms-v1_2-university-analysis-adapter-input-bridge-v1-github-upload.zip`

커밋명:

`대학분석 입력 브릿지 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

32. University Analysis Adapter Input Bridge v1

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 목표대학 분석 본체 구현 없음
- 대학명/학과명 추천 없음
- 합격 가능성 계산 없음
- 추천 순위 산출 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행/NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam -> if (!scopedExam) return -> const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
