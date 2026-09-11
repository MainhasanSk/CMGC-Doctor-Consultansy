"use client";

import React, { useState, useEffect } from "react";
import { Doctor, DoctorAvailability } from "@/types";
import { getDoctorById, getDoctorAvailability } from "@/services/doctorService";
import { useAuth } from "@/hooks/useAuth";
import { Stethoscope, Clock, Award, ShieldCheck, User, Phone, Mail, MapPin } from "lucide-react";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  const doctorId = user?.referenceId;

  useEffect(() => {
    async function load() {
      if (!doctorId) return;
      try {
        const [dData, aData] = await Promise.all([
          getDoctorById(doctorId),
          getDoctorAvailability(doctorId),
        ]);
        setDoctor(dData);
        setAvailability(aData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  const days: (keyof DoctorAvailability["weeklySchedule"])[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Professional registration details and weekly consultation availability schedule.
        </p>
      </div>

      {/* Doctor Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-cmgc-primary border border-emerald-100 shrink-0">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Dr. {doctor?.name}</h2>
            <p className="text-xs font-semibold text-cmgc-primary">{doctor?.specialization}</p>
            <p className="text-xs text-slate-500">{doctor?.qualification}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700">
                Reg: {doctor?.registrationNumber}
              </span>
              <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                Active Practitioner
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Contact Phone
            </span>
            <span className="font-semibold text-slate-900">{doctor?.phone}</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Registered Email
            </span>
            <span className="font-semibold text-slate-900">{doctor?.email}</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Clinical Experience
            </span>
            <span className="font-semibold text-slate-900">{doctor?.experience || "N/A"} years</span>
          </div>
        </div>

        {/* Weekly Availability Schedule */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-cmgc-primary" />
            <h3 className="text-sm font-bold text-slate-900">Weekly Tele-Consultation Availability (IST)</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Standard reference hours. Franchises can request consultations at any appointment time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {days.map((day) => {
              const slots = availability?.weeklySchedule[day] || [];
              return (
                <div
                  key={day}
                  className="rounded-xl bg-slate-50 p-3.5 border border-slate-200"
                >
                  <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block mb-1.5 capitalize">
                    {day}
                  </span>
                  {slots.length === 0 ? (
                    <span className="text-slate-400 text-[11px]">No slots / Off</span>
                  ) : (
                    <div className="space-y-1 font-mono text-[11px] text-slate-800 font-semibold">
                      {slots.map((s, idx) => (
                        <div key={idx} className="bg-white px-2 py-1 rounded border border-slate-200">
                          {s.start} — {s.end}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
