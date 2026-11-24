import type { Product } from '../types/stockpulse';

export function getRetailSummary(product: Product) {
  const velocity = product.daily_sales_velocity || 0;
  const reorderAt = Math.ceil(
    velocity * product.lead_time_days + product.safety_stock
  );

  const isLow = product.current_stock <= reorderAt;
  const daysLeft =
    velocity > 0 ? Math.max(0, Math.round(product.current_stock / velocity)) : null;

  const effectiveVelocity = velocity > 0 ? velocity : Math.max(1, product.safety_stock / 2);
  const rawNeed = effectiveVelocity * (product.target_supply_days || 14);
  const packsToOrder = Math.max(1, Math.ceil(rawNeed / (product.moq || 1)));
  const recommendedUnits = packsToOrder * (product.moq || 1);
  const estimatedOrderCost = recommendedUnits * (product.price || 0);

  return {
    reorderAt,
    isLow,
    daysLeft,
    packsToOrder,
    recommendedUnits,
    estimatedOrderCost,
    stockValue: product.current_stock * (product.price || 0),
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}