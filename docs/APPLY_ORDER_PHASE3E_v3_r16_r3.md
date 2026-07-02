# APPLY ORDER — Phase 3E v3-r16-r3 (대학추천 신뢰도 향상)

기준: **v3-r16-r2 반영 완료 GitHub main** 위에 적용. 이번 산출물은 최신 main 전체에
신규 1개 + 수정 5개 파일 + 문서 4개를 더한 전체 zip이다.

## 0) 금지 사항 재확인(반영 담당자 체크)

- [ ] 첨부 zip(`phase6_1`, `v3-r15-r2`) 전체 소스 덮어쓰기 — 하지 않았음(참고만)
- [ ] 합격률/합격 가능성/안정합격/불합격/컷 통과 표현 — 없음(grep 검증 완료)
- [ ] 배치표 원점수/표준점수/백분위 컷을 UI에 직접 표시 — 하지 않음
- [ ] 특정 대학 합격선처럼 보이는 수치 노출 — 없음(대학 DB 자체가 없음)
- [ ] 대교협/시행계획/배치표 원자료명 UI 노출 — 없음
- [ ] 원자료 미첨부 상태에서 임의 컷/기준 생성 — 하지 않음(순수 데이터-완비도 기반 계산)
- [ ] 학생 화면 재무/수납/청구/미납/환불/영수증 노출 — 없음(기존 원칙 유지)
- [ ] 학부모 화면 Rival/Emblem/SP/Tier 노출 — 없음(기존 원칙 유지)
- [ ] `src/assets/emblems/**` 수정 — 하지 않음(69개 유지)
- [ ] `src/lib/growthData.ts` 수정 — 하지 않음
- [ ] `AxisEmblemImageBadge.tsx` / `AxisTierMedallion.tsx` 수정 — 하지 않음
- [ ] 신규 라우트 추가 — 없음
- [ ] 신규 메뉴 추가 — 없음
- [ ] RBAC 권한 추가 — 없음
- [ ] 독립 대학추천 엔진을 새로 만들거나 기존 LMS 구조 덮어쓰기 — 하지 않음(기존
      `universityPayloadAdapter.ts`/`universityCounselingSummary.ts` 구조를 그대로 두고
      확장 필드로만 연결)

## 1) 반영 순서

1. `src/lib/universityReliabilityEngine.ts` 추가(신규)
2. `src/lib/universityCounselingSummary.ts` 교체(확장 필드 추가)
3. `src/pages/student/StudentTargetPreview.tsx` 교체
4. `src/pages/parent/ParentTargetSummary.tsx` 교체
5. `src/pages/teacher/TeacherUniversityData.tsx` 교체
6. `src/pages/admin/UniversityReportManagement.tsx` 교체
7. `docs/CHANGES_PHASE3E_v3_r16_r3.md` / `docs/QA_PHASE3E_v3_r16_r3.md` /
   `docs/MODIFIED_FILES_PHASE3E_v3_r16_r3.md` / `docs/APPLY_ORDER_PHASE3E_v3_r16_r3.md` 추가
8. `npm ci` → `npm run typecheck` → `npm run build` (로컬)
9. GitHub Desktop 커밋 — 변경 파일이 위 6개 코드 파일 + docs 4개**만** 표시되는지 확인
   후 커밋. Summary:
   `Phase 3E v3-r16-r3: improve university recommendation reliability`
10. push 후 GitHub Actions Build Check 통과 확인

## 2) 수동 QA

`docs/QA_PHASE3E_v3_r16_r3.md`의 학생/학부모/선생님/관리자 4개 화면 시나리오와
교차 확인 항목을 그대로 수행할 것.

## 3) 산출물명

`axis-lms-v1_2-phase3e-university-reliability-engine-v3-r16-r3-github-upload.zip`
