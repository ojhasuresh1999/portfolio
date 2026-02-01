# Portfolio Backend Documentation

## Overview

This portfolio application uses a modern backend stack:

- **Framework**: Next.js 16 with App Router
- **Database**: MongoDB with Mongoose ODM
- **Language**: TypeScript
- **Containerization**: Docker with Docker Compose

## Database Architecture

### MongoDB Setup

The application uses MongoDB as its primary database with Mongoose as the ODM
(Object Document Mapper).

#### Local Development

Start the MongoDB container:

```bash
pnpm db:start
```

This will start:

- **MongoDB 7** on port `27017`
- **Mongo Express** on port `8081` (admin UI)

#### Environment Variables

```env
# MongoDB Database
MONGODB_USER=admin
MONGODB_PASSWORD=password
MONGODB_DB=portfolio
MONGODB_PORT=27017

# MongoDB Connection URI
MONGODB_URI=mongodb://admin:password@localhost:27017/portfolio?authSource=admin
```

### Data Models

The application includes 12 Mongoose models:

| Model               | Description                  |
| ------------------- | ---------------------------- |
| `User`              | Admin authentication         |
| `HeroContent`       | Hero section content         |
| `TechStack`         | Technology stack items       |
| `Project`           | Portfolio projects           |
| `Skill`             | Individual skills            |
| `SkillCard`         | Skill cards for grid display |
| `BlogPost`          | Blog posts                   |
| `TimelineEntry`     | Career timeline              |
| `AboutContent`      | About section content        |
| `SocialLink`        | Social media links           |
| `SiteSettings`      | Site-wide configuration      |
| `ContactSubmission` | Contact form submissions     |

### Service Layer

Services are located in `src/server/services/`:

- `base.service.ts` - Abstract base service with common CRUD operations
- `blog.service.ts` - Blog post operations
- `contact.service.ts` - Contact form operations
- `project.service.ts` - Project operations
- `settings.service.ts` - Site settings operations

## API Routes

### System

- `GET /api/health` - Health check endpoint

### Blog

- `GET /api/blog` - List published blog posts
- `GET /api/blog/[slug]` - Get blog post by slug
- `POST /api/blog` - Create blog post (admin)
- `PUT /api/blog/[id]` - Update blog post (admin)
- `DELETE /api/blog/[id]` - Delete blog post (admin)

### Projects

- `GET /api/projects` - List projects
- `GET /api/projects/[slug]` - Get project by slug

### Contact

- `POST /api/contact` - Submit contact form

### Settings

- `GET /api/settings` - Get site settings

## Development Commands

```bash
# Start development server
pnpm dev

# Start database containers
pnpm db:start

# Stop database containers
pnpm db:stop

# Reset database (deletes all data)
pnpm db:reset

# Seed the database
pnpm db:seed

# Full database setup
pnpm db:setup

# View database logs
pnpm db:logs

# Build for production
pnpm build

# Start production server
pnpm start
```

## Production Deployment

### MongoDB Atlas (Recommended)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update the `MONGODB_URI` environment variable

Example Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
```

### Vercel Deployment

1. Connect your repository to Vercel
2. Add the `MONGODB_URI` environment variable
3. Deploy

## Connection Pooling

The MongoDB connection is cached for serverless environments (Vercel, AWS
Lambda):

```typescript
// src/lib/mongodb.ts
let cached = global.mongoose;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  // Connection logic...
}
```

This prevents connection exhaustion in serverless environments.

## Indexes

Key indexes are created for performance:

- `User.email` - Unique index
- `Project.slug` - Unique index
- `BlogPost.slug` - Unique index
- `BlogPost.isPublished` + `publishedAt` - Compound index
- `ContactSubmission.isRead` + `createdAt` - Compound index

## Security

- All database operations use parameterized queries (no injection
  vulnerabilities)
- Connection strings should use environment variables
- SSL/TLS is enforced for production connections
- Rate limiting is implemented at the API level
