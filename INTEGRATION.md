# AXIS LMS v1.2 — University Analysis Phase51 Stale Response Reset v1

## 문서 개요

Response UI Safety QA v1에서 발견된 stale response 위험을 해소하는 단계다.

`draftBundle.draft` 변경 시 이전 Phase 5.1 응답 상태를 자동으로 초기화하는
`useEffect` 1개를 GradesTab 내부에 추가했다.

- `src/lib/universityAnalysisAdapter.ts` 변경 없음
- `src/lib/universityAnalysisClient.ts` 변경 없음
- 실제 API fetch 로직 변경 없음
- 새 버튼/CTA 없음

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/pages/StudentDetail.tsx` | `useEffect` react import 추가, stale reset `useEffect` 1개 추가 |

## 변경 상세

### ① react import

```typescript
// 변경 전
import { useMemo, useState } from 'react';

// 변경 후
import { useMemo, useState, useEffect } from 'react';
```

### ② useEffect 추가 (handleRequestAnalysis 직후)

```typescript
// Stale Response Reset v1 — draftBundle.draft 변경 시 이전 응답 초기화
useEffect(() => {
  setApiStatus('idle');
  setApiResponse(null);
  setApiError(null);
}, [draftBundle.draft]);
```

`draftBundle`은 `useMemo`로 파생된다. 입력 변경
(draftGradeLevel / draftTrack / draftTargetUniversities / draftScenario) →
useMemo 재계산 → 새 `draft` 객체 참조 → useEffect 트리거 흐름이 성립한다.

## 동작 흐름

```
사용자가 학년/계열/목표대학/시나리오 변경
  → draftContext / draftScenario useMemo 재계산
  → draftBundle useMemo 재계산 → 새 draft 객체
  → useEffect deps [draftBundle.draft] 변경 감지
  → setApiStatus('idle'), setApiResponse(null), setApiError(null)
  → 이전 success/error 응답 화면에서 사라짐
```

## 유지 확인

| 항목 | 상태 |
|---|---|
| `universityAnalysisAdapter.ts` | 변경 없음 (md5: `1eddaef5cf427e00666be685ea16f32f`) ✅ |
| `universityAnalysisClient.ts` | 변경 없음 ✅ |
| `TeacherExamGrading.tsx` scopedExam | md5 동일 ✅ |
| `adapterMockSummaries` ReturnType 타입픽스 | 라인 950 유지 ✅ |
| `handleRequestAnalysis` 가드 | `apiStatus === 'pending' \|\| draftBundle.validation.status !== 'ready'` 유지 ✅ |
| IF 개선 시나리오 grid | `grid-cols-1 sm:grid-cols-3` 유지 ✅ |
| `Phase51ImportMetaEnv` env 캐스팅 | 유지 ✅ |
| 새 버튼 / CTA | 없음 ✅ |
| 신규 route / Provider | 없음 ✅ |

## 검증 메모

- `npm install`은 현재 환경 레지스트리 403으로 실패. 정적 검증 수행.
- `useEffect`의 deps `[draftBundle.draft]`는 객체 참조 비교. `draftBundle`이
  `useMemo`로 파생되므로 입력 변경 시 새 객체를 반환 → 정상 트리거.
- `useEffect` 내부는 순수 state setter 3개 → 사이드 이펙트 없음.
- 최초 GradesTab 마운트 시에도 한 번 실행됨 (apiStatus='idle' → 변화 없음).

## 산출물

`axis-lms-v1_2-university-analysis-phase51-stale-response-reset-v1.zip`
