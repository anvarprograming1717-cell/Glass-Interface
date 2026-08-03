import { Router, type IRouter } from "express";
import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import {
  ListMessagesQueryParams,
  SendMessageBody,
  ListMessagesResponse,
  SendMessageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichMessage(m: typeof messagesTable.$inferSelect) {
  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, m.senderId));
  const [receiver] = await db.select().from(usersTable).where(eq(usersTable.id, m.receiverId));
  return {
    id: m.id,
    senderId: m.senderId,
    senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
    receiverId: m.receiverId,
    receiverName: receiver ? `${receiver.firstName} ${receiver.lastName}` : "Unknown",
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/messages", async (req, res): Promise<void> => {
  const params = ListMessagesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rawUserId = req.cookies?.userId ?? "1";
  const userId = parseInt(rawUserId, 10);
  let query = db.select().from(messagesTable).$dynamic();
  if (params.data.withUserId) {
    const other = params.data.withUserId;
    query = query.where(
      or(
        and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, other)),
        and(eq(messagesTable.senderId, other), eq(messagesTable.receiverId, userId))
      )
    );
  } else {
    query = query.where(or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)));
  }
  const records = await query.orderBy(messagesTable.createdAt);
  const enriched = await Promise.all(records.map(enrichMessage));
  res.json(ListMessagesResponse.parse(enriched));
});

router.post("/messages", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rawUserId = req.cookies?.userId ?? "1";
  const senderId = parseInt(rawUserId, 10);
  const [m] = await db.insert(messagesTable).values({
    senderId,
    receiverId: parsed.data.receiverId,
    content: parsed.data.content,
  }).returning();
  const enriched = await enrichMessage(m);
  res.status(201).json(SendMessageResponse.parse(enriched));
});

export default router;
