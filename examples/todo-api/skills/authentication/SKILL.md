---
name: authentication
description: Every endpoint must verify the Bearer token before processing the request
---

# Authentication

Every route must authenticate the incoming request by verifying the `Authorization: Bearer <token>` header. Unauthenticated requests must be rejected with HTTP 401 before any business logic runs.

## Requirements

1. Extract the Bearer token from the `Authorization` header on every route
2. Verify the token using `verifyToken()` from `@internal/auth`
3. Attach the resolved `user` object to `req.user` for downstream handlers
4. Return `401` with `{ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }` if the token is missing or invalid
5. Apply authentication to **all** routes — no exceptions

## Example

```ts
import { verifyToken } from "@internal/auth";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } });
  }

  const user = await verifyToken(header.slice(7));
  if (!user) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } });
  }

  req.user = user;
  next();
}

// Apply to all routes
router.use(authenticate);
```
