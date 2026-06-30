# AXIS LMS v1.2 Staging 배포 가이드

> 목표: 실제 접속 가능한 Staging URL 생성  
> 소요 시간: 약 10~15분  
> 전제: GitHub repo 보유 + Vercel 계정 (무료)

---

## 이 앱의 Staging 특징

| 항목 | 내용 |
|---|---|
| 데이터 | mock Context 기반 (실제 DB 없음) |
| 인증 | DEV 역할 전환 UI (화면 우측 상단 드롭다운) |
| 결제 | mock (실제 PG 없음) |
| 알림 | mock toast (실제 카카오/SMS 없음) |
| 대학분석 | VITE_PHASE51_API_URL 미설정 시 mock |

별도 DB 설정 없이 즉시 배포 가능하다.

---

## 방법 A: Vercel 대시보드 (가장 빠름 — 추천)

### 1단계: GitHub에 배포 파일 추가

이번 ZIP에 포함된 파일들을 repo 루트에 추가하고 push한다:

```
vercel.json                              ← SPA 라우팅
.env.staging                             ← 환경변수 참조용 (실제값은 Vercel에서 설정)
.github/workflows/staging-deploy.yml    ← 자동 배포 (선택)
```

### 2단계: Vercel에 프로젝트 연결

1. https://vercel.com 접속 → GitHub로 로그인
2. **"Add New Project"** 클릭
3. **"Import Git Repository"** → repo 선택
4. 설정 화면:
   - **Framework Preset**: Vite (자동 감지)
   - **Root Directory**: `.` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `dist` (기본값)

### 3단계: 환경변수 설정

Vercel 프로젝트 설정 → **"Environment Variables"**:

| 변수명 | 값 | 환경 |
|---|---|---|
| `VITE_APP_MODE` | `staging` | Preview + Production |
| `VITE_APP_VERSION` | `1.2.0-rc` | Preview + Production |
| `VITE_PHASE51_API_URL` | (비워둠 또는 실제 URL) | Preview + Production |

### 4단계: 배포

**"Deploy"** 클릭 → 약 2~3분 후 URL 생성:

```
https://axis-lms-v12.vercel.app         (또는 프로젝트명 기반 URL)
```

이후 main 브랜치 push 시 자동 재배포된다.

---

## 방법 B: Netlify 대시보드 (Vercel 대안)

### 1단계: GitHub에 배포 파일 추가

`netlify.toml`을 repo 루트에 추가하고 push.

### 2단계: Netlify에 프로젝트 연결

1. https://app.netlify.com 접속 → GitHub로 로그인
2. **"Add new site"** → **"Import an existing project"**
3. GitHub 선택 → repo 선택
4. 빌드 설정 (netlify.toml에서 자동 감지):
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3단계: 환경변수 설정

**Site configuration** → **"Environment variables"**:

| 변수명 | 값 |
|---|---|
| `VITE_APP_MODE` | `staging` |
| `VITE_APP_VERSION` | `1.2.0-rc` |
| `VITE_PHASE51_API_URL` | (비워둠) |

### 4단계: 배포

**"Deploy site"** → 약 2~3분 후:
```
https://axis-lms-v12.netlify.app
```

---

## 방법 C: GitHub Actions 자동 배포 (CI/CD)

`.github/workflows/staging-deploy.yml`을 사용한다.  
Vercel 계정이 있고 GitHub Secrets가 설정된 경우에만 사용한다.

### GitHub Secrets 등록

repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret 이름 | 값 획득 방법 |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → 프로젝트 → Settings → General → "Team ID" |
| `VERCEL_PROJECT_ID` | Vercel → 프로젝트 → Settings → General → "Project ID" |
| `VITE_PHASE51_API_URL` | (비워두거나 실제 API URL) |

### 동작 방식

- main 브랜치 push → 자동 typecheck → build → Staging 배포
- PR → Preview URL 자동 댓글 등록

---

## 배포 후 확인

배포된 URL에서:

1. 화면 우측 상단의 **계정 전환 드롭다운**으로 역할 변경
2. 각 포털 메뉴 접근 확인
3. docs/STAGING_QA_CHECKLIST.md 기준으로 기능 확인

---

## 운영 배포 전 필수 제거 항목

Staging에서 검증 완료 후 실제 운영 배포 전:

1. **DEV 역할 전환 UI 제거**: `AuthContext.tsx` TODO 주석 확인
2. **`VITE_APP_MODE` → `production`** 으로 변경 또는 ENV 제거
3. **실제 로그인 세션** 구현 (현재 `loginAs` mock 방식)
4. **실제 DB 연동** (현재 mock Context)

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 새로고침 시 404 | SPA 라우팅 누락 | `vercel.json` 또는 `netlify.toml` 확인 |
| 빌드 실패 (tsc 오류) | TypeScript 오류 | `npm run typecheck` 로컬 먼저 실행 |
| 화면이 흰색 | React 렌더링 오류 | 브라우저 콘솔 오류 확인 |
| 역할 전환 드롭다운 미표시 | VITE_APP_MODE 미설정 | Vercel 환경변수 `VITE_APP_MODE=staging` 확인 |
