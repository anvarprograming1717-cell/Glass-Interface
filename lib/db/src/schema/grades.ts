import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradesTable = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  classId: integer("class_id"),
  value: integer("value").notNull(), // 1-5
  type: text("type").notNull().default("daily"), // daily | quarter | annual | test
  comment: text("comment"),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGradeSchema = createInsertSchema(gradesTable).omit({ id: true, createdAt: true });
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof gradesTable.$inferSelect;
