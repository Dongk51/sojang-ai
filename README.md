# 자산형성 도우미 — 사회초년생 자산관리 서비스

사회 초년생이 월급을 관리하고 목돈을 모으는 과정을 돕는 웹 서비스입니다.
월수입 기반 저축·투자 배분 공식, 목표별 저축 트래커, 목표들을 한눈에 모아보는 로드맵을 하나의 대시보드에서 제공합니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 회원 가입 / 로그인 | JWT 기반 인증, 사용자별 데이터 격리 |
| 자산형성 공식 | 월수입(·월지출) 입력 → 저축/투자/지출 추천 배분 및 비상자금 목표 계산 |
| 목적자금 관리 | 목표명·목표금액·목표기한을 등록하고 입금 내역으로 진행률 추적 |
| 나만의 로드맵 | 등록한 목표들을 기한순 타임라인으로 한눈에 확인 |

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19, React Router 7, Vite, Tailwind CSS 3 |
| Backend | FastAPI (Python 3.11), SQLAlchemy, JWT (python-jose) |
| DB | PostgreSQL 16 |
| 인프라 | Docker, Docker Compose |

## 프로젝트 구조

```
sojang-ai/
├── frontend/               # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/          # DashboardPage, AssetFormulaPage, GoalsPage, RoadmapPage
│       ├── context/        # AuthContext (JWT 관리)
│       └── services/       # api.js (fetch 래퍼)
├── backend/                # FastAPI
│   ├── routers/            # auth, goals, formula
│   ├── models.py           # SQLAlchemy 모델
│   └── schemas.py          # Pydantic 스키마
└── docker-compose.yml
```

## 시작하기

### 사전 준비

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치

### 1. 환경 변수 설정

```bash
# 루트 디렉터리 — PostgreSQL 접속 정보
cp .env.example .env

# 백엔드 — DB URL, JWT 시크릿
cp backend/.env.example backend/.env

# 프론트엔드 — API 주소
cp frontend/.env.example frontend/.env
```

`backend/.env`를 열고 다음 값을 실제 값으로 교체하세요.

```env
SECRET_KEY=랜덤한-긴-문자열-입력          # 예: openssl rand -hex 32
```

### 2. Docker로 전체 실행

```bash
docker compose up --build
```

| 서비스 | 주소 |
|--------|------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API 문서 (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

### 3. 로컬 개발 (선택)

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## 환경 변수 목록

### 루트 `.env`

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `POSTGRES_PASSWORD` | 앱 DB 사용자 비밀번호 | `sojang_password` |

### `backend/.env`

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | SQLAlchemy DB 접속 URL | `postgresql+psycopg2://...` |
| `ALLOWED_ORIGINS` | CORS 허용 출처 (콤마 구분) | `http://localhost:5173` |
| `SECRET_KEY` | JWT 서명 키 | *(긴 랜덤 문자열)* |

### `frontend/.env`

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `http://localhost:8000` |

## API 문서

백엔드 실행 후 http://localhost:8000/docs 에서 Swagger UI로 전체 엔드포인트를 확인할 수 있습니다.
