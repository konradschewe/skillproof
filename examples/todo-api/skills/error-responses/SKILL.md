---
name: error-responses
description: All error responses must follow the standard { error: { code, message } } shape
---

# Error Responses

All error responses must follow a consistent structure so clients can handle them predictably.

## Requirements

1. Every error response body must be `{ error: { code: string, message: string } }`
2. `code` is a SCREAMING_SNAKE_CASE string identifying the error type (e.g. `NOT_FOUND`, `VALIDATION_ERROR`)
3. `message` is a human-readable description safe to display
4. Never return raw error objects, stack traces, or plain strings as the response body
5. Use the appropriate HTTP status code for the error type

## Example

```ts
// ✅ correct
res.status(404).json({ error: { code: "NOT_FOUND", message: "Todo not found" } });
res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Title is required" } });
res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });

// ❌ wrong
res.status(404).json({ message: "Not found" });
res.status(400).send("Bad request");
res.status(500).json(err);
```
