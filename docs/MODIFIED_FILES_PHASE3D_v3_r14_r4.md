# MODIFIED FILES — Phase 3D v3-r14-r4 (Student Growth / Rival / Emblem Premium UI Cleanup)

기준: `axis-lms-v1_2-phase3d-emblem-assets-full-audit-v3-r14-r3-github-upload.zip`(엠블럼
PNG 69개 전수조사 재작업 완료본) + 이미 safe-apply된 v3-r15-r1 위에서 작업 · `filecmp`
재귀 전수 비교로 확정.

## 수정 파일 — 6개 (신규/삭제 없음)

| # | 파일 | 변경 요약 | MD5 |
|---|------|-----------|-----|
| 1 | `src/components/growth/RivalMatchupCard.tsx` | 헤더 그리드 재구성(`hidden` 제거, `md` 반응형), 단일 톤 배경, 아바타/VS/타이포 확대, 🏆→Trophy 아이콘 | `22c0bda0db57dfb5d90dc91fed7d179a` |
| 2 | `src/pages/student/StudentRival.tsx` | 유사 수준 비교 막대그래프 퍼센트-높이 버그 → 픽셀 고정값 수정 | `6e686d62c74c7974a1370e3e82021b6d` |
| 3 | `src/pages/student/StudentGrowthShowcase.tsx` | 엠블럼 타일 72→96px + 프레임 카드화, 그리드 열 수 축소 | `405177228387a19d88532f3e30ffae1e` |
| 4 | `src/pages/student/StudentMyPage.tsx` | 보유 엠블럼 48px flex-wrap → 64px 그리드 타일 | `1810b4fcddf58c1fea3bc0a6a6bce2b5` |
| 5 | `src/pages/growth/RivalManagement.tsx` | Swords(칼) 아이콘 제거, 승/패 색상을 AXIS 팔레트(teal/amber)로 통일, ad-hoc red/indigo hex 제거 | `86e6b7dc58bb42e3b1c0365c0ee672d6` |
| 6 | `src/pages/growth/GrowthOverview.tsx` | 통계 카드/테이블 ad-hoc hex → AXIS 팔레트 통일 | `bc9493a4d6fc8e23dfb9c6d77c3faa19` |

## 손대지 않은 파일 — 확인됨

- `src/assets/emblems/**` — PNG **69개**, 원본과 byte 단위 완전 동일.
- `src/lib/growthData.ts` — MD5 원본과 완전 동일.
- `src/components/brand/AxisEmblemImageBadge.tsx` — MD5 원본과 완전 동일.
- `src/components/brand/AxisTierMedallion.tsx` — MD5 원본과 완전 동일.
- v3-r15-r1 5개 파일(`examPrepGuideTypes.ts`/`examPrepGuideEngine.ts`/
  `examPrepGuideStore.ts`/`ExamPrepGuidePanel.tsx`/`AssessmentDetail.tsx`) — 직전
  safe-apply 산출물과 MD5 완전 동일(삭제/되돌리기 없음).
- `src/routes/*.tsx`, `src/App.tsx` — 무변경.
- `src/pages/parent/**` — 무변경.
- `src/components/brand/AxisTierImageMedallion.tsx`, `AxisEmblemBadge.tsx`,
  `src/lib/emblemAssetManifest.ts`, `src/lib/rivalMatchupEngine.ts` — 무변경(이번 작업은
  이 파일들이 이미 제공하는 API의 `size`/`className` prop과 감싸는 컨테이너 스타일만
  호출부에서 조정했다).
- `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` — 원본과 byte 단위 완전 동일
  (§ CHANGES 문서 §4 — 이전 세션 로컬 typecheck 시도로 오염됐던 것을 원본으로 복구함).
  `.gitignore`에 이미 `*.tsbuildinfo` 등록되어 있어 커밋 대상 아님.

## 불변 파일 3종 — MD5 재확인

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

> 참고: 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 본 배포 zip에 포함되지 않는다.
