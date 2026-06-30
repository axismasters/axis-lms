# AXIS LMS v1.2 — MVP RC Live Manual QA v1 (Staging Handoff)

## 이번 작업 성격

Staging 배포 설정 파일 + QA 체크리스트 handoff.  
이 ZIP을 repo에 추가하고 Vercel/Netlify에 연결하면 Staging URL이 생성된다.

## 현재 기준 baseline

```
59. MVP RC Manual QA Execution v1 buildfix
```

## 왜 Staging URL을 직접 생성하지 못했는가

이 실행 환경에서 npmjs.org, vercel.com 모두 네트워크 egress 차단 상태다:

```
HTTP/2 403 — x-deny-reason: host_not_allowed
```

- `npm install` 실패 (패키지 다운로드 불가)
- `npm run build` 실행 불가
- Vercel/Netlify 직접 배포 불가

## 이 ZIP으로 가능한 것

사용자가 GitHub에 이 파일들을 push하면:

1. **Vercel 대시보드에서 repo 연결 → 자동 Staging URL 생성** (약 10분)
2. GitHub Actions `staging-deploy.yml`로 push마다 자동 재배포

## 이 앱의 Staging 특징

| 항목 | 내용 |
|---|---|
| DB | mock Context 기반 (DB 설정 불필요) |
| 인증 | DEV 역할 전환 드롭다운 (실제 로그인 없음) |
| 결제 | mock (PG 연동 없음) |
| 알림 | mock toast (카카오/SMS 없음) |
| 개인정보 | 샘플 데이터만 (실제 개인정보 입력 금지) |

## 산출물 파일 목록

| 파일 | 역할 |
|---|---|
| `vercel.json` | SPA 라우팅 rewrite + 보안 헤더 + 빌드 설정 |
| `netlify.toml` | Netlify 대안 설정 (Vercel 미사용 시) |
| `.env.staging` | 환경변수 템플릿 (Vercel/Netlify 환경변수 설정 참조용) |
| `.github/workflows/staging-deploy.yml` | GitHub Actions CI/CD (push → 자동 배포) |
| `docs/STAGING_DEPLOYMENT_GUIDE.md` | 단계별 배포 가이드 (Vercel/Netlify/Actions) |
| `docs/STAGING_QA_CHECKLIST.md` | Staging 접속 후 실제 클릭 체크리스트 |

## 빠른 시작 (Vercel 기준)

```
1. 이 ZIP 파일들을 repo 루트에 추가하고 git push
2. vercel.com 접속 → GitHub 로그인 → "Add New Project" → repo 연결
3. 환경변수: VITE_APP_MODE=staging, VITE_APP_VERSION=1.2.0-rc
4. "Deploy" 클릭 → 약 3분 후 URL 생성
5. docs/STAGING_QA_CHECKLIST.md 기준으로 QA 수행
```

## 내장 테스트 계정

별도 계정 생성 불필요. 드롭다운으로 전환:

| 계정명 | 역할 | 특이사항 |
|---|---|---|
| 한태준 | 최고관리자 (SUPER_ADMIN) | 전체 권한 |
| 원장님 | 원장 (DIRECTOR) | 재무 포함 전체 |
| 행정 담당 | 행정 (STAFF) | 정산확정/환불승인 불가 |
| 김민준 | 강사 (TEACHER) | cls-001/002 담당, 재무 불가 |
| 학생 데모 | 학생 (STUDENT) | 학생 포털만, stu-001 |
| 보호자 데모 | 학부모 (GUARDIAN) | 학부모 포털만, stu-001/003 |

## 코드 수정 여부

없음.

## GitHub 업로드 여부

**필요**. 이 ZIP의 파일들을 repo에 추가해야 배포 설정이 적용된다.  
단, 코드 변경이 없으므로 별도 baseline 번호는 추가하지 않는다.
