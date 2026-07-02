# APPLY ORDER — Phase 3E v3-r16-r1 (University Recommendation Fast Attach)

기준: v3-r14-r3 + v3-r15-r1 + v3-r14-r4 위에 적용. 5개 파일은 서로 독립적인 화면이라
적용 순서 의존성이 없다. **이번 산출물은 diff 전용 패키지**(5개 코드 파일 + 문서 4개)이며,
전체 `src`나 `src/assets/emblems/**`, `tsconfig.*.tsbuildinfo`는 포함하지 않는다.

## 0) 금지 사항 재확인(반영 담당자 체크)

- [ ] 이 zip을 저장소에 압축 해제해 전체 덮어쓰기하지 않는다 — 아래 5개 파일만 개별 반영
- [ ] `src/assets/emblems/**` — 수정 금지(패키지에 포함되어 있지도 않음)
- [ ] `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` — 커밋 금지
- [ ] v3-r15-r1 파일(`examPrepGuideTypes.ts` 등 5종) — 수정 금지
- [ ] v3-r14-r4 파일(`RivalMatchupCard.tsx` 등 6종) — 수정 금지

## 1) 사전 확인

- `src/assets/emblems/` PNG 개수가 **69개**인지 확인.
- v3-r15-r1(내신 대비 가이드), v3-r14-r4(성장/Rival/Emblem UI)가 이미 반영되어 있는지 확인.
- 불변 파일 3종 MD5 확인:
  - `src/lib/universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f`
  - `src/App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c`
  - `src/lib/classData.ts` = `126d9e5e314de186bf1df0a63b3abf82`

## 2) 파일 반영 (순서 무관)

1. `src/pages/admin/UniversityReportManagement.tsx`
2. `src/pages/student/StudentTargetPreview.tsx`
3. `src/pages/parent/ParentTargetSummary.tsx`
4. `src/pages/teacher/TeacherUniversityData.tsx`
5. `src/pages/teacher/TeacherStudentDetail.tsx`

## 3) 반영 직후 필수 재확인

- [ ] `src/assets/emblems/**` — diff 0건.
- [ ] `src/lib/growthData.ts` / `AxisEmblemImageBadge.tsx` / `AxisTierMedallion.tsx` — MD5
      반영 전후 동일.
- [ ] `src/lib/universityAnalysisAdapter.ts` — MD5 반영 전후 동일(불변 파일, 이번 Phase
      대상 아님).
- [ ] v3-r15-r1 5개 파일, v3-r14-r4 6개 파일 — 전부 MD5 반영 전후 동일.
- [ ] `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` — 로컬 typecheck/build를
      돌렸다면 재생성될 수 있다. `.gitignore`의 `*.tsbuildinfo`로 커밋 대상이 아님을 확인.

## 4) 빌드/검증

- `npm ci`
- `npm run typecheck` (`tsc -b --noEmit`)
- `npm run build` (`tsc -b && vite build`)
- 이 검증 샌드박스에서 `npm ci`를 실제로 재시도했고 네트워크 정책(`E403`)으로 실패했다
  — `tsconfig.*.tsbuildinfo` 오염 여부를 실행 전후 MD5로 확인했으며 이상 없다. 실제
  통과 확인은 GitHub Actions에서 이루어져야 한다(대체 검증: 오프라인 스텁 tsc 하네스,
  수정 파일 5종 스코프 오류 0건 — `docs/QA_PHASE3E_v3_r16_r1.md` §A15 참고).
- GitHub Desktop → Commit(Summary: `Phase 3E v3-r16-r1: fast attach university
  recommendation flow`) → Push → **GitHub Actions Build Check 그린 확인**

## 5) 반영 후 수동 확인 포인트(요약 — 전체 체크리스트는 QA 문서)

- `/admin/university-reports` → 학생 선택 → "학생 상세에서 상세 분석 확인" 버튼이
  `/admin/students/{id}?tab=grades`로 정상 이동하는지, PDF/리포트 생성 버튼이 없고
  "어댑터"/"Phase 5.1 연동" 같은 표현이 화면에 보이지 않는지.
- `/student/target-preview` → 헤더/적합도/보완필요과목/데이터준비현황/상태요약만 기본
  노출되고, "과목별 상세 성적 보기"를 눌러야 나머지가 펼쳐지는지.
- `/parent/target-summary` → 기존과 동일하게 동작하는지(화면 변화 없음, import만 정리).
- `/teacher/university-data` → 탭 이름이 "상담 요약"으로 바뀌고, 요약 카드가 먼저
  보이고 "상담 원자료 보기"를 눌러야 데이터가 나오는지("Payload"/"Engine"/
  "AnalyzeRequest" 표현이 화면에 보이지 않는지).
- `/teacher/students/{id}` → "{학년별 라벨} 준비 상태" 섹션이 성장 상담 요약 아래에
  보이고, 데이터가 없는 학생은 "데이터 준비 중"으로 표시되는지, "대학추천 데이터에서
  확인/입력하기" 링크가 `/teacher/university-data`로 이동하는지.
