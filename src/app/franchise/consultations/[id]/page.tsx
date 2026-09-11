"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Consultation, ConsultationReport, Prescription } from "@/types";
import { getConsultationById } from "@/services/consultationService";
import { getConsultationReports } from "@/services/reportService";
import { getPrescriptionByConsultationId } from "@/services/prescriptionService";
import { generatePrescriptionPdf } from "@/utils/pdf";
import { formatINR } from "@/utils/formatters";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import {
  ArrowLeft,
  User,
  FileText,
  Video,
  Download,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function FranchiseConsultationDetailPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id: string }>;
} = {}) {
  const routeParams = useParams();
  const consultationId = routeParams?.id || "";

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [reports, setReports] = useState<ConsultationReport[]>([]);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await getConsultationById(consultationId);
        setConsultation(c);
        if (c) {
          const [rList, rx] = await Promise.all([
            getConsultationReports(consultationId),
            getPrescriptionByConsultationId(consultationId),
          ]);
          setReports(rList);
          setPrescription(rx);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [consultationId]);

  const handleDownloadPdf = () => {
    if (!prescription) return;
    const doc = generatePrescriptionPdf(prescription);
    doc.save(`CMGC_Prescription_${prescription.consultationId}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-2 text-lg font-bold text-slate-800">Consultation Not Found</h2>
        <Link
          href="/franchise/consultations"
          className="mt-4 inline-block text-xs font-bold text-cmgc-primary hover:underline"
        >
          &larr; Back to all consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/franchise/consultations"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono">
                {consultation.consultationId}
              </h1>
              <StatusBadge
                status={consultation.status}
                rescheduled={consultation.rescheduled}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultation Fee:{" "}
              <span className="font-bold text-slate-800">
                {formatINR(consultation.consultationFee)}
              </span>{" "}
              (Snapshotted)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MeetingJoinButton consultation={consultation} />
        </div>
      </div>

      {/* Appointment Time Card (Highlights Requested vs Confirmed) */}
      <AppointmentTimeCard consultation={consultation} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <User className="h-4 w-4 text-cmgc-primary" />
            <h2 className="text-sm font-bold text-slate-900">Patient Details (Snapshot)</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="font-bold text-slate-900">{consultation.patientNameSnapshot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Age:</span>
              <span className="text-slate-700">{consultation.patientAgeSnapshot} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Address:</span>
              <span className="text-slate-700">{consultation.patientAddressSnapshot || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Clinical Problem */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <FileText className="h-4 w-4 text-cmgc-primary" />
            <h2 className="text-sm font-bold text-slate-900">Clinical Medical Problem</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">
                Condition
              </span>
              <span className="text-slate-900 font-bold">{consultation.disease}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">
                Description
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg">
                {consultation.diseaseDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports and Prescription */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Uploaded Reports */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900">Attached Medical Reports</h2>
            <span className="text-xs text-slate-400">({reports.length} files)</span>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No reports attached.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {reports.map((r) => (
                <div key={r.reportId} className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{r.fileName}</span>
                  {r.secureUrl && (
                    <a
                      href={r.secureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cmgc-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescription Download */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900">Finalized Prescription</h2>
            {prescription && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {prescription.status}
              </span>
            )}
          </div>

          {prescription ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Diagnosis: <span className="font-bold text-slate-900">{prescription.diagnosis}</span>
              </p>
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cmgc-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition"
              >
                <Download className="h-4 w-4" /> Download Official CMGC Prescription (PDF)
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              Prescription will become available once consultation is concluded by the doctor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
