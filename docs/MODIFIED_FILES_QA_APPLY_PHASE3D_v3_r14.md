# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r14

기준: v3-r13 코드 + 이번에 업로드된 `axis_lms_emblem_assets_v1.zip`. `diff -rq` 전수
비교로 확정.

## 신규 파일 — 코드 3개 + 이미지 자산 69개

| 파일 | 설명 | MD5 |
|------|------|-----|
| `src/lib/emblemAssetManifest.ts` | manifest 매핑 + 기존 엠블럼 id 연결(23건) + Tier 연결(6건) | `ff9cc9b2cb7443ad5e77174014179f25` |
| `src/components/brand/AxisEmblemImageBadge.tsx` | PNG 우선/SVG fallback 엠블럼 렌더러 | `6a8142b0fe94488ec83d05f9211d1c11` |
| `src/components/brand/AxisTierImageMedallion.tsx` | PNG 우선/SVG fallback Tier 렌더러 | `3a6cd98e87392379eee0ad0d90f12acf` |
| `src/assets/emblems/tier/*.png` (6개), `core/*.png` (30개), `hidden/*.png` (12개), `math_units/*.png` (21개) | 원본 무변형 복사(총 69개, 58MB) | 원본과 해시 전수 일치(69/69) |

## 수정 파일 — 정확히 6개

| 파일 | 변경 내용 | MD5 |
|------|-----------|-----|
| `src/pages/student/StudentGrowthShowcase.tsx` | EmblemTile + Tier Hero 2곳을 PNG 우선 렌더러로 교체 | `17f604e4a8804309a695cfd1e84f20d5` |
| `src/pages/student/StudentMyPage.tsx` | 보유 엠블럼 그리드 + Tier 메달리온 교체 | `4c16a37ea3036f23952ebc7263a77dbb` |
| `src/pages/teacher/TeacherStudentGrowth.tsx` | GrowthCard "최근 엠블럼" 배지 교체 | `2c5d2f99c2244d40c2588f78a6945bc7` |
| `src/pages/teacher/TeacherStudentDetail.tsx` | 성장 상담 요약 배지 교체 | `57b0fc5639bf5f638081689a80a4f85e` |
| `src/pages/StudentDetail.tsx` | 대표 엠블럼 3슬롯 / 최근 획득 / 진행 중 / Tier 헤더 교체(저수준 함수 직접 호출 방식) | `c39e4cdd694f941d5038f6d0a2bcc369` |
| `src/pages/growth/EmblemManagement.tsx` | 관리자 목록 테이블 배지 교체 | `5885798f227d352ceb7ba77ab8f53f0e` |

## 불변 파일 (변경 없음 — 재확인됨)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 엠블럼 디자인 파일 — 전부 미변경 확인(이번 Phase의 핵심 검수 기준)

| 파일 | 상태 |
|------|------|
| `src/components/brand/AxisEmblemBadge.tsx` | 바이트 단위 동일(수정 0줄) — `18fd0434db2ab80776750f4bf7c31a68` |
| `src/components/brand/AxisTierMedallion.tsx` | 바이트 단위 동일(수정 0줄) — `69333547eab3ce9a9299227e1a54c49c` |
| `src/lib/growthData.ts`(기존 엠블럼 37종 데이터) | 바이트 단위 동일(수정 0줄) — `b258f2f6c6cf9aaf81a39793a552ced9` |

## PNG 원본 무결성

69개 PNG 전부 업로드된 zip 원본과 md5 해시가 완전히 일치함을 전수 비교로 확인했다(재디자인/
리사이즈/압축/색상 변경 없음). `source_sheets/`, `transparent_sheets/`, 미리보기 이미지는
지시서대로 앱에 반입하지 않았다.

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스, 2026-07-02 07:11 UTC) | 실패 — E403 `host_not_allowed`(네트워크 정책, 코드 무관) |
| 오프라인 스텁 tsc 하네스 | v3-r13 기준 386건 → 변경 후 388건(+2, 신규 파일 2개의 stub 한계뿐. 로직 오류 0건) |
| `*.png` import 타입 해석 | 이 프로젝트 기존 `src/global.d.ts`의 `declare module '*.png'` 덕분에 스텁 환경에서도 정상 해석 |

## 수동 QA

**에셋/매핑**
- [ ] `/admin/growth/emblems`(엠블럼 관리)에서 매핑된 23종 엠블럼에 실제 PNG 이미지가
      보이고, 매핑 안 된 나머지는 기존 SVG로 정상 표시되는지
- [ ] 학생 성장 진열장(`/student/growth`) 엠블럼 컬렉션에서 이미지/SVG 혼재가 자연스러운지
- [ ] 학생 마이페이지(`/student/my`) 보유 엠블럼에서 동일하게 확인
- [ ] 교사 담당학생 성장현황(`/teacher/growth`), 교사 학생상세 상담요약에서 "최근/보유
      엠블럼" 배지가 이미지로 보이는지(매핑된 경우)
- [ ] 관리자 학생상세 성장/진열장 탭: 대표 엠블럼 3슬롯 / 최근 획득 / 진행 중(저채도 처리
      확인) 전부 이미지 우선 표시 확인
- [ ] Tier(성장 단계) 메달리온이 학생 화면(진열장 Hero, 마이페이지)과 관리자 학생상세에서
      PNG 이미지로 보이는지(SEED~AXIS_MASTER 6종), UNRANKED는 기존 SVG 방패로 남는지

**Emblem OFF 연동**
- [ ] emblemEnabled OFF 상태에서 위 모든 화면의 엠블럼 표시 영역이 v3-r13과 동일하게
      비활성 안내로 대체되고, 이미지가 전혀 로드되지 않는지(네트워크 탭에서 PNG 요청 없음
      확인 권장)

**무결성**
- [ ] 엠블럼 배지/티어 메달 SVG(매핑 안 된 항목들)가 이전과 완전히 동일한 디자인으로
      보이는지(컴포넌트 자체 미변경 확인)
- [ ] 기존 학생들의 획득 엠블럼 기록이 전부 그대로 보존되어 있는지(개수/이름 변경 없음)
- [ ] 학부모 화면에 Emblem/Tier 명칭이나 이미지가 여전히 노출되지 않는지
- [ ] `npm run build` 통과(GitHub Actions에서 최종 확인)

## APPLY ORDER

1. `src/assets/emblems/**`(이미지 자산 — 코드보다 먼저 배치)
2. `src/lib/emblemAssetManifest.ts`
3. `src/components/brand/AxisEmblemImageBadge.tsx`, `AxisTierImageMedallion.tsx`
4. `src/pages/growth/EmblemManagement.tsx`
5. `src/pages/student/StudentGrowthShowcase.tsx`, `StudentMyPage.tsx`
6. `src/pages/teacher/TeacherStudentGrowth.tsx`, `TeacherStudentDetail.tsx`
7. `src/pages/StudentDetail.tsx`

## 롤백

신규 파일 3개(코드) + 이미지 자산 폴더를 삭제하고, 수정 파일 6개를 원본으로 되돌리면
v3-r13 상태와 100% 동일해진다. 부분 롤백(예: Tier 이미지만 빼고 엠블럼 이미지는 유지)은
각 파일에서 `AxisTierImageMedallion`/`AxisEmblemImageBadge` import를 원래
`AxisTierMedallion`/`AxisEmblemBadge`로 되돌리면 된다(로직 분리되어 있어 독립적으로 되돌릴
수 있음).
