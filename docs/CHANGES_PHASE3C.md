# CHANGES_PHASE3C.md

## 반려 대응 (v2)

v1 반려 사유 3건 + 재검증 조치:

1. **관리자 상세 직접 접근 차단** — `AssessmentDetail.tsx`에 `exam.scope === 'TEACHER_PRIVATE'`
   체크를 추가해, `/admin/scores/:id`로 직접 URL 접근해도 상세/채점/공개/정정 화면 대신 차단
   화면만 보이도록 했다(최고관리자/원장 포함, 예외 없음). `AssessmentList.tsx`의 목록 필터는
   그대로 유지하고, 상세 화면에서 한 번 더 막는 이중 방어 구조.
2. **TEACHER_PRIVATE 공개/반영 정책 수정** — `isAcademyWideExam()`이 이제 `scope`를 함께 보고,
   `TEACHER_PRIVATE`면 `classId` 유무와 무관하게 "학원 전체 공통 시험"(명시적 공개 필요) 취급을
   받지 않도록 고쳤다. 이 함수를 그대로 위임받는 `requiresPublishAction()`/`getExamPhase()`/
   `isResultVisibleForStudent()`도 자동으로 함께 고쳐졌다. 결과: 교사가 채점을 완료하면(반 단위
   시험과 동일하게) 별도 "공개" 액션 없이 학생 테스트 상세에 바로 반영된다.
3. **권한 방어 강화(2차)** — `TeacherExamGradingGuard.tsx`(라우트 레벨 1차 방어)는 그대로 유지.
   `AssessmentContext.gradeSubmissionByTeacher()` 내부에도 `ownerTeacherId` 검증을 추가해
   데이터 계층에서 2차로 막는다(`TeacherExamGrading.tsx`가 불변 파일이라 `gradedBy`로 이름
   문자열만 넘기는 기존 시그니처를 그대로 쓰되, `ownerTeacherId`를 이름으로 역조회해 비교 —
   동명이인 한계는 있으나 1차 라우트 가드가 이미 막고 있어 실질적 이중 안전망).

재검증 결과는 아래 "지켜진 것" 절 참조. 상세 원본은 이어지는 v1 섹션 그대로 유지.

---

## (v1 원본)

## Phase 3C — Exam Scope Separation / Teacher Private Test Management v1

### 데이터 구조: 시험 scope

`src/lib/assessmentData.ts`의 `Exam` 인터페이스에 필드 추가(기존 필드는 전혀 삭제/변경하지 않음):

```ts
scope: 'ACADEMY_COMMON' | 'GRADE_COMMON' | 'COURSE_COMMON' | 'TEACHER_PRIVATE';
ownerTeacherId: string | null;   // TEACHER_PRIVATE만 값 있음
targetGrade?: string;            // GRADE_COMMON 전용
targetCourseId?: string;         // COURSE_COMMON 전용
sourceType?: 'ADMIN_COMMON' | 'TEACHER_PRIVATE';
visibility: 'COMMON' | 'OWNER_ONLY';
```

`StudentExamResult`에도 `scope`를 추가해 학생 화면에서 "공통/수업" 라벨을 표시할 수 있게 했다
(`studentFacingScopeLabel()` — 행정 구분을 과다 노출하지 않고 이 두 단어만 사용).

`AssessmentContext.addExam()`은 `scope`를 필수 입력으로 받고, `scope === 'TEACHER_PRIVATE'`이면
`ownerTeacherId`/`visibility`/`sourceType`을 서버(mock) 단에서도 한 번 더 강제한다(호출부 실수
방지). 기존 시드 데이터(`DUMMY_EXAMS`)는 전부 `ACADEMY_COMMON`/관리자 생성으로 일괄 매핑했다.

### 관리자 화면

- `AdminLayout.tsx` 메뉴: "성적관리" → "시험 및 성적 관리"(모든 화면 텍스트 동일 변경 —
  `AssessmentList.tsx`/`AssessmentDetail.tsx` 타이틀·브레드크럼·안내문구, `notificationData.ts`
  알림 카테고리 라벨, `PermissionSettings.tsx` 권한 그룹 라벨, `StudentDetail.tsx`의 IF 힌트
  문구까지 전부 반영)
- `AssessmentList.tsx`: `visibleExams`에서 `scope !== 'TEACHER_PRIVATE'`를 강제해 교사 개인
  시험을 목록에서 완전히 제외. "범위" 필터(전체 공통/학년 공통/과정 공통) 추가. 교사 개인 시험을
  열람/편집하지 않는 선에서 "교사별 시험 현황" 요약 카드(건수만) 추가.
- `AssessmentFormModal.tsx`: "시험 범위" 선택 UI 추가(ACADEMY_COMMON/GRADE_COMMON/
  COURSE_COMMON 중 선택). 학년/과정 공통 선택 시 대상 학년·과정 id 입력란 노출.

### 선생님 화면

- `AssessmentFormModal.tsx`에 `mode?: 'admin' | 'teacher'` prop 추가(기존 admin 동작은 전혀
  바뀌지 않음 — 기본값 유지). `mode="teacher"`일 때:
  - 시험 범위 선택 UI를 숨기고 항상 `scope: 'TEACHER_PRIVATE'`, `ownerTeacherId: currentUser.id`로
    고정.
  - 대상 반 선택지를 `currentUser.assignedClassIds`로 제한(다른 교사 반이 섞이지 않음).
  - 반 미선택 시 대상 학생은 "학원 전체 재원생"이 아니라 "본인 담당 학생 전체"
    (`currentUser.assignedStudentIds`)로 계산.
- `TeacherExams.tsx`: "+ 내 시험 만들기" 버튼 추가(위 모달을 teacher 모드로 오픈). 후보 시험
  계산 로직을 "공통 시험(기존 규칙) + 본인 소유 TEACHER_PRIVATE"로 분리하고, 다른 교사의
  TEACHER_PRIVATE 시험은 `ownerTeacherId === currentUser.id` 체크로 이중 방어(담당 반/학생 매칭과
  무관하게 항상 제외). 목록 카드에 "내 수업" 뱃지 추가(본인 개인 시험만).
- **불변 파일 미수정**: `TeacherExamGrading.tsx`(MD5 고정)는 손대지 않았다. 대신
  `TeacherExamGradingGuard.tsx`(신규)를 만들어 `TeacherRoutes.tsx`에서 이 래퍼를
  `TeacherExamGrading`이라는 이름으로 re-export해 라우트 코드 자체는 한 줄(import 경로)만
  바뀌도록 했다. 이 래퍼는 examId로 시험을 조회해 "TEACHER_PRIVATE이면서 소유자가 나와 다르면"
  차단 화면을 보여주고, 그 외에는 기존 `TeacherExamGrading`을 그대로 렌더링한다.

### 학생 화면

- 기존 "테스트" 화면 구조·라우트는 전혀 바꾸지 않았다(새 메뉴 없음).
- `StudentGrades.tsx`의 시험 카드(`TestCard`)에 작은 라벨 1개만 추가: 공통 시험이면 "공통",
  선생님 개인 시험이면 "수업"(`studentFacingScopeLabel()`). 그 외 행정 구분(scope 원본 값,
  ownerTeacherId 등)은 학생 화면에 절대 노출하지 않는다.
- IF 저장(`studentIfRecord.ts`)과 누적 성장 그래프(`CumulativeGrowthSection`, Phase 3B)는
  전혀 건드리지 않았다 — `StudentExamResult`에 `scope` 필드만 추가했을 뿐 기존 필드는 그대로라
  회귀 없음(아래 검수 참조).

### 지켜진 것 (재검증 완료)

- Admin 화면 "성적관리" 문구: 0건(코드 주석 2곳만 남음, 화면에는 노출 안 됨)
- Admin 전체 시험 목록에 TEACHER_PRIVATE 노출: 0건(`AssessmentList.tsx` scope 필터로 원천 차단)
- Teacher A 시험이 Teacher B 목록에 노출: 0건(`ownerTeacherId` 체크, 목록/채점 양쪽에서 이중 방어)
- 학생 성적 직접 입력: 0건(기존 상태 유지 확인)
- 학생 화면 재무/수납/청구/미납/환불/영수증 노출: 0건(기존 상태 유지 확인, `StudentGrades.tsx`
  재검사)
- 합격률/합격 가능성/합격 보장/안정 합격/불합격 표현: 0건
- 새 학생 메뉴: 0건(`StudentRoutes.tsx` 미수정)

### 수정/신규 파일

수정(13): `src/lib/assessmentData.ts`, `src/contexts/AssessmentContext.tsx`,
`src/components/AdminLayout.tsx`, `src/components/AssessmentFormModal.tsx`,
`src/pages/AssessmentList.tsx`, `src/pages/AssessmentDetail.tsx`,
`src/pages/teacher/TeacherExams.tsx`, `src/routes/TeacherRoutes.tsx`,
`src/pages/student/StudentGrades.tsx`, `src/lib/notificationData.ts`,
`src/pages/settings/PermissionSettings.tsx`, `src/pages/StudentDetail.tsx`,
`src/routes/AdminRoutes.tsx`(주석만)

신규(1): `src/pages/teacher/TeacherExamGradingGuard.tsx`

### 검증

`tsc --noEmit --project tsconfig.app.json`(전체 프로젝트, 스텁 기반) → **0 errors**.
`npm install`은 이 작업 환경 네트워크 차단으로 불가 — 로컬에서 `npm install && npm run build`
1회 실행 권장.

### 알려진 한계 / 다음 판단 필요 항목

- "과정(course)" 개념이 기존 코드베이스에 별도 엔티티로 없어, `targetCourseId`는 현재 자유
  텍스트 입력이다. 실제 과정 관리 화면이 생기면 선택형 UI로 교체가 필요하다.
- "교사별 시험 현황" 요약은 건수만 보여준다(스펙 "필요하면 별도 표시 가능"의 최소 구현). 상세
  드릴다운이 필요하면 별도 화면으로 분리하는 게 맞다(관리자가 개인 시험 내용 자체를 열람하지
  않는다는 원칙 유지 목적).
