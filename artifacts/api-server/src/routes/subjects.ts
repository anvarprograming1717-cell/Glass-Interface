import { Router, type IRouter } from "express";
import { db, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSubjectBody,
  GetSubjectParams,
  UpdateSubjectParams,
  UpdateSubjectBody,
  DeleteSubjectParams,
  ListSubjectsResponse,
  CreateSubjectResponse,
  GetSubjectResponse,
  UpdateSubjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable);
  const result = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    createdAt: s.createdAt.toISOString(),
  }));
  res.json(ListSubjectsResponse.parse(result));
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db.insert(subjectsTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? undefined,
  }).returning();
  res.status(201).json(CreateSubjectResponse.parse({
    id: subject.id,
    name: subject.name,
    description: subject.description ?? null,
    createdAt: subject.createdAt.toISOString(),
  }));
});

router.get("/subjects/:id", async (req, res): Promise<void> => {
  const params = GetSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(GetSubjectResponse.parse({
    id: subject.id,
    name: subject.name,
    description: subject.description ?? null,
    createdAt: subject.createdAt.toISOString(),
  }));
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  const [subject] = await db.update(subjectsTable).set(updateData).where(eq(subjectsTable.id, params.data.id)).returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(UpdateSubjectResponse.parse({
    id: subject.id,
    name: subject.name,
    description: subject.description ?? null,
    createdAt: subject.createdAt.toISOString(),
  }));
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
