"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Doctor } from "@/types";
import { getAssignedDoctorsForFranchise } from "@/services/assignmentService";
import { useAuth } from "@/hooks/useAuth";
import { Stethoscope, Calendar, Clock, PlusCircle, Award, User } from "lucide-react";

export default function FranchiseDoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const franchiseId = user?.referenceId;

  useEffect(() => {
    async function load() {
      if (!franchiseId) return;
      try {
        const list = await getAssignedDoctorsForFranchise(franchiseId);
        setDoctors(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [franchiseId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assigned Doctors & Specialists
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Doctors assigned to your franchise centre available for telemedicine video consultations.
          </p>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-sm font-bold text-slate-700">No Doctors Currently Assigned</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Please contact CMGC central administration to assign specialized doctors to your franchise centre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc.doctorId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-cmgc-primary transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-cmgc-primary shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Dr. {doc.name}</h2>
                    <p className="text-xs font-semibold text-cmgc-primary">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-semibold text-slate-800">
                      {doc.experience ? `${doc.experience} years` : "Experienced"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reg. No:</span>
                    <span className="font-mono text-[11px] text-slate-800">
                      {doc.registrationNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Availability:</span>
                    <span className="font-medium text-emerald-700">Mon - Sat (Regular Slots)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  href={`/franchise/consultations/new?doctorId=${doc.doctorId}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cmgc-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition"
                >
                  <Calendar className="h-4 w-4" /> Book Consultation
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
