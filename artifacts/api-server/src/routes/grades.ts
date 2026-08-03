import { Router, type IRouter } from "express";
import { db, gradesTable, usersTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListGradesQueryParams,
  CreateGradeBody,
  GetGradeParams,
  UpdateGradeParams,
  UpdateGradeBody,
  DeleteGradeParams,
  ListGradesResponse,
  CreateGradeResponse,
  GetGradeResponse,
  UpdateGradeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichGrade(grade: typeof gradesTable.$inferSelect) {
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, grade.studentId));
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, grade.subjectId));
  return {
    id: grade.id,
    studentId: grade.studentId,
    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
    subjectId: grade.subjectId,
    subjectName: subject?.name ?? "Unknown",
    teacherId: grade.teacherId,
    classId: grade.classId ?? null,
    value: grade.value,
    type: grade.type as "daily" | "quarter" | "annual" | "test",
    comment: grade.comment ?? null,
    date: grade.date,
    createdAt: grade.createdAt.toISOString(),
  };
}

router.get("/grades", async (req, res): Promise<void> => {
  const params = ListGradesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions = [];
  if (params.data.studentId) conditions.push(eq(gradesTable.studentId, params.data.studentId));
  if (params.data.subjectId) conditions.push(eq(gradesTable.subjectId, params.data.subjectId));
  if (params.data.teacherId) conditions.push(eq(gradesTable.teacherId, params.data.teacherId));
  if (params.data.classId) conditions.push(eq(gradesTable.classId, params.data.classId));
  let query = db.select().from(gradesTable).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  const grades = await query;
  const enriched = await Promise.all(grades.map(enrichGrade));
  res.json(ListGradesResponse.parse(enriched));
});

router.post("/grades", async (req, res): Promise<void> => {
  const parsed = CreateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const dateStr = parsed.data.date instanceof Date
    ? parsed.data.date.toISOString().split("T")[0]
    : String(parsed.data.date);
  const [grade] = await db.insert(gradesTable).values({
    studentId: parsed.data.studentId,
    subjectId: parsed.data.subjectId,
    teacherId: parsed.data.teacherId,
    classId: parsed.data.classId ?? undefined,
    value: parsed.data.value,
    type: parsed.data.type,
    comment: parsed.data.comment ?? undefined,
    date: dateStr,
  }).returning();
  const enriched = await enrichGrade(grade);
  res.status(201).json(CreateGradeResponse.parse(enriched));
});

router.get("/grades/:id", async (req, res): Promise<void> => {
  const params = GetGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [grade] = await db.select().from(gradesTable).where(eq(gradesTable.id, params.data.id));
  if (!grade) {
    res.status(404).json({ error: "Grade not found" });
    return;
  }
  const enriched = await enrichGrade(grade);
  res.json(GetGradeResponse.parse(enriched));
});

router.patch("/grades/:id", async (req, res): Promise<void> => {
  const params = UpdateGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.value != null) updateData.value = parsed.data.value;
  if (parsed.data.comment != null) updateData.comment = parsed.data.comment;
  const [grade] = await db.update(gradesTable).set(updateData).where(eq(gradesTable.id, params.data.id)).returning();
  if (!grade) {
    res.status(404).json({ error: "Grade not found" });
    return;
  }
  const enriched = await enrichGrade(grade);
  res.json(UpdateGradeResponse.parse(enriched));
});

router.delete("/grades/:id", async (req, res): Promise<void> => {
  const params = DeleteGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(gradesTable).where(eq(gradesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
