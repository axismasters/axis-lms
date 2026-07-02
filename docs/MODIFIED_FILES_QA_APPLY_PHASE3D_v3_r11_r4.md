# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r11-r4

기준: v3-r10-r3 원본 업로드 zip을 재추출해 처음부터 시작(반려된 r11 체인 미사용).
`diff -rq` 전수 비교로 확정 · **변경 파일 정확히 1개, 신규/삭제 파일 0개**

## 변경 파일

| 파일 | 변경 내용 | MD5 |
|------|-----------|-----|
| `src/pages/growth/GrowthOverview.tsx` | 요약 카드 5개 그리드에 반응형 breakpoint 추가(`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`, 기존은 고정 5칸) | `5b1a50b8049c1cef505557eea40ca367` |

## 불변 파일 (변경 없음 — 확인됨)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 엠블럼 관련 파일 — 전부 미변경 확인

| 파일 | 상태 |
|------|------|
| `src/components/brand/AxisEmblemBadge.tsx` | 원본과 바이트 단위 동일(미변경) |
| `src/components/brand/AxisTierMedallion.tsx` | 원본과 바이트 단위 동일(미변경) |
| `src/components/brand/AxisEmblemPlaque.tsx` | 원본에 존재하지 않음(반려 체인 산출물 미포함 확인) |

## 점검했지만 수정하지 않은 파일 (7개 — 이미 정상이라 그대로 둠)

`src/pages/student/StudentHome.tsx`, `src/pages/parent/ParentHome.tsx`,
`src/pages/teacher/TeacherHome.tsx`, `src/pages/student/StudentGrowthShowcase.tsx`,
`src/pages/student/StudentRival.tsx`, `src/pages/parent/ParentGrowthReport.tsx`,
`src/pages/student/StudentGrades.tsx` — 전부 코드 재확인 완료, PC 반응형 다단 컬럼 구조가
이미 있어 수정하지 않음(CHANGES 문서 §2 근거 표 참고).

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스에서 실제 재시도) | **실패 — E403, `host_not_allowed`**(레지스트리 자체가 네트워크 정책으로 차단됨. 코드 문제 아님) |
| `npm run build` | **실행 자체가 불가능했음**(위 install 실패로 인해) |
| 오프라인 스텁 tsc 하네스(근사 검증) | baseline 57건(v3-r10-r3 원본 자체의 스텁 노이즈, 이번 변경 무관) 대비 **신규 오류 0건** |

**이 문서는 "npm run build 통과"를 주장하지 않는다.** 이 환경에서는 시도 자체가
네트워크 정책으로 막혀 있었고, 그 증거(`x-deny-reason: host_not_allowed`)를
CHANGES 문서 §5에 남겼다. **최종 그린 빌드 확인은 GitHub Actions에서 반드시 필요하다.**

## 수동 QA(스테이징 또는 Actions 빌드 후)

- [ ] `/growth/overview`(관리자 성장현황): 데스크톱 폭에서 요약 카드 5개가 한 줄에 고르게
      배치되고, 브라우저 폭을 줄여도 2~3칸으로 자연스럽게 줄어드는지
- [ ] 나머지 7개 화면은 이번 패스에서 코드 변경이 없으므로 기존 상태 그대로 정상 동작하는지만
      확인(회귀 없음 재확인 목적)
- [ ] 학생/학부모 화면 헌법 위반 없음(재무/Rival·Emblem·SP·Tier/금지표현)
- [ ] 엠블럼 시각(배지/티어 메달)이 이전과 동일하게 유지되는지(변경 없어야 함)

## APPLY ORDER

1. `src/pages/growth/GrowthOverview.tsx` (유일한 변경 파일)

빌드: `npm install` → `npm run typecheck` → `npm run build` → **GitHub Actions에서 그린 확인
필수**(이 환경에서는 검증 불가했음을 재강조).

## 롤백
`GrowthOverview.tsx` 1개 파일만 원본으로 되돌리면 v3-r10-r3 원본과 100% 동일해짐.
