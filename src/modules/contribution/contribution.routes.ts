import express from "express";
import validate from "../../middlewares/validation.middleware";
import ContributionValidator from "./contribution.validator";
import { initializeFields } from "../../middlewares/fields.middleware";
import { handleAuth } from "../../middlewares/auth.middleware";
import ContributionController from "./contribution.controller";
import ContributionMiddlewares from "./contribution.middleware";


const router = express.Router();
router.use(initializeFields);

router.get('/get/institute/:instituteId',
    validate(ContributionValidator.getInstituteContributions),
    ContributionController.getInstituteContributions
);

router.use(handleAuth);

router.get('/get/user/:username',
    validate(ContributionValidator.getUserContributions),
    ContributionController.getUserContributions
);
router.get('/get/both/:instituteId/:username',
    validate(ContributionValidator.getUserAndInstContributions),
    ContributionController.getUserAndInstContributions
);
router.post('/send/batch',
    validate(ContributionValidator.batchInput),
    ContributionMiddlewares.preventMultiple,
    ContributionController.handleContributions,
    ContributionMiddlewares.validateBatch,
    ContributionController.handleBatchPublication
);
router.patch('/stop/:instituteId',
    validate(ContributionValidator.stopContrubtion),
    ContributionController.stopContribution
);

export default router;