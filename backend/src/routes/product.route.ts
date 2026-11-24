import { Router } from 'express';
const router = Router();
import { createProduct, getAllProducts } from "../controllers/product.controller";

router.get('/', getAllProducts);
router.post("/", createProduct);

export default router;
