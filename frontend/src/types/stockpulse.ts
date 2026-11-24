export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  imageUrl: string | null;
  current_stock: number;
  lead_time_days: number;
  safety_stock: number;
  daily_sales_velocity: number;
  target_supply_days: number;
  moq: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  productId: number;
  quantityOrdered: number;
  status: 'PENDING' | 'APPROVED' | 'DELIVERED';
  createdAt: string;
}

export interface ParsedSupplierItem {
  sku: string;
  name: string;
  moq: number;
  lead_time_days: number;
}