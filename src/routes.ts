import express from "express";
import instituteRoutes from "./modules/institute/institute.route";
import contributionRoutes from "./modules/contribution/contribution.routes";
import metaRoutes from "./modules/meta/meta.routes";
import userRoutes from "./modules/user/user.route";
import studentRoutes from "./modules/student/student.routes";

const router = express.Router();

router.use('/institute', instituteRoutes);
router.use('/metadata', metaRoutes);
router.use('/user', userRoutes);
router.use('/contribute', contributionRoutes);
router.use('/student', studentRoutes);

export default router;