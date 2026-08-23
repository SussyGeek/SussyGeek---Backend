import express from "express";
import validate from "../../middlewares/validation.middleware";
import { rateLimit } from "../../middlewares/rateLimit.middleware";
import { RATE_LIMITS } from "../../config/ratelimit";
import ContributionValidator from "./contribution.validator";
import { handleAuth } from "../../middlewares/auth.middleware";
import ContributionController from "./contribution.controller";
import ContributionMiddlewares from "./contribution.middleware";


const router = express.Router();

router.get('/get/institute/:instituteId',
    rateLimit(RATE_LIMITS.CONTRIBUTION_READ),
    validate(ContributionValidator.getInstituteContributions),
    ContributionController.getInstituteContributions
);

router.use(rateLimit(RATE_LIMITS.HANDLE_AUTH));
router.use(handleAuth);

router.get('/get/user/:username',
    rateLimit(RATE_LIMITS.CONTRIBUTION_READ),
    validate(ContributionValidator.getUserContributions),
    ContributionController.getUserContributions
);
router.get('/get/both/:instituteId/:username',
    rateLimit(RATE_LIMITS.CONTRIBUTION_READ),
    validate(ContributionValidator.getUserAndInstContributions),
    ContributionController.getUserAndInstContributions
);
router.post('/send/batch',
    rateLimit(RATE_LIMITS.CONTRIBUTION_BATCH),
    validate(ContributionValidator.batchInput),
    ContributionMiddlewares.preventMultiple,
    ContributionController.handleContributions,
    ContributionMiddlewares.validateBatch,
    ContributionController.handleBatchPublication
);
router.patch('/stop/:instituteId',
    rateLimit(RATE_LIMITS.CONTRIBUTION_STOP),
    validate(ContributionValidator.stopContrubtion),
    ContributionController.stopContribution
);

export default router;