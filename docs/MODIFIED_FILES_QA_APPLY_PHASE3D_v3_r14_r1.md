# MODIFIED FILES / QA / APPLY ORDER — Phase 3D v3-r14-r1

기준: 반려된 `...-v3-r14-github-upload.zip` 재추출. `diff -rq` 전수 비교로 확정.

## 수정 파일 — 정확히 4개 (신규/삭제 파일 없음)

| 파일 | 변경 내용 | MD5 |
|------|-----------|-----|
| `src/components/brand/AxisEmblemImageBadge.tsx` | OFF 시 SVG fallback도 렌더하지 않고 `null` 반환하도록 분기 순서 재구성 | `cacd9216d185d053e3250e8eb27fb0a7` |
| `src/pages/StudentDetail.tsx` | 라이벌 카드 상대 정보 텍스트 조건부 처리, 엠블럼 지급 모달에 emblemEnabled 가드 추가, 저수준 이미지 조회 3곳에 이중 가드 추가 | `14e8d9d42a6bcf4d2637ba60aa5571d8` |
| `src/pages/student/StudentHome.tsx` | 성장 요약 카드 텍스트에서 emblemEnabled false 시 엠블럼 개수 제거 | `ee37eabb9a20eb9863f26244a6d3d231` |
| `src/pages/student/StudentMyPage.tsx` | 닉네임 안내 문구에서 emblemEnabled false 시 "Emblem" 단어 제거 | `a5e8da4dfb2044f89c89884d1d5da69a` |

## 불변 파일 (변경 없음 — 재확인됨)

| 파일 | MD5 |
|------|-----|
| `src/lib/universityAnalysisAdapter.ts` | `1eddaef5cf427e00666be685ea16f32f` |
| `src/App.tsx` | `387bbf48a3d87ff63ce10d6dbc8bf33c` |
| `src/lib/classData.ts` | `126d9e5e314de186bf1df0a63b3abf82` |

## 엠블럼 디자인/데이터/PNG 무결성

| 항목 | 상태 |
|------|------|
| `src/components/brand/AxisEmblemBadge.tsx` | 바이트 단위 동일(수정 0줄) |
| `src/components/brand/AxisTierMedallion.tsx` | 바이트 단위 동일(수정 0줄) |
| `src/lib/growthData.ts` | 바이트 단위 동일(수정 0줄) |
| PNG 69개(`src/assets/emblems/**`) | 원본과 해시 전수 일치(무변형) |

## 신규/삭제 파일

없음. `diff -rq` 기준 위 4개 파일 외 `src/` 전체가 v3-r14와 완전히 동일함을 확인했다.

---

## 빌드 검증 결과 (있는 그대로)

| 항목 | 결과 |
|------|------|
| `npm install`(이 샌드박스, 2026-07-02 07:35 UTC) | 실패 — E403 `host_not_allowed`(네트워크 정책, 코드 무관) |
| 오프라인 스텁 tsc 하네스 | v3-r14 기준 388건 → 변경 후 388건. 신규 오류 0건(순수 줄-시프트 2건만 확인) |
| 참고 | 사용자가 v3-r14 시점 실제 `npm install`/`npm run build` 통과를 확인해줬음. 이번 변경은 텍스트 조건문 + 함수 분기 재배치 수준으로 국한됨 |

## 수동 QA — 이번 수정 4건 + 하드닝 1건 재확인

- [ ] Emblem OFF 상태에서 `/student`(학생 홈) 성장 요약 카드에 "성장 활동 N"만 보이고
      "· 엠블럼 N개 보유"는 사라지는지
- [ ] Emblem OFF + Rival ON 상태에서 `/student/my`(마이페이지) 닉네임 안내 문구가
      "닉네임은 Rival, 성장 진열장에서 사용됩니다."로 보이는지(Emblem 단어 없음)
- [ ] Emblem ON + Rival ON 상태에서는 위 문구가 기존처럼 "Rival, Emblem, 성장
      진열장"으로 보이는지(회귀 확인)
- [ ] Emblem OFF 상태에서 관리자 학생상세 "현재 라이벌" 카드의 상대 정보가 "SP N"만
      보이고 "· 엠블럼 N개"는 사라지는지
- [ ] Emblem OFF 상태에서 관리자 학생상세 성장/진열장 탭의 엠블럼 지급 버튼이 안 보이고,
      (버튼을 눌러 모달을 연 상태에서 설정을 꺼도) 모달도 화면에서 사라지는지
- [ ] Emblem OFF 상태에서 대표 엠블럼 3슬롯 / 최근 획득 / 진행 중 엠블럼 섹션 전체가
      비활성 안내로 대체되고, 그 안에 이미지가 전혀 로드되지 않는지
- [ ] Emblem OFF 상태에서 개발자 도구로 직접 `<AxisEmblemImageBadge emblemId="emb-001" />`를
      렌더링해도(호출부 우회 시나리오) 아무것도 표시되지 않는지(SVG도 안 뜸)
- [ ] Emblem ON 상태에서 매핑된 엠블럼은 PNG로, 매핑 안 된 엠블럼은 기존 SVG로 정상
      표시되는지(회귀 확인 — v3-r14의 정상 동작 유지)
- [ ] 학부모 화면에 Emblem/SP/Tier/Rival 직접 노출이 여전히 없는지(회귀 확인)
- [ ] 학생 화면에 재무 노출이 여전히 없는지(회귀 확인)
- [ ] `npm run build` 통과(GitHub Actions에서 최종 확인)

## APPLY ORDER

1. `src/components/brand/AxisEmblemImageBadge.tsx`
2. `src/pages/StudentDetail.tsx`
3. `src/pages/student/StudentHome.tsx`
4. `src/pages/student/StudentMyPage.tsx`

## 롤백

4개 파일을 원본으로 되돌리면 v3-r14(반려된 산출물) 상태와 100% 동일해진다.
