# AXIS LMS v1.2 - University Analysis Adapter Handoff Gate Bridge v1 buildfix

## ChatGPT QA 판정

이번 zip은 `UniversityAnalysisPayloadPreview`를 기준으로 실제 엔진 호출 전 연동 준비 조건 충족 여부만 판단하는 gate helper를 추가하는 단계다.

원본 코드 방향은 AXIS LMS v1.2 기준에 맞고, 직전 buildfix의 `adapterMockSummaries` 배열 타입 명시도 유지되어 있다. 다만 원본 `INTEGRATION.md`가 이전 단계 문서를 모두 누적하고 있고, 일부 주석/화면 문구가 실제 Phase 5.1 통합 전 단계치고 강하게 보일 수 있어 buildfix 업로드본을 따로 만든다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisAdapter.ts` | Handoff gate 타입 2종과 helper 1종 추가, 주석 문구 완화 |
| `src/pages/StudentDetail.tsx` | handoff gate 상태 한 줄 표시, 화면 문구 완화 |

## 추가된 adapter helper

| 항목 | 역할 |
|------|------|
| `UniversityAnalysisHandoffGateStatus` | `'blocked' | 'needs-data' | 'ready'` 상태 타입 |
| `UniversityAnalysisHandoffGate` | 연동 준비 조건 판단 결과 타입 |
| `getUniversityAnalysisHandoffGate(preview)` | payload preview 기준으로 status, canPrepareHandoff, reasons, missingFields, snapshotAt 반환 |

## buildfix 내용

직전 타입픽스 유지 확인:

```ts
const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];
```

주석 완화:

```text
엔진 전달 여부 결정 -> 입력 구성 상태 표시
연동 준비를 시작할 수 있는 상태 -> 연동 준비 조건을 충족한 상태
```

UI 문구 완화:

```text
연동 준비 완료 -> 준비 조건 충족
```

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
| `StudentDetail.tsx` 배열 타입 명시 유지 | 정상 |
| `universityAnalysisAdapter.ts` 기존 타입 구조 유지 | 정상 |

## 빌드 확인

로컬 검사 폴더에는 프로젝트 의존성이 설치되어 있지 않아 `npm run build`가 `tsc: not found`로 중단된다.

이전과 동일하게 `npm install`도 레지스트리 정책으로 `@tailwindcss/vite` 다운로드가 403 차단되는 환경이라 로컬 빌드 완료까지는 확인하지 못했다.

대신 변경 파일의 import, 참조 변수, 타입 필드, `TeacherExamGrading.tsx` 고정 패턴, `StudentDetail.tsx` 배열 타입 명시는 정적으로 확인했다. 최종 main 반영은 GitHub Actions 통과 기준으로 승인한다.

## 업로드 판단

원본 zip 대신 buildfix zip 업로드 권장.

업로드 파일:

`axis-lms-v1_2-university-analysis-adapter-handoff-gate-bridge-v1-buildfix-github-upload.zip`

커밋명:

`대학분석 연동게이트 브릿지 반영`

## baseline 반영 조건

GitHub Actions가 정상 통과하면 baseline에 다음 항목을 추가한다.

36. University Analysis Adapter Handoff Gate Bridge v1 buildfix

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
