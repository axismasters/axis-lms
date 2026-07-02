# MODIFIED FILES — Phase 3D v3-r11 (Premium Growth UI / Emblem / PC Layout Cleanup)

기준: v3-r10-r3 + 선행 v3-r11(growth-motivation-cleanup, 10파일) 위에 이번 premium 서브패스
적용. 아래는 **이번 premium 패스에서 새로 건드린 파일만** 정리(선행 패스 10개 파일 목록은
`MODIFIED_FILES_PHASE3D_v3_r11.md` 참고).

원본 대비 `diff -rq`로 확정 · **이번 패스: 7개 파일 변경 + 1개 신규 파일**

| # | 파일 | 변경 유형 | 요약 | MD5 |
|---|------|-----------|------|-----|
| 1 | `src/components/brand/AxisEmblemBadge.tsx` | 전면 재작성 | 프리미엄 메달 v2(킬라인/뾰족한 잎 월계관/패싯 젬/아이콘 글로우). Props 동일 | `759b5f8d579f5ee978955d95aeed78ff` |
| 2 | `src/components/brand/AxisEmblemPlaque.tsx` | **신규** | 골드 테두리 네임 플레이트(HTML/CSS, title+subtitle) | `7f8344e3a907ea6e9d371bd8734a13d7` |
| 3 | `src/components/growth/RivalMatchupCard.tsx` | UI 재작성/문자열 | VS 메달 동일 언어로 재작업 + 🏆 이모지 → Trophy 아이콘 | `02b9eb1b69084880f2dc3b5be84eb001` |
| 4 | `src/pages/student/StudentGrowthShowcase.tsx` | 구조 재작성 | 엠블럼 갤러리 3섹션 분리(대표/보유/다음목표) + PC 3컬럼 하단 배치 + IF색상 정정 | `a65ba1ae7f39e4c201d5b48860d1fdde` |
| 5 | `src/pages/parent/ParentGrowthReport.tsx` | 로직/색상 수정 | IF 색상 canonical화(레드 제거) + 결과 추이 1건 처리 수정 | `bca71b8b84aedfd318e1ffca34649ae5` |
| 6 | `src/pages/growth/RivalSeasonManagement.tsx` | 레이아웃 | 메인 wrapper 데스크톱 반응형 확장(`lg:max-w-4xl`) | `28170a954a6766f26362c1f9347567d3` |
| 7 | `src/pages/growth/ShowcasePolicyManagement.tsx` | 레이아웃 | 메인 wrapper 데스크톱 반응형 확장(`lg:max-w-3xl`) | `9c6c4ee5e750a273c0ec8dc52dadb8fd` |

## 불변 파일 (변경 없음 — MD5 유지 확인)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 누적 변경 파일 전체 목록 (선행 v3-r11 + 이번 premium 패스)

선행 패스(growth-motivation-cleanup) 10개 + 이번 패스 7개 변경 + 1개 신규 = **총 17개 파일
변경/추가**. 전체 목록은 `MODIFIED_FILES_PHASE3D_v3_r11.md`(선행분)와 이 문서(이번분)를
함께 참고.

> 참고: 검증 하네스(`_check/`)는 프로젝트 밖에 위치하며 본 배포 zip에 포함되지 않는다.
