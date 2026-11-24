import { Router } from 'express';
const router = Router();
import { syncSale } from "../controllers/sales.controller";

router.post("/sync", syncSale);

export default router;
