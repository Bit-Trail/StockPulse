import { Router } from 'express';
import {
  getPendingOrders,
  approveOrder,
  receiveOrder,
} from '../controllers/order.controller';

const router = Router();

router.get('/', getPendingOrders);
router.patch('/:id/approve', approveOrder);
router.patch('/:id/receive', receiveOrder);

export default router;