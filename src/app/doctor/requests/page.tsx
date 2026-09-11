"use client";

import React, { useState, useEffect } from "react";
import { Consultation, ConsultationReport } from "@/types";
import {
  getDoctorConsultations,
  confirmConsultation,
  rejectConsultation,
} from "@/services/consultationService";
import { getConsultationReports } from "@/services/reportService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { RescheduleDialog } from "@/components/consultation/RescheduleDialog";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  Inbox,
  Clock,
  User,
  FileText,
  Check,
  Calendar,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function DoctorRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Consultation[]>([]);
  const [reportsMap, setReportsMap] = useState<Record<string, ConsultationReport[]>>({});
  const [loading, setLoading] = useState(true);

  // Active item for Reschedule Dialog
  const [selectedForReschedule, setSelectedForReschedule] = useState<Consultation | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<Consultation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const doctorId = user?.referenceId || "DOC-2001";

  const loadRequests = async () => {
    if (!doctorId) return;
    try {
      const list = await getDoctorConsultations(doctorId);
      const pending = list.filter((c) => c.status === "PENDING");
      setRequests(pending);

      // Fetch reports for all pending requests
      const repMap: Record<string, ConsultationReport[]> = {};
      for (const item of pending) {
        const rList = await getConsultationReports(item.consultationId);
        repMap[item.consultationId] = rList;
      }
      setReportsMap(repMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [doctorId]);

  const handleConfirmSameTime = async (item: Consultation) => {
    if (!user) return;
    setActionLoading(true);
    setErrorMessage("");

    try {
      await confirmConsultation(item.consultationId, user.uid, "DOCTOR");
      await loadRequests();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rejectingItem) return;
    setActionLoading(true);
    setErrorMessage("");

    try {
      await rejectConsultation(
        rejectingItem.consultationId,
        rejectReason.trim() || "Doctor unavailable",
        user.uid,
        "DOCTOR"
      );
      setRejectingItem(null);
      setRejectReason("");
      await loadRequests();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
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
          Consultation Requests Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review patient medical details, clinical complaints, and uploaded reports. Confirm at the requested time or Confirm & Reschedule.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Inbox className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 text-base font-bold text-slate-700">No Pending Requests</h2>
          <p className="mt-1 text-xs text-slate-400">
            You are all caught up! New franchise video consultation bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((item) => {
            const reports = reportsMap[item.consultationId] || [];
            return (
              <div
                key={item.consultationId}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {item.consultationId}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Pending Decision
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-slate-900 font-bold text-base">
                      <User className="h-4 w-4 text-cmgc-primary" />
                      <span>{item.patientNameSnapshot}</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({item.patientAgeSnapshot} yrs)
                      </span>
                    </div>
                  </div>

                  {/* Requested Time Highlight */}
                  <div className="rounded-xl bg-blue-50/80 border border-blue-200 px-4 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Franchise Requested Slot
                    </span>
                    <div className="flex items-center gap-1.5 text-blue-950 font-extrabold text-sm mt-0.5">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>
                        {formatISTDate(item.requestedStartDateTime)} at {formatISTTime(item.requestedStartDateTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical Condition & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Chief Complaint / Disease
                    </span>
                    <div className="font-bold text-slate-900 text-sm">{item.disease}</div>
                    <p className="text-slate-700 mt-2 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {item.diseaseDescription}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Attached Medical Reports ({reports.length})
                      </span>
                      {reports.length === 0 ? (
                        <p className="text-slate-400 py-3">No medical reports attached.</p>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {reports.map((r) => (
                            <div key={r.reportId} className="py-2 flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{r.fileName}</span>
                              {r.secureUrl && (
                                <a
                                  href={r.secureUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cmgc-primary font-bold hover:underline flex items-center gap-1"
                                >
                                  View <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {item.extraMessage && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                        <span className="font-semibold">Note from Franchise: </span>
                        {item.extraMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Three Action Buttons: Confirm, Confirm & Reschedule, Reject */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setRejectingItem(item)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    <X className="h-4 w-4" /> Reject Request
                  </button>

                  <button
                    onClick={() => setSelectedForReschedule(item)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
                  >
                    <Calendar className="h-4 w-4" /> Confirm & Reschedule
                  </button>

                  <button
                    onClick={() => handleConfirmSameTime(item)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <Check className="h-4 w-4" /> Confirm at Requested Time
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm & Reschedule Dialog Modal */}
      {selectedForReschedule && user && (
        <RescheduleDialog
          consultation={selectedForReschedule}
          actorUserId={user.uid}
          actorRole="DOCTOR"
          isOpen={!!selectedForReschedule}
          onClose={() => setSelectedForReschedule(null)}
          onSuccess={loadRequests}
        />
      )}

      {/* Reject Reason Dialog Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Decline Consultation Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please state why this request cannot be accepted. The franchise will be notified.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Declining</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule fully booked / Outside specialization"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-red-700 transition"
                >
                  {actionLoading ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
