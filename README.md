# VSUAL NXL BYLDR Command Center

> Digital Media & Promotional Marketing Agency — Growth, Marketing & AI Automation Hub

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4)
![License](https://img.shields.io/badge/License-Private-red)

## Overview

NXL BYLDR Command Center is a full-stack business management platform built for digital media agencies. It provides project management, team collaboration, lead tracking, customer journeys, analytics, and AI-powered assistance — all in one unified dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1 (App Router, Turbopack) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | PostgreSQL via Prisma ORM 7.8 |
| **Auth** | NextAuth v4 (JWT, Credentials provider) |
| **Password Security** | bcryptjs (hashed storage, backward-compatible) |
| **Charts** | Recharts 2.x |
| **State** | Zustand 5.x |
| **AI** | z-ai-web-dev-sdk, Hugging Face Router, OpenRouter |
| **Deployment** | Vercel (serverless, iad1 region) |

## Features

### Core Modules
- **Dashboard** — Real-time overview with KPIs, activity feed, and metrics
- **Projects** — Full project lifecycle management with progress tracking
- **Tasks** — Kanban-style task management with assignments and deadlines
- **Team** — Member management with roles (master_admin, admin, manager, member)
- **Customers** — CRM with plans (free, pro, enterprise), revenue tracking
- **Analytics** — Charts, metrics, and performance insights
- **Messages** — Contact message inbox with assignment and replies

### Masters Plan Zone (MPZ)
- **Lead Pipeline** — Visual lead tracking across stages (new_lead → booked)
- **Task Management** — Automated task creation from lead stages
- **Activity Timeline** — Full audit trail per lead
- **Automation** — Day-based follow-up automation engine
- **Mockup Ready** — Design mockup status tracking

### Customer Journey
- **Setup Steps** — Phase-based onboarding checklist (handover, branding, content, launch)
- **Alerts** — Per-customer alert system with priority levels
- **Automation Logs** — Track all automated actions per journey

### AI Assistant
- Multi-provider: z-ai-web-dev-sdk (default), Hugging Face Router, OpenRouter
- Context-aware responses for project management queries

### Authentication & Security
- Master admin accounts (2 designated emails)
- Bcrypt password hashing (backward-compatible with legacy plain-text)
- JWT-based sessions
- OTP-based password reset
- Customer self-registration portal
- No auto-signup (admin-only member creation)

## Project Structure

```
nxl-byldr-command-center/
├── prisma/
│   └── schema.prisma          # 15 database models
├── public/                     # Static assets (logo, banners)
├── scripts/
│   └── vercel-build.sh         # Vercel build pipeline
├── src/
│   ├── app/
│   │   ├── api/                # 44 API routes
│   │   │   ├── auth/           # Auth, login, register, OTP, password reset
│   │   │   ├── customers/      # Customer CRUD
│   │   │   ├── team/           # Team member CRUD
│   │   │   ├── projects/       # Project CRUD
│   │   │   ├── tasks/          # Task CRUD
│   │   │   ├── journey/        # Customer journey management
│   │   │   ├── mpz/            # Masters Plan Zone (leads, tasks, automation)
│   │   │   ├── activity/       # Activity feed
│   │   │   ├── metrics/        # Business metrics
│   │   │   ├── contact/        # Contact messages
│   │   │   ├── dashboard/      # Dashboard data aggregation
│   │   │   ├── ai/             # AI chat assistant
│   │   │   └── seed/           # Database seeding
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── views/              # Feature views (dashboard, projects, team, etc.)
│   │   │   └── mpz/            # MPZ sub-components
│   │   ├── ui/                 # shadcn/ui component library (30+ components)
│   │   ├── command-center.tsx  # Main app shell
│   │   ├── sidebar-nav.tsx     # Navigation sidebar
│   │   ├── header-bar.tsx      # Top header bar
│   │   ├── landing-page.tsx    # Public landing page
│   │   ├── customer-portal.tsx # Customer-facing portal
│   │   └── ai-chat.tsx         # AI assistant chat widget
│   ├── hooks/                  # Custom React hooks
│   └── lib/
│       ├── db.ts               # Prisma client singleton (PrismaPg adapter)
│       ├── constants.ts        # Brand config, master admin emails
│       └── utils.ts            # Utility functions
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── prisma.config.ts            # Prisma 7 configuration
├── vercel.json                 # Vercel deployment config
├── tsconfig.json               # TypeScript configuration
└── package.json
```

## Database Models (15)

| Model | Description |
|-------|-------------|
| `TeamMember` | Team members with roles, passwords, avatars |
| `Project` | Projects with status, priority, progress |
| `Task` | Tasks linked to projects and team members |
| `Customer` | Customer accounts with plans and revenue |
| `Activity` | Activity feed entries |
| `Metric` | Business metrics and KPIs |
| `ClientJourney` | Per-customer onboarding journey |
| `ClientSetupStep` | Journey setup checklist items |
| `ClientAlert` | Per-journey alerts |
| `AutomationLog` | Automated action logs |
| `MpzLead` | MPZ leads with pipeline stages |
| `MpzTask` | MPZ tasks linked to leads |
| `MpzActivity` | MPZ lead activity timeline |
| `ContactMessage` | Customer contact messages |
| `OtpCode` | OTP codes for password reset |

## Getting Started

### Prerequisites
- Node.js 18+ (or 20+ recommended)
- npm or bun
- PostgreSQL database (local, Neon, Supabase, or Vercel Postgres)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/mohontotopu48-maker/nxl-byldr-command-center-2026.git
cd nxl-byldr-command-center-2026

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Generate Prisma client
npx prisma generate

# 5. Push database schema
npx prisma db push

# 6. Seed the database (starts the dev server first)
npm run dev
# In another terminal:
npm run db:seed

# 7. Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`?sslmode=require` for cloud) |
| `NEXTAUTH_SECRET` | Yes | Random 32+ char string for JWT signing |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `PRISMA_ACCELERATE_URL` | No | Prisma Accelerate connection (optional) |
| `HF_TOKEN` | No | Hugging Face API token for AI |
| `Z_AI_API_KEY` | No | OpenRouter API key for AI |

## Vercel Deployment

1. Push to GitHub
2. Import repo in Vercel Dashboard
3. Set environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. Deploy — the build script auto-runs `prisma generate` + `prisma migrate deploy` + `next build`
5. After deploy, seed: `POST https://your-app.vercel.app/api/seed?force=true`

## Master Admin Accounts

| Email | Role |
|-------|------|
| `info.vsualdm@gmail.com` | Master Admin |
| `geovsualdm@gmail.com` | Master Admin |

Master admins have full access to all features. Only these 2 emails can hold the `master_admin` role.

## API Routes (44 endpoints)

- `POST /api/auth/[...nextauth]` — NextAuth sign in/out
- `GET /api/auth/admin-check` — Verify admin status
- `POST /api/auth/register` — Register team member
- `POST /api/auth/customer-register` — Register customer
- `POST /api/auth/customer-login` — Customer sign in
- `POST /api/auth/forgot-password` — Request OTP
- `POST /api/auth/verify-otp` — Verify OTP
- `POST /api/auth/reset-password` — Reset password
- `GET/POST /api/team` — List/create team members
- `GET/PUT/DELETE /api/team/[id]` — Team member CRUD
- `GET/POST /api/projects` — List/create projects
- `GET/PUT/DELETE /api/projects/[id]` — Project CRUD
- `GET/POST /api/tasks` — List/create tasks
- `GET/PUT/DELETE /api/tasks/[id]` — Task CRUD
- `GET/POST /api/customers` — List/create customers
- `GET/PUT/DELETE /api/customers/[id]` — Customer CRUD
- `GET/POST /api/activity` — Activity feed
- `GET/POST /api/metrics` — Business metrics
- `GET/POST /api/contact` — Contact messages
- `GET/PUT/DELETE /api/contact/[id]` — Contact CRUD
- `GET/POST /api/journey` — Customer journeys
- `GET/PUT/DELETE /api/journey/[id]` — Journey CRUD
- `POST /api/journey/[id]/steps` — Update setup steps
- `POST /api/journey/[id]/alert` — Toggle alert
- `POST /api/journey/[id]/automate` — Trigger automation
- `GET/POST /api/mpz/leads` — MPZ leads
- `GET/PUT/DELETE /api/mpz/leads/[id]` — Lead CRUD
- `POST /api/mpz/leads/[id]/stage` — Update lead stage
- `POST /api/mpz/leads/[id]/mockup-ready` — Toggle mockup ready
- `GET/POST /api/mpz/tasks` — MPZ tasks
- `GET/PUT/DELETE /api/mpz/tasks/[id]` — MPZ task CRUD
- `POST /api/mpz/tasks/[id]/complete` — Complete MPZ task
- `GET /api/mpz/activities` — MPZ activities
- `GET /api/mpz/dashboard` — MPZ dashboard data
- `POST /api/mpz/seed` — Seed MPZ data
- `POST /api/seed` — Seed all database
- `GET /api/dashboard` — Dashboard aggregation
- `POST /api/ai` — AI chat assistant
- `GET/POST /api/alert-bar` — Global alert bar
- `GET/POST /api/setup-steps` — Setup steps management

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed database via API |
| `npm run lint` | Run ESLint |

## License

Private — All rights reserved by VSUAL Digital Media.
