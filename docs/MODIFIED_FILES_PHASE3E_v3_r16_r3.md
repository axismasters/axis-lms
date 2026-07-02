# MODIFIED FILES — Phase 3E v3-r16-r3 (대학추천 신뢰도 향상)

기준: `axis-lms-v1_2-phase3e-university-counseling-summary-v3-r16-r2-github-upload__2_.zip`
(GitHub main, v3-r16-r2 검수 통과본)을 재추출해 재귀 전수 diff로 확정.

## 신규 파일 — 1개

| # | 파일 | 요약 | MD5 |
|---|------|------|-----|
| 1 | `src/lib/universityReliabilityEngine.ts` | 대학추천 신뢰도 엔진 — 순수 계산 함수(신뢰도 등급/데이터 균형/수능실전 누적 회차/부족 데이터/설명 문장). 383행 | `fb520d4a5123330e70545e5e3058b474` |

## 수정 파일 — 5개

| # | 파일 | 변경 내용 | MD5 |
|---|------|-----------|-----|
| 1 | `src/lib/universityCounselingSummary.ts` | `UniversityCounselingSummary`에 `reliability` 확장 필드 1개 추가. 기존 8개 필드 로직 무변경 | `fdfc6bfa71e930dae3295fecd17ac418` |
| 2 | `src/pages/student/StudentTargetPreview.tsx` | 헤더 배지 줄에 "분석 {등급라벨}" 배지 + 짧은 한 줄 문장 추가 | `c4af89a37046843f30ed9db25cd59b7d` |
| 3 | `src/pages/parent/ParentTargetSummary.tsx` | "상담 참고도" 카드 신설(설명형 문장 1개) | `c1b1cbc312fc395d7827f60c25037534` |
| 4 | `src/pages/teacher/TeacherUniversityData.tsx` | "상담 요약" 탭에 "데이터 신뢰도" 카드 신설(등급/3열 그리드/균형 설명/수능실전 누적/확인 항목) | `b5654ea9fcf57c6bfde87340903d8f9e` |
| 5 | `src/pages/admin/UniversityReportManagement.tsx` | 기존 "상담 준비 상태" 카드 내부에 신뢰도 배지 + 한 줄 요약 추가(새 카드 아님) | `570fe35cfded49e8815c8ee17f9d5046` |

## 신규 문서 — 4개

| # | 파일 |
|---|------|
| 1 | `docs/CHANGES_PHASE3E_v3_r16_r3.md` |
| 2 | `docs/QA_PHASE3E_v3_r16_r3.md` |
| 3 | `docs/MODIFIED_FILES_PHASE3E_v3_r16_r3.md` |
| 4 | `docs/APPLY_ORDER_PHASE3E_v3_r16_r3.md` |

## 무수정 확인 — 핵심 파일 (원본 zip 대비 MD5/재귀 diff 동일)

| 파일/디렉터리 | 비고 |
|------|------|
| `src/lib/universityPayloadAdapter.ts` | 무수정 (`31e3e80740871b15548f280df4d43c5c`) — 신뢰도 엔진의 유일한 입력 타입 소스로만 참조 |
| `src/lib/studentUniversityPreview.ts` | 무수정 (`318ae301c59f399f3af480a93d09da07`) |
| `src/lib/universityAnalysisAdapter.ts` | 무수정 — Phase 5.1 연동용 불변 파일, 이번 작업에서 import조차 하지 않음 |
| `src/lib/universityRecommendationPayload.ts` | 무수정 — deprecated 파일 그대로 |
| `src/lib/rbac.ts` | 무수정 (`aa9e7ce07f711c5a81fb400d94ab8855`) — 신규 권한 추가 없음 |
| `src/App.tsx` | 무수정 (`387bbf48a3d87ff63ce10d6dbc8bf33c`) — 신규 라우트 없음 |
| `src/routes/**` | 무수정 — 신규 메뉴 없음 |
| `src/assets/emblems/**` | PNG 69개 유지 |
| `src/lib/growthData.ts` | 무수정 |
| `src/components/brand/AxisEmblemImageBadge.tsx` | 무수정 |
| `src/components/brand/AxisTierMedallion.tsx` | 무수정 |
| v3-r14-r3/r14-r4/r15-r1/r16-r1 기존 산출물 전체 | 되돌리기 0건 |

수정 파일 6개(신규 1 + 수정 5) 외 `src/` 이하 나머지 전 파일: 재귀 diff 결과 차이 없음.

## 참고 자료로만 다룬 첨부 zip (코드로 반영하지 않음)

- `axis-lms-v1_2-phase6_1-university-analysis-integration-github-upload.zip` — 구조/함수명
  참고만. `universityAnalysis/**`, `mockUniversities.ts`, `UniversityAnalysisModal/Result.tsx`,
  RBAC `universityAnalysis.view` 전부 이번 산출물에 없음.
- `axis-lms-v1_2-phase3d-exam-prep-guide-relocate-v3-r15-r2-github-upload.zip` — 이번
  r16-r3에 적용하지 않음(지시서 명시).
