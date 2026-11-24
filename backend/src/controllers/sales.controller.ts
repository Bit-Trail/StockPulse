import { Request, Response } from 'express';
import { broadcastEvent } from '../utils/sse';
import { db } from '../prisma/db';

export const syncSale = async (req: Request, res: Response) => {
  try {
    const { sku, quantitySold } = req.body;
    if (!sku || !quantitySold || typeof sku !== 'string' || quantitySold <= 0) {
      return res.status(400).json({
        reason: 'Invalid input, kindly check sku or quantitySold it must be a positive integer',
      });
    }

    const result = await db.transaction(async (tx) => {
      const findProduct = await tx.orm.public.Product.where({ sku }).first();
      if (!findProduct || findProduct.current_stock < quantitySold) {
        throw { status: 400, message: 'Insufficient Stock' };
      }

      const newStock = findProduct.current_stock - quantitySold;
      await tx.orm.public.Sale.createAll([
        { productId: findProduct.id, quantitySold },
      ]);

      const recentSales = await tx.orm.public.Sale.where({
        productId: findProduct.id,
      }).all();
      const totalSold = recentSales.reduce((sum, s) => sum + s.quantitySold, 0);
      const velocity = Number((totalSold / 7).toFixed(2));

      await tx.orm.public.Product.where({ id: findProduct.id }).update({
        daily_sales_velocity: velocity,
        current_stock: newStock,
      });

      const rop = Math.ceil(
        velocity * findProduct.lead_time_days + findProduct.safety_stock
      );
      const needsReorder = newStock <= rop;

      let orderSuggestion = null;
      let purchaseOrder = null;

      if (needsReorder) {
        const rawRequirement = velocity * findProduct.target_supply_days;
        const cratesToOrder = Math.max(
          1,
          Math.ceil(rawRequirement / findProduct.moq)
        );
        const finalUnits = cratesToOrder * findProduct.moq;

        orderSuggestion = {
          rawRequirement: Number(rawRequirement.toFixed(2)),
          cratesToOrder,
          finalUnits,
        };

        // Check if a PENDING order already exists so we don't duplicate it
        const allProductPOs = await tx.orm.public.PurchaseOrder.where({
          productId: findProduct.id,
        }).all();
        const existingPO = allProductPOs.find(
          (po) => po.status === 'PENDING' || po.status === 'APPROVED'
        );

        if (!existingPO) {
          const created = await tx.orm.public.PurchaseOrder.createAll([
            {
              productId: findProduct.id,
              quantityOrdered: finalUnits,
            },
          ]);
          purchaseOrder = created[0];
        } else {
          purchaseOrder = existingPO;
        }
      }

      return {
        sku: findProduct.sku,
        previousStock: findProduct.current_stock,
        newStock,
        dailySalesVelocity: velocity,
        reorderPoint: rop,
        needsReorder,
        orderSuggestion,
        purchaseOrder,
      };
    });

    if (result.needsReorder) {
      broadcastEvent('reorder_triggered', result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.status) {
      return res.status(error.status).json({ reason: error.message });
    }
    console.error(error);
    return res.status(500).json({ reason: 'Failed to sync the sale' });
  }
};