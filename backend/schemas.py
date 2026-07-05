from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from models import RoleEnum, OrderStatusEnum, OrderTypeEnum


# ---------- AUTH ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum
    phone: Optional[str] = None
    address: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: RoleEnum
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- MEDICINE ----------

class MedicineOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- INVENTORY ----------

class InventoryCreate(BaseModel):
    medicine_name: str          # we'll look up or create the medicine by name
    category: Optional[str] = None
    price: float
    stock: int
    expiry_date: Optional[date] = None
    is_dealer_stock: bool = False


class InventoryOut(BaseModel):
    id: int
    owner_id: int
    medicine: MedicineOut
    price: float
    stock: int
    expiry_date: Optional[date] = None
    is_dealer_stock: bool

    class Config:
        from_attributes = True


# ---------- PROCUREMENT / RECOMMENDATION ----------

class SupplierOption(BaseModel):
    dealer_id: int
    dealer_name: str
    inventory_id: int
    price: float
    stock: int
    rating: float          # placeholder metric for now
    delivery_days: int     # placeholder metric for now


class RecommendationResult(BaseModel):
    dealer_id: int
    dealer_name: str
    dealer_phone: Optional[str] = None
    dealer_address: Optional[str] = None
    inventory_id: int
    medicine_id: int
    price: float
    score: float
    reasons: List[str]

# ---------- ORDERS ----------

class OrderItemCreate(BaseModel):
    medicine_id: int
    quantity: int
    price: float


class OrderCreate(BaseModel):
    seller_id: int
    order_type: OrderTypeEnum
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    id: int
    medicine: MedicineOut
    quantity: int
    price: float

    class Config:
        from_attributes = True


class TrackingEventOut(BaseModel):
    status: OrderStatusEnum
    timestamp: datetime

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    status: OrderStatusEnum
    order_type: OrderTypeEnum
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum


# ---------- EXCHANGE ----------

class ExchangeListingOut(BaseModel):
    id: int
    owner_id: int
    owner_name: str
    owner_phone: Optional[str] = None
    owner_address: Optional[str] = None
    medicine: MedicineOut
    price: float
    stock: int
    expiry_date: date

    class Config:
        from_attributes = True