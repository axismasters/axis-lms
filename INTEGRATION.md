# AXIS LMS v1.2 — University Analysis Phase51 Response UI Wiring v1 buildfix

## 개요

Phase 5.1 API 응답을 `StudentDetail` 성적조회 탭 내부에서 사용자 명시 클릭으로만 확인하는 UI wiring 단계입니다.

- `callPhase51AnalyzeApi(draft)` 호출은 버튼 클릭 시에만 발생합니다.
- 페이지 진입/탭 진입 자동 호출은 없습니다.
- 추천 대학/학과 목록 전체, 합격 가능성, 추천 순위는 표시하지 않습니다.
- 표시 범위는 `reportSummary`, `counselingComment`, `dataConfidence`, `recommendationBand.summary`, `targetGap` 개수, `subjectWeakness` 개수로 제한합니다.
- Phase 5.1 엔진 본체 import는 없습니다.

## 원본 산출물에서 잘못된 부분

| 항목 | 내용 |
|---|---|
| 이전 buildfix 회귀 | IF 개선 시나리오 입력 grid가 `grid-cols-1 sm:grid-cols-3`에서 `grid-cols-3`으로 되돌아갔습니다. |
| 안전 가드 부족 | 버튼은 disabled 처리되어 있으나, handler 내부에서 `validation.status !== 'ready'` 가드가 없었습니다. |

## ChatGPT buildfix 수정

| 파일 | 수정 내용 |
|---|---|
| `src/pages/StudentDetail.tsx` | IF 개선 시나리오 입력 grid를 `grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1.5`로 복구했습니다. |
| `src/pages/StudentDetail.tsx` | `handleRequestAnalysis`에 `draftBundle.validation.status !== 'ready'` guard를 추가했습니다. |
| `src/lib/universityAnalysisClient.ts` | 원본의 fetch 연결 및 `Phase51ImportMetaEnv` 안전 캐스팅 구조를 유지했습니다. |

## 유지 확인

| 항목 | 상태 |
|---|---|
| Phase 5.1 엔진 직접 import | 없음 |
| 실제 API 호출 위치 | `callPhase51AnalyzeApi` 내부 + `StudentDetail` 버튼 클릭 handler로 제한 |
| 자동 호출 | 없음 |
| 신규 route / Provider | 없음 |
| PDF Export | 없음 |
| AI 분석 / 추천 실행 CTA | 없음 |
| 추천 대학 목록 전체 렌더링 | 없음 |
| 합격 가능성 / 추천 순위 표시 | 없음 |
| `src/lib/universityAnalysisAdapter.ts` | 변경 없음 |
| `TeacherExamGrading.tsx` | 변경 없음 |
| `adapterMockSummaries` 타입픽스 | 유지 필요: `const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];` |

## 성능/구조 원칙

- 대학분석 UI와 API 호출 상태는 `GradesTab` 내부에만 둡니다.
- 학생 상세 첫 진입 시 Phase 5.1 API를 자동 호출하지 않습니다.
- LMS 본체는 입력/검증/표시만 담당하고, 무거운 분석은 Phase 5.1 API 뒤쪽 엔진에 둡니다.
- PDF/문제은행/NGD/OCR은 LMS 본체에 포함하지 않습니다.

## 검증 메모

- 현재 검사 환경에서는 npm registry 제한으로 로컬 `npm install`/빌드 재현이 불가합니다.
- 정적 검사 기준으로 `StudentDetail.tsx`, `universityAnalysisClient.ts`, `INTEGRATION.md`만 포함합니다.
- GitHub Actions 통과 기준으로 main 반영을 승인합니다.

## 산출물

`axis-lms-v1_2-university-analysis-phase51-response-ui-wiring-v1-buildfix-github-upload.zip`
