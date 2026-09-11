"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation, Doctor } from "@/types";
import { getDoctorConsultations } from "@/services/consultationService";
import { getDoctorById } from "@/services/doctorService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import {
  Inbox,
  CalendarClock,
  CheckCircle2,
  Users,
  Video,
  ArrowRight,
  Clock,
  FileSignature,
} from "lucide-react";

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const doctorId = user?.referenceId || "DOC-2001";

  useEffect(() => {
    async function load() {
      if (!doctorId) return;
      try {
        const [cList, dData] = await Promise.all([
          getDoctorConsultations(doctorId),
          getDoctorById(doctorId),
        ]);
        setConsultations(cList);
        setDoctor(dData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  const pendingRequests = consultations.filter((c) => c.status === "PENDING");
  const upcomingAppointments = consultations.filter(
    (c) =>
      c.status === "CONFIRMED" ||
      c.status === "MEETING_ADDED" ||
      c.status === "READY_TO_JOIN"
  );
  const completedList = consultations.filter((c) => c.status === "COMPLETED");

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
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-cmgc-primary p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-emerald-300 tracking-wider">
            Consulting Specialist
          </span>
          <h1 className="text-2xl font-black mt-1">
            Welcome, Dr. {doctor?.name || user?.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {doctor?.specialization} • Reg No: {doctor?.registrationNumber}
          </p>
        </div>

        {pendingRequests.length > 0 && (
          <Link
            href="/doctor/requests"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-amber-950 shadow-md hover:bg-amber-300 transition shrink-0"
          >
            <Clock className="h-4 w-4" /> Review {pendingRequests.length} Pending Requests
          </Link>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            New Consultation Requests
          </span>
          <div className="mt-1 text-2xl font-extrabold text-amber-700">
            {pendingRequests.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting your confirmation</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Upcoming Consultations
          </span>
          <div className="mt-1 text-2xl font-extrabold text-blue-700">
            {upcomingAppointments.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Confirmed video appointments</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Completed Visits
          </span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-700">
            {completedList.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Consultations concluded</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Patients
          </span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {consultations.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Consultation records</p>
        </div>
      </div>

      {/* Two Column Section: Requests & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests Queue */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Pending Requests Queue</h2>
            </div>
            <Link
              href="/doctor/requests"
              className="text-xs font-semibold text-cmgc-secondary hover:underline flex items-center gap-1"
            >
              All Requests ({pendingRequests.length}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No pending requests. All consultation requests have been addressed.
              </div>
            ) : (
              pendingRequests.slice(0, 5).map((item) => (
                <div key={item.consultationId} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.patientNameSnapshot}
                        </span>
                        <span className="text-xs text-slate-500">({item.patientAgeSnapshot} yrs)</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700 font-medium">
                        Chief Complaint: <span className="text-slate-900">{item.disease}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Requested: {formatISTDate(item.requestedStartDateTime)} at {formatISTTime(item.requestedStartDateTime)}
                      </div>
                    </div>

                    <Link
                      href="/doctor/requests"
                      className="rounded-lg bg-cmgc-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-cmgc-navy transition shadow-2xs shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Video Appointments */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Upcoming Video Consultations</h2>
            </div>
            <Link
              href="/doctor/upcoming"
              className="text-xs font-semibold text-cmgc-secondary hover:underline flex items-center gap-1"
            >
              All Upcoming ({upcomingAppointments.length}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No upcoming confirmed consultations scheduled.
              </div>
            ) : (
              upcomingAppointments.slice(0, 5).map((item) => (
                <div key={item.consultationId} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <MeetingJoinButton consultation={item} />
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
