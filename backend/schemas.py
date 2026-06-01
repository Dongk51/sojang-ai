from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    business_type: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v

    @field_validator("business_type")
    @classmethod
    def business_type_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("업종명을 입력해 주세요.")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    business_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VatCalculationRequest(BaseModel):
    revenue: float
    purchase: float


class VatCalculationResponse(BaseModel):
    id: int
    revenue: float
    purchase: float
    vat_amount: float
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderMemoCreate(BaseModel):
    title: str
    content: str
    alert_datetime: datetime


class OrderMemoUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    alert_datetime: datetime | None = None
    is_alerted: bool | None = None


class OrderMemoResponse(BaseModel):
    id: int
    title: str
    content: str
    alert_datetime: datetime
    is_alerted: bool
    created_at: datetime

    model_config = {"from_attributes": True}
