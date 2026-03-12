import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.ADMIN_JWT_SECRET!);
    (req as Request & { admin: unknown }).admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
}
