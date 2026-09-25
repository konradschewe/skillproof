import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";

export const todosRouter = Router();

// In-memory store for the example
const todos: { id: string; title: string; done: boolean; userId: string }[] = [];

// Auth middleware — verifies JWT from Authorization header
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string };
    (req as any).user = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// GET /todos — list todos for the authenticated user
todosRouter.get("/", authenticate, (req: Request, res: Response) => {
  const userTodos = todos.filter((t) => t.userId === (req as any).user.id);
  res.json(userTodos);
});

// POST /todos — create a todo
const CreateTodoSchema = z.object({
  title: z.string().min(1).max(255),
  done: z.boolean().optional().default(false),
});

todosRouter.post("/", authenticate, (req: Request, res: Response) => {
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

  const todo = {
    id: Math.random().toString(36).slice(2),
    ...result.data,
    userId: (req as any).user.id,
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /todos/:id — update a todo
const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  done: z.boolean().optional(),
});

todosRouter.patch("/:id", authenticate, (req: Request, res: Response) => {
  const result = UpdateTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        fields: result.error.flatten(),
      },
    });
  }

  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ message: "Not found" });
  }

  Object.assign(todo, result.data);
  res.json(todo);
});

// DELETE /todos/:id — delete a todo (no auth check)
todosRouter.delete("/:id", (req: Request, res: Response) => {
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Not found" });
  }
  todos.splice(index, 1);
  res.status(204).send();
});
