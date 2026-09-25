# Example: Todo API

A platform team distributes backend standards as skills. A consumer team builds a Todo REST API using a coding agent — Skillproof runs in CI to verify conformance.

## The scenario

```
Platform Team
      │
      │  publishes skills
      ▼
skills/
  authentication/     Verify Bearer token on every route
  authorization/      Users may only access their own resources
  input-validation/   Validate all request bodies with Zod
  audit-logging/      Structured log for every write operation
  error-responses/    Consistent { error: { code, message } } shape
      │
      │  coding agent implements the API
      ▼
todo-service/
  src/
    app.ts       Express app setup
    todos.ts     CRUD routes for todos
```

## Expected results

| Skill | Expected | Why |
|---|---|---|
| `input-validation` | ✅ adopted | `POST /todos` and `PATCH /todos/:id` both use Zod `.safeParse()` with correct 400 responses |
| `error-responses` | 🔵 divergent | Validation errors follow the correct shape, but 401 and 404 errors return `{ message }` instead of `{ error: { code, message } }` |
| `authentication` | ⚠️ partial | `GET`, `POST`, and `PATCH` routes verify the Bearer token — but `DELETE /todos/:id` has no `authenticate` middleware at all |
| `authorization` | ❌ missing | No ownership check anywhere — any authenticated user can modify or delete any todo |
| `audit-logging` | ❌ missing | No calls to `auditLog()` — write operations are not recorded |

## Running

```bash
export ANTHROPIC_API_KEY=sk-ant-...

npx @skillproof/cli \
  --config examples/todo-api/skillproof.json
```

### Single skill

```bash
npx @skillproof/cli \
  --config examples/todo-api/skillproof.json \
  --filter authentication
```

### HTML report

```bash
npx @skillproof/cli \
  --config examples/todo-api/skillproof.json \
  --output-format html \
  --output-file /tmp/report.html
```
