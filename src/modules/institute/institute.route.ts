import express from 'express';
import validate from '../../middlewares/validation.middleware';
import { InstituteValidator } from './institute.validator';
import instituteController from './institute.controller';
import { database } from '../../database/appwrite/instance';
import { appwriteConfig } from '../../database/appwrite/config';
import { shitData } from '../../shit';

const router = express.Router();

router.post('/add',
    validate(InstituteValidator.addInstitute),
    // TODO: New middleware that checks if institute exists.
    instituteController.addInstitute
);
router.get('/list',
    validate(InstituteValidator.getInstitute),
    instituteController.getInstitute
);



// This is unused for now. TODO: Decide on it in future. -- OLD COMMENT
// This is anti architectural as we'll only update student count when frozen list is fully scrapped -- NEW COMMENT
router.patch('/update/:id/total_students',
    validate(InstituteValidator.updateTotalStudents),
    instituteController.updateStudentCount
);

export default router;