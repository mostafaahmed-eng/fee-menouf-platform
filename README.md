# FEE-MENOUF Smart University Platform

[![CI/CD](https://github.com/fee-menouf/fee-menouf-platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/fee-menouf/fee-menouf-platform/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-24.0%2B-2496ED?logo=docker)](https://docker.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A comprehensive digital transformation platform for the **Faculty of Electronic Engineering, Menoufia University (FEE-MENOUF)**. Built with NestJS, Next.js, and FastAPI to provide an integrated ecosystem for academic management, AI-powered assistance, and administrative operations.

> **Live Demo:** https://fee-menouf.local  
> **API Documentation:** https://api.fee-menouf.local/docs  
> **Admin Panel:** https://admin.fee-menouf.local

---

## Screenshots

<!-- TODO: Add screenshots -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Schedule](docs/screenshots/schedule.png) -->
<!-- ![AI Chat](docs/screenshots/ai-chat.png) -->

## Features

### 🎓 Academic Management
- Student lifecycle management (admission to graduation)
- Course catalog with prerequisites and registration
- Grade management with GPA/CGPA calculation
- Transcript generation (PDF)
- Academic warnings and risk tracking

### 📅 Scheduling & Timetables
- AI-powered lecture schedule generation (constraint satisfaction)
- Exam scheduling with room and invigilator assignment
- Real-time schedule views for students and faculty
- Conflict detection and resolution

### 📋 Attendance Tracking
- QR code-based lecture attendance
- Manual attendance recording
- Real-time attendance analytics
- Automated absence notifications
- Integration with academic warning system

### 🤖 AI Assistant
- Contextual Q&A about courses, schedules, grades, and policies
- RAG-based knowledge retrieval from university documents
- Bilingual support (Arabic / English)
- Conversation history and session management
- Document ingestion for custom knowledge base

### 🔔 Notifications
- Real-time WebSocket push notifications
- Email notifications (SMTP)
- In-app notification center
- Configurable notification preferences
- Announcement broadcasting

### 📁 File Management
- MinIO S3-compatible object storage
- Course material repository (slides, assignments, references)
- Drag-and-drop upload interface
- Version tracking for materials
- Permission-based access control

### 👥 Role-Based Access Control
- Multi-tier role hierarchy (Super Admin to Student)
- Granular permission system
- Department and faculty-level access scoping
- Audit logging for all sensitive operations

### 📊 Analytics & Reports
- Student performance analytics
- Attendance dashboards
- Grade distribution reports
- Dropout risk prediction
- Export to Excel/CSV/PDF

## Tech Stack

| Layer        | Technology                                    | Purpose                    |
|--------------|-----------------------------------------------|----------------------------|
| **Backend**  | NestJS 10, TypeScript, TypeORM                | REST API + WebSocket       |
| **Frontend** | Next.js 15, React 18, TailwindCSS 3           | Web application            |
| **AI**       | FastAPI, LangChain, ChromaDB, scikit-learn    | AI features                |
| **Database** | PostgreSQL 16 (pgvector)                      | Primary data store         |
| **Cache**    | Redis 7                                       | Caching, queues, sessions  |
| **Storage**  | MinIO (S3-compatible)                         | File storage               |
| **Proxy**    | Nginx                                         | Reverse proxy, SSL, rate limiting |
| **Monitor**  | Prometheus + Grafana                          | Metrics and observability  |
| **Queue**    | Bull + Redis                                  | Async job processing       |

## Quick Start

### Prerequisites
- Node.js 20+, Docker 24+, Python 3.12+, Git

### 1-Minute Setup

```bash
git clone https://github.com/fee-menouf/fee-menouf-platform.git
cd fee-menouf-platform
cp .env.example .env
bash scripts/setup.sh
```

Then access:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api/v1
- **Swagger Docs:** http://localhost:4000/api/docs
- **AI Engine:** http://localhost:8000
- **MinIO Console:** http://localhost:9001

### First Login

| Role        | Email                       | Password |
|-------------|-----------------------------|----------|
| Super Admin | admin@fee-menouf.edu.eg     | admin123 |

> **IMPORTANT:** Change the default password immediately after first login.

## Project Structure

```
fee-menouf-platform/
├── backend/                  # NestJS Backend API
│   ├── src/
│   │   ├── auth/             # Authentication & JWT
│   │   ├── users/            # User management
│   │   ├── courses/          # Course catalog
│   │   ├── departments/      # Department management
│   │   ├── students/         # Student records
│   │   ├── attendance/       # QR attendance tracking
│   │   ├── exams/            # Exam management
│   │   ├── grades/           # Grade management
│   │   ├── schedule/         # Schedule display
│   │   ├── scheduling/       # AI schedule generation
│   │   ├── notifications/    # Push & email notifications
│   │   ├── materials/        # Course materials
│   │   ├── ai/               # AI chat bridge
│   │   ├── analytics/        # Dashboards & reports
│   │   ├── files/            # File upload management
│   │   ├── search/           # Full-text search
│   │   ├── reports/          # Report generation
│   │   ├── qr/               # QR code generation
│   │   ├── rbac/             # Role-based access control
│   │   ├── common/           # Shared decorators & guards
│   │   ├── config/           # Configuration modules
│   │   └── database/         # Entities & migrations
│   └── test/                 # E2E tests
├── frontend/                 # Next.js Frontend
│   └── src/
│       ├── app/              # App Router pages
│       ├── components/       # UI components
│       ├── hooks/            # Custom React hooks
│       └── lib/              # Utilities & API client
├── ai-engine/                # FastAPI AI Engine
│   └── app/
│       ├── api/              # API routes
│       ├── chat/             # Chat processing
│       ├── rag/              # RAG pipeline
│       ├── scheduler/        # Lecture/exam scheduling
│       ├── analytics/        # Risk prediction
│       └── utils/            # Utilities
├── docker/                   # Docker configurations
│   ├── nginx/                # Nginx config + Dockerfile
│   ├── postgres/             # PostgreSQL init scripts
│   ├── prometheus/           # Prometheus config
│   └── grafana/              # Grafana dashboards
├── scripts/                  # Helper scripts
│   ├── setup.sh              # Full setup automation
│   ├── seed.sh               # Database seeding
│   └── health-check.sh       # Service health check
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── API.md                # API documentation
│   ├── DATABASE.md           # Database schema
│   ├── SETUP.md              # Setup guide
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── AI.md                 # AI module docs
│   └── SECURITY.md           # Security overview
├── .github/
│   ├── workflows/            # CI/CD pipelines
│   └── dependabot.yml        # Dependency updates
├── .env.example              # Environment template
├── docker-compose.yml        # Service orchestration
└── Makefile                  # Helper commands
```

## User Roles

| Role                 | Description                                | Access Level           |
|----------------------|--------------------------------------------|------------------------|
| Super Admin          | Full system access, configuration          | All modules            |
| Admin                | Administrative operations                  | All except system cfg  |
| Dean                 | Faculty-level management                   | Faculty scope          |
| Head of Department   | Department-level management                | Department scope       |
| Professor            | Teaching and grading                       | Own courses            |
| Assistant Professor  | Teaching with limited grading              | Assigned courses       |
| Teaching Assistant   | Course assistance, material upload         | Assigned courses       |
| Student              | View grades, schedule, attendance          | Own records            |
| Researcher           | Research data access                       | Research modules       |
| Librarian            | Library and document management            | Files & materials      |
| Accountant           | Financial records                          | Finance module         |
| IT Support           | Technical troubleshooting                   | System diagnostics     |

## Helper Commands

```bash
make setup     # Full project setup (deps + Docker + seed)
make dev       # Start all services in development mode
make build     # Build all services
make test      # Run all tests
make lint      # Lint all code
make seed      # Seed the database
make clean     # Clean all artifacts
make backup    # Backup database
make docs      # Generate API documentation
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: new feature
fix: bug fix
docs: documentation
chore: maintenance
refactor: code restructuring
test: testing
style: formatting
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## Contact & Support

- **Website:** https://fee-menouf.edu.eg
- **Email:** support@fee-menouf.edu.eg
- **GitHub Issues:** https://github.com/fee-menouf/fee-menouf-platform/issues
- **Documentation:** https://docs.fee-menouf.edu.eg

---

<div align="center">
  <strong>Faculty of Electronic Engineering, Menoufia University</strong><br>
  جمهورية مصر العربية — جامعة المنوفية — كلية الهندسة الإلكترونية
</div>
