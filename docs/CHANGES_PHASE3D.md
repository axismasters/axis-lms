# CHANGES_PHASE3D.md

## 반려 대응 (v3)

**버전**: v3 — v2는 GitHub 업로드 금지 상태였다. 이 섹션이 최신 내용이며, v2/v1 내용은
아래에 각각 보존한다("(v2 반려 대응 — v1 대비)"와 "(v1 원본)" 섹션).

작업명: Phase 3D v3 — 선생님 UX 정리 + 계정 관리(비밀번호/닉네임 초기화) + 학생 성적 진입 개선

### 1. 선생님 홈 메뉴 정리 — "시험 채점" → "내 시험지 관리"

- `TeacherHome.tsx`의 빠른 실행 카드 "시험 채점" → **"내 시험지"**로 변경.
- `TeacherExams.tsx` 화면 제목을 "채점" → **"내 시험지 관리"**로 변경.
- 시험지 카드 자체(전체)를 클릭하면 `/teacher/exams/:examId/scores`(§7 참조, 신규 화면)로
  이동해 시험지를 만들고 학생별 성적을 확인하는 공간으로 재구성했다. "채점하기"는 미채점
  인원이 있을 때만 카드 안에 보이는 보조 버튼으로 남겼다(클릭 시 이벤트 버블링을 막아
  카드 전체 클릭과 충돌하지 않게 처리).
- 홈 화면의 "미채점 시험" 섹션 상단 바로가기 문구도 "채점하기" → "내 시험지 보기"로 조정해,
  "채점"이 화면 전체의 대표 동사처럼 보이지 않게 했다.

### 2. 수업노트/수업자료 중복 제거

- `TeacherHome.tsx`에서 "수업노트" 카드를 제거하고 "수업자료" 카드 하나만 남겼다
  (경로 `/teacher/materials`).
- 신규 `TeacherMaterials.tsx`: 기존 `TeacherVideos.tsx`(수업영상/학습자료)와
  `TeacherNotes.tsx`(수업노트)의 화면 내용을 각각 탭 컴포넌트로 그대로 옮기고, 진짜
  로컬 상태 탭으로 한 화면 안에서 전환되게 했다. (v1까지는 두 화면이 서로를 `<Link>`로
  가리키는 "탭처럼 보이지만 실제로는 페이지 이동"이었다 — 이번에 실제 탭으로 바꿨다.)
- `TeacherRoutes.tsx`: `/teacher/materials` 라우트를 추가하고, 기존 `/teacher/videos`,
  `/teacher/notes`는 각각 대응하는 탭으로 리다이렉트(`?tab=videos`, `?tab=notes`)하도록
  했다 — 구 경로로 들어와도 화면이 깨지지 않는다.
- 이제 쓰이지 않는 `TeacherVideos.tsx`/`TeacherNotes.tsx`는 물리 삭제 대신 안전한 빈
  stub(`return null`)으로 교체했다(다른 파일이 실수로 다시 import해도 빈 화면만 뜨고
  에러가 나지 않도록).

### 3. 담당 학생 목록 — 카드 클릭 대신 명시적 버튼

- `TeacherStudents.tsx`: 학생 카드 전체를 감싸던 `<Link>`를 제거하고, 카드는 보기 전용
  정보(이름/반/상태)만 표시한다. 우측에 별도 **"상세보기"** 버튼(`Button variant="outline"`)을
  추가해 이 버튼을 눌렀을 때만 `/teacher/students/:studentId`로 이동한다.

### 4. 선생님 학생 상세 — 비밀번호 초기화 / 닉네임 초기화

- `TeacherStudentDetail.tsx`에 "계정 관리" 섹션 신규 추가. `canResetPassword`/
  `canResetNickname`(모두 `canAccessStudent` 스코프 체크 포함)를 통과할 때만 각 버튼이
  보인다 — 강사는 항상 본인 담당 학생 범위로만 제한된다.
- **비밀번호 초기화**: 기존 비밀번호는 어디에도 표시하지 않는다. 확인 모달에서
  "기존 비밀번호는 표시되지 않습니다"를 명시하고, 실행 후 toast로만 완료를 안내한다.
- **닉네임 초기화**: 선생님이 새 닉네임을 대신 정하지 않는다 — `resetStudentNickname()`이
  닉네임을 비우고 14일 변경 제한(§5)도 함께 해제해서, 학생이 마이페이지에서 즉시 새
  닉네임을 설정할 수 있게 한다.
- 두 액션 모두 실행 전 확인 모달을 거치며, 신규 `src/lib/accountActionLog.ts`
  (localStorage 기반 audit mock — App.tsx가 불변이라 Provider 없이 구현)에
  실행자 id/이름/activeMode/대상 학생/시각을 기록한다.
- **관리자(원장/부원장/최고관리자) 측**: 기존에 `StudentDetail.tsx`(Back Office)에 이미
  구현되어 있던 "비밀번호 초기화" 버튼 옆에 동일한 방식으로 "닉네임 초기화" 버튼을
  추가했다 — `canResetNickname()`이 dataScope=ALL_ACADEMY인 원장/부원장/최고관리자에게는
  사실상 전체 학생을 대상으로 허용한다. 기존 비밀번호 초기화 실행부에도 이번에
  `logAccountAction()` 호출을 추가해 감사로그가 실제로 남도록 보완했다(v2까지는 toast만
  띄우고 로그가 전혀 없었다).

### 5. 닉네임 14일 변경 제한

- `src/lib/studentProfile.ts`의 `StudentProfileData`에 `lastNicknameChangedAt: string | null`
  필드 추가.
- `NICKNAME_CHANGE_COOLDOWN_DAYS = 14`, `canChangeNicknameNow(studentId)`(허용 여부 +
  남은 일수), 학생 본인 변경용 `setStudentNickname(studentId, nickname)`(게이트 통과 시에만
  저장하고 타이머 갱신), 관리자/교사용 `resetStudentNickname(studentId)`(닉네임 비우고
  타이머도 함께 해제) 함수를 신규 작성했다.
- `StudentMyPage.tsx`: 안내 문구를 정확히 지시된 문장으로 추가했다 — "닉네임은 Rival,
  Emblem, 성적 진열장에서 사용됩니다. 닉네임은 2주에 한 번만 변경할 수 있습니다." 14일이
  지나지 않았으면 "수정/설정" 버튼을 비활성화하고 "다음 변경까지 N일 남았습니다"를 표시한다.

### 6. RBAC 정합성 — `student.nicknameReset`

- `rbac.ts`의 `PERMISSION_KEYS`에 `student.nicknameReset` 추가.
- 기본 권한은 **`student.passwordReset`과 정확히 동일한 위치에 동일하게 부여**했다
  (SUPER_ADMIN은 `ALL`로 자동 포함, DIRECTOR/VICE_DIRECTOR/HEAD_MANAGER/TEAM_LEAD/STAFF/
  TEACHER 각 배열에 `student.passwordReset` 바로 옆에 추가) — 지시사항의 "최고관리자·
  원장·부원장 가능, 강사는 담당 학생만, 행정/실장/팀장은 기존 권한 철학과 충돌 없이"를
  만족하면서, 이미 검증된 `passwordReset` 배포 패턴을 그대로 재사용해 새로운 정책 판단
  오류 위험을 최소화했다.
- `PermissionSettings.tsx` 권한 매트릭스의 "학생관리" 카테고리에 **"학생 닉네임 초기화"**
  행을 "학생 비밀번호 초기화" 바로 아래에 추가.
- `AuthContext.tsx`에 `canResetNickname(studentId)` 추가 — `student.nicknameReset` 권한 +
  `canAccessStudent(studentId)` 범위를 모두 통과해야 한다(요구사항 그대로). 대상이 항상
  STUDENT 계정이므로 `canResetPassword`처럼 계정유형별 분기는 필요 없어 더 단순하게 구현했다.

### 7. 내 시험지 관리 UX — 학생별 성적 화면 신규

- 신규 `TeacherExamScores.tsx`(`/teacher/exams/:examId/scores`): 시험지 카드를 클릭하거나
  "학생별 성적"을 누르면 진입하는 화면. 표시 항목은 지시사항 그대로
  **학생명 / 채점상태 / 점수·만점 / 응시·결시 상태 / 결과 보기 / 채점하기 또는 정정**.
  - "결과 보기": 점수/코멘트/정정 이력을 보여주는 조회 전용 모달.
  - "채점하기": 아직 미채점인 학생만 노출, `TeacherExamGrading.tsx`(불변)로 이동.
  - "정정": 이미 채점 완료된 학생만 노출, 이 화면 안에서 바로 새 점수+사유를 입력해
    `correctScore()`(기존 AssessmentContext 함수, 강사도 `assessment.resultCorrect` 권한
    보유)를 호출한다.
  - 결석 학생도 목록에 함께 표시된다 — `TeacherExamGrading.tsx`(불변)는 결석 학생이
    통째로 빠지는 한계가 있어, 그 한계를 보완하는 화면으로 별도 신설했다(불변 파일은
    전혀 수정하지 않았다).
- Phase 3C 원칙 이중 방어 유지: `TEACHER_PRIVATE` 시험은 `ownerTeacherId === 본인`일 때만
  이 화면에서도 접근 가능하다(다른 교사의 개인 시험지는 여기서도 절대 보이지 않는다).

### 8. 학생 홈 "최근 성적" 카드 → 바로 상세

- `StudentGrades.tsx`의 `ResultDetailModal`을 `export`로 전환해 재사용 가능하게 했다.
- `StudentHome.tsx`: "최근 성적" 카드를 `axis-card-clickable` 버튼으로 바꾸고, 클릭 시
  `ResultDetailModal`을 홈 화면에서 바로 연다(더 이상 "테스트" 메뉴로 들어가서 다시
  시험지를 클릭할 필요가 없다). `sameCategoryResults`(같은 시험군 추이 비교용)는 홈에서
  보여주는 3건이 아니라 전체 공개 결과 목록을 기준으로 정확하게 계산해서 넘긴다.
- IF 채점은 기존과 동일하게 이 상세 모달 안에서만 조회/선택 가능하며, 별도 IF 메뉴는
  추가하지 않았다(요구사항 그대로).

### 9. 학부모/상담 안전 재확인

- `ParentTargetSummary.tsx`의 "상담 리포트는 선생님에게 문의하세요" 표현이 마치 클릭하면
  내부 상담 기록을 볼 수 있는 것처럼 오해될 수 있어(실제로는 어디로도 이동하지 않는 장식용
  화살표가 붙어 있었다), 문구를 **"자세한 안내는 선생님에게 문의하세요"**로 조정하고
  클릭 가능해 보이는 화살표(ChevronRight)도 제거했다(애초에 클릭해도 아무 일도 일어나지
  않는 요소였다 — 클릭 어포던스 원칙에도 맞지 않았다).
- 학부모 홈 수납 상태는 v2와 동일하게 총액 없이 "미납 있음"/"미납 없음" 배지만 유지(변경 없음,
  재확인만 완료).
- 상담 기록 원문 노출 0건 재검증: `counselingData`/`getCounselingRecords`를 학생·보호자
  화면 어디에서도 import하지 않음을 grep으로 재확인.

### 10. 문서 정리

- 이 문서(v3 최상단)에서 "수능형 104점" 문제는 **Phase 3D v2에서 이미 코드 레벨로
  해결되었고(30문항 정확히 100점), v3에서도 재검증했다**는 것을 명확히 한다 — 더 이상
  미해결 이슈가 아니다. 문서 하단의 "(v2 반려 대응 — v1 대비)"와 "(v1 원본)" 섹션에 남아
  있는 104점 관련 서술은 전부 **그 시점 기준의 히스토리 기록**이며 현재 상태를 나타내지
  않는다.
- QA/MODIFIED_FILES/APPLY_ORDER 문서도 동일한 방식(v3 섹션 최상단 추가, 이전 버전은
  아래에 보존)으로 정리했다.

### 부가: 하이픈 없는 로그인 지원 (v2 종료 후 별도 요청 반영)

Phase 3D v2 산출물 전달 후, 데모 로그인 시 휴대폰번호에 하이픈을 입력할 수 없는 환경
(모바일 `tel` 키패드는 보통 '-'가 없음)에서 로그인이 실패하는 문제가 보고되어 v3에
포함해 함께 수정했다. `AuthContext.tsx`의 `login()`이 휴대폰번호를 숫자만 남긴 뒤
비교하도록 정규화했다 — "010-0000-0002"와 "01000000002" 모두 동일 계정으로 인식된다.
데모 비밀번호 규칙(번호 뒤 4자리)도 동일한 정규화 함수를 사용하도록 통합했다.
로그인 페이지의 안내 문구도 "하이픈 없이 입력 가능"으로 갱신했다.

---

## (v2 반려 대응 — v1 대비)

**버전**: v2 — v1 반려 사유 전체 대응. 이 섹션이 최신 내용이며, v1 원본은 아래
"(v1 원본)" 섹션에 그대로 보존한다.

작업명: Phase 3D — UI/UX Interaction Clarity & Web-Optimized Parent/Teacher Safety Update v2

### 1. PC 웹 최적화 우선

이번 v2에서 새로 만들거나 크게 손댄 화면(로그인 페이지, 학부모 화면 전체, 선생님 학생상세의
상담 기록 섹션)은 모바일 좁은 폭(`max-w-lg`, 512px) 대신 `max-w-2xl`~`max-w-3xl`
(672~768px) 컨테이너를 사용하도록 조정했다. 상담 기록은 카드 스택 대신 컴팩트 테이블
형태로 구성해 관리자/교사 화면답게 스캔하기 쉽게 만들었다. 기존에 이미 완성되어 있던
관리자/학생/교사 화면 전체를 이번에 다시 손대지는 않았다(범위가 너무 커지고, 이미
Phase 3D v1에서 사용성 개선을 마친 화면들이라 회귀 위험이 큼) — 대신 새로 만드는 화면부터
이 원칙을 적용하고, 기존 화면 전체 재설계는 다음 Phase 후보로 남겨둔다(§GPT 전달 의견 참조).

### 2. 수능형 시험 템플릿 오류 수정 — 코드 자체를 100점으로 고침

`AssessmentFormModal.tsx`의 `buildSuneungTemplate()` 배점 구간을 아래처럼 재계산해
**30문항 · 총점 정확히 100점**으로 고정했다(v1의 104점 문제를 경고 문서만 남기지 않고
코드로 직접 수정):

| 문항 범위 | 배점 | 문항수 | 소계 |
|---|---|---|---|
| 1~6번 | 2점 | 6문항 | 12점 |
| 7~14번 | 3점 | 8문항 | 24점 |
| 15~22번 | 4점 | 8문항 | 32점 |
| 23~30번(선택과목) | 4점 | 8문항 | 32점 |
| **합계** | | **30문항** | **100점** |

내신형 대시(24문항·100점 자동배분)는 v1과 동일하게 유지(이미 100점이었음). 템플릿 버튼
클릭 한 번으로 30문항 100점 구성이 즉시 생성되는 동작, 입력값 손실 확인 모달 모두 그대로
유지했다.

### 3~4. 학부모 화면을 학생 화면과 동기화 + 학부모 페이지 헌법

- **"성적" → "테스트" 동기화**: `ParentLayout.tsx` 하단 탭, `ParentHome.tsx`, `ParentGrades.tsx`
  전체에서 "성적" 표기를 "테스트"로 통일했다.
- **깨져 있던 라우트 복구**: `ParentRoutes.tsx`에 `/parent/growth`(→`ParentGrowthReport.tsx`)와
  `/parent/target-summary`(→`ParentTargetSummary.tsx`) 라우트가 아예 등록되어 있지 않아서
  `ParentHome.tsx`의 "목표대학 추천 요약" 카드를 눌러도 404였다(v1 이전부터 있던 버그).
  두 라우트를 연결했다 — `ParentGrowthReport.tsx`는 이미 Tier/Emblem/SP/성적추이/IF요약까지
  전부 구현되어 있었는데 라우트 미등록으로 접근 불가 상태였을 뿐이었다.
- **IF는 "테스트 성적표 상세" 안에서만, 조회 전용**: `ParentGrades.tsx`에 `ParentResultDetailModal`을
  신규 추가 — 학생이 이미 완료한 IF 회고 결과(IF 점수/놓친 점수/문항별 사유)를 보여주되,
  선택/수정 UI는 전혀 넣지 않았다(`getIfRecordForExam()`으로 조회만). IF 사유는 기존 3개
  (계산 실수/개념 부족/시간 부족) 그대로이며 추가하지 않았다.
- **학부모 페이지 헌법 신규 문서화**: `docs/PARENT_PAGE_CONSTITUTION.md` 작성(5개 원칙) +
  `ParentHome.tsx` 상단 주석에 동일 원칙 요약 반영.
- **Tier/Emblem 홈 노출**: `ParentHome.tsx`에 "성장 리포트" 카드를 신규 추가해 Tier 배지 +
  획득 엠블럼 수 + SP를 홈 화면에서 바로 보여주고 `/parent/growth`로 연결(눌러보고 싶게
  만드는 진입점). Rival 상대방 식별 정보는 기존 정책대로 계속 노출하지 않는다
  (`ParentGrowthReport.tsx` 자체 정책 주석 참조 — Tier까지만 노출).

### 5. 학부모 수납 상태 UI 정리

- `ParentHome.tsx` "수납 상태" 섹션: 총 청구/미납 금액 표시를 완전히 제거하고 "미납 있음"
  (빨간 배지)/"미납 없음"(초록 배지)만 표시. 0원 표시 없음.
- `ParentFinance.tsx`: 상단 "총 청구/완납/미납" 3분할 금액 요약 그리드를 제거하고, 안내
  배너 옆에 동일한 미납 유무 배지만 표시. 다만 **개별 청구서(월별) 카드의 청구액/미납액은
  그대로 유지**했다 — 이건 총액 과시가 아니라 학부모가 실제로 얼마를 내야 하는지 알아야
  납부가 가능한 최소한의 정보라 판단했다(§GPT 전달 의견 참조, 이견 있으면 조정 가능).

### 6. 상담 기록 권한/노출 정책 수정

- `ParentHome.tsx`에서 "상담 리포트 — 선생님 상담 기록을 조회합니다" 카드(`/parent/consulting`
  링크)를 완전히 제거했다. 실제로는 `ParentConsultingReport` 페이지/라우트 자체가 어디에도
  존재하지 않았고(파일 검색 결과 0건), `ParentHome.tsx`의 죽은 링크 하나만 있었다 — 그
  링크를 제거하는 것으로 조치 완료.
- **신규 데이터 모듈** `src/lib/counselingData.ts`: 상담 기록(상담일/유형/대상/내용/작성자/
  작성일 + 작성 당시 activeMode) — App.tsx가 불변이라 새 Context Provider를 추가할 수
  없으므로, `studentIfRecord.ts`와 동일하게 Provider 없이 localStorage 기반 모듈 함수로
  구현했다.
- **작성 화면**: `TeacherStudentDetail.tsx`에 "상담 기록" 섹션 추가(테이블 목록 + 추가 모달).
  상담 유형(학부모 상담/학사 상담/학습 상담/기타), 상담 대상(학부모/학생/내부 논의) 모두
  요구사항 그대로 구현.
- **조회 화면(관리자)**: `StudentDetail.tsx`(관리자 학생 상세)에 "상담 기록" 탭을 신규
  추가 — **조회 전용**, 최고관리자/원장만 노출(`canViewAllCounseling()`). 기존에 있던
  "상담기록 독립 탭은 두지 않는다"는 방침 주석은 이번 지시에 따라 갱신했다(이유를 파일
  상단 주석에 남겼다 — 기존 "운영메모" 자유텍스트 기록과는 별개 기능임을 명시).
- **권한**: `rbac.ts`에 `canManageCounseling()`(TEACHER/DIRECTOR/SUPER_ADMIN — 반드시
  `canAccessStudent()`와 함께 스코프 제한), `canViewAllCounseling()`(SUPER_ADMIN/DIRECTOR
  전용) 추가. 학생/보호자 화면에는 이 모듈을 어디서도 import하지 않았다(0건 재검증 완료).

### 7. 원장/부원장 관리자모드/강사모드

- `AuthContext.tsx`에 `activeMode`('ADMIN_MODE'|'TEACHER_MODE') 상태 + `setActiveMode()`
  + `canSwitchMode`(DIRECTOR/VICE_DIRECTOR만 true) 추가. 별도 강사 계정을 만들지 않고,
  **같은 계정**이 관리자모드/강사모드를 오가는 구조로 구현했다.
- `RoleRoute.tsx`: DIRECTOR/VICE_DIRECTOR가 TEACHER_MODE인 동안 `/teacher/**`(원래
  accountType 'TEACHER'만 허용되던 라우트) 접근을 예외적으로 허용하도록 수정. `/admin/**`
  접근은 모드와 무관하게 항상 그대로 가능(accountType 자체가 이미 허용 목록에 있으므로).
- `AdminLayout.tsx` 사이드바 하단, `TeacherLayout.tsx` 헤더 상단에 각각 모드 전환 UI 추가.
  강사모드로 들어가면 "관리자 모드로 돌아가기" 바가 상단에 표시된다.
- 원장은 로그인 시 기본 ADMIN_MODE(요구사항 그대로), 부원장도 동일 기본값 적용.
- 부원장 재무 권한: 이미 기존 `VICE_DIRECTOR_PERMS`(rbac.ts)에 `finance.*` 권한이 전혀
  없었으므로 별도 조치 불필요(기존에 이미 요구사항을 만족하고 있었음).
- 상담 기록/시험 생성에는 실제 사용자 id + 작성 당시 activeMode를 함께 남긴다
  (`CounselingRecord.activeMode`, `Exam.createdByMode` 신규 필드). **채점 기록**은
  `TeacherExamGrading.tsx`가 불변 파일이라 그 파일이 호출하는 `gradeAnswer()` 등의
  기존 호출 시그니처를 바꿀 수 없어 activeMode를 추가로 남기지 못했다 — 이 부분은
  §GPT 전달 의견에 한계로 명시했다.
- 데모 계정 `u-vice-director`(010-0000-0007, 부원장)를 `DEV_USERS`에 신규 추가해
  모드 전환 기능을 테스트할 수 있게 했다.

### 8. 첫 화면 로그인 페이지

- `src/pages/LoginPage.tsx` 신규 작성 — AXIS 브랜드(Deep Navy 배경 + Champagne Gold 포인트)
  중앙 로그인 카드. 휴대폰번호 입력, 비밀번호 입력, 로그인 상태 유지 체크박스, 로그인
  버튼만 존재. 회원가입/이메일 로그인 버튼 없음.
- `AuthContext.tsx`에 실제 `login(phone, password, remember)`/`logout()` 흐름 추가.
  데모 환경이라 진짜 인증 서버가 없으므로, **데모 비밀번호 = 휴대폰번호 뒤 4자리**로
  검증한다(로그인 페이지 하단에 안내 문구로 명시, 실제 인증 서버 연동 시 이 검증 로직만
  교체하면 되도록 설계). "로그인 상태 유지" 체크 시 `localStorage`, 미체크 시
  `sessionStorage`에 세션을 저장한다.
- `RoleRoute.tsx`의 `RootRedirect`가 App.tsx(불변)의 `path="/"` 라우트를 그대로 사용해,
  비인증 상태면 `LoginPage`를 직접 렌더링하도록 수정했다 — App.tsx는 전혀 건드리지 않았다.
- `RoleRoute` 자체도 비인증 상태면 무조건 `/`(로그인)로 보내도록 수정 — `/admin`,
  `/teacher`, `/student`, `/parent`를 로그인 없이 직접 URL로 접근해도 이제 로그인 페이지로
  튕긴다(v1까지는 비인증 시에도 기본 STUDENT 계정으로 간주되어 접근이 가능했던 구조적 허점이
  있었다).
- `DevRoleSwitcher`는 로그인 페이지에는 렌더링되지 않는다(애초에 이 화면에는 포함하지
  않았고, 로그인 후 화면에서는 기존처럼 유지 — 지시사항이 "운영 첫 화면"에 한정했기 때문).
- 로그아웃 버튼을 4개 레이아웃(Admin/Teacher/Student/Parent) 모두에 추가했다(요구사항에는
  없었지만, 로그인 기능을 추가하면서 로그아웃 경로가 없으면 테스트가 불가능해 최소
  기능으로 추가함).

### 9. 학생 화면 재무 노출 재검증

- `StudentRoutes.tsx`에서 `StudentFinance` import와 `/student/finance` 라우트를 완전히
  제거하고, 해당 경로는 무조건 `/student`로 리다이렉트하도록 변경.
- `StudentFinance.tsx` 자체도 `useFinance()`를 전혀 호출하지 않는 완전한 inert stub으로
  교체(실수로 다시 import되어도 안전).
- `FinanceContext.tsx`의 관련 주석이 사실과 다르게 "어떤 학생 화면도 useFinance()를
  호출하지 않는다"고 되어 있었는데(v1 시점엔 사실이 아니었음) 이번 조치로 실제로 사실이
  되었으므로 주석을 정확하게 갱신했다. 역할 기반 데이터 차단(훅 레벨에서 STUDENT 계정에
  빈 배열/0원만 반환)은 이중 안전망으로 그대로 유지.
- 재검증 결과: `grep -rn "StudentFinance\|student/finance" src/routes/StudentRoutes.tsx` →
  리다이렉트 라우트 1건만 존재, 실제 컴포넌트 렌더링 경로 0건.

### 10. 기존 Phase 3D v1 UI 개선 유지

sticky header, 엠블럼 팝업 드래그, 클릭 가능 UI 버튼/칩화는 전혀 되돌리지 않았고 이번 v2
작업에서도 건드리지 않았다. 고등학교 과정별 단원 엠블럼 seed 추가는 지시대로 Phase 3E로
미뤘다(이번에 손대지 않음).

---

## §GPT(개발 총괄)에게 전달할 의견 (v2 추가분)

1. **채점 기록에는 activeMode를 남기지 못했다** — `TeacherExamGrading.tsx`(불변 파일)가
   `gradeAnswer()` 등을 고정된 시그니처로 호출하고 있어, 이 파일을 수정하지 않는 한 강사
   모드/관리자 모드 구분을 채점 데이터에 반영할 방법이 없다. 정말 필요하다면 다음 옵션 중
   선택이 필요하다: (a) `TeacherExamGrading.tsx`를 불변 목록에서 제외하고 직접 수정,
   (b) `AssessmentContext`의 채점 함수 내부에서 "현재 시각 기준 activeMode"를 별도 전역
   신호로 읽어오는 우회 구조를 추가로 설계.
2. **학부모/학생 포털 전체의 PC 웹 재설계는 이번에 하지 않았다** — 이번엔 새로 만든 화면
   (로그인, 학부모 페이지, 상담 기록)에만 PC 최적화 원칙을 적용했다. 기존에 이미 완성된
   출결/모의고사/성장 리포트 등 학부모·학생 화면 전체를 모바일 바텀네비 구조에서 PC
   사이드바형 구조로 완전히 바꾸는 건 범위가 훨씬 크고 회귀 위험이 있어 별도 Phase로
   진행하는 걸 권장한다.
3. **로그인은 데모 수준**(휴대폰 뒤 4자리 비밀번호)이다. 실제 서비스 전에는
   `AuthContext.login()` 내부 검증 로직만 실제 인증 서버 호출로 교체하면 되도록 설계해
   뒀지만, 세션 토큰/비밀번호 해싱 같은 진짜 보안 요소는 이번 범위에 없다.
4. **ParentFinance.tsx의 개별 청구서 금액은 남겨뒀다** — "총액성 금액 제거"가 개별 청구서
   단위 금액까지 포함하는 것인지 애매해서, 총액 요약(그리드)만 제거하고 청구서 한 건 한
   건의 금액은 유지했다. 만약 개별 금액도 전부 숨기고 "청구서가 있습니다/미납입니다" 수준
   상태만 보여줘야 한다면 다음 라운드에서 조정하겠다.

---

## (v1 원본)

## Phase 3D — UI/UX Interaction Clarity & Exam Template Improvements v1

전제: Phase 3C(시험 scope 분리)는 GitHub Actions 통과 완료 상태. 이번 Phase는 UI/UX 개선만
수행했으며, 시험 scope 분리·TEACHER_PRIVATE 권한 로직·학생 재무 차단 로직은 전혀 건드리지
않았다(아래 §7 검증 참조).

---

## 적용 우선순위 1 — 엠블럼 관리 (`EmblemManagement.tsx`)

- **테이블 헤더 고정**: `<th>` 각각에 `axis-th-sticky axis-th-sticky-56`(관리자 레이아웃 헤더
  56px 기준) 적용. `border-collapse` 테이블이라 border가 사라지는 문제를 피하기 위해
  Phase 2C와 동일하게 `box-shadow: inset` 방식으로 헤더 하단 구분선을 그렸다(tr의
  `borderBottom` 대신 th 자체에 그림자를 줌 — sticky 상태에서도 구분선이 유지됨).
- **엠블럼 등록/수정 팝업 드래그 이동**: 신규 훅 `src/hooks/useDraggableModal.ts` 작성.
  - 팝업은 기본적으로 화면 중앙에서 시작(열릴 때마다 위치 리셋).
  - 제목 영역(`axis-modal-drag-handle`)을 Pointer Capture로 드래그하면 이동.
  - `clampPosition()`으로 각 변 최소 32px는 항상 화면 안에 남도록 제한(완전히 화면 밖으로
    나가지 않음).
  - 뷰포트 폭 768px 미만(모바일)에서는 드래그를 비활성화하고 중앙 정렬만 유지.
  - 팝업 내부 구조를 헤더/바디/푸터로 분리해 헤더·푸터는 고정, 바디만 스크롤되도록 재구성
    (기존에는 팝업 전체가 스크롤되어 내용이 길면 드래그 핸들 자체가 화면 밖으로 밀려나는
    문제가 있었음).
- **클릭 어포던스**: "수정" 텍스트 링크 → `Button` 컴포넌트(outline)로 전환, 숨김 토글 아이콘
  → `Button variant="ghost" size="icon"`로 전환(hover 배경 추가), 활성/비활성 토글 버튼에
  hover/active 트랜지션 추가. 조회 전용 계정에게는 동일한 자리에 순수 텍스트/아이콘만
  보여줘 클릭 가능한 것처럼 보이지 않게 유지.

## 적용 우선순위 2 — 권한 설정 (`PermissionSettings.tsx`)

- 권한 매트릭스 `<thead>`의 `<th>`(기능 컬럼 + 7개 직급 컬럼)에 `axis-th-sticky
  axis-th-sticky-56` 적용. 배경색/하단 구분선(box-shadow)을 th에 직접 지정해 스크롤 시
  헤더가 사라지거나 컬럼 정렬이 깨지지 않도록 했다.
- 체크박스는 네이티브 폼 컨트롤로 이미 클릭 가능함이 명확해 별도 버튼화는 하지 않았다.

## 적용 우선순위 3 — 시험등록 / 문항 추가·삭제 (`AssessmentFormModal.tsx`)

이 모달은 관리자 "시험 등록"과 교사 "내 시험 만들기"가 공유하므로, 여기 반영된 개선은
양쪽 모두에 자동 적용된다.

- **기본 템플릿 2종 추가** (`buildSuneungTemplate()`, `buildNaeshinTemplate()`):
  - **수능형**: 30문항. 1~3번 2점 / 4~13번 3점 / 14~22번 4점 / 23~30번(선택과목) 4점.
    ⚠️ **주의(원장님 확인 필요)**: 이 배점 구조를 문항 수 그대로 반영하면 합계가
    6+30+36+32 = **104점**이 되어, 원 지시서의 "총점 100점" 문구와 정확히 맞지 않는다.
    실제 수능 수학은 공통 22문항 + 선택 8문항 배점이 이보다 더 세분화되어 있어 100점에
    맞춰져 있는데, 이번 지시서에 명시된 4개 구간 배점을 그대로 적용하면 104점이 나온다.
    현재는 **지시서에 적힌 배점 구간을 그대로** 구현해 두었고(임의로 배점을 줄이지
    않음), 각 문항의 배점은 문항 구성 화면에서 자유롭게 수정 가능하다. 정확히 100점
    구조를 원하시면 다음 라운드에서 구간을 조정하겠다.
  - **내신형 대시**: 24문항, 100점 자동 배분(100 = 4점×20문항 + 5점×4문항 — 나머지 4점을
    앞쪽 4개 문항에 1점씩 더 배분).
  - 템플릿 적용 시 문항 type은 모두 '객관식' 기본값(정답은 비워둠 — 교사가 이후 채움).
    교사가 "+ 문항 추가"를 30번 누르지 않아도 기본 구성이 즉시 생성된다.
  - 이미 입력한 정답이 있는 상태에서 템플릿을 누르면(기존 구성을 덮어쓰므로) 확인 모달을
    띄운다.
- **문항 추가/삭제 스테퍼**: "총 N문항 · 만점 M점" 옆에 좌측 "−"(마지막 문항 삭제) / 우측
  "+"(문항 추가) 버튼 구조 추가.
  - 최소 문항 수(`MIN_QUESTIONS = 1`) 아래로는 삭제 불가(버튼 비활성화 + 안내 토스트).
  - 삭제 대상 문항에 입력된 정답이 있으면(입력값 손실 가능성) 확인 모달을 띄우고, 없으면
    바로 삭제.
  - 문항별 개별 삭제(휴지통 아이콘)도 동일한 확인 로직을 타도록 통합(`requestRemoveQuestion`).
- **버그 수정(부수적 발견)**: 이 확인 모달에 `AlertDialog` 컴포넌트를 재사용하는 과정에서,
  `AlertDialog`가 `Dialog` 안에 중첩될 때 확인 팝업의 배경(오버레이)을 클릭하면 클릭
  이벤트가 상위 `Dialog`까지 버블링되어 시험 등록 모달 전체가 함께 닫히는 기존 버그를
  발견했다. `src/components/ui/alert-dialog.tsx`의 배경 클릭 핸들러에 `stopPropagation()`을
  추가해 수정(다른 화면에서 `AlertDialog`를 쓰는 곳에도 동일하게 적용되는 일반적인 수정).

## 적용 우선순위 4 — 학생 테스트 카드 (`StudentGrades.tsx`)

- `TestCard`(테스트 목록의 각 카드, 전체가 클릭 가능)에 `axis-card-clickable` 클래스 추가 —
  hover 시 그림자 강화 + 테두리 색 변화, `focus-visible` 시 outline 표시.

## 적용 우선순위 5 — 시험 성적표 상세 (`StudentGrades.tsx` — `ResultDetailModal`)

- 팝업 구조를 헤더(고정)/바디(스크롤)로 분리 — 기존에는 팝업 전체가 스크롤되어 내용이 길면
  (오답 문항이 많을 때) 제목과 닫기 버튼이 스크롤에 밀려 화면 밖으로 사라졌다.
- 닫기 버튼을 `Button variant="ghost" size="icon"`으로 전환(hover 배경 추가).

## 적용 우선순위 6 — 관리자 시험 및 성적 관리 (`AssessmentList.tsx`, `AssessmentDetail.tsx`)

- **AssessmentList.tsx**: 시험 목록 테이블 `<thead>`에 sticky 적용. 행 끝의 "상세" 표시를
  일반 텍스트에서 칩(chip) 스타일 배지로 전환(행 전체가 이미 클릭 가능 + hover 되므로,
  "상세" 표시는 클릭 어포던스를 보강하는 용도).
- **AssessmentDetail.tsx**: 탭 안의 표 3개(응시자목록/채점현황/결과분석 "학생별 결과") 모두
  sticky header 적용. "결석 처리/결석 취소" 텍스트 링크 → `Button variant="outline"
  size="sm"`, "정정" 텍스트 링크 → 동일하게 버튼화.

## 적용 우선순위 7 — 선생님 내 시험지 관리 (`TeacherExams.tsx`)

- 이 화면은 테이블이 아니라 카드 리스트라 sticky header 대상은 아니다(테이블이 없으므로
  §1 요구사항은 해당 없음으로 판단).
- "채점하기" 텍스트 링크(hover 없음) → `Button`(배경색 있는 실제 버튼)으로 전환. 카드
  전체는 클릭 가능한 영역이 아니므로(카드 안의 "채점하기" 버튼만 클릭 가능) 카드 전체에
  hover 효과를 주지 않았다 — 클릭 안 되는 부분에 클릭 느낌을 주지 않는다는 금지 원칙을
  지켰다.

---

## §7. 금지 사항 재검증 결과

- 학생 화면 재무/수납/청구/미납/환불/영수증 노출: **0건**(전체 grep 결과 매치는 모두
  기존 주석 — "노출 금지"를 선언하는 문구 자체였으며 실제 렌더링 텍스트/컴포넌트는 없음)
- 학생 성적 직접 입력 흐름 추가: **0건**
- IF 채점 별도 메뉴/사유 3개 초과: 변경 없음(이번 Phase는 IF 로직 자체를 건드리지 않음)
- 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현: **0건**(전체 grep 매치는 모두
  `universityAnalysisAdapter.ts`/`universityAnalysisClient.ts`의 기존 주석으로, "이 값을
  포함하지 않는다"는 부정문 — 실제 위반 아님)
- Phase 3C 시험 scope/권한 구조 변경: **없음**(scope 선택 로직, `ownerTeacherId` 계산,
  `TeacherExamGradingGuard` 등은 전혀 수정하지 않았고, `AssessmentFormModal.tsx`의 기존
  scope 관련 코드도 그대로 유지)
- 불변 파일 4종(`App.tsx`, `TeacherExamGrading.tsx`, `universityAnalysisAdapter.ts`,
  `classData.ts`) MD5: **작업 전후 완전 동일**(아래 QA 문서 참조)

## §8. GPT(개발 총괄)에게 전달할 의견

- 위 §"적용 우선순위 3"에 적은 대로, **수능형 템플릿의 배점 구조(1~3번 2점/4~13번
  3점/14~22번 4점/23~30번 4점)를 그대로 적용하면 합계가 104점**이 되어 "총점 100점"
  요구사항과 어긋난다. 다음 라운드에서 정확한 100점 배점 구간(예: 공통 22문항 74점 +
  선택 8문항 26점 등 실제 수능 방식)을 확정해 주시면 반영하겠다.
- `AlertDialog`(공용 컴포넌트)가 `Dialog` 안에 중첩될 때 배경 클릭으로 상위 모달까지 같이
  닫히는 버그를 이번에 발견·수정했다. 향후 다른 화면에서도 확인 모달을 중첩해서 쓸 일이
  많아질 것으로 예상되어, 이 수정이 공용으로 도움이 될 것으로 판단해 별도 지시 없이
  반영했다.

전제: Phase 3C(시험 scope 분리)는 GitHub Actions 통과 완료 상태. 이번 Phase는 UI/UX 개선만
수행했으며, 시험 scope 분리·TEACHER_PRIVATE 권한 로직·학생 재무 차단 로직은 전혀 건드리지
않았다(아래 §7 검증 참조).

---

## 적용 우선순위 1 — 엠블럼 관리 (`EmblemManagement.tsx`)

- **테이블 헤더 고정**: `<th>` 각각에 `axis-th-sticky axis-th-sticky-56`(관리자 레이아웃 헤더
  56px 기준) 적용. `border-collapse` 테이블이라 border가 사라지는 문제를 피하기 위해
  Phase 2C와 동일하게 `box-shadow: inset` 방식으로 헤더 하단 구분선을 그렸다(tr의
  `borderBottom` 대신 th 자체에 그림자를 줌 — sticky 상태에서도 구분선이 유지됨).
- **엠블럼 등록/수정 팝업 드래그 이동**: 신규 훅 `src/hooks/useDraggableModal.ts` 작성.
  - 팝업은 기본적으로 화면 중앙에서 시작(열릴 때마다 위치 리셋).
  - 제목 영역(`axis-modal-drag-handle`)을 Pointer Capture로 드래그하면 이동.
  - `clampPosition()`으로 각 변 최소 32px는 항상 화면 안에 남도록 제한(완전히 화면 밖으로
    나가지 않음).
  - 뷰포트 폭 768px 미만(모바일)에서는 드래그를 비활성화하고 중앙 정렬만 유지.
  - 팝업 내부 구조를 헤더/바디/푸터로 분리해 헤더·푸터는 고정, 바디만 스크롤되도록 재구성
    (기존에는 팝업 전체가 스크롤되어 내용이 길면 드래그 핸들 자체가 화면 밖으로 밀려나는
    문제가 있었음).
- **클릭 어포던스**: "수정" 텍스트 링크 → `Button` 컴포넌트(outline)로 전환, 숨김 토글 아이콘
  → `Button variant="ghost" size="icon"`로 전환(hover 배경 추가), 활성/비활성 토글 버튼에
  hover/active 트랜지션 추가. 조회 전용 계정에게는 동일한 자리에 순수 텍스트/아이콘만
  보여줘 클릭 가능한 것처럼 보이지 않게 유지.

## 적용 우선순위 2 — 권한 설정 (`PermissionSettings.tsx`)

- 권한 매트릭스 `<thead>`의 `<th>`(기능 컬럼 + 7개 직급 컬럼)에 `axis-th-sticky
  axis-th-sticky-56` 적용. 배경색/하단 구분선(box-shadow)을 th에 직접 지정해 스크롤 시
  헤더가 사라지거나 컬럼 정렬이 깨지지 않도록 했다.
- 체크박스는 네이티브 폼 컨트롤로 이미 클릭 가능함이 명확해 별도 버튼화는 하지 않았다.

## 적용 우선순위 3 — 시험등록 / 문항 추가·삭제 (`AssessmentFormModal.tsx`)

이 모달은 관리자 "시험 등록"과 교사 "내 시험 만들기"가 공유하므로, 여기 반영된 개선은
양쪽 모두에 자동 적용된다.

- **기본 템플릿 2종 추가** (`buildSuneungTemplate()`, `buildNaeshinTemplate()`):
  - **수능형**: 30문항. 1~3번 2점 / 4~13번 3점 / 14~22번 4점 / 23~30번(선택과목) 4점.
    ⚠️ **주의(원장님 확인 필요)**: 이 배점 구조를 문항 수 그대로 반영하면 합계가
    6+30+36+32 = **104점**이 되어, 원 지시서의 "총점 100점" 문구와 정확히 맞지 않는다.
    실제 수능 수학은 공통 22문항 + 선택 8문항 배점이 이보다 더 세분화되어 있어 100점에
    맞춰져 있는데, 이번 지시서에 명시된 4개 구간 배점을 그대로 적용하면 104점이 나온다.
    현재는 **지시서에 적힌 배점 구간을 그대로** 구현해 두었고(임의로 배점을 줄이지
    않음), 각 문항의 배점은 문항 구성 화면에서 자유롭게 수정 가능하다. 정확히 100점
    구조를 원하시면 다음 라운드에서 구간을 조정하겠다.
  - **내신형 대시**: 24문항, 100점 자동 배분(100 = 4점×20문항 + 5점×4문항 — 나머지 4점을
    앞쪽 4개 문항에 1점씩 더 배분).
  - 템플릿 적용 시 문항 type은 모두 '객관식' 기본값(정답은 비워둠 — 교사가 이후 채움).
    교사가 "+ 문항 추가"를 30번 누르지 않아도 기본 구성이 즉시 생성된다.
  - 이미 입력한 정답이 있는 상태에서 템플릿을 누르면(기존 구성을 덮어쓰므로) 확인 모달을
    띄운다.
- **문항 추가/삭제 스테퍼**: "총 N문항 · 만점 M점" 옆에 좌측 "−"(마지막 문항 삭제) / 우측
  "+"(문항 추가) 버튼 구조 추가.
  - 최소 문항 수(`MIN_QUESTIONS = 1`) 아래로는 삭제 불가(버튼 비활성화 + 안내 토스트).
  - 삭제 대상 문항에 입력된 정답이 있으면(입력값 손실 가능성) 확인 모달을 띄우고, 없으면
    바로 삭제.
  - 문항별 개별 삭제(휴지통 아이콘)도 동일한 확인 로직을 타도록 통합(`requestRemoveQuestion`).
- **버그 수정(부수적 발견)**: 이 확인 모달에 `AlertDialog` 컴포넌트를 재사용하는 과정에서,
  `AlertDialog`가 `Dialog` 안에 중첩될 때 확인 팝업의 배경(오버레이)을 클릭하면 클릭
  이벤트가 상위 `Dialog`까지 버블링되어 시험 등록 모달 전체가 함께 닫히는 기존 버그를
  발견했다. `src/components/ui/alert-dialog.tsx`의 배경 클릭 핸들러에 `stopPropagation()`을
  추가해 수정(다른 화면에서 `AlertDialog`를 쓰는 곳에도 동일하게 적용되는 일반적인 수정).

## 적용 우선순위 4 — 학생 테스트 카드 (`StudentGrades.tsx`)

- `TestCard`(테스트 목록의 각 카드, 전체가 클릭 가능)에 `axis-card-clickable` 클래스 추가 —
  hover 시 그림자 강화 + 테두리 색 변화, `focus-visible` 시 outline 표시.

## 적용 우선순위 5 — 시험 성적표 상세 (`StudentGrades.tsx` — `ResultDetailModal`)

- 팝업 구조를 헤더(고정)/바디(스크롤)로 분리 — 기존에는 팝업 전체가 스크롤되어 내용이 길면
  (오답 문항이 많을 때) 제목과 닫기 버튼이 스크롤에 밀려 화면 밖으로 사라졌다.
- 닫기 버튼을 `Button variant="ghost" size="icon"`으로 전환(hover 배경 추가).

## 적용 우선순위 6 — 관리자 시험 및 성적 관리 (`AssessmentList.tsx`, `AssessmentDetail.tsx`)

- **AssessmentList.tsx**: 시험 목록 테이블 `<thead>`에 sticky 적용. 행 끝의 "상세" 표시를
  일반 텍스트에서 칩(chip) 스타일 배지로 전환(행 전체가 이미 클릭 가능 + hover 되므로,
  "상세" 표시는 클릭 어포던스를 보강하는 용도).
- **AssessmentDetail.tsx**: 탭 안의 표 3개(응시자목록/채점현황/결과분석 "학생별 결과") 모두
  sticky header 적용. "결석 처리/결석 취소" 텍스트 링크 → `Button variant="outline"
  size="sm"`, "정정" 텍스트 링크 → 동일하게 버튼화.

## 적용 우선순위 7 — 선생님 내 시험지 관리 (`TeacherExams.tsx`)

- 이 화면은 테이블이 아니라 카드 리스트라 sticky header 대상은 아니다(테이블이 없으므로
  §1 요구사항은 해당 없음으로 판단).
- "채점하기" 텍스트 링크(hover 없음) → `Button`(배경색 있는 실제 버튼)으로 전환. 카드
  전체는 클릭 가능한 영역이 아니므로(카드 안의 "채점하기" 버튼만 클릭 가능) 카드 전체에
  hover 효과를 주지 않았다 — 클릭 안 되는 부분에 클릭 느낌을 주지 않는다는 금지 원칙을
  지켰다.

---

## §7. 금지 사항 재검증 결과

- 학생 화면 재무/수납/청구/미납/환불/영수증 노출: **0건**(전체 grep 결과 매치는 모두
  기존 주석 — "노출 금지"를 선언하는 문구 자체였으며 실제 렌더링 텍스트/컴포넌트는 없음)
- 학생 성적 직접 입력 흐름 추가: **0건**
- IF 채점 별도 메뉴/사유 3개 초과: 변경 없음(이번 Phase는 IF 로직 자체를 건드리지 않음)
- 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현: **0건**(전체 grep 매치는 모두
  `universityAnalysisAdapter.ts`/`universityAnalysisClient.ts`의 기존 주석으로, "이 값을
  포함하지 않는다"는 부정문 — 실제 위반 아님)
- Phase 3C 시험 scope/권한 구조 변경: **없음**(scope 선택 로직, `ownerTeacherId` 계산,
  `TeacherExamGradingGuard` 등은 전혀 수정하지 않았고, `AssessmentFormModal.tsx`의 기존
  scope 관련 코드도 그대로 유지)
- 불변 파일 4종(`App.tsx`, `TeacherExamGrading.tsx`, `universityAnalysisAdapter.ts`,
  `classData.ts`) MD5: **작업 전후 완전 동일**(아래 QA 문서 참조)

## §8. GPT(개발 총괄)에게 전달할 의견

- 위 §"적용 우선순위 3"에 적은 대로, **수능형 템플릿의 배점 구조(1~3번 2점/4~13번
  3점/14~22번 4점/23~30번 4점)를 그대로 적용하면 합계가 104점**이 되어 "총점 100점"
  요구사항과 어긋난다. 다음 라운드에서 정확한 100점 배점 구간(예: 공통 22문항 74점 +
  선택 8문항 26점 등 실제 수능 방식)을 확정해 주시면 반영하겠다.
- `AlertDialog`(공용 컴포넌트)가 `Dialog` 안에 중첩될 때 배경 클릭으로 상위 모달까지 같이
  닫히는 버그를 이번에 발견·수정했다. 향후 다른 화면에서도 확인 모달을 중첩해서 쓸 일이
  많아질 것으로 예상되어, 이 수정이 공용으로 도움이 될 것으로 판단해 별도 지시 없이
  반영했다.
