---
name: input-validation
description: All request bodies must be validated with Zod before processing
---

# Input Validation

Every route that accepts a request body must validate it with a Zod schema before passing data to business logic. Validation errors must be returned as structured 400 responses.

## Requirements

1. Define a Zod schema for every request body
2. Parse the body with `.safeParse()` — do not use `.parse()` (throws unhandled exceptions)
3. Return `400` with `{ error: { code: "VALIDATION_ERROR", message: string, fields: ZodError.flatten() } }` on failure
4. Pass only the validated, typed data to downstream logic — never use `req.body` directly after validation

## Example

```ts
import { z } from "zod";

const CreateTodoSchema = z.object({
  title: z.string().min(1).max(255),
  done: z.boolean().optional().default(false),
});

router.post("/todos", authenticate, (req, res) => {
  const result = CreateTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        fields: result.error.flatten(),
      },
    });
  }

  const { title, done } = result.data; // typed and safe
  // ...
});
```
