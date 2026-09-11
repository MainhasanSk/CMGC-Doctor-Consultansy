"use client";

import React, { useState, useEffect } from "react";
import { Consultation } from "@/types";
import {
  isWithinJoinWindow,
  getMinutesUntilJoinWindow,
  hasConsultationEnded,
  formatISTTime,
} from "@/utils/date";
import { Video, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface MeetingJoinButtonProps {
  consultation: Consultation;
}

export const MeetingJoinButton: React.FC<MeetingJoinButtonProps> = ({ consultation }) => {
  const [now, setNow] = useState(new Date());

  // Periodically update current time to evaluate 10-minute window
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); // 15 seconds refresh
    return () => clearInterval(timer);
  }, []);

  if (consultation.status === "REJECTED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 border border-red-200">
        <AlertCircle className="h-4 w-4" />
        Consultation Declined
      </div>
    );
  }

  if (consultation.status === "CANCELLED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200">
        <AlertCircle className="h-4 w-4" />
        Consultation Cancelled
      </div>
    );
  }

  if (consultation.status === "COMPLETED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700 border border-green-200">
        <CheckCircle2 className="h-4 w-4" />
        Consultation Completed
      </div>
    );
  }

  if (!consultation.meetLink) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 border border-amber-200">
        <Clock className="h-4 w-4" />
        Meeting link not added yet
      </div>
    );
  }

  const ended = hasConsultationEnded(consultation.endDateTime, now);
  if (ended) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200">
        <Clock className="h-4 w-4" />
        Consultation Ended
      </div>
    );
  }

  const inWindow = isWithinJoinWindow(consultation.startDateTime, consultation.endDateTime, now);

  if (inWindow) {
    return (
      <a
        href={consultation.meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition ring-2 ring-emerald-400 ring-offset-1 animate-pulse"
      >
        <Video className="h-4.5 w-4.5" />
        Join Video Consultation
      </a>
    );
  }

  // Before 10-minute window
  const minutesUntil = getMinutesUntilJoinWindow(consultation.startDateTime, now);
  const startMs = consultation.startDateTime.toDate().getTime();
  const joinWindowTime = new Date(startMs - 10 * 60 * 1000);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200">
        <Clock className="h-4 w-4 text-slate-500" />
        {minutesUntil > 0 ? (
          <span>
            Meeting available in {minutesUntil} {minutesUntil === 1 ? "minute" : "minutes"}
          </span>
        ) : (
          <span>Available at {formatISTTime(joinWindowTime)}</span>
        )}
      </div>
      <span className="text-[11px] text-slate-400 hidden sm:inline">
        (Opens 10 mins before appointment)
      </span>
    </div>
  );
};
