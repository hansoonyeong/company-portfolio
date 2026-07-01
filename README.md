# sceno — Company Portfolio

창비 스타일의 심플한 회사 포트폴리오 사이트입니다.

## 시작하기

```bash
cd ~/Downloads/company-portfolio
npm install
npm run dev
```

## 페이지

| URL | 내용 |
|-----|------|
| `/` | 메인 — 히어로, 새소식, 프로젝트, 회사소개 |
| `/pricing` | 요금 안내 — Price Guide 2026 전체 가격표 |

## 기능

- **한국어 / English** — 헤더 KO · EN 전환
- **별도 요금 페이지** — 메인에는 가격표 미표시

## 콘텐츠 수정

| 파일 | 내용 |
|------|------|
| `src/i18n/translations.js` | 메인 텍스트 + `pricingPage` 요금표 |
| `src/data/config.js` | 이메일, 전화, SNS, 로고 |

## 배포 (Render)

### 1. GitHub에 push

```bash
git init
git add .
git commit -m "Deploy to Render"
# GitHub 새 repo 생성 후
git remote add origin https://github.com/YOUR_USER/company-portfolio.git
git branch -M main
git push -u origin main
```

### 2. Render에서 서비스 생성

1. [render.com](https://render.com) → **New → Blueprint**
2. GitHub repo 연결 → 루트의 `render.yaml` 적용  
   (또는 **Web Service** 수동 생성: Build `npm install && npm run build`, Start `npm start`)
3. **Environment Variables**
   - `ADMIN_PASSWORD` — 관리자 비밀번호 (필수, 기본 `soono2026` 사용 금지)
4. **Persistent Disk** — `render.yaml`에 `server/data` 1GB (견적·관리자 수정 JSON 유지)
5. Deploy

### 3. 확인

- `https://YOUR-SERVICE.onrender.com/` — 메인
- `https://YOUR-SERVICE.onrender.com/api/health` — `{ "ok": true }`
- `/admin` — 관리자

> **참고:** 관리자에서 **새로 업로드한 이미지**는 `public/`에 저장됩니다. 재배포 후에도 유지하려면 Git에 커밋하거나, 이후 Blob 스토리지 연동을 권장합니다.

로컬 프로덕션 미리보기:

```bash
npm run preview
```
