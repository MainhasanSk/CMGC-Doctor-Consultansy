"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Consultation, ConsultationReport, Prescription, Payment } from "@/types";
import {
  getConsultationById,
  confirmConsultation,
  addMeetingLink,
} from "@/services/consultationService";
import { getConsultationReports } from "@/services/reportService";
import { getPrescriptionByConsultationId } from "@/services/prescriptionService";
import { getConsultationPayment, recordPayment } from "@/services/paymentService";
import { generatePrescriptionPdf } from "@/utils/pdf";
import { formatINR } from "@/utils/formatters";
import { formatISTDate, formatISTTime } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppointmentTimeCard } from "@/components/consultation/AppointmentTimeCard";
import { MeetingJoinButton } from "@/components/consultation/MeetingJoinButton";
import { RescheduleDialog } from "@/components/consultation/RescheduleDialog";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Video,
  Download,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Stethoscope,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function AdminConsultationDetailPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id: string }>;
} = {}) {
  const routeParams = useParams();
  const consultationId = routeParams?.id || "";

  const { user } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [reports, setReports] = useState<ConsultationReport[]>([]);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  // Meet link form
  const [meetLinkInput, setMeetLinkInput] = useState("");
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetSuccess, setMeetSuccess] = useState(false);

  // Reschedule dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  // Payment record form
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const refreshData = async () => {
    try {
      const c = await getConsultationById(consultationId);
      setConsultation(c);
      if (c) {
        setMeetLinkInput(c.meetLink || "");
        const [rList, rx, pay] = await Promise.all([
          getConsultationReports(consultationId),
          getPrescriptionByConsultationId(consultationId),
          getConsultationPayment(consultationId),
        ]);
        setReports(rList);
        setPrescription(rx);
        setPayment(pay);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load consultation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [consultationId]);

  const handleConfirmSameTime = async () => {
    if (!user || !consultation) return;
    setLoading(true);
    try {
      await confirmConsultation(consultation.consultationId, user.uid, "ADMIN");
      await refreshData();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSaveMeetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !consultation) return;
    setMeetLoading(true);
    setErrorMessage("");
    setMeetSuccess(false);

    try {
      await addMeetingLink(consultation.consultationId, meetLinkInput.trim(), user.uid);
      setMeetSuccess(true);
      await refreshData();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setMeetLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!user || !consultation) return;
    setPaymentLoading(true);
    try {
      await recordPayment({
        consultationId: consultation.consultationId,
        patientId: consultation.patientId,
        franchiseId: consultation.franchiseId,
        amount: consultation.consultationFee,
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        actorUserId: user.uid,
        actorRole: "ADMIN",
      });
      await refreshData();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setPaymentLoading(false);
    }
  };

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
        <p className="mt-1 text-xs text-slate-500">
          No record exists for consultation ID {consultationId}.
        </p>
        <Link
          href="/admin/consultations"
          className="mt-4 inline-block text-xs font-bold text-cmgc-primary hover:underline"
        >
          &larr; Back to all consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/consultations"
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
              Booked on {formatISTDate(consultation.createdAt)} • Fee:{" "}
              <span className="font-bold text-slate-800">
                {formatINR(consultation.consultationFee)}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls for Pending */}
        {consultation.status === "PENDING" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmSameTime}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
            >
              Confirm at Requested Time
            </button>
            <button
              onClick={() => setRescheduleOpen(true)}
              className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm transition"
            >
              Confirm & Reschedule
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Appointment Time Card (Highlights Requested vs Confirmed) */}
      <AppointmentTimeCard consultation={consultation} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Patient, Medical Details, Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <User className="h-4 w-4 text-cmgc-primary" />
              <h2 className="text-sm font-bold text-slate-900">Patient Details (Snapshot)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Full Name
                </span>
                <span className="text-slate-900 font-bold text-sm">
                  {consultation.patientNameSnapshot}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Age & ID
                </span>
                <span className="text-slate-900 font-semibold">
                  {consultation.patientAgeSnapshot} years ({consultation.patientId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Address
                </span>
                <span className="text-slate-900">
                  {consultation.patientAddressSnapshot || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Medical Problem & Description */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <FileText className="h-4 w-4 text-cmgc-primary" />
              <h2 className="text-sm font-bold text-slate-900">Clinical Medical Information</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Medical Problem / Disease
                </span>
                <span className="text-slate-900 font-bold text-sm">
                  {consultation.disease}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Symptom & Case Description
                </span>
                <p className="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {consultation.diseaseDescription}
                </p>
              </div>
              {consultation.extraMessage && (
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[10px]">
                    Franchise Extra Message
                  </span>
                  <p className="text-slate-600 mt-0.5">{consultation.extraMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Reports */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cmgc-primary" />
                <h2 className="text-sm font-bold text-slate-900">Uploaded Medical Reports</h2>
              </div>
              <span className="text-xs text-slate-400">({reports.length} files)</span>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No medical reports uploaded for this consultation.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <div key={r.reportId} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-800">{r.fileName}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        ({Math.round(r.fileSize / 1024)} KB)
                      </span>
                    </div>
                    {r.secureUrl && (
                      <a
                        href={r.secureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cmgc-primary hover:underline"
                      >
                        View Report <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Meet Link, Join Button, Payment, Prescription */}
        <div className="space-y-6">
          {/* Google Meet Management */}
          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Video className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Google Meet Link (V1)</h2>
            </div>

            <form onSubmit={handleSaveMeetLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Admin Meet URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={meetLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-cmgc-primary px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-50"
              >
                {meetLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {consultation.meetLink ? "Update Meet Link" : "Save & Assign Meet Link"}
              </button>

              {meetSuccess && (
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Google Meet link saved successfully.
                </p>
              )}
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                10-Minute Join Rule Status
              </span>
              <MeetingJoinButton consultation={consultation} />
            </div>
          </div>

          {/* Payment Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <CreditCard className="h-4 w-4 text-cmgc-primary" />
              <h2 className="text-sm font-bold text-slate-900">Payment Status</h2>
            </div>

            {payment ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900">{formatINR(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">{payment.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-medium text-slate-800">{payment.paymentMethod}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-slate-500 mb-3">
                  Fee: {formatINR(consultation.consultationFee)} (Unrecorded)
                </p>
                <button
                  onClick={handleRecordPayment}
                  disabled={paymentLoading}
                  className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {paymentLoading ? "Recording..." : "Record Manual Payment (Paid)"}
                </button>
              </div>
            )}
          </div>

          {/* Prescription Card */}
          {prescription && (
            <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-sm font-bold text-slate-900">Prescription</h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {prescription.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Diagnosis: <span className="font-bold text-slate-800">{prescription.diagnosis}</span>
              </p>
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-cmgc-primary px-3 py-2 text-xs font-bold text-white hover:bg-cmgc-navy transition shadow-xs"
              >
                <Download className="h-4 w-4" /> Download CMGC Prescription PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Dialog Modal */}
      {user && (
        <RescheduleDialog
          consultation={consultation}
          actorUserId={user.uid}
          actorRole="ADMIN"
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
}
