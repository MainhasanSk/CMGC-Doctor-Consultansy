"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation, Franchise } from "@/types";
import { getFranchiseConsultations } from "@/services/consultationService";
import { getFranchiseById } from "@/services/franchiseService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import {
  Calendar,
  Clock,
  Video,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Users,
} from "lucide-react";

export default function FranchiseDashboardPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);

  const franchiseId = user?.referenceId || "FR-1001";

  useEffect(() => {
    async function load() {
      if (!franchiseId) return;
      try {
        const [cList, fData] = await Promise.all([
          getFranchiseConsultations(franchiseId),
          getFranchiseById(franchiseId),
        ]);
        setConsultations(cList);
        setFranchise(fData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [franchiseId]);

  const pendingList = consultations.filter((c) => c.status === "PENDING");
  const upcomingList = consultations.filter(
    (c) =>
      c.status === "CONFIRMED" ||
      c.status === "MEETING_ADDED" ||
      c.status === "READY_TO_JOIN"
  );
  const completedList = consultations.filter((c) => c.status === "COMPLETED");
  const rescheduledList = consultations.filter((c) => c.rescheduled);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cmgc-navy to-cmgc-primary p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-200 tracking-wider">
            Franchise Operating Centre
          </span>
          <h1 className="text-2xl font-black mt-1">
            {franchise?.name || "CMGC Franchise Portal"}
          </h1>
          <p className="text-xs text-blue-100 mt-1">
            {franchise?.city}, {franchise?.state} • Manager: {franchise?.ownerName}
          </p>
        </div>

        <Link
          href="/franchise/consultations/new"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-cmgc-primary shadow-md hover:bg-blue-50 transition shrink-0"
        >
          <PlusCircle className="h-4.5 w-4.5 text-cmgc-primary" /> Book Video Consultation
        </Link>
      </div>

      {/* Prominent Reschedule Notification Alert */}
      {rescheduledList.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-purple-950">
                Notice: You have {rescheduledList.length} Rescheduled Video{" "}
                {rescheduledList.length === 1 ? "Consultation" : "Consultations"}
              </h2>
              <p className="text-xs text-purple-800 mt-0.5">
                The consulting doctor or admin confirmed at an adjusted time. Please review the updated schedule below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Upcoming Consultations
          </span>
          <div className="mt-1 text-2xl font-extrabold text-blue-700">
            {upcomingList.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Confirmed appointments</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            Pending Review
          </span>
          <div className="mt-1 text-2xl font-extrabold text-amber-700">
            {pendingList.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting doctor confirmation</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
            Rescheduled
          </span>
          <div className="mt-1 text-2xl font-extrabold text-purple-900">
            {rescheduledList.length}
          </div>
          <p className="mt-1 text-[11px] text-purple-600">Updated appointment times</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Completed Visits
          </span>
          <div className="mt-1 text-2xl font-extrabold text-green-700">
            {completedList.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Prescriptions available</p>
        </div>
      </div>

      {/* Upcoming Appointments List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-cmgc-primary" />
            <h2 className="text-sm font-bold text-slate-900">Upcoming Consultations & Meeting Access</h2>
          </div>
          <Link
            href="/franchise/consultations"
            className="text-xs font-semibold text-cmgc-secondary hover:underline flex items-center gap-1"
          >
            All Consultations <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {upcomingList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No upcoming consultations scheduled. Book a new consultation above.
            </div>
          ) : (
            upcomingList.map((item) => (
              <div key={item.consultationId} className="p-4 hover:bg-slate-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {item.patientNameSnapshot}
                      </span>
                      <span className="text-xs text-slate-400">({item.patientAgeSnapshot} yrs)</span>
                      <StatusBadge status={item.status} rescheduled={item.rescheduled} />
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Condition: <span className="text-slate-900">{item.disease}</span>
                    </p>

                    <div className="pt-1">
                      <AppointmentTimeCard consultation={item} compact />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MeetingJoinButton consultation={item} />
                    <Link
                      href={`/franchise/consultations/${item.consultationId}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
