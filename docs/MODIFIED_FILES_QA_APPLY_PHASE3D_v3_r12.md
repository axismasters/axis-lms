# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r12

기준: 직전 산출물 `...-v3-r11-r5-github-upload.zip` 재추출(§0 CHANGES 문서 참고 — 이번 턴은
zip 업로드 없이 진행). `diff -rq` 전수 비교로 확정.

## 신규 파일 — 2개

| 파일 | MD5 |
|------|-----|
| `src/lib/systemFeatureFlags.ts` | `b795fe0caae65e2491a424a0420aa85f` |
| `src/components/FeatureDisabledNotice.tsx` | `55b5559cc4de4c57e960772da23d2219` |

## 수정 파일 — 15개

| 파일 | MD5 |
|------|-----|
| `src/components/AdminLayout.tsx` | `4ac7f52506b9be90728a505760fa4165` |
| `src/contexts/GrowthContext.tsx` | `4d6e20cdf86cd49bc0a140ba5593cb1f` |
| `src/layouts/ParentLayout.tsx` | `58c464e8562bba627f39bf5696c39245` |
| `src/layouts/StudentLayout.tsx` | `cf3e9a676b0c5e4cdde73c5de84e3cf4` |
| `src/pages/StudentDetail.tsx` | `fbe85bde5991f255ed2bfc7e70840613` |
| `src/pages/parent/ParentHome.tsx` | `9c3fec2ecfe75ea21af3fb505f723d94` |
| `src/pages/settings/AcademyInfoManagement.tsx` | `54fd725a257d5b3dc66b0cc9d729fa3a` |
| `src/pages/student/StudentGrowthShowcase.tsx` | `b84a0b32ccded33bf6a2f407f9b5807c` |
| `src/pages/student/StudentHome.tsx` | `981a603c0b886799e34787ab1b0c495d` |
| `src/pages/student/StudentMyPage.tsx` | `c8f44874906e2a7ba663dc668cd33a6b` |
| `src/pages/teacher/TeacherStudentDetail.tsx` | `864450b2d03b977d36cab279d481701b` |
| `src/pages/teacher/TeacherStudentGrowth.tsx` | `924adae19769fe22a939b5eed3f17caa` |
| `src/routes/AdminRoutes.tsx` | `6c706e824110aa02f7f2fcf22a7257fc` |
| `src/routes/ParentRoutes.tsx` | `3a2aec1f091965671c901d0f0f90a453` |
| `src/routes/StudentRoutes.tsx` | `6bee69bb2bdc745499f0ac1554e68e5b` |

## 불변 파일 (변경 없음 — 확인됨)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 엠블럼 관련 파일 — 전부 미변경 확인

| 파일 | 상태 |
|------|------|
| `src/components/brand/AxisEmblemBadge.tsx` | MD5 `18fd0434db2ab80776750f4bf7c31a68` — 바이트 단위 동일 |
| `src/components/brand/AxisTierMedallion.tsx` | MD5 `69333547eab3ce9a9299227e1a54c49c` — 바이트 단위 동일 |
| `src/components/brand/AxisEmblemPlaque.tsx` | 존재하지 않음 |

## 신규/삭제 파일 (그 외)

없음. `diff -rq` 기준 위 17개 파일(신규 2 + 수정 15) 외 `src/` 전체가 기준선과 완전히 동일함을
확인했다.

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스에서 실제 재시도, 2026-07-02 06:02 UTC) | **실패 — E403, `host_not_allowed`** |
| `npm run build` | 위 install 실패로 시도 자체 불가 |
| 오프라인 스텁 tsc 하네스(근사 검증) | 기준선 382건 → 변경 후 386건. **신규 4건은 전부 기존과 동일 카테고리(TS2307/TS2503/TS2875)의 스텁 한계이며 로직/타입 오류는 0건**(CHANGES 문서 §6에 파일별 상세 분석 기재) |

**"npm run build 통과"를 주장하지 않는다.** 최종 그린 빌드 확인은 GitHub Actions에서 필요하다.
스텁 하네스 파일(`_stub_globals.d.ts`, `tsconfig.check.json`)은 검증 전용이며 이
github-upload 산출물에는 포함하지 않았다.

## 수동 QA (스테이징 또는 Actions 빌드 후)

**공통 — 시스템설정**
- [ ] `/admin/settings/academy`(학원정보관리) 하단에 "기능 사용 설정" 카드가 보이는지
- [ ] 토글 3개(Rival/Emblem/재무관리) ON/OFF가 즉시 반영되는지
- [ ] 새로고침 후에도 설정이 유지되는지

**Rival OFF 시**
- [ ] 학생 상단/하단 네비에서 "Rival" 탭이 사라지는지
- [ ] `/student/rival` 직접 접근 시 비활성 안내가 뜨는지(404 아님)
- [ ] StudentHome 우측 Rival 카드가 비활성 안내로 바뀌는지
- [ ] StudentMyPage의 "Rival 닉네임"/"Rival 공개 프로필 미리보기" 카드가 비활성 안내로 바뀌는지
- [ ] StudentGrowthShowcase의 "Rival 매치업 연결" 카드가 비활성 안내로 바뀌는지
- [ ] `/admin/growth/rivals`, `/admin/growth/rival-seasons` 직접 접근 시 비활성 안내가 뜨는지
- [ ] 사이드바에서 "Rival 시즌 관리" 메뉴가 사라지는지
- [ ] 관리자 학생상세 > 성장/진열장 탭에서 라이벌 카드(승/패/종료 버튼 포함)가 비활성 안내로
      바뀌는지
- [ ] 교사 담당학생 성장현황(GrowthCard)에서 "Rival 승" 지표가 사라지는지
- [ ] 교사 학생상세 "성장 상담 요약"에서 "또래 성장 비교" 통계가 사라지는지
- [ ] 기존 라이벌 관계 데이터가 삭제되지 않고 그대로 남아있는지(다시 ON 하면 복원 확인)

**Emblem OFF 시**
- [ ] StudentMyPage "보유 엠블럼" 카드가 비활성 안내로 바뀌는지
- [ ] StudentGrowthShowcase "성장 엠블럼 컬렉션" 카드가 비활성 안내로 바뀌는지
- [ ] `/admin/growth/emblems` 직접 접근 시 비활성 안내가 뜨는지
- [ ] 관리자 학생상세 성장/진열장 탭에서 대표 엠블럼 3슬롯/최근 획득/진행 중 엠블럼이 전부
      비활성 안내로 바뀌고, "엠블럼 지급" 버튼이 사라지는지(SP 지급 버튼은 그대로 남는지)
- [ ] 교사 학생상세 "성장 상담 요약"에서 보유 엠블럼 배지 줄이 사라지는지
- [ ] 기존 엠블럼 데이터가 삭제되지 않았는지(다시 ON 하면 복원 확인)

**재무관리 OFF 시**
- [ ] 관리자 사이드바에서 "재무관리" 대메뉴 전체가 사라지는지
- [ ] `/admin/finance/payments`·`refunds`·`unpaid`·`settlements`·`statistics` 5개 모두 직접
      접근 시 비활성 안내가 뜨는지
- [ ] 학부모 하단/상단 네비에서 "수납" 탭이 사라지는지
- [ ] ParentHome "수납 상태" 섹션이 비활성 안내로 바뀌는지
- [ ] `/parent/finance` 직접 접근 시 비활성 안내가 뜨는지
- [ ] 기존 재무 데이터가 삭제되지 않았는지(다시 ON 하면 복원 확인)

**공통 헌법 재확인**
- [ ] 엠블럼 시각(배지/티어 메달) 디자인이 이전과 완전히 동일한지(컴포넌트 자체 미변경)
- [ ] 학생 화면에 재무 노출이 여전히 없는지
- [ ] 학부모 화면에 Rival/Emblem/SP/Tier 직접 노출이 여전히 없는지

## APPLY ORDER

1. `src/lib/systemFeatureFlags.ts` (신규, 다른 모든 파일이 이걸 import)
2. `src/components/FeatureDisabledNotice.tsx` (신규)
3. `src/components/AdminLayout.tsx`
4. `src/contexts/GrowthContext.tsx`
5. `src/layouts/StudentLayout.tsx`, `src/layouts/ParentLayout.tsx`
6. `src/routes/AdminRoutes.tsx`, `src/routes/StudentRoutes.tsx`, `src/routes/ParentRoutes.tsx`
7. `src/pages/student/*`, `src/pages/parent/ParentHome.tsx`, `src/pages/teacher/*`,
   `src/pages/StudentDetail.tsx`, `src/pages/settings/AcademyInfoManagement.tsx`

빌드: `npm install` → `npm run typecheck` → `npm run build` → **GitHub Actions에서 그린 확인
필수**(이 환경에서는 검증 불가했음을 재강조).

## 롤백

위 17개 파일(신규 2 + 수정 15)을 각각 원본/삭제로 되돌리면 v3-r11-r5 상태와 100% 동일해진다.
개별 기능만 되돌리고 싶다면:
- Rival만 되돌리기: `StudentRoutes.tsx`/`StudentLayout.tsx`/`StudentHome.tsx`/
  `StudentMyPage.tsx`/`StudentGrowthShowcase.tsx`/`TeacherStudentGrowth.tsx`/
  `TeacherStudentDetail.tsx`/`StudentDetail.tsx`/`AdminRoutes.tsx`/`AdminLayout.tsx`/
  `GrowthContext.tsx`에서 rivalEnabled 관련 조건만 제거
- 전체 롤백이 가장 안전하고 확실하다(부분 롤백은 각 파일에 rival/emblem/finance 관련 코드가
  섞여 있어 실수 위험이 있음)
