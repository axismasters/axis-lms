# CHANGES — Phase 3D v3-r15-r1 (Safe Apply: 내신 대비 운영 가이드 엔진 → 최신 main)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — 왜 v3-r15를 그대로 올리지 않았는가

이번 지시서가 지목한 대로, 기존 v3-r15 산출물
(`axis-lms-v1_2-phase3d-exam-prep-guide-engine-v3-r15-github-upload.zip`)은
**v3-r14-r2**(엠블럼 에셋 통합/OFF 가드 수정 완료 시점)를 기준선으로 작업한 것이었다.
그런데 이번에 첨부된 최신 main은 **v3-r14-r3**(엠블럼 PNG 69개 전수조사·재컷팅 — `core/`
IF·습관 6종 + `tier/` 6종 재작업, 초록 시트 잔여물 제거, 1024×1024 캔버스 재정렬)까지 반영된
상태다. v3-r15 zip을 그대로 덮어쓰면 v3-r14-r3의 엠블럼 PNG 재작업분이 v3-r14-r2 시점의
PNG로 되돌아갈 위험이 있어, **지시서대로 zip 전체 덮어쓰기를 하지 않고 기능 코드만 선별
이식**했다.

## 0-1. 이번 재요청 반영 — ZIP 전체 덮어쓰기 금지, 5개 파일만 diff 패키지로 전달

이전 턴에서는 전체 프로젝트를 담은 zip으로 전달했으나, 이번 지시서는 **"ZIP 전체 덮어쓰기
금지"**를 명시했다. 이에 따라 이번 산출물은 **정확히 아래 5개 코드 파일 + 문서 4개**만
담은 diff 전용 패키지로 바꿨다(엠블럼 자산·기타 소스 파일은 패키지 자체에 포함하지
않는다 — 포함 여부와 무관하게 원본을 건드리지 않았다는 점은 §5에서 별도로 증명한다).

```
src/lib/examPrepGuideTypes.ts
src/lib/examPrepGuideEngine.ts
src/lib/examPrepGuideStore.ts
src/components/ExamPrepGuidePanel.tsx
src/pages/AssessmentDetail.tsx
docs/CHANGES_PHASE3D_v3_r15_r1.md
docs/MODIFIED_FILES_PHASE3D_v3_r15_r1.md
docs/APPLY_ORDER_PHASE3D_v3_r15_r1.md
docs/QA_PHASE3D_v3_r15_r1.md
```

`*.tsbuildinfo`(`tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`)는 이번 패키지에
**포함하지 않았다** — 애초에 이 5개 파일에 포함되지도 않고, 저장소 `.gitignore`에
`*.tsbuildinfo`가 이미 등록되어 있어 커밋 대상이 아님을 확인했다(§5-4).

`docs/CHANGES_PHASE3D_v3_r14_r3.md`에 따르면 v3-r14-r3은 "PNG 69개 구조 유지, v3-r14-r1/r2의
TypeScript 소스·라우트·기능 가드·매니페스트 매핑은 전부 그대로 유지"라고 명시돼 있다. 이를
코드로도 직접 재확인했다 — v3-r15가 의존하는 12개 파일(`assessmentData.ts`,
`AssessmentContext.tsx`, `AuthContext.tsx`, `brandColors.ts`, `dateUtils.ts`,
`systemFeatureFlags.ts`, `utils.ts`, UI 컴포넌트 5종)을 v3-r14-r2 기준(기존 v3-r15 작업
당시 원본)과 v3-r14-r3(이번 최신 main)에서 각각 MD5로 비교한 결과 **12/12 파일이
바이트 단위로 완전히 동일**했다. 즉 이번 안전 이식은 "동일한 지반 위에 동일한 패치를
다시 적용"하는 것과 같아, 로직 충돌 위험이 없었다.

## 2. 이번에 한 일

1. v3-r15에서 이미 만든 신규 파일 4개(`examPrepGuideTypes.ts` / `examPrepGuideEngine.ts` /
   `examPrepGuideStore.ts` / `ExamPrepGuidePanel.tsx`)를 **내용 변경 없이 그대로** 최신
   main에 추가했다(MD5가 v3-r15 시점과 완전히 동일 — §MODIFIED_FILES 문서 참고).
2. `AssessmentDetail.tsx`에 동일한 4곳 패치(탭 타입 확장 · import · TABS 배열 조건부 추가 ·
   탭 컨텐츠 렌더)를 재적용했다.
3. **신규 추가**: `?tab=prep` 직접 접근 시 안전장치를 한 단계 더 넣었다(§3). 지시서 §4-3이
   명시적으로 요구한 항목이며, 기존 v3-r15에는 없던 보강이다.
4. 엠블럼 관련 파일(`src/assets/**`, `src/lib/growthData.ts`,
   `src/components/brand/AxisEmblemImageBadge.tsx`,
   `src/components/brand/AxisTierMedallion.tsx`)은 **단 1바이트도 건드리지 않았다** —
   §5 검증 참고.

## 3. `?tab=prep` 직접 접근 보강 (신규)

기존 v3-r15는 `mock-school`이 아닌 시험에 `?tab=prep`으로 직접 접근하면 탭 버튼 자체는
안 보이지만, `tab` 상태값이 `'prep'`으로 남아 있어 콘텐츠 영역이 빈 채로 남을 수 있는
이론적 허점이 있었다. 이번 r15-r1에서 이중으로 막았다.

- **진입 시점 보정**(`initialTab` useMemo): URL의 `tab=prep`을 읽을 때 `exam.categoryId`가
  `mock-school`이 아니면 즉시 `'basic'`으로 대체한다.
- **런타임 재확인**(신규 `useEffect`): `tab==='prep'`인데 `exam`이 `mock-school`이 아닌
  상태가 되면(예: 같은 페이지에서 시험 데이터가 뒤늦게 갱신되는 극단적 케이스) 즉시
  `'basic'`으로 되돌린다.

두 장치 모두 기존 4개 얼리 리턴 가드(`assessment.view` 권한 체크 등)보다 앞선 훅 순서에
배치해 React Hooks 규칙을 지켰다(§QA 문서 A 항목 참고).

## 4. 신규/수정 파일 (정확히 5개 — 신규 4 + 수정 1)

| 파일 | 유형 | 비고 |
|------|------|------|
| `src/lib/examPrepGuideTypes.ts` | 신규 | v3-r15와 내용 동일(MD5 동일) |
| `src/lib/examPrepGuideEngine.ts` | 신규 | v3-r15와 내용 동일(MD5 동일) |
| `src/lib/examPrepGuideStore.ts` | 신규 | v3-r15와 내용 동일(MD5 동일) |
| `src/components/ExamPrepGuidePanel.tsx` | 신규 | v3-r15와 내용 동일(MD5 동일) |
| `src/pages/AssessmentDetail.tsx` | 수정 | v3-r15 패치 + `?tab=prep` 안전장치 추가(§3) — v3-r15와 MD5 다름 |

## 5. 엠블럼 무결성 검증

- `src/assets/emblems/` PNG 개수: **69개**(변경 전후 동일).
- `src/assets/` 디렉토리 전체를 원본 업로드 zip과 파일 단위로 byte-compare —
  **차이 0건**(`filecmp.dircmp` 재귀 비교, 신규/삭제/내용변경 전부 0).
- `src/lib/growthData.ts` / `src/components/brand/AxisEmblemImageBadge.tsx` /
  `src/components/brand/AxisTierMedallion.tsx` — 원본과 MD5 완전 일치.
- 프로젝트 전체 기준 원본 대비 변경분은 **정확히 위 5개 파일뿐**(`filecmp` 전체 재귀
  비교로 확정 — 그 외 어떤 파일도 추가/삭제/수정되지 않았다).
- **(§5-4, 신규)** `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` — 저장소
  `.gitignore`에 `*.tsbuildinfo`가 이미 등록되어 있음을 확인했다. 이번 작업은 이 두
  파일을 만들거나 수정하지 않았고, 이번 diff 패키지에도 포함하지 않았다.

### 5-1. `npm ci` / `npm run typecheck` / `npm run build` 실제 시도 결과

지시서 §6이 요구한 3개 명령을 실제로 실행했다(이 검증 샌드박스 기준).

| 명령 | 결과 | 원인 |
|------|------|------|
| `npm ci` | 실패 | `npm error 403 ... GET https://registry.npmjs.org/...` — 네트워크 egress가 `host_not_allowed`로 차단됨(코드/이번 변경과 무관, 환경 제약) |
| `npm run typecheck`(`tsc -b --noEmit`) | 실패 | `node_modules`가 없어(`npm ci` 실패의 직접 결과) `wouter`/`react/jsx-runtime` 등 실제 타입 선언을 찾지 못함(`TS2307`, `TS2875`) — 모든 실패 지점이 기존 파일(`RoleRoute.tsx`, `StudentRoutes.tsx`, `TeacherRoutes.tsx` 등)이며 이번 5개 파일과 무관 |
| `npm run build`(`tsc -b && vite build`) | 실패 | 위와 동일한 원인(1단계 `tsc -b`에서 이미 실패해 `vite build`까지 도달하지 못함) |

이 3개 명령의 실제 통과 확인은 **네트워크가 열려 있는 실제 GitHub Actions 환경에서
이루어져야 한다**(이 저장소의 기존 관행과 동일 — `docs/CHANGES_PHASE3D_v3_r14_r1.md` §5
참고). 대신 §5-2의 오프라인 스텁 `tsc` 하네스로 이번 5개 파일에 한정한 타입/문법 검증을
대체 수행했다.

### 5-2. 오프라인 스텁 tsc 하네스(대체 검증)

`npm ci`가 막혀 실제 `tsc -b`/`vite build`를 끝까지 실행할 수 없으므로, react/wouter/
lucide-react/sonner/clsx/tailwind-merge/nanoid/xlsx에 대한 느슨한(대부분 `any`) 오프라인
타입 스텁(배포 패키지에는 미포함)을 만들어 `tsc --noEmit`으로 대체 검증했다. 이번 5개
파일 + 이들이 실제 import하는 프로젝트 내부 파일만 포함한 스코프 체크 결과 **오류 0건**.
세부 실행 로그와 방법론은 `docs/QA_PHASE3D_v3_r15_r1.md` §A8을 참고.

## 6. 검증

세부 결과는 `docs/QA_PHASE3D_v3_r15_r1.md`, 파일별 MD5는
`docs/MODIFIED_FILES_PHASE3D_v3_r15_r1.md`, 적용 순서/빌드 절차는
`docs/APPLY_ORDER_PHASE3D_v3_r15_r1.md` 참고. 기능 자체의 설계 근거(회차 배분 규칙,
승인 상태 머신, localStorage 저장 이유 등)는 이번 diff 패키지에 포함하지 않은 이전 문서
(`CHANGES_PHASE3D_v3_r15.md` — v3-r14-r2 기준으로 작성된, 적용되지 않은 초안)에 정리돼
있었으나, 이번 r15-r1에서 기능 로직 자체는 바꾸지 않았으므로 그 설계 근거는 여전히
유효하다. 필요 시 참고용으로만 보관하고, 실제 저장소에는 이번 문서 4종(v3-r15-r1)만
반영하면 된다.

## 7. §GPT(개발 총괄)에게 전달할 의견

1. **v3-r15와 v3-r15-r1의 관계**: v3-r15-r1은 v3-r15의 "재작성"이 아니라 "동일 패치를
   최신 엠블럼 기준선에 재적용 + 직접 URL 접근 보강 1건 추가"다. 향후 main이 다시
   업데이트되면(예: v3-r14-r4) 같은 방식(§2)으로 다시 이식할 수 있도록 v3-r15의 신규
   파일 4개는 항상 "내용 변경 없이 그대로 복사"가 원칙이 되도록 설계를 유지했다 — 이
   4개 파일은 엠블럼/기타 어떤 기존 기능도 참조하지 않는 완전히 독립적인 모듈이라
   가능한 패턴이다.
2. **재발 방지 제안**: 이번처럼 "직전 기능 zip이 최신 엠블럼 기준선보다 오래된" 상황을
   피하려면, 기능 산출물 zip의 CHANGES 문서에 "이 zip이 어떤 baseline(예: v3-r14-r2) 위에서
   만들어졌는지"를 산출물명뿐 아니라 문서 0번 섹션에 항상 명시하는 관행을 제안한다 —
   이번 v3-r15 CHANGES 문서에도 이미 이렇게 했었고, 덕분에 이번 이식 작업의 기준선 비교
   (§1)를 빠르고 정확하게 할 수 있었다.
