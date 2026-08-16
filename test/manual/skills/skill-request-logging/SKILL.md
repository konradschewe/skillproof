---
name: skill-request-logging
description: Structured HTTP request/response logging middleware
---

# Request Logging Middleware

Every incoming HTTP request must be logged in structured JSON format before the handler runs, and again after the response is sent.

## Requirements

1. Implement a middleware function that runs for every request
2. Log request details **before** the handler: `{ event: "request", method, path }`
3. Log response details **after** the handler: `{ event: "response", method, path, statusCode, durationMs }`
4. Measure and include `durationMs` using `Date.now()` or `performance.now()`
5. Use `console.log(JSON.stringify({ ... }))` for structured output

## Example

```ts
function requestLogger(req, res, next) {
  const start = Date.now();
  console.log(JSON.stringify({ event: "request", method: req.method, path: req.path }));
  res.on("finish", () => {
    console.log(JSON.stringify({
      event: "response",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    }));
  });
  next();
}

app.use(requestLogger);
```
