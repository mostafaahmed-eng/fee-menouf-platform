# FEE-MENOUF Smart University Platform — Architecture

## Overview

The FEE-MENOUF Smart University Platform is a comprehensive digital transformation solution for the Faculty of Electronic Engineering, Menoufia University. It adopts a **microservices architecture** with clear separation of concerns across backend (NestJS), frontend (Next.js), AI Engine (FastAPI), and supporting infrastructure (PostgreSQL, Redis, MinIO, Nginx).

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Nginx Reverse Proxy                        │
│                     (SSL, Rate Limiting, Routing)                    │
├────────────┬──────────────────────────┬─────────────────────────────┤
│            │                          │                             │
│  ┌─────────▼──────┐    ┌─────────────▼──────┐    ┌────────────────▼┐│
│  │   Frontend     │    │   Backend (NestJS)  │    │   AI Engine     ││
│  │   Next.js 15   │    │   REST API + WS     │    │   FastAPI       ││
│  │   React 18     │    │   TypeORM + Bull    │    │   LangChain     ││
│  │   TailwindCSS  │    │   JWT + RBAC        │    │   RAG + Chroma  ││
│  └────────┬────────┘    └─────────┬──────────┘    └────────┬────────┘│
│           │                      │                         │        │
│           └──────────────────────┼─────────────────────────┘        │
│                                  │                                   │
│                     ┌────────────▼────────────┐                      │
│                     │      PostgreSQL         │                      │
│                     │   (Primary Database)    │                      │
│                     └────────────┬────────────┘                      │
│                                  │                                   │
│                     ┌────────────▼────────────┐                      │
│                     │         Redis           │                      │
│                     │  (Cache + Queues + WS)  │                      │
│                     └────────────┬────────────┘                      │
│                                  │                                   │
│                     ┌────────────▼────────────┐                      │
│                     │         MinIO           │                      │
│                     │   (S3 Object Storage)   │                      │
│                     └─────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Microservices Architecture

### 1. Backend API (NestJS)
- **Port:** 4000
- **Language:** TypeScript (Node.js 20+)
- **Framework:** NestJS 10 with modular architecture
- **Modules:** Auth, Users, Courses, Students, Departments, Attendance, Exams, Grades, Schedule, AI, Notifications, Materials, Analytics, Files, Search, Reports, QR, RBAC
- **Database:** TypeORM with PostgreSQL
- **Queue:** Bull with Redis for async job processing
- **WebSocket:** Real-time notifications via NestJS Gateway
- **Documentation:** Swagger/OpenAPI at `/api/docs`

### 2. Frontend (Next.js)
- **Port:** 3000
- **Language:** TypeScript (React 18)
- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS 3 with Radix UI primitives
- **State:** Zustand + TanStack React Query
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **i18n:** next-intl for Arabic/English support
- **Drag & Drop:** @hello-pangea/dnd

### 3. AI Engine (FastAPI)
- **Port:** 8000
- **Language:** Python 3.12+
- **Framework:** FastAPI
- **RAG:** LangChain + ChromaDB for retrieval-augmented generation
- **Embeddings:** OpenAI text-embedding-3-small + Sentence Transformers
- **Scheduling:** Constraint satisfaction (python-constraint) for lecture/exam scheduling
- **Risk Prediction:** scikit-learn models with SHAP explanations
- **Task Queue:** Celery with Redis broker

### 4. Infrastructure
- **PostgreSQL 16:** Primary database with pgvector for embeddings
- **Redis 7:** Caching, Bull queues, WebSocket pub/sub, session store
- **MinIO:** S3-compatible object storage for file uploads
- **Nginx:** Reverse proxy, SSL termination, rate limiting, static file serving

## Data Flow

### Authentication Flow
```
Client → POST /api/v1/auth/login → Backend validates credentials
  → Returns JWT (access + refresh tokens)
  → Client stores tokens (httpOnly cookie / memory)
  → Subsequent requests: Authorization: Bearer <access_token>
  → Backend JwtAuthGuard validates → RBAC guard checks permissions
```

### AI Assistant Flow
```
User Message → POST /api/v1/ai/chat → Backend AI Module
  → Forwards to AI Engine POST /api/v1/ai/chat
  → AI Engine performs:
    1. Query analysis & intent classification
    2. RAG retrieval from ChromaDB (course materials, policies)
    3. Context assembly with conversation history
    4. LLM inference (OpenAI GPT-4o)
    5. Response post-processing
  → Returns response to backend → Returns to frontend
  → Conversation persisted to PostgreSQL
```

### Attendance Flow (QR-based)
```
Doctor generates QR code for lecture → Students scan QR via mobile
  → POST /api/v1/attendance/scan → Backend validates:
    - Lecture exists & is active
    - Student is enrolled in course
    - Within allowed time window
  → Records attendance → Updates student attendance record
  → Triggers notification if attendance < threshold
```

### Schedule Generation Flow
```
Admin triggers schedule generation → POST /api/v1/scheduling/generate
  → AI Engine receives request → CSP solver:
    1. Loads constraints (rooms, time slots, professors, student groups)
    2. Hard constraints: no overlaps, room capacity, professor availability
    3. Soft constraints: preferred times, consecutive lectures
    4. Genetic algorithm optimization
  → Returns optimized schedule → Backend persists to DB
  → Notifications sent to affected users
```

## Technology Stack Rationale

| Component          | Technology        | Rationale                                                   |
|--------------------|-------------------|-------------------------------------------------------------|
| Backend Framework  | NestJS            | Modular architecture, TypeScript, decorators, DI container  |
| Frontend           | Next.js + React   | SSR, SEO, App Router, large ecosystem                       |
| AI Engine          | FastAPI           | Async Python, Pydantic validation, native async support     |
| Database           | PostgreSQL + pgvector | ACID compliance, vector search for embeddings           |
| Cache/Queue        | Redis + Bull      | In-memory performance, durable job queues, pub/sub          |
| Object Storage     | MinIO             | S3-compatible, self-hosted, no vendor lock-in               |
| Reverse Proxy      | Nginx             | High performance, SSL termination, rate limiting            |
| ORM                | TypeORM           | Active Record + Data Mapper, migrations, decorators         |
| AI Framework       | LangChain         | Modular LLM integration, RAG pipelines, tool use            |
| Monitoring         | Prometheus + Grafana | Industry standard, rich visualization, alerting          |

## Security Architecture

```
┌──────────────┐   HTTPS    ┌──────────┐   Internal    ┌──────────┐
│   Client     │ ──────────► │  Nginx   │ ──────────────►│ Services │
│ (Browser/App)│ ◄────────── │ (SSL +   │ ◄──────────────│ (Docker  │
└──────────────┘   TLS 1.3  │  Rate    │   Network      │ Network) │
                             │  Limit)  │                └──────────┘
                             └──────────┘
                                  │
                                  │ WAF Rules
                                  ▼
                         ┌────────────────┐
                         │  Backend API   │
                         │  ┌──────────┐  │
                         │  │ JWT Auth │  │
                         │  │  Guard   │  │
                         │  ├──────────┤  │
                         │  │ RBAC     │  │
                         │  │ Guard    │  │
                         │  ├──────────┤  │
                         │  │ Throttle │  │
                         │  │ Guard    │  │
                         │  ├──────────┤  │
                         │  │ Helmet   │  │
                         │  └──────────┘  │
                         └────────────────┘
```

## AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Engine (FastAPI)                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Chat API   │   RAG        │  Scheduler   │  Analytics     │
│              │   System     │  System      │  System        │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ • Message    │ • Document   │ • Lecture    │ • Risk         │
│   Processing │   Processor  │   Scheduler  │   Prediction   │
│ • Context    │ • Embeddings │ • Exam       │ • Performance  │
│   Management │ • Vector     │   Scheduler  │   Analytics    │
│ • Prompt     │   Store      │ • Constraint │ • Dropout      │
│   Pipeline   │   (ChromaDB) │   Solver     │   Prediction   │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
┌───────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐
│  OpenAI   │ │  Vector DB │ │ Constraint │ │  ML Models   │
│  GPT-4o   │ │ (ChromaDB) │ │  Solver    │ │ (scikit-learn)│
└───────────┘ └────────────┘ └────────────┘ └──────────────┘
```

## Database Architecture

The system uses PostgreSQL 16 with the following schema approach:
- **Schema:** `app` (application tables), `audit` (audit logs)
- **Extensions:** `uuid-ossp`, `pgcrypto`, `pgvector`
- **Key entities:** Users, Students, Doctors, Courses, Departments, Exams, Grades, Attendance, AI Conversations, Notifications
- **Full ERD:** See [DATABASE.md](./DATABASE.md)

## API Design Principles

- **RESTful** with consistent resource naming: `/{module}/{resource}/{id}`
- **Versioned** via URL prefix: `/api/v1/`
- **Standard responses:** `{ data, meta, message }` wrapper
- **Error format:** `{ statusCode, message, error, timestamp, path }`
- **Pagination:** `{ page, limit, total, data[] }`
- **JWT authentication** via `Authorization: Bearer <token>`
- **Rate limiting** per endpoint group (auth: 5/min, API: 100/min, AI: 10/min)
- **Idempotency** for critical operations (idempotency-key header)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Production Server (VPS/Bare Metal)         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Nginx    │ │ Backend  │ │ Frontend │ │  AI Engine   │   │
│  │ :80/443  │ │ :4000    │ │ :3000    │ │  :8000       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │PostgreSQL│ │  Redis   │ │  MinIO   │ │  Prometheus  │   │
│  │ :5432    │ │ :6379    │ │ :9000    │ │  :9090       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

All services run as Docker containers orchestrated via Docker Compose. Nginx serves as the single entry point, routing traffic based on path prefixes.
