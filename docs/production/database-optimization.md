# Database Optimization

## 1. Indexing

Create indexes on columns used in WHERE, ORDER BY, or JOIN clauses:

```sql
-- Without index: ~500ms at 100k rows
SELECT * FROM tasks WHERE user_id = 'abc123' ORDER BY created_at DESC;

-- After creating index: <10ms
CREATE INDEX idx_tasks_user_id_created ON tasks(user_id, created_at DESC);
```

**Rule of thumb:** If a column appears in WHERE or ORDER BY and the table will have >1000 rows, add an index.

Always include indexes in your migration SQL alongside CREATE TABLE.

## 2. Avoid N+1 Queries

The most common performance problem with ORMs and query builders:

```typescript
// Bad: N+1 (1 query for users + N queries for tasks)
const { rows: users } = await db.query('SELECT * FROM users')
for (const user of users) {
  const { rows: tasks } = await db.query(
    'SELECT * FROM tasks WHERE user_id = $1', [user.id]
  )
}

// Good: Single query with join (1 query total)
const { rows } = await db.query(`
  SELECT u.*, json_agg(t.*) AS tasks
  FROM users u
  LEFT JOIN tasks t ON t.user_id = u.id
  GROUP BY u.id
`)
```

## 3. Always Limit Results

Never return unbounded results from the database:

```typescript
// Bad: Returns ALL rows
const { rows } = await db.query('SELECT * FROM tasks')

// Good: Returns max 50 rows
const { rows } = await db.query('SELECT * FROM tasks LIMIT 50')

// Better: Paginated
const { rows } = await db.query(
  'SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50 OFFSET 0'
)
```

## 4. Caching Strategy

For data that changes rarely (dashboard stats, config, categories):

```typescript
import { unstable_cache } from 'next/cache'

export const getCategories = unstable_cache(
  async () => {
    const { rows } = await db.query('SELECT * FROM categories')
    return rows
  },
  ['categories'],          // Cache key
  { revalidate: 3600 }    // Refresh every hour
)
```

**When to cache:**
- Data that changes less than once per hour
- Expensive aggregation queries
- Data shared across all users (not user-specific)

**When NOT to cache:**
- User-specific data that changes frequently
- Real-time data (use WebSocket or polling instead)

## 5. Select Only What You Need

```typescript
// Bad: Fetches all columns
const { rows } = await db.query('SELECT * FROM users')

// Good: Fetches only needed columns
const { rows } = await db.query('SELECT id, name, avatar_url FROM users')
```
