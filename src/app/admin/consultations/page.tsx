"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation, ConsultationStatus } from "@/types";
import { getAllConsultations } from "@/services/consultationService";
import { formatINR } from "@/utils/formatters";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import { Search, Filter, Video, ArrowUpDown, Eye } from "lucide-react";

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rescheduledFilter, setRescheduledFilter] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      try {
        const list = await getAllConsultations();
        setConsultations(list);
      } catch (err) {
        console.error("Failed to load consultations:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = consultations.filter((c) => {
    // Search
    const matchSearch =
      !searchTerm ||
      c.patientNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.consultationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.disease.toLowerCase().includes(searchTerm.toLowerCase());

    // Status
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;

    // Rescheduled
    const matchRescheduled =
      rescheduledFilter === "ALL" ||
      (rescheduledFilter === "YES" && c.rescheduled) ||
      (rescheduledFilter === "NO" && !c.rescheduled);

    return matchSearch && matchStatus && matchRescheduled;
  });

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consultation Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide consultation bookings, lifecycle transitions, and rescheduling tracking.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="MEETING_ADDED">Meeting Added</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={rescheduledFilter}
              onChange={(e) => setRescheduledFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none text-slate-700"
            >
              <option value="ALL">All Appointments</option>
              <option value="YES">Rescheduled Consultations Only</option>
              <option value="NO">Original Time Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Consultation ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Appointment Schedule</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No consultations found matching the search criteria.
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
                    <td className="px-4 py-3.5 max-w-xs truncate font-medium text-slate-800">
                      {item.disease}
                    </td>
                    <td className="px-4 py-3.5">
                      <AppointmentTimeCard consultation={item} compact />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {formatINR(item.consultationFee)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} rescheduled={item.rescheduled} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/consultations/${item.consultationId}`}
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
