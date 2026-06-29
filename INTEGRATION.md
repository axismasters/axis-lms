# AXIS LMS v1.2 — University Analysis Phase51 AnalyzeResponse Type Contract v1

## 문서 개요

`src/lib/universityAnalysisClient.ts`의 `Phase51AnalyzeResponse` placeholder를
Phase 5.1 `docs/API_CONTRACT.md` 기준으로 확장하는 단계다.

- 실제 fetch 호출 없음
- Phase 5.1 엔진 본체 import 없음
- `callPhase51AnalyzeApi`는 여전히 stub (항상 throw)
- `StudentDetail.tsx` 변경 없음
- 분석 시작 / AI 분석 / 추천 실행 버튼 없음

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/universityAnalysisClient.ts` | `Phase51AnalyzeResponse` 서브타입 7개 추가, 메인 응답 타입 전체 필드 확장. fetch 예시 JSDoc 제거 유지. |

## 신규 서브타입 목록

| 타입 | 역할 |
|---|---|
| `Phase51CurrentScoreSummary` | 엔진이 인식한 현재 성적 요약 |
| `Phase51RecommendationEntry` | 추천 밴드 단일 항목 (univName/deptName은 엔진 생성) |
| `Phase51RecommendationBand` | reach/target/safety 밴드 전체 + 요약 |
| `Phase51TargetGapEntry` | 목표대학 대비 점수 갭 단일 항목 |
| `Phase51SubjectWeaknessItem` | 과목별 취약점 단일 항목 |
| `Phase51MathImpact` | 수학 향상 시나리오 영향 (선택) |
| `Phase51ImprovementScenarioResult` | IF 시나리오 추천 결과 변화 (선택) |

## Phase51AnalyzeResponse 전체 필드

| 필드 | 타입 | 설명 |
|---|---|---|
| `reportId` | `string` | 분석 보고서 고유 ID |
| `generatedAt` | `string` | 생성 시각 (ISO 8601) |
| `currentScoreSummary` | `Phase51CurrentScoreSummary` | 현재 성적 요약 |
| `recommendationBand` | `Phase51RecommendationBand` | 추천 대학/학과 밴드 |
| `targetGap` | `Phase51TargetGapEntry[]` | 목표대학 갭 목록 |
| `subjectWeakness` | `Phase51SubjectWeaknessItem[]` | 과목별 취약점 |
| `mathImpact` | `Phase51MathImpact?` | 수학 향상 시나리오 영향 (선택) |
| `improvementScenarioResult` | `Phase51ImprovementScenarioResult?` | IF 시나리오 결과 (선택) |
| `counselingComment` | `string` | 상담용 자연어 코멘트 |
| `reportSummary` | `string` | 학생/학부모 열람용 요약 |
| `dataConfidence` | `number` | 데이터 신뢰도 (0~1) |
| `disclaimer` | `string` | 분석 결과 면책 문구 |
| `analysisSource` | `string` | 데이터 출처 식별자 |
| `excludedUnivIds` | `string[]` | 분석 제외 대학 ID 목록 |

## 설계 원칙

- `univName` / `deptName` / 합격 가능성 / 추천 순위는 엔진이 반환하는 값이다. LMS에서 계산하지 않는다.
- `mathImpact` / `improvementScenarioResult`는 `improvementScenario` 입력 시에만 존재.
- `callPhase51AnalyzeApi`는 이번 단계에서도 stub 유지. Stage 3에서 실제 fetch로 교체.

## 유지 확인

| 항목 | 상태 |
|---|---|
| `src/lib/universityAnalysisAdapter.ts` | 변경 없음 (md5: `1eddaef5cf427e00666be685ea16f32f`) ✅ |
| `src/pages/StudentDetail.tsx` | 변경 없음 ✅ |
| `TeacherExamGrading.tsx` scopedExam 패턴 | md5 동일 ✅ |
| `adapterMockSummaries` list 타입 | `const list: ReturnType<typeof adaptMockSummaryFromLms>[] = [];` 유지 ✅ |
| 실제 fetch 코드 | 없음 ✅ |
| 엔진 본체 import | 없음 ✅ |
| 분석 시작 / AI 분석 버튼 | 없음 ✅ |
| 신규 route / Provider | 없음 ✅ |

## 검증 메모

- `npm install`은 현재 환경에서 레지스트리 403으로 실패. 정적 검증 수행.
- `callPhase51AnalyzeApi(_draft)` — async 함수가 항상 throw하는 패턴은 TypeScript에서 유효.
  반환 타입 `Promise<Phase51AnalyzeResponse>`는 유지되며 빌드 오류 없음.
- 서브타입들은 현재 다른 파일에서 import하지 않음 → tree-shaking 대상, 빌드 오류 없음.
- `Phase51AnalyzeResponse`의 서브타입 필드는 Phase 5.1 `docs/API_CONTRACT.md` 참조 기준이며,
  실제 API 연결(Stage 3) 전 계약 파일과 대조 확인이 필요하다.

## GitHub 업로드 여부

코드 파일(`src/lib/universityAnalysisClient.ts`) 변경을 포함하므로 GitHub 업로드 대상.

## Stage 로드맵

| Stage | 내용 | 상태 |
|---|---|---|
| 0 | gradeLevel UI 추가 | 완료 |
| 1 | Client boundary stub | 완료 |
| **2 (이번)** | **AnalyzeResponse 타입 계약** | **완료** |
| 3 | 실제 fetch 연결 | 대기 |
| 4 | 응답 UI 표시 | 대기 |

## 산출물

`axis-lms-v1_2-university-analysis-phase51-analyze-response-type-contract-v1.zip`
