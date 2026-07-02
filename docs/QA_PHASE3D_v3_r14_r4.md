# QA — Phase 3D v3-r14-r4 (Student Growth / Rival / Emblem Premium UI Cleanup)

기준: v3-r14-r3 + v3-r15-r1 → v3-r14-r4 · 성격: 기존 화면 6개의 시각 디자인 정리(신규
라우트/데이터 변경 없음)

---

## A. 자동 검증 (수행 완료)

| # | 항목 | 방법 | 결과 |
|---|------|------|------|
| A1 | 변경 파일 범위 | 원본 업로드 zip 대비 `filecmp.dircmp` 재귀 전수 비교 | ✅ 정확히 6개 수정(신규/삭제 없음), r15-r1 5개 파일은 직전 산출물과 MD5 동일하게 유지 |
| A2 | 엠블럼 PNG 개수 | `find src/assets/emblems -iname "*.png" \| wc -l` | ✅ 69개 |
| A3 | 엠블럼 자산 무결성 | `src/assets/**` 전체 byte-compare(원본 대비) | ✅ 차이 0건 |
| A4 | 엠블럼 가드 파일 무결성 | MD5 대조(`growthData.ts`/`AxisEmblemImageBadge.tsx`/`AxisTierMedallion.tsx`) | ✅ 3/3 원본과 일치 |
| A5 | r15-r1 기능 유지 | 5개 파일 MD5를 직전 safe-apply 산출물과 대조 | ✅ 5/5 완전 동일(삭제/되돌리기 없음) |
| A6 | 불변 파일 3종 | md5sum 대조 | ✅ 3/3 일치 |
| A7 | 라우트 회귀 | `src/routes/*.tsx`, `src/App.tsx` 무변경 확인 | ✅ 무변경(신규 라우트 없음) |
| A8 | 타입/문법 검증 | 오프라인 스텁 `tsc` 하네스(수정 파일 6종 스코프) | ✅ 오류 0건 |
| A9 | 타입/문법 검증(전체 스코프) | 오프라인 스텁 `tsc` 하네스(`src/**` 전체) | ✅ 73건(전부 이번 변경과 무관한 기존 파일 — §A9 상세) |
| A10 | 퍼센트-높이 버그 재발 여부 | `grep "height: .\{0,3\}%'"` 유사 패턴 전체 재검색 | ✅ 0건(StudentRival.tsx의 해당 2줄을 픽셀 계산으로 수정 완료, 다른 곳에 동일 패턴 없음) |
| A11 | 전투/게임 과몰입 표현 | `grep "Swords\|칼\|무기\|전투"` (수정 파일 6종) | ✅ 실사용 0건(CHANGES 문서 설명 텍스트 제외) |
| A12 | 재무/합격 금지 표현 | `grep`(수정 파일 6종) | ✅ 실사용 0건(기존 가드 주석만 존재, 신규 위반 없음) |
| A13 | 학부모 화면 Rival/Emblem/SP/Tier 노출 | `src/pages/parent/**` 무변경 확인 | ✅ 무변경(기존 가드 그대로 유지) |
| A14 | tsbuildinfo 오염 여부 | `tsconfig.app.tsbuildinfo`/`tsconfig.node.tsbuildinfo` byte-compare(원본 대비) | ✅ 완전 동일(§CHANGES 문서 §4 — 이전 세션 오염분 원복 완료) |

**불변 MD5**
- `universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f` ✓
- `App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c` ✓
- `classData.ts` = `126d9e5e314de186bf1df0a63b3abf82` ✓

### A9 상세 — tsc 스텁 하네스

`npm install`이 이 샌드박스에서 `E403 host_not_allowed`(네트워크 정책)로 실패해 실제
`tsc -b`/`vite build`를 실행할 수 없다. 오프라인 스텁(react/wouter/lucide-react/sonner/
clsx/tailwind-merge/nanoid/xlsx 대응)으로 `tsc --noEmit` 대체 검증했다. 이번 Phase에서
스텁 자체의 정확도도 개선했다(JSX `key` prop 처리, `useRef<T>(null)` DOM ref 패턴 지원,
누락된 `ArrowRight` 아이콘 추가) — 그 결과 프로젝트 전체 스코프 오류가 77건→73건으로
줄었다(모두 스텁 근사 한계 해소, 실제 코드 변경 아님).

- **수정 파일 6종 스코프**: 오류 0건.
- **전체 프로젝트 스코프**: 73건 — 전부 `FinanceRefunds.tsx`(20건), `useDraggableModal.ts`
  (4건), `AssessmentDetail.tsx`의 기존 미변경 코드(5건, r15-r1 QA 문서에서 이미 확인된
  동일 건) 등 이번 변경과 무관한 파일에서 발생.
- **"npm run build 통과"를 이 세션에서 재확인했다고 주장하지 않는다.** 최종 확인은
  GitHub Actions에서 이루어져야 한다.

---

## B. 수동 QA 체크리스트 (GitHub Actions 빌드 후 스테이징 확인 권장)

### B1. Rival 매치업 카드 (`/student/rival`) — 최우선 검수 항목

- [ ] PC 폭(1280px 이상)에서 나/VS/Rival 3블록이 가로로 나란히 서고, 어느 한쪽으로
      치우치거나 눌려 보이지 않는지
- [ ] 나와 Rival 양쪽의 성장률·백분위·주간 추이 미니 차트가 폭과 무관하게 항상 보이는지
      (더 이상 좁은 폭에서 사라지지 않아야 함)
- [ ] 브라우저 폭을 768~1023px 사이로 좁히면 3블록이 세로로 자연스럽게 쌓이며, 텍스트가
      잘리거나 겹치지 않는지
- [ ] 정확도/꾸준함/집중도 비교 레인 막대가 정상 비율로 표시되는지
- [ ] 하단 CTA(딥 네이비 바탕 + Gold 버튼)에 이모지 대신 트로피 아이콘이 보이는지

### B2. 유사 수준 비교 차트 (`/student/rival`)

- [ ] 과목별 막대(나/Rival)가 값 비율에 맞게 정상적으로 그려지는지(찌그러지거나 0으로
      보이는 막대가 없는지)

### B3. 엠블럼 표시 (`/student/growth`, `/student/my`)

- [ ] 성장 진열장의 엠블럼 갤러리 타일이 이전보다 크고 또렷하게 보이는지, 이미지가
      잘리거나 깨져 보이지 않는지
- [ ] 마이페이지 "보유 엠블럼" 섹션이 더 이상 작은 아이콘 나열처럼 보이지 않고, 카드
      프레임 안에 적절한 크기로 표시되는지
- [ ] 엠블럼 10개 초과 보유 시 마이페이지에 "전체 보기" 링크가 나타나는지
- [ ] Emblem 기능 OFF(시스템설정) 시 두 화면 모두 기존과 동일하게 비활성 안내로
      대체되는지(회귀 없음)

### B4. 관리자 라이벌관리 (`/growth/rivals`)

- [ ] 칼 아이콘이나 강한 빨간 배지/배너가 화면 어디에도 남아있지 않은지
- [ ] 승/패 관련 숫자·배지 색이 초록/빨강 대신 AXIS 틸/앰버 톤으로 보이는지
- [ ] 승/패/종료 버튼 클릭 동작이 이전과 동일하게 작동하는지(색상만 변경, 기능 불변)
- [ ] "종료 확인" 모달의 확정 버튼만 여전히 진한 rose 톤으로 구분되는지(의도된 예외)

### B5. 관리자 성장현황 (`/growth/overview`)

- [ ] 요약 카드 5개 아이콘 색이 AXIS 톤(네이비/골드/틸/앰버/블루)으로 통일됐는지
- [ ] 최근 SP 이력 토글/테이블 색상이 정리됐는지, 기능 동작은 이전과 동일한지

### B6. 회귀 확인

- [ ] r15-r1 "내신 대비 가이드" 탭(시험 상세, mock-school 카테고리)이 이전과 동일하게
      동작하는지
- [ ] 학생/학부모/관리자 각 역할의 사이드바·상단 네비게이션 구조에 변화가 없는지
- [ ] 학부모 화면(`/parent/*`) 어디에도 Rival/Emblem/SP/Tier가 노출되지 않는지(기존과 동일)
