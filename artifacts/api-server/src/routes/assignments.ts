import { Router, type IRouter } from "express";
import { db, assignmentsTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListAssignmentsQueryParams,
  CreateAssignmentBody,
  GetAssignmentParams,
  UpdateAssignmentParams,
  UpdateAssignmentBody,
  DeleteAssignmentParams,
  ListAssignmentsResponse,
  CreateAssignmentResponse,
  GetAssignmentResponse,
  UpdateAssignmentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichAssignment(a: typeof assignmentsTable.$inferSelect) {
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, a.subjectId));
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? null,
    subjectId: a.subjectId,
    subjectName: subject?.name ?? "Unknown",
    teacherId: a.teacherId,
    classId: a.classId,
    dueDate: a.dueDate,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/assignments", async (req, res): Promise<void> => {
  const params = ListAssignmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions = [];
  if (params.data.classId) conditions.push(eq(assignmentsTable.classId, params.data.classId));
  if (params.data.subjectId) conditions.push(eq(assignmentsTable.subjectId, params.data.subjectId));
  if (params.data.teacherId) conditions.push(eq(assignmentsTable.teacherId, params.data.teacherId));
  let query = db.select().from(assignmentsTable).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  const records = await query;
  const enriched = await Promise.all(records.map(enrichAssignment));
  res.json(ListAssignmentsResponse.parse(enriched));
});

router.post("/assignments", async (req, res): Promise<void> => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const dueDateStr = parsed.data.dueDate instanceof Date
    ? (parsed.data.dueDate as Date).toISOString().split("T")[0]
    : String(parsed.data.dueDate);
  const [a] = await db.insert(assignmentsTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? undefined,
    subjectId: parsed.data.subjectId,
    teacherId: parsed.data.teacherId,
    classId: parsed.data.classId,
    dueDate: dueDateStr,
  }).returning();
  const enriched = await enrichAssignment(a);
  res.status(201).json(CreateAssignmentResponse.parse(enriched));
});

router.get("/assignments/:id", async (req, res): Promise<void> => {
  const params = GetAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [a] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, params.data.id));
  if (!a) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }
  const enriched = await enrichAssignment(a);
  res.json(GetAssignmentResponse.parse(enriched));
});

router.patch("/assignments/:id", async (req, res): Promise<void> => {
  const params = UpdateAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  if (parsed.data.dueDate) updateData.dueDate = parsed.data.dueDate;
  const [a] = await db.update(assignmentsTable).set(updateData).where(eq(assignmentsTable.id, params.data.id)).returning();
  if (!a) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }
  const enriched = await enrichAssignment(a);
  res.json(UpdateAssignmentResponse.parse(enriched));
});

router.delete("/assignments/:id", async (req, res): Promise<void> => {
  const params = DeleteAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
