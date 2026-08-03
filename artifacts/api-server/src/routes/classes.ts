import { Router, type IRouter } from "express";
import { db, classesTable, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateClassBody,
  GetClassParams,
  UpdateClassParams,
  UpdateClassBody,
  DeleteClassParams,
  ListClassesResponse,
  CreateClassResponse,
  GetClassResponse,
  UpdateClassResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function classWithCount(classId: number) {
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) return null;
  const [{ value: studentCount }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.classId, classId));
  return {
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    teacherId: cls.teacherId ?? null,
    studentCount: Number(studentCount),
    createdAt: cls.createdAt.toISOString(),
  };
}

router.get("/classes", async (req, res): Promise<void> => {
  const classes = await db.select().from(classesTable);
  const result = await Promise.all(classes.map(async (cls) => {
    const [{ value: studentCount }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.classId, cls.id));
    return {
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      teacherId: cls.teacherId ?? null,
      studentCount: Number(studentCount),
      createdAt: cls.createdAt.toISOString(),
    };
  }));
  res.json(ListClassesResponse.parse(result));
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cls] = await db.insert(classesTable).values({
    name: parsed.data.name,
    grade: parsed.data.grade,
    teacherId: parsed.data.teacherId ?? undefined,
  }).returning();
  const result = await classWithCount(cls.id);
  res.status(201).json(CreateClassResponse.parse(result));
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const params = GetClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await classWithCount(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  res.json(GetClassResponse.parse(result));
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const params = UpdateClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.grade) updateData.grade = parsed.data.grade;
  if (parsed.data.teacherId) updateData.teacherId = parsed.data.teacherId;
  await db.update(classesTable).set(updateData).where(eq(classesTable.id, params.data.id));
  const result = await classWithCount(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  res.json(UpdateClassResponse.parse(result));
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const params = DeleteClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(classesTable).where(eq(classesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
