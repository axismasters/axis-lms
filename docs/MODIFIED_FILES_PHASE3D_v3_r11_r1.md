# MODIFIED FILES — Phase 3D v3-r11-r1

기준: v3-r11 산출물 대비 `diff -rq`로 확정 · **총 5개 파일 변경, 신규/삭제 없음**

| # | 파일 | 변경 유형 | 요약 | MD5 (r11-r1) |
|---|------|-----------|------|--------------|
| 1 | `src/components/brand/AxisEmblemBadge.tsx` | id고유화+시각강화 | `useId()` 기반 고유 defs id + 링 리드 눈금 + 하단 플라크 배너(detailed) | `b41de23709c363790cc96c91c9bcca36` |
| 2 | `src/components/brand/AxisTierMedallion.tsx` | id고유화 | `id="tier-${tier}"` → `useId()` 기반 고유 id | `0dcb783e15348f902b0cedd8e7c422ae` |
| 3 | `src/components/growth/RivalMatchupCard.tsx` | id고유화 | VS 메달 `vsRing/vsPlate` → `useId()` 고유 id | `b3993722fa6459adc2c428d754bddbd7` |
| 4 | `src/pages/student/StudentGrowthShowcase.tsx` | 레이아웃 | 광폭 `lg:max-w-[1280px]` 대시보드 폭 | `72e8f0337e9b161c1921d8a123841786` |
| 5 | `src/pages/student/StudentMyPage.tsx` | 전면 재구성 | 모바일 카드형 → PC 2컬럼 프로필 보드, `max-w-lg mx-auto` 제거 | `907578d0bae85e6faf0ed1a4a44800fa` |

## 불변 파일 (변경 없음 — MD5 유지 확인)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

> 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 배포 zip에 포함되지 않는다.
