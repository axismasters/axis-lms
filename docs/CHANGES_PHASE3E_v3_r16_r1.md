# CHANGES — Phase 3E v3-r16-r1 (University Recommendation Fast Attach)

AXIS LMS v1.2 · React 18 / TypeScript / Vite / Tailwind / wouter

## 0. 기준선(baseline)

v3-r14-r3(엠블럼 PNG 69개 정리본) + v3-r15-r1(내신 대비 운영 가이드) + v3-r14-r4(학생
성장/Rival/Emblem 프리미엄 UI 정리)가 모두 반영되고 GitHub Actions가 통과한 최신 main
위에서 작업했다. 이번 Phase는 이 셋 중 어느 것도 되돌리지 않는다(§4 검증).

## 1. 전수 확인 결과 — 대학추천 관련 파일 10개

지시서 §4-1이 지목한 10개 파일을 전부 열어 구조를 확인했다. 요약:

| 파일 | 역할 | 이번에 손댔는가 |
|------|------|------------------|
| `universityAnalysisAdapter.ts` | Input Bridge v1 — LMS 데이터→어댑터 타입 변환, 게이트 판정(불변 파일) | ❌ 읽기만 함 |
| `universityAnalysisClient.ts` | Phase 5.1 실제 API 클라이언트(`callPhase51AnalyzeApi`) | ❌ 읽기만 함 |
| `universityRecommendationPayload.ts` | **이미 deprecated** — 빈 파일, 프로젝트 어디서도 참조 안 함 | ❌ 손대지 않음 |
| `universityPayloadAdapter.ts` | 교사 입력(내신/모의고사) 기반 payload 변환 + 추천 적합도 계산 | ❌ 읽기만 함(기존 export 재사용) |
| `studentUniversityPreview.ts` | Assessment Engine 공개 성적 기반 프리뷰(학부모 화면에서 사용 중) | ✅ import 정리만(§3) |
| `UniversityReportManagement.tsx` | 관리자 리포트 입구(`/admin/university-reports`) | ✅ 수정(§2-1) |
| `StudentTargetPreview.tsx` | 학생 목표대학/대학추천 화면 | ✅ 수정(§2-2) |
| `ParentTargetSummary.tsx` | 학부모 목표대학/대학추천 요약 | ✅ 수정(§2-3) |
| `TeacherUniversityData.tsx` | 교사 성적 입력 + 데이터 현황 + payload 탭 | ✅ 수정(§2-4) |
| `TeacherStudentDetail.tsx` | 교사 담당 학생 상세(읽기 전용) | ✅ 수정(§2-5) |

**핵심 발견**: 이미 `StudentDetail.tsx`(관리자, GradesTab)에 어댑터→게이트→Draft 구성→
Phase 5.1 API 호출→응답 표시까지 이어지는 완전한 흐름이 구축돼 있었다. 이번 Phase의
"관리자/강사 상담 흐름 연결" 목표는 새 계산 로직을 만드는 게 아니라, **이미 있는 것을
빠뜨린 화면(교사)에 연결하고, 중복/더미인 화면을 정리**하는 작업이었다.

## 2. 수정 내용

### 2-1. `UniversityReportManagement.tsx`(관리자) — 더미 버튼 제거, 실제 흐름으로 연결

**문제**: "PDF 다운로드 (준비 중)"과 "상담 리포트 생성" 버튼이 있었는데, 둘 다 클릭하면
토스트 메시지만 뜨고 실제로는 아무 일도 하지 않는 더미였다. 게다가 PDF 내보내기는 이
프로젝트의 영구 금지 항목이라(§ 기존 permanent prohibitions), 애초에 완성될 수 없는
버튼이었다. 학생 상세로 들어가면 모의고사 성적을 다시 나열하는데, 이는 이미
`StudentDetail.tsx`가 훨씬 상세하게 보여주는 것과 중복이었다.

**조치**: 더미 버튼 2개를 완전히 제거했다. 대신 학생을 선택하면 데이터 현황 요약(모의고사/
내신 건수)만 간단히 보여주고, "학생 상세에서 상세 분석 확인" 버튼으로
`/admin/students/{id}?tab=grades`(실제 어댑터·게이트·Phase 5.1 연동이 있는 화면)로
바로 연결한다. 같은 기능을 두 곳에서 다르게 유지하지 않는다.

### 2-2. `StudentTargetPreview.tsx`(학생) — 상세 원자료를 접어서 "요약 우선"으로

**문제**: 헤더/적합도/보완필요과목/체크리스트에 이어 내신·전국연합·수능실전·수학시나리오
상세까지 총 9개 섹션이 항상 펼쳐진 채로 스크롤을 채웠다. 지시서 "학생: 목표 대학 변화
요약만"과 맞지 않았다.

**조치**: 삭제 없이, 과목별 상세 원자료(내신/전국연합/수능실전/수학 시나리오) 4개
섹션을 `<details>` 토글("과목별 상세 성적 보기") 뒤로 접었다. 기본으로 보이는 것은
헤더 · 추천 적합도 · 보완 필요 과목(상위 5개) · 데이터 준비 현황 · 상태 요약뿐이다 —
이것이 "목표 대학 변화 요약"이다. 필요하면 눌러서 원자료를 펼쳐볼 수 있다.

### 2-3. `ParentTargetSummary.tsx`(학부모) — 죽은 import 정리

`UNIVERSITY_BAND_PREVIEW`(3개 밴드 각각 "실제 분석 연결 후 표시됩니다"라는 영구 잠금
placeholder 배열)를 import하고 있었지만 실제로는 어디에도 렌더링하지 않고 있었다 —
이미 "밴드 잠금 안내"라는 단일 메시지 카드가 그 역할을 대체하고 있었기 때문이다(이전
Phase에서 처리됨). 실제로 쓰이지 않는 import만 제거했다. 화면 구성·문구는 이미 충분히
간결해 추가로 손대지 않았다.

### 2-4. `TeacherUniversityData.tsx`(교사) — "Payload" 탭을 상담 요약 우선으로

**문제**: 탭 이름이 그냥 "Payload"였고, 탭을 열면 raw JSON이 `<details>` 없이 곧바로
전체 화면에 펼쳐져 있었다 — `StudentDetail.tsx`가 이미 같은 종류의 JSON을 `<details>`
뒤로 접어두고 있는 것과 비교하면 일관성이 없었다.

**조치**: 탭 이름을 "상담 요약"으로 바꿨다. 탭을 열면 먼저 학생 이름 · 준비 상태
(데이터 부족 시 "데이터 준비 중"으로 명확히 표시) · 추천 적합도가 카드로 보이고, 원본
JSON은 "Payload 원자료 보기 (개발/점검용)" 토글 뒤로 옮겼다. 계산 로직은 전혀 바꾸지
않았다(같은 `buildUniversityRecommendationPayloadForStudent`/`getReadinessLabel`/
`getRecommendationFitScore` 그대로 재사용).

### 2-5. `TeacherStudentDetail.tsx`(교사) — 대학추천 요약 섹션 신규 연결

**문제**: 교사의 담당 학생 상세 화면에는 대학추천/목표대학 관련 내용이 **전혀** 없었다
(`grep` 결과 0건) — 지시서 "관리자/강사 상담용 화면에서 확인 가능"이 교사 쪽에서는
충족되지 않고 있었다.

**조치**: "성장 상담 요약" 섹션 바로 아래에 같은 스타일의 "{학년별 라벨} 준비 상태"
섹션을 추가했다. 새 계산 로직은 작성하지 않았다 — `TeacherUniversityData.tsx`의
`DataStatusTab`이 이미 쓰던 함수(`buildUniversityRecommendationPayloadForStudent`/
`getReadinessLabel`/`getRecommendationFitScore`)를 그대로 재사용했다. 데이터가 부족하면
readiness.label이 "데이터 준비 중"으로 표시되고, 준비되면 추천 적합도 점수가 보인다.
하단에 "대학추천 데이터에서 확인/입력하기" 링크로 기존 `/teacher/university-data`
화면(입력 + 데이터 현황 + 상담 요약 탭)으로 연결했다 — 새 화면/새 계산을 만들지 않고
있는 것을 연결했다.

## 3. 고3 실전모의 루틴 — 이번엔 손대지 않음(placeholder 유지)

지시서 §4-5대로, "고3 실전모의 루틴"이라는 이름의 기능은 코드베이스 어디에도 아직 없다
(`grep` 확인). 수능실전모의고사 데이터 자체는 이미 여러 화면(StudentDetail 성적조회,
TeacherUniversityData 수능실전 탭, StudentTargetPreview 수능실전 섹션)에서 정상적으로
흐르고 있으며, 이번 Phase에서 그 경로를 끊거나 변경하지 않았다. 실제 루틴 기능
고도화는 다음 Phase 과제로 남긴다.

## 4. 건드리지 않은 것 — 금지 목록 그대로 준수

- `src/lib/universityAnalysisAdapter.ts` — 불변 파일, MD5 완전 동일.
- `src/App.tsx`, `src/lib/classData.ts` — 불변 파일 2종, MD5 완전 동일.
- `src/assets/emblems/**` — PNG 69개, byte 단위 완전 동일. `src/lib/growthData.ts`,
  `AxisEmblemImageBadge.tsx`, `AxisTierMedallion.tsx` — MD5 완전 동일.
- v3-r15-r1 파일 5종, v3-r14-r4 파일 6종 — 전부 MD5 완전 동일(삭제/되돌리기 없음).
- `src/routes/*.tsx`, `AdminLayout.tsx`, `TeacherLayout.tsx`, `StudentLayout.tsx`,
  `ParentLayout.tsx` — 전부 무변경(신규 대시보드/독립 메뉴 추가 없음).
- `src/lib/universityAnalysisClient.ts`, `universityPayloadAdapter.ts`,
  `studentUniversityPreview.ts`(파일 자체), `universityRecommendationPayload.ts` — 무변경
  (기존 export를 호출부에서 재사용만 했다).

## 5. 검증

세부 결과는 `docs/QA_PHASE3E_v3_r16_r1.md`, 파일별 MD5는
`docs/MODIFIED_FILES_PHASE3E_v3_r16_r1.md`, 적용 순서는
`docs/APPLY_ORDER_PHASE3E_v3_r16_r1.md` 참고.

## 6. 후속 반영 — v3-r16-r2 (사용자 화면 문구 정리, 로직 변경 없음)

지시서: "기능은 이미 빌드 통과했으므로 새 기능을 만들지 말고, 사용자 화면에 남은
개발자용/이상한 문구와 패키징만 정리한다." §6 산출물명이 v3-r16-r1과 동일해, 문서는
같은 파일에 이어서 기록한다(파일명은 그대로 v3-r16-r1 문서 4종).

### 7-1. 실제로 화면에 노출되던 개발자용 표현 (수정)

grep으로 5개 파일의 실제 렌더링 텍스트(JSX 문자열)만 골라 확인한 결과, 개발자용 표현이
남아있던 곳은 정확히 2개 파일이었다 — 나머지 3개 파일(`StudentTargetPreview.tsx`,
`ParentTargetSummary.tsx`, `TeacherStudentDetail.tsx`)은 "Payload"/"JSON"/"Phase 5.1"
같은 표현이 코드 식별자·주석에만 있고 실제 화면 문구에는 없어 변경하지 않았다.

**`UniversityReportManagement.tsx`(관리자)**
- 안내 배너: "상세 분석 도구(시험 및 성적 관리 **어댑터**)가 갖춰진" → "상세 분석
  도구가 갖춰진" (괄호 안 어댑터 표현 삭제)
- 이동 버튼 부제: "대학추천 데이터 상태 · 상담 리포트 미리보기 · **Phase 5.1 연동**" →
  "… · **상세 분석 도구 연결**"(지시서 권장 문구 그대로 사용)

**`TeacherUniversityData.tsx`(교사, "상담 요약" 탭)**
- 토글 문구: "**Payload** 원자료 보기 (개발/점검용)" → "**상담 원자료 보기**"(지시서
  권장 문구 그대로 사용, "개발/점검용" 표현도 삭제)
- 섹션 제목: "**Payload** 미리보기" → "**입력 데이터 확인**"(지시서 권장 문구)
- "Engine: 연결됨 / 미연결 (다음 Phase)" 상태 줄 — 상담에 불필요한 개발 연동 상태
  표시라 화면에서 완전히 제거(숨김). 더 이상 쓰이지 않는 `ENGINE_CONNECTED` import도
  함께 정리.
- 하단 각주: "실제 대학추천 **엔진 연결**은 다음 Phase에서 구현됩니다. 이 **payload**는
  **AnalyzeRequest** 구조와 연결 가능한 형식입니다." → "이 자료는 상담 참고용입니다.
  대학추천 상세 분석 연결은 다음 단계에서 제공됩니다."(내부 API 타입명 `AnalyzeRequest`
  까지 노출되고 있던 것을 완전히 제거)

원자료(JSON) 자체는 여전히 `<details>` 토글 뒤에 남아있다 — 지시서가 "JSON 표현은
가능하면 숨김"이라고 했지 원자료 자체를 없애라고 하지 않았고, 실제로 화면 어디에도
"JSON"이라는 단어는 노출되지 않는다(토글을 열어야 보이는 raw 데이터일 뿐).

### 7-2. 로직 변경 없음

`buildUniversityRecommendationPayloadForStudent`/`getReadinessLabel`/
`getRecommendationFitScore` 등 함수 이름, `payload` 변수명, `TabId`의 `'payload'`
리터럴 값(탭 전환 로직에서만 쓰이는 내부 식별자, 화면에는 "상담 요약"으로만 표시됨)은
전혀 바꾸지 않았다 — 이런 이름은 코드 내부 식별자일 뿐 사용자에게 보이지 않으며,
바꾸면 "기능 로직은 건드리지 않는다"는 지시서 원칙과 충돌할 위험(오타로 인한 참조
깨짐 등)만 있고 얻는 것이 없다.

### 7-3. 패키징 — diff 전용 ZIP으로 재구성

이번 지시서는 "전체 src 패키지 금지"를 명시했다. 이전 산출물은 전체 프로젝트 zip이었고,
이번엔 **5개 코드 파일 + 문서 4개만** 담은 diff 전용 패키지로 다시 만들었다. 엠블럼
자산(`src/assets/emblems/**`)과 `tsconfig.*.tsbuildinfo`는 애초에 이 5개 파일에
포함되지 않으므로 패키지에 존재하지 않는다.

### 7-4. `npm ci` / typecheck / build 재시도

이 검증 샌드박스에서 `npm ci`를 다시 실행했다 — 이번에도 `E403`(네트워크 정책)으로
실패했다. 실행 전후로 `tsconfig.app.tsbuildinfo`/`tsconfig.node.tsbuildinfo`의 MD5를
대조해 오염되지 않았음을 확인했다(§QA 문서 A15). 오프라인 스텁 tsc 하네스로 수정 파일
5종 스코프를 재검증했고 오류 0건이다.

## 7. §GPT(개발 총괄)에게 전달할 의견

1. **세 개의 서로 다른 대학추천 어댑터가 병존한다** —
   (a) `universityAnalysisAdapter.ts`/`universityAnalysisClient.ts`(Phase 5.1 실제 엔진
   연동, 관리자 StudentDetail.tsx 전용), (b) `universityPayloadAdapter.ts`(교사 입력 기반,
   학생/교사 화면에서 사용), (c) `studentUniversityPreview.ts`(Assessment Engine 공개
   성적 기반, 학부모 화면 전용). 이번 Phase는 "빠르게 연결"이 목표라 셋을 하나로
   합치지 않았지만, 다음 단계에서 통합을 검토할 가치가 있다 — 특히 (a)가 가장 정교하고
   실제 API 연동까지 되어 있으니, 장기적으로는 (b)/(c)도 (a) 기반으로 재구성하는 편이
   일관성 있을 것이다.
2. **TeacherStudentDetail.tsx의 새 섹션은 읽기 전용 요약이다.** 실제 Draft 구성이나
   Phase 5.1 API 호출은 여전히 관리자 화면에서만 가능하다 — 교사에게도 그 권한을 줄지는
   RBAC 정책 결정이 필요해 이번 범위에는 넣지 않았다.
3. **`universityRecommendationPayload.ts`는 여전히 빈 deprecated 파일로 남아있다.** 실제
   참조가 없는 게 확인됐으니, 다음 정리 Phase에서 완전히 삭제해도 안전하다(이번엔
   "삭제보다 숨김/축약 우선" 원칙에 따라 손대지 않았다).
4. **내부 함수/변수 이름(`payload`, `buildUniversityRecommendationPayloadForStudent` 등)은
   여전히 "payload"라는 이름을 쓴다.** 화면 문구에서는 완전히 걷어냈지만, 코드베이스
   전체에서 이 이름 자체를 다른 용어로 바꾸는 리네이밍은 이번 범위(사용자 화면 문구
   정리)를 벗어난다고 판단해 하지 않았다 — 필요하면 별도 Phase로 요청해달라.
