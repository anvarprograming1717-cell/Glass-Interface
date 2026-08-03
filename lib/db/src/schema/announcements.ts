import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  classId: integer("class_id"),
  priority: text("priority").notNull().default("normal"), // normal | high | urgent
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcementsTable.$inferSelect;
