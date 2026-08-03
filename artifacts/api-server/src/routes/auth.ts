import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Simple password check (demo: password == "password" for all users)
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || password !== "password") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  // Store session in cookie (simple, no JWT needed for demo)
  res.cookie("userId", String(user.id), { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  const responseUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role as "director" | "zavuch" | "teacher" | "student" | "parent",
    email: user.email ?? null,
    phone: user.phone ?? null,
    classId: user.classId ?? null,
    parentId: user.parentId ?? null,
    subjectIds: [],
    createdAt: user.createdAt.toISOString(),
  };
  const result = LoginResponse.safeParse({ user: responseUser });
  if (!result.success) {
    res.json({ user: responseUser });
    return;
  }
  res.json(result.data);
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  res.clearCookie("userId");
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const rawUserId = req.cookies?.userId;
  if (!rawUserId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = parseInt(rawUserId, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const responseUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role as "director" | "zavuch" | "teacher" | "student" | "parent",
    email: user.email ?? null,
    phone: user.phone ?? null,
    classId: user.classId ?? null,
    parentId: user.parentId ?? null,
    subjectIds: [],
    createdAt: user.createdAt.toISOString(),
  };
  res.json(GetMeResponse.parse(responseUser));
});

export default router;
