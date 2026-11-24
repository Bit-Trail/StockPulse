import React from 'react';
import { CheckCircle2, Truck, Clock, Send, PackageCheck } from 'lucide-react';
import type { Product, PurchaseOrder } from '../types/stockpulse';
import { formatINR } from '../lib/retailHelpers';

interface OrdersPanelProps {
  orders: PurchaseOrder[];
  products: Product[];
  onApprove: (orderId: number) => void;
  onReceive: (orderId: number) => void;
  processingId: number | null;
}

export const OrdersPanel: React.FC<OrdersPanelProps> = ({
  orders,
  products,
  onApprove,
  onReceive,
  processingId,
}) => {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const pendingApproval = orders.filter((o) => o.status === 'PENDING');
  const inTransit = orders.filter((o) => o.status === 'APPROVED');

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-900">
          All Shelves Stocked Up
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          No pending or incoming supplier orders right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Needs Retailer Approval */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          1. Awaiting Your Approval ({pendingApproval.length})
        </h3>
        {pendingApproval.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-4 text-xs text-slate-500">
            No orders waiting for approval.
          </p>
        ) : (
          pendingApproval.map((order) => {
            const product = productMap.get(order.productId);
            const estCost = product ? order.quantityOrdered * product.price : 0;
            const isBusy = processingId === order.id;

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3.5">
                  {product?.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-14 w-14 rounded-xl object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Truck className="h-6 w-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        PO #{order.id} • Draft
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="mt-0.5 text-base font-bold text-slate-900">
                      {product ? product.name : `Product #${order.productId}`}
                    </h4>

                    <p className="text-xs text-slate-600">
                      Left in shop:{' '}
                      <strong className="text-amber-700">
                        {product ? `${product.current_stock} units` : '—'}
                      </strong>{' '}
                      • To Order:{' '}
                      <strong className="text-slate-900">
                        {order.quantityOrdered} units
                      </strong>{' '}
                      {estCost > 0 && `(${formatINR(estCost)} est.)`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onApprove(order.id)}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isBusy ? 'Sending...' : 'Approve & Send Order'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Section 2: In Transit — Receive Stock When Truck Arrives */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          2. Ordered / Waiting for Supplier Delivery ({inTransit.length})
        </h3>
        {inTransit.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-4 text-xs text-slate-500">
            No shipments currently on the way.
          </p>
        ) : (
          inTransit.map((order) => {
            const product = productMap.get(order.productId);
            const isBusy = processingId === order.id;

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3.5">
                  {product?.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-14 w-14 rounded-xl object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <Truck className="h-6 w-6" />
                    </div>
                  )}

                  <div>
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-900">
                      PO #{order.id} • In Transit ({product?.lead_time_days || 2}d lead time)
                    </span>
                    <h4 className="mt-0.5 text-base font-bold text-slate-900">
                      {product ? product.name : `Product #${order.productId}`}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Current shelf stock:{' '}
                      <strong>{product ? `${product.current_stock} units` : '—'}</strong> •
                      Incoming delivery:{' '}
                      <strong className="text-emerald-700">
                        +{order.quantityOrdered} units
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onReceive(order.id)}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
                >
                  <PackageCheck className="h-4 w-4" />
                  {isBusy ? 'Updating Shelf...' : 'Mark Delivered & Add Stock'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};