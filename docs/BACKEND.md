# Backend Architecture

Production-ready backend setup for the portfolio project.

## Quick Start

```bash
# 1. Start PostgreSQL
pnpm db:start

# 2. Setup database (generate + push + seed)
pnpm db:setup

# 3. Start dev server (use webpack for Prisma 7 compatibility)
pnpm dev --webpack
```

## Technology Stack

| Technology | Version | Purpose                                    |
| ---------- | ------- | ------------------------------------------ |
| PostgreSQL | 17      | Primary database                           |
| Prisma ORM | 7.3     | Database toolkit with adapter-based client |
| Next.js    | 16      | API routes and server-side rendering       |
| Zod        | 3.25    | Runtime validation                         |

## Architecture

```
src/
├── server/
│   ├── constants/     # HTTP status, messages, pagination
│   ├── types/         # TypeScript interfaces
│   ├── utils/
│   │   ├── api-response.ts   # Response builder
│   │   ├── error-handler.ts  # Centralized error handling
│   │   ├── validation.ts     # Zod schemas
│   │   └── rate-limit.ts     # In-memory rate limiter
│   └── services/
│       ├── project.service.ts
│       ├── blog.service.ts
│       ├── contact.service.ts
│       └── settings.service.ts
├── lib/
│   └── prisma.ts      # Prisma client singleton
└── app/api/
    ├── health/        # Health check
    ├── projects/      # Project CRUD
    ├── blog/          # Blog posts
    ├── contact/       # Contact form
    └── settings/      # Site settings
```

## API Endpoints

### Public Endpoints

| Method | Endpoint               | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| GET    | `/api/health`          | System health check                |
| GET    | `/api/projects`        | List visible projects              |
| GET    | `/api/projects/[slug]` | Get project by slug                |
| GET    | `/api/blog`            | List published posts               |
| GET    | `/api/blog/[slug]`     | Get post by slug                   |
| POST   | `/api/contact`         | Submit contact form (rate limited) |
| GET    | `/api/settings`        | Get public site settings           |

### Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Database Commands

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `pnpm db:start`    | Start PostgreSQL container            |
| `pnpm db:stop`     | Stop PostgreSQL container             |
| `pnpm db:reset`    | Reset database (destroy and recreate) |
| `pnpm db:logs`     | View PostgreSQL logs                  |
| `pnpm db:generate` | Generate Prisma client                |
| `pnpm db:push`     | Push schema to database               |
| `pnpm db:migrate`  | Run migrations                        |
| `pnpm db:seed`     | Seed database with sample data        |
| `pnpm db:studio`   | Open Prisma Studio                    |
| `pnpm db:setup`    | Full setup (generate + push + seed)   |

## Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL="postgresql://portfolio_user:portfolio_pass@localhost:5432/portfolio_db"

# PostgreSQL (for Docker)
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=portfolio_pass
POSTGRES_DB=portfolio_db

# Application
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Known Issues

### Turbopack Compatibility

Prisma 7's generated client has bundling issues with Next.js 16's default Turbopack bundler. Use webpack for development:

```bash
pnpm dev --webpack
```

Or configure in `package.json`:

```json
"scripts": {
  "dev": "next dev --webpack"
}
```
