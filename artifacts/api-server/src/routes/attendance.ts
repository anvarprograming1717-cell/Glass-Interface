import { Router, type IRouter } from "express";
import { db, attendanceTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListAttendanceQueryParams,
  CreateAttendanceBody,
  UpdateAttendanceParams,
  UpdateAttendanceBody,
  ListAttendanceResponse,
  CreateAttendanceResponse,
  UpdateAttendanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichAttendance(att: typeof attendanceTable.$inferSelect) {
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, att.studentId));
  return {
    id: att.id,
    studentId: att.studentId,
    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
    classId: att.classId,
    date: att.date,
    status: att.status as "present" | "absent" | "late" | "excused",
    note: att.note ?? null,
    createdAt: att.createdAt.toISOString(),
  };
}

router.get("/attendance", async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions = [];
  if (params.data.studentId) conditions.push(eq(attendanceTable.studentId, params.data.studentId));
  if (params.data.classId) conditions.push(eq(attendanceTable.classId, params.data.classId));
  if (params.data.date) {
    const dateStr = params.data.date instanceof Date
      ? (params.data.date as Date).toISOString().split("T")[0]
      : String(params.data.date);
    conditions.push(eq(attendanceTable.date, dateStr));
  }
  let query = db.select().from(attendanceTable).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  const records = await query;
  const enriched = await Promise.all(records.map(enrichAttendance));
  res.json(ListAttendanceResponse.parse(enriched));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = CreateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const dateStr = parsed.data.date instanceof Date
    ? (parsed.data.date as Date).toISOString().split("T")[0]
    : String(parsed.data.date);
  const [att] = await db.insert(attendanceTable).values({
    studentId: parsed.data.studentId,
    classId: parsed.data.classId,
    date: dateStr,
    status: parsed.data.status,
    note: parsed.data.note ?? undefined,
  }).returning();
  const enriched = await enrichAttendance(att);
  res.status(201).json(CreateAttendanceResponse.parse(enriched));
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const params = UpdateAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.note != null) updateData.note = parsed.data.note;
  const [att] = await db.update(attendanceTable).set(updateData).where(eq(attendanceTable.id, params.data.id)).returning();
  if (!att) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }
  const enriched = await enrichAttendance(att);
  res.json(UpdateAttendanceResponse.parse(enriched));
});

export default router;
