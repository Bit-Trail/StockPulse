import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Store,
  AlertTriangle,
  ShoppingCart,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import type { Product, PurchaseOrder } from './types/stockpulse';
import {
  fetchProducts,
  fetchPendingOrders,
  syncSale,
  approvePurchaseOrder,
  receivePurchaseOrder,
  subscribeToStoreEvents,
} from './lib/api';
import { getRetailSummary, formatINR } from './lib/retailHelpers';
import { ProductCard } from './components/ProductCard';
import { AddProductDrawer } from './components/AddProductDrawer';
import { OrdersPanel } from './components/OrdersPanel';
import { SupplierParserModal } from './components/SupplierParserModal';

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'shelf' | 'orders'>('shelf');
  const [filterLowOnly, setFilterLowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [sseLive, setSseLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellingSku, setSellingSku] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isParserOpen, setIsParserOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadStoreData = useCallback(async () => {
    try {
      const [prods, pending] = await Promise.all([
        fetchProducts(),
        fetchPendingOrders(),
      ]);
      setProducts(prods);
      setOrders(pending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  useEffect(() => {
    const unsubscribe = subscribeToStoreEvents(
      (payload: any) => {
        showToast(
          `Low stock alert for ${payload?.sku || 'an item'} — Purchase Order drafted!`
        );
        loadStoreData();
      },
      (connected) => setSseLive(connected)
    );
    return unsubscribe;
  }, [loadStoreData, showToast]);

  const handleQuickSell = async (sku: string, qty: number) => {
    setSellingSku(sku);
    try {
      const res = await syncSale(sku, qty);
      await loadStoreData();
      if (res.needsReorder) {
        showToast(`Sold ${qty} × ${sku}. Stock is low — Purchase Order created!`);
      } else {
        showToast(`Sold ${qty} × ${sku} (${res.newStock} left)`);
      }
    } catch (err: any) {
      showToast(err.message || 'Could not record sale');
    } finally {
      setSellingSku(null);
    }
  };

  const handleApproveOrder = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await approvePurchaseOrder(orderId);
      await loadStoreData();
      showToast(`PO #${orderId} approved & sent to supplier (In Transit)!`);
    } catch (err: any) {
      showToast(err.message || 'Could not approve order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReceiveOrder = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      const res = await receivePurchaseOrder(orderId);
      await loadStoreData();
      showToast(
        `Delivery received! +${res.addedUnits} units added to ${res.sku}.`
      );
    } catch (err: any) {
      showToast(err.message || 'Could not receive delivery');
    } finally {
      setProcessingId(null);
    }
  };

  const lowStockCount = products.filter((p) => getRetailSummary(p).isLow).length;
  const totalShelfValue = products.reduce(
    (sum, p) => sum + p.current_stock * (p.price || 0),
    0
  );

  const visibleProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterLowOnly) return getRetailSummary(p).isLow;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900">
      {/* Live Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Retailer Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  StockPulse
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    sseLive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-slate-500'
                  }`}
                >
                  {sseLive ? (
                    <>
                      <Wifi className="h-3 w-3" /> Live Counter Sync
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" /> Offline
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated Shop Inventory & Smart Restocking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsParserOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-stone-100"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              Supplier Price List (AI)
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* 4 Plain-English Shop KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Items in Shop</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {products.length}
            </p>
          </div>

          <div
            onClick={() => {
              setActiveTab('shelf');
              setFilterLowOnly(!filterLowOnly);
            }}
            className="cursor-pointer rounded-2xl border border-amber-200 bg-amber-50/60 p-4 transition hover:bg-amber-50"
          >
            <p className="text-xs font-medium text-amber-800">Running Low</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-700">
              {lowStockCount}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className="cursor-pointer rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-emerald-300"
          >
            <p className="text-xs font-medium text-slate-500">Purchase Orders</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Total Stock Value</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {formatINR(totalShelfValue)}
            </p>
          </div>
        </section>

        {/* Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('shelf')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'shelf'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Shop Shelf ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Purchase Orders
              {orders.length > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                  {orders.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'shelf' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-stone-300 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFilterLowOnly(!filterLowOnly)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                  filterLowOnly
                    ? 'border-amber-400 bg-amber-100 text-amber-900'
                    : 'border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Low Stock Only
              </button>
            </div>
          )}
        </div>

        {/* Active View */}
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading your shop shelves...
          </div>
        ) : activeTab === 'shelf' ? (
          visibleProducts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
              <p className="text-base font-bold text-slate-900">No items found</p>
              <p className="mt-1 text-sm text-slate-500">
                Click <strong>+ Add Item</strong> above to upload a product photo, price, and starting stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickSell={handleQuickSell}
                  sellingSku={sellingSku}
                />
              ))}
            </div>
          )
        ) : (
          <OrdersPanel
            orders={orders}
            products={products}
            onApprove={handleApproveOrder}
            onReceive={handleReceiveOrder}
            processingId={processingId}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <AddProductDrawer
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onProductAdded={(created) => {
          setProducts((prev) => [created, ...prev]);
          showToast(`${created.name} added to your shop!`);
        }}
      />

      <SupplierParserModal
        isOpen={isParserOpen}
        onClose={() => setIsParserOpen(false)}
        onRatesApplied={() => {
          loadStoreData();
          showToast('Supplier pack sizes & delivery days updated!');
        }}
      />
    </div>
  );
}

export default App;