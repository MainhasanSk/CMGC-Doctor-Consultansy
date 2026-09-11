"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Prescription } from "@/types";
import { listDoctorPrescriptions } from "@/services/prescriptionService";
import { generatePrescriptionPdf } from "@/utils/pdf";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate } from "@/utils/date";
import { FileSignature, Download, Edit3, Search } from "lucide-react";

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const doctorId = user?.referenceId;

  useEffect(() => {
    async function load() {
      if (!doctorId) return;
      try {
        const list = await listDoctorPrescriptions(doctorId);
        setPrescriptions(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  const handleDownload = (p: Prescription) => {
    const doc = generatePrescriptionPdf(p);
    doc.save(`CMGC_Prescription_${p.consultationId}.pdf`);
  };

  const filtered = prescriptions.filter(
    (p) =>
      p.patientNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prescriptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Prescriptions Registry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review drafts, finalize pending prescriptions, and download certified CMGC medical records.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, diagnosis, prescription ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Prescription ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3">Medicines</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.prescriptionId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {p.prescriptionId}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {p.patientNameSnapshot}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 max-w-xs truncate">
                      {p.diagnosis}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.medicines?.length || 0} drugs
                    </td>
                    <td className="px-4 py-3.5">
                      {p.status === "FINALIZED" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-800">
                          Finalized
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatISTDate(p.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {p.status === "DRAFT" ? (
                        <Link
                          href={`/doctor/prescriptions/${p.prescriptionId}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit Draft
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleDownload(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
