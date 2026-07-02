# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r12-r2

기준: 반려된 `...-v3-r12-github-upload.zip` 재추출. `diff -rq` 전수 비교로 확정.

## 수정 파일 — 정확히 4개

| 파일 | 변경 내용 | MD5 |
|------|-----------|-----|
| `src/contexts/FinanceContext.tsx` | 9개 액션 함수 + 자동 청구서 생성 useEffect에 financeEnabled 방어 가드 | `4514992d466054570ecf4d9d91a7508c` |
| `src/contexts/GrowthContext.tsx` | 5개 엠블럼 정책 함수에 emblemEnabled 방어 가드 추가 | `2d817d374ca2845ada89e12fef41ce0b` |
| `src/lib/studentBriefingEngine.ts` | `showEmblemCount` 옵셔널 플래그 추가(지시서 범위 외 보강, 기존 동작 불변) | `b69871c121b318fe047f625da02c77ef` |
| `src/pages/teacher/TeacherStudentDetail.tsx` | `buildTeacherGrowthConsultingNote` 호출부에 0/undefined 전달 + showEmblemCount 전달 | `8323dbbb295c35275cfa69796691ec78` |

## 불변 파일 (변경 없음 — 재확인됨)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 엠블럼 관련 파일 — 전부 미변경 확인

| 파일 | 상태 |
|------|------|
| `src/components/brand/AxisEmblemBadge.tsx` | 바이트 단위 동일 |
| `src/components/brand/AxisTierMedallion.tsx` | 바이트 단위 동일 |
| `src/components/brand/AxisEmblemPlaque.tsx` | 존재하지 않음 |

## 신규/삭제 파일

없음. v3-r12 대비 위 4개 파일 외 전체가 동일함을 `diff -rq`로 확인했다.

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스, 2026-07-02 06:14 UTC) | 실패 — E403 `host_not_allowed`(네트워크 정책, 코드 무관. 사용자가 확인한 실제 빌드는 이미 통과했다고 명시함) |
| 오프라인 스텁 tsc 하네스 | v3-r12 기준 386건 → 이번 변경 후에도 386건. 신규 오류 0건(순수 줄-번호 이동만 확인) |

## 수동 QA — 이번 반려 사유 3건 재확인 포인트

**① Finance OFF — Context 함수 직접 차단 확인**
- [ ] financeEnabled OFF 상태에서 (개발자 콘솔 등으로) `addPayment`를 직접 호출해도
      `{ ok: false, reason: '...' }`만 반환되고 실제 수납 데이터가 추가되지 않는지
- [ ] 같은 방식으로 `requestRefund`/`approveRefund`/`rejectRefund`/`completeRefund`/
      `confirmSettlement`도 상태 변경이 일어나지 않는지
- [ ] `generateInvoicesForMonth` 호출 시 0을 반환하고 청구서가 생성되지 않는지
- [ ] `generateSettlementForMonth` 호출 시 더미 값만 반환하고 실제 정산 목록에 추가되지
      않는지(`settlements` 배열 길이 불변 확인)
- [ ] financeEnabled OFF 상태에서 신규 수강 등록을 해도 이번 달 청구서가 자동 생성되지
      않는지(자동 청구서 생성 useEffect 가드 확인)

**② Emblem OFF — 엠블럼 정책 함수 직접 차단 확인**
- [ ] `updateEmblemProgress`/`addEmblem`/`updateEmblem`/`toggleEmblemActive`/
      `toggleEmblemHidden` 전부 emblemEnabled OFF 상태에서 `{ ok: false }`만 반환하고
      실제 데이터가 바뀌지 않는지

**③ TeacherStudentDetail 자동 상담 문구**
- [ ] emblemEnabled OFF 상태에서 "성장 상담 요약" 자동 문구에 "엠블럼"이라는 단어 자체가
      전혀 등장하지 않는지(기존에는 "엠블럼 0개"로 남아있었던 지점)
- [ ] rivalEnabled OFF 상태에서 같은 문구에 "Rival 전적" 문장이 전혀 등장하지 않는지
- [ ] 두 기능이 모두 ON일 때는 기존과 동일하게 문구가 정상 표시되는지(회귀 확인)

**공통**
- [ ] 다시 ON으로 돌리면 각 기능이 즉시 정상 동작하는지(데이터 삭제 없이 그대로 복원)
- [ ] `npm run build` 통과(GitHub Actions에서 최종 확인)

## APPLY ORDER

1. `src/lib/studentBriefingEngine.ts`
2. `src/contexts/FinanceContext.tsx`
3. `src/contexts/GrowthContext.tsx`
4. `src/pages/teacher/TeacherStudentDetail.tsx`

## 롤백

4개 파일을 원본으로 되돌리면 v3-r12(반려된 산출물) 상태와 100% 동일해진다.
