import express from 'express';
import { getCounter } from '../controllers/metadataController';

const router = express.Router();

router.get('/get/:field', getCounter); // selective
router.get('/get', getCounter); // get all

export default router;


