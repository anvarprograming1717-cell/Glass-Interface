import { Router, type IRouter } from "express";
import { db, usersTable, teacherSubjectsTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
  ListUsersResponse,
  CreateUserResponse,
  GetUserResponse,
  UpdateUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getUserWithSubjects(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;
  const subjectRows = await db.select().from(teacherSubjectsTable).where(eq(teacherSubjectsTable.teacherId, userId));
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role as "director" | "zavuch" | "teacher" | "student" | "parent",
    email: user.email ?? null,
    phone: user.phone ?? null,
    classId: user.classId ?? null,
    parentId: user.parentId ?? null,
    subjectIds: subjectRows.map((r) => r.subjectId),
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let query = db.select().from(usersTable).$dynamic();
  const conditions = [];
  if (params.data.role) conditions.push(eq(usersTable.role, params.data.role));
  if (params.data.classId) conditions.push(eq(usersTable.classId, params.data.classId));
  if (params.data.search) conditions.push(ilike(usersTable.firstName, `%${params.data.search}%`));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const users = await query;
  const result = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    role: u.role as "director" | "zavuch" | "teacher" | "student" | "parent",
    email: u.email ?? null,
    phone: u.phone ?? null,
    classId: u.classId ?? null,
    parentId: u.parentId ?? null,
    subjectIds: [],
    createdAt: u.createdAt.toISOString(),
  }));
  res.json(ListUsersResponse.parse(result));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...rest } = parsed.data;
  const [user] = await db.insert(usersTable).values({
    ...rest,
    passwordHash: password, // demo: store plaintext
    classId: rest.classId ?? undefined,
    parentId: rest.parentId ?? undefined,
  }).returning();
  const result = await getUserWithSubjects(user.id);
  res.status(201).json(CreateUserResponse.parse(result));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = await getUserWithSubjects(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.firstName) updateData.firstName = parsed.data.firstName;
  if (parsed.data.lastName) updateData.lastName = parsed.data.lastName;
  if (parsed.data.email) updateData.email = parsed.data.email;
  if (parsed.data.phone) updateData.phone = parsed.data.phone;
  if (parsed.data.classId) updateData.classId = parsed.data.classId;
  await db.update(usersTable).set(updateData).where(eq(usersTable.id, params.data.id));
  const result = await getUserWithSubjects(params.data.id);
  if (!result) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateUserResponse.parse(result));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
