import express from "express";
import { resetActiveScrapper } from "../../controllers/dev/contributionControllerDev";

const router = express.Router();

router.post("/resetInstScrapper", resetActiveScrapper);

export default router;