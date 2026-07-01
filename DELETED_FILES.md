# 이 diff 패키지 적용 시 함께 삭제해야 할 파일

Phase 3A 베이스라인 대비, 아래 2개 파일은 이번 Phase 3A-2(v2)에서 물리 삭제되었다.
diff/패치 방식의 특성상 "삭제"는 zip에 파일이 없는 것으로는 표현되지 않으므로,
기존 저장소에 이 패키지를 적용할 때 아래 파일을 수동으로 삭제해야 한다.

- `src/lib/studentGradeInput.ts` → `src/lib/universityMenuLabel.ts`로 대체(개명 후 구 파일 삭제)
- `src/pages/admin/StudentInputGradeReview.tsx` → 완전 삭제(대체 파일 없음, 참조 0건 확인됨)
