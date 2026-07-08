# MedFlow



**A B2B platform for pharmacy procurement and near-expiry inventory exchange**



MedFlow is a two-sided marketplace that connects independent pharmacies with pharmaceutical dealers for medicine procurement, and connects pharmacies with each other to redistribute near-expiry stock before it goes to waste. It replaces the phone-call-and-WhatsApp procurement workflow common in independent pharmacies with a structured, trackable, and explainable digital platform.





**The Problem**



Independent pharmacies procure medicine through informal channels — phone calls, WhatsApp, and spreadsheets. This makes it hard to compare distributors, track deliveries, or know \*why\* one supplier is better than another. At the same time, pharmacies routinely write off medicine approaching its expiry date, even when a nearby pharmacy might be actively short on that exact medicine.



MedFlow addresses both problems in one platform: a structured procurement marketplace with explainable AI-assisted supplier recommendations, and a pharmacy-to-pharmacy near-expiry exchange.





**Key Differentiators**



**1. Explainable Supplier Recommendation Engine (AHP + ML)**



Rather than simply sorting dealers by price, MedFlow uses the \*\*Analytic Hierarchy Process (AHP)\*\* — a structured multi-criteria decision-making method — to derive weighted importance across four criteria: price, delivery time, dealer rating, and stock availability. The weights come from a pairwise comparison matrix (Saaty's scale), not arbitrary guesses, and every recommendation includes a \*\*consistency ratio\*\* to confirm the comparisons are logically sound.



On top of this explainable baseline, a \*\*logistic regression model\*\* (trained on synthetic historical fulfillment data) predicts the probability that a given dealer fulfills an order on time. The final score blends both signals — 70% AHP, 30% ML — so the recommendation stays interpretable while still benefiting from a data-driven layer. If the ML model isn't available (cold start), the system falls back cleanly to pure AHP scoring, matching the two-phase design laid out from the start of the project.



Every recommendation shows plain-language reasons ("Lowest Price," "Fastest Delivery," "High Predicted Fulfillment Reliability") rather than a black-box number.



**2. Near-Expiry Inventory Exchange**



Pharmacy stock within 90 days of expiry is automatically surfaced to other pharmacies on the platform — no manual listing step required. A structured request/response flow (Pending → Accepted / Rejected / Cancelled → Completed) governs the negotiation, with full timestamped history. Once accepted, the exchange flows into the same order-tracking pipeline used for regular procurement, so a pharmacy sees one consistent tracking experience regardless of whether they're buying from a dealer or another pharmacy.



Reserved quantity is tracked live against total stock, so a listing's availability updates in real time as requests come in — no manual refresh, no stale numbers, no overselling.



**3.** **Order Lifecycle State Machine**



Every order — procurement or exchange — moves through an explicit state machine (`created → accepted → packed → dispatched → out\_for\_delivery → delivered`, with a `cancelled` branch), enforced server-side. Illegal transitions are rejected outright, not silently accepted. Every status change generates an immutable, timestamped `TrackingEvent`, giving both sides of a transaction a complete audit trail.





**Architecture**



```

React (Vite)

&#x20;     │

&#x20;     │ REST API (JWT Bearer auth)

&#x20;     ▼

FastAPI

&#x20;     │

&#x20; ┌───┴────────────────────────────────┐

&#x20; │  Auth Service                      │

&#x20; │  Inventory Service                 │

&#x20; │  Procurement Service (AHP + ML)    │

&#x20; │  Order Service (state machine)     │

&#x20; │  Exchange Service (requests)       │

&#x20; └───┬────────────────────────────────┘

&#x20;     │

&#x20;     ▼

PostgreSQL (Neon)

```



**Pattern:** Route → Pydantic schema validation → SQLAlchemy ORM → PostgreSQL. Role-based access control (pharmacy / dealer) is enforced at the dependency level on every protected endpoint.





**Tech Stack**



**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL (Neon), JWT auth (python-jose), bcrypt password hashing, Pydantic validation, scikit-learn (logistic regression), NumPy (AHP matrix computation)



**Frontend:** React (Vite), React Router, Axios



**Infrastructure:** Neon (managed Postgres), environment-based config for deployment portability





**Core Features**



**Modules and Description**



1. **Authentication** - JWT-based auth with role-based access control (pharmacy / dealer), profile management,

password change 

**2.** **Inventory Management** - Separate dealer and pharmacy inventories with medicine deduplication (case-insensitive      matching) 

**3.** **Procurement \& Recommendations** - Medicine search with autocomplete, AHP + ML-ranked dealer recommendations with visible stock and reasoning 

**4.** **Order Management** - Full order lifecycle with state machine enforcement, cancellation with stock restoration,   buyer/seller-linked views

**5.** **Order Tracking** - Immutable, timestamped tracking history rendered as a visual timeline 

**6.** **Near-Expiry Exchange** - Automatic listing of near-expiry stock, structured request/accept/reject/cancel flow, live reserved/available quantity tracking

**7. Settings** - Profile editing, password change





**Local Setup**



**Backend**



```bash

cd backend

python -m venv venv

venv\\Scripts\\activate       # Windows

pip install -r requirements.txt

```



Create a `.env` file in `backend/`:

```

DATABASE\_URL=postgresql://<your-neon-connection-string>

JWT\_SECRET=<your-secret-key>

FRONTEND\_ORIGINS=http://localhost:5173

```



```bash

uvicorn main:app --reload

```



API docs available at `http://127.0.0.1:8000/docs`.



**Frontend**



```bash

cd frontend

npm install

```



Create a `.env` file in `frontend/`:

```

VITE\_API\_URL=http://127.0.0.1:8000

```



```bash

npm run dev

```



App available at `http://localhost:5173`.



**ML Model** (optional — falls back to pure AHP if skipped)



```bash

cd backend

python ml/generate\_data.py

python ml/train\_model.py

```





**Known Limitations \& Future Work**



This project was scoped deliberately for a focused build timeline, prioritizing depth on its two differentiating features over full production-grade breadth. Honest gaps, in order of what a production version would need next:



\- **No refresh tokens / email verification / password reset** — JWTs are long-lived (24h); production auth would add token rotation and the standard account-recovery flows.

\- **No schema migration tool (Alembic)** — schema changes during development were applied via manual `ALTER TABLE` scripts rather than tracked migrations.

\- **No background job processing** — near-expiry detection runs as a live query filter on page load rather than a scheduled job; there's no notification system for low stock or upcoming expiry.

\- **Simplified inventory model** — no batch numbers, manufacturer tracking, GST/HSN fields, or purchase-vs-selling price distinction. Real pharmacy inventory systems track medicine at the batch level; this MVP tracks it at the SKU level.

\- **ML model trained on synthetic data** — the fulfillment-prediction model is trained on a generated dataset with realistic but artificial dealer performance patterns, since no real historical order data exists yet. It demonstrates the intended architecture (AHP-first, ML-refined, graceful fallback) rather than production-grade accuracy.

\- **No admin role or multi-tenant organization structure** — the platform currently has two flat roles (pharmacy, dealer) rather than organization-level accounts with multiple staff members.





**Project Structure**



```

medflow/

├── backend/

│   ├── main.py

│   ├── database.py

│   ├── models.py

│   ├── schemas.py

│   ├── auth.py

│   ├── ml/

│   │   ├── generate\_data.py

│   │   └── train\_model.py

│   ├── routers/

│   │   ├── auth.py

│   │   ├── inventory.py

│   │   ├── procurement.py

│   │   ├── orders.py

│   │   └── exchange.py

│   └── services/

│       └── ahp.py

└── frontend/

&#x20;   └── src/

&#x20;       ├── api.js

&#x20;       ├── context/AuthContext.jsx

&#x20;       ├── components/

&#x20;       │   ├── Layout.jsx

&#x20;       │   ├── InventoryTable.jsx

&#x20;       │   ├── RecommendationCard.jsx

&#x20;       │   ├── OrderTimeline.jsx

&#x20;       │   └── RequestTimeline.jsx

&#x20;       └── pages/

&#x20;           ├── Login.jsx / Register.jsx

&#x20;           ├── PharmacyDashboard.jsx

&#x20;           ├── DealerDashboard.jsx

&#x20;           ├── Exchange.jsx

&#x20;           └── Settings.jsx

```

