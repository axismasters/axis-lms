# APPLY ORDER — Phase 3D v3-r15-r1 (Safe Apply)

기준: **v3-r14-r3**(엠블럼 PNG 69개 전수조사 재작업 완료본) 위에 적용. v3-r15 zip 전체를
덮어쓰지 말고, 아래 5개 파일만 반영할 것. **이번 산출물은 diff 전용 패키지**(5개 코드
파일 + 문서 4개)이며, 이 문서에 없는 다른 파일(엠블럼 자산, tsbuildinfo 등)은 건드리지
않는다.

## 0) 금지 사항 재확인(반영 담당자 체크)

- [ ] `src/assets/emblems/**` — 수정 금지
- [ ] `src/lib/growthData.ts` — 수정 금지
- [ ] `src/components/brand/AxisEmblemImageBadge.tsx` — 수정 금지
- [ ] `src/components/brand/AxisTierMedallion.tsx` — 수정 금지
- [ ] `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` — 커밋 금지(`.gitignore`에
      이미 등록돼 있음 — 로컬 빌드로 재생성되더라도 `git add`하지 않는다)
- [ ] 이 zip을 저장소에 압축 해제해 전체 덮어쓰기하지 않는다 — 아래 5개 파일만 개별
      반영한다

## 1) 사전 확인

- 현재 코드베이스가 **v3-r14-r3**인지 확인(`docs/CHANGES_PHASE3D_v3_r14_r3.md` 존재 여부로
  판별 가능).
- `src/assets/emblems/` PNG 개수가 **69개**인지 확인.
- 불변 파일 3종 MD5 확인:
  - `src/lib/universityAnalysisAdapter.ts` = `1eddaef5cf427e00666be685ea16f32f`
  - `src/App.tsx` = `387bbf48a3d87ff63ce10d6dbc8bf33c`
  - `src/lib/classData.ts` = `126d9e5e314de186bf1df0a63b3abf82`

## 2) 신규 파일 추가 (아래 순서 권장 — 의존 관계 순)

1. `src/lib/examPrepGuideTypes.ts`
2. `src/lib/examPrepGuideEngine.ts`
3. `src/lib/examPrepGuideStore.ts`
4. `src/components/ExamPrepGuidePanel.tsx`

**주의**: 이 4개 파일은 기존 v3-r15 zip의 동일 경로 파일과 **내용이 완전히 동일**하다
(MD5 대조 완료 — `docs/MODIFIED_FILES_PHASE3D_v3_r15_r1.md` 참고). 이미 v3-r15를
부분적으로 반영해뒀다면 이 4개 파일은 다시 덮어쓸 필요 없이 그대로 둬도 된다.

## 3) 기존 파일 수정 반영

5. `src/pages/AssessmentDetail.tsx` — **v3-r15에 이미 반영했더라도 이번 파일로 다시
   덮어써야 한다.** v3-r15 대비 `?tab=prep` 직접 접근 안전장치(초기 보정 + `useEffect`
   이중 가드)가 추가되어 MD5가 다르다.

## 4) 엠블럼 무변경 재확인(반영 직후 필수)

- `src/assets/**` — 이번 반영 전후로 diff가 없어야 한다(파일 추가/삭제/수정 전부 0건).
- `src/lib/growthData.ts` / `src/components/brand/AxisEmblemImageBadge.tsx` /
  `src/components/brand/AxisTierMedallion.tsx` — MD5가 반영 전후로 동일해야 한다.
- 위 조건 중 하나라도 어긋나면 **되돌리고(revert) 재작업**한다(지시서 §5-5 원칙).

## 5) 빌드/검증

- `npm ci`
- `npm run typecheck` (`tsc -b --noEmit`)
- `npm run build` (`tsc -b && vite build`)
- 위 3개 명령을 이 검증 샌드박스에서 실제로 실행했고, 전부 네트워크 정책(`E403
  host_not_allowed`)으로 `npm ci`부터 실패했다 — `node_modules`가 없어 이어지는
  `typecheck`/`build`도 `wouter`/`react/jsx-runtime` 타입을 찾지 못하고 실패했다. 실패
  지점은 전부 이번 5개 파일과 무관한 기존 파일(`RoleRoute.tsx` 등)이며, 원인은 순수
  네트워크 환경 제약이다. 실제 통과 확인은 네트워크가 열려 있는 GitHub Actions에서
  이루어져야 한다(대체 검증은 `docs/QA_PHASE3D_v3_r15_r1.md` §A8 오프라인 스텁 tsc
  하네스 참고 — 이번 5개 파일 스코프 오류 0건).
- GitHub Desktop → Commit(Summary: `Phase 3D v3-r15-r1 safe apply: add exam prep guide
  engine as assessment detail tab only`) → Push → **GitHub Actions Build Check 그린 확인**

## 6) 반영 후 수동 확인 포인트(요약 — 전체 체크리스트는 QA 문서)

- `/scores` → 내신대비모의고사(카테고리) 시험 상세 → "내신 대비 가이드" 탭 노출 확인.
- 단원평가/입학테스트/인증평가/수능실전모의고사 시험 상세에는 탭 미노출 확인.
- 비내신 시험 상세에 `?tab=prep`으로 직접 접근 → 빈 화면 없이 "기본정보" 탭이 표시되는지
  확인(이번 r15-r1의 핵심 신규 검증 포인트).
- 엠블럼 화면(성장관리 > 엠블럼관리, 학생 마이페이지 등)에서 이미지가 이번 작업 이전과
  동일하게 보이는지 육안 확인(회귀 없음 재확인).
