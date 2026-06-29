# AXIS LMS v1.2 — University Analysis Phase51 TargetGap Detail UI v1 buildfix

## 검사 결과

원본 zip(`axis-lms-v1_2-university-analysis-phase51-targetgap-detail-ui-v1.zip`)은 문서와 코드 추가분 스니펫만 포함되어 있어 GitHub에 그대로 업로드하기 어렵다.

- 원본 포함 파일
  - `INTEGRATION.md`
  - `src/pages/StudentDetail_targetGap_additions.tsx`
- 문제점
  - 실제 경로 `src/pages/StudentDetail.tsx`가 없음
  - 기존 파일에 자동 반영된 결과물이 아님
  - targetGap을 `{ count, summary, items }` 형태로 가정했으나 현재 `Phase51AnalyzeResponse.targetGap` 계약은 `Phase51TargetGapEntry[]` 배열임

따라서 ChatGPT buildfix에서 최신 buildfix baseline 기준 `src/pages/StudentDetail.tsx`에 실제 반영 가능한 형태로 수정했다.

## 기준 baseline

`Phase51 Recommendation List UI and Fetch Timeout buildfix` 이후 기준.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/pages/StudentDetail.tsx` | `renderTargetGapItems` helper 추가, success 블록에 목표대학 갭 상세 읽기 전용 UI 추가 |
| `INTEGRATION.md` | 검사 결과 및 buildfix 내용 기록 |

## 구현 내용

### 1. targetGap 상세 helper 추가

`Phase51AnalyzeResponse['targetGap']` 타입을 그대로 사용한다.

- LMS 내부 gap 계산 없음
- Phase 5.1 엔진 응답 배열을 읽기 전용으로 표시
- `mathGapPercentile`, `koreanGapPercentile` 같은 수치 필드는 표시하지 않음
- 표시 항목은 `univName`, `deptName`, `gapSummary` 중심

### 2. targetGap empty state 추가

`targetGap` 배열이 비어 있으면 아래 문구를 표시한다.

```text
상세 갭 항목이 없습니다.
```

### 3. success 블록 확장

기존 `목표 갭 N건` 요약은 유지하고, 바로 아래에 `목표대학 갭 상세` 블록을 추가했다.

## 절대 유지 확인

| 항목 | 상태 |
|---|---|
| `src/lib/universityAnalysisAdapter.ts` 변경 없음 | ✅ |
| `src/lib/universityAnalysisClient.ts` 변경 없음 | ✅ |
| Phase51ImportMetaEnv 안전 캐스팅 유지 | ✅ |
| AbortController 30초 timeout 유지 | ✅ |
| timeout 한국어 메시지 유지 | ✅ |
| 추천 목록 empty state 유지 | ✅ |
| recommendationBand.items 소신/적정/안정 그룹화 유지 | ✅ |
| TeacherExamGrading scopedExam 타입픽스 영향 없음 | ✅ |
| adapterMockSummaries ReturnType 타입픽스 유지 | ✅ |
| handleRequestAnalysis pending/ready 가드 유지 | ✅ |
| stale response reset 유지 | ✅ |
| 신규 route / Provider 없음 | ✅ |
| Phase 5.1 엔진 본체 import 없음 | ✅ |
| PDF Export 없음 | ✅ |
| LMS 내부 추천 순위 계산 없음 | ✅ |
| LMS 내부 합격 가능성 계산 없음 | ✅ |

## GitHub 업로드 여부

필요 있음.

원본 zip이 아니라 이 buildfix zip을 압축 해제해서 내부 파일을 같은 경로에 덮어쓴다.

## 커밋명 후보

```text
대학분석 목표대학 갭 상세 반영
```

## baseline 추가

```text
54. University Analysis Phase51 TargetGap Detail UI v1 buildfix
```
