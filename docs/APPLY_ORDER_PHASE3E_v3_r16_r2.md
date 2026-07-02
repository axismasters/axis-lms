# APPLY ORDER — Phase 3E v3-r16-r2 (University Counseling Summary Engine)

기준: v3-r14-r3 + v3-r15-r1 + v3-r14-r4 + v3-r16-r1 위에 적용.

## 0) 금지 사항 재확인(반영 담당자 체크)

- [ ] `src/assets/emblems/**` — 수정 금지
- [ ] `src/lib/universityAnalysisAdapter.ts`(불변 파일) — 수정 금지
- [ ] v3-r15-r1 파일 5종 — 수정 금지
- [ ] v3-r14-r4 파일 6종 — 수정 금지
- [ ] v3-r16-r1에서 정리한 문구(Payload/Engine/AnalyzeRequest 제거)를 되돌리지 않는다
- [ ] `src/lib/universityAnalysis/`(격리 폴더), RBAC 신규 권한, 신규 모달/버튼 — 이번엔
      추가하지 않는다(Phase 6.1 계획서 범위, 이번 지시서 범위 아님)

## 1) 사전 확인

- `src/assets/emblems/` PNG 개수가 **69개**인지 확인.
- 불변 파일 3종 MD5 확인:
  - `src/lib/universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f`
  - `src/App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c`
  - `src/lib/classData.ts` = `126d9e5e314de186bf1df0a63b3abf82`

## 2) 파일 반영 (신규 1개 먼저, 나머지는 순서 무관)

1. `src/lib/universityCounselingSummary.ts` (신규 — 나머지 5개 파일이 이 파일을 import)
2. `src/pages/admin/UniversityReportManagement.tsx`
3. `src/pages/student/StudentTargetPreview.tsx`
4. `src/pages/parent/ParentTargetSummary.tsx`
5. `src/pages/teacher/TeacherUniversityData.tsx`
6. `src/pages/teacher/TeacherStudentDetail.tsx`

## 3) 반영 직후 필수 재확인

- [ ] `src/assets/emblems/**` — diff 0건.
- [ ] `src/lib/universityAnalysisAdapter.ts` — MD5 반영 전후 동일.
- [ ] v3-r15-r1 5개, v3-r14-r4 6개 파일 — 전부 MD5 반영 전후 동일.
- [ ] `src/lib/rbac.ts` — 무변경 확인(신규 권한 추가 없음).

## 4) 빌드/검증

- `npm ci`
- `npm run typecheck` (`tsc -b --noEmit`)
- `npm run build` (`tsc -b && vite build`)
- 이 검증 샌드박스에서 `npm ci`를 실제로 시도했고 네트워크 정책(`E403`)으로 실패했다 —
  실제 통과 확인은 GitHub Actions에서 이루어져야 한다(대체 검증: 오프라인 스텁 tsc
  하네스, 수정/신규 파일 6종 스코프 오류 0건 — `docs/QA_PHASE3E_v3_r16_r2.md` 참고).
- GitHub Desktop → Commit(Summary: `Phase 3E v3-r16-r2: enhance university counseling
  summary engine`) → Push → **GitHub Actions Build Check 그린 확인**

## 5) 반영 후 수동 확인 포인트(요약 — 전체 체크리스트는 QA 문서)

- `/student/target-preview` → "현재 위치"·"목표 변화 가능성" 카드가 헤더 바로 아래에
  간단한 문장으로 보이는지, 과목별 상세는 여전히 접혀 있는지.
- `/parent/target-summary` → "보완 필요 과목 · 다음 상담 포인트" 카드가 보이는지,
  Rival/Emblem/SP/Tier나 합격 관련 표현이 전혀 없는지.
- `/teacher/university-data` "상담 요약" 탭 → 한 줄 요약/현재 위치/보완 과목 TOP3/등급
  개선 시나리오가 순서대로 보이는지, "상담 원자료 보기" 토글이 여전히 맨 아래 있는지.
- `/teacher/students/{id}` → 준비 상태 카드에 보완 우선 과목과 수학 시나리오 한 줄이
  추가로 보이는지.
- `/admin/university-reports` → 학생 선택 시 "상담 준비 상태" 카드가 보이고, PDF/리포트
  생성 버튼이 여전히 없는지.
- 데이터가 전혀 없는 학생 계정 4곳(학생/학부모/교사/관리자) 모두에서 "데이터 준비 중"
  같은 명확한 안내만 보이고 화면이 깨지거나 빈 채로 남지 않는지.
