import express from 'express';
import { validateBatchInput } from '../middlewares/validateBody';
import { handleBatchPublication, handleBlocks, verificationAndCaching } from '../controllers/contributionController';

const router = express.Router();

router.post('/batch', 
    handleBlocks, 
    validateBatchInput,
    handleBatchPublication
);

export default router;


