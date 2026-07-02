# MODIFIED FILES — Phase 3E v3-r16-r2 (University Counseling Summary Engine)

기준: v3-r14-r3 + v3-r15-r1 + v3-r14-r4 + v3-r16-r1이 반영된 최신 main · `filecmp` 재귀
전수 비교로 확정.

## 신규 파일 — 1개

| # | 파일 | 요약 | MD5 |
|---|------|------|-----|
| 1 | `src/lib/universityCounselingSummary.ts` | 대학추천 상담 요약 엔진(8개 항목 계산, 순수 함수, AI/외부 API 호출 없음) | `b581f1a41c374abec5ff280b8537331d` |

## 수정 파일 — 5개 (삭제 없음)

| # | 파일 | 변경 요약 | MD5 |
|---|------|-----------|-----|
| 1 | `src/pages/admin/UniversityReportManagement.tsx` | 학생 선택 시 "상담 준비 상태" 카드(현재 위치/보완 과목/한 줄 요약) 추가 | `982811f4fe5c9f66e3398e1f3fc74e76` |
| 2 | `src/pages/student/StudentTargetPreview.tsx` | "현재 위치"·"목표 변화 가능성" 카드 추가(간단 요약, 원자료는 기존 접기 유지) | `9e19f70b9e65fb2a9fc13496e837c1bb` |
| 3 | `src/pages/parent/ParentTargetSummary.tsx` | "보완 필요 과목 · 다음 상담 포인트" 카드 추가 | `c78eb8d1fa254981e92d2a8bf3fae376` |
| 4 | `src/pages/teacher/TeacherUniversityData.tsx` | "상담 요약" 탭에 한 줄 요약/현재 위치/보완 과목 TOP3/등급 개선 시나리오 추가 | `46a6ecbb295b80b41ccd0972d43be42d` |
| 5 | `src/pages/teacher/TeacherStudentDetail.tsx` | "준비 상태" 카드에 보완 우선 과목·수학 시나리오 한 줄 추가 | `96d49e190ed96a93c1347d35ff58c572` |

## 손대지 않은 파일 — 확인됨

- `src/lib/universityAnalysisAdapter.ts` — 불변 파일, MD5 완전 동일.
- `src/lib/universityAnalysisClient.ts`, `src/lib/universityRecommendationPayload.ts` —
  무변경.
- `src/lib/universityPayloadAdapter.ts`, `src/lib/studentUniversityPreview.ts` — 무변경
  (기존 export를 새 lib/화면에서 재사용만 했다).
- `src/pages/StudentDetail.tsx`(관리자, GradesTab) — 무변경(이미 완전한 Phase 5.1 연동
  흐름이 있어 이번 범위 아님).
- `src/lib/rbac.ts` — 무변경(신규 권한 추가 없음 — Phase 6.1 계획서의 `universityAnalysis.view`
  권한은 이번에 추가하지 않았다).
- `src/routes/*.tsx`, `src/components/AdminLayout.tsx`, `src/layouts/TeacherLayout.tsx`,
  `src/layouts/StudentLayout.tsx`, `src/layouts/ParentLayout.tsx` — 전부 무변경(신규
  라우트/메뉴 없음).
- `src/lib/universityAnalysis/`(격리 폴더) — 만들지 않았다.
- `src/components/UniversityAnalysisModal.tsx`, `UniversityAnalysisResult.tsx` — 만들지
  않았다.

## v3-r16-r1 파일 5종 — MD5 재확인(문구 정리 포함 최종본과 완전 동일하지는 않음 — 이번에 3개 파일을 다시 수정했으므로 §"수정 파일" 표를 참고)

이번 Phase가 수정한 5개 파일(`UniversityReportManagement.tsx` 등)은 v3-r16-r1/r2
문구 정리 위에 상담 요약 카드를 "추가"한 것이며, 되돌리기가 아니다 — v3-r16-r1에서
확정된 문구 정리(Payload/Engine/AnalyzeRequest 제거 등)는 그대로 유지된다(§CHANGES
문서에서 diff로 확인 가능).

## v3-r15-r1 파일 5종 — MD5 재확인

| 파일 | MD5 |
|------|-----|
| `src/lib/examPrepGuideTypes.ts` | `3ca49ad58fc22be26c90434a1a59a153` |
| `src/lib/examPrepGuideEngine.ts` | `4157a1988da9562b492927de876c2fe2` |
| `src/lib/examPrepGuideStore.ts` | `584ff2d1eab35e446bda1118f67429f3` |
| `src/components/ExamPrepGuidePanel.tsx` | `fde7b1722e30d9df07cc92132a67b1f3` |
| `src/pages/AssessmentDetail.tsx` | `46c8f16bb5c7471cb368dd97a18d45b6` |

## v3-r14-r4 파일 6종 — 원본과 byte 단위 완전 동일 확인(재귀 비교)

`src/components/growth/RivalMatchupCard.tsx`, `src/pages/growth/GrowthOverview.tsx`,
`src/pages/growth/RivalManagement.tsx`, `src/pages/student/StudentGrowthShowcase.tsx`,
`src/pages/student/StudentMyPage.tsx`, `src/pages/student/StudentRival.tsx` — 전부 무변경.

## 엠블럼 무결성

| 항목 | 결과 |
|------|------|
| `src/assets/emblems/*.png` 개수 | **69개** |
| `src/lib/growthData.ts` | MD5 `b258f2f6c6cf9aaf81a39793a552ced9` — 원본과 일치 |
| `src/components/brand/AxisEmblemImageBadge.tsx` | MD5 `cacd9216d185d053e3250e8eb27fb0a7` — 원본과 일치 |
| `src/components/brand/AxisTierMedallion.tsx` | MD5 `69333547eab3ce9a9299227e1a54c49c` — 원본과 일치 |

## 불변 파일 3종 — MD5 재확인

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 참고 자료(패키지에 포함하지 않음)

이번 작업에 첨부된 `axis-university-analysis-engine-phase5_1.zip`과
`AXIS_LMS_INTEGRATION_PLAN_PHASE6_0_1.md`는 검토용 참고자료이며, 산출물 zip에는
포함하지 않는다(§ 지시서 "기준자료는 참고/이식 대상이지, 현재 LMS 대체물이 아니다").

> 참고: 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 본 배포 zip에 포함되지 않는다.
> 이번 세션에서 확인한 결과 `tsconfig.*.tsbuildinfo` 파일 자체가 최신 업로드본에는
> 존재하지 않았다(로컬 빌드 캐시가 애초에 깨끗한 상태) — 커밋 대상도 아니다.
