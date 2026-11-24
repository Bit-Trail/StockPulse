import {Request, Response} from 'express';
import {db} from '../prisma/db'


export const createProduct = async(req: Request, res: Response) => {
    
    try {

        const newProduct = await db.orm.public.Product.createAll([
            { sku: req.body.sku, 
              name: req.body.name, 
              current_stock: req.body.current_stock, 
              lead_time_days: req.body.lead_time_days, 
              safety_stock: req.body.safety_stock,
              imageUrl : req.body.imageUrl,
              price : req.body.price
            }
        ]);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({"reason": "Failed to create Product"});
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