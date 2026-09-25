---
name: authorization
description: Users may only read and modify their own resources
---

# Authorization

After authentication, every route that reads or modifies a resource must verify that the requesting user owns that resource. Returning another user's data or allowing cross-user modifications is a critical security flaw.

## Requirements

1. After loading a resource, check that `resource.userId === req.user.id`
2. Return `404` (not `403`) when the resource does not belong to the requesting user — do not confirm the resource exists to unauthorized callers
3. Apply the ownership check in every handler that accesses a specific resource by ID

## Example

```ts
router.get("/todos/:id", authenticate, async (req, res) => {
  const todo = await db.todos.findById(req.params.id);

  // Return 404 regardless of whether the todo exists or belongs to someone else
  if (!todo || todo.userId !== req.user.id) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Todo not found" } });
  }

  res.json(todo);
});
```
