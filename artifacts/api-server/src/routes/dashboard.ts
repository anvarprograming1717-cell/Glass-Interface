import { Router, type IRouter } from "express";
import { db, usersTable, classesTable, gradesTable, attendanceTable, assignmentsTable, notificationsTable, activityLogTable, predictionsTable, subjectsTable } from "@workspace/db";
import { eq, count, avg, desc, gte } from "drizzle-orm";
import {
  GetWeeklySummaryQueryParams,
  GetGradeStatsQueryParams,
  GetDashboardStatsResponse,
  GetRecentActivityResponse,
  GetPredictionsResponse,
  GetWeeklySummaryResponse,
  GetGradeStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const rawUserId = req.cookies?.userId ?? "1";
  const userId = parseInt(rawUserId, 10);

  const [{ value: totalStudents }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.role, "student"));
  const [{ value: totalTeachers }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.role, "teacher"));
  const [{ value: totalClasses }] = await db.select({ value: count() }).from(classesTable);
  const [{ value: avgGrade }] = await db.select({ value: avg(gradesTable.value) }).from(gradesTable);
  const [{ value: activeAssignments }] = await db.select({ value: count() }).from(assignmentsTable);
  const [{ value: unreadNotifications }] = await db.select({ value: count() }).from(notificationsTable).where(eq(notificationsTable.userId, userId));

  const attendanceRecords = await db.select().from(attendanceTable);
  const presentCount = attendanceRecords.filter(a => a.status === "present").length;
  const attendanceRate = attendanceRecords.length > 0 ? (presentCount / attendanceRecords.length) * 100 : 100;

  const subjects = await db.select().from(subjectsTable);
  const gradesBySubject = await Promise.all(subjects.slice(0, 6).map(async (s) => {
    const [{ value: subjectAvg }] = await db.select({ value: avg(gradesTable.value) }).from(gradesTable).where(eq(gradesTable.subjectId, s.id));
    return {
      subjectId: s.id,
      subjectName: s.name,
      average: Number(subjectAvg ?? 0),
    };
  }));

  const stats = {
    totalStudents: Number(totalStudents),
    totalTeachers: Number(totalTeachers),
    totalClasses: Number(totalClasses),
    averageGrade: Number(avgGrade ?? 0),
    attendanceRate: Math.round(attendanceRate),
    activeAssignments: Number(activeAssignments),
    unreadNotifications: Number(unreadNotifications),
    gradesBySubject: gradesBySubject.filter(g => g.average > 0),
  };
  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const records = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.createdAt)).limit(20);
  const result = records.map(r => ({
    id: r.id,
    type: r.type as "grade" | "attendance" | "assignment" | "announcement" | "message",
    description: r.description,
    actorName: r.actorName ?? "",
    relatedId: r.relatedId ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
  res.json(GetRecentActivityResponse.parse(result));
});

router.get("/dashboard/predictions", async (req, res): Promise<void> => {
  const records = await db.select().from(predictionsTable).orderBy(desc(predictionsTable.createdAt)).limit(20);
  const enriched = await Promise.all(records.map(async (p) => {
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, p.studentId));
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, p.classId));
    const subjectData = p.subjectId
      ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, p.subjectId)).then(r => r[0])
      : null;
    return {
      id: p.id,
      studentId: p.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      classId: p.classId,
      className: cls?.name ?? "Unknown",
      subjectId: p.subjectId ?? null,
      subjectName: subjectData?.name ?? null,
      type: p.type as "grade_drop" | "attendance_issue" | "homework_missing",
      severity: p.severity as "low" | "medium" | "high",
      description: p.description,
      createdAt: p.createdAt.toISOString(),
    };
  }));
  res.json(GetPredictionsResponse.parse(enriched));
});

router.get("/dashboard/weekly-summary", async (req, res): Promise<void> => {
  const params = GetWeeklySummaryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rawUserId = req.cookies?.userId ?? "4";
  const studentId = params.data.studentId ?? parseInt(rawUserId, 10);
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const recentGrades = await db.select().from(gradesTable)
    .where(eq(gradesTable.studentId, studentId))
    .orderBy(desc(gradesTable.createdAt))
    .limit(10);

  const avgGrade = recentGrades.length > 0
    ? recentGrades.reduce((s, g) => s + g.value, 0) / recentGrades.length
    : 0;

  const recentAttendance = await db.select().from(attendanceTable)
    .where(eq(attendanceTable.studentId, studentId))
    .orderBy(desc(attendanceTable.createdAt))
    .limit(7);
  const absences = recentAttendance.filter(a => a.status === "absent").length;

  const assignments = await db.select().from(assignmentsTable)
    .where(gte(assignmentsTable.dueDate, weekStartStr))
    .limit(5);

  const subjects = await db.select().from(subjectsTable);
  const highlights = await Promise.all(subjects.slice(0, 3).map(async (s) => {
    const subjectGrades = await db.select().from(gradesTable)
      .where(eq(gradesTable.subjectId, s.id))
      .orderBy(desc(gradesTable.createdAt))
      .limit(5);
    const avg = subjectGrades.length > 0
      ? subjectGrades.reduce((acc, g) => acc + g.value, 0) / subjectGrades.length
      : 0;
    const status: "improving" | "stable" | "declining" = avg >= 4 ? "improving" : avg >= 3 ? "stable" : "declining";
    const note = status === "improving"
      ? `${s.name} fanida yaxshi natija ko'rsatyapti`
      : status === "declining"
        ? `${s.name} fanida qo'shimcha e'tibor kerak`
        : `${s.name} fanida barqaror`;
    return { subjectName: s.name, status, note };
  }));

  const summary = absences > 2
    ? `${student.firstName} bu hafta ${absences} darsdan qoldi. O'zlashtirish darajasiga e'tibor berilishi kerak.`
    : avgGrade >= 4
      ? `${student.firstName} bu hafta yaxshi natija ko'rsatdi. O'zlashtirish darajasi yuqori.`
      : `${student.firstName} bu hafta barqaror o'qidi. Ba'zi fanlardan qo'shimcha mashq tavsiya etiladi.`;

  const result = {
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    summary,
    gradesThisWeek: recentGrades.length,
    absencesThisWeek: absences,
    assignmentsDue: assignments.length,
    averageGrade: Math.round(avgGrade * 10) / 10,
    subjectHighlights: highlights,
  };
  res.json(GetWeeklySummaryResponse.parse(result));
});

router.get("/dashboard/grade-stats", async (req, res): Promise<void> => {
  const params = GetGradeStatsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let query = db.select().from(gradesTable).$dynamic();
  if (params.data.classId) query = query.where(eq(gradesTable.classId, params.data.classId));
  if (params.data.subjectId) query = query.where(eq(gradesTable.subjectId, params.data.subjectId));
  const grades = await query;

  if (grades.length === 0) {
    res.json(GetGradeStatsResponse.parse([]));
    return;
  }

  // Group by subject
  const bySubject: Record<number, number[]> = {};
  for (const g of grades) {
    if (!bySubject[g.subjectId]) bySubject[g.subjectId] = [];
    bySubject[g.subjectId].push(g.value);
  }

  const result = await Promise.all(Object.entries(bySubject).map(async ([subjectId, values]) => {
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, parseInt(subjectId)));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const distribution = [1, 2, 3, 4, 5].map(v => ({
      value: v,
      count: values.filter(x => x === v).length,
    }));
    return {
      label: subject?.name ?? `Fan ${subjectId}`,
      average: Math.round(avg * 10) / 10,
      count: values.length,
      distribution,
    };
  }));

  res.json(GetGradeStatsResponse.parse(result));
});

export default router;
