# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r13

기준: `...-v3-r12-r2-github-upload.zip` 재추출. `diff -rq` 전수 비교로 확정.

## 수정 파일 — 정확히 5개 (신규/삭제 파일 없음)

| 파일 | 변경 내용 | MD5 |
|------|-----------|-----|
| `src/routes/AdminRoutes.tsx` | `/admin/finance/*` 와일드카드 라우트 추가(미등록 하위 경로 OFF 시 안내) | `4f70b8f99318f78811b484803b932674` |
| `src/contexts/FinanceContext.tsx` | `FINANCE_DISABLED_SAFE` 추가, `useFinance()`에 financeEnabled 훅 레벨 안전 반환 추가(role 차단과 독립) | `0cce9286d15597d2a8e4e8c2e0a19741` |
| `src/pages/growth/GrowthOverview.tsx` | 테이블 컬럼 3개(대표 엠블럼/현재 라이벌/보유 엠블럼), 요약카드 3개(총 발급 엠블럼/활성 라이벌 수/숨겨진 엠블럼)를 emblemEnabled/rivalEnabled로 조건부 제외 | `d7d6bf5e4c5a7a1ea0310afd7de44519` |
| `src/pages/teacher/TeacherStudentGrowth.tsx` | GrowthCard의 "· 엠블럼 N개" 텍스트, "최근 엠블럼" 배지에 emblemEnabled 게이트 추가 | `a70acc78783a45617983e256efe396e1` |
| `src/pages/StudentDetail.tsx` | GradesTab "IF 분석/엠블럼" 안내(2줄만 격리 수정), GrowthShowcaseTab "IF 성장 힌트" 안내에 emblemEnabled 게이트 추가 | `429117fc742e7b6f448fbc358ca3442b` |

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

없음. `diff -rq` 기준 위 5개 파일 외 `src/` 전체가 기준선과 완전히 동일함을 확인했다.

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스, 2026-07-02 06:31 UTC) | 실패 — E403 `host_not_allowed`(네트워크 정책, 코드 무관) |
| 오프라인 스텁 tsc 하네스 | v3-r12-r2 기준 386건 → 변경 후 386건. 신규 오류 0건(1줄 시프트만 확인) |

## 수동 QA — 이번 하드닝 포인트 재확인

**직접 URL 접근**
- [ ] financeEnabled OFF 상태에서 `/admin/finance/anything`(존재하지 않는 임의 경로) 접근 시
      404가 아니라 공통 비활성 안내가 뜨는지
- [ ] financeEnabled ON 상태에서 같은 임의 경로는 여전히 일반 404로 뜨는지(회귀 확인)
- [ ] 나머지 8개 경로(`/admin/finance/payments` 등 5개, `/student/rival`,
      `/admin/growth/rivals`, `/admin/growth/rival-seasons`, `/admin/growth/emblems`,
      `/parent/finance`) 전부 여전히 정상 게이트되는지(회귀 확인)

**Finance 훅 레벨**
- [ ] financeEnabled OFF 상태에서 관리자 계정으로 `useFinance()`를 쓰는 화면에 진입해도
      invoices/payments 등이 빈 배열/0으로만 보이는지(실제 데이터는 여전히 존재 — 다시 ON
      하면 그대로 복원되는지)
- [ ] 학생 계정은 financeEnabled 값과 무관하게 항상 재무 데이터 접근이 차단되는지(회귀 확인)

**Emblem 노출 재점검**
- [ ] emblemEnabled OFF 상태에서 관리자 "성장현황"(`/admin/growth/overview`) 테이블에
      대표 엠블럼/보유 엠블럼 컬럼이 사라지고, 요약 카드에서 "총 발급 엠블럼"/"숨겨진 엠블럼"이
      사라지는지
- [ ] 교사 "담당 학생 성장현황"(`/teacher/growth`) 카드에서 "엠블럼 N개" 텍스트와 "최근 엠블럼"
      배지가 사라지는지
- [ ] 관리자 학생상세 "성적조회" 탭에서 "IF 분석 / 엠블럼" 안내가 사라지는지(그 탭의 다른
      내용 — 성적 데이터/추천 관련 UI — 은 정상 동작하는지 회귀 확인 필수)
- [ ] 관리자 학생상세 "성장/진열장" 탭에서 "IF 성장 힌트" 안내가 사라지는지

**Rival 노출 재점검**
- [ ] rivalEnabled OFF 상태에서 관리자 "성장현황" 테이블의 "현재 라이벌" 컬럼과 "활성 라이벌 수"
      요약 카드가 사라지는지

**헌법 재검수**
- [ ] 학부모 화면 어디에도 Rival/Emblem/SP/Tier 직접 노출 없음(회귀 확인)
- [ ] 학생 화면 어디에도 재무 노출 없음, `/student/finance` 차단 유지(회귀 확인)
- [ ] 엠블럼 디자인(배지/티어 메달 시각)이 이전과 완전히 동일한지(컴포넌트 미변경)

## APPLY ORDER

1. `src/contexts/FinanceContext.tsx`
2. `src/routes/AdminRoutes.tsx`
3. `src/pages/growth/GrowthOverview.tsx`
4. `src/pages/teacher/TeacherStudentGrowth.tsx`
5. `src/pages/StudentDetail.tsx`

## 롤백

5개 파일을 원본으로 되돌리면 v3-r12-r2 상태와 100% 동일해진다.
