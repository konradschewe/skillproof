import { config } from "./config.js";
import { NotFoundError } from "./errors.js";

function handleRequest(method: string, path: string) {
  if (path === "/health") {
    return { status: 200, body: { ok: true } };
  }
  if (path.startsWith("/items/")) {
    const id = path.split("/")[2];
    if (!id) throw new NotFoundError("item");
    return { status: 200, body: { id } };
  }
  throw new NotFoundError(path);
}

console.log(`Starting on port ${config.port}`);
