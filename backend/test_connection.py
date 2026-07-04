from database import engine, Base
import models

try:
    Base.metadata.create_all(bind=engine)
    print("✅ SUCCESS: Connected to database and created all tables!")
except Exception as e:
    print("❌ FAILED:", e)