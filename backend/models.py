from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class RoleEnum(str, enum.Enum):
    pharmacy = "pharmacy"
    dealer = "dealer"


class OrderStatusEnum(str, enum.Enum):
    created = "created"
    accepted = "accepted"
    packed = "packed"
    dispatched = "dispatched"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"


class OrderTypeEnum(str, enum.Enum):
    procurement = "procurement"
    exchange = "exchange"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    expiry_date = Column(Date, nullable=True)
    is_dealer_stock = Column(Boolean, default=False)

    owner = relationship("User")
    medicine = relationship("Medicine")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.created)
    order_type = Column(Enum(OrderTypeEnum), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    medicine = relationship("Medicine")


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(Enum(OrderStatusEnum), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order")


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    chosen_dealer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    criteria_breakdown = Column(Text, nullable=True)  # store JSON as text
    created_at = Column(DateTime(timezone=True), server_default=func.now())