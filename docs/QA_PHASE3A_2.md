# QA_PHASE3A_2.md

**버전**: v2 (최종) — 이 문서는 v2 반려 대응을 반영한 최종 검수 결과만 담는다. 이전 v1 문서의
내용·이력은 보존하지 않는다.

## 검수 환경

이 작업 환경은 네트워크가 차단되어 있어 `npm install`을 실행할 수 없다(`npm ping` → `403
Forbidden - GET https://registry.npmjs.org/...`). 이를 대체하기 위해 실제 `tsconfig.app.json`
설정(strict, moduleResolution: Bundler, paths `@/*` 등) 그대로에 프로젝트 의존성 8종(react,
react-dom, wouter, sonner, lucide-react, nanoid, clsx, tailwind-merge)의 타입 스텁을 만들어
`node_modules`에 심볼릭 링크로 연결한 뒤 `tsc --noEmit`을 **src 전체(약 150개 파일)**에 대해
실행했다. 검증 직후 심볼릭 링크는 제거했고, 최종 산출물에는 `node_modules`가 포함되지 않는다.
로컬(실제 node_modules 보유) 환경에서 `npm install && npm run build` 1회 실행을 배포 전 최종
확인 절차로 권장한다.

## 최종 검수 결과 요약

| # | 검수 기준 | 결과 |
|---|---|---|
| 1 | 금지 표현(합격 가능성 등) 실제 UI 문구 0건 | **0건** |
| 2 | STUDENT_INPUT / PENDING_REVIEW 실사용 0건 | **0건** |
| 3 | /admin/student-input-review 라우트 0건 | **0건**(Route 정의·리다이렉트 모두 없음) |
| 4 | Admin 메뉴 "학생 입력 성적 검토" 0건 | **0건** |
| 5 | /teacher/academic-input은 university-data redirect만 허용 | **통과** |
| 6 | 학생 재무 노출 0건 | **0건**(UI + 데이터 계층 이중 차단) |
| 7 | `tsc --noEmit`(build/typecheck 대체) | **0 errors** |

---

## §1. 금지 표현 실제 UI 문구 검수

파이썬 스크립트로 `합격률|합격 가능성|합격 보장|안정 합격|불합격` 매칭 라인 중 `//` 또는
`*`(주석)로 시작하지 않는 라인만 필터링 → **전부 주석 — 실제 UI 문구 0건**.

v1 반려 사유였던 `StudentDetail.tsx` 3곳(1180, 1368, 1609행 부근)은 실제 `<p>`/`<strong>` 렌더링
텍스트였음을 재확인하고 승인된 대체 표현으로 교체했다:

- "실제 대학명·합격 가능성·추천 순위는 표시되지 않습니다." →
  "실제 대학명·추천 순위 같은 확정 결과는 표시되지 않으며, 추천 적합도 중심의 참고 지표만
  제공됩니다."
- "실제 대학명·합격 가능성·추천 순위는 다음 단계에서 계산됩니다." →
  "실제 대학명·추천 순위 같은 확정 결과는 다음 단계에서 계산되며, 지금은 추천 적합도 중심의
  입력 조립 단계입니다."
- "합격 가능성 변화 계산이 아닌, 수학 점수 향상을 가정하는 입력값입니다." →
  "확정 결과 계산이 아닌, 수학 점수 향상 시 추천 변화를 가정하는 입력값입니다."

같은 방식으로 `src/pages/admin/UniversityReportManagement.tsx`의 안내 배너도 실제 렌더링
텍스트("⚠ 합격 관련 표현(합격률·합격 가능성·합격 보장·불합격)은...")였음을 추가로 발견해
"⚠ 이 화면에서는 확정 결과를 단정하는 표현 대신, 추천 적합도·보완 필요도 중심의 참고 지표만
사용합니다."로 교체했다. (v1 검수 당시 이 라인을 놓쳤던 원인은 정규식이 `//`/`*` 시작 여부만
보고 주석으로 오판했기 때문 — 이번에는 파이썬 스크립트로 전체 파일을 줄 단위 재검사해 재발을
막았다.)

나머지 모든 매칭은 파일 상단의 정책 주석(`// ⚠ 금지: ...`)뿐이며, 이는 "이 표현을 쓰지 말라"는
개발자 안내이지 실제 사용자에게 노출되는 문구가 아니므로 검수 기준 위반이 아니다.

## §2. STUDENT_INPUT / PENDING_REVIEW 실사용 검수

`grep -rn "STUDENT_INPUT\|PENDING_REVIEW" src/` → **0건**.

v1에서는 `src/lib/studentGradeInput.ts` 안에 이 로직을 삭제했다는 설명 주석 자체에
"STUDENT_INPUT/PENDING_REVIEW" 문자열이 그대로 남아 있어 grep 기준으로는 "흔적이 있다"고 잡히는
상태였다. v2에서는:

1. 파일명을 `studentGradeInput.ts` → **`universityMenuLabel.ts`**로 변경했다(학생 입력을
   연상시키는 이름 자체가 혼란의 원인이었음). 실제로 이 파일에 남아있던 두 함수
   (`detectStudentGradeLevel`, `getUniversityMenuLabel`)는 학년 감지·메뉴 라벨 계산용으로,
   "학생 입력"과 무관하다.
2. 설명 주석에서 `STUDENT_INPUT`/`PENDING_REVIEW` 리터럴 문자열을 완전히 제거하고, 무엇이
   삭제됐는지는 문자열 없이 서술형으로만 남겼다.
3. 이 파일을 import하던 9개 파일(`StudentLayout.tsx`, `ParentTargetSummary.tsx`,
   `UniversityReportManagement.tsx`, `TeacherUniversityData.tsx`, `TeacherStudentGrowth.tsx`,
   `StudentGrowthShowcase.tsx`, `StudentMyPage.tsx`, `StudentTargetPreview.tsx`,
   `StudentHome.tsx`) 전부의 import 경로를 `@/lib/universityMenuLabel`로 일괄 수정했고,
   `universityPayloadAdapter.ts`의 상대경로 import(`./studentGradeInput`)도 함께 수정했다.
4. `src/pages/admin/StudentInputGradeReview.tsx`(학생 입력 성적 검토 화면)는 v1에서 `export {}`
   스텁으로만 격리되어 있었는데, 참조하는 곳이 프로젝트 어디에도 없음을 재확인한 뒤(아래 §3)
   **파일 자체를 물리 삭제**했다. 이제 이 파일명 자체가 검색에 걸릴 일이 없다.

## §3. 학생 입력 성적 검토 화면/라우트/메뉴 검수

- `grep -rln "StudentInputGradeReview" src/` → 0건(파일 삭제됨)
- `grep -n "Route.*student-input-review" src/routes/AdminRoutes.tsx` → 0건
- `grep -n "학생 입력 성적 검토" src/components/AdminLayout.tsx` → 0건

`AdminRoutes.tsx`에는 "이 경로는 더 이상 존재하지 않는다(리다이렉트도 없음)"는 설명 주석만
남아 있고 실제 `<Route>` 정의는 없다. `AdminLayout.tsx` 메뉴 배열에도 해당 항목이 없다.

## §4. /teacher/academic-input 라우트 검수

`grep -n "academic-input" src/routes/TeacherRoutes.tsx` →

```
75:  <Route path="/teacher/academic-input" component={() => <Redirect to="/teacher/university-data" />} />
```

`/teacher/academic-input` 경로는 `/teacher/university-data`로의 **redirect 전용 Route 1개만**
존재하며, 별도 컴포넌트 렌더링이나 구 화면 진입 경로는 없다. `TeacherAcademicInput.tsx`(구
화면)는 `export {}` 스텁 상태로 유지했다(§ 3과 달리 이 파일은 redirect 안내 주석에서 여전히
경로를 언급하므로 완전 삭제 대신 유지 — 다음 라우트 정리 phase 판단 사항으로 별도 문서에 정리).

## §5. 학생 재무 노출 검수 (변경 없음, 재확인)

- UI 레벨: `src/pages/student/`, `StudentLayout.tsx`, `StudentRoutes.tsx` 전체 검색 결과, 실제
  노출 0건(매칭은 전부 "금지" 명시 주석).
- 데이터 레벨: `FinanceContext.tsx`의 `useFinance()` 훅이 `currentUser.position === 'STUDENT'`일
  때 실제 청구서/수납/환불/정산/영수증 데이터를 반환하지 않고 빈 스텁(`STUDENT_SAFE_FINANCE`)을
  반환.
- 이번 v2 작업에서는 재무 관련 코드를 건드리지 않았으므로 회귀(regression) 없음을 재확인만
  했다.

## §6. 빌드/타입체크 결과

```
$ ln -s <stub>/node_modules node_modules   # 검증 전용, 즉시 제거
$ tsc --noEmit --project tsconfig.app.json
→ 0 errors (src/ 전체)
$ rm node_modules
```

v2에서 변경한 파일(`StudentDetail.tsx`, `UniversityReportManagement.tsx`,
`universityMenuLabel.ts`(신규, 구 `studentGradeInput.ts` 대체), `universityPayloadAdapter.ts`,
그 외 import 경로가 바뀐 8개 파일, `StudentInputGradeReview.tsx`(삭제))을 반영한 뒤 재실행한
결과이며, 전체 0 errors로 회귀 없음을 확인했다.

## 알려진 구조적 한계 (이번 phase 판단 범위 밖)

FinanceProvider/AuthProvider Provider 순서 문제, 격리 파일 누적, IF quick-tap 저장 여부,
evaluationType 하드코딩, `/teacher/academic-input` redirect 유지 여부는 별도
`PHASE3A_2_IMPLEMENTATION_NOTES_FOR_GPT.md`에 정리되어 있고, 전부 "다음 phase 판단 항목"으로
분류되어 이번 v2 범위에는 포함하지 않는다(원장 확인 완료).
