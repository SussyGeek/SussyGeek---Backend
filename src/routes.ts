import express from "express";
import instituteRoutes from "./modules/institute/institute.route";
import contributionRoutes from "./modules/contribution/contribution.routes";
import metaRoutes from "./modules/meta/meta.routes";
import userRoutes from "./modules/user/user.route";

const router = express.Router();

router.use('/institute', instituteRoutes);
router.use('/metadata', metaRoutes);
router.use('/user', userRoutes);
router.use('/contribute', contributionRoutes);

export default router;