# AXIS LMS v1.2 — University Analysis Phase51 Recommendation List UI and Fetch Timeout v1

## 문서 개요

두 작업을 한 묶음으로 진행했다.

1. **Recommendation List UI**: success 응답에서 `recommendationBand.items`를 밴드별로 표시
2. **Fetch Timeout**: `callPhase51AnalyzeApi`에 AbortController 기반 30초 타임아웃 추가

- Phase 5.1 엔진 본체 import 없음
- LMS 내부 합격 가능성 / 추천 순위 계산 없음
- 엔진 응답 표시만 함

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/universityAnalysisClient.ts` | `PHASE51_REQUEST_TIMEOUT_MS = 30_000` 상수 추가, `callPhase51AnalyzeApi`에 AbortController timeout 적용 |
| `src/pages/StudentDetail.tsx` | success 블록에 `recommendationBand.items` 밴드별 목록 추가 |

---

## 작업 1: Recommendation List UI

### 변경 위치

`StudentDetail.tsx` success 블록 — `recommendationBand.summary` 카드 이후에 추가.

### 표시 구조

```
추천 대학/학과
├── 소신 (band === 'reach')
│   · [univName] — [deptName] ([admissionType]?)
├── 적정 (band === 'target')
│   · ...
└── 안정 (band === 'safety')
    · ...
```

- 항목 없는 밴드는 렌더링하지 않음 (`items.length === 0 → return null`)
- `admissionType`은 있을 때만 괄호로 표시
- 합격 가능성, 추천 순위, 합격률 수치 없음
- LMS에서 정렬/계산 없음 — 엔진 응답 band 값 기준으로만 그룹화

### 기존 6개 항목 유지

reportSummary / counselingComment / dataConfidence / targetGap 건수 / subjectWeakness 개수 / recommendationBand.summary 모두 유지.

---

## 작업 2: Fetch Timeout

### 상수

```typescript
const PHASE51_REQUEST_TIMEOUT_MS = 30_000;
```

### 구현 구조

```
AbortController 생성
setTimeout(controller.abort, 30_000)
  try:
    fetch(..., { signal: controller.signal })
    !res.ok → throw 'Phase 5.1 API error: ${status}'
    return res.json()
  catch(AbortError):
    throw 'Phase 5.1 API request timed out.'
  finally:
    clearTimeout(timeoutId)
```

### 에러 메시지 3종 유지

| 케이스 | 메시지 |
|---|---|
| env 미설정 | `VITE_PHASE51_API_URL is not set.` |
| 타임아웃 (30초) | `Phase 5.1 API request timed out.` |
| !res.ok | `Phase 5.1 API error: ${res.status}` |

---

## 유지 확인

| 항목 | 상태 |
|---|---|
| `universityAnalysisAdapter.ts` | 변경 없음 (md5: `1eddaef5cf427e00666be685ea16f32f`) ✅ |
| `TeacherExamGrading.tsx` scopedExam | md5 동일 ✅ |
| `App.tsx` | md5 동일 ✅ |
| `adapterMockSummaries` ReturnType 타입픽스 | 950줄 유지 ✅ |
| handleRequestAnalysis 가드 | `pending \|\| !ready` 단일 OR 유지 ✅ |
| stale reset useEffect | `[draftBundle.draft]` 유지 ✅ |
| `grid-cols-1 sm:grid-cols-3` | 1608줄 유지 ✅ |
| `Phase51ImportMetaEnv` 캐스팅 | 유지 ✅ |
| Phase51AnalyzeResponse 타입 | 변경 없음 ✅ |
| 신규 route / Provider | 없음 ✅ |

## 검증 메모

- `npm install`은 현재 환경 레지스트리 403으로 실패. 정적 검증 수행.
- `(['reach', 'target', 'safety'] as const).map(...)` — TypeScript에서 `as const` 배열 `.map()` 정상 패턴.
- `{ reach: '소신', target: '적정', safety: '안정' }[band]` — `band`가 const tuple 요소 타입이므로 타입 안전.
- `key={item.univId-item.deptName-idx}` — 표시 전용 목록, 재정렬 없으므로 index 포함 key 허용.
- `AbortController` / `AbortSignal` — `"lib": ["ES2020", "DOM", "DOM.Iterable"]` tsconfig에 포함됨. 타입 오류 없음.
- `e instanceof Error && e.name === 'AbortError'` — `DOMException`은 `Error` 서브클래스이므로 instanceof 체크 정상.
- `clearTimeout(timeoutId)` — `finally` 블록에서 정상/에러 양쪽 케이스 모두 타임아웃 해제.

## 산출물

`axis-lms-v1_2-university-analysis-phase51-recommendation-list-ui-fetch-timeout-v1.zip`

---

## ChatGPT buildfix 적용 메모

원본 산출물 검토 중 아래 2개 보완점이 확인되어 buildfix를 적용했다.

1. `recommendationBand.items`가 비어 있을 때 추천 목록 카드가 렌더링되지 않아 empty state가 보이지 않았다.
   - `표시할 추천 목록이 없습니다.` 문구를 표시하도록 수정했다.
   - `items ?? []` 형태로 방어해 응답 필드 누락 시에도 UI 런타임 오류 가능성을 낮췄다.

2. 30초 timeout 오류가 사용자 화면에 영어 원문으로 노출될 수 있었다.
   - `StudentDetail.tsx`에서 timeout 메시지를 한국어 안내 문구로 변환했다.
   - `universityAnalysisClient.ts`의 AbortError 판별을 `instanceof Error`에만 의존하지 않도록 보강했다.

buildfix 후에도 아래 원칙은 유지된다.

- Phase 5.1 엔진 본체 import 없음
- LMS 내부 합격 가능성 / 추천 순위 / 합격률 계산 없음
- 추천 목록 항목에는 `univName`, `deptName`, `admissionType`만 표시
- `Phase51ImportMetaEnv` 안전 캐스팅 유지
- `handleRequestAnalysis` pending/ready 가드 유지
- stale response reset 유지
