import express from 'express';
import validate from '../../middlewares/validation.middleware';
import { InstituteValidator } from './institute.validator';
import instituteController from './institute.controller';

const router = express.Router();

router.get('/list',
    validate(InstituteValidator.getInstitute),
    instituteController.getInstitute
);
router.get('/search',
    validate(InstituteValidator.searchInstitutes),
    instituteController.searchInstitutes
);
router.get('/availability/:instituteId',
    validate(InstituteValidator.findAvailability),
    instituteController.findAvailabilityById
);


// This is anti architectural as we'll only update student count when frozen list is fully scrapped -- NEW COMMENT
// This is dev route, considering above ^^
router.patch('/update/:id/total_students',
    validate(InstituteValidator.updateTotalStudents),
    instituteController.updateStudentScores
);

export default router;