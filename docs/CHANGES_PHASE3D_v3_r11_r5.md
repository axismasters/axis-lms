# CHANGES — Phase 3D v3-r11-r5 (PC Layout / Student·Teacher Growth Cleanup)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — 추정하지 않고 실제 업로드 zip에서 시작

`axis-lms-v1_2-phase3d-clean-main-pc-layout-constitution-v3-r11-r4-github-upload.zip`
(사용자가 이번 세션 시작 시 업로드한 파일)을 압축 해제해 완전히 새로운 작업 디렉토리에서
시작했다.

시작 전 검증한 사실:
- 불변 파일 3종 MD5가 지시서에 명시된 값과 정확히 일치함을 확인했다
  (`universityAnalysisAdapter.ts` / `App.tsx` / `classData.ts`).
- 이 zip은 실제로 **v3-r10-r3 원본 + `GrowthOverview.tsx` 1개 파일(반응형 그리드) 수정**만
  포함된 상태였다(`GrowthOverview.tsx` MD5가 `docs/MODIFIED_FILES_QA_APPLY_PHASE3D_v3_r11_r4.md`
  기재값 `5b1a50b8...ca367`와 정확히 일치 — 즉 지시서가 "유지해도 된다"고 명시한 그 수정과
  동일함을 확인 후 유지).
- 반려된 r11-r1/r11-r2/r11-r3 체인의 잔재(`AxisEmblemPlaque.tsx` 등, `r11-r1`~`r11-r3` 문자열)는
  소스 전체에서 0건 확인했다.

## 1. 실제 수정한 파일 — 정확히 3개

### `src/pages/teacher/TeacherStudentGrowth.tsx`
- 컨테이너를 `max-w-lg mx-auto` → `max-w-lg lg:max-w-6xl mx-auto`로 확장.
- 담당 학생 성장 카드 목록을 모바일 단일 스택(`space-y-3`)에서
  `grid grid-cols-1 lg:grid-cols-2 gap-3`로 전환 — PC에서 2컬럼 대시보드 구조가 됨.
- 텍스트 노출 정리: `평균 SP` → `평균 성장 활동`, `SP 높은 순` → `성장 활동 높은 순`,
  `GrowthCard` 내부의 `SP {totalSP}...` → `성장 활동 {totalSP}...`.
  내부 변수명(`sortBy`의 `'sp'` 값, `profile.totalSP` 등)은 지시대로 변경하지 않았다.

### `src/pages/student/StudentMyPage.tsx`
- 컨테이너를 `max-w-lg mx-auto` → `max-w-lg lg:max-w-6xl mx-auto`로 확장하고,
  `lg:grid lg:grid-cols-3 lg:gap-5`를 추가했다.
- 프로필 카드에 `lg:col-span-3`(전체 폭 밴드), 닉네임 설정·획득 엠블럼에 `lg:col-span-2`
  (좌측 메인), Rival 공개 프로필 미리보기·빠른 이동에 `lg:col-span-1`(우측 사이드)을 부여했다.
  **DOM 순서는 원본과 완전히 동일하다** — 블록을 옮기지 않고 그리드 span 값만 추가해,
  `grid-cols-3`의 자동 배치(auto-flow)만으로 좌측 2단/우측 1단 대시보드 구조가 되도록 했다
  (프로필 전체 폭 → 2행: 닉네임설정|Rival → 3행: 획득엠블럼|빠른이동). 모바일에서는 grid가
  비활성화(`lg:` 접두사)되므로 기존과 동일한 세로 스택 그대로 보인다.
- **엠블럼 디자인 컴포넌트(`AxisEmblemBadge`, `AxisTierMedallion`) 자체는 호출부 변경 없이
  그대로 사용했다.** 배치 위치만 바뀌었을 뿐 컴포넌트 내부는 건드리지 않았다.
- Rival 공개 프로필 미리보기의 `SP {totalSP}` 노출도 `성장 활동 {totalSP}`로 통일했다.
  (§6에 이 항목은 지시서 4단계에 명시된 파일이 아니라 별도로 발견한 것임을 표시한다.)

### `src/pages/student/StudentHome.tsx`
- 지시서 4단계 그대로: `성장 진열장` 카드의 `SP {totalSP} · 엠블럼 N개 보유` →
  `성장 활동 {totalSP} · 엠블럼 N개 보유`로 변경. 그 외 이 파일은 이미 v3-r7-r1부터
  `lg:max-w-6xl` + `lg:grid-cols-3` PC 구조를 갖추고 있어(전임 세션 CHANGES 문서에서도 확인됨)
  레이아웃은 손대지 않았다.

## 2. 점검했지만 수정하지 않은 파일

### `src/pages/growth/GrowthOverview.tsx`
- v3-r11-r4의 `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` 반응형 수정을 그대로 유지했다
  (MD5 `5b1a50b8...ca367` — 원본과 완전히 동일, 이번 패스에서 재수정 없음).
- 지시서 5)단계에 따라 "PC에서 테이블/검색/요약 카드가 화면 폭을 고르게 쓰는지" 재확인했다:
  이 화면은 `AdminLayout`(`src/components/AdminLayout.tsx`)을 쓰는데, 이 레이아웃의 `<main>`은
  `max-w` 제약이 전혀 없는 `flex-1 p-4 lg:p-6` 구조다. 검색 입력창은 `flex-1`, 테이블은
  `axis-table-scroll` 래퍼로 전체 폭을 이미 고르게 사용하고 있음을 코드 레벨로 확인했다 —
  추가 수정 불필요.

## 3. 이번 지시서 범위 초과로 별도 처리한 항목 — 1건

`StudentMyPage.tsx`의 Rival 공개 프로필 미리보기 카드에서 `{tierLabel} · SP {totalSP}` 형태의
SP 직접 노출을 추가로 발견했다. 지시서 4단계는 `StudentHome.tsx`만 명시했지만, 지시서 §3의
일반 목표("학생 화면의 SP 직접 노출을 성장 활동으로 통일한다")에 정확히 해당하고, 이 파일을
이번 패스에서 이미 레이아웃 목적으로 수정하는 중이었으므로 함께 정리했다. 사용자가 원하지
않으면 이 1줄만 롤백하면 된다(§6 참고).

이 외에 학생 화면 전체(`src/pages/student/`, `src/pages/parent/`)를 `SP {`, `· SP`, `SP ·`
패턴으로 재스캔했고, 위 3건(TeacherStudentGrowth 1건, StudentMyPage 2건, StudentHome 1건 —
그중 TeacherStudentGrowth는 학생 화면이 아니라 강사 화면이지만 지시서 2)단계에 명시되어 있어
처리) 외에는 남아있는 직접 노출이 없음을 확인했다.

## 4. 헌법/금지 항목 재스캔 — 전부 청정

| 검사 항목 | 결과 |
|-----------|------|
| 엠블럼 디자인 파일 변경 여부 (`AxisEmblemBadge.tsx`, `AxisTierMedallion.tsx`) | 0건 — MD5 바이트 단위 동일 확인 |
| `AxisEmblemPlaque.tsx` 또는 신규 엠블럼 SVG/이미지 추가 | 0건 |
| 반려된 r11-r1/r11-r2/r11-r3 체인 잔재 | 0건 |
| 불변 파일 3종 MD5 변경 | 0건 — 전부 지시서 기재값과 일치 |
| 학생 화면 재무/수납/청구/미납/환불/영수증 노출 | 0건 |
| 학부모 화면 Rival/Emblem/SP/Tier 직접 노출 | 0건 |
| 금지 표현(합격률/합격가능성/합격보장/안정합격/불합격) | 0건 |
| PC 화면 `max-w-lg` 단일 카드 방치 | TeacherStudentGrowth·StudentMyPage 해소, 나머지는 기존에 이미 해소되어 있었음 |

## 5. 빌드 검증 — 실제 시도 결과를 있는 그대로 기록

지시서 6)/7)단계가 "빌드 불가라고 허위 기록하지 않는다"를 명시했으므로, 이번에도 실제로
`node_modules`/`package-lock.json`을 지우고 처음부터 `npm install`을 다시 시도했다. 아래는
2026-07-02 04:58 UTC, 이 세션에서 편집 없이 그대로 옮긴 출력이다.

```
$ rm -rf node_modules package-lock.json && npm install --no-audit --no-fund
npm error code E403
npm error 403 403 Forbidden - GET https://registry.npmjs.org/@tailwindcss%2fvite
npm error 403 In most cases, you or one of your dependencies are requesting
npm error 403 a package version that is forbidden by your security policy, or
npm error 403 on a server you do not have access to.
```

프록시 레벨 증거(같은 세션에서 재확인):
```
$ curl -sI https://registry.npmjs.org/react
HTTP/2 403
x-deny-reason: host_not_allowed
```

**결론(전임 세션과 동일)**: 이 샌드박스 컨테이너는 네트워크 egress 정책으로
`registry.npmjs.org`가 인프라 레벨에서 차단되어 있다(`host_not_allowed`). 코드 문제가 아니라
이 컨테이너의 네트워크 정책이며, 이 환경에서는 `npm install`도 `npm run build`도 시도 자체가
불가능하다. 이것은 v3-r11-r4를 반려한 사유("npm run build 자체는 통과했다")와 모순되지
않는다 — 실제 GitHub Actions/로컬 환경에서의 빌드 통과와, 이 특정 Claude 샌드박스 세션의
네트워크 제약은 서로 다른 층위이기 때문이다. **"통과"라고 기록하지 않으며, 반대로 코드에
결함이 있어서 안 되는 것처럼도 기록하지 않는다 — 있는 그대로, 시도 자체가 막혀 있었다는
사실만 기록한다.**

### 오프라인 근사 검증 (npm install 불가를 보완)

전역 설치된 `typescript@6.0.3`(프로젝트 지정 `^5.6.3`과 메이저 차이가 있어 완전한 대체는
아님)로 임시 스텁 타입 선언(`react`/`wouter`/`lucide-react`/`sonner`/`clsx`/`tailwind-merge`/
`xlsx`/`nanoid`를 모두 `any`로 처리하는 shorthand ambient module + JSX 네임스페이스만 최소
선언)을 만들어, **이번 변경 전(v3-r10-r3+r11-r4 상태) 대비 변경 후의 오류 건수 차이만** 비교했다
(하네스 자체 노이즈는 좌우 동일하게 적용되므로 상쇄됨).

| 항목 | 결과 |
|------|------|
| 변경 전(baseline) 오류 수 | 382건 |
| 변경 후 오류 수 | 382건 |
| 신규 오류 | **0건** |
| 해결된 오류 | 0건(대상 파일 자체가 스텁 환경에서 갖는 `Cannot find module 'react'` 류 노이즈만 있었고, 그 줄 번호는 이번 수정으로 이동하지 않았음을 확인) |

정렬된 오류 목록을 파일 경로 기준으로 정규화해 `diff`한 결과 **완전히 동일**했다(추가/삭제
0줄). 이 하네스에 쓰인 스텁 파일(`_stub_globals.d.ts`, `tsconfig.check.json`)은 검증 목적
전용이며 **최종 GitHub 업로드 산출물에는 포함하지 않는다**.

**이 문서는 "npm run build 통과"를 주장하지 않는다.** 실제 그린 빌드 확인은 GitHub Actions에서
반드시 필요하다.

## 6. §GPT(개발 총괄)에게 전달할 의견

1. **`npm install` 차단은 이번에도 이 특정 샌드박스 세션에 한정된 네트워크 정책 문제였다**
   (증거는 §5). v3-r11-r4가 실제로는 빌드를 통과했다는 사실 자체가, 이 제약이 GitHub
   Actions/로컬 환경과는 무관함을 뒷받침한다.
2. **`StudentMyPage.tsx`의 SP 노출 1건(§3)을 지시서 범위를 넘어 함께 처리했다.** 원치 않으면
   `{tierLabel} · 성장 활동 {profile?.totalSP...}` 줄만 `SP`로 되돌리면 된다. 다음 지시서에
   명시적으로 승인/반려 여부를 남겨주면 이후 패스에서 일관되게 따르겠다.
3. **`StudentMyPage.tsx`의 2컬럼 배치는 "블록 이동" 대신 "그리드 span 자동 배치"로 구현했다.**
   DOM 순서를 원본과 동일하게 유지해 회귀 위험(엠블럼 관련 재배치로 오인될 소지)을 최소화하는
   방향을 택했다 — 만약 좌/우 카드 구성을 다르게(예: 획득 엠블럼을 우측으로) 원한다면 다음
   지시서에 구체적으로 명시해달라.
4. **`GrowthOverview.tsx`는 이번 패스에서 코드 변경이 전혀 없다**(§2) — 이미 정상이라 판단했다.
5. **이번 산출물은 v3-r10-r3 원본 + `GrowthOverview.tsx`(r11-r4 유지분) + 이번에 수정한 파일
   3개, 총 4개 파일 변경이 전부다.** 반려된 r11/r11-r1/r11-r2/r11-r3의 어떤 코드도 포함되어
   있지 않음을 `diff -rq` 전수 비교로 재확인했다(§0).
