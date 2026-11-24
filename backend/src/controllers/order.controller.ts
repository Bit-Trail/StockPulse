import { Request, Response } from 'express';
import { db } from '../prisma/db';

export const getPendingOrders = async (req: Request, res: Response) => {
  try {
    const allOrders = await db.orm.public.PurchaseOrder.all();
    const activeOrders = allOrders.filter(
      (o) => o.status === 'PENDING' || o.status === 'APPROVED'
    );
    return res.status(200).json(activeOrders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ reason: 'Failed to fetch orders' });
  }
};

export const approveOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ reason: 'Invalid order ID' });
    }

    const order = await db.orm.public.PurchaseOrder.where({
      id: orderId,
    }).first();

    if (!order) {
      return res.status(404).json({ reason: 'Purchase order not found' });
    }
    if (order.status !== 'PENDING') {
      return res.status(400).json({ reason: `Order is already ${order.status}` });
    }

    await db.orm.public.PurchaseOrder.where({ id: orderId }).update({
      status: 'APPROVED',
    });

    return res.status(200).json({
      orderId,
      status: 'APPROVED',
      message: 'Order approved and sent to supplier',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ reason: 'Failed to approve order' });
  }
};

export const receiveOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ reason: 'Invalid order ID' });
    }

    const result = await db.transaction(async (tx) => {
      const order = await tx.orm.public.PurchaseOrder.where({
        id: orderId,
      }).first();

      if (!order) {
        throw { status: 404, message: 'Purchase order not found' };
      }
      if (order.status !== 'APPROVED') {
        throw {
          status: 400,
          message:
            order.status === 'PENDING'
              ? 'Approve this order before receiving delivery'
              : 'Order has already been delivered',
        };
      }

      const product = await tx.orm.public.Product.where({
        id: order.productId,
      }).first();

      if (!product) {
        throw { status: 404, message: 'Associated product not found' };
      }

      const updatedStock = product.current_stock + order.quantityOrdered;

      await tx.orm.public.PurchaseOrder.where({ id: orderId }).update({
        status: 'DELIVERED',
      });

      await tx.orm.public.Product.where({ id: product.id }).update({
        current_stock: updatedStock,
      });

      return {
        orderId,
        status: 'DELIVERED',
        sku: product.sku,
        addedUnits: order.quantityOrdered,
        newStock: updatedStock,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.status) {
      return res.status(error.status).json({ reason: error.message });
    }
    console.error(error);
    return res.status(500).json({ reason: 'Failed to receive delivery' });
  }
};