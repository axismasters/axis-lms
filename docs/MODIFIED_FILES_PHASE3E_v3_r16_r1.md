# MODIFIED FILES — Phase 3E v3-r16-r1 (University Recommendation Fast Attach)

기준: v3-r14-r3 + v3-r15-r1 + v3-r14-r4가 반영된 최신 main · `filecmp` 재귀 전수 비교로
확정.

**v3-r16-r2 갱신**: 기능 로직은 그대로 두고 사용자 화면 문구만 추가로 정리했다(아래
표의 MD5는 이 정리까지 반영된 최종값). 산출물은 이번부터 **diff 전용 패키지**(5개
코드 파일 + 문서 4개)로 바뀌었다 — 전체 `src`는 패키지에 포함하지 않는다.

## 수정 파일 — 5개 (신규/삭제 없음)

| # | 파일 | 변경 요약 | MD5 (v3-r16-r2 최종) |
|---|------|-----------|------------------------|
| 1 | `src/pages/admin/UniversityReportManagement.tsx` | 더미 PDF/리포트 버튼 제거 + "어댑터"/"Phase 5.1 연동" 문구 정리 | `0d5528eda856c434a96a8fb9c2bb1afe` |
| 2 | `src/pages/student/StudentTargetPreview.tsx` | 과목별 상세 원자료를 `<details>` 토글 뒤로 축약(문구는 이미 깨끗해 추가 변경 없음) | `b09ae1ba35debd86f58ea5c0101b29cb` |
| 3 | `src/pages/parent/ParentTargetSummary.tsx` | 미사용 import 제거(문구는 이미 깨끗해 추가 변경 없음) | `964f2d4bc08a5527217bee6631859820` |
| 4 | `src/pages/teacher/TeacherUniversityData.tsx` | "상담 요약" 탭 문구 정리("Payload"→"상담 원자료 보기"/"입력 데이터 확인", "Engine:"/"AnalyzeRequest" 제거) | `eda6f3d409a59a7fc0e1ef4f1e9252d8` |
| 5 | `src/pages/teacher/TeacherStudentDetail.tsx` | 대학추천 준비 상태 요약 섹션(문구는 이미 깨끗해 추가 변경 없음) | `d1341f046375d624e8b10adeb35acadc` |

> #1, #4는 v3-r16-r1 최초 반영 이후 v3-r16-r2에서 문구가 추가로 바뀌어 MD5가
> 갱신되었다. #2, #3, #5는 grep으로 확인한 결과 화면에 노출되는 개발자용 표현이 애초에
> 없어(코드 식별자/주석에만 있었음) v3-r16-r1 시점 MD5와 동일하다.

## 손대지 않은 파일 — 확인됨

- `src/lib/universityAnalysisAdapter.ts` — 불변 파일, MD5 완전 동일.
- `src/lib/universityAnalysisClient.ts`, `src/lib/universityPayloadAdapter.ts`,
  `src/lib/studentUniversityPreview.ts`, `src/lib/universityRecommendationPayload.ts` —
  전부 무변경(export 재사용만, 파일 자체는 원본 그대로).
- `src/pages/StudentDetail.tsx`(관리자, GradesTab) — 무변경. 이미 완전한 어댑터→게이트→
  Draft→Phase 5.1 API 흐름이 갖춰져 있어 이번 Phase에서 손댈 필요가 없었다.
- `src/routes/*.tsx` — 무변경(신규 라우트 없음).
- `src/components/AdminLayout.tsx`, `src/layouts/TeacherLayout.tsx`,
  `src/layouts/StudentLayout.tsx`, `src/layouts/ParentLayout.tsx` — 전부 무변경(신규
  독립 메뉴 없음).

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

> 참고: 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 본 배포 zip에 포함되지 않는다.
> `tsconfig.*.tsbuildinfo`, `src/assets/emblems/**`도 이번 diff 전용 패키지에는 애초에
> 포함되지 않는다(수정 대상 5개 파일에 해당하지 않으므로).
