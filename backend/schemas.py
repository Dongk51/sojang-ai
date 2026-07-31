from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SavingsGoalCreate(BaseModel):
    title: str
    target_amount: float
    target_date: datetime


class SavingsGoalUpdate(BaseModel):
    title: str | None = None
    target_amount: float | None = None
    target_date: datetime | None = None


class SavingsGoalDeposit(BaseModel):
    amount: float


class SavingsGoalResponse(BaseModel):
    id: int
    title: str
    target_amount: float
    target_date: datetime
    current_amount: float
    created_at: datetime
    progress_rate: float
    required_monthly_saving: float

    model_config = {"from_attributes": True}


class AssetFormulaRequest(BaseModel):
    monthly_income: float
    monthly_expense: float | None = None


class AssetFormulaResponse(BaseModel):
    recommended_saving: float
    recommended_fixed_expense: float
    recommended_free_spending: float
    emergency_fund_target: float
    message: str
