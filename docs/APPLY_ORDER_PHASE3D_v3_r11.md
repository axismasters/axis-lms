# APPLY ORDER — Phase 3D v3-r11

기준: v3-r10-r3 위에 적용 · 모든 변경은 **독립적(문자열/주석/className)**이라 적용 순서 의존성 없음.
아래는 검토·반영 권장 순서.

## 1) 사전 확인
- 현재 코드베이스가 **v3-r10-r3**인지 확인.
- 불변 파일 MD5 3종 확인:
  - `src/lib/universityAnalysisAdapter.ts` = 1eddaef5cf427e00666be685ea16f32f
  - `src/App.tsx` = 387bbf48a3d87ff63ce10d6dbc8bf33c
  - `src/lib/classData.ts` = 126d9e5e314de186bf1df0a63b3abf82

## 2) 파일 반영 (순서 무관, 아래 순서 권장)
1. `src/lib/growthData.ts`
2. `src/lib/rivalSeasonData.ts`
3. `src/lib/studentBriefingEngine.ts`
4. `src/pages/growth/RivalManagement.tsx`
5. `src/pages/growth/RivalSeasonManagement.tsx`
6. `src/pages/growth/ShowcasePolicyManagement.tsx`
7. `src/pages/growth/GrowthOverview.tsx`
8. `src/pages/settings/PermissionSettings.tsx`
9. `src/routes/ParentRoutes.tsx`
10. `src/pages/teacher/TeacherStudentGrowth.tsx`

## 3) 빌드/검증
- `npm install`
- `npm run typecheck` (tsc -b --noEmit)
- `npm run build` (tsc -b && vite build)
- GitHub Desktop → Commit → Push → **GitHub Actions Build Check 그린 확인**

## 4) 배포 후 스모크 (스테이징)
- `QA_PHASE3D_v3_r11.md`의 B1~B6 수동 체크리스트 수행.
- 특히 **교사 "학생 성장 현황"** 데스크톱 2컬럼 레이아웃과, 관리자 라이벌/시즌 화면의 성장 언어 라벨 확인.

## 롤백
- 10개 파일을 v3-r10-r3 버전으로 되돌리면 완전 원복(데이터 계약/스키마 변경 없음).
