import React from "react";
import { Consultation } from "@/types";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

interface AppointmentTimeCardProps {
  consultation: Consultation;
  compact?: boolean;
}

export const AppointmentTimeCard: React.FC<AppointmentTimeCardProps> = ({
  consultation,
  compact = false,
}) => {
  const isRescheduled = consultation.rescheduled;

  if (compact) {
    return (
      <div className="text-sm">
        {isRescheduled ? (
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-purple-900">
              <span>{formatISTDate(consultation.startDateTime)}</span>
              <span>•</span>
              <span>{formatISTTime(consultation.startDateTime)}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-500 line-through">
              Req: {formatISTDate(consultation.requestedStartDateTime)}, {formatISTTime(consultation.requestedStartDateTime)}
            </div>
          </div>
        ) : (
          <div className="font-medium text-slate-800">
            {formatISTDate(consultation.startDateTime)} at {formatISTTime(consultation.startDateTime)}
          </div>
        )}
      </div>
    );
  }

  if (isRescheduled) {
    return (
      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
            <Calendar className="h-3.5 w-3.5" />
            Rescheduled Appointment
          </span>
          {consultation.rescheduledByRole && (
            <span className="text-xs text-purple-700">
              by {consultation.rescheduledByRole === "DOCTOR" ? "Doctor" : "Admin"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div className="rounded-lg bg-white p-3 border border-purple-100 shadow-2xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
              Originally Requested Time
            </span>
            <div className="mt-1 flex items-center gap-2 text-slate-500 line-through text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {formatISTDate(consultation.requestedStartDateTime)}, {formatISTTime(consultation.requestedStartDateTime)}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 border border-purple-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
              New Confirmed Appointment Time
            </span>
            <div className="mt-1 flex items-center gap-2 text-purple-950 font-bold text-base">
              <Calendar className="h-4.5 w-4.5 text-purple-600" />
              <span>
                {formatISTDate(consultation.startDateTime)}, {formatISTTime(consultation.startDateTime)}
              </span>
            </div>
          </div>
        </div>

        {consultation.rescheduleReason && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-purple-100/60 p-2.5 text-xs text-purple-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <div>
              <span className="font-semibold">Reason for Reschedule: </span>
              {consultation.rescheduleReason}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
        Confirmed Appointment Time
      </span>
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
        <Calendar className="h-4.5 w-4.5 text-cmgc-primary" />
        <span>
          {formatISTDate(consultation.startDateTime)} at {formatISTTime(consultation.startDateTime)}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Duration: 30 minutes (ends {formatISTTime(consultation.endDateTime)})
      </p>
    </div>
  );
};
