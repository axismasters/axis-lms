# AXIS LMS v1.2 - University Analysis Adapter Payload Preview Bridge v1 buildfix

## ChatGPT QA 판정

이번 zip은 `UniversityAnalysisInput`과 입력 품질 결과를 바탕으로 실제 추천 계산 전 확인 가능한 payload preview helper를 추가하는 단계다.

원본 방향은 AXIS LMS v1.2 기준에 맞지만, `StudentDetail.tsx`에서 직전 buildfix의 배열 타입 명시가 다시 `const list = []`로 회귀했다. 또한 UI 문구 `엔진 전달 가능`은 실제 Phase 5.1 통합 전 단계치고 강하게 보일 수 있어 `페이로드 구성 완료`로 완화했다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | Payload preview 타입 1종과 helper 1종 추가 |
| `src/pages/StudentDetail.tsx` | payload preview 상태 한 줄 표시, 배열 타입 회귀 복구, 문구 완화 |

## 추가된 adapter helper

| 항목 | 역할 |
|------|------|
| `UniversityAnalysisPayloadPreview` | 추천 결과가 아닌 입력 payload 요약 타입 |
| `buildUniversityAnalysisPayloadPreview(input)` | 학생 식별 정보, adapterStatus, 데이터 존재 여부, missingFields, warnings, snapshotAt을 요약 |

## buildfix 내용

배열 타입 회귀 복구:

```ts
const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];
```

UI 문구 완화:

```text
엔진 전달 가능 -> 페이로드 구성 완료
```

adapter 주석도 실제 엔진 전달 결정이 아니라 입력 구성 상태 표시 용도로 정리했다.

## QA 확인

| 항목 | 판정 |
|------|------|
| 원본 zip 래퍼 폴더 없음 | 정상 |
| 실제 엔진 import 없음 | 정상 |
| phase5.1 코드 복사 없음 | 정상 |
| 신규 라우트 추가 없음 | 정상 |
| Provider/Layout 구조 변경 없음 | 정상 |
| 학부모 화면 변경 없음 | 정상 |
| PDF Export 추가 없음 | 정상 |
| AI 분석 버튼 추가 없음 | 정상 |
| 대학명/학과명/합격 가능성/추천 순위 산출 없음 | 정상 |
| `TeacherExamGrading.tsx` 변경 없음 | 정상 |
| `universityAnalysisAdapter.ts` 기존 타입 구조 유지 | 정상 |

## 빌드 확인

로컬 검사 폴더에는 프로젝트 의존성이 설치되어 있지 않아 `npm run build`가 `tsc: not found`로 중단된다.

이전과 동일하게 `npm install`도 레지스트리 정책으로 `@tailwindcss/vite` 다운로드가 403 차단되는 환경이라 로컬 빌드 완료까지는 확인하지 못했다.

대신 변경 파일의 import, 참조 변수, 타입 필드, `TeacherExamGrading.tsx` 고정 패턴은 정적으로 확인했다. 최종 main 반영은 GitHub Actions 통과 기준으로 승인한다.

## 업로드 판단

원본 zip 대신 buildfix zip 업로드 권장.

업로드 파일:

`axis-lms-v1_2-university-analysis-adapter-payload-preview-bridge-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 페이로드 미리보기 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

35. University Analysis Adapter Payload Preview Bridge v1 buildfix

## 보류 유지

- `axis-university-analysis-engine-phase5.1` 직접 통합 없음
- 실제 대학추천 계산 없음
- 대학명/학과명 추천 없음
- 합격 가능성 계산 없음
- 추천 순위 산출 없음
- PDF Export 없음
- AI 분석 없음
- 문제은행/NGD2 연동 없음
- Rival / Emblem / IF 분석 직접 구현 없음

## TeacherExamGrading 타입픽스 유지

`src/pages/teacher/TeacherExamGrading.tsx`의 `scopedExam -> if (!scopedExam) return -> const visibleExam = scopedExam` 패턴은 이번 작업에서 변경하지 않는다.
