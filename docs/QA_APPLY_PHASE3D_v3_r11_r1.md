# QA / APPLY ORDER — Phase 3D v3-r11-r1

## A. 자동 검증 (수행 완료)

| 항목 | 결과 |
|------|------|
| 오프라인 스텁 tsc 회귀 | ✅ 57 = baseline, 신규 오류 0 |
| 대상 5개 파일 tsc 오류 | ✅ 0건 |
| SVG defs 하드코딩 id | ✅ 0건(전부 useId) |
| MyPage `max-w-lg mx-auto` | ✅ 제거됨(하드 실패 기준 통과) |
| JSX div 균형 | ✅ (self-closing 제외 시 일치) |
| 불변 파일 MD5 | ✅ 3/3 유지 |
| 헌법 스캔(재무/Rival노출/금지표현/IF3개/외부AI) | ✅ 전부 청정 |

> ⚠ 레지스트리 차단(E403)으로 `npm run build` 로컬 실행 불가 → 최종 그린 빌드는 GitHub
> Actions Build Check에서 확정.

## B. 수동 QA (스테이징)

### 엠블럼 id 충돌(가장 중요)
- [ ] 성장 진열장에서 **같은 종류 엠블럼이 여러 개** 보일 때 색/그라데이션이 전부 정상(뭉개짐 0)
- [ ] MyPage 대표 엠블럼 3개 + 보유 컬렉션이 동시에 있어도 각 메달 색상 정상
- [ ] Rival 카드가 여러 개 있어도 VS 메달 정상, 티어 메달 여러 개도 정상

### 엠블럼 메달 품질
- [ ] 큰 메달(100~112px): 링 눈금 + 하단 리본 플라크 배너가 참고 이미지처럼 보임
- [ ] 작은 배지(20~64px): 눈금/플라크 없이 깔끔한 원형, 뭉개짐 없음

### 성장 진열장 (`/student/growth`)
- [ ] 데스크톱에서 1280px 폭 대시보드로 시원하게 펼쳐짐(대표/보유/다음목표 + 3컬럼)

### 마이페이지 (`/student/mypage`)
- [ ] **데스크톱**: 상단 좌(프로필)/우(대표 엠블럼 3), 하단 좌(보유 컬렉션)/우(빠른이동+Rival프리뷰) 2컬럼
- [ ] **모바일**: 세로 스택으로 자연스럽게 전환
- [ ] 닉네임 설정/수정/2주 제한 동작 정상, 전화번호 마스킹 유지

## C. APPLY ORDER

기준: v3-r11 위에 적용. 5개 파일 모두 독립적(신규 파일 없음) → 순서 무관.
1. `src/components/brand/AxisEmblemBadge.tsx`
2. `src/components/brand/AxisTierMedallion.tsx`
3. `src/components/growth/RivalMatchupCard.tsx`
4. `src/pages/student/StudentGrowthShowcase.tsx`
5. `src/pages/student/StudentMyPage.tsx`

빌드: `npm install` → `npm run typecheck` → `npm run build` → Actions 그린 확인.

## 롤백
5개 파일을 v3-r11 버전으로 되돌리면 완전 원복(데이터/스키마 변경 없음).
