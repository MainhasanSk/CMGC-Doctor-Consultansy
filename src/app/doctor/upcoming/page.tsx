"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation } from "@/types";
import {
  getDoctorConsultations,
  completeConsultation,
} from "@/services/consultationService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import {
  CalendarClock,
  CheckCircle2,
  Video,
  User,
  AlertCircle,
  FileSignature,
  Loader2,
} from "lucide-react";

export default function DoctorUpcomingPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const doctorId = user?.referenceId;

  const loadData = async () => {
    if (!doctorId) return;
    try {
      const list = await getDoctorConsultations(doctorId);
      const upcoming = list.filter(
        (c) =>
          c.status === "CONFIRMED" ||
          c.status === "MEETING_ADDED" ||
          c.status === "READY_TO_JOIN" ||
          c.status === "IN_PROGRESS"
      );
      setConsultations(upcoming);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [doctorId]);

  const handleMarkCompleted = async (item: Consultation) => {
    if (!user) return;
    if (!confirm(`Mark consultation with ${item.patientNameSnapshot} as completed? This will allow you to generate their prescription.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await completeConsultation(item.consultationId, user.uid, "DOCTOR");
      await loadData();
    } catch (err) {
      alert("Failed to mark consultation completed.");
    } finally {
      setActionLoading(false);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Upcoming Video Consultations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Confirmed appointments. Meeting links become accessible 10 minutes prior to the confirmed appointment start time.
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <CalendarClock className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 text-base font-bold text-slate-700">No Upcoming Consultations</h2>
          <p className="mt-1 text-xs text-slate-400">
            Check your requests queue for new franchise consultation bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((item) => (
            <div
              key={item.consultationId}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {item.consultationId}
                    </span>
                    <StatusBadge status={item.status} rescheduled={item.rescheduled} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-slate-900 font-bold text-base">
                    <User className="h-4 w-4 text-cmgc-primary" />
                    <span>{item.patientNameSnapshot}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({item.patientAgeSnapshot} yrs)
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Franchise: <span className="font-semibold text-slate-800">{item.franchiseId}</span>
                </div>
              </div>

              {/* Appointment Time Card */}
              <AppointmentTimeCard consultation={item} />

              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900">Chief Complaint: </span>
                <span>{item.disease}</span>
                <p className="mt-1 text-slate-600">{item.diseaseDescription}</p>
              </div>

              {/* Actions: Meeting Join & Complete */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <MeetingJoinButton consultation={item} />

                <button
                  onClick={() => handleMarkCompleted(item)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Consultation Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
