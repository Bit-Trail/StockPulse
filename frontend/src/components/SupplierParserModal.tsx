import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { parseSupplierRateSheet } from '../lib/api';
import type { ParsedSupplierItem } from '../types/stockpulse';

interface SupplierParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRatesApplied: () => void;
}

export const SupplierParserModal: React.FC<SupplierParserModalProps> = ({
  isOpen,
  onClose,
  onRatesApplied,
}) => {
  const [text, setText] = useState('');
  const [applyUpdates, setApplyUpdates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ParsedSupplierItem[]>([]);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadSample = () => {
    setText(
      'Himalayan Orchards Rate Sheet: Kashmiri Apple (Code: APL-001) - Min order 1 crate (20 units), delivery takes 3 working days.'
    );
    setRateLimitMsg(null);
    setErrorMsg(null);
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setRateLimitMsg(null);
    setErrorMsg(null);
    setExtracted([]);

    try {
      const res = await parseSupplierRateSheet({
        rateSheetText: text.trim(),
        applyUpdates,
      });
      setModelUsed(res.model);
      setExtracted(res.extracted || []);
      if (applyUpdates && res.updatedProducts?.length > 0) {
        onRatesApplied();
      }
    } catch (err: any) {
      if (err.code === 'RATE_LIMIT_EXCEEDED') {
        setRateLimitMsg(err.message);
      } else {
        setErrorMsg(err.message || 'Could not read rate sheet');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-[#FAF9F6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Import Supplier Price List (AI)
              </h2>
              <p className="text-xs text-slate-500">
                Paste supplier text to auto-update pack sizes & delivery days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleParse} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Supplier Message or Rate-Sheet Text
            </label>
            <button
              type="button"
              onClick={loadSample}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Fill Sample Text
            </button>
          </div>

          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste supplier WhatsApp message, invoice notes, or price list here..."
            className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
          />

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={applyUpdates}
              onChange={(e) => setApplyUpdates(e.target.checked)}
              className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
            />
            Automatically update matching items in my shop
          </label>

          {rateLimitMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">AI Free-Tier Quota Reached</p>
                <p className="mt-0.5">{rateLimitMsg}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {extracted.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Extracted & Updated
                </span>
                {modelUsed && (
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-slate-500">
                    {modelUsed}
                  </span>
                )}
              </div>
              {extracted.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-[#FAF9F6] px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-slate-400">{item.sku}</p>
                  </div>
                  <div className="text-right text-slate-700">
                    <p>Pack Size: <strong>{item.moq} units</strong></p>
                    <p>Delivery: <strong>{item.lead_time_days} days</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            {loading ? 'Reading Supplier Terms...' : 'Extract & Update Store'}
          </button>
        </form>
      </div>
    </div>
  );
};