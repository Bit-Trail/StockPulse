import type { Product, PurchaseOrder, ParsedSupplierItem } from '../types/stockpulse';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function createProduct(payload: {
  sku: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  current_stock: number;
  lead_time_days: number;
  safety_stock: number;
  target_supply_days?: number;
  moq?: number;
}): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.reason || 'Failed to add product');
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function syncSale(sku: string, quantitySold: number) {
  const res = await fetch(`${API_BASE}/api/sales/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku, quantitySold }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.reason || 'Checkout failed');
  return data;
}

export async function fetchPendingOrders(): Promise<PurchaseOrder[]> {
  const res = await fetch(`${API_BASE}/api/orders`);
  if (!res.ok) throw new Error('Failed to load purchase orders');
  return res.json();
}

export async function approvePurchaseOrder(orderId: number) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/approve`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.reason || 'Approval failed');
  return data;
}

export async function receivePurchaseOrder(orderId: number) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/receive`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.reason || 'Delivery receipt failed');
  return data;
}

export async function parseSupplierRateSheet(payload: {
  rateSheetText?: string;
  fileBase64?: string;
  mimeType?: string;
  applyUpdates: boolean;
}): Promise<{
  model: string;
  extracted: ParsedSupplierItem[];
  updatedProducts: { sku: string; moq: number; lead_time_days: number }[];
}> {
  const res = await fetch(`${API_BASE}/api/suppliers/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.reason || 'AI parsing failed') as Error & {
      code?: string;
      retryAfterHint?: string;
    };
    error.code = data.code;
    error.retryAfterHint = data.retryAfterHint;
    throw error;
  }
  return data;
}

export function subscribeToStoreEvents(
  onReorder: (payload: unknown) => void,
  onStatusChange?: (connected: boolean) => void
) {
  const eventSource = new EventSource(`${API_BASE}/api/events`);

  eventSource.onopen = () => onStatusChange?.(true);
  eventSource.onerror = () => onStatusChange?.(false);

  eventSource.addEventListener('reorder_triggered', (event) => {
    try {
      const parsed = JSON.parse((event as MessageEvent).data);
      onReorder(parsed);
    } catch (e) {
      console.error('Failed to parse SSE payload', e);
    }
  });

  return () => eventSource.close();
}