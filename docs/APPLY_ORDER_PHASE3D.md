# APPLY_ORDER_PHASE3D.md

## v2 적용 안내 (반려 대응)

**버전**: v2 — 이 섹션이 최신이다. v1 적용 안내는 아래 "(v1 원본)" 섹션에 보존.

### 전제 (v2)

이 zip(`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v2.zip`)은 Phase 3D v1
상태 위에 v2(반려 대응) 수정사항이 모두 반영된 **완전한 프로젝트 상태**다.
`-github-upload.zip`은 v1 대비 v2에서 변경/신규된 파일만 추린 diff 패키지다.

### GitHub 적용 순서 (v2 파일 덮어쓰기 순서, 의존 관계 고려)

**1단계 — 데이터/유틸 레이어 (다른 파일이 의존)**
1. `src/lib/rbac.ts` (`canManageCounseling`/`canViewAllCounseling` 추가)
2. `src/lib/counselingData.ts` (신규)
3. `src/lib/assessmentData.ts` (`Exam.createdByMode` 필드 추가)
4. `src/contexts/FinanceContext.tsx` (주석만 갱신, 로직 변경 없음)

**2단계 — Context (라우트/레이아웃이 의존)**
5. `src/contexts/AuthContext.tsx` (`isAuthenticated`/`login`/`logout`/`activeMode` 추가 —
   반드시 라우트 파일들보다 먼저 적용)
6. `src/contexts/AssessmentContext.tsx` (`NewExamInput.createdByMode` 반영)

**3단계 — 페이지 (Context에 의존)**
7. `src/pages/LoginPage.tsx` (신규)
8. `src/pages/student/StudentFinance.tsx` (stub 교체)
9. `src/pages/parent/ParentHome.tsx`, `ParentGrades.tsx`, `ParentFinance.tsx`,
   `ParentGrowthReport.tsx`, `ParentTargetSummary.tsx`, `ParentAttendance.tsx`,
   `ParentMockExams.tsx`, `ParentWeeklyMocks.tsx`
10. `src/pages/teacher/TeacherStudentDetail.tsx`
11. `src/pages/StudentDetail.tsx`
12. `src/components/AssessmentFormModal.tsx` (수능형 템플릿 100점 수정 + activeMode 전달)

**4단계 — 라우트/레이아웃 (LoginPage와 AuthContext에 의존 — 반드시 위 단계 이후 적용)**
13. `src/routes/RoleRoute.tsx` (`LoginPage` import — 7번보다 반드시 나중)
14. `src/routes/StudentRoutes.tsx`
15. `src/routes/ParentRoutes.tsx`
16. `src/components/AdminLayout.tsx`
17. `src/layouts/TeacherLayout.tsx`, `StudentLayout.tsx`, `ParentLayout.tsx`

**5단계 — 문서**
18. `docs/PARENT_PAGE_CONSTITUTION.md`(신규) + 갱신된 문서 4종 병합.

### 적용 후 수동 확인 권장 항목 (v2 추가분)

- [ ] 로그아웃 상태에서 `/`, `/admin`, `/teacher`, `/student`, `/parent`를 각각 직접
      URL로 접속해도 전부 로그인 페이지로 가는지 확인.
- [ ] 원장 계정(010-0000-0002 / 0002)으로 로그인 → 자동으로 `/admin`으로 이동하는지 확인.
- [ ] 원장/부원장 계정에서 "강사 모드" 전환 → `/teacher`로 이동하고 상단에 "관리자 모드로
      돌아가기" 바가 보이는지, 다시 눌러 관리자모드로 복귀되는지 확인.
- [ ] "로그인 상태 유지" 체크 후 로그인 → 브라우저 새로고침해도 로그인이 유지되는지,
      미체크 상태에서는 탭을 완전히 닫았다 새로 열면 로그인이 풀리는지 확인.
- [ ] 시험등록에서 "수능형" 템플릿 적용 → 만점이 정확히 100점으로 표시되는지 확인.
- [ ] 학부모로 로그인 → 홈 화면에 총 청구/납부 금액이 전혀 보이지 않고 미납 유무 배지만
      보이는지, "상담 리포트" 카드가 더 이상 없는지, "성장 리포트" 카드를 누르면
      `/parent/growth`(Tier/Emblem/SP 화면)로 정상 진입되는지 확인.
- [ ] 학부모 "테스트" 탭에서 카드를 눌러 상세를 열고, IF 요약이 조회 전용으로만 보이는지
      (선택/수정 버튼이 없는지) 확인.
- [ ] 강사로 로그인 → 담당 학생 상세에서 "상담 기록 추가"로 기록을 남긴 뒤, 원장 계정으로
      해당 학생의 관리자 상세 화면 "상담 기록" 탭에서 방금 작성한 기록이 조회되는지 확인.
      학생/학부모 계정으로는 이 정보에 접근할 방법이 전혀 없는지도 함께 확인.
- [ ] `/student/finance`로 직접 URL 접속 시 `/student`로 즉시 리다이렉트되는지 확인.

⚠️ v1에서 지적했던 "수능형 104점 문제"는 v2에서 코드 레벨로 완전히 해결했다(더 이상
경고 필요 없음). 새로 남은 확인 필요 항목은 `CHANGES_PHASE3D.md`의 "§GPT 전달 의견"
섹션 참조(채점 기록 activeMode 미반영 등).

---

## (v1 원본)

## 전제

이 zip(`axis-lms-v1_2-phase3d-ui-ux-interaction-exam-template-v1.zip`)은 Phase 3C v2
베이스라인 위에 Phase 3D(UI/UX 개선) 수정사항이 모두 반영된 **완전한 프로젝트 상태(full
package)**다. `-github-upload.zip`은 이 상태에서 Phase 3C 대비 변경/신규 파일만 추린 diff
패키지다(node_modules 미포함, 단일 루트 구조).

## GitHub 적용 순서

### A. full package를 그대로 사용하는 경우

1. 기존 저장소 내용을 전부 이 zip 내용으로 교체(또는 새 브랜치로 체크아웃 후 전체 복사).
2. `npm install` 실행(이 작업 환경에서는 네트워크 제한으로 로컬 스텁 검증만 수행 —
   실제 설치는 GitHub Actions 또는 로컬 개발 환경에서 필수 수행).
3. `npm run typecheck`(`tsc -b --noEmit`) 통과 확인 — 로컬 스텁 기반 검증에서는 0 errors.
4. `npm run build` 통과 확인.
5. 통과하면 커밋.

### B. github-upload(diff) 패키지를 기존 저장소에 적용하는 경우

1. 기존 저장소가 Phase 3C v2 상태인지 먼저 확인.
2. 파일 덮어쓰기 순서(의존 관계 고려):
   1. `src/components/ui/alert-dialog.tsx` (다른 파일이 새 동작에 의존하지는 않지만, 공용
      컴포넌트이므로 먼저 적용해 이후 `AssessmentFormModal.tsx` 적용 시 함께 검증되도록)
   2. `src/hooks/useDraggableModal.ts` (신규 파일 — `EmblemManagement.tsx`가 의존하므로
      반드시 그보다 먼저 추가)
   3. `src/index.css` (신규 CSS 클래스 — 이후 적용되는 모든 페이지 파일이 참조)
   4. `src/pages/growth/EmblemManagement.tsx`
   5. `src/pages/settings/PermissionSettings.tsx`
   6. `src/components/AssessmentFormModal.tsx`
   7. `src/pages/student/StudentGrades.tsx`
   8. `src/pages/AssessmentList.tsx`
   9. `src/pages/AssessmentDetail.tsx`
   10. `src/pages/teacher/TeacherExams.tsx`
3. `npm install && npm run typecheck && npm run build` 실행.
4. `docs/` 폴더에 신규 문서 4종(`CHANGES_PHASE3D.md`, `QA_PHASE3D.md`,
   `MODIFIED_FILES_PHASE3D.md`, `APPLY_ORDER_PHASE3D.md`) 병합.

## 적용 후 수동 확인 권장 항목

- [ ] 엠블럼관리(`/growth/emblems`) 팝업을 열고 제목 영역을 드래그해 이동 → 화면 밖으로
      완전히 나가지 않는지, 모바일 폭에서는 드래그가 비활성화되는지 확인.
- [ ] 엠블럼관리·권한설정·시험및성적관리(목록/상세)·내시험지관리 각 표를 스크롤해 헤더가
      고정되는지, 컬럼 정렬이 깨지지 않는지 확인.
- [ ] 시험등록(관리자) 또는 내 시험 만들기(교사)에서 "수능형"/"내신형 대시" 템플릿 버튼을
      눌러 문항이 자동 생성되는지, 정답이 입력된 상태에서 다시 누르면 확인 모달이 뜨는지
      확인.
- [ ] 문항 구성에서 스테퍼(−/+)로 문항을 추가/삭제하고, 정답이 입력된 마지막 문항을
      삭제하려 할 때 확인 모달이 뜨는지, 그리고 그 확인 모달의 배경을 클릭했을 때 확인
      모달만 닫히고 시험등록 모달 전체는 닫히지 않는지 확인(§ AlertDialog 버그 수정 검증).
- [ ] 학생 화면 테스트 카드에 마우스를 올렸을 때 그림자/테두리가 바뀌는지, 성적표 상세
      팝업에서 내용을 스크롤해도 제목/닫기 버튼이 항상 보이는지 확인.

⚠️ 위 §"수능형 템플릿 배점 104점 vs 100점 불일치" 관련 원장님 확인 필요 —
`CHANGES_PHASE3D.md` §"적용 우선순위 3" 참조.
