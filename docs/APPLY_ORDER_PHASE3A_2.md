# APPLY_ORDER_PHASE3A_2.md

## 전제

이 zip(`axis-lms-v1_2-phase3a-2-student-test-university-recommendation-finalfix-v2.zip`)은
Phase 3A 베이스라인 위에 Phase 3A-1(3a1b 기준 + 3a1의 parent 병합) + Phase 3A-2 수정사항이
모두 반영된 **완전한 프로젝트 상태(full package)**다. github-upload zip은 이 상태에서 Phase
3A 대비 변경/신규 파일만 추린 diff 패키지다.

## GitHub 적용 순서

### A. full package를 그대로 사용하는 경우
1. 기존 저장소 내용을 전부 이 zip 내용으로 교체(또는 새 브랜치로 체크아웃 후 전체 복사).
2. `npm install` 실행(이 작업 환경에서는 네트워크 제한으로 미실행 — 로컬에서 필수 수행).
3. `npm run build` 실행해 `tsc -b` 통과 확인.
4. 통과하면 커밋.

### B. github-upload(diff) 패키지를 기존 저장소에 적용하는 경우
1. 기존 저장소가 Phase 3A 상태(또는 그 이후)인지 먼저 확인.
   - 이미 Phase 3A-1(3a1 또는 3a1b)이 적용되어 있다면, 아래 "3A-2 자체 수정 파일"만 덮어써도
     된다.
   - 아직 Phase 3A 상태라면(3A-1 미적용) github-upload 패키지 전체를 그대로 덮어쓴다.
2. 파일 덮어쓰기 순서(의존 관계 고려):
   1. `src/lib/teacherSchoolRecordInput.ts` (evaluationType 필드 포함)
   2. `src/lib/teacherMockExamInput.ts`
   3. `src/lib/universityPayloadAdapter.ts` (require 제거, adapterVersion 포함 — 위 두 lib에
      의존하므로 반드시 이후에 적용)
   4. `src/lib/assessmentData.ts` (StudentExamResult 확장 — StudentGrades.tsx가 의존)
   5. `src/lib/studentIfAnalysis.ts` (assessmentData.ts의 WrongQuestionInfo 타입과 함께 사용)
   6. `src/contexts/FinanceContext.tsx` (AuthContext import 추가 — AuthContext.tsx 자체는
      변경 없음)
   7. `src/layouts/StudentLayout.tsx`, `src/layouts/TeacherLayout.tsx`
   8. `src/pages/teacher/TeacherUniversityData.tsx`, `TeacherAcademicInput.tsx`
   9. `src/pages/student/StudentGrades.tsx`, `StudentTargetPreview.tsx`, `StudentHome.tsx`
   10. `src/pages/parent/ParentHome.tsx`
   11. `src/routes/TeacherRoutes.tsx`
   12. `src/lib/teacherAcademicInput.ts`, `src/lib/universityRecommendationPayload.ts`
       (레거시 — `TeacherAcademicInput.tsx`가 여전히 참조하므로 함께 포함해야 함)
3. `npm install && npm run build` 실행.
4. `docs/` 폴더의 신규 문서 4종을 프로젝트 docs에 병합.

## 적용 후 필수 확인 사항

- [ ] `npm run build` (`tsc -b && vite build`) 성공
- [ ] `/student/grades`(테스트) 화면 진입 → 오답이 있는 시험의 상세 모달에서 IF 채점이
      문항별 quick-tap으로 뜨는지 확인
- [ ] `/teacher/university-data` → 내신성적 탭에서 한국사/통합사회/통합과학은 성취도만,
      나머지 과목은 석차등급만 입력 가능한지 확인
- [ ] `/teacher/university-data` → Payload 탭에서 `adapterVersion: "3a2-1"`이 표시되는지 확인
- [ ] 학생 계정으로 로그인 후 브라우저 콘솔에서 재무 관련 데이터에 접근 불가한지 확인(React
      DevTools로 FinanceContext 값을 봐도 학생 role에서는 `useFinance()` 소비 지점 기준으로는
      빈 값만 보임 — Provider 내부 raw state 자체는 구조적 한계로 존재하나 소비 경로는 전부
      차단됨, CHANGES 문서 10항 참조)
- [ ] `/teacher/parent`(학부모) 홈 화면 정상 렌더링 확인(3a1 병합분)

## 롤백 방법

Phase 3A-1(github-upload-3a1b) 상태로 되돌리려면 "Phase 3A-2 자체 수정 파일" 8개
(`MODIFIED_FILES_PHASE3A_2.md` 참조)만 3a1b 원본으로 되돌리면 된다. 단, `assessmentData.ts`의
`StudentExamResult` 필드 추가분을 되돌리면 `StudentGrades.tsx`(3a1b)가 다시 빌드 실패 상태로
돌아가므로, 롤백 시에는 `StudentGrades.tsx`도 함께 3a1b 원본으로 되돌려야 한다(부분 롤백 금지
— assessmentData.ts와 StudentGrades.tsx는 항상 함께 이동).
