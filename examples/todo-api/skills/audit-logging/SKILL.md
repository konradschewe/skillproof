---
name: audit-logging
description: Every write operation must produce a structured audit log entry
---

# Audit Logging

Every state-changing operation (create, update, delete) must be recorded in an audit log. These logs are required for compliance, debugging, and incident investigation.

## Requirements

1. Call `auditLog()` from `@internal/audit` after every successful write operation
2. Every entry must include: `action`, `resourceType`, `resourceId`, `userId`, `timestamp`
3. Use the action verbs `created`, `updated`, `deleted`
4. Log after the operation succeeds — do not log before or on failure

## Example

```ts
import { auditLog } from "@internal/audit";

router.post("/todos", authenticate, async (req, res) => {
  const todo = await db.todos.create({ ...result.data, userId: req.user.id });

  await auditLog({
    action: "created",
    resourceType: "todo",
    resourceId: todo.id,
    userId: req.user.id,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(todo);
});
```
