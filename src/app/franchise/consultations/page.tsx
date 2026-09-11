"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation } from "@/types";
import { getFranchiseConsultations } from "@/services/consultationService";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/utils/formatters";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import { PlusCircle, Search, Eye, Calendar, Clock } from "lucide-react";

export default function FranchiseConsultationsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const franchiseId = user?.referenceId || "FR-1001";

  useEffect(() => {
    async function load() {
      if (!franchiseId) return;
      try {
        const list = await getFranchiseConsultations(franchiseId);
        setConsultations(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [franchiseId]);

  const filtered = consultations.filter(
    (c) =>
      c.patientNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.consultationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Consultation History & Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track video consultations, doctor confirmations, rescheduled times, and meeting access.
          </p>
        </div>
        <Link
          href="/franchise/consultations/new"
          className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
        >
          <PlusCircle className="h-4 w-4" /> Book Consultation
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, consultation ID, or disease..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Consultation ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Appointment Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Meeting</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No consultations booked yet.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.consultationId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {item.consultationId}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{item.patientNameSnapshot}</div>
                      <div className="text-[11px] text-slate-500">{item.patientAgeSnapshot} yrs</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 max-w-xs truncate">
                      {item.disease}
                    </td>
                    <td className="px-4 py-3.5">
                      <AppointmentTimeCard consultation={item} compact />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} rescheduled={item.rescheduled} />
                    </td>
                    <td className="px-4 py-3.5">
                      <MeetingJoinButton consultation={item} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/franchise/consultations/${item.consultationId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-cmgc-primary hover:bg-slate-50 shadow-2xs transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
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
