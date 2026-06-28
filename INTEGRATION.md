# AXIS LMS v1.2 — Growth Showcase v2
# INTEGRATION.md

작업 기준: `axis-lms-v1_2-assessment-engine-v2.zip` + Growth Foundation v1 buildfix
작업명: Growth Showcase v2 — SP & Emblem Event Hooks
산출물: `axis-lms-v1.2-growth-showcase-v2.zip`

---

## 수정/추가 파일 목록

### 수정 파일 (4개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/growthData.ts` | StudentSPLog 타입 추가, 엠블럼 16→27개로 보강, attendanceHookKey 필드 추가, MOCK_SP_LOGS 추가 |
| `src/contexts/GrowthContext.tsx` | helper 전면 보강 — SP이력, 진행도, 출결Hook, IF Hook, alias 함수들 |
| `src/pages/growth/GrowthOverview.tsx` | SP/엠블럼 수동 지급 모달 + SP 이력 패널 추가 |
| `src/pages/StudentDetail.tsx` | GrowthShowcaseTab v2 — SP이력 + 진행중 엠블럼 + 수동 지급 + IF 힌트 |

---

## SP 구조

```ts
// StudentGrowthProfile
totalSP: number;     // 누적 SP (티어 기준)
seasonSP: number;    // 이번 시즌 SP

// 티어 임계값
WOOD(50) → STONE(150) → BRONZE(350) → IRON(700)
→ SILVER(1200) → GOLD(2000) → DIAMOND(3500)
```

---

## SP 지급 이력 구조 (수정 2)

```ts
interface StudentSPLog {
  id: string;
  studentId: string;
  amount: number;               // 양수만 (이번 단계)
  reason: string;
  sourceType: GrowthSourceType; // ATTENDANCE|ASSESSMENT|ENROLLMENT|RIVAL|MANUAL
  sourceId?: string;            // 연동된 출결/시험/엠블럼 ID
  createdAt: string;
  createdBy: string;            // 지급 주체 (관리자 이름 or 'SYSTEM')
}
```

- `addStudentSP(studentId, amount, reason, sourceType, sourceId?, createdBy?)` 호출 시 자동 생성
- 삭제 기능 없음
- 음수 SP 이번 단계 허용 안 함

---

## 엠블럼 지급/진행도 구조

```ts
// 지급
awardEmblemMock(studentId, emblemId, sourceType, sourceId?, createdBy?)
// → achieved=true StudentEmblem 생성 + +50 SP 자동 지급

// 진행도 증가 (미달성 상태)
updateEmblemProgress(studentId, emblemId, amount)
// → progressCount 증가, requiredCount 달성 시 별도 awardEmblemMock 호출 가능

// 대표 엠블럼 설정
setRepresentativeEmblems(studentId, emblemIds) // 최대 3개
```

엠블럼 삭제 없음 — `toggleEmblemActive(emblemId)` 비활성만 제공.

---

## 출결 Hook 준비 방식 (수정 4)

```ts
// GrowthContext
onAttendanceEvent({
  studentId,
  eventType: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'MAKEUP',
  date,
  monthlyPerfect?: boolean,     // 월 개근 여부
  consecutiveMonths?: number,   // 연속 개근 개월 수
  totalPresentCount?: number,   // 누적 출석 수
})
```

- 출석/보강 이벤트에서만 성장 hook 작동
- 결석/조퇴에 SP 차감 없음 (이번 단계 정책)
- 월 개근 → 개근왕 엠블럼 progress + +30 SP
- 연속 개근 → 성실의 증거 엠블럼 progress
- 누적 출석 → 꾸준한 출석자 엠블럼 progress
- AttendanceContext에서 `useGrowth().onAttendanceEvent(...)` 형태로 호출 가능 (연동은 다음 단계)

---

## 성적/IF Hook 준비 방식 (수정 5)

```ts
// 채점 완료 후 호출
onIfAnalysisResult({
  studentId,
  examId,
  ifFlags: {
    calculationError: boolean,
    conceptLack: boolean,
    timeShortage: boolean,
    carelessMistake: boolean,
  }
})
// → 오류가 없는 항목의 관련 엠블럼 progress 자동 증가

// 수동 기록
recordIfReflectionMock(studentId, ifKey, improved: boolean)
// → improved=true 시 관련 엠블럼 progress 증가

// IF key → 연동 엠블럼
calculationError  → emb-011(꼼꼼한 검토자), emb-024(계산 정확도 향상)
conceptLack       → emb-007(개념 정복자), emb-025(개념 회복)
timeShortage      → emb-010(시간 마스터), emb-026(시간관리 달인)
carelessMistake   → emb-011(꼼꼼한 검토자)
```

실제 분석 엔진 없음. 문제은행/대학추천/AI 연동 없음.

---

## 엠블럼 카테고리별 보강 현황

| 카테고리 | 이전 | 이후 |
|----------|------|------|
| LIFE | 3개 | 5개 (+꾸준한 출석자, 과제 완수자) |
| GROWTH | 3개 | 5개 (+SP 누적 500, SP 누적 2000) |
| ASSESSMENT | 4개 | 6개 (+단원평가 통과, 성적 공개 후 성장) |
| RIVAL | 3개 | 4개 (+리벤지 성공) |
| SKILL | 1개 | 4개 (+계산 정확도 향상, 개념 회복, 시간관리 달인) |
| SPECIAL | 1개 | 2개 (+시즌 한정: 선구자) |
| **합계** | **16개** | **26개** |

---

## 학생 상세 진열장 반영 방식

탭 접근: `canViewStudentGrowth(accountType)` + 기존 `canAccessStudent(studentId)` 가드 조합

표시 내용 (v2):
- 닉네임 + 현재 티어 (헤더)
- 대표 엠블럼 3슬롯
- SP 수동 지급 버튼 (canAwardSP)
- 엠블럼 수동 지급 버튼 (canAwardEmblem)
- 누적 SP / 이번 시즌 SP / 보유 엠블럼 수 / 라이벌 전적
- 현재 라이벌 요약 (이름, 티어, SP, 엠블럼 수, 승률/연승연패)
- 나를 지정한 학생 수 (숫자만, 누구인지 미공개)
- SP 최근 이력 5건 (일자/금액/사유/출처/지급자)
- 최근 획득 엠블럼 5개
- 진행 중 엠블럼 + 진행바
- IF 성장 힌트 placeholder 배너

---

## 권한 기준 (확정)

| 기능 | 허용 AccountType |
|------|----------------|
| **성장관리 메뉴 접근** (canAccessGrowth) | SUPER_ADMIN, DIRECTOR, STAFF |
| **학생 성장/진열장 탭** (canViewStudentGrowth) | SUPER_ADMIN, DIRECTOR, STAFF, **TEACHER(담당 학생만)** |
| **SP/엠블럼 수동 지급** (canAwardSP / canAwardEmblem) | SUPER_ADMIN, DIRECTOR, STAFF |
| **엠블럼 정책 관리** (canManageEmblems) | SUPER_ADMIN, DIRECTOR |
| **라이벌 전체 관리/조회** (canManageRivals) | SUPER_ADMIN, DIRECTOR |
| STUDENT / GUARDIAN | 차단 (BackOfficeGate) |

TEACHER 접근 범위:
- `/growth/*` URL 직접 입력 시 차단
- 담당 학생 StudentDetail 성장/진열장 탭: 조회만 가능 (수동 지급 버튼 미노출)

---

## GrowthContext 주요 helper (v2 전체)

```ts
// 프로필
getProfile(studentId) / getGrowthProfile(studentId)

// 엠블럼
getStudentEmblems(studentId)
getAchievedEmblems(studentId)
getRecentEmblems(studentId, limit?)
getRepresentativeEmblems(studentId)          // Emblem[] 반환
setRepresentativeEmblems(studentId, ids[])   // 최대 3개

// SP
getSPLogs(studentId, limit?)
addStudentSP(studentId, amount, reason, sourceType, sourceId?, createdBy?)

// 지급
awardEmblemMock(studentId, emblemId, sourceType, sourceId?, createdBy?)
updateEmblemProgress(studentId, emblemId, amount)

// 라이벌
getRivalInfo(studentId) / getRivalSummary(studentId)
getStudentsTargetingMe(studentId)            // 관리자 전용, 학생 노출 금지

// Hook
onAttendanceEvent(params)
onIfAnalysisResult(params)
recordIfReflectionMock(studentId, ifKey, improved)
```

---

## 실제 미연동 범위 (다음 단계)

- AttendanceContext → onAttendanceEvent 실제 호출 연결
- AssessmentContext → onIfAnalysisResult 실제 호출 연결
- SP 임계값 기반 엠블럼 자동 지급 (SP 누적 500, 2000)
- 시즌 리셋 기능

---

## 빌드 통과 여부

Growth v2 관련 파일(growthData, GrowthContext, GrowthOverview, StudentDetail GrowthTab)
TypeScript 로직 오류: **0개** (컨테이너 내 확인 완료)

사전 존재 오류 (Growth 작업 전 베이스 파일, 이 작업과 무관):
- `src/App.tsx(171)` — 기존 오류
- `src/components/ErrorBoundary.tsx(31)` — 기존 오류
- `src/pages/ClassList.tsx(219, 233)` — 기존 오류

로컬: `npm install && npm run build`

---

## 검증 체크리스트

✅ SUPER_ADMIN/DIRECTOR/STAFF — 성장관리 메뉴 접근 가능
✅ TEACHER — 성장관리 메뉴 안 보임
✅ TEACHER — /growth/* 직접 입력 시 차단
✅ TEACHER — 담당 학생 성장/진열장 탭 조회 가능
✅ TEACHER — SP/엠블럼 수동 지급 버튼 미노출 (canAwardSP = false)
✅ SP 지급 시 totalSP / seasonSP / SPLog 반영
✅ 엠블럼 지급 시 StudentEmblem + +50 SP 자동 지급
✅ 엠블럼 삭제 없음 (비활성만)
✅ 라이벌 이력 삭제 없음 (종료만)
✅ SP 이력 삭제 없음
✅ 결석/조퇴 SP 차감 없음
✅ 보호자 화면 없음
✅ 문제은행/대학추천/AI 기능 없음
✅ 기존 학생관리/반관리/수강등록/출결/재무/알림/성적 무수정

---

## 다음 추천 개발 단계

1. **Growth v3 — 출결 실제 연동**: AttendanceContext 채점 후 onAttendanceEvent 자동 호출
2. **Growth v3 — IF 실제 연동**: AssessmentContext publishExam 후 onIfAnalysisResult 자동 호출
3. **Growth v3 — SP 임계값 엠블럼**: totalSP 500/2000 달성 시 자동 지급
4. **Growth v3 — 시즌 관리**: 시즌 시작/리셋, 시즌 아카이브
5. **학생 포털 (별도 단계)**: 나의 진열장 화면 (학생용)
