# MODIFIED_FILES_PHASE3A_2.md

## 반려 대응(v2)에서 추가로 수정된 파일

| 파일 | 수정 내용 |
|---|---|
| `src/layouts/StudentLayout.tsx` | `BarChart2` lucide-react import 추가 |
| `src/lib/universityPayloadAdapter.ts` | `getRecommendationFitScore()`, `getSubjectImprovementNeeds()` 신규 함수 추가 |
| `src/pages/teacher/TeacherUniversityData.tsx` | 내신 입력표 "+ 과목 추가" 구조로 변경(`visibleSubjectIds`/`expandedSubjectIds` 상태 추가), 데이터현황·Payload 탭에 적합도 표시 추가 |
| `src/pages/student/StudentTargetPreview.tsx` | 적합도 게이지 + 보완 필요 과목 섹션 추가 |
| `src/pages/admin/UniversityReportManagement.tsx` | 존재하지 않는 `canAccessStudentData` dead import 제거 (Phase 3A 베이스라인 사전 결함) |
| `src/pages/parent/ParentGrowthReport.tsx` | `SchoolRecord.year`/`StudentSPLog.description` 존재하지 않는 필드 참조 수정 (Phase 3A 베이스라인 사전 결함) |
| `src/pages/student/StudentGrowthShowcase.tsx` | `SchoolRecord.year`/`StudentSPLog.description`/`StudentEmblem.achievedAt` 존재하지 않는 필드 참조 수정 (Phase 3A 베이스라인 사전 결함) |

---

## (1차 문서 원본)

## 베이스라인

`axis-lms-v1_2-phase3a-role-based-portal-rebuild-v1.zip`(내부 루트 `axis-lms-phase2e/`,
Phase 3A 완료 상태) 기준.

## 병합 순서 (실제 수행)

1. Phase 3A 베이스라인 전체 복사
2. `axis-lms-v1_2-phase3a-1-role-based-portal-buildfix-v1-github-upload.zip`의
   `github-upload-3a1b/src/**` 전체를 베이스라인 위에 덮어쓰기
3. `diff -rq github-upload-3a1/src github-upload-3a1b/src` 실행 결과, `github-upload-3a1`에만
   존재한 `src/pages/parent/ParentHome.tsx`를 추가로 병합
4. Phase 3A-2 자체 수정사항 적용(아래 목록)

## diff -rq 원본 실행 결과 (추측 없이 그대로 기록)

```
$ diff -rq github-upload-3a1/src github-upload-3a1b/src

Files github-upload-3a1/src/layouts/TeacherLayout.tsx and github-upload-3a1b/src/layouts/TeacherLayout.tsx differ
Only in github-upload-3a1b/src/lib: teacherMockExamInput.ts
Only in github-upload-3a1b/src/lib: teacherSchoolRecordInput.ts
Only in github-upload-3a1b/src/lib: universityPayloadAdapter.ts
Only in github-upload-3a1/src/pages: parent
Files github-upload-3a1/src/pages/student/StudentTargetPreview.tsx and github-upload-3a1b/src/pages/student/StudentTargetPreview.tsx differ
Files github-upload-3a1/src/pages/teacher/TeacherUniversityData.tsx and github-upload-3a1b/src/pages/teacher/TeacherUniversityData.tsx differ

$ diff -rq github-upload-3a1/docs github-upload-3a1b/docs
(차이 없음 — 문서는 동일)
```

## Phase 3A-1 병합으로 반영된 파일 (3a1b 기준, 3a1의 parent 변경 포함)

| 파일 | 출처 | 비고 |
|---|---|---|
| src/layouts/StudentLayout.tsx | 3a1b | |
| src/layouts/TeacherLayout.tsx | 3a1b (이후 Phase 3A-2에서 재수정) | |
| src/lib/teacherAcademicInput.ts | 3a1b | 레거시, `/teacher/academic-input`에서 계속 사용 중이라 유지 |
| src/lib/universityRecommendationPayload.ts | 3a1b | 레거시, 현재 미사용 확인(다른 파일에서 import 없음) — 삭제하지 않고 보존만 |
| src/lib/teacherSchoolRecordInput.ts | 3a1b (신규, 이후 Phase 3A-2에서 재수정) | |
| src/lib/teacherMockExamInput.ts | 3a1b (신규) | |
| src/lib/universityPayloadAdapter.ts | 3a1b (신규, 이후 Phase 3A-2에서 재수정) | |
| src/pages/teacher/TeacherUniversityData.tsx | 3a1b (이후 Phase 3A-2에서 재수정) | |
| src/pages/teacher/TeacherAcademicInput.tsx | 3a1b (신규, 레거시 유지) | |
| src/pages/student/StudentGrades.tsx | 3a1b (이후 Phase 3A-2에서 재수정) | |
| src/pages/student/StudentTargetPreview.tsx | 3a1b | |
| src/pages/student/StudentHome.tsx | 3a1b | |
| src/routes/TeacherRoutes.tsx | 3a1b | |
| **src/pages/parent/ParentHome.tsx** | **3a1 (diff로 확인 후 병합, 3a1b 누락분)** | |

## Phase 3A-2 자체 수정 파일 (이번 작업)

| 파일 | 변경 내용 | 필수/권장 |
|---|---|---|
| `src/layouts/TeacherLayout.tsx` | 미사용 `TrendingUp` import 제거 | 필수(원 스펙 4번) |
| `src/lib/universityPayloadAdapter.ts` | `require()` → ESM import 전환, `ADAPTER_VERSION`/`adapterVersion` 필드 추가, `any` 캐스팅 제거 | 필수 |
| `src/lib/teacherSchoolRecordInput.ts` | `SchoolSubjectDef.evaluationType` 필드 추가(26과목 전체 지정) | 필수 |
| `src/pages/teacher/TeacherUniversityData.tsx` | Fragment key 경고 수정, 성취도/석차등급 조건부 렌더링, Payload 미리보기에 adapterVersion 표시 | 필수(Fragment는 원 스펙 5번) |
| `src/lib/assessmentData.ts` | `StudentExamResult`에 `averageScore`/`highestScore`/`participantCount`/`myRank`/`wrongQuestions` 추가, `computeExamStatistics()`/`computeWrongQuestions()` 신규, `getPublishedResultsForStudent()` 수정 | 필수(빌드 버그 수정) + 권장(IF quick-tap 기반 데이터) |
| `src/lib/studentIfAnalysis.ts` | `IfQuestionEntry`/`calcIfAnalysisFromQuestions()`/`getIfMotivationCommentFromQuestions()` 신규 추가(기존 함수는 fallback용으로 보존) | 권장(원 스펙 7번) |
| `src/pages/student/StudentGrades.tsx` | `ResultDetailModal`을 문항별 quick-tap 구조로 교체(오답 문항 데이터 없는 legacy 시험은 기존 방식 fallback) | 권장(원 스펙 7번) |
| `src/contexts/FinanceContext.tsx` | `useFinance()` 훅에 학생 role 데이터 차단 로직 추가(`STUDENT_SAFE_FINANCE` 스텁) | 필수(원 스펙 1번) |
| `src/lib/universityRecommendationPayload.ts` | 구버전 payload adapter 초안(`teacherAcademicInput.ts`에 이미 삭제된 `TeacherInputGradeRecord` 참조로 깨져 있던 dead file) 격리(`export {}`) — `include: ["src"]` 설정상 미참조 파일이라도 `tsc -b` 전체 컴파일을 실패시켰던 결함 | 필수(빌드 버그 수정, QA 문서 §13) |

## v2 라운드 추가 변경 (반려 대응)

| 파일 | 변경 내용 | 비고 |
|---|---|---|
| `src/pages/StudentDetail.tsx` | "합격 가능성" 포함 실제 UI 문구 3곳을 승인 표현으로 교체 | 필수(v2 반려 사유 1번) |
| `src/pages/admin/UniversityReportManagement.tsx` | 안내 배너의 금지 표현 나열 문구를 승인 표현으로 교체 | 필수(v2 재검수 중 추가 발견) |
| `src/lib/studentGradeInput.ts` → `src/lib/universityMenuLabel.ts` | 파일명 변경(신규 생성 + 구 파일 삭제), STUDENT_INPUT/PENDING_REVIEW 리터럴 제거 | 필수(v2 반려 사유 2번) |
| `src/pages/admin/StudentInputGradeReview.tsx` | 물리 삭제(기존 `export {}` 스텁에서 완전 삭제로 변경) | 필수(v2 반려 사유 2번) |
| `src/layouts/StudentLayout.tsx`, `src/pages/parent/ParentTargetSummary.tsx`, `src/pages/admin/UniversityReportManagement.tsx`, `src/pages/teacher/TeacherUniversityData.tsx`, `src/pages/teacher/TeacherStudentGrowth.tsx`, `src/pages/student/StudentGrowthShowcase.tsx`, `src/pages/student/StudentMyPage.tsx`, `src/pages/student/StudentTargetPreview.tsx`, `src/pages/student/StudentHome.tsx` | `@/lib/studentGradeInput` → `@/lib/universityMenuLabel` import 경로 일괄 수정 | 필수(파일명 변경에 따른 연쇄 수정) |
| `src/lib/universityPayloadAdapter.ts` | 상대경로 import(`./studentGradeInput` → `./universityMenuLabel`) 수정 | 필수(파일명 변경에 따른 연쇄 수정) |
| `docs/QA_PHASE3A_2.md` | v2 최종 검수 결과만 남도록 전면 재작성 | 필수(v2 반려 사유 4번) |

## 신규 문서

- `docs/CHANGES_PHASE3A_2.md`
- `docs/QA_PHASE3A_2.md`
- `docs/MODIFIED_FILES_PHASE3A_2.md`(이 파일)
- `docs/APPLY_ORDER_PHASE3A_2.md`

## 변경하지 않은 불변 파일 (확인만 수행)

- `src/lib/universityAnalysisAdapter.ts` — 미수정
- `src/pages/teacher/TeacherExamGrading.tsx` — 미수정(IF 관련 로직이 이 파일에 없음을 확인함)
- `src/App.tsx` — 미수정(FinanceContext 학생 차단 방식 설계 시 이 파일의 Provider 순서를
  읽기 전용으로 확인만 함 — CHANGES 문서 10항 참조)
- `src/lib/classData.ts` — 미수정
