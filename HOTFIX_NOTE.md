# GitHub Build Hotfix v1 — 누락 파일 4개 추가

## 원인
Phase 3A-2(v2)의 github-upload 산출물은 "Phase 3A 베이스라인 대비 실제로 수정한 파일"만 diff
방식으로 추렸다. 그런데 아래 4개 파일은 Claude 작업 환경의 Phase 3A 베이스라인(전체 프로젝트
상태)에는 원래부터 존재했지만, 실제 GitHub 저장소에는 반영되어 있지 않았다 — 즉 "수정 안 함"과
"애초에 저장소에 없음"을 구분하지 못한 diff 로직의 허점이었다. 그 결과 이 4개 파일을 import하는
10개 파일에서 GitHub Actions 빌드가 "Cannot find module" 오류로 실패했다.

## 조치
아래 4개 파일을 **내용/경로 변경 없이 그대로** 이번 github-upload 패키지에 포함했다. import
경로는 전혀 바꾸지 않았다(지시대로 "누락 파일을 포함하는 방식"으로만 해결).

- `src/pages/growth/RivalSeasonManagement.tsx`
- `src/lib/phase2dData.ts`
- `src/lib/studentProfile.ts`
- `src/lib/studentUniversityPreview.ts`

## 검증
전체 프로젝트 기준 `tsc --noEmit --project tsconfig.app.json` 재실행 결과 **0 errors**
(스텁 기반 검증 — QA_PHASE3A_2.md 상단 "검수 환경" 절 참조. `npm install`은 이 작업 환경에서
네트워크 차단으로 실행 불가하며, 로컬에서 `npm install && npm run build` 1회 실행을 권장).

이번 hotfix는 Phase 3A-2(v2) 대비 **위 4개 파일 추가만 있으며, 기존 v2의 다른 변경 내용은
전혀 건드리지 않았다**(로직/문구/파일 삭제 내역 모두 v2 그대로 유지).
