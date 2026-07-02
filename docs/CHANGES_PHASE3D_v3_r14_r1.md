# CHANGES — Phase 3D v3-r14-r1 (Fix Emblem OFF Exposure Leaks)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — v3-r14(반려분)에서 시작

새 zip 업로드는 없었다. 반려 사유가 v3-r14 산출물의 구체적인 문구/함수를 정확히 지목하고
있어(`AxisEmblemImageBadge.tsx`, `성장 활동 N · 엠블럼 N개 보유` 등), 그 산출물
(`...-v3-r14-github-upload.zip`)을 재추출해 기준선으로 썼다. 사용자가 "npm install/npm run
build는 통과했다"고 명시했으므로, 이번 반려는 순수하게 Emblem OFF 상태의 노출 누수
문제였다 — 빌드 안정성 자체는 이미 확보된 상태에서 시작했다.

## 1. 반려 사유와 조치 — 지시서 4개 항목 그대로

### ① `StudentHome.tsx` — 성장 요약 카드 텍스트
**문제**: `성장 활동 N · 엠블럼 N개 보유`가 emblemEnabled 체크 없이 항상 표시됨.
**조치**: `isEmblemEnabled` import 추가, `emblemEnabled` 변수 추가. OFF면
`성장 활동 N`만, ON이면 기존과 동일하게 `· 엠블럼 N개 보유`까지 표시.

### ② `StudentMyPage.tsx` — 닉네임 안내 문구
**문제**: `닉네임은 Rival, Emblem, 성장 진열장에서 사용됩니다.`가 emblemEnabled와 무관하게
고정 문구였음(이 카드 자체는 이미 rivalEnabled로 게이트되어 있었지만, 그 안에서
"Emblem" 단어 자체는 조건 없이 항상 포함).
**조치**: `emblemEnabled`일 때만 `, Emblem`을 문구에 끼워 넣도록 수정.
- Rival ON + Emblem ON: `닉네임은 Rival, Emblem, 성장 진열장에서 사용됩니다.`(기존과 동일)
- Rival ON + Emblem OFF: `닉네임은 Rival, 성장 진열장에서 사용됩니다.`
- (Rival OFF일 때는 이 카드 전체가 이미 v3-r12부터 비활성 안내로 대체되므로 이 문구
  자체가 렌더링되지 않는다 — 해당 케이스는 원래도 안전했음)
보유 엠블럼 영역의 기존 `FeatureDisabledNotice`는 지시대로 손대지 않았다.

### ③ `StudentDetail.tsx` — 라이벌 카드 상대 정보 + 수동 지급 모달
**문제 1**: "현재 라이벌" 카드 안의 상대 학생 정보 `SP N · 엠블럼 N개`가 emblemEnabled와
무관하게 항상 표시됨(이 텍스트는 rivalEnabled 블록 안에 있었지만, Emblem 부분은 별도
조건이 없었음).
**조치**: `emblemEnabled`일 때만 `· 엠블럼 N개`를 붙이도록 수정 — OFF면 `SP N`만 표시.

**문제 2**: 엠블럼 수동 지급 버튼은 이미 `canGrantEmblem && emblemEnabled`로 게이트되어
있었지만, 지급 모달(`embModal` 상태 기반 렌더)에는 emblemEnabled 체크가 없었다 — 버튼이
사라져도 모달이 열려있는 상태(예: 설정을 끈 시점에 이미 모달이 열려 있던 경우)라면
화면에 남을 수 있는 이론적 허점이었다.
**조치**: 모달 렌더 조건에 `&& emblemEnabled`를 추가(`{embModal && emblemEnabled && (...)}`).

**추가 하드닝(§5 전체 재검색 중 발견)**: 대표 엠블럼 3슬롯 / 최근 획득 엠블럼 / 진행 중
엠블럼, 3곳 모두 `getEmblemImageByExistingId()`를 직접 호출하고 있었는데, 이 저수준 함수
호출부는 `AxisEmblemImageBadge`의 내부 가드를 거치지 않는다. 이미 세 곳 다 상위 JSX에서
`{emblemEnabled && (...)}`로 감싸여 있어 실질적 누수는 없었지만(직접 검증함), 지시서가
강조한 "호출부가 실수해도 안전해야 한다" 원칙에 맞춰 **세 곳 모두 이미지 조회 시점에도
`emblemEnabled` 명시적 조건을 추가**했다(`emblemEnabled ? getEmblemImageByExistingId(...) :
undefined`) — 이중 방어.

### ④ `AxisEmblemImageBadge.tsx` — SVG fallback 자체가 OFF 상태 최종 방어선이 되도록 재구성
**문제**: 기존 로직은 `isEmblemEnabled() ? getEmblemImageByExistingId(...) : undefined`
형태로 PNG 조회만 OFF일 때 막았을 뿐, `imageSrc`가 없으면(매핑 실패 *또는* OFF 둘 다) 항상
`<AxisEmblemBadge>`(SVG) fallback으로 흘러갔다 — 즉 OFF 상태에서도 SVG로 엠블럼이 그대로
보이는 게 실제 반려 사유였다.
**조치**: 함수 최상단에서 `if (!isEmblemEnabled()) return null;`을 가장 먼저 검사하도록
재구성했다. 이제 분기는 정확히 3가지:
```
OFF                        → null(아무것도 렌더링 안 함)
ON + PNG 매핑 있음          → PNG 이미지
ON + PNG 매핑 없음          → 기존 AxisEmblemBadge SVG
```
이 컴포넌트를 쓰는 6개 화면(StudentGrowthShowcase, StudentMyPage, TeacherStudentGrowth,
TeacherStudentDetail, StudentDetail 일부, EmblemManagement) 전부 이미 상위에서
emblemEnabled로 게이트되어 있어 이 null 반환은 실전에서는 도달하지 않는 "최종 방어선"이지만,
지시서가 명시한 "호출부가 실수해도 OFF에서 안 보여야 한다"를 컴포넌트 자체가 보장하도록 했다.

## 2. §5 전체 검색 점검 결과 — 추가 누수 0건

지시서가 지정한 5개 키워드(`엠블럼`, `Emblem`, `emblem`, `AxisEmblemImageBadge`,
`getEmblemImageByExistingId`)로 `src/` 전체를 재검색했다.

- `getEmblemImageByExistingId`의 모든 호출부(`AxisEmblemImageBadge.tsx` 1곳 +
  `StudentDetail.tsx` 3곳) 전수 확인 — 전부 emblemEnabled 게이트 안에 있고, 이번에 3곳
  모두 명시적 조건까지 추가했다(§1-③).
- 학생/교사/관리자 화면에 남아있는 "엠블럼"/"Emblem" 문자열은 전부 (a) 이미 emblemEnabled로
  게이트된 블록 안, (b) `FeatureDisabledNotice`의 OFF 안내 메시지 자체(의도된 노출), (c) 주석
  또는 TypeScript 타입 이름(`Emblem`, `EmblemCategory` 등, 화면에 렌더링되지 않음) 중 하나임을
  확인했다 — 실사용자에게 조건 없이 보이는 지점은 0건.
- 학부모 화면(`src/pages/parent/`, `ParentLayout.tsx`)도 재검색해 여전히 주석 외 실제 노출
  0건임을 재확인했다(이번 Phase에서 학부모 파일은 건드리지 않았고, 회귀도 없음).

## 3. 검토했지만 손대지 않은 지점

- **`AxisTierImageMedallion.tsx`**: 지시서가 명시적으로 지목하지 않았고, Tier는
  emblemEnabled와 무관한 별개 시스템(§ "Tier/SP/성장 활동 흐름은 유지한다")이라 손대지
  않았다.
- **`TeacherStudentDetail.tsx`의 `growthConsultingNote`**: v3-r12-r2에서 이미
  `showEmblemCount` 플래그로 처리되어 있고, 이번 재검색에서도 emblemEnabled OFF 시 정상
  작동함을 재확인했다(회귀 없음) — 추가 수정 불필요.

## 4. 불변/디자인/데이터/PNG 무결성 — 전부 재확인

| 항목 | 결과 |
|------|------|
| 불변 파일 3종 MD5 | 전부 일치 |
| `AxisEmblemBadge.tsx` / `AxisTierMedallion.tsx` | 바이트 단위 동일(수정 0줄) |
| `growthData.ts` | 바이트 단위 동일(수정 0줄) |
| PNG 69개 | 원본과 해시 전수 일치(재디자인/변형 없음) |
| 기존 학생 획득 기록 | 변경 없음(이번 수정은 표시 텍스트/조건문뿐, 데이터 레코드 미변경) |

## 5. 빌드 검증

이 샌드박스에서 실제 `npm install`을 재시도했다(2026-07-02 07:35 UTC) — 이번에도
`E403 host_not_allowed`(네트워크 정책, 코드 무관). 사용자가 v3-r14 시점에 이미 실제
`npm install`/`npm run build`가 통과했다고 확인해줬고, 이번 수정은 텍스트 조건문과 함수
로직 재배치뿐이라 빌드 리스크는 낮다고 판단한다.

오프라인 스텁 tsc 하네스로 **v3-r14(반려된 산출물) 대비** 비교:

| 항목 | 결과 |
|------|------|
| 기준선 오류 수 | 388건 |
| 변경 후 오류 수 | 388건(변동 없음) |
| diff 상 차이 | 2건 추가/2건 삭제 — 전부 import 재배치·조건문 추가로 인한 순수 줄-번호 이동(TS2875, react/jsx-runtime 스텁 한계). 로직 오류 0건. |

**"npm run build 통과"를 이 세션에서 재확인했다고 주장하지 않는다.** 사용자가 확인한
v3-r14의 그린 빌드 결과와, 이번 변경이 텍스트/조건문 수준으로 국한된다는 점을 근거로 빌드
리스크가 낮다고 판단할 뿐이며, 최종 확인은 다시 GitHub Actions에서 이루어져야 한다.

## 6. §GPT(개발 총괄)에게 전달할 의견

1. **`AxisEmblemImageBadge`가 이제 OFF일 때 `null`을 반환한다.** 이 컴포넌트를 감싸는
   부모 요소가 "항상 자식이 있다"고 가정한 레이아웃(예: flex gap이 있는데 자식이 사라지면
   미세하게 간격이 달라지는 경우)이 있는지는 실제 브라우저에서 확인이 필요하다 — 코드
   검토로는 6개 화면 모두 이미 emblemEnabled로 상위가 게이트되어 있어 이 분기가 실전에서
   호출되지 않으므로 문제없다고 판단했지만, 스테이징 QA에서 한 번 더 봐주면 좋겠다.
2. **StudentDetail.tsx의 3개 저수준 호출부에 이중 가드를 추가했다(§1-③ 추가 하드닝).**
   지시서가 명시하진 않았지만 §5 검색 원칙에 따라 선제적으로 처리했다.
