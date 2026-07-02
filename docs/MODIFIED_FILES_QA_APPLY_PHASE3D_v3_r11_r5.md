# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r11-r5

기준: `...-v3-r11-r4-github-upload.zip` 재추출(= v3-r10-r3 원본 + `GrowthOverview.tsx` 1개
유지분)에서 시작. `diff -rq` 전수 비교로 확정.

## 변경 파일 — 정확히 3개 (+ 유지 1개)

| 파일 | 변경 내용 | MD5 (변경 후) |
|------|-----------|-----|
| `src/pages/teacher/TeacherStudentGrowth.tsx` | 컨테이너 `lg:max-w-6xl` 확장, 학생 카드 목록 `lg:grid-cols-2`, `SP`→`성장 활동` 텍스트 3곳 | `a0541a742cd3bd0d62e4f828c6c69da1` |
| `src/pages/student/StudentMyPage.tsx` | 컨테이너 `lg:max-w-6xl` + `lg:grid-cols-3` 확장, 카드별 `lg:col-span` 부여(DOM 순서 유지), `SP`→`성장 활동` 텍스트 1곳(지시서 범위 외 추가 처리, CHANGES §3 참고) | `df8063482469adc953438975f084f0be` |
| `src/pages/student/StudentHome.tsx` | `성장 진열장` 카드의 `SP`→`성장 활동` 텍스트 1곳 | `8ca752ea361488ef241cc5c54bc47008` |
| `src/pages/growth/GrowthOverview.tsx` (변경 없음, 유지 확인만) | v3-r11-r4의 반응형 그리드 수정 그대로 유지 | `5b1a50b8049c1cef505557eea40ca367` |

## 불변 파일 (변경 없음 — 확인됨)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 엠블럼 관련 파일 — 전부 미변경 확인

| 파일 | 상태 |
|------|------|
| `src/components/brand/AxisEmblemBadge.tsx` | MD5 `18fd0434db2ab80776750f4bf7c31a68` — 원본과 바이트 단위 동일 |
| `src/components/brand/AxisTierMedallion.tsx` | MD5 `69333547eab3ce9a9299227e1a54c49c` — 원본과 바이트 단위 동일 |
| `src/components/brand/AxisEmblemPlaque.tsx` | 존재하지 않음(반려 체인 산출물 미포함) |

## 신규/삭제 파일

없음. `diff -rq` 기준 위 3개 파일 외 `src/` 전체가 baseline과 완전히 동일함을 확인했다.

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스에서 실제 재시도, 2026-07-02) | **실패 — E403, `host_not_allowed`**(레지스트리 자체가 이 세션의 네트워크 정책으로 차단됨. 코드 문제 아님) |
| `npm run build` | 위 install 실패로 시도 자체 불가 |
| 오프라인 스텁 tsc 하네스(근사 검증, `typescript@6.0.3`) | 변경 전 382건 vs 변경 후 382건, **신규 오류 0건**(정규화 diff 완전 동일) |

**이 문서는 "npm run build 통과"를 주장하지 않는다.** 최종 그린 빌드 확인은 GitHub Actions에서
반드시 이루어져야 한다. 스텁 하네스 파일(`_stub_globals.d.ts`, `tsconfig.check.json`)은 검증
전용이며 이 github-upload 산출물에는 포함하지 않았다.

## 수동 QA (스테이징 또는 Actions 빌드 후)

- [ ] `/teacher/growth`(강사 담당 학생 성장 현황): PC 폭에서 학생 카드가 2열로 배치되고,
      모바일 폭으로 줄이면 1열로 정상 회귀하는지
- [ ] 위 화면의 "평균 SP" → "평균 성장 활동", "SP 높은 순" → "성장 활동 높은 순", 각 학생
      카드의 "SP N · 엠블럼 M개" → "성장 활동 N · 엠블럼 M개" 텍스트 변경 확인
- [ ] `/student/mypage`(학생 마이페이지): PC 폭에서 프로필 카드가 전체 폭, 그 아래 좌측(닉네임
      설정·획득 엠블럼)/우측(Rival 미리보기·빠른 이동) 2컬럼으로 배치되는지. 모바일 폭에서는
      기존과 동일한 세로 스택인지
- [ ] 마이페이지 Rival 미리보기의 "SP N" → "성장 활동 N" 텍스트 변경 확인
- [ ] `/student/home`(학생 홈): "성장 진열장" 카드의 "SP N · 엠블럼 M개 보유" → "성장 활동 N ·
      엠블럼 M개 보유" 텍스트 변경 확인. 그 외 레이아웃은 기존과 동일한지(회귀 없음 재확인)
- [ ] `/admin/growth/overview`: 요약 카드 5개 반응형(2→3→5열) 및 테이블/검색 전체 폭 사용이
      기존과 동일하게 유지되는지(이번 패스 코드 변경 없음)
- [ ] 엠블럼 시각(배지/티어 메달)이 이전과 완전히 동일하게 유지되는지(디자인 변경 없어야 함,
      위치만 재배치됨)
- [ ] 학생/학부모 화면 헌법 위반 없음(재무/Rival·Emblem·SP·Tier/금지표현)

## APPLY ORDER

1. `src/pages/teacher/TeacherStudentGrowth.tsx`
2. `src/pages/student/StudentMyPage.tsx`
3. `src/pages/student/StudentHome.tsx`
4. `src/pages/growth/GrowthOverview.tsx` — 내용 변경 없음(참고용, r11-r4 유지분 그대로)

빌드: `npm install` → `npm run typecheck` → `npm run build` → **GitHub Actions에서 그린 확인
필수**(이 환경에서는 검증 불가했음을 재강조).

## 롤백

3개 파일(`TeacherStudentGrowth.tsx`, `StudentMyPage.tsx`, `StudentHome.tsx`)을 각각 원본으로
되돌리면 v3-r11-r4(= v3-r10-r3 + GrowthOverview 반응형 그리드) 상태와 100% 동일해진다.
