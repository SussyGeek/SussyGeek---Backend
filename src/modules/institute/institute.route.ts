import express from 'express';
import validate from '../../middlewares/validation.middleware';
import { rateLimit } from '../../middlewares/rateLimit.middleware';
import { RATE_LIMITS } from '../../config/ratelimit';
import { InstituteValidator } from './institute.validator';
import instituteController from './institute.controller';

const router = express.Router();

router.get('/list',
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(InstituteValidator.getInstitute),
    instituteController.getInstitute
);
router.get('/search',
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(InstituteValidator.searchInstitutes),
    instituteController.searchInstitutes
);
router.get('/availability/:instituteId',
    rateLimit(RATE_LIMITS.DATA_FETCH),
    validate(InstituteValidator.findAvailability),
    instituteController.findAvailabilityById
);


// This is anti architectural as we'll only update student count when frozen list is fully scrapped -- NEW COMMENT
// This is dev route, considering above ^^
router.patch('/update/:id/total_students',
    rateLimit(RATE_LIMITS.DEV_MUTATION),
    validate(InstituteValidator.updateTotalStudents),
    instituteController.updateStudentScores
);

export default router;