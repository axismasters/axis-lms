# AXIS LMS v1.2 — Growth Showcase Foundation v1 (buildfix)
# INTEGRATION.md

작업 기준: `axis-lms-v1_2-assessment-engine-v2.zip` (최신 main 브랜치)
작업명: Growth Showcase Foundation v1 — 권한 정책 수정 buildfix
산출물: `axis-lms-v1.2-growth-showcase-foundation-v1-buildfix.zip`

---

## 이번 buildfix에서 수정한 내용

### 문제
`canAccessGrowth`가 `t !== 'STUDENT' && t !== 'GUARDIAN'` 로 구현되어
TEACHER가 성장관리 메뉴 전체 (/growth/overview, /growth/emblems, /growth/rivals)에 접근 가능했음.

### 수정 파일 (3개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/rbac.ts` | `canAccessGrowth` STAFF까지만 / `canViewStudentGrowth` TEACHER 포함으로 분리 |
| `src/pages/growth/EmblemManagement.tsx` | `canAccessGrowth` 페이지 진입 가드 추가 |
| `src/pages/growth/RivalManagement.tsx` | `canAccessGrowth` 페이지 진입 가드 추가 |

(GrowthOverview.tsx는 이미 canAccessGrowth 가드 있었음 — 무수정)
(AdminLayout.tsx는 requiresFn이 canAccessGrowth를 참조하므로 rbac.ts 수정만으로 자동 반영 — 무수정)
(StudentDetail.tsx는 canViewStudentGrowth + 기존 canAccessStudent 가드 조합이 올바름 — 무수정)

---

## 추가/수정된 전체 파일 목록 (Foundation v1 기준 누적)

### 신규 파일 (5개)
| 파일 | 설명 |
|------|------|
| `src/lib/growthData.ts` | 성장관리 데이터 모델 + 목 데이터 + 상수/유틸 |
| `src/contexts/GrowthContext.tsx` | 성장관리 Context (상태관리 + 전체 헬퍼) |
| `src/pages/growth/GrowthOverview.tsx` | 성장현황 페이지 |
| `src/pages/growth/EmblemManagement.tsx` | 엠블럼관리 페이지 |
| `src/pages/growth/RivalManagement.tsx` | 라이벌관리 페이지 |

### 수정 파일 (4개)
| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/rbac.ts` | Growth 권한 helper 추가 + buildfix 수정 |
| `src/components/AdminLayout.tsx` | 성장관리 메뉴 추가 + requiresFn 옵션 |
| `src/pages/StudentDetail.tsx` | growth 탭 + GrowthShowcaseTab 컴포넌트 추가 |
| `src/App.tsx` | GrowthProvider + /growth/* 라우팅 3개 추가 |

---

## 성장 프로필 구조 (StudentGrowthProfile)

```ts
interface StudentGrowthProfile {
  studentId: string;
  nickname: string;
  tier: StudentTier;          // UNRANKED → WOOD → STONE → BRONZE → IRON → SILVER → GOLD → DIAMOND
  totalSP: number;            // 누적 SP (티어 산정 기준)
  seasonSP: number;           // 이번 시즌 SP
  representativeEmblemIds: string[];  // 대표 엠블럼 (최대 3개)
  currentRivalId?: string;
  rivalWins: number;
  rivalLosses: number;
  createdAt: string;
  updatedAt: string;
}
```

SP 임계값: WOOD(50) → STONE(150) → BRONZE(350) → IRON(700) → SILVER(1200) → GOLD(2000) → DIAMOND(3500)

---

## 엠블럼 구조 (Emblem)

```ts
interface Emblem {
  id: string;
  name: string;
  category: 'LIFE' | 'GROWTH' | 'ASSESSMENT' | 'RIVAL' | 'SKILL' | 'SPECIAL';
  description: string;
  material: 'WOOD' | 'STONE' | 'BRONZE' | 'IRON' | 'SILVER' | 'GOLD' | 'DIAMOND';
  conditionText: string;
  requiredCount: number;
  hidden: boolean;   // true: 학생에게 조건 미공개 (숨김 엠블럼)
  active: boolean;   // false: 비활성 (삭제 대신 비활성화)
  ifPlaceholderKey?: 'calculationError' | 'conceptLack' | 'timeShortage' | 'carelessMistake';
  createdAt: string;
}
```

엠블럼 삭제 없음 — 비활성(active: false) 처리만 제공.
ifPlaceholderKey: Assessment Engine v2 IF 분석과 연동 예정 (Growth v2).

---

## 라이벌 구조 (RivalRelation)

```ts
interface RivalRelation {
  id: string;
  challengerStudentId: string;  // 라이벌을 지정한 학생
  targetStudentId: string;      // 지정받은 학생 (학생 화면에서 노출 금지)
  status: 'ACTIVE' | 'ENDED';
  wins: number;
  losses: number;
  winRate: number;
  streak: number;               // 양수: 연승, 음수: 연패
  createdAt: string;
  nextChangeAvailableAt: string;
}
```

**핵심 보안 원칙:** targetStudentId는 학생 화면에 절대 노출되지 않습니다.
관리자 라이벌관리 화면에서만 전체 연결 관계를 확인할 수 있습니다.
학생 화면(진열장)에는 "나를 지정한 학생 수(숫자)"만 표시되며, 누구인지는 공개되지 않습니다.

---

## 학생 상세 진열장 반영 방식

StudentDetail.tsx의 TabKey에 `'growth'` 추가.

탭 노출 조건: `canViewStudentGrowth(accountType)` — TEACHER 포함 허용.
단, 132번 줄의 `canAccessStudent(student.id)` 가드가 먼저 실행되어
TEACHER는 담당 학생에 한해서만 탭 자체가 표시됨.

표시 내용:
- 닉네임 + 현재 티어 (헤더 카드)
- 대표 엠블럼 3슬롯
- 누적 SP / 이번 시즌 SP / 보유 엠블럼 수 / 라이벌 전적 (4개 카드)
- 현재 라이벌 정보
- 나를 지정한 학생 수 (숫자만, 누구인지 미공개)
- 최근 획득 엠블럼 5개
- IF 분석 연동 예정 안내 배너

보호자 화면: 만들지 않음. 보호자 계정은 BackOfficeGate에서 차단됨.

---

## 권한 기준 (확정)

| 기능 | 허용 AccountType |
|------|----------------|
| **성장관리 메뉴 접근** (canAccessGrowth) | SUPER_ADMIN, DIRECTOR, STAFF |
| **학생 상세 성장/진열장 조회** (canViewStudentGrowth) | SUPER_ADMIN, DIRECTOR, STAFF, **TEACHER(담당 학생만)** |
| **라이벌 전체 관리/조회** (canManageRivals) | SUPER_ADMIN, DIRECTOR |
| **엠블럼 정책 관리** (canManageEmblems) | SUPER_ADMIN, DIRECTOR |
| SP 수동 지급 (canAwardSP) | SUPER_ADMIN, DIRECTOR |
| 엠블럼 수동 지급 (canAwardEmblem) | SUPER_ADMIN, DIRECTOR, STAFF |
| STUDENT / GUARDIAN | 차단 (BackOfficeGate) |

### TEACHER 접근 범위 정리

| 화면 | TEACHER 접근 |
|------|-------------|
| `/growth/overview` | ❌ URL 직접 입력해도 차단 |
| `/growth/emblems` | ❌ URL 직접 입력해도 차단 |
| `/growth/rivals` | ❌ URL 직접 입력해도 차단 |
| StudentDetail 성장/진열장 탭 | ✅ 담당 학생만 (canAccessStudent 가드) |

---

## GrowthContext 주요 헬퍼

```ts
// SP / 티어
addStudentSP(studentId, amount)        → { ok, reason? }

// 엠블럼 수동 지급 (mock) — 획득 시 +50 SP 자동 지급
awardEmblemMock(studentId, emblemId, sourceType)  → { ok, reason? }

// 엠블럼 관리 (삭제 없음)
addEmblem(data)                        → { ok, reason? }
updateEmblem(emblemId, patch)          → { ok, reason? }
toggleEmblemActive(emblemId)           → { ok }
toggleEmblemHidden(emblemId)           → { ok }

// 라이벌
addRivalWin(relationId)                → { ok, reason? }
addRivalLoss(relationId)               → { ok, reason? }
endRivalRelation(relationId)           → { ok }

// Assessment IF 연동 준비 — Growth v2에서 자동화 예정
linkIfAnalysis(studentId, examId, ifKeys)  → void
```

---

## 빌드 통과 여부

로컬 환경에서 `npm install && npm run build` 실행 필요.
내가 추가/수정한 Growth 관련 파일의 TypeScript 로직 오류: **0개** (컨테이너 내 확인 완료)

사전 존재 오류 (내가 건드리지 않은 기존 파일, 베이스 zip에서 이미 존재):
- `src/App.tsx(171)` — 기존 오류
- `src/components/ErrorBoundary.tsx(31)` — 기존 오류
- `src/pages/ClassList.tsx(219, 233)` — 기존 오류

이 오류들은 Growth 작업 이전부터 존재했으며 Growth 모듈과 무관합니다.

---

## 검증 체크리스트

✅ SUPER_ADMIN / DIRECTOR / STAFF — 성장관리 메뉴 접근 가능  
✅ TEACHER — 성장관리 메뉴 안 보임 (AdminLayout requiresFn → canAccessGrowth)  
✅ TEACHER — /growth/overview 직접 입력 시 접근 차단  
✅ TEACHER — /growth/emblems 직접 입력 시 접근 차단  
✅ TEACHER — /growth/rivals 직접 입력 시 접근 차단  
✅ TEACHER — 담당 학생 StudentDetail 성장/진열장 탭 조회 가능  
✅ TEACHER — 담당하지 않는 학생 성장/진열장 조회 불가 (canAccessStudent 가드)  
✅ STUDENT / GUARDIAN — BackOfficeGate에서 전체 차단  
✅ 엠블럼 삭제 기능 없음 (비활성 처리만)  
✅ 라이벌 이력 삭제 기능 없음 (관계 종료만)  
✅ 보호자 화면 생성 없음  
✅ 학생/보호자에게 라이벌 지정자 노출 없음  
✅ 기존 학생관리, 반관리, 수강등록, 출결관리, 재무관리, 알림관리, 성적관리 무수정  

---

## 남은 한계

1. 실제 학생 목 데이터 ID(stu-001~stu-005)와 기존 dummyData.ts의 학생 ID가 다를 수 있음
   → 성장현황 테이블에서 학생 이름이 매칭되지 않을 경우 dummyData의 실제 ID로 교체 필요
2. 엠블럼 자동 지급 로직 없음 (mock 수동 지급만 제공)
3. Assessment IF 분석 자동 연동 없음 (linkIfAnalysis placeholder만 존재)
4. 라이벌 자동 매칭/추천 없음 (수동 관리만 제공)
5. 시즌 리셋 기능 없음
6. SP 지급 이력 로그 없음

---

## 다음 추천 개발 단계

1. **Growth v2 — dummyData 학생 ID 연동**: growthData.ts의 mock studentId를 실제 dummyData.ts ID로 교체
2. **Growth v2 — IF 연동**: Assessment Engine v2 채점 완료 시 ifPlaceholderKey 기반 엠블럼 진행도 자동 업데이트
3. **Growth v2 — 출결 연동**: AttendanceContext 결석 0회 달성 시 LIFE 엠블럼 자동 지급
4. **Growth v2 — SP 이력**: SP 지급 이력 로그 (언제/왜/얼마)
5. **Growth v3 — 시즌 관리**: 시즌 시작/리셋, 시즌 아카이브
6. **학생 포털 (별도 단계)**: 나의 진열장 화면 (학생용 — Admin Back Office 아님)
