import express from 'express';
import { validateBatchInput } from '../middlewares/validateBody';
import { contributionController } from '../controllers/contributionController';
import { scrapperAuthentication } from '../middlewares/protected';

const router = express.Router();

router.post('/batch', scrapperAuthentication, validateBatchInput, contributionController);
// Add a separate post request for contribution sign up.

export default router;


