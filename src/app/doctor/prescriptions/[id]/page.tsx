"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Prescription, Medicine } from "@/types";
import {
  getPrescriptionById,
  updateDraftPrescription,
  finalizePrescription,
} from "@/services/prescriptionService";
import { generatePrescriptionPdf } from "@/utils/pdf";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate } from "@/utils/date";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Lock,
  Save,
} from "lucide-react";

export default function EditPrescriptionPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id: string }>;
} = {}) {
  const routeParams = useParams();
  const prescriptionId = routeParams?.id || "";

  const { user } = useAuth();
  const router = useRouter();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [investigations, setInvestigations] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      const p = await getPrescriptionById(prescriptionId);
      setPrescription(p);
      if (p) {
        setDiagnosis(p.diagnosis);
        setMedicines(p.medicines || []);
        setInvestigations(p.investigations || "");
        setAdvice(p.advice || "");
        setFollowUpRequired(p.followUpRequired);
        setFollowUpDate(p.followUpDate || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [prescriptionId]);

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "1-0-1", duration: "5 days", instructions: "After meals" },
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx: number, field: keyof Medicine, val: string) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = async (shouldFinalize: boolean) => {
    if (!user || !prescription) return;
    if (!diagnosis.trim()) {
      setErrorMessage("Diagnosis is required.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const cleanMeds = medicines.filter((m) => m.name.trim().length > 0);

      await updateDraftPrescription(
        prescription.prescriptionId,
        {
          diagnosis: diagnosis.trim(),
          medicines: cleanMeds,
          investigations: investigations.trim(),
          advice: advice.trim(),
          followUpRequired,
          followUpDate: followUpRequired ? followUpDate : undefined,
        },
        user.uid,
        "DOCTOR"
      );

      if (shouldFinalize) {
        await finalizePrescription(prescription.prescriptionId, user.uid, "DOCTOR");
      }

      await loadData();
      if (shouldFinalize) {
        router.push("/doctor/prescriptions");
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
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

  if (!prescription) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-2 text-base font-bold text-slate-800">Prescription Not Found</h2>
        <Link
          href="/doctor/prescriptions"
          className="mt-4 inline-block text-xs font-bold text-cmgc-primary hover:underline"
        >
          &larr; Back to Prescriptions
        </Link>
      </div>
    );
  }

  const isFinalized = prescription.status === "FINALIZED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/doctor/prescriptions"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono">
                {prescription.prescriptionId}
              </h1>
              {isFinalized ? (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Finalized & Immutable
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  Draft
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: {prescription.patientNameSnapshot} • Consultation: {prescription.consultationId}
            </p>
          </div>
        </div>

        {isFinalized && (
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition"
          >
            <Download className="h-4 w-4" /> Download Certified PDF
          </button>
        )}
      </div>

      {isFinalized && (
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            This prescription has been finalized and certified. According to medical compliance regulations, finalized prescriptions cannot be altered.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Form or View */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 text-xs">
        <div>
          <label className="block font-bold text-slate-800 text-xs mb-1">
            Clinical Diagnosis
          </label>
          <input
            type="text"
            disabled={isFinalized}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold focus:border-cmgc-primary focus:outline-none disabled:bg-slate-50"
          />
        </div>

        {/* Medicines */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Rx — Prescribed Medicines ({medicines.length})
            </h3>
            {!isFinalized && (
              <button
                type="button"
                onClick={handleAddMedicine}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-cmgc-primary hover:bg-blue-100 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Medicine
              </button>
            )}
          </div>

          <div className="space-y-3">
            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 items-center"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    disabled={isFinalized}
                    placeholder="Medicine Name"
                    value={med.name}
                    onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none bg-white disabled:bg-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    disabled={isFinalized}
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none bg-white disabled:bg-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    disabled={isFinalized}
                    placeholder="Freq"
                    value={med.frequency}
                    onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none bg-white disabled:bg-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    disabled={isFinalized}
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none bg-white disabled:bg-slate-100"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isFinalized}
                    placeholder="Instructions"
                    value={med.instructions || ""}
                    onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none bg-white disabled:bg-slate-100"
                  />
                  {!isFinalized && medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-red-500 hover:text-red-700 p-1 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investigations & Advice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Recommended Investigations
            </label>
            <textarea
              rows={3}
              disabled={isFinalized}
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              General Medical Advice
            </label>
            <textarea
              rows={3}
              disabled={isFinalized}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Follow-up */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followUpEdit"
              disabled={isFinalized}
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cmgc-primary"
            />
            <label htmlFor="followUpEdit" className="font-bold text-slate-800">
              Follow-up consultation required
            </label>
          </div>

          {followUpRequired && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Date:</span>
              <input
                type="date"
                disabled={isFinalized}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {!isFinalized && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cmgc-navy transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" /> Finalize & Lock Prescription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
