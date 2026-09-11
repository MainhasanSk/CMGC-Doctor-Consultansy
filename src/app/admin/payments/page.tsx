"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Payment } from "@/types";
import { listAllPayments } from "@/services/paymentService";
import { formatINR } from "@/utils/formatters";
import { formatISTDateTime } from "@/utils/date";
import { CreditCard, CheckCircle2, Clock, RotateCcw } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await listAllPayments();
        setPayments(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPaid = payments
    .filter((p) => p.paymentStatus === "PAID")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manual fee settlements, UPI references, and transaction receipts.
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">
            Total Collected
          </span>
          <span className="text-lg font-bold text-emerald-700">{formatINR(totalPaid)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Consultation</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay.paymentId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {pay.paymentId}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/consultations/${pay.consultationId}`}
                        className="font-mono text-cmgc-primary hover:underline font-semibold"
                      >
                        {pay.consultationId}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(pay.amount)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{pay.paymentMethod}</td>
                    <td className="px-4 py-3.5">
                      {pay.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-800">
                          <CheckCircle2 className="h-3 w-3 text-green-600" /> Paid
                        </span>
                      ) : pay.paymentStatus === "REFUNDED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          <RotateCcw className="h-3 w-3" /> Refunded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatISTDateTime(pay.paidAt || pay.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      {pay.transactionReference || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
