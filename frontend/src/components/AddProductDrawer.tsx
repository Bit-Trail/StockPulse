import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadProductImage } from '../lib/supabase';
import { createProduct } from '../lib/api';
import type { Product } from '../types/stockpulse';

interface AddProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
}

export const AddProductDrawer: React.FC<AddProductDrawerProps> = ({
  open,
  onClose,
  onProductAdded,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('30');
  const [safetyStock, setSafetyStock] = useState('10');
  const [leadTimeDays, setLeadTimeDays] = useState('2');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let uploadedUrl: string | null = null;
      if (imageFile) {
        uploadedUrl = await uploadProductImage(imageFile);
      }

      const created = await createProduct({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: Number(price) || 0,
        imageUrl: uploadedUrl,
        current_stock: Number(currentStock) || 0,
        safety_stock: Number(safetyStock) || 0,
        lead_time_days: Number(leadTimeDays) || 1,
      });

      onProductAdded(created);
      setName('');
      setSku('');
      setPrice('');
      setCurrentStock('30');
      setSafetyStock('10');
      setLeadTimeDays('2');
      setImageFile(null);
      setPreviewUrl(null);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FAF9F6] h-full shadow-2xl border-l border-stone-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Item to Shop</h2>
            <p className="text-xs text-slate-500">Upload photo, selling price & starting shelf count</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Product Photo Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Product Photo
            </label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-stone-300 rounded-2xl bg-white hover:border-emerald-500 cursor-pointer transition overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 p-4 text-center">
                  <ImageIcon className="w-7 h-7 mb-1.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">
                    Tap to upload product photo
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG or WebP</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                required
                placeholder="e.g., Kashmiri Apple (1 kg)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Code (SKU) *
              </label>
              <input
                required
                placeholder="APL-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm uppercase focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="180"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <p className="text-xs font-bold text-slate-800">Shelf & Delivery Settings</p>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  In Shop Now
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9F6] border border-stone-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Min Buffer
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9F6] border border-stone-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Delivery Days
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9F6] border border-stone-200 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading & Saving...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Save Product to Shelf
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};