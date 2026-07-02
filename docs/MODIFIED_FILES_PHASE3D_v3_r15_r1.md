# MODIFIED FILES — Phase 3D v3-r15-r1 (Safe Apply)

기준: `axis-lms-v1_2-phase3d-emblem-assets-full-audit-v3-r14-r3-github-upload.zip`(최신
GitHub main, 엠블럼 PNG 69개 전수조사 재작업 완료본) 재추출 · `filecmp.dircmp` 재귀
전수 비교로 확정(원본 업로드 zip 대비).

**이번 산출물은 ZIP 전체가 아니라 diff 전용 패키지다** — 아래 5개 코드 파일 + 문서 4개만
포함하며, `*.tsbuildinfo`(`tsconfig.app.tsbuildinfo`/`tsconfig.node.tsbuildinfo`)는 포함하지
않는다(저장소 `.gitignore`에 이미 `*.tsbuildinfo`가 등록돼 있어 원래도 커밋 대상이 아님).


## 신규 파일 — 4개 (v3-r15와 내용 동일 — MD5 동일)

| # | 파일 | 요약 | MD5 |
|---|------|------|-----|
| 1 | `src/lib/examPrepGuideTypes.ts` | 입력/산출/저장 레코드 타입 정의 | `3ca49ad58fc22be26c90434a1a59a153` |
| 2 | `src/lib/examPrepGuideEngine.ts` | 규칙 기반 계산 엔진(순수 함수) | `4157a1988da9562b492927de876c2fe2` |
| 3 | `src/lib/examPrepGuideStore.ts` | localStorage 저장 계층(신규 Provider 없음) | `584ff2d1eab35e446bda1118f67429f3` |
| 4 | `src/components/ExamPrepGuidePanel.tsx` | 탭 UI | `fde7b1722e30d9df07cc92132a67b1f3` |

## 수정 파일 — 1개 (v3-r15 대비 `?tab=prep` 안전장치 추가로 MD5 다름)

| # | 파일 | 변경 내용 | MD5 (v3-r15-r1) |
|---|------|-----------|-------------------|
| 1 | `src/pages/AssessmentDetail.tsx` | v3-r15 패치(탭 타입/`import`/`TABS` 조건부 추가/탭 렌더) 재적용 + `?tab=prep` 직접 접근 시 `mock-school`이 아니면 `'basic'`으로 보정하는 `initialTab` 로직 및 `useEffect` 이중 가드 신규 추가 | `46c8f16bb5c7471cb368dd97a18d45b6` |

## 손대지 않은 파일 — 확인됨

- `src/lib/assessmentData.ts`, `src/contexts/AssessmentContext.tsx` — 원본 그대로.
- `src/routes/*.tsx`, `src/App.tsx` — 신규 라우트/Provider 없음(원본 그대로).
- 그 외 `src/**` 전체 — 원본 업로드 zip과 `filecmp.dircmp` 재귀 비교 결과 위 5개 파일을
  제외한 **어떤 파일도 추가/삭제/수정되지 않음**을 확인.

## 엠블럼 무결성 — 원본과 완전 일치(0 diff)

| 항목 | 결과 |
|------|------|
| `src/assets/emblems/*.png` 개수 | **69개** (변경 없음) |
| `src/assets/**` 전체(브랜드 이미지 3종 포함) | 원본 업로드 zip과 파일 단위 byte-compare — **차이 0건** |
| `src/lib/growthData.ts` | MD5 `b258f2f6c6cf9aaf81a39793a552ced9` — 원본과 일치 |
| `src/components/brand/AxisEmblemImageBadge.tsx` | MD5 `cacd9216d185d053e3250e8eb27fb0a7` — 원본과 일치(v3-r14-r1 이후 값과도 동일) |
| `src/components/brand/AxisTierMedallion.tsx` | MD5 `69333547eab3ce9a9299227e1a54c49c` — 원본과 일치 |

## 두 기준선(v3-r14-r2 → v3-r14-r3) 사이 의존 파일 무결성 재확인

v3-r15가 참조하는 12개 프로젝트 내부 파일을 v3-r14-r2(기존 v3-r15 작업 원본)와
v3-r14-r3(이번 최신 main)에서 각각 MD5 비교 — **12/12 완전 동일**(엠블럼 PNG 재작업이
이 파일들에는 영향을 주지 않았음을 재확인).

| 파일 | 비교 결과 |
|------|-----------|
| `src/lib/assessmentData.ts` | SAME |
| `src/lib/brandColors.ts` | SAME |
| `src/utils/dateUtils.ts` | SAME |
| `src/components/ui/button.tsx` | SAME |
| `src/components/ui/input.tsx` | SAME |
| `src/components/ui/label.tsx` | SAME |
| `src/components/ui/textarea.tsx` | SAME |
| `src/components/ui/dialog.tsx` | SAME |
| `src/lib/utils.ts` | SAME |
| `src/contexts/AssessmentContext.tsx` | SAME |
| `src/contexts/AuthContext.tsx` | SAME |
| `src/lib/systemFeatureFlags.ts` | SAME |

## 불변 파일 3종 — MD5 재확인

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

> 참고: 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 본 배포 zip에 포함되지 않는다.
