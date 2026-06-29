# AXIS LMS v1.2 - University Analysis Adapter Preview Bridge v1 buildfix

## ChatGPT QA 판정

이번 zip은 `axis-university-analysis-engine-phase5.1`을 직접 통합하지 않고, 기존 `StudentDetail.tsx`의 상담 리포트 미리보기 영역 안에서 `universityAnalysisAdapter.ts` helper를 호출해 분석 입력 구성 상태만 표시하는 단계다.

원본 코드 방향은 안전했으나, `adapterMockSummaries`의 빈 배열 추론이 GitHub Actions에서 `never[]` 타입 위험을 만들 수 있어 buildfix 업로드본을 따로 만든다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/StudentDetail.tsx` | 분석 입력 구성 상태 섹션 추가, `adapterMockSummaries` 배열 타입 명시 |

## buildfix 내용

원본:

```ts
const list = [];
```

수정:

```ts
const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];
```

이 수정은 런타임 동작을 바꾸지 않고 TypeScript 배열 추론 위험만 줄인다.

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
| `universityAnalysisAdapter.ts` 변경 없음 | 정상 |

## 빌드 확인

로컬 검사 폴더에는 프로젝트 의존성이 설치되어 있지 않아 `npm run build`가 `tsc: not found`로 중단된다.

`npm install`도 레지스트리 정책으로 `@tailwindcss/vite` 다운로드가 403 차단되어 로컬 빌드 완료까지는 확인하지 못했다.

대신 변경 파일의 참조 변수, import, 타입 필드, `TeacherExamGrading.tsx` 고정 패턴은 정적으로 확인했다. 최종 main 반영은 GitHub Actions 통과 기준으로 승인한다.

## 업로드 판단

원본 zip 대신 buildfix zip 업로드 권장.

업로드 파일:

`axis-lms-v1_2-university-analysis-adapter-preview-bridge-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 미리보기 브릿지 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

33. University Analysis Adapter Preview Bridge v1 buildfix

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
