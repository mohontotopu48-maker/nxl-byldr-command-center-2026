# Changelog

All notable changes to the NXL BYLDR Command Center project.

## [0.3.0] - 2026-04-24

### Security
- **BREAKING**: All passwords now stored as bcrypt hashes (was plaintext)
- Master admin passwords use bcrypt hash verification
- Customer and team member registration hashes passwords with bcrypt (10 rounds)
- Password reset stores hashed new passwords
- Removed insecure `NEXTAUTH_SECRET` fallback — now required via environment variable
- Disabled auto-signup — only master admin emails can create admin accounts
- Legacy plaintext password support maintained for backward compatibility during migration

### Fixed
- `auth/[...nextauth]/route.ts` — Replaced plaintext comparison with `bcryptjs.compare()`, removed auto-signup
- `auth/customer-login/route.ts` — Added bcrypt comparison with legacy fallback
- `auth/customer-register/route.ts` — Hashes passwords on registration
- `auth/register/route.ts` — Hashes passwords, now requires password field
- `auth/reset-password/route.ts` — Hashes new password before storage
- `auth/callback/credentials/route.ts` — Added bcrypt comparison
- `api/customers/route.ts` — Replaced hardcoded plaintext default with bcrypt hash
- `api/seed/route.ts` — All passwords bcrypt hashed, complete table cleanup on force seed

### Changed
- `next.config.ts` — Added `bcryptjs` to `serverExternalPackages` for Vercel
- `vercel.json` — Removed duplicate headers (already defined in `next.config.ts`)
- `prisma.config.ts` — Added documentation comments
- `.env.example` — Comprehensive template with required/optional vars documented
- Added `bcryptjs` and `@types/bcryptjs` to dependencies

### Removed
- `bun.lock` — Removed (Vercel uses `package-lock.json`)
- `prisma/schema.sqlite.prisma` — Legacy SQLite schema removed
- `prisma/schema.postgres.prisma` — Duplicate PostgreSQL schema removed
- `prisma/d1-schema.sql` — Cloudflare D1 schema removed

### Build
- Production build verified: 0 errors, 44 API routes, 2 pages
- Compatible with Vercel serverless deployment (PostgreSQL required)

---

## [0.2.0] - 2026-04-23

### Added
- Prisma 7 with PostgreSQL provider and driver adapter (`@prisma/adapter-pg`)
- Prisma Accelerate support (optional)
- AI chat assistant with multi-provider support (z-ai-web-dev-sdk, Hugging Face, OpenRouter)
- `prisma.config.ts` for Prisma 7 configuration
- `scripts/vercel-build.sh` custom build pipeline
- `vercel.json` with Vercel deployment configuration
- Master admin email constant system (`MASTER_ADMIN_EMAILS`)
- Customer portal with self-registration and login
- OTP-based password reset flow
- Masters Plan Zone (MPZ) — leads, pipeline, tasks, automation
- Customer journey management with setup steps, alerts, automation logs
- Contact message inbox system
- Dashboard data aggregation API

### Changed
- Database migrated from SQLite to PostgreSQL
- Prisma upgraded from v6 to v7.8
- Next.js upgraded to v16.1

---

## [0.1.0] - 2026-04-22

### Added
- Initial project setup with Next.js, TypeScript, Tailwind CSS
- shadcn/ui component library (30+ components)
- Core modules: Dashboard, Projects, Tasks, Team, Customers, Analytics
- NextAuth v4 authentication with credentials provider
- Prisma ORM with SQLite
- Real-time activity feed
- Recharts-based analytics dashboard
- Responsive sidebar navigation
- Public landing page
