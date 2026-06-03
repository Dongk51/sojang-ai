from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class VatCalculation(Base):
    __tablename__ = "vat_calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    revenue = Column(Float, nullable=False)
    purchase = Column(Float, nullable=False)
    vat_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class OrderMemo(Base):
    __tablename__ = "order_memos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    alert_datetime = Column(DateTime, nullable=False)
    is_alerted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class SalaryCalculation(Base):
    __tablename__ = "salary_calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    hourly_wage = Column(Float, nullable=False)
    daily_hours = Column(Float, nullable=False)
    work_days = Column(Integer, nullable=False)
    overtime_hours = Column(Float, nullable=False)
    night_hours = Column(Float, nullable=False)
    holiday_hours = Column(Float, nullable=False)
    base_salary = Column(Float, nullable=False)
    weekly_holiday_pay = Column(Float, nullable=False)
    overtime_pay = Column(Float, nullable=False)
    night_pay = Column(Float, nullable=False)
    holiday_pay = Column(Float, nullable=False)
    total_salary = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
