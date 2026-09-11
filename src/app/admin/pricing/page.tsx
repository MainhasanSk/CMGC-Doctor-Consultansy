"use client";

import React, { useState, useEffect } from "react";
import { PricingSettings } from "@/types";
import { getPricingSettings, updatePricingFee } from "@/services/pricingService";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/utils/formatters";
import { formatISTDateTime } from "@/utils/date";
import { BadgePercent, IndianRupee, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";

export default function AdminPricingPage() {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [feeInput, setFeeInput] = useState<number>(500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const p = await getPricingSettings();
        setPricing(p);
        setFeeInput(p.videoConsultationFee);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(false);

    try {
      await updatePricingFee(Number(feeInput), user.uid);
      const updated = await getPricingSettings();
      setPricing(updated);
      setSuccess(true);
    } catch (err) {
      alert("Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pricing Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure baseline fee snapshot for all new medical video consultation bookings.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
            <BadgePercent className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current System Fee
            </span>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatINR(pricing?.videoConsultationFee || 500)}
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-700 border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Consultation fee updated successfully.
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Video Consultation Fee (INR)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <IndianRupee className="h-4 w-4" />
              </div>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={feeInput}
                onChange={(e) => setFeeInput(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-bold focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Updating Pricing..." : "Update Consultation Fee"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Historical Price Snapshot Integrity: </span>
              Updating this fee will only apply to future consultations. All previously booked or completed consultations preserve their historical snapshot fee ({formatINR(pricing?.videoConsultationFee)}) to ensure revenue reports remain 100% accurate.
            </div>
          </div>
          {pricing?.updatedAt && (
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
              Last updated: {formatISTDateTime(pricing.updatedAt)} by {pricing.updatedBy}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
