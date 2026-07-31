from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import engine, Base
from routers import auth, goals, formula

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="사회초년생 자산관리 API",
    description="사회 초년생을 위한 자산형성 공식·목적자금 관리 백엔드",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(goals.router)
app.include_router(formula.router)


@app.get("/")
def root():
    return {"message": "사회초년생 자산관리 API가 실행 중입니다."}


@app.get("/health")
def health_check():
    return {"status": "ok"}
