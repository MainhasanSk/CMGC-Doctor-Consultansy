import React from "react";
import { ConsultationStatus } from "@/types";
import {
  Clock,
  CheckCircle2,
  Video,
  PlayCircle,
  CheckCheck,
  XCircle,
  Ban,
  Calendar,
} from "lucide-react";

interface StatusBadgeProps {
  status: ConsultationStatus;
  rescheduled?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, rescheduled }) => {
  if (rescheduled && status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800 border border-purple-200">
        <Calendar className="h-3.5 w-3.5 text-purple-600" />
        Rescheduled & Confirmed
      </span>
    );
  }

  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    case "CONFIRMED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
          Confirmed
        </span>
      );
    case "MEETING_ADDED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200">
          <Video className="h-3.5 w-3.5 text-indigo-600" />
          Meeting Ready
        </span>
      );
    case "READY_TO_JOIN":
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300 animate-pulse">
          <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
          Ready to Join
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-600" />
          Completed
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 border border-red-200">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          Rejected
        </span>
      );
    case "CANCELLED":
    case "NO_SHOW":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          <Ban className="h-3.5 w-3.5 text-slate-500" />
          {status === "NO_SHOW" ? "No Show" : "Cancelled"}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {status}
        </span>
      );
  }
};
