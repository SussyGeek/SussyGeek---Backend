import express from "express";
import validate from "../../middlewares/validation.middleware";
import MetaValidator from "./meta.validators";
import MetaController from "./meta.controller";

const router = express.Router();

router.get('/counters/:field',
    validate(MetaValidator.getCounters),
    MetaController.getCounters
);

export default router;