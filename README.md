# 소장 AI — 소상공인 AI 업무 도우미

소상공인의 반복적인 업무를 줄이고 경영 인사이트를 제공하는 AI 기반 웹 서비스입니다.  
부가세 계산, 발주 메모 관리, OpenAI 기반 매출 분석을 하나의 대시보드에서 처리할 수 있습니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 회원 가입 / 로그인 | JWT 기반 인증, 사용자별 데이터 격리 |
| 부가세 계산기 | 매출·매입액 입력 → 납부 세액 즉시 계산 및 내역 저장 |
| 발주 메모 | 상품명·수량·알림 일시를 등록하고 CRUD 관리 |
| AI 매출 분석 | 매출 데이터를 입력하면 OpenAI GPT가 경영 조언 생성 |

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19, React Router 7, Vite, Tailwind CSS 3 |
| Backend | FastAPI (Python 3.11), SQLAlchemy, JWT (python-jose) |
| DB | MySQL 8.0 |
| AI | OpenAI GPT-3.5-turbo |
| 인프라 | Docker, Docker Compose |

## 프로젝트 구조

```
sojang-ai/
├── frontend/               # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/          # DashboardPage, VatCalculatorPage, OrderMemoPage, AiAnalyzePage
│       ├── context/        # AuthContext (JWT 관리)
│       └── services/       # api.js (Axios 래퍼)
├── backend/                # FastAPI
│   ├── routers/            # auth, tax, orders, ai
│   ├── models.py           # SQLAlchemy 모델
│   └── schemas.py          # Pydantic 스키마
└── docker-compose.yml
```

## 시작하기

### 사전 준비

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치

### 1. 환경 변수 설정

```bash
# 루트 디렉터리 — MySQL 접속 정보
cp .env.example .env

# 백엔드 — DB URL, JWT 시크릿, OpenAI API 키
cp backend/.env.example backend/.env

# 프론트엔드 — API 주소
cp frontend/.env.example frontend/.env
```

`backend/.env`를 열고 다음 값을 실제 값으로 교체하세요.

```env
SECRET_KEY=랜덤한-긴-문자열-입력          # 예: openssl rand -hex 32
OPENAI_API_KEY=sk-...                     # OpenAI 대시보드에서 발급
```

> AI 분석 기능 없이 사용하려면 `OPENAI_API_KEY`를 비워 두어도 됩니다.

### 2. Docker로 전체 실행

```bash
docker compose up --build
```

| 서비스 | 주소 |
|--------|------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API 문서 (Swagger) | http://localhost:8000/docs |
| MySQL | localhost:3306 |

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
| `MYSQL_ROOT_PASSWORD` | MySQL root 비밀번호 | `rootpassword` |
| `MYSQL_PASSWORD` | 앱 DB 사용자 비밀번호 | `sojang_password` |

### `backend/.env`

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | SQLAlchemy DB 접속 URL | `mysql+pymysql://...` |
| `ALLOWED_ORIGINS` | CORS 허용 출처 (콤마 구분) | `http://localhost:5173` |
| `SECRET_KEY` | JWT 서명 키 | *(긴 랜덤 문자열)* |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |

### `frontend/.env`

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `http://localhost:8000` |

## API 문서

백엔드 실행 후 http://localhost:8000/docs 에서 Swagger UI로 전체 엔드포인트를 확인할 수 있습니다.
