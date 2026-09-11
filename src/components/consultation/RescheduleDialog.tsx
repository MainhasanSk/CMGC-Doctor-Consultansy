"use client";

import React, { useState } from "react";
import { Consultation, UserRole } from "@/types";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { confirmAndRescheduleConsultation } from "@/services/consultationService";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { Calendar, Clock, AlertCircle, Loader2, X } from "lucide-react";

interface RescheduleDialogProps {
  consultation: Consultation;
  actorUserId: string;
  actorRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  consultation,
  actorUserId,
  actorRole,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newDate, setNewDate] = useState(consultation.requestedDate || "");
  const [newTime, setNewTime] = useState(consultation.requestedTime || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newDate || !newTime) {
      setErrorMessage("Please select both a new date and time.");
      return;
    }

    setLoading(true);
    try {
      await confirmAndRescheduleConsultation({
        consultationId: consultation.consultationId,
        newDate,
        newTime,
        reason: reason.trim(),
        actorUserId,
        actorRole,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm & Reschedule Consultation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a new appointment time. Original requested time will be preserved in history.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Original Requested Time Display */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Original Requested Time
            </span>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>
                {formatISTDate(consultation.requestedStartDateTime)} at {formatISTTime(consultation.requestedStartDateTime)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Confirmed Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Confirmed Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Rescheduling (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Doctor schedule conflict / earlier slot unavailable"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              This note will be logged in the audit trail and visible to the franchise.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Validating & Rescheduling..." : "Confirm & Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
