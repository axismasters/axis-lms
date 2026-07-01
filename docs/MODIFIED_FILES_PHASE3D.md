# MODIFIED_FILES_PHASE3D.md

## v2 변경분 (반려 대응)

### v2 신규 파일

| 파일 | 내용 |
|---|---|
| `src/pages/LoginPage.tsx` | 첫 화면 로그인 페이지(휴대폰번호+비밀번호, 로그인 상태 유지). |
| `src/lib/counselingData.ts` | 상담 기록 데이터 모듈(localStorage 기반, Provider 불필요). |
| `docs/PARENT_PAGE_CONSTITUTION.md` | 학부모 페이지 헌법 5개 원칙 문서. |

### v2 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/contexts/AuthContext.tsx` | `isAuthenticated`/`login()`/`logout()`/세션 저장(localStorage·sessionStorage) 추가. `activeMode`(ADMIN_MODE/TEACHER_MODE) + `canSwitchMode` + `setActiveMode()` 추가(원장/부원장 전용). 부원장 데모 계정(`u-vice-director`) 추가. |
| `src/routes/RoleRoute.tsx` | 비인증 시 모든 포털 라우트를 `/`(로그인)로 리다이렉트. `RootRedirect`가 비인증 시 `LoginPage` 직접 렌더링. 원장/부원장이 TEACHER_MODE일 때 `/teacher/**` 접근 허용 로직 추가. |
| `src/components/AdminLayout.tsx` | 사이드바 하단에 로그아웃 버튼 + 원장/부원장 전용 관리자모드/강사모드 토글 추가. |
| `src/layouts/TeacherLayout.tsx` | 헤더에 로그아웃 버튼 추가. 원장/부원장이 강사모드로 들어와 있을 때 "관리자 모드로 돌아가기" 상단 바 추가. |
| `src/layouts/StudentLayout.tsx` | 헤더에 로그아웃 버튼 추가. |
| `src/layouts/ParentLayout.tsx` | 헤더에 로그아웃 버튼 추가. 하단 탭 "성적"→"테스트" 이름 변경, "모의고사" 탭을 "성장" 탭으로 교체(5탭 한도 내에서 헌법 요구 흐름 우선). |
| `src/pages/parent/ParentHome.tsx` | 수납 상태 총액 표시 제거(미납 유무 배지만), "상담 리포트" 죽은 링크 카드 제거, "성장 리포트" 진입 카드 신규 추가(Tier/Emblem/SP 미리보기), "성적"→"테스트" 명칭 통일, 컨테이너 폭 확장(PC 최적화), 상단에 학부모 페이지 헌법 요약 주석 추가. |
| `src/pages/parent/ParentGrades.tsx` | "성적"→"테스트" 명칭 통일, `ParentResultDetailModal` 신규 추가(IF 조회 전용 상세), 카드 클릭 가능하게 전환, 컨테이너 폭 확장. |
| `src/pages/parent/ParentFinance.tsx` | 상단 총 청구/완납/미납 3분할 금액 그리드 제거, 미납 유무 배지로 대체(개별 청구서 금액은 유지), 컨테이너 폭 확장. |
| `src/pages/parent/ParentGrowthReport.tsx` | 컨테이너 폭 확장(PC 최적화)만 — 기능은 기존 그대로(원래 완성되어 있었으나 라우트 미등록으로 접근 불가였음). |
| `src/pages/parent/ParentTargetSummary.tsx` | 컨테이너 폭 확장만. |
| `src/pages/parent/ParentAttendance.tsx`, `ParentMockExams.tsx`, `ParentWeeklyMocks.tsx` | 컨테이너 폭 확장만(`max-w-lg`→`max-w-3xl`). |
| `src/routes/ParentRoutes.tsx` | `/parent/growth`, `/parent/target-summary` 라우트 신규 등록(기존에 페이지는 있었으나 라우트 누락으로 404였음). |
| `src/routes/StudentRoutes.tsx` | `StudentFinance` import/라우트 제거, `/student/finance`→`/student` 강제 리다이렉트로 교체. |
| `src/pages/student/StudentFinance.tsx` | `useFinance()` 호출 없는 완전 inert stub으로 교체. |
| `src/contexts/FinanceContext.tsx` | 학생 재무 차단 관련 주석을 실제 상태와 일치하도록 갱신. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | 상담 기록 섹션 신규 추가(목록 테이블 + 추가 모달, 담당 학생 스코프 내). 컨테이너 폭 확장. |
| `src/pages/StudentDetail.tsx` | "상담 기록" 탭 신규 추가(최고관리자/원장 전용, 조회만). 헤더 주석의 기존 "상담기록 독립 탭 두지 않음" 방침을 갱신. |
| `src/lib/rbac.ts` | `canManageCounseling()`, `canViewAllCounseling()` 헬퍼 함수 추가. |
| `src/lib/assessmentData.ts` | `Exam.createdByMode` 필드 추가(원장/부원장 모드 전환 로깅용, optional). |
| `src/contexts/AssessmentContext.tsx` | `NewExamInput.createdByMode` 추가, `addExam()`이 이를 저장하도록 반영. |
| `src/components/AssessmentFormModal.tsx` | **수능형 템플릿 배점 수정**(30문항 104점 → 30문항 정확히 100점). `addExam()` 호출 시 `createdByMode: activeMode` 전달. |

---

## (v1 원본)

## 신규 파일

| 파일 | 내용 |
|---|---|
| `src/hooks/useDraggableModal.ts` | 팝업 드래그 이동 훅. 중앙 정렬 기본값, Pointer Capture 기반 드래그, 화면 밖 이탈 방지(clamp), 모바일(768px 미만)에서 드래그 비활성화. |

## 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/index.css` | Phase 3D 공용 CSS 유틸리티 추가: `.axis-th-sticky`(+`-56`/`-52` 오프셋 모디파이어), `.axis-card-clickable`(hover 그림자/테두리), `.axis-modal-drag-handle`(grab/grabbing 커서). |
| `src/pages/growth/EmblemManagement.tsx` | 테이블 헤더 sticky 적용(top 56px, box-shadow 방식 — border-collapse 대응). 등록/수정 팝업에 드래그 이동 적용, 헤더/바디/푸터 스크롤 분리. 숨김 토글·활성 토글·수정 버튼 클릭 어포던스 강화(Button 컴포넌트 전환). |
| `src/pages/settings/PermissionSettings.tsx` | 권한 매트릭스 테이블 헤더(기능 + 7개 직급 컬럼) sticky 적용(top 56px). |
| `src/components/AssessmentFormModal.tsx` | 수능형(30문항)/내신형 대시(24문항) 기본 템플릿 추가. 문항 추가/삭제 좌우 스테퍼(−/+) 추가, 최소 문항 수 제한, 입력값 손실 가능성 있는 삭제·템플릿 적용 시 확인 모달(AlertDialog) 추가. 문항 삭제 아이콘 버튼 스타일 개선. |
| `src/components/ui/alert-dialog.tsx` | 배경(오버레이) 클릭 핸들러에 `stopPropagation()` 추가 — 상위 `Dialog`에 중첩됐을 때 배경 클릭으로 상위 모달까지 함께 닫히던 버그 수정(공용 컴포넌트 레벨 수정, Phase 3D 작업 중 발견). |
| `src/pages/student/StudentGrades.tsx` | `TestCard`(테스트 카드)에 `axis-card-clickable` 클래스 추가(hover 그림자/테두리). `ResultDetailModal`(시험 성적표 상세) 헤더 고정 + 바디만 스크롤되도록 구조 변경, 닫기 버튼 아이콘 버튼화. |
| `src/pages/AssessmentList.tsx` | 시험 목록 테이블 헤더 sticky 적용(top 56px). 행 끝 "상세" 표시 칩 스타일로 보강. |
| `src/pages/AssessmentDetail.tsx` | 응시자목록/채점현황/결과분석("학생별 결과") 3개 테이블 모두 헤더 sticky 적용(top 56px). "결석 처리/결석 취소", "정정" 텍스트 링크를 Button 컴포넌트로 전환. |
| `src/pages/teacher/TeacherExams.tsx` | "채점하기" 텍스트 링크를 Button 컴포넌트(배경색 있는 실제 버튼)로 전환. |

## 변경하지 않은 것 (명시적 확인)

- 불변 파일 4종: `App.tsx`, `TeacherExamGrading.tsx`, `universityAnalysisAdapter.ts`,
  `classData.ts` — MD5 완전 동일(QA 문서 참조).
- `src/lib/assessmentData.ts`의 `ExamScope`/`EXAM_SCOPE_LABELS`/scope 관련 함수 — 전혀 수정
  없음.
- `TeacherExamGradingGuard.tsx`, `TeacherRoutes.tsx`, `AdminRoutes.tsx` — 라우팅/권한 가드
  구조 미변경.
- `src/pages/student/StudentFinance.tsx` — 기존 stub 상태 그대로 유지.
