# Aphasia Improve Test – Web Application (AIT-W)

Full-stack, bilingual (EN/JA) rehab platform – FastAPI + PostgreSQL + Next.js/TypeScript + MUI.

# SYSTEM ARCHITECTURE OVERVIEW

## 1 Front-End (Next.js 15 + MUI)

src/
├─ app/                      ← Next “app router” pages
│   ├─ (public routes)       ← login, register, landing, about
│   ├─ admin/…               ← admin dashboard, assignment CRUD, user CRUD
│   ├─ doctor/…              ← doctor dashboard, patient inspect, reviews
│   └─ patient/…             ← topic list, practice flow, history
├─ components/               ← reusable UI pieces
│   ├─ assignment-edit/      (MCQEditor, WritingEditor)
│   ├─ assignment-preview/   (MCQPreview, WritingPreview)
│   ├─ assignment-try/       (MCQTry,  WritingTry)
│   ├─ Navbar.tsx, ImageUploader.tsx, Providers.tsx …
├─ context/                  ← React contexts
│   ├─ AuthContext.tsx
│   ├─ LanguageContext.tsx   (EN/JA)
│   └─ ThemeContext.tsx      (light / dark)
├─ locales/                  ← en.json / ja.json
├─ utils/                    ← api.ts (Axios) / getImageUrl.ts
└─ theme.ts                  ← MUI theme defaults

### Build & Tooling
    ESLint (Next preset) + @typescript-eslint, strict mode
    Framer-motion for landing animations
    Dockerfile: multi-stage (install → production next start)
    Back-End (FastAPI + SQLAlchemy 2 async)

## 2 Back-End (FastAPI + SQLAlchemy 2 async)

app/
├─ main.py                   ← FastAPI instance, startup tables
├─ core/
│   ├─ config.py             ← Pydantic-BaseSettings (env vars)
│   └─ security.py           ← JWT helpers, role dependency
├─ database.py               ← async engine, session, dev-migrations
├─ models/                   ← ORM definitions
│   ├─ assignment.py
│   ├─ assignment_details.py (mcq_items, writing_items …)
│   ├─ assignment_record.py  (record, mcq_answer, writing_answer)
│   ├─ assignment_patient.py
│   └─ user.py
├─ schemas/                  ← Pydantic DTOs (v1 & v2)
├─ api/                      ← routers
│   ├─ admin.py (users, assignments)
│   ├─ doctor.py
│   ├─ patient.py
│   └─ auth.py (optional)
└─ utils/                    ← images (Pillow&WebP), hashing, etc.

### Important Python Packaces
    fastapi             Responsive REST framework
    uvicorn             ASGI server
    sqlalchemy>=2       Async ORM + typed rows
    asyncpg             Native PostgreSQL driver
    passlib[bcrypt]     Password hashing
    python-jose         JWT encode/decode
    pydantic            Settings & request models
    Pillow              Image validation/convert to WebP
    tenacity            (optional) async retry helper

## 3 Database (PostgreSQL 14+)
### Logical schema (all FK ON DELETE CASCADE):

users (admin/doctor/patient)
│
├─< doctor_patient_bindings  (audit log)
│
└─< assignment_patient >─ assignments
                         │
assignment_items_base ─1:1─ mcq_items | writing_items | drag_items | writing_items
                         │
assignment_record (multi attempt)
     ├─< mcq_answer
     └─< writing_answer  (record_id,item_id unique)

Highlights
    Typed-table design: one generic row per question, specialised tables keep extra fields.
    Multiple attempts allowed (no unique constraint on assignment_record).
    writing_answer.item_id points to base-row FK; manual reviews stored here.
    Trigger touch_updated_at() keeps users.updated_at current.
    Dev-migration code auto-adds new columns/FKs when running in Docker.
Runtime topology

┌──────────────┐   HTTP/JSON   ┌─────────────┐   TCP/5432    ┌──────────────┐
│ Next.js App  │◀────────────▶│  FastAPI    │◀────────────▶│ PostgreSQL15 │
│  (3000)      │   (Bearer)    │  (8000)     │               │   (db)       │
└──────────────┘               └─────────────┘               └──────────────┘

---
## 1  Front-end  `/frontend`

* Next.js 15 (App Router) • TypeScript • MUI v5
* Global providers: Auth, Language (i18n), ThemeMode (light/dark toggle)
* Docker image → multi-stage `node:20-alpine`

Key UI features
* Dark-mode aware hero / footer, one-click toggle in navbar.
* Complete bilingual coverage (≈150 locale keys).
* Role dashboards
  * **Admin** – create/manage typed-schema assignments, user table.
  * **Doctor** – assign dialog (filters already-assigned), review centre, patient stats.
  * **Patient** – progress table, incremental autosave, history with review chips.
* Landing + new **About us** page with project credits & logos.

Reusable components for MCQ/Writing editor/preview/try. Image upload converts to WebP.

Lint/CI passes (strict TS + ESLint).

---
## 2  Back-end  `/backend`

* FastAPI 0.111 • SQLAlchemy 2 (async) • asyncpg
* JWT auth with `require_role()` dependency.
* Typed-table assignment schema (v2) → `assignment_items_base` + child tables.
* Routes
  * Admin CRUD `/assignments`, image upload.
  * Doctor `/patients` bind/assign, `/doctor/reviews` mark answers.
  * Patient start/submit/finish, history/detail.
* Dev migrations in `database.py` (adds cols, fixes FKs, drops unique constraint).
* Docker compose: Postgres 15-alpine with health-check; backend waits for healthy DB.

---
## 3  Database schema (PostgreSQL 14+)

```
                      users─┬─< doctor_patient_bindings (audit)
                            │
                            └─< assignment_patient >─ assignments
                                           │
    assignment_items_base ─1:1─ mcq_items  | writing_items | drag_items
                                           │
assignment_record (attempts) ─< mcq_answer | writing_answer
```

* Multiple attempts allowed (`assignment_record` no unique constraint).
* `writing_answer.item_id` FK points to base table with `ON DELETE CASCADE`.
* Trigger `touch_updated_at()` keeps `users.updated_at` current.

---
### Running locally

```bash
# prerequisites: Docker & Docker Compose
cp .env.example .env  # set JWT secret etc.
docker compose up --build
# Front-end: http://localhost:3000
# Back-end : http://localhost:8000/docs
```

---
### Credits
* **Developer**  Wachirawut Suttitanon – Robotics & AI Engineering, KMITL
* **Supervisor** Dr. Mio Sakuma – Department of General Engineering, NIT Sendai College

Joint project (Summer 2025) aiming to modernise aphasia rehabilitation through accessible web technology.
