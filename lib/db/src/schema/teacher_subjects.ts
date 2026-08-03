import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";

export const teacherSubjectsTable = pgTable("teacher_subjects", {
  teacherId: integer("teacher_id").notNull(),
  subjectId: integer("subject_id").notNull(),
}, (t) => [
  primaryKey({ columns: [t.teacherId, t.subjectId] }),
]);
