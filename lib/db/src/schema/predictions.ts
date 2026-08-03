import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  subjectId: integer("subject_id"),
  type: text("type").notNull(), // grade_drop | attendance_issue | homework_missing
  severity: text("severity").notNull().default("medium"), // low | medium | high
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
