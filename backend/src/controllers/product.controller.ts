import {Request, Response} from 'express';
import {db} from '../prisma/db'


export const createProduct = async (req: Request, res: Response) => {
  try {
    // Support both [{ ... }] and [{ ... }, { ... }]
    const rawItems = Array.isArray(req.body) ? req.body : [req.body];

    if (rawItems.length === 0) {
      return res.status(400).json({ reason: 'Request body cannot be empty' });
    }

    const itemsToCreate = rawItems.map((item: any) => ({
      sku: String(item.sku || '').trim().toUpperCase(),
      name: String(item.name || '').trim(),
      price: Number(item.price) || 0,
      imageUrl: item.imageUrl || null,
      current_stock: Number(item.current_stock) || 0,
      safety_stock: Number(item.safety_stock) || 0,
      lead_time_days: Number(item.lead_time_days) || 1,
      target_supply_days: Number(item.target_supply_days) || 14,
      moq: Number(item.moq) || 1,
    }));

    const invalidItem = itemsToCreate.find((p : any) => !p.sku || !p.name);
    if (invalidItem) {
      return res.status(400).json({
        reason: 'Each product must include both a non-empty name and sku',
      });
    }

    const createdProducts = await db.orm.public.Product.createAll(itemsToCreate);
    return res.status(201).json(createdProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ reason: 'Failed to create Product' });
  }
}

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await db.orm.public.Product.all();
    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ reason: 'Failed to fetch products' });
  }
};