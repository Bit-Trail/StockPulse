import { Router } from 'express';
import { parseSupplierSheet } from '../controllers/supplier.controller';

const router = Router();

router.post('/parse', parseSupplierSheet);

export default router;