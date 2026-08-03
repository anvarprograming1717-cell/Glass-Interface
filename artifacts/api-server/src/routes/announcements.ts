import { Router, type IRouter } from "express";
import { db, announcementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListAnnouncementsQueryParams,
  CreateAnnouncementBody,
  GetAnnouncementParams,
  UpdateAnnouncementParams,
  UpdateAnnouncementBody,
  DeleteAnnouncementParams,
  ListAnnouncementsResponse,
  CreateAnnouncementResponse,
  GetAnnouncementResponse,
  UpdateAnnouncementResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichAnnouncement(a: typeof announcementsTable.$inferSelect) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, a.authorId));
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    authorId: a.authorId,
    authorName: author ? `${author.firstName} ${author.lastName}` : "Unknown",
    classId: a.classId ?? null,
    priority: a.priority as "normal" | "high" | "urgent",
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/announcements", async (req, res): Promise<void> => {
  const params = ListAnnouncementsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let query = db.select().from(announcementsTable).$dynamic();
  if (params.data.classId) {
    query = query.where(eq(announcementsTable.classId, params.data.classId));
  }
  const records = await query.orderBy(announcementsTable.createdAt);
  const enriched = await Promise.all(records.map(enrichAnnouncement));
  res.json(ListAnnouncementsResponse.parse(enriched));
});

router.post("/announcements", async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [a] = await db.insert(announcementsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    authorId: parsed.data.authorId,
    classId: parsed.data.classId ?? undefined,
    priority: parsed.data.priority ?? "normal",
  }).returning();
  const enriched = await enrichAnnouncement(a);
  res.status(201).json(CreateAnnouncementResponse.parse(enriched));
});

router.get("/announcements/:id", async (req, res): Promise<void> => {
  const params = GetAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [a] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, params.data.id));
  if (!a) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  const enriched = await enrichAnnouncement(a);
  res.json(GetAnnouncementResponse.parse(enriched));
});

router.patch("/announcements/:id", async (req, res): Promise<void> => {
  const params = UpdateAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.content) updateData.content = parsed.data.content;
  if (parsed.data.priority) updateData.priority = parsed.data.priority;
  const [a] = await db.update(announcementsTable).set(updateData).where(eq(announcementsTable.id, params.data.id)).returning();
  if (!a) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  const enriched = await enrichAnnouncement(a);
  res.json(UpdateAnnouncementResponse.parse(enriched));
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
