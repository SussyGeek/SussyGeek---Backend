import express from "express";
import validate from "../../middlewares/validation.middleware";
import { rateLimit } from "../../middlewares/rateLimit.middleware";
import { RATE_LIMITS } from "../../config/ratelimit";
import MetaValidator from "./meta.validators";
import MetaController from "./meta.controller";

const router = express.Router();

router.get('/counters/:field',
    rateLimit(RATE_LIMITS.META_COUNTERS),
    validate(MetaValidator.getCounters),
    MetaController.getCounters
);

export default router;