---
paths:
  - "src/app/api/**"
  - "src/lib/db*"
  - "src/lib/auth*"
---

# Backend Development Rules

## Database (PostgreSQL on Sevalla)
- Add indexes on columns used in WHERE, ORDER BY, and JOIN clauses
- Use foreign keys with ON DELETE CASCADE where appropriate
- Use parameterized queries to prevent SQL injection
- Use database migrations for all schema changes

## API Routes
- Validate all inputs using Zod schemas before processing
- Always check authentication: verify NextAuth session exists
- Return meaningful error messages with appropriate HTTP status codes
- Use `.limit()` / `LIMIT` on all list queries

## Query Patterns
- Use JOINs instead of N+1 query loops
- Use `unstable_cache` from Next.js for rarely-changing data
- Always handle database errors gracefully

## Security
- Never hardcode secrets in source code
- Use environment variables for all credentials
- Validate and sanitize all user input
- Use parameterized queries (never concatenate user input into SQL)
