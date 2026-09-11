"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation, Doctor, Franchise, Patient, PricingSettings } from "@/types";
import { getAllConsultations } from "@/services/consultationService";
import { listAllDoctors } from "@/services/doctorService";
import { listAllFranchises } from "@/services/franchiseService";
import { listAllPatients } from "@/services/patientService";
import { getPricingSettings } from "@/services/pricingService";
import { formatINR } from "@/utils/formatters";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import {
  Users,
  Stethoscope,
  Building2,
  Video,
  Clock,
  CheckCircle2,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, dList, fList, pList, priceData] = await Promise.all([
          getAllConsultations(),
          listAllDoctors(),
          listAllFranchises(),
          listAllPatients(),
          getPricingSettings(),
        ]);
        setConsultations(cList);
        setDoctors(dList);
        setFranchises(fList);
        setPatients(pList);
        setPricing(priceData);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Stats calculation
  const totalConsultations = consultations.length;
  const pendingCount = consultations.filter((c) => c.status === "PENDING").length;
  const confirmedCount = consultations.filter(
    (c) => c.status === "CONFIRMED" || c.status === "MEETING_ADDED" || c.status === "READY_TO_JOIN"
  ).length;
  const completedList = consultations.filter((c) => c.status === "COMPLETED");
  const completedCount = completedList.length;

  // Monthly revenue calculated strictly from consultation snapshot fee of completed consultations
  const totalRevenue = completedList.reduce((sum, c) => sum + (c.consultationFee || 0), 0);

  const pendingQueue = consultations.filter((c) => c.status === "PENDING").slice(0, 5);
  const upcomingConsultations = consultations
    .filter(
      (c) =>
        c.status === "CONFIRMED" ||
        c.status === "MEETING_ADDED" ||
        c.status === "READY_TO_JOIN"
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operations, revenue metrics, and consultation lifecycle tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/consultations"
            className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
          >
            <Video className="h-4 w-4" /> All Consultations
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Revenue
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{formatINR(totalRevenue)}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> Snapshot Verified
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Current consultation fee: {formatINR(pricing?.videoConsultationFee || 500)}
          </p>
        </div>

        {/* Consultations Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Bookings
            </span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Video className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalConsultations}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({completedCount} completed)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {confirmedCount} confirmed & upcoming
          </p>
        </div>

        {/* Pending Requests Card */}
        <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Review
            </span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">{pendingCount}</span>
            <span className="text-xs text-amber-600 font-medium">Awaiting Confirm</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Doctor review required</p>
        </div>

        {/* Network Ecosystem Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Network
            </span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-700">
            <div>
              <span className="block text-lg font-bold text-slate-900">{franchises.length}</span>
              <span className="text-slate-500">Franchises</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-900">{doctors.length}</span>
              <span className="text-slate-500">Doctors</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-900">{patients.length}</span>
              <span className="text-slate-500">Patients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Pending Queue & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Consultations Queue */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Pending Consultation Requests</h2>
            </div>
            <Link
              href="/admin/consultations?status=PENDING"
              className="text-xs font-semibold text-cmgc-secondary hover:underline flex items-center gap-1"
            >
              View all ({pendingCount}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No pending consultation requests at this time.
              </div>
            ) : (
              pendingQueue.map((item) => (
                <div key={item.consultationId} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.patientNameSnapshot}
                        </span>
                        <span className="text-xs text-slate-400">({item.patientAgeSnapshot} yrs)</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Condition: <span className="font-medium text-slate-800">{item.disease}</span>
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Requested: {formatISTDate(item.requestedStartDateTime)} at {formatISTTime(item.requestedStartDateTime)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/consultations/${item.consultationId}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition shrink-0"
                    >
                      Review Request
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Confirmed Consultations */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Upcoming Confirmed Consultations</h2>
            </div>
            <Link
              href="/admin/consultations?status=CONFIRMED"
              className="text-xs font-semibold text-cmgc-secondary hover:underline flex items-center gap-1"
            >
              View all ({confirmedCount}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingConsultations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No upcoming confirmed consultations scheduled.
              </div>
            ) : (
              upcomingConsultations.map((item) => (
                <div key={item.consultationId} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.patientNameSnapshot}
                        </span>
                        <StatusBadge status={item.status} rescheduled={item.rescheduled} />
                      </div>
                      <div className="mt-1 text-xs text-slate-700 font-medium">
                        {formatISTDate(item.startDateTime)} at {formatISTTime(item.startDateTime)}
                      </div>
                      {item.rescheduled && (
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          (Rescheduled from {formatISTTime(item.requestedStartDateTime)})
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <MeetingJoinButton consultation={item} />
                      <Link
                        href={`/admin/consultations/${item.consultationId}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
