from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from models import RoleEnum, OrderStatusEnum, OrderTypeEnum
from models import ExchangeRequestStatusEnum

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
        
class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

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
    ahp_score: Optional[float] = None
    ml_probability: Optional[float] = None
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
    seller_name: Optional[str] = None
    buyer_name: Optional[str] = None
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
    reserved_quantity: int = 0
    available_quantity: int = 0
    pending_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0
    expiry_date: date

    class Config:
        from_attributes = True
        
class ExchangeRequestCreate(BaseModel):
    listing_id: int
    quantity: int


class ExchangeRequestOut(BaseModel):
    id: int
    listing_id: int
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    medicine: MedicineOut
    quantity: int
    price: float
    status: ExchangeRequestStatusEnum
    linked_order_id: Optional[int] = None
    requested_at: datetime
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True