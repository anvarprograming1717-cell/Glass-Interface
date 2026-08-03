import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  MarkNotificationReadParams,
  ListNotificationsResponse,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type as "grade" | "attendance" | "announcement" | "message" | "warning" | "assignment",
    title: n.title,
    body: n.body ?? null,
    isRead: n.isRead,
    relatedId: n.relatedId ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  // For demo: use userId from cookie or default to 1
  const rawUserId = req.cookies?.userId ?? "1";
  const userId = parseInt(rawUserId, 10);
  const records = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(notificationsTable.createdAt);
  res.json(ListNotificationsResponse.parse(records.map(formatNotification)));
});

// This route must come before /:id/read to avoid conflict
router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const rawUserId = req.cookies?.userId ?? "1";
  const userId = parseInt(rawUserId, 10);
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, userId));
  res.json(MarkAllNotificationsReadResponse.parse({}));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [n] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();
  if (!n) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(formatNotification(n)));
});

export default router;
