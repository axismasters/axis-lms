// 이 파일은 @/lib/rbac.ts를 그대로 재노출합니다.
//
// 받은 AXIS LMS v1.2 파일들은 모두 '@/lib/rbac'에서 import하므로,
// 실제 구현은 src/lib/rbac.ts에 두고(import 경로 보존 — 원칙 3),
// 이 위치(src/utils/)에서도 동일하게 사용할 수 있도록 재노출만 한다.
export * from '@/lib/rbac';
