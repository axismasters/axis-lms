# AXIS LMS v1.2 — INTEGRATION.md
## Mobile/App Optimization Readiness v1

---

## 1. 이번 작업 범위 요약

**작업명**: Mobile/App Optimization Readiness v1  
**기반**: Release Checkpoint & UI Consistency QA v1 완료 상태  
**목표**: 기존 Back Office 구조를 유지한 채 모바일 웹/PWA/앱 전환 기반 보강

### 절대 하지 않은 것
- Capacitor / React Native / Flutter 패키징 없음
- 새 엔진(대시보드/상담/포털) 없음
- 기존 기능 로직 변경 없음
- 권한 구조 변경 없음
- 삭제 기능 신규 추가 없음

---

## 2. AdminLayout 반응형 대응 방식

### 브레이크포인트 기준
| 구간 | 사이드바 방식 | 메인 여백 |
|------|-------------|----------|
| `< 1024px` (모바일/태블릿) | 숨김 → 드로어(슬라이드 인) | 0 (전체 폭) |
| `≥ 1024px` (데스크톱) | 240px 고정 노출 | `margin-left: 240px` |

### 핵심 변경 사항 (AdminLayout.tsx)
1. `useState(mobileOpen)` + `useEffect` 2개 추가
   - 경로 변경 시 드로어 자동 닫힘
   - 드로어 열림 시 `body.overflow = 'hidden'` 스크롤 잠금
2. `SidebarContent` 내부 컴포넌트로 추출 → 데스크톱/모바일 공통 사용
3. **데스크톱 사이드바**: `hidden lg:flex fixed` — 기존 구조 유지
4. **모바일 오버레이**: `fixed inset-0 z-40 lg:hidden` — 클릭 시 드로어 닫기
5. **모바일 드로어**: `fixed z-50 lg:hidden transition-transform` — `-translate-x-full` ↔ `translate-x-0`
6. **햄버거 버튼**: Header 좌측, `lg:hidden` 조건
7. **날짜 텍스트**: `hidden sm:block` 처리 (매우 좁은 화면 대응)
8. **메인 콘텐츠**: `w-full lg:ml-[240px]` — 모바일 전체 폭 사용
9. 페이지 패딩: `p-4 lg:p-6` — 모바일 여백 축소

### 권한별 메뉴 노출 로직
- 변경 없음. `visibleNav` 필터 로직 그대로 유지
- TEACHER: 재무/알림/성장관리 전체 메뉴 접근 불가 유지
- STUDENT/GUARDIAN: BackOfficeGate 차단 유지

---

## 3. 표 중심 화면 모바일 대응 방식

### `.axis-table-wrap` 클래스 도입 (index.css)
```css
.axis-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```
기존 `overflow-x-auto` 인라인 className을 전부 `.axis-table-wrap`으로 교체.
touch-scroll 최적화 추가.

### 적용 대상 페이지 (전수 처리)
| 페이지 | 파일 | minWidth |
|--------|------|----------|
| 학생목록 | StudentList.tsx | 1060~1180px |
| 직원목록 | EmployeeList.tsx | 700px |
| 반목록 | ClassList.tsx | 800px (신규 추가) |
| 출결체크 | AttendanceCheck.tsx | 720px (신규 추가) |
| 출결현황 | AttendanceStatus.tsx | 1180px |
| 수납관리 | FinancePayments.tsx | 1100px |
| 환불관리 | FinanceRefunds.tsx | 1200px |
| 미납관리 | FinanceUnpaid.tsx | 1180px |
| 정산관리 | FinanceSettlements.tsx | 700px (신규 추가) |
| 재무통계 | FinanceStatistics.tsx | 600px (신규 추가) |
| 발송이력 | NotificationHistory.tsx | 기존 유지 |
| 템플릿관리 | NotificationTemplates.tsx | 기존 유지 |
| 시험목록 | AssessmentList.tsx | 기존 유지 |
| 성장현황 | GrowthOverview.tsx | 680px |
| 엠블럼관리 | EmblemManagement.tsx | 700px (신규 추가) |
| 라이벌관리 | RivalManagement.tsx | 800px (신규 추가) |
| 권한설정 | PermissionSettings.tsx | 기존 유지 |

---

## 4. 학생 상세 탭 모바일 대응 방식

### 변경 내용 (StudentDetail.tsx)
- 탭 컨테이너: `flex gap-1 overflow-x-auto` → `axis-detail-tabs`
- `.axis-detail-tabs` (index.css):
  - `overflow-x: auto` + `touch-scroll`
  - 스크롤바 숨김 (`scrollbar-width: none`, `::-webkit-scrollbar: display:none`)
  - `button { flex-shrink: 0 }` — 탭이 줄바꿈되지 않음
- 탭 내부 표들은 이미 `axis-table-wrap`으로 처리됨

### 학생 상세 탭 목록
기본정보 / 보호자·가족정보 / 수강이력 / 출결현황 / 성적조회 / 재무상태 / 성장·진열장  
→ 7개 탭, 모바일에서 가로 스크롤로 탐색 가능

---

## 5. 공통 CSS 유틸리티 추가 (index.css)

```css
/* 반응형 요약 카드 그리드 */
.axis-summary-grid     /* 2열 → 3열 → 4열 → 5열 */

/* 표 가로 스크롤 */
.axis-table-wrap       /* overflow-x:auto + touch scroll */

/* 탭 가로 스크롤 */
.axis-detail-tabs      /* flex + overflow-x:auto + 스크롤바 숨김 */

/* 모바일 페이지 헤더 */
.axis-page-header      /* < 1024px: flex-direction:column */

/* 모바일 필터 행 */
.axis-filter-row       /* < 640px: 세로 스택 */
```

---

## 6. 권한설정 모바일 개선 필요사항 (향후 과제)

### 현재 한계
- `PermissionSettings.tsx`: 11개 카테고리 × 5개 권한 코드 매트릭스
- 데스크톱 기준 최소 680px — 모바일에서 심각한 가로 넘침 발생 가능
- 현재 단계에서는 `axis-table-wrap`으로 가로 스크롤만 처리

### 향후 모바일 UI 권장 구조
1. **카테고리별 아코디언**: 각 카테고리를 펼치기/접기 가능하게
2. **탭 구조**: 직급별 탭으로 전환 (강사 탭 / 행정 탭 등)
3. **조회/간단 수정 분리**: 모바일에서는 권한 전체 편집 대신 단일 토글만 노출
4. **현재 Back Office 기능 유지**: 데스크톱 운영자 중심으로 권한 설정 운영 권장

---

## 7. 재무/성적/성장 화면 모바일 향후 개선 권장사항

### 요약 카드 그리드
- 현재: 일부 화면 `grid-cols-2 md:grid-cols-4` 등 개별 적용
- 향후: `.axis-summary-grid` 유틸리티 클래스로 통일 권장
- 모바일에서 2열 → 데스크톱에서 4~5열 자동 전환

### 긴 표 → 카드형 전환 (이번 단계 미구현, 향후 권장)
- 수납관리(FinancePayments), 출결현황(AttendanceStatus) 등 1000px+ 표
- 모바일에서 각 행을 카드 컴포넌트로 렌더링하는 `useIsMobile()` 훅 기반 전환 권장
- 예시 패턴:
  ```tsx
  const isMobile = useMediaQuery('(max-width: 1023px)');
  return isMobile ? <CardList items={data} /> : <TableView items={data} />;
  ```

### 상세 관리 버튼 → 액션 시트 (이번 단계 미구현, 향후 권장)
- 현재: 테이블 행 우측 버튼 그룹
- 향후: 모바일에서 Bottom Sheet / Action Sheet 패턴으로 전환

---

## 8. 향후 PWA/앱 전환 시 추천 구조

### PWA 전환 (최우선 추천)
```
현재 Vite 빌드 → vite-plugin-pwa 추가
→ manifest.json + Service Worker 자동 생성
→ 홈 화면 추가 + 오프라인 캐시 지원
```
- 추가 코드 변경 최소 (현재 구조 그대로 활용)
- Capacitor 없이 iOS/Android 홈 화면 설치 가능
- 권장 플러그인: `vite-plugin-pwa`

### 향후 학생/보호자 전용 포털 분리 (별도 프로젝트)
```
axis-student-portal/   ← 학생/보호자용 (별도 앱)
axis-lms-backoffice/   ← 현재 Back Office (관리자용)
```
- 학생/보호자 화면은 현재 Back Office와 **완전히 분리** 권장
- 공통 API 레이어만 공유, UI는 별도 설계
- 보호자에게 라이벌/엠블럼/경쟁 정보 노출 금지 정책은 포털 설계 시 반드시 반영

### Bottom Navigation 구조 (학생/보호자 포털 전용)
```
[홈] [성적] [출결] [공지] [마이페이지]
```
- Back Office(관리자)에는 Bottom Nav 불필요
- 학생/보호자 포털 별도 개발 시 적용

### Capacitor 앱 패키징 (나중 단계, 필요 시)
```
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```
- 현재 Vite 빌드 결과물을 그대로 감쌀 수 있음
- PWA 먼저 검증 후 진행 권장

---

## 9. 빌드 통과 여부

### 실행 결과

```bash
npm install   # ✅ 성공
npm run build # ✅ 성공
```

- ✅ `npm install` 성공
- ✅ `npm run build` 성공 — `dist/` 정상 생성
- ⚠️ Vite chunk size 경고 발생 (일부 청크가 권장 크기 초과)
  - 기능 오류 아님, 빌드 실패 아님
  - 향후 필요 시 `manualChunks` 설정으로 분할 가능
- ✅ **최종 빌드 통과**

---

## 10. 남은 한계

| 항목 | 현황 | 비고 |
|------|------|------|
| 표 → 카드형 전환 | ❌ 미구현 | 향후 `useMediaQuery` 기반 구현 권장 |
| Bottom Navigation | ❌ 미구현 | 학생/보호자 포털 전용 |
| Action Sheet | ❌ 미구현 | 모바일 행 액션 버튼 대체 |
| 권한설정 모바일 UI | ⚠️ 가로 스크롤만 | 아코디언/탭 구조로 개선 필요 |
| PWA manifest | ❌ 미추가 | `vite-plugin-pwa` 도입 권장 |
| 다크모드 | ❌ 미구현 | CSS 변수 구조로 추후 대응 가능 |
| 학생/보호자 포털 | ❌ 별도 프로젝트 | Back Office와 완전 분리 필요 |

---

## 11. 다음 추천 개발 단계

### 단계 A — PWA 전환 (즉시 가능)
```
vite-plugin-pwa 추가
→ manifest.json 설정 (AXIS 브랜드 색상/아이콘)
→ Service Worker 오프라인 캐시
→ iOS Safari / Android Chrome 홈 화면 설치 지원
```

### 단계 B — 실제 API 연결 (백엔드 개발 선행 필요)
```
POST /api/university-analysis/analyze  ← 목표대학 분석 엔진 (확정 엔드포인트)
GET  /api/students
POST /api/attendance
...
```
- 현재 모든 데이터는 mock (Context + lib/dummyData.ts)
- API 연결 시 Context의 상태관리 로직은 그대로 유지 가능

### 단계 C — 학생/보호자 포털 (별도 앱)
- 학생: 성적 조회, 출결 확인, 진열장 보기
- 보호자: 수납 현황, 출결 알림 (라이벌/경쟁 정보 노출 금지)
- Back Office와 코드베이스 완전 분리 권장

### 단계 D — 다크모드 (선택)
- CSS 변수 (`oklch()` 기반) 구조이므로 `@media (prefers-color-scheme: dark)` 적용 용이

---

## 변경 파일 목록 (Mobile/App Optimization Readiness v1)

```
src/components/AdminLayout.tsx      ← 핵심: 반응형 드로어 사이드바
src/index.css                       ← 모바일 유틸리티 CSS 추가
src/pages/StudentDetail.tsx         ← axis-detail-tabs + axis-table-wrap
src/pages/StudentList.tsx           ← axis-table-wrap
src/pages/EmployeeList.tsx          ← axis-table-wrap
src/pages/ClassList.tsx             ← axis-table-wrap + minWidth 추가
src/pages/AttendanceCheck.tsx       ← axis-table-wrap + minWidth 추가
src/pages/AttendanceStatus.tsx      ← axis-table-wrap
src/pages/FinancePayments.tsx       ← axis-table-wrap
src/pages/FinanceRefunds.tsx        ← axis-table-wrap
src/pages/FinanceUnpaid.tsx         ← axis-table-wrap
src/pages/FinanceSettlements.tsx    ← axis-table-wrap + minWidth 추가
src/pages/FinanceStatistics.tsx     ← axis-table-wrap + minWidth 추가
src/pages/NotificationHistory.tsx   ← axis-table-wrap
src/pages/NotificationTemplates.tsx ← axis-table-wrap
src/pages/AssessmentList.tsx        ← axis-table-wrap
src/pages/growth/GrowthOverview.tsx ← axis-table-wrap
src/pages/growth/EmblemManagement.tsx ← axis-table-wrap + minWidth 추가
src/pages/growth/RivalManagement.tsx  ← axis-table-wrap + minWidth 추가
src/pages/settings/PermissionSettings.tsx ← axis-table-wrap
README.md                           ← 최신화
INTEGRATION.md                      ← 이 파일
```

---

*AXIS LMS v1.2 — Mobile/App Optimization Readiness v1*  
*2026-06-28*
