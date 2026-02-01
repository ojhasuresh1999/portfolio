# Contributing Guide

Thank you for your interest in contributing to this project! This document
provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development database**

   ```bash
   pnpm db:setup
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

## Git Workflow

### Branch Naming

- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `docs/<name>` - Documentation changes
- `refactor/<name>` - Code refactoring
- `chore/<name>` - Maintenance tasks

### Commit Messages

This project follows
[Conventional Commits](https://www.conventionalcommits.org/). All commit
messages must follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Code style changes (formatting, semicolons, etc.)       |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvements                                |
| `test`     | Adding or updating tests                                |
| `build`    | Build system or external dependencies                   |
| `ci`       | CI/CD configuration changes                             |
| `chore`    | Other maintenance tasks                                 |
| `revert`   | Reverts a previous commit                               |

#### Examples

```bash
# Feature
feat(auth): add login with Google OAuth

# Bug fix
fix(api): resolve null pointer exception in user service

# Documentation
docs(readme): update installation instructions

# Style
style(components): format code with prettier

# Refactor
refactor(db): optimize database queries for projects

# Performance
perf(images): add lazy loading for project images

# Test
test(api): add unit tests for blog service

# Build
build(deps): update mongoose to v9

# CI
ci(github): add commitlint to PR workflow

# Chore
chore(config): update eslint rules
```

## Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) to enforce code
quality:

### Pre-commit Hook

Runs automatically before each commit:

- ESLint (auto-fix)
- Prettier (auto-format)

### Commit-msg Hook

Validates commit messages follow Conventional Commits format.

### Pre-push Hook

Runs before pushing:

- TypeScript type check
- (For protected branches) Full lint + build

## Available Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start development server          |
| `pnpm build`        | Build for production              |
| `pnpm start`        | Start production server           |
| `pnpm lint`         | Run ESLint                        |
| `pnpm lint:fix`     | Run ESLint with auto-fix          |
| `pnpm format`       | Format code with Prettier         |
| `pnpm format:check` | Check formatting                  |
| `pnpm typecheck`    | Run TypeScript check              |
| `pnpm validate`     | Run lint + typecheck              |
| `pnpm db:start`     | Start MongoDB container           |
| `pnpm db:stop`      | Stop MongoDB container            |
| `pnpm db:reset`     | Reset database (deletes all data) |
| `pnpm db:seed`      | Seed database with sample data    |

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Add JSDoc comments for public functions
- Keep components small and focused
- Use meaningful variable and function names

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all hooks pass
4. Write meaningful commit messages
5. Push and create a pull request
6. Wait for CI checks to pass
7. Request a review

## Questions?

Feel free to open an issue for any questions or concerns.
