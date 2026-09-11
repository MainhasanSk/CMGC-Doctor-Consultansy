"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation, Prescription } from "@/types";
import { getDoctorConsultations } from "@/services/consultationService";
import { getPrescriptionByConsultationId } from "@/services/prescriptionService";
import { generatePrescriptionPdf } from "@/utils/pdf";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate, formatISTTime } from "@/utils/date";
import {
  CheckCircle2,
  FileSignature,
  Download,
  Plus,
  Edit3,
  User,
  ExternalLink,
} from "lucide-react";

export default function DoctorCompletedPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [rxMap, setRxMap] = useState<Record<string, Prescription | null>>({});
  const [loading, setLoading] = useState(true);

  const doctorId = user?.referenceId;

  const loadData = async () => {
    if (!doctorId) return;
    try {
      const list = await getDoctorConsultations(doctorId);
      const completed = list.filter((c) => c.status === "COMPLETED");
      setConsultations(completed);

      const map: Record<string, Prescription | null> = {};
      for (const item of completed) {
        const rx = await getPrescriptionByConsultationId(item.consultationId);
        map[item.consultationId] = rx;
      }
      setRxMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [doctorId]);

  const handleDownloadPdf = (rx: Prescription) => {
    const doc = generatePrescriptionPdf(rx);
    doc.save(`CMGC_Prescription_${rx.consultationId}.pdf`);
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
          Completed Consultations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Concluded telemedicine consultations. Create and finalize certified CMGC prescriptions.
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 text-base font-bold text-slate-700">No Completed Consultations Yet</h2>
          <p className="mt-1 text-xs text-slate-400">
            Completed appointments will appear here after being marked as finished.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Consultation ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Concluded On</th>
                  <th className="px-4 py-3">Prescription Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consultations.map((item) => {
                  const rx = rxMap[item.consultationId];
                  return (
                    <tr key={item.consultationId} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                        {item.consultationId}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{item.patientNameSnapshot}</div>
                        <div className="text-[11px] text-slate-500">{item.patientAgeSnapshot} yrs</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 max-w-xs truncate">
                        {item.disease}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatISTDate(item.completedAt || item.endDateTime)}
                      </td>
                      <td className="px-4 py-3.5">
                        {!rx ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Pending Creation
                          </span>
                        ) : rx.status === "DRAFT" ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            Draft (Unfinalized)
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                            Finalized & Certified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {!rx ? (
                          <Link
                            href={`/doctor/prescriptions/new?consultationId=${item.consultationId}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-cmgc-primary px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-cmgc-navy transition"
                          >
                            <Plus className="h-3.5 w-3.5" /> Create Prescription
                          </Link>
                        ) : rx.status === "DRAFT" ? (
                          <Link
                            href={`/doctor/prescriptions/${rx.prescriptionId}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit / Finalize
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleDownloadPdf(rx)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
