# AXIS LMS v1.2 — University Analysis Phase51 Client Boundary Stub v1 buildfix

## 문서 개요

`src/lib/universityAnalysisClient.ts`를 신규 생성해 LMS와 Phase 5.1 분석 엔진 사이의 client boundary를 정의하는 단계다.

- 실제 네트워크 호출 없음
- Phase 5.1 엔진 본체 import 없음
- `StudentDetail.tsx` 변경 없음
- 분석 시작 / AI 분석 / 추천 실행 버튼 없음
- PDF Export 없음
- 합격 가능성 / 추천 순위 산출 없음

## buildfix 사유

원본 `axis-lms-v1_2-university-analysis-phase51-client-boundary-stub-v1.zip`은 `universityAnalysisClient.ts`가 `src/lib/universityAnalysisClient.ts` 경로가 아니라 zip 루트에 들어 있었다.

또한 `INTEGRATION.md`에 이전 milestone 문서가 누적되어 있어 이번 단계만 남기도록 정리했다.

원본 client 파일 주석 안에는 실제 네트워크 호출 예시 코드가 있어, 향후 `fetch` 금지 정적 검사에서 오탐이 생길 수 있었다. buildfix에서는 실제 호출 예시 코드를 설명 문장으로 바꿨다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/universityAnalysisClient.ts` | Phase 5.1 client boundary stub 신규 생성 |

## 신규 타입/함수

| 항목 | 내용 |
|------|------|
| `Phase51ApiStatus` | `'idle' / 'pending' / 'success' / 'error'` |
| `Phase51AnalyzeResponse` | placeholder: `reportId`, `generatedAt` |
| `callPhase51AnalyzeApi` | 항상 `throw new Error('Phase 5.1 API not yet connected. Stub only.')` |

## 유지 확인

| 항목 | 상태 |
|------|------|
| `src/lib/universityAnalysisAdapter.ts` | 변경 없음 |
| `src/pages/StudentDetail.tsx` | 변경 없음 |
| `TeacherExamGrading.tsx` scopedExam 타입픽스 | 변경 없음 |
| `adapterMockSummaries` ReturnType 타입픽스 | 변경 없음 |
| gradeLevel / track / targetUniversities / improvementScenario 연결 | 변경 없음 |
| 신규 route / Provider | 없음 |
| 실제 실행 버튼 | 없음 |

## 금지 준수

| 항목 | 상태 |
|------|------|
| Phase 5.1 엔진 직접 import | 없음 |
| 실제 네트워크 호출 | 없음 |
| AI 분석 버튼 | 없음 |
| PDF Export | 없음 |
| 대학 추천 결과 생성 | 없음 |
| 합격 가능성 / 추천 순위 산출 | 없음 |

## 검증 메모

- 현재 환경에서 `npm install`은 registry 403으로 실패해 로컬 `npm run build` 재현은 불가했다.
- 정적 확인 기준으로 root 경로 위험과 문서 누적 위험을 제거했다.
- `import type { Phase51AnalyzeRequestDraft }`는 type-only import라 런타임 비용이 없다.
- `callPhase51AnalyzeApi`는 Stub v1 단계에서 항상 명시적 에러를 던진다.

## 산출물

`axis-lms-v1_2-university-analysis-phase51-client-boundary-stub-v1-buildfix-github-upload.zip`
