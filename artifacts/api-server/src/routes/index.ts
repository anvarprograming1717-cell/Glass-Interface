import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import classesRouter from "./classes";
import subjectsRouter from "./subjects";
import gradesRouter from "./grades";
import attendanceRouter from "./attendance";
import assignmentsRouter from "./assignments";
import announcementsRouter from "./announcements";
import notificationsRouter from "./notifications";
import messagesRouter from "./messages";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(classesRouter);
router.use(subjectsRouter);
router.use(gradesRouter);
router.use(attendanceRouter);
router.use(assignmentsRouter);
router.use(announcementsRouter);
router.use(notificationsRouter);
router.use(messagesRouter);
router.use(dashboardRouter);

export default router;
