import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: integer("subject_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  classId: integer("class_id").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ id: true, createdAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;
