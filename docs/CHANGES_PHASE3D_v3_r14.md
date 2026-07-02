# CHANGES — Phase 3D v3-r14 (Emblem PNG Asset Integration)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline) — v3-r13 산출물 + 이번에 업로드된 에셋 zip

이번 턴은 코드 zip 업로드는 없었지만(지시서 §2가 직전 v3-r13 산출물과 정확히 일치해 그
상태를 이어받았다), **`axis_lms_emblem_assets_v1.zip`(엠블럼 이미지 에셋)은 실제로
업로드되었다.** 이 문서의 baseline은 "v3-r13 코드 + 이번에 업로드된 에셋 zip"이다.

시작 전 검증:
- 불변 파일 3종 MD5 일치, `AxisEmblemBadge.tsx`/`AxisTierMedallion.tsx` 바이트 동일,
  `growthData.ts` 바이트 동일 — 전부 이번 세션에서도 재확인했다(§7).
- 에셋 zip 구성: `manifest.json`(69건, flat array), `emblems/{tier,core,hidden,math_units}`
  개별 PNG 69개(1024×1024, 투명 배경), `source_sheets/`·`transparent_sheets/`·미리보기
  PNG는 지시서대로 앱에 반입하지 않았다(보관용, 렌더링에 미사용).

## 1. 이번 Phase의 특수성 — "엠블럼 디자인 파일 절대 수정 금지"와의 관계

이 프로젝트는 여러 Phase에 걸쳐 "엠블럼 디자인 파일(`AxisEmblemBadge.tsx`,
`AxisTierMedallion.tsx`) 수정 금지"를 지켜왔다(v3-r11 계열 재설계가 3~4연속 반려된 전례).
이번 v3-r14는 이 원칙과 정면으로 충돌하지 않도록 다음 설계를 택했다:

- **`AxisEmblemBadge.tsx`, `AxisTierMedallion.tsx`는 단 한 줄도 수정하지 않았다.**
  MD5가 이번 세션 시작 전과 완전히 동일함을 확인했다(§7).
- 대신 지시서가 제시한 두 옵션(`AxisEmblemBadge`에 prop 추가 / `AxisEmblemImageBadge.tsx`
  신규 추가) 중 **후자**를 선택했다 — 기존 파일을 절대 건드리지 않는 쪽이 "디자인 파일
  수정 금지" 원칙에 가장 안전하게 부합한다고 판단했다.
- `AxisEmblemImageBadge.tsx`/`AxisTierImageMedallion.tsx`(둘 다 신규)는 PNG 매핑이 있으면
  이미지를, 없으면 **기존 SVG 컴포넌트를 그대로 호출**하는 얇은 래퍼다. 즉 이번 변경은
  "엠블럼 디자인을 바꾸는" 작업이 아니라 "검수 통과한 실사진 에셋을 우선 얹고, 없으면 기존
  디자인을 그대로 쓰는" 작업이다.

## 2. 에셋 배치

`src/assets/emblems/{core,tier,hidden,math_units}/`에 69개 PNG를 원본 그대로 복사했다
(파일명 유지, 압축/리사이즈/색상 변경 없음). 복사 전후 MD5 해시를 전수 비교해 **69개 전부
바이트 단위로 동일함을 확인했다**(§7). `source_sheets/`, `transparent_sheets/`, 미리보기
PNG(총 58MB 중 개별 에셋 몫만 반입, 시트/미리보기는 미반입)는 앱에 포함하지 않았다.

## 3. manifest 기반 매핑 — `src/lib/emblemAssetManifest.ts`(신규)

- manifest.json의 69건(title/category/condition/asset)을 그대로 옮겨 담았다.
- **PNG 로딩 방식**: 처음엔 `import.meta.glob()`을 검토했으나, 이 프로젝트가
  `universityAnalysisClient.ts` 주석에 명시된 대로 **`vite/client` 타입 참조를 의도적으로
  피하고 있어**(`import.meta.glob`은 vite/client 타입 없이는 TS 컴파일 오류가 난다),
  이미 이 프로젝트가 쓰던 정적 import 패턴(`AxisMark.tsx`의 `@/assets/brand/*.png` import와
  동일한 방식)을 그대로 따라 **69개 PNG를 개별 정적 import**했다. import 변수명과 매핑
  테이블 키를 프로그래밍적으로 상호 대조해 전부 일치함을 확인했다(69/69, 미사용/미정의 0건).
- **기존 엠블럼 id 매핑(`EMBLEM_ID_TO_ASSET_ID`)** — growthData.ts `MOCK_EMBLEMS`(37건)와
  manifest(69건)는 완전히 다른 id 체계다. 이름/조건 문구가 명확히 일치하는 경우만 연결했다
  (총 23건). 나머지 14건(emb-005/007/010/011/015/017/019~022/024~026,
  growth_streak_01)은 애매하거나 대응 자산이 없어 **의도적으로 비워뒀다** — 계속 기존
  SVG로 렌더링된다(지시서 §8 "ID가 맞지 않는 항목은 별도 fallback 처리"). 매핑 근거는
  파일 내 주석에 항목별로 남겼다.
- **Tier 매핑(`TIER_TO_ASSET_ID`)** — `TIER_LABELS`(SEED/FOUNDATION/FOCUS/STRATEGY/
  MASTERY/AXIS_MASTER)와 manifest의 tier 6종이 이름으로 정확히 1:1 대응해 전부 연결했다
  (UNRANKED만 매핑 없음 → 기존 SVG 방패).
- **math_units 21종**은 growthData.ts에 대응하는 카탈로그 항목이 아예 없어(단원별 엠블럼
  자체가 없음) 매니페스트에는 포함했지만 현재 화면 어디에도 연결되지 않는다(향후 카탈로그
  확장용으로 대기).
- 기존 `growthData.ts`는 이 파일에서 **전혀 import/수정하지 않았고**, id 문자열도 절대
  변경하지 않았다.

## 4. 렌더러 — 신규 2개

| 파일 | 역할 |
|------|------|
| `src/components/brand/AxisEmblemImageBadge.tsx` | `emblemId`로 이미지 조회 → 있으면 `<img>`, 없으면 기존 `AxisEmblemBadge` SVG. `locked` 상태는 저채도+회색조 CSS로 흐리게(원본 파일 변형 아님). emblemEnabled가 false면 이미지 자체를 조회하지 않고 항상 SVG로만 렌더(방어적 이중 가드). |
| `src/components/brand/AxisTierImageMedallion.tsx` | 동일한 방식으로 Tier 이미지/기존 SVG 방패 fallback. |

## 5. 적용 화면 — 학생/교사/관리자, 총 6개 파일

| 파일 | 화면 | 교체 지점 |
|------|------|-----------|
| `StudentGrowthShowcase.tsx` | 학생 성장 진열장 | 엠블럼 컬렉션 타일, Tier Hero 메달리온 2곳 |
| `StudentMyPage.tsx` | 학생 마이페이지 | 보유 엠블럼 그리드, Tier 메달리온 |
| `TeacherStudentGrowth.tsx` | 교사 담당학생 성장현황 | GrowthCard "최근 엠블럼" 배지 |
| `TeacherStudentDetail.tsx` | 교사 학생상세 상담요약 | "보유 엠블럼 · 최근" 배지 |
| `StudentDetail.tsx` | 관리자 학생상세 성장/진열장 탭 | 대표 엠블럼 3슬롯, 최근 획득 엠블럼, 진행 중 엠블럼(저채도 처리), Tier 헤더 메달리온 |
| `EmblemManagement.tsx` | 관리자 엠블럼 관리 | 목록 테이블 배지 |

StudentDetail.tsx의 3개 슬롯은 기존에 `AxisEmblemBadge` 컴포넌트가 아니라 Trophy 아이콘 +
재질색 배지라는 **다른 시각 패턴**을 쓰고 있었다 — 그래서 래퍼 컴포넌트 대신
`getEmblemImageByExistingId()`를 직접 호출해, 이미지가 있으면 그 자리에 이미지를, 없으면
**기존 Trophy+라벨을 그대로** 쓰도록 최소 변경했다(레이아웃 변경 없음).

StudentHome.tsx는 엠블럼 텍스트(개수)만 있고 아이콘 컴포넌트 호출이 없어 지시서 §5의
"있다면"에 해당하지 않아 손대지 않았다(재확인 완료).

## 6. Emblem OFF 연동

기존(v3-r12/r13)에 이미 위 6개 화면의 엠블럼 표시 영역 전체가 `emblemEnabled` 조건부
렌더링으로 게이트되어 있었다 — 그래서 OFF 상태에서는 이미지가 들어간 컴포넌트 자체가
아예 마운트되지 않는다. 여기에 더해 `AxisEmblemImageBadge`/`AxisTierImageMedallion`
내부에도 방어적으로 `isEmblemEnabled()` 체크를 넣어, 혹시 미래에 게이트 밖에서 호출되더라도
이미지 대신 항상 기존 SVG만 렌더링하도록 이중 방어했다(v3-r13의 하드닝 기조와 일관).

## 7. 불변/디자인/데이터 무결성 — 전부 재확인

| 항목 | 결과 |
|------|------|
| 불변 파일 3종 MD5 | 전부 일치(변경 없음) |
| `AxisEmblemBadge.tsx` | 바이트 단위 동일(수정 0줄) |
| `AxisTierMedallion.tsx` | 바이트 단위 동일(수정 0줄) |
| `growthData.ts`(기존 엠블럼 37종 데이터/ID) | 바이트 단위 동일(수정 0줄) |
| PNG 69개 원본 대비 복사본 | 해시 전수 비교 69/69 완전 동일(재디자인/리사이즈/압축 없음) |
| 기존 학생 획득 기록(StudentEmblem) | 변경 없음(이 Phase는 표시 방식만 바꿨고 데이터 스키마/레코드는 전혀 건드리지 않음) |

## 8. 검토했지만 손대지 않은 지점

- **학부모 화면**: 이번 Phase에서 어떤 학부모 화면 파일도 수정하지 않았다. 학부모 화면은
  기존 원칙대로 Emblem/Tier 명칭·이미지를 노출하지 않으므로 이번 PNG 통합과 무관하다
  (§7 재확인 시 학부모 파일 변경 이력 없음을 diff로 확인).
- **math_units 21종의 실제 화면 적용**: 대응하는 카탈로그 항목이 없어 매니페스트에만
  포함하고 화면에는 연결하지 않았다. 다음 Phase에서 단원별 엠블럼 카탈로그를 신설하면
  바로 쓸 수 있다.
- **애매한 14건의 기존 엠블럼-자산 매칭**: 추측으로 연결하지 않고 전부 SVG fallback으로
  남겼다(§3).

## 9. 빌드 검증

이 샌드박스에서 실제 `npm install`을 재시도했다(2026-07-02 07:11 UTC) — 이번에도
`E403 host_not_allowed`(네트워크 정책, 코드 무관, 이전 세션들과 동일).

오프라인 스텁 tsc 하네스로 **v3-r13(직전 산출물) 대비** 비교:

| 항목 | 결과 |
|------|------|
| 기준선 오류 수 | 386건 |
| 변경 후 오류 수 | 388건(+2) |
| +2건의 정체 | 신규 파일 `AxisEmblemImageBadge.tsx`/`AxisTierImageMedallion.tsx`의 `react/jsx-runtime` 스텁 한계(기존 382건과 동일 카테고리) — `StudentDetail.tsx`에 import 1줄이 늘며 생긴 7건의 줄-번호 이동은 정확히 상쇄되어 diff에 순수 시프트로만 나타남(신규/삭제 페어 확인) |
| `*.png` 모듈 해석 | 이 프로젝트가 이미 갖고 있던 `src/global.d.ts`의 `declare module '*.png'` 선언 덕분에 스텁 환경에서도 오류 0건 |
| `emblemAssetManifest.ts` 자체 오류 | 0건(325줄, import 69개 전부 검증) |

**"npm run build 통과"를 주장하지 않는다.** GitHub Actions에서 최종 확인 필요. 다만 PNG
정적 import는 이 프로젝트가 이미 `AxisMark.tsx` 등에서 실제로 쓰고 있는 검증된 패턴이라
빌드 리스크는 낮다고 판단한다.

## 10. §GPT(개발 총괄)에게 전달할 의견

1. **`import.meta.glob` 대신 정적 import 69개를 택한 이유(§3)** — 이 프로젝트가 vite/client
   타입 참조를 의도적으로 피해온 기존 관례를 존중했다. 만약 실제로는 vite/client 참조가
   허용된다면(GitHub Actions 환경에서는 문제없을 수도 있음) 다음 단계에서 glob 방식으로
   리팩터링해 69줄의 import를 줄일 수 있다 — 필요하면 지시해달라.
2. **23건만 기존 엠블럼과 연결하고 14건은 비워둔 판단(§3)**을 검토해달라. 특히 `emb-007`
   (개념 정복자)과 `concept_mastery_01`(Concept Mastery)이 둘 다 "개념 부족" 주제라
   `if_concept_mastery` 자산을 어느 쪽에 연결할지 애매했는데, 조건 문구가 더 정확히
   일치하는 `concept_mastery_01`을 택했다 — 반대라면 알려달라.
3. **StudentDetail.tsx의 3개 슬롯은 래퍼 컴포넌트를 쓰지 않고 저수준 함수를 직접
   호출했다(§5)** — 기존이 AxisEmblemBadge가 아닌 다른 시각 패턴(Trophy+재질배지)이라
   그렇게 했다. 이 부분을 다른 화면들과 시각적으로 통일하고 싶다면(예: 모두
   AxisEmblemImageBadge 원형 배지로) 다음 지시서에 명시해달라.
4. **math_units 21종은 화면에 아직 연결되지 않았다(§8)** — 단원별 엠블럼 카탈로그를 만들
   계획이 있다면 이 매니페스트를 바로 재사용할 수 있다.
