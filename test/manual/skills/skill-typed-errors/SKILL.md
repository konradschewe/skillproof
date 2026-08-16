---
name: skill-typed-errors
description: Typed application error hierarchy with HTTP status codes
---

# Typed Application Errors

All application errors must use a typed hierarchy rooted at a base `AppError` class. Each subclass must carry an HTTP status code.

## Requirements

1. Define a base `AppError` class that extends `Error` with a `code: string` property
2. Each concrete error subtype must have a `statusCode: number` property
3. At minimum, implement: `NotFoundError` (404), `ValidationError` (400), `UnauthorizedError` (401)
4. Error handler middleware reads `err.statusCode` to set the HTTP response status

## Example

```ts
export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  constructor() {
    super("Unauthorized", "UNAUTHORIZED");
  }
}
```
