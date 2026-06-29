# AXIS LMS v1.2 — University Analysis Phase51 API Fetch Connection v1 buildfix

## 문서 개요

`src/lib/universityAnalysisClient.ts`의 `callPhase51AnalyzeApi`를 stub에서
실제 fetch 기반 구현으로 교체하는 단계다.

- 타입 계약(`Phase51AnalyzeResponse` 등) 변경 없음
- `StudentDetail.tsx` 변경 없음
- Phase 5.1 엔진 본체 import 없음
- LMS 화면에서 아직 호출하지 않음 (Stage 4에서 UI 연결 예정)

## buildfix 요약

원본 v1은 구현 방향은 맞지만, 현재 AXIS LMS v1.2 프로젝트에 `vite-env.d.ts`
또는 `/// <reference types="vite/client" />` 선언이 없어
`import.meta.env.VITE_PHASE51_API_URL` 직접 접근이 GitHub Actions 타입체크에서
막힐 위험이 있었다.

buildfix에서는 실제 fetch 연결 로직은 유지하고, `import.meta.env` 접근만
`Phase51ImportMetaEnv` 로컬 타입 캐스팅을 통해 안전하게 감쌌다.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/universityAnalysisClient.ts` | `callPhase51AnalyzeApi` stub → 실제 fetch 구현으로 교체. `import.meta.env` 타입 접근 안전화. |

## 구현 사양 대조

| 항목 | 지시 | 구현 |
|---|---|---|
| API base URL | `import.meta.env.VITE_PHASE51_API_URL` | ✅ `const baseUrl = (import.meta as Phase51ImportMetaEnv).env?.VITE_PHASE51_API_URL` |
| env 미설정 시 | 명확한 에러 throw | ✅ `throw new Error('VITE_PHASE51_API_URL is not set.')` |
| 요청 경로 | `${baseUrl}/analyze` | ✅ `` fetch(`${baseUrl}/analyze`) `` |
| method | POST | ✅ `method: 'POST'` |
| body | `JSON.stringify(draft)` | ✅ `body: JSON.stringify(draft)` |
| Content-Type | `application/json` | ✅ `headers: { 'Content-Type': 'application/json' }` |
| !res.ok 처리 | `Phase 5.1 API error: ${res.status}` | ✅ `throw new Error(\`Phase 5.1 API error: ${res.status}\`)` |
| 성공 반환 | `Phase51AnalyzeResponse` | ✅ `res.json() as Promise<Phase51AnalyzeResponse>` |
| 파라미터 | draft (사용) | ✅ `_draft` → `draft` |

## 유지 확인

| 항목 | 상태 |
|---|---|
| `src/lib/universityAnalysisAdapter.ts` | 변경 없음 (md5: `1eddaef5cf427e00666be685ea16f32f`) ✅ |
| `src/pages/StudentDetail.tsx` | 변경 없음 ✅ |
| `TeacherExamGrading.tsx` scopedExam 패턴 | md5 동일 ✅ |
| `App.tsx` | md5 동일 ✅ |
| `adapterMockSummaries` list 타입 | `const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];` 유지 ✅ |
| `Phase51AnalyzeResponse` 및 서브타입 | 변경 없음 ✅ |
| 엔진 본체 import | 없음 ✅ |
| 분석 시작 / AI 분석 / 추천 실행 버튼 | 없음 ✅ |
| 신규 route / Provider | 없음 ✅ |

## 검증 메모

- `npm install`은 현재 환경에서 레지스트리 403으로 실패. 정적 검증 수행.
- `import.meta.env.VITE_PHASE51_API_URL`: Vite 프로젝트 런타임에서는 유효한 패턴이나,
  현재 repo에는 Vite env 타입 선언 파일이 없어 로컬 타입 캐스팅으로 보호.
- `"lib": ["ES2020", "DOM", "DOM.Iterable"]` 포함 tsconfig에서 `fetch` 전역 사용 가능.
- `res.json() as Promise<Phase51AnalyzeResponse>`: `res.json()` 반환 타입은 `Promise<any>`.
  `as` 캐스팅은 API 응답 신뢰 전제이며 TypeScript에서 오류 없음.
- `import.meta.env`의 `VITE_*` 키: 미선언 키는 Vite 환경에서 `string | undefined`로 접근 가능.
  `!baseUrl` 체크로 빈 문자열과 undefined 모두 처리.

## Stage 로드맵

| Stage | 내용 | 상태 |
|---|---|---|
| 0 | gradeLevel UI 추가 | 완료 |
| 1 | Client boundary stub | 완료 |
| 2 | AnalyzeResponse 타입 계약 | 완료 |
| **3 (이번)** | **실제 fetch 연결** | **완료** |
| 4 | 응답 UI 표시 | 대기 |

## 산출물

`axis-lms-v1_2-university-analysis-phase51-api-fetch-connection-v1-buildfix-github-upload.zip`
