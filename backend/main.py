from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import engine, Base
from routers import auth, tax, orders, ai, salary

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="소장 AI API",
    description="소상공인 AI 업무 도우미 백엔드",
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
app.include_router(tax.router)
app.include_router(orders.router)
app.include_router(ai.router)
app.include_router(salary.router)


@app.get("/")
def root():
    return {"message": "소장 AI API가 실행 중입니다."}


@app.get("/health")
def health_check():
    return {"status": "ok"}
