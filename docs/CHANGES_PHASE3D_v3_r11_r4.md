# CHANGES — Phase 3D v3-r11-r4 (Clean Main / PC Layout / Constitution Cleanup)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — 이번에는 추정하지 않고 실제 원본 zip에서 시작했다

`/mnt/user-data/uploads/axis-lms-v1_2-phase3d-growth-motivation-rival-emblem-v3-r10-r3-github-upload.zip`
(사용자가 이 프로젝트 시작 시 업로드한 v3-r10-r3 원본)을 **다시 압축 해제해 완전히 새로운
작업 디렉토리를 만들고, 여기서부터 시작했다.** 이전 r11 / r11-r1 / r11-r2 / r11-r3에서
누적된 작업 디렉토리는 전혀 사용하지 않았다(디스크에는 대조군으로만 남겨두었다).

확인한 사실:
- 이 원본 zip에는 로그인 AXIS 히어로 이미지(`axis-hero-dark.png`), 실제 AXIS 마크 이미지,
  네이비 토큰(`AXIS_NAVY = '#040E1F'`)이 **이미 포함되어 있다** — 즉 이 항목들은 v3-r10-r3
  자체에 포함된 것이었고, 별도로 재구성할 필요가 없었다.
- `AxisEmblemPlaque.tsx`(반려된 r11 체인에서 신설한 파일)는 이 원본에 **존재하지 않는다** —
  즉 이번 작업물에는 반려된 엠블럼 재설계 산출물이 전혀 섞여 있지 않다.

## 1. 실제 수정한 파일 — 정확히 1개

### `src/pages/growth/GrowthOverview.tsx`
- 요약 카드 5개 그리드가 `style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}`로 **반응형
  대응이 전혀 없는 고정 5칸**이었던 것을 `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`로 교체.
  이 화면은 8개 점검 대상 중 유일하게 반응형 breakpoint가 없는 그리드를 쓰고 있었다(나머지는
  검색·테이블 모두 AdminLayout 전체 폭을 그대로 사용해 이미 넓게 펼쳐져 있었음).
- 그 외 이 파일의 다른 부분(재질 칩 `MATERIAL_LABELS`/`MATERIAL_BADGE` 등)은 **의도적으로
  손대지 않았다** — 이는 "엠블럼 관련 처리"의 성격이고, 이번 지시서는 엠블럼 관련 작업을
  명시적으로 범위에서 제외했기 때문이다.

## 2. 점검했지만 수정하지 않은 화면 — 7개(이미 PC 대시보드 구조였음)

아래 화면들을 전부 코드 레벨로 다시 읽고 확인했다. 전부 이미 `lg:` 반응형 다단 컬럼 구조를
갖추고 있었고(대부분 `[Phase 3D v3-r7-r1] PC 최적화` 주석이 남아있어, v3-r7 단계에서부터
구축된 것으로 확인됨), 모바일 카드 나열형이 아니었다. 그래서 수정하지 않았다.

| 화면 | 확인된 구조 |
|------|-------------|
| `StudentHome.tsx` | `lg:max-w-6xl` + 3컬럼(`lg:col-span-3` 인사 밴드 + `lg:col-span-2`/`lg:col-span-1`) |
| `ParentHome.tsx` | `lg:max-w-6xl` + 3컬럼(2:1) |
| `TeacherHome.tsx` | `lg:max-w-6xl` + 3컬럼(2:1) |
| `StudentGrowthShowcase.tsx` | `lg:max-w-6xl`, Hero 전체폭 밴드 + 2컬럼(엠블럼갤러리+습관 / IF요약+기록+Rival) |
| `StudentRival.tsx` | `lg:max-w-6xl` + 2개의 `lg:grid-cols-3`(2:1 비대칭) |
| `ParentGrowthReport.tsx` | `lg:max-w-6xl` + 2× `lg:grid-cols-2` |
| `StudentGrades.tsx`(결과 추이) | `lg:max-w-6xl`, `ResultTrendPanel`이 전체 폭 넓은 분석 패널로 이미 구현되어 있고, 데이터 1건일 때 "첫 기준점/최근 기록/다음 테스트 안내" 3분할 처리도 이미 있음(코드 확인, 변경 없음). |

**결론**: 이번 지시서가 요구한 "PC 화면에서 좁게 몰리는 화면"은 8개 대상 중 GrowthOverview
1곳뿐이었다. 나머지 7곳은 이미 정상이었으므로 "필요한 경우에만 수정한다"는 지시에 따라
그대로 두었다.

## 3. 헌법 위반 스캔 — 전부 청정(가드 주석만 존재, 실제 노출 0건)

| 검사 항목 | 결과 |
|-----------|------|
| 학생 화면 재무/수납/청구/미납/환불/영수증 | 0건(가드 주석만) |
| 학부모 화면 Rival/Emblem/SP/Tier 직접 노출 | 0건(가드 주석만, 간접 표현 사용) |
| 금지 표현(합격률/합격가능성/합격보장/안정합격/불합격) | 0건(가드 주석만) |

## 4. 이번에 발견했지만 "이번 패스에서는" 손대지 않은 것 — §6에 정리

`StudentHome.tsx`에 `SP {totalSP} · 엠블럼 N개 보유`처럼 학생 화면에 "SP" 약어가 직접
노출되는 지점을 발견했다. 그러나 이번 지시서의 헌법 체크리스트는 **"학부모 화면"의 SP
노출만 명시적으로 금지**하고 있고 학생 화면 SP 표기는 이번 체크리스트 항목이 아니며, "엠블럼
관련"으로 분류될 여지도 있어 **이번 패스에서는 수정하지 않았다**(§6 참고 — 다음 지시에
명시적으로 포함되면 즉시 처리 가능).

## 5. 빌드 검증 — 실제 시도 결과를 있는 그대로 기록

이번 지시서가 "로컬 빌드 불가 같은 거짓 기록 금지"를 명시했으므로, **다시 한 번 실제로
`npm install`을 새 작업 디렉토리에서 처음부터 실행**했다(기존 node_modules/package-lock.json
삭제 후 재시도). 아래는 편집 없는 실제 출력이다.

```
$ npm install --no-audit --no-fund
npm error code E403
npm error 403 403 Forbidden - GET https://registry.npmjs.org/@tailwindcss%2fvite
npm error 403 In most cases, you or one of your dependencies are requesting
npm error 403 a package version that is forbidden by your security policy, or
npm error 403 on a server you do not have access to.
```

추가로 프록시 레벨 증거도 직접 확인했다:
```
$ curl -sI https://registry.npmjs.org/react
HTTP/2 403
x-deny-reason: host_not_allowed
```

**결론**: 이 작업 환경(샌드박스 컨테이너)은 네트워크 egress 정책으로 `registry.npmjs.org`
자체가 인프라 레벨에서 차단되어 있다(`host_not_allowed`). 이것은 코드 문제가 아니라 이
컨테이너의 네트워크 정책이며, 프로젝트 코드를 아무리 고쳐도 이 컨테이너 안에서는
`npm install`이 성공할 수 없다. **따라서 `npm run build`도 이 환경에서는 실행 자체가
불가능했다** — 이것이 실제 결과이며, "통과" 또는 "실패"로 위장하지 않고 있는 그대로
보고한다.

이를 보완하기 위해 오프라인 스텁 기반 TypeScript 타입체크 하네스(`tsc -p tsconfig.check.json`,
실제 `npm run build`가 아니라 문법/타입 오류만 잡아내는 근사 검증 도구)로 확인한 결과:
- 이번 v3-r10-r3 원본 기준 baseline 오류 57건(전부 Finance/Assessment 등 이번 변경과 무관한
  파일의 스텁 환경 노이즈 — 실제 `npm install` 환경에서는 발생하지 않을 것으로 추정되는
  타입 정의 누락성 오류들).
- 변경 후에도 57건, **신규 오류 0건**.

이것이 이 환경에서 낼 수 있는 최선의 검증이며, **실제 `npm run build` 그린 확인은 GitHub
Actions에서 반드시 이루어져야 한다.** 이 문서는 "빌드 통과"라고 주장하지 않는다.

## 6. §GPT(개발 총괄)에게 전달할 의견

1. **`npm install`이 안 되는 것은 이 특정 Claude 세션/컨테이너의 네트워크 정책 때문이며,
   실제 GitHub Actions 환경에서는 문제가 없을 것으로 예상된다.** Actions 러너는 일반적으로
   `registry.npmjs.org`에 정상 접근 가능하다. 이 문서의 `x-deny-reason: host_not_allowed`
   증거는 "이 샌드박스"에 한정된 제약임을 명확히 하기 위해 남긴다.
2. **`StudentHome.tsx`의 "SP" 직접 노출은 다음 패스에서 처리 여부를 결정해달라.** 학생
   화면이라 학부모 화면 금지 규정에는 해당하지 않지만, 일관성 차원에서 "성장 활동"으로
   통일하고 싶다면 명시적으로 지시해달라 — 이번엔 지시서 체크리스트에 없어 손대지 않았다.
3. **GrowthOverview의 재질 칩(`MATERIAL_LABELS`/`MATERIAL_BADGE`)은 여전히 원본 그대로다.**
   이번 지시서가 "엠블럼 관련 처리"를 명시적으로 범위 밖에 뒀기 때문에 그대로 뒀다. 만약
   이것도 "레이아웃"이 아니라 "표현 정리" 관점에서 이번 범위에 포함되길 원했다면 다음
   지시서에 명시해달라.
4. **이번 산출물은 v3-r10-r3 원본 + 파일 1개 수정이 전부다.** 반려된 r11/r11-r1/r11-r2/
   r11-r3의 어떤 코드도 포함되어 있지 않음을 `diff -rq` 전수 비교로 확인했다(§0, §1).
