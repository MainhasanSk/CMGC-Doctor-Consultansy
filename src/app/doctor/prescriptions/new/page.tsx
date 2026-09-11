"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Consultation, Doctor, Medicine } from "@/types";
import { getConsultationById } from "@/services/consultationService";
import { getDoctorById } from "@/services/doctorService";
import {
  createDraftPrescription,
  finalizePrescription,
} from "@/services/prescriptionService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate } from "@/utils/date";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  ArrowLeft,
  FileSignature,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";

function NewPrescriptionContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get("consultationId");

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", frequency: "1-0-1", duration: "5 days", instructions: "After meals" },
  ]);
  const [investigations, setInvestigations] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const doctorId = user?.referenceId;

  useEffect(() => {
    async function load() {
      if (!consultationId || !doctorId) return;
      try {
        const [c, d] = await Promise.all([
          getConsultationById(consultationId),
          getDoctorById(doctorId),
        ]);
        setConsultation(c);
        setDoctor(d);
        if (c?.disease) {
          setDiagnosis(c.disease);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [consultationId, doctorId]);

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
    if (!user || !consultation) return;
    if (!diagnosis.trim()) {
      setErrorMessage("Please enter a primary clinical diagnosis.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // Filter out empty medicines
      const cleanMeds = medicines.filter((m) => m.name.trim().length > 0);

      const prescriptionId = await createDraftPrescription({
        consultation,
        diagnosis: diagnosis.trim(),
        medicines: cleanMeds,
        investigations: investigations.trim(),
        advice: advice.trim(),
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        actorUserId: user.uid,
        actorRole: "DOCTOR",
      });

      if (shouldFinalize) {
        await finalizePrescription(prescriptionId, user.uid, "DOCTOR");
      }

      router.push("/doctor/completed");
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
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
        <h2 className="mt-2 text-base font-bold text-slate-800">Consultation Not Found</h2>
        <Link
          href="/doctor/completed"
          className="mt-4 inline-block text-xs font-bold text-cmgc-primary hover:underline"
        >
          &larr; Back to Completed Consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/doctor/completed"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Create Medical Prescription
          </h1>
          <p className="text-xs text-slate-500">
            Official CMGC certified electronic prescription form for {consultation.patientNameSnapshot}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Auto-filled Metadata Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Patient Information (Auto-filled)
          </span>
          <div className="font-bold text-slate-900 text-sm">{consultation.patientNameSnapshot}</div>
          <div className="text-slate-500">{consultation.patientAgeSnapshot} years • {consultation.patientAddressSnapshot || "Address on file"}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Consulting Doctor (Auto-filled)
          </span>
          <div className="font-bold text-slate-900 text-sm">Dr. {doctor?.name}</div>
          <div className="text-cmgc-primary font-semibold">{doctor?.specialization}</div>
          <div className="text-slate-500 font-mono text-[11px]">Reg: {doctor?.registrationNumber}</div>
        </div>
      </div>

      {/* Prescription Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 text-xs">
        {/* Diagnosis */}
        <div>
          <label className="block font-bold text-slate-800 text-xs mb-1">
            Clinical Diagnosis <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Type 2 Diabetes Mellitus with Essential Hypertension"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
          />
        </div>

        {/* Medicines (Rx) */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Rx — Medications List
              </h3>
              <p className="text-[11px] text-slate-500">Add prescribed drugs, dosages, and administration instructions.</p>
            </div>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-cmgc-primary hover:bg-blue-100 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Medicine
            </button>
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
                    placeholder="Medicine Name (e.g. Metformin)"
                    value={med.name}
                    onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cmgc-primary bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Dosage (500mg)"
                    value={med.dosage}
                    onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-cmgc-primary bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Freq (1-0-1)"
                    value={med.frequency}
                    onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-cmgc-primary bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Duration (5 days)"
                    value={med.duration}
                    onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-cmgc-primary bg-white"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={med.instructions || ""}
                    onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-cmgc-primary bg-white"
                  />
                  {medicines.length > 1 && (
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
              Recommended Investigations / Lab Tests (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Fasting Blood Sugar, HbA1c, Lipid Profile in 2 weeks"
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              General Medical Advice & Dietary Instructions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Low sodium diet, 30 minutes daily aerobic walk, monitor blood glucose"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Follow-up */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followUp"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cmgc-primary focus:ring-cmgc-primary"
            />
            <label htmlFor="followUp" className="font-bold text-slate-800 cursor-pointer">
              Follow-up consultation recommended
            </label>
          </div>

          {followUpRequired && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Date:</span>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-cmgc-primary bg-white"
              />
            </div>
          )}
        </div>

        {/* Submission Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            href="/doctor/completed"
            className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cmgc-navy transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <CheckCircle2 className="h-4 w-4" /> Finalize & Certify Prescription
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
        </div>
      }
    >
      <NewPrescriptionContent />
    </Suspense>
  );
}
