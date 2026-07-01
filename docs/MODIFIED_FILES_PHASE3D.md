# MODIFIED_FILES_PHASE3D.md

## v3-r3 변경분 (추가 개선)

신규/삭제 파일 없음 — 전부 기존 파일 수정.

| 파일 | 수정 내용 |
|---|---|
| `docs/PARENT_PAGE_CONSTITUTION.md` | "Tier까지만 확인 가능" 문구 삭제, 원칙 6번 본문을 지표명 없이 완전 추상화. |
| `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` | "v3-r3 신규 반영" 섹션 추가(목표대비/과목별변화/주간변화/상담용요약 4개 + 문서 정리 1개 = 5개 항목). |
| `src/pages/parent/ParentGrowthReport.tsx` | 과목별 "목표 대비"·"이전 대비 변화" 표시, 리포트 탭에 "전주 대비" 증감 + "상담용 요약" 카드 신규 추가. |
| `src/pages/teacher/TeacherExamScores.tsx` | "문항별 정답률" 막대그래프 신규 추가(담당 학생 채점완료 기준). |

**재검증만 수행(코드 변경 없음)**: `src/pages/StudentList.tsx`, `src/pages/AttendanceStatus.tsx`
(요약 카드 클릭 필터가 v3-r1부터 이미 요구사항을 충족하고 있음을 확인), 선생님 전체
화면의 "채점"/"성적" 관련 표현(v3-r2에서 이미 정리 완료, 신규 위반 없음 확인).

---

## v3-r2 변경분 (v3-r1 반려 대응)

신규/삭제 파일 없음 — 전부 기존 파일 수정.

| 파일 | 수정 내용 |
|---|---|
| `src/pages/StudentList.tsx` | 메인 데이터 테이블을 `.axis-table-scroll`(max-height 620px)로 전환. |
| `src/pages/AttendanceStatus.tsx` | 메인 데이터 테이블을 `.axis-table-scroll`(max-height 620px)로 전환. |
| `src/pages/AssessmentList.tsx` | 행 전체 클릭(`cursor-pointer`+`onClick`) 제거, "상세 보기" `Button`으로 전환. |
| `src/pages/teacher/TeacherHome.tsx` | "최근 성적"→"최근 테스트 결과", "성적 보기"→"학생별 성적 보기". |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "최근 성적"→"최근 테스트 결과", "성적 데이터"→"테스트 결과 데이터", "수업노트 바로가기"→"수업자료에서 수업노트 확인", "수업노트 작성/확인하기"→"수업자료 열기"(링크도 `/teacher/materials?tab=notes`로 갱신). |
| `src/pages/teacher/TeacherGrades.tsx` | "성적 데이터"→"테스트 결과 데이터", "담당 학생 성적 확인"→"담당 학생 테스트 결과 확인". |
| `src/routes/TeacherRoutes.tsx` | 주석 "담당 학생 성적 확인"→"담당 학생 테스트 결과 확인". |
| `src/layouts/TeacherLayout.tsx` | `isActive` 로직의 구 `/teacher/videos` 죽은 코드 제거, "채점 탭"→"시험지 탭" 주석 정리. |
| `src/layouts/ParentLayout.tsx` | "자녀 성장(Emblem/SP/Tier)" 표현 정리. |
| `src/pages/parent/ParentHome.tsx` | 헌법 원칙에 6번째 항목 추가, Rival/Emblem/SP 나열식 주석 4곳 정리. |
| `src/pages/parent/ParentGrowthReport.tsx` | 헤더 주석 정리. |
| `docs/PARENT_PAGE_CONSTITUTION.md` | 5개→6개 원칙 갱신(신규 원칙 추가 + 1·2번 원칙 본문 정확성 수정). |
| `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` | 도입부 원칙 문구 정리. |
| `docs/APPLY_ORDER_PHASE3D.md` | github-upload zip 구조를 diff→전체 프로젝트 패키지로 전환 명시. |

---

## v3-r1 변경분 (v3 반려 대응 + 추가 요구사항)

### v3-r1 신규 파일

| 파일 | 내용 |
|---|---|
| `src/pages/student/StudentRival.tsx` | 학생용 Rival 조회 화면(Foundation, 신규 라우트 연결). |
| `src/lib/parentComments.ts` | 선생님이 학부모용으로 작성하는 공개 코멘트(내부 상담기록과 분리). |
| `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` | 학부모 페이지 체류시간 강화 아이디어 기록. |

### v3-r1 물리 삭제 파일

| 파일 | 사유 |
|---|---|
| `src/pages/student/StudentFinance.tsx` | 어디서도 import되지 않는 것을 확인 후 stub 상태에서 완전 삭제. |

### v3-r1 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/routes/StudentRoutes.tsx` | `/student/my`, `/student/target-preview`, `/student/growth`, `/student/rival` 실제 컴포넌트 연결. |
| `src/pages/StudentList.tsx` | 요약 카드 → 클릭 가능 필터 카드(재원/휴원/퇴원/미납), 필터명 라벨, 행 전체 클릭 제거. |
| `src/pages/AttendanceStatus.tsx` | 요약 카드 → 클릭 가능 필터(상태별 + 알림발송 신규 필터), 필터명 라벨. |
| `src/pages/growth/EmblemManagement.tsx` | Hooks 규칙 위반 수정, 팝업 max-height/드래그핸들범위/ESC 수정, 표 wrapper 전환. |
| `src/pages/growth/RivalManagement.tsx` | Hooks 규칙 위반 수정, 표 wrapper 전환. |
| `src/pages/growth/GrowthOverview.tsx` | "상세" 링크→Button 전환, 표 wrapper 전환(학생목록+SP지급이력 2개). |
| `src/pages/settings/PermissionSettings.tsx` | 표 wrapper 전환. |
| `src/pages/teacher/TeacherExamScores.tsx` | 표 wrapper 전환, 결과보기 모달에 평균/최고점 비교 막대 그래프 추가. |
| `src/pages/teacher/TeacherStudents.tsx` | 카드 목록 → 표 형태 전환(sticky header). |
| `src/pages/AssessmentList.tsx`, `AssessmentDetail.tsx` | 표 wrapper 전환(총 4개 표). |
| `src/index.css` | `.axis-table-scroll` 신규 패턴 추가(bounded height + 내부 스크롤 + sticky thead top:0). |
| `src/layouts/TeacherLayout.tsx` | 하단 네비 라벨 "채점"→"시험지". |
| `src/pages/teacher/TeacherExamGradingGuard.tsx` | 타이틀 "채점"→"내 시험지 관리". |
| `src/pages/teacher/TeacherGrades.tsx` | 타이틀 "성적 확인"→"학생별 성적". |
| `src/pages/parent/ParentHome.tsx` | 성장 리포트 카드에서 Tier/Emblem/SP 노출 완전 제거, GrowthContext 의존 제거. |
| `src/pages/parent/ParentGrowthReport.tsx` | **전면 재작성** — 탭(테스트/출결/목표대학/리포트) + 기간필터 + SVG 그래프 + 시험 상세 모달 + 학부모 공개 코멘트, Rival/Emblem/SP 완전 제거. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "학부모 공개 코멘트 작성" 섹션 신규 추가. |
| `src/pages/student/StudentGrades.tsx` | `ScoreVsAvgBar`에 최고점 막대 추가. |
| `src/utils/dateUtils.ts` | `getLocalDateStr()`에 선택적 Date 인자 추가(하위 호환, 과거 날짜 포맷팅 재사용 목적). |

---

## v3 변경분 (반려 대응 — v2는 GitHub 업로드 금지)

### v3 신규 파일

| 파일 | 내용 |
|---|---|
| `src/pages/teacher/TeacherMaterials.tsx` | 수업영상/학습자료 + 수업노트를 실제 로컬 탭으로 통합한 화면. |
| `src/pages/teacher/TeacherExamScores.tsx` | "내 시험지 관리"에서 시험지 클릭 시 보이는 학생별 성적(조회+정정) 화면. |
| `src/lib/accountActionLog.ts` | 비밀번호/닉네임 초기화 실행 로그(audit mock, localStorage 기반). |

### v3 수정 파일

| 파일 | 수정 내용 |
|---|---|
| `src/pages/teacher/TeacherHome.tsx` | "시험 채점"→"내 시험지", "수업노트" 카드 제거(수업자료 하나로 통합), "채점하기" 바로가기 문구를 "내 시험지 보기"로 조정. |
| `src/pages/teacher/TeacherExams.tsx` | 화면 제목 "채점"→"내 시험지 관리". 시험지 카드 전체 클릭 시 학생별 성적 화면으로 이동(nested-anchor 방지를 위해 outer는 div+navigate, inner "채점하기"만 실제 Link). |
| `src/pages/teacher/TeacherStudents.tsx` | 학생 카드 전체 클릭 제거, "상세보기" 명시적 버튼으로 교체. |
| `src/pages/teacher/TeacherStudentDetail.tsx` | "계정 관리" 섹션 신규(비밀번호/닉네임 초기화 버튼 + 확인 모달 + 감사로그 기록). |
| `src/pages/teacher/TeacherVideos.tsx`, `TeacherNotes.tsx` | `TeacherMaterials.tsx`로 통합되어 더 이상 라우팅되지 않음 — 안전한 빈 stub(`return null`)으로 교체. |
| `src/routes/TeacherRoutes.tsx` | `/teacher/materials` 라우트 추가, `/teacher/videos`·`/teacher/notes`를 해당 탭으로 리다이렉트, `/teacher/exams/:examId/scores` 라우트 추가. |
| `src/pages/StudentDetail.tsx` | 관리자용 "닉네임 초기화" 버튼 추가(기존 "비밀번호 초기화" 옆), 기존 비밀번호 초기화 실행부에 감사로그 기록 추가(v2까지는 로그 없이 toast만 있었음). |
| `src/lib/studentProfile.ts` | `StudentProfileData.lastNicknameChangedAt` 필드, 14일 제한 로직(`canChangeNicknameNow`), 학생용 게이트된 저장(`setStudentNickname` 반환형 변경: `void`→`{ok,reason?}`), 관리자/교사용 `resetStudentNickname` 추가. |
| `src/pages/student/StudentMyPage.tsx` | 닉네임 변경 14일 게이트 적용, 안내 문구 추가, 쿨다운 중 버튼 비활성화 + 남은 일수 표시. |
| `src/lib/rbac.ts` | `student.nicknameReset` 권한 키 추가(6개 직급 배열에 `student.passwordReset`과 동일하게 부여). |
| `src/contexts/AuthContext.tsx` | `canResetNickname(studentId)` 추가. **로그인 하이픈 정규화**(`normalizePhoneDigits`) 추가 — v2 이후 별도 요청으로 반영. |
| `src/pages/settings/PermissionSettings.tsx` | "학생 닉네임 초기화" 권한 매트릭스 행 추가. |
| `src/pages/student/StudentGrades.tsx` | `ResultDetailModal`을 `export`로 전환(StudentHome.tsx에서 재사용). |
| `src/pages/student/StudentHome.tsx` | "최근 성적" 카드 클릭 시 `ResultDetailModal`을 홈에서 바로 열도록 변경(테스트 메뉴 재진입 불필요). |
| `src/pages/parent/ParentTargetSummary.tsx` | "상담 리포트" 표현을 "선생님 안내 필요" 수준으로 조정, 비기능 화살표 아이콘 제거. |
| `src/pages/LoginPage.tsx` | 안내 문구를 "하이픈 없이 입력 가능"으로 갱신. |

---

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

---

## Phase 3D v3-r4 (parent engagement + risk alerts, 트랜치 1)

### 신규 파일 (NEW)
- `src/lib/observationSignals.ts` — 관찰 필요 신호 산출(순수 함수) + 배지 스타일.
- `src/components/ObservationPanel.tsx` — "확인 필요한 학생" 공유 강조 패널.

### 수정 파일 (MODIFIED)
- `src/index.css` — `.axis-sidebar` 높이 100dvh 고정 + overflow:hidden(모바일 사이드바 잘림 해결).
- `src/components/AdminLayout.tsx` — `<nav>`에 `min-h-0`, `<aside>` `h-full` 제거(높이 CSS 일원화).
- `src/pages/teacher/TeacherHome.tsx` — 담당 학생 기준 ObservationPanel 연결.
- `src/pages/StudentList.tsx` — 관리자 랜딩 상단 전체 학생 기준 ObservationPanel 연결.

### 문서 (DOCS)
- `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` / `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md`
  / `docs/MODIFIED_FILES_PHASE3D.md` / `docs/APPLY_ORDER_PHASE3D.md` — v3-r4 섹션 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r4-r1 (briefing insight completion) — v3-r4 반려 후 재작성

기준: GitHub main v3-r3 + 유지 지시 3항목(아래 "유지" 표시). v3-r4 산출물은 미채택.

### 신규 파일 (NEW)
- `src/lib/parentInsightEngine.ts` — 학부모 객관 지표 8종 엔진(AI 호출 없음).
- `src/lib/studentBriefingEngine.ts` — 자동 브리핑 5+1종 엔진(AI 호출 없음).

### 유지(v3-r4에서 그대로 가져옴, 이번 라운드 변경 없음)
- `src/lib/observationSignals.ts` — 단, 이번 라운드에 **확장**됨(아래 MODIFIED 참조).
- `src/components/ObservationPanel.tsx` — 변경 없음.
- `.axis-sidebar` 모바일 스크롤 수정(`src/index.css`, `src/components/AdminLayout.tsx`) —
  변경 없음.

### 수정 파일 (MODIFIED)
- `src/lib/observationSignals.ts` — 신호 3종 추가(결석/지각 증가, 숙제 미제출 증가,
  목표 대비 보완 과목 악화), `computeSubjectGaps()` 신규 헬퍼, `StudentSignalBundle`
  타입 별칭, `AttendanceRecordLite`/`HomeworkItemLite`/`SubjectGapLite` 신규 타입.
- `src/pages/teacher/TeacherHome.tsx` — 확장된 신호 계산을 위해 출결/숙제/과목갭 데이터
  수집 추가(useHomeworkStatus 신규 사용, sessions/getForStudent 활용 확대).
- `src/pages/StudentList.tsx` — 동일 확장(useAttendance/useHomework/useHomeworkStatus
  신규 사용).
- `src/pages/teacher/TeacherStudentDetail.tsx` — "담당 학생 빠른 브리핑" 카드 신규 추가
  (useHomework/useHomeworkStatus 신규 사용, parentInsightEngine/studentBriefingEngine 연결).
- `src/pages/parent/ParentHome.tsx` — "객관 지표"/"상담 전 확인 카드"/"자녀에게 해줄 말"
  3개 섹션 신규 추가(parentInsightEngine/studentBriefingEngine 연결). 기존 표시 로직
  (수강 반/출결 요약/성적/숙제/콘텐츠/수납)은 변경 없음.

### 문서 (DOCS)
- `docs/PARENT_PAGE_ENGAGEMENT_IDEAS.md` — v3-r4 섹션에 반려 표시 추가, v3-r4-r1 섹션 신규.
- `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md` / `docs/MODIFIED_FILES_PHASE3D.md` /
  `docs/APPLY_ORDER_PHASE3D.md` — v3-r4-r1 섹션 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r5 (teacher exam structure cleanup)

기준: v3-r4-r1(GitHub 업로드 승인됨).

### 수정 파일 (MODIFIED) — 16개
- `src/lib/assessmentData.ts` — EXAM_CATEGORIES에서 national-mock/school-record/
  weekly-suneung 제거, TEACHER_CREATABLE_EXAM_CATEGORY_IDS/ADMIN_CREATABLE_EXAM_CATEGORY_IDS 신규.
- `src/lib/phase2dData.ts` — GRADE_TABS 'suneung' 탭·EXAM_TYPE_MAP에서 weekly-suneung 제거.
- `src/components/AssessmentFormModal.tsx` — 시험 종류 선택지 역할별 분리(교사/관리자).
- `src/pages/teacher/TeacherExams.tsx` — candidateExams에 카테고리 필터 추가.
- `src/pages/teacher/TeacherExamScores.tsx` — visibleExam 판정에 카테고리 조건 추가.
- `src/pages/teacher/TeacherGrades.tsx` — gradedExams에 카테고리 필터 추가.
- `src/pages/teacher/TeacherExamGradingGuard.tsx` — 카테고리 가드 추가(불변 파일 자체는 미수정).
- `src/pages/teacher/TeacherHome.tsx` — candidateExams(미채점/최근 성적 위젯)에 카테고리 필터 추가.
- `src/pages/student/StudentMockExams.tsx` — 수능실전 주간 루틴 진입 카드 제거, 미사용 import 정리.
- `src/pages/parent/ParentMockExams.tsx` — 동일.
- `src/pages/student/StudentWeeklyMocks.tsx` — 화면 타이틀 "수능실전모의고사 결과"로 변경.
- `src/pages/parent/ParentWeeklyMocks.tsx` — 화면 타이틀 "자녀 수능실전모의고사 결과"로 변경.
- `src/routes/StudentRoutes.tsx` / `src/routes/ParentRoutes.tsx` — 라우트 주석 정리(코드 주석만).
- `src/lib/teacherMockExamInput.ts` — getMockExamLabel() 표시 문자열 "수능실전모의고사"로 정정.
- `src/pages/teacher/TeacherUniversityData.tsx` — 성적표 헤더/시험 종류 표시 텍스트 정정.

### 문서 (DOCS)
- `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md` / `docs/MODIFIED_FILES_PHASE3D.md` /
  `docs/APPLY_ORDER_PHASE3D.md` — v3-r5 섹션 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r6 (employee/emblem/rival/class/score fixes)

기준: v3-r5(GitHub 업로드 승인됨).

### 신규 파일 (NEW)
- `src/lib/scoreExportEngine.ts` — 성적 Excel/PDF 출력 계산 전용 엔진(권한 판정 없음).
- `src/components/ScoreExportPanel.tsx` — 성적 출력 공용 UI(시험/반/학생 선택 + 미리보기
  + Excel/PDF 버튼 + 인쇄 전용 A4 레이아웃).
- `src/pages/ScoreExportPage.tsx` — 관리자 성적 출력 페이지(`/admin/scores/export`).
- `src/pages/teacher/TeacherScoreExport.tsx` — 강사 성적 출력 페이지(`/teacher/scores/export`).
- `src/pages/teacher/TeacherClassRoster.tsx` — 담당반 출석부형 학생 목록
  (`/teacher/classes/:classId`).

### 수정 파일 (MODIFIED)
- `src/pages/EmployeeList.tsx` — `useSearch()` 기반 등록 모달 트리거로 교체(근본 버그 수정),
  계정상태(활성/비활성) 토글 버튼 신규, 계정상태 필터 신규, breadcrumb 경로 오류 수정.
- `src/index.css` — `.axis-modal-drag-enter`(드래그 모달 전용 opacity 애니메이션) 신규,
  성적 출력 인쇄용 A4 스타일(`.axis-print-area`, `@media print`, `@page`) 신규.
- `src/pages/growth/EmblemManagement.tsx` — 모달 패널 클래스를 `modal-enter` →
  `axis-modal-drag-enter`로 교체(드래그-애니메이션 transform 충돌 해결).
- `src/pages/growth/RivalManagement.tsx` — 승/패/종료 버튼 및 종료 확인 모달 버튼에
  hover/active/focus-visible 상태 추가.
- `src/pages/teacher/TeacherClasses.tsx` — 운영중 반 카드를 클릭 가능하게 변경, 반 상세
  (출석부) 화면으로 연결.
- `src/pages/student/StudentGrades.tsx` — `ExamLineTrendChart` 신규 컴포넌트 및 섹션 추가
  (단원평가/내신대비모의고사 분리 선그래프), 기존 막대 그래프 유지.
- `src/lib/rbac.ts` — `canExportAcademyWideScores()` 신규(SUPER_ADMIN/DIRECTOR 전용).
- `src/routes/AdminRoutes.tsx` — `/admin/scores/export` 라우트 등록.
- `src/routes/TeacherRoutes.tsx` — `/teacher/classes/:classId`, `/teacher/scores/export`
  라우트 등록.
- `src/components/AdminLayout.tsx` — `children` 항목에 `requiresFn` 지원 추가, "성적 출력"
  메뉴 게이트를 `assessment.view`(권한 기반) → `canExportAcademyWideScores()`(역할 기반)로
  정밀화.
- `src/pages/teacher/TeacherExams.tsx` — "성적 출력" 진입 카드 링크 추가.
- `package.json` — `xlsx@^0.18.5` 의존성 추가.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r7 (QA architecture layout cleanup)

기준: v3-r6(소스 검수 통과).

### 수정 파일 (MODIFIED) — 25개
- `src/lib/assessmentData.ts` — isPendingGrading/isGradedSubmission 공용 헬퍼 신규.
- `src/contexts/AssessmentContext.tsx` — addExam/markAttended 초기 상태 응시예정→채점중.
- `src/pages/teacher/TeacherHome.tsx` / `TeacherExams.tsx` / `TeacherExamScores.tsx` —
  status 직접 비교 11곳을 공용 헬퍼로 교체.
- `src/layouts/TeacherLayout.tsx` / `StudentLayout.tsx` / `ParentLayout.tsx` — 데스크톱
  상단 내비게이션 신규, 모바일 하단 내비게이션 lg:hidden으로 전환.
- `src/pages/teacher/TeacherClasses.tsx` / `TeacherExams.tsx`(중복, 컨테이너 폭) /
  `src/pages/student/StudentGrades.tsx` / `src/pages/parent/ParentHome.tsx` — 컨테이너
  폭 확장 + 데스크톱 그리드 전환.
- `src/components/AdminLayout.tsx` — 성장관리 하위 메뉴에서 엠블럼관리/라이벌관리 제거.
- `src/pages/StudentDetail.tsx` — 성장/진열장 탭에 라이벌 승/패/종료 버튼 + 종료 확인
  모달 신규.
- `src/pages/growth/GrowthOverview.tsx` — 엠블럼/라이벌 전체 관리 보조 링크 추가,
  학생 상세 링크 `/admin` 접두사 누락 버그 수정.
- `src/pages/ClassList.tsx` / `EmployeeList.tsx` / `AttendanceCheck.tsx` /
  `NotificationHistory.tsx` / `NotificationTemplates.tsx` /
  `src/pages/teacher/TeacherStudentDetail.tsx` / `FinanceUnpaid.tsx` / `FinancePayments.tsx` /
  `FinanceSettlements.tsx` / `FinanceRefunds.tsx` / `FinanceStatistics.tsx` — axis-table-wrap
  → axis-table-scroll 표준 전환(sticky 헤더 수정).

### 문서 (DOCS)
- `docs/CHANGES_PHASE3D.md` / `docs/QA_PHASE3D.md` / `docs/MODIFIED_FILES_PHASE3D.md` /
  `docs/APPLY_ORDER_PHASE3D.md` — v3-r7 섹션 추가.

### 변경 없음(검증만 완료)
- `StudentFinance.tsx`(이미 삭제) / `StudentRoutes.tsx`(이미 일치) — 학생 재무 화면
  상태가 이미 완전히 일치되어 있어 코드 변경 없음.

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/pages/teacher/TeacherExamGrading.tsx`(3429a4ba)
  · `src/App.tsx`(387bbf48) · `src/lib/classData.ts`(126d9e5e)

---

## Phase 3D v3-r7-r1 (v3-r7 반려 대응 완결판)

기준: v3-r6(GitHub main). v3-r7 산출물은 반려.

### 정책 변경
- `TeacherExamGrading.tsx` 불변(MD5 고정) 지정 해제(명시적 지시) — 이제 불변 파일은
  `universityAnalysisAdapter.ts` / `App.tsx` / `classData.ts` 3종.

### 수정 파일 — Assessment 엔진 완성
- `src/pages/teacher/TeacherExamGrading.tsx` — 헬퍼 직접 적용(최초 수정, MD5 변경).
- `src/lib/assessmentData.ts` / `src/contexts/AssessmentContext.tsx` /
  `src/pages/teacher/TeacherExamGradingGuard.tsx` / `src/pages/teacher/TeacherExamScores.tsx`
  — 우회 주석 정리, addExam/markAttended 초기값 원복.
- `src/pages/AssessmentDetail.tsx` / `src/pages/AssessmentList.tsx` — admin 화면에
  남아있던 직접 status 비교 추가 정리.

### 수정 파일 — 성장관리 축소
- `src/pages/growth/GrowthOverview.tsx` — 전면 재작성(SP/엠블럼 지급 UI, 엠블럼/라이벌
  전체관리 버튼 제거).

### 수정 파일 — PC 최적화(6개 핵심 화면)
- `src/pages/teacher/TeacherHome.tsx` / `src/pages/teacher/TeacherExamGrading.tsx`(중복 표기,
  레이아웃 재구성) / `src/pages/teacher/TeacherStudentDetail.tsx` /
  `src/pages/student/StudentHome.tsx` / `src/pages/student/StudentGrades.tsx`(v3-r7 대비
  추가 확장) / `src/pages/parent/ParentHome.tsx`(v3-r7 대비 추가 확장).

### 수정 파일 — 브랜드 톤
- `src/pages/LoginPage.tsx` — 전면 재설계(다크 배경 제거, Ivory/Navy/Gold).
- 57개 파일 — 구 primary color(`oklch(0.511 0.262 276.966)`) → `#081F4D` 전역 치환(292건).
- `src/layouts/TeacherLayout.tsx` / `src/pages/growth/EmblemManagement.tsx` /
  `src/pages/growth/GrowthOverview.tsx` / `src/pages/StudentDetail.tsx` — 근사 골드
  (`#C9A84C`) → 정확한 `#C8A15A`(12건), 근사 네이비 → `#081F4D`(EmblemManagement 3건,
  StudentDetail 2건).

### 확인만 완료(이미 반영되어 있던 상태)
- `src/components/AdminLayout.tsx` / `src/layouts/StudentLayout.tsx` /
  `src/layouts/ParentLayout.tsx` / `src/index.css` — Navy/Gold 사이드바·로고·활성상태
  적용이 이미 되어 있는 상태를 확인(변경 불필요).

### 불변 유지(변경 없음) — MD5 확인
- `src/lib/universityAnalysisAdapter.ts`(1eddaef5) · `src/App.tsx`(387bbf48) ·
  `src/lib/classData.ts`(126d9e5e)
