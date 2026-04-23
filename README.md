<div align="center">

# NXL BYLDR Command Center

**VSUAL Business OS** — Full-featured business management platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-New_York-18181B)](https://ui.shadcn.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Private-gray)]()

**Live Demo:** [nxl-byldr-command-center.pages.dev](https://nxl-byldr-command-center.pages.dev)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
- [Application Modules](#application-modules)
  - [Dashboard](#1-dashboard)
  - [Projects](#2-projects)
  - [Team Management](#3-team-management)
  - [Customer CRM](#4-customer-crm)
  - [Analytics](#5-analytics)
  - [Masters Plan Zone (MPZ)](#6-masters-plan-zone-mpz)
  - [AI Assistant](#7-ai-assistant)
  - [Settings](#8-settings)
- [Authentication System](#authentication-system)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
  - [Cloudflare Pages](#deploy-to-cloudflare-pages)
  - [Vercel](#deploy-to-vercel)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Overview

**NXL BYLDR Command Center** (branded as **VSUAL Business OS**) is a comprehensive, full-stack business management platform designed for digital agencies and creative businesses. It provides an integrated command center for managing projects, teams, customers, lead pipelines, and business analytics — all in a single, modern web application.

The application features a sophisticated **11-stage lead pipeline** with automated follow-up workflows, a full **14-day funnel automation** system, real-time **AI chat assistance**, and comprehensive **business analytics** dashboards.

---

## Features

### Core Platform
- **Command Center Dashboard** — Real-time KPIs, alert bar, 13-step client onboarding checklist, build-phase roadmap
- **Project Management** — Full CRUD with status tracking (active/paused/completed/archived), priority levels, and task assignment
- **Team Management** — Member directory with role-based access (master_admin/admin/manager/member), task assignments
- **Customer CRM** — Customer database with plan tiers (free/pro/enterprise), revenue tracking, lifecycle management
- **Analytics Dashboard** — Revenue charts, activity breakdowns, KPI tracking with trend indicators
- **AI Chat Assistant** — Floating AI assistant powered by `z-ai-web-dev-sdk` for instant business insights
- **Dark/Light Theme** — System-aware theme with smooth transitions and custom animations

### Masters Plan Zone (MPZ) — Lead Pipeline System
- **11-Stage Pipeline** — Visual Kanban board with stages from New Lead to Retention
- **Automated 14-Day Funnel** — Structured follow-up sequence with email, video, and phone touchpoints
- **Task Board** — Dual-column task management split by assignee with completion tracking
- **Alert System** — Hot lead detection, stuck lead monitoring, overdue task warnings, daily reports
- **Lead Detail Panel** — Slide-in sheet with full contact info, stage progression, automation status, activity timeline

### Authentication & Security
- **Credential-Based Login** — Email/password with auto-signup for new users
- **Master Admin System** — Hardcoded admin accounts with elevated privileges
- **OTP Password Reset** — 6-digit OTP with 15-minute expiry via email flow
- **JWT Session Strategy** — Stateless auth with role and ID embedded in tokens

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.1+ |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Library** | shadcn/ui (New York) | Latest |
| **Database** | SQLite / Cloudflare D1 | — |
| **ORM** | Prisma | 6.x |
| **Auth** | NextAuth.js | 4.x |
| **State** | Zustand + TanStack Query | Latest |
| **Animations** | Framer Motion | 12.x |
| **Charts** | Recharts | 2.x |
| **Icons** | Lucide React | Latest |
| **Runtime** | Bun / Node.js | — |

---

## Architecture

### Project Structure

```
NXL-BYLDR-Command-Center/
├── prisma/
│   ├── schema.prisma          # Prisma ORM schema (12 models)
│   └── d1-schema.sql          # Cloudflare D1 SQL DDL
├── scripts/
│   └── deploy-cloudflare.sh   # Automated Cloudflare deployment
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles, theme variables, animations
│   │   ├── layout.tsx         # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx           # Home page (auth gate: landing ↔ command center)
│   │   └── api/
│   │       ├── route.ts                # Health check
│   │       ├── alert-bar/route.ts      # Global alert banner management
│   │       ├── seed/route.ts           # Database seeder
│   │       ├── dashboard/route.ts      # Dashboard aggregate stats
│   │       ├── activity/route.ts       # Activity feed CRUD
│   │       ├── metrics/route.ts        # Business metrics CRUD
│   │       ├── ai/route.ts             # AI chat assistant
│   │       ├── setup-steps/route.ts    # Onboarding checklist
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │       │   ├── callback/credentials/route.ts  # Manual login
│   │       │   ├── register/route.ts         # User registration
│   │       │   ├── session/route.ts          # Session check
│   │       │   ├── admin-check/route.ts      # Admin verification
│   │       │   ├── forgot-password/route.ts  # OTP generation
│   │       │   ├── verify-otp/route.ts       # OTP verification
│   │       │   └── reset-password/route.ts   # Password reset
│   │       ├── customers/
│   │       │   ├── route.ts            # Customer list + create
│   │       │   └── [id]/route.ts       # Customer CRUD
│   │       ├── projects/
│   │       │   ├── route.ts            # Project list + create
│   │       │   └── [id]/route.ts       # Project CRUD + tasks
│   │       ├── tasks/
│   │       │   ├── route.ts            # Task list + create
│   │       │   └── [id]/route.ts       # Task CRUD
│   │       ├── team/
│   │       │   ├── route.ts            # Team list + create
│   │       │   └── [id]/route.ts       # Team member CRUD
│   │       └── mpz/
│   │           ├── seed/route.ts              # MPZ data seeder
│   │           ├── dashboard/route.ts         # MPZ aggregate stats
│   │           ├── activities/route.ts        # Activity feed
│   │           ├── leads/
│   │           │   ├── route.ts              # Lead list + create
│   │           │   └── [id]/
│   │           │       ├── route.ts          # Lead CRUD
│   │           │       ├── stage/route.ts    # Pipeline stage change
│   │           │       └── mockup-ready/route.ts  # Mockup approval
│   │           └── tasks/
│   │               ├── route.ts              # Task list + create
│   │               └── [id]/
│   │                   ├── route.ts          # Task CRUD
│   │                   └── complete/route.ts # Task completion
│   ├── components/
│   │   ├── providers.tsx        # Theme provider wrapper
│   │   ├── page.tsx             # Auth gate (Landing ↔ CommandCenter)
│   │   ├── landing-page.tsx     # Login/authentication screen
│   │   ├── command-center.tsx   # Main app shell (sidebar + header + views)
│   │   ├── sidebar-nav.tsx      # Collapsible sidebar navigation
│   │   ├── header-bar.tsx       # Top header bar
│   │   ├── ai-chat.tsx          # Floating AI chat widget
│   │   ├── views/
│   │   │   ├── dashboard-view.tsx    # Main dashboard
│   │   │   ├── projects-view.tsx     # Project management
│   │   │   ├── team-view.tsx         # Team management
│   │   │   ├── customers-view.tsx    # Customer CRM
│   │   │   ├── analytics-view.tsx    # Analytics charts
│   │   │   ├── settings-view.tsx     # User settings
│   │   │   ├── masters-plan-zone.tsx # MPZ container (6 tabs)
│   │   │   └── mpz/
│   │   │       ├── constants.ts        # Types, stages, utilities
│   │   │       ├── mpz-dashboard.tsx   # MPZ stats & KPIs
│   │   │       ├── mpz-pipeline.tsx    # Kanban board (11 stages)
│   │   │       ├── mpz-leads.tsx       # Lead table with filters
│   │   │       ├── mpz-tasks.tsx       # Dual-column task board
│   │   │       ├── mpz-automation.tsx  # 14-day funnel timeline
│   │   │       ├── mpz-alerts.tsx      # Alert dashboard
│   │   │       ├── mpz-lead-detail.tsx # Slide-in lead detail
│   │   │       └── mpz-new-lead.tsx    # New lead dialog
│   │   └── ui/                 # 46 shadcn/ui components
│   ├── hooks/
│   │   ├── use-toast.ts        # Toast notification state
│   │   └── use-mobile.ts       # Responsive breakpoint hook
│   └── lib/
│       ├── auth.ts             # Auth exports + admin gate
│       ├── constants.ts        # App constants & branding
│       ├── db.ts               # Prisma client (local dev)
│       ├── d1.ts               # Cloudflare D1 adapter (edge)
│       └── utils.ts            # cn() class merger
├── public/
│   ├── logo.svg                # VSUAL logo
│   └── robots.txt              # SEO crawler rules
├── next.config.ts              # Next.js configuration
├── open-next.config.ts         # Cloudflare adapter config
├── wrangler.toml               # Cloudflare deployment config
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS pipeline
├── components.json             # shadcn/ui generator config
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        page.tsx (Auth Gate)                  │
│  localStorage vsual_auth → Landing Page OR Command Center   │
├──────────────────────┬──────────────────────────────────────┤
│   Landing Page       │        Command Center                │
│   (Unauthenticated)  │        (Authenticated)                │
├──────────────────────┤  ┌───────────┬──────────┬───────────┤
│ • Email/Password     │  │ Sidebar   │ Header   │ AI Chat   │
│ • OAuth Buttons      │  │ Nav       │ Bar      │ Widget    │
│ • Forgot Password    │  │ (7 items) │          │ (FAB)     │
│ • OTP Reset Flow     │  └─────┬─────┴──────────┴───────────┤
│ • How to Use Dialog  │        │ View Router (useState)     │
│ • Animated BG        │  ┌─────┴────────────────────────────┤
└──────────────────────┘  │         8 Views                   │
                          │ Dashboard  │  Projects  │  Team   │
                          │ Customers  │  Analytics │  MPZ*   │
                          │ Settings                           │
                          └────────────────────────────────────┘

* MPZ contains 6 sub-tabs: Dashboard, Pipeline, Leads, Tasks,
  Automation, Alerts — plus a slide-in Lead Detail Sheet
```

**Key Frontend Patterns:**
- **Client-side routing** via React state (`activeView`) — no Next.js file-based routing beyond `/`
- **Data fetching** with `useEffect` + `useState` on component mount
- **Global state** via `localStorage` for auth persistence
- **Animations** via Framer Motion: page transitions, staggered lists, micro-interactions
- **Responsive design**: Mobile-first with Sheet drawers, collapsible sidebar, adaptive grids
- **UI system**: 46 shadcn/ui primitives (New York style) with custom dark theme

### Backend Architecture

```
┌──────────────────────────────────────────────────┐
│                  Next.js API Routes               │
│              (36 route files, 30 endpoints)        │
├──────────┬──────────┬──────────┬─────────────────┤
│  Auth    │ Business │   MPZ    │  Utility        │
│ (8 eps)  │ (14 eps) │ (10 eps) │ (3 eps)         │
├──────────┴──────────┴──────────┴─────────────────┤
│                 Data Access Layer                  │
│  ┌──────────────────┬──────────────────────────┐  │
│  │ db.ts (Prisma)   │ d1.ts (Cloudflare D1)   │  │
│  │ Local Dev        │ Edge / Production        │  │
│  │ SQLite file      │ Cloudflare D1 binding    │  │
│  └──────────────────┴──────────────────────────┘  │
├──────────────────────────────────────────────────┤
│                   Database                         │
│  12 tables: Project, Task, TeamMember, Activity,  │
│  Metric, Customer, OtpCode, SetupStep, AlertBar,  │
│  MpzLead, MpzTask, MpzActivity                    │
└──────────────────────────────────────────────────┘
```

**Key Backend Patterns:**
- **Route Handlers** — Standard Next.js `GET`/`POST`/`PUT`/`DELETE` with JSON responses
- **Input Validation** — Manual validation in each route (email regex, enum checks, required fields)
- **Error Handling** — Try/catch with structured error JSON (`{ error: string }`)
- **Database Access** — Prisma ORM for local dev, D1 adapter for Cloudflare edge
- **Auth Middleware** — NextAuth JWT strategy with role-based access control

### Database Schema

#### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Project    │────<│     Task     │>────│  TeamMember  │
│              │ 1:N │              │ N:1 │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ title        │     │ name         │
│ status       │     │ status       │     │ email (UQ)   │
│ priority     │     │ priority     │     │ role         │
│ progress     │     │ projectId FK │     │ avatar       │
│ startDate    │     │ assigneeIdFK │     │ password     │
│ endDate      │     │ dueDate      │     │ status       │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │     │  MpzLead     │────<│  MpzTask     │
│              │     │              │ 1:N │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ name         │     │ title        │
│ email (UQ)   │     │ businessName │     │ status       │
│ company      │     │ phone        │     │ priority     │
│ plan         │     │ email        │     │ assignedTo   │
│ revenue      │     │ serviceType  │     │ leadId FK    │
│ status       │     │ stage (11)   │     │ dueDate      │
└──────────────┘     │ assignedTo   │     └──────────────┘
                     │ mockupReady  │
                     │ automationDay│     ┌──────────────┐
                     └──────┬───────┘     │ MpzActivity  │
                            │ 1:N         │              │
                            │             │ id (PK)      │
                            └────────────>│ type         │
                                          │ message      │
                                          │ leadId FK    │
                                          └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Activity   │     │    Metric    │     │   OtpCode    │
│              │     │              │     │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ type         │     │ name         │     │ email        │
│ message      │     │ value (F)    │     │ code         │
│ userId       │     │ unit         │     │ verified     │
│ metadata     │     │ category     │     │ expiresAt    │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐
│  SetupStep   │     │   AlertBar   │
│              │     │              │
│ id (PK)      │     │ id (PK)      │
│ stepNumber   │     │ active (B)   │
│ title        │     │ message      │
│ phase (4)    │     └──────────────┘
│ status (3)   │
│ completedAt  │
└──────────────┘
```

#### Table Details

| Table | Purpose | Key Fields |
|---|---|---|
| **Project** | Business projects | status (active/paused/completed/archived), priority (low/medium/high/critical), progress (0-100%) |
| **Task** | Work items | status (todo/in_progress/review/done), belongs to Project + optional TeamMember |
| **TeamMember** | Users & roles | role (master_admin/admin/manager/member), unique email |
| **Customer** | Client database | plan (free/pro/enterprise), revenue (float), status (active/inactive/lead) |
| **MpzLead** | MPZ lead pipeline | stage (11 stages from new_lead → retention), mockupReady, automationDay (0-14) |
| **MpzTask** | MPZ work items | assignedTo (Sal/Geo), linked to MpzLead |
| **MpzActivity** | MPZ activity log | type (stage_change/task_completed/mockup_ready), linked to MpzLead |
| **Activity** | Global activity feed | type, message, optional userId + JSON metadata |
| **Metric** | Business metrics | value (float), unit, category |
| **SetupStep** | 13-step onboarding | stepNumber (unique), phase (handover/game_plan/technical/live), status |
| **AlertBar** | Global alert banner | active (boolean), message |
| **OtpCode** | Password reset OTP | code (6-digit), verified, expiresAt |

---

## Application Modules

### 1. Dashboard

The main landing view after login. Displays a comprehensive overview of the business.

| Component | Description |
|---|---|
| **Alert Bar** | Editable (admin-only) global notification banner — cycles active/inactive on click |
| **Welcome Banner** | Personalized greeting with user name and role badge |
| **Stat Cards** | 5 KPI cards: Total Projects, Active Tasks, Team Members, Customers, Completion Rate |
| **Setup Progress** | 13-step client onboarding checklist across 4 build phases |
| **Build Phases** | Phase 1 (Handover) → Phase 2 (Game Plan) → Phase 3 (Technical) → Phase 4 (Live) |
| **Activity Feed** | Recent activity entries with timestamps |

**API Endpoints:** `GET /api/dashboard`, `GET /api/alert-bar`, `POST /api/alert-bar`, `GET /api/setup-steps`, `POST /api/setup-steps`

### 2. Projects

Full project lifecycle management with task tracking.

| Feature | Description |
|---|---|
| **Project Cards** | Grid layout with status badges, priority indicators, progress bars |
| **Create Project** | Dialog form: name, description, status, priority |
| **Delete Project** | Dropdown menu with confirmation |
| **Task Count** | Per-project task count display |

**API Endpoints:** `GET /api/projects`, `POST /api/projects`, `DELETE /api/projects/:id`

### 3. Team Management

Team member directory with role-based access.

| Feature | Description |
|---|---|
| **Member Table** | Desktop: sortable table. Mobile: card layout |
| **Role Badges** | Color-coded roles (master_admin, admin, manager, member) |
| **Search/Filter** | By name, email, or role |
| **Status Indicators** | Active/inactive dots |
| **Deterministic Avatars** | Color derived from member name |

**API Endpoints:** `GET /api/team`, `POST /api/team`, `DELETE /api/team/:id`

### 4. Customer CRM

Customer relationship management with tier tracking.

| Feature | Description |
|---|---|
| **Customer Table** | Searchable table with name, email, company, plan, revenue |
| **Plan Badges** | Free (gray), Pro (blue), Enterprise (purple) |
| **Status Badges** | Active (green), Inactive (red), Lead (amber) |
| **Revenue Formatting** | Currency-formatted display |

**API Endpoints:** `GET /api/customers`, `POST /api/customers`, `DELETE /api/customers/:id`

### 5. Analytics

Business intelligence dashboard with interactive charts.

| Feature | Description |
|---|---|
| **Revenue Chart** | Area chart — Revenue + Users over 12 months |
| **Activity Chart** | Bar chart — Tasks, Meetings, Reviews by day of week |
| **KPI Cards** | 8 metric cards with trend indicators |
| **Custom Tooltips** | Styled Recharts tooltip component |

**API Endpoints:** `GET /api/dashboard`

### 6. Masters Plan Zone (MPZ)

The core lead pipeline and automation system. A tabbed interface with 6 views.

#### 6.1 MPZ Pipeline Stages

| # | Stage | Description |
|---|---|---|
| 1 | `new_lead` | Initial lead capture |
| 2 | `contacted` | First outreach made |
| 3 | `qualified` | Lead qualified as potential client |
| 4 | `consultation` | Discovery/consultation call |
| 5 | `proposal_sent` | Proposal delivered |
| 6 | `negotiation` | Pricing/terms discussion |
| 7 | `mockup_sent` | Design mockup delivered |
| 8 | `revision` | Client requested changes |
| 9 | `approved` | Client approved design |
| 10 | `closed_won` | Deal closed — won |
| 11 | `closed_lost` | Deal closed — lost |

#### 6.2 14-Day Automation Funnel

| Day | Action | Channel |
|---|---|---|
| 1 | Welcome message + service overview | Email |
| 3 | Portfolio/showcase video | Video |
| 5 | Case study + social proof | Email |
| 7 | Personalized proposal | Email |
| 9 | Follow-up call | Phone |
| 11 | Limited-time offer | Email |
| 14 | Final follow-up + urgency | Phone |

#### 6.3 MPZ Sub-Modules

| Tab | Component | Description |
|---|---|---|
| Dashboard | `mpz-dashboard.tsx` | KPI cards, pipeline distribution chart, stuck leads, quick actions |
| Pipeline | `mpz-pipeline.tsx` | 11-column Kanban board with advance-lead buttons |
| Leads | `mpz-leads.tsx` | Searchable/filterable/sortable lead table |
| Tasks | `mpz-tasks.tsx` | Dual-column board (Sal/Geo) with checkbox completion |
| Automation | `mpz-automation.tsx` | Timeline view + active automations + available leads |
| Alerts | `mpz-alerts.tsx` | Hot leads, stuck leads, overdue tasks, daily report |

**API Endpoints:** 10 endpoints under `/api/mpz/*` — see [API Reference](#api-reference)

### 7. AI Assistant

Floating chat widget accessible from any authenticated view.

| Feature | Description |
|---|---|
| **FAB Button** | Floating action button with scale animation |
| **Chat Panel** | 340×440px expandable panel with message bubbles |
| **Typing Indicator** | Bouncing dots animation while waiting |
| **Context Aware** | System prompt describes VSUAL Business OS context |
| **Auto-scroll** | Automatically scrolls to latest message |

**API Endpoint:** `POST /api/ai`

### 8. Settings

User preferences and account management.

| Feature | Description |
|---|---|
| **Profile Editor** | Name, bio, phone, location fields |
| **Theme Picker** | Dark/Light mode with visual previews |
| **Notification Toggles** | 5 notification preference switches |
| **Admin Info** | Master admin badge and notification email list |
| **Danger Zone** | Delete account with confirmation dialog |

---

## Authentication System

### Flow Diagram

```
┌─────────────┐
│  Login Page │
└──────┬──────┘
       │
       ├─ Email + Password ──→ Check Master Admin List
       │                          ├─ Match → Login as master_admin
       │                          └─ No match → Check TeamMember DB
       │                                          ├─ Found → Verify password
       │                                          │    ├─ Match → Login
       │                                          │    └─ No password + pw ≥ 6 → Login (legacy)
       │                                          └─ Not found → Auto-signup (pw ≥ 6)
       │
       └─ Forgot Password ──→ Enter Email
                               │
                               ├─ Generate 6-digit OTP (15 min expiry)
                               │
                               ├─ Enter OTP → Verify
                               │
                               ├─ Enter New Password (min 6 chars)
                               │
                               └─ Reset Complete → Return to Login
```

### Roles & Permissions

| Role | Access Level |
|---|---|
| `master_admin` | Full access. Edit alert bar, manage all resources, view admin panel |
| `admin` | Standard admin access |
| `manager` | Team and project management |
| `member` | Basic access — view dashboard, own tasks |

---

## API Reference

### Core Business APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api` | Health check |
| `GET` | `/api/dashboard` | Dashboard aggregate stats |
| `GET/POST` | `/api/activity` | Activity feed |
| `GET/POST` | `/api/metrics` | Business metrics |
| `POST` | `/api/seed` | Seed demo data (`?force=true` to reset) |
| `GET/POST` | `/api/alert-bar` | Alert banner |
| `GET/POST` | `/api/setup-steps` | Onboarding checklist |
| `POST` | `/api/ai` | AI chat (body: `{ message, context? }`) |

### Project APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/projects` | List/Create projects |
| `GET/PUT/DELETE` | `/api/projects/:id` | Read/Update/Delete project + tasks |

### Task APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/tasks` | List/Create tasks (`?projectId=`, `?status=`) |
| `GET/PUT/DELETE` | `/api/tasks/:id` | Read/Update/Delete task |

### Team APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/team` | List/Create members |
| `GET/PUT/DELETE` | `/api/team/:id` | Read/Update/Delete member + tasks |

### Customer APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/customers` | List/Create customers |
| `GET/PUT/DELETE` | `/api/customers/:id` | Read/Update/Delete customer |

### Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handler |
| `POST` | `/api/auth/callback/credentials` | Manual credential login |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/auth/session` | Get current session |
| `GET` | `/api/auth/admin-check` | Verify admin status |
| `POST` | `/api/auth/forgot-password` | Request OTP reset |
| `POST` | `/api/auth/verify-otp` | Verify OTP code |
| `POST` | `/api/auth/reset-password` | Reset password |

### MPZ (Masters Plan Zone) APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/mpz/seed` | Seed MPZ demo data |
| `GET` | `/api/mpz/dashboard` | MPZ aggregate stats |
| `GET/POST` | `/api/mpz/leads` | List/Create leads |
| `GET/PUT/DELETE` | `/api/mpz/leads/:id` | Read/Update/Delete lead |
| `PUT` | `/api/mpz/leads/:id/stage` | Change pipeline stage |
| `PUT` | `/api/mpz/leads/:id/mockup-ready` | Mark mockup ready + trigger automation |
| `GET/POST` | `/api/mpz/tasks` | List/Create tasks |
| `GET/PUT/DELETE` | `/api/mpz/tasks/:id` | Read/Update/Delete task |
| `PUT` | `/api/mpz/tasks/:id/complete` | Mark task completed |
| `GET` | `/api/mpz/activities` | Activity feed (latest 50) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** latest
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/toponseo25/NXL-BYLDR-Command-Center.git
cd NXL-BYLDR-Command-Center

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Initialize the database
bun run db:push

# (Optional) Seed demo data
curl -X POST http://localhost:3000/api/seed?force=true

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login

| Role | Email | Password |
|---|---|---|
| Master Admin | `info.vsualdm@gmail.com` | `VSUAL@NX$260&` |
| Master Admin | `geovsualdm@gmail.com` | `VSUAL@NX$260&` |
| Auto-signup | Any email | Any password (≥6 chars) |

---

## Deployment

### Deploy to Cloudflare Pages

```bash
# 1. Set Cloudflare API token with D1 + Workers + Pages permissions
export CLOUDFLARE_API_TOKEN=your_token_here

# 2. Run the automated deploy script
bash scripts/deploy-cloudflare.sh
```

The script automatically:
1. Creates a D1 database (`nxl-byldr-db`)
2. Initializes the schema
3. Builds the project with `@opennextjs/cloudflare`
4. Deploys to Cloudflare Pages

**Manual steps:**
```bash
bun run cf:build    # Build for Cloudflare
bun run cf:deploy   # Deploy to Cloudflare Pages
bun run cf:dev      # Local dev with Cloudflare runtime
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

> **Note:** For Vercel, replace the SQLite database with a Vercel Postgres or Turso connection by updating `DATABASE_URL` in the environment variables.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Database connection string | `file:./db/custom.db` |
| `NEXTAUTH_SECRET` | JWT signing secret | `vsual-business-os-secret-key-2025` |
| `NEXTAUTH_URL` | Public application URL | `http://localhost:3000` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare deployment token | — |

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |
| `bun run cf:build` | Build for Cloudflare Pages |
| `bun run cf:deploy` | Deploy to Cloudflare Pages |
| `bun run cf:dev` | Local dev with Cloudflare runtime |
| `bun run deploy` | Full automated Cloudflare deployment |

---

## License

Private — All rights reserved.

---

<div align="center">
  <p>Built with ❤️ by <strong>VSUAL Digital Media</strong></p>
  <p><em>NXL BYLDR Command Center — VSUAL Business OS v2.0.0</em></p>
</div>
