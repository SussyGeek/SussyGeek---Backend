import express from 'express';
import { bodyValidation, validateInstitutionInput } from '../middlewares/validateBody';
import { addInstitute, getInstitute, updateStudentCount } from '../controllers/institutionController';

const router = express.Router();

router.get('/get', getInstitute );
router.post('/add', validateInstitutionInput, addInstitute);
router.post('update', bodyValidation, updateStudentCount);
// router.post('/contribute/start', )

export default router;


