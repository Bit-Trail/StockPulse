import React from 'react';
import { Package, AlertTriangle, CheckCircle2, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/stockpulse';
import { getRetailSummary, formatINR } from '../lib/retailHelpers';

interface ProductCardProps {
  product: Product;
  onQuickSell: (sku: string, qty: number) => void;
  sellingSku: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickSell,
  sellingSku,
}) => {
  const summary = getRetailSummary(product);
  const isBusy = sellingSku === product.sku;

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition ${
        summary.isLow ? 'border-amber-300 ring-1 ring-amber-200' : 'border-stone-200'
      }`}
    >
      <div>
        {/* Product Image + Price Pill */}
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-stone-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-stone-400">
              <Package className="h-10 w-10 stroke-1.5" />
              <span className="mt-1 text-xs">No photo yet</span>
            </div>
          )}

          <span className="absolute top-2.5 right-2.5 rounded-lg bg-slate-900/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
            {formatINR(product.price)}
          </span>

          <span
            className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              summary.isLow
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {summary.isLow ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Order Soon
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Healthy Stock
              </>
            )}
          </span>
        </div>

        {/* Name & SKU */}
        <div className="mt-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {product.sku}
          </p>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Plain-English Retailer Metrics */}
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#FAF9F6] p-3 border border-stone-100">
          <div>
            <p className="text-[11px] text-slate-500">Left in Shop</p>
            <p
              className={`text-lg font-extrabold ${
                summary.isLow ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {product.current_stock}{' '}
              <span className="text-xs font-normal text-slate-500">units</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Reorder below {summary.reorderAt}
            </p>
          </div>

          <div className="border-l border-stone-200 pl-3">
            <p className="text-[11px] text-slate-500">Suggested Order</p>
            <p className="text-lg font-extrabold text-emerald-700">
              {summary.recommendedUnits}{' '}
              <span className="text-xs font-normal text-slate-500">units</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Est. {formatINR(summary.estimatedOrderCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick POS Counter Buttons */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-stone-100">
        <button
          onClick={() => onQuickSell(product.sku, 1)}
          disabled={isBusy || product.current_stock < 1}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-stone-100 disabled:opacity-40"
        >
          <ShoppingBag className="h-3.5 w-3.5 text-slate-500" /> Sell 1
        </button>
        <button
          onClick={() => onQuickSell(product.sku, 5)}
          disabled={isBusy || product.current_stock < 5}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Sell 5
        </button>
      </div>
    </div>
  );
};