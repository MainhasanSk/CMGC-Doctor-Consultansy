"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Patient, Doctor, PricingSettings } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { searchPatients, getPatientById } from "@/services/patientService";
import { getAssignedDoctorsForFranchise } from "@/services/assignmentService";
import { getPricingSettings } from "@/services/pricingService";
import { createConsultation } from "@/services/consultationService";
import { uploadFileToCloudinary, createConsultationReport } from "@/services/reportService";
import { formatINR } from "@/utils/formatters";
import { formatISTDate, formatISTTime, createISTTimestamp } from "@/utils/date";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  ArrowLeft,
  User,
  FileText,
  UploadCloud,
  Stethoscope,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  Trash2,
} from "lucide-react";

function ConsultationBookingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const franchiseId = user?.referenceId || "FR-1001";

  // Wizard Step: 1 = Patient, 2 = Medical, 3 = Reports, 4 = Doctor, 5 = Date/Time, 6 = Review
  const [step, setStep] = useState<number>(1);

  // Data lists
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const [disease, setDisease] = useState("");
  const [diseaseDescription, setDiseaseDescription] = useState("");
  const [extraMessage, setExtraMessage] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Default to tomorrow 5:00 PM (17:00)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [requestedDate, setRequestedDate] = useState<string>(
    tomorrow.toISOString().split("T")[0]
  );
  const [requestedTime, setRequestedTime] = useState<string>("17:00");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function init() {
      if (!franchiseId) return;
      try {
        const [docList, pList, priceData] = await Promise.all([
          getAssignedDoctorsForFranchise(franchiseId),
          searchPatients(franchiseId, ""),
          getPricingSettings(),
        ]);
        setDoctors(docList);
        setPatients(pList);
        setPricing(priceData);

        // Preselect patient if query param passed
        const initialPatientId = searchParams.get("patientId");
        if (initialPatientId) {
          const p = await getPatientById(initialPatientId);
          if (p) setSelectedPatient(p);
        }

        // Preselect doctor if query param passed
        const initialDoctorId = searchParams.get("doctorId");
        if (initialDoctorId) {
          const d = docList.find((doc) => doc.doctorId === initialDoctorId);
          if (d) setSelectedDoctor(d);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, [franchiseId, searchParams]);

  const handlePatientSearch = async (query: string) => {
    setPatientSearch(query);
    if (!franchiseId) return;
    const res = await searchPatients(franchiseId, query);
    setPatients(res);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter((f) => f.size <= 10 * 1024 * 1024);
      if (validFiles.length < filesArray.length) {
        alert("Some files exceeded 10MB limit and were skipped.");
      }
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      setErrorMessage("You must be logged in as an authorized franchise operator to book consultations.");
      return;
    }
    if (!selectedPatient) {
      setErrorMessage("Please select a patient before proceeding.");
      setStep(1);
      return;
    }
    if (!selectedDoctor) {
      setErrorMessage("Please select an authorized consulting doctor.");
      setStep(4);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Create Consultation
      const consultationId = await createConsultation({
        patientId: selectedPatient.patientId,
        doctorId: selectedDoctor.doctorId,
        franchiseId,
        disease: disease.trim(),
        diseaseDescription: diseaseDescription.trim(),
        extraMessage: extraMessage.trim(),
        requestedDate,
        requestedTime,
        actorUserId: user.uid,
        actorRole: "FRANCHISE",
      });

      // 2. Upload and attach medical reports (if any)
      for (const file of selectedFiles) {
        try {
          const uploadRes = await uploadFileToCloudinary(file);
          await createConsultationReport({
            consultationId,
            patientId: selectedPatient.patientId,
            franchiseId,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
            cloudinaryPublicId: uploadRes.publicId,
            secureUrl: uploadRes.secureUrl,
            uploadedBy: user.uid,
          });
        } catch (fileErr) {
          console.error("Report file upload error:", fileErr);
        }
      }

      router.push(`/franchise/consultations/${consultationId}`);
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setStep(5); // Go back to time selection if conflict
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/franchise/consultations"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Book Video Consultation
          </h1>
          <p className="text-xs text-slate-500">
            Step {step} of 6 — Patient, Medical Condition, Specialist, and Requested Appointment Time
          </p>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200 text-xs font-semibold">
        {[
          { num: 1, label: "Patient" },
          { num: 2, label: "Medical Info" },
          { num: 3, label: "Reports" },
          { num: 4, label: "Doctor" },
          { num: 5, label: "Date & Time" },
          { num: 6, label: "Review & Submit" },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-1.5 ${
              step === s.num
                ? "text-cmgc-primary font-bold"
                : step > s.num
                ? "text-emerald-700"
                : "text-slate-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step === s.num
                  ? "bg-cmgc-primary text-white"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Step 1: Patient Selection */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Step 1 — Select or Create Patient</h2>
              <p className="text-xs text-slate-500">Search patient by phone number or name.</p>
            </div>
            <Link
              href="/franchise/patients/new"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-cmgc-primary hover:bg-blue-100 transition"
            >
              <Plus className="h-3.5 w-3.5" /> New Patient
            </Link>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone number or patient name..."
              value={patientSearch}
              onChange={(e) => handlePatientSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {patients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No patients found. Create a new patient to proceed.
              </div>
            ) : (
              patients.map((p) => (
                <div
                  key={p.patientId}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-3.5 cursor-pointer transition flex items-center justify-between ${
                    selectedPatient?.patientId === p.patientId
                      ? "bg-blue-50/80 border-l-4 border-cmgc-primary"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      ({p.age} yrs • {p.gender})
                    </span>
                    <div className="text-[11px] text-slate-500">
                      Phone: <span className="font-mono text-slate-700">{p.phone}</span> • {p.address}
                    </div>
                  </div>
                  {selectedPatient?.patientId === p.patientId && (
                    <CheckCircle2 className="h-4 w-4 text-cmgc-primary shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!selectedPatient}
              onClick={() => setStep(2)}
              className="rounded-lg bg-cmgc-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-40"
            >
              Next: Medical Information &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Medical Information */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Step 2 — Clinical Problem & Symptoms</h2>
            <p className="text-xs text-slate-500">Describe the medical problem for the consulting specialist.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Disease / Chief Medical Complaint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Type 2 Diabetes Mellitus / Blood Sugar Evaluation"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Symptoms & Clinical Case Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe symptoms, duration, current medications, past medical history..."
              value={diseaseDescription}
              onChange={(e) => setDiseaseDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Extra Message / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Patient prefers Tamil/English communication"
              value={extraMessage}
              onChange={(e) => setExtraMessage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!disease.trim() || !diseaseDescription.trim()}
              onClick={() => setStep(3)}
              className="rounded-lg bg-cmgc-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-40"
            >
              Next: Upload Reports &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Medical Reports Upload */}
      {step === 3 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Step 3 — Upload Medical Reports (Optional)</h2>
            <p className="text-xs text-slate-500">
              Upload blood tests, lab investigations, or scans (PDF, JPG, PNG — max 10MB per file).
            </p>
          </div>

          <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-cmgc-primary transition bg-slate-50/50">
            <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className="cursor-pointer font-bold text-cmgc-primary hover:underline"
              >
                Click to browse files
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, JPEG, PNG up to 10MB each</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold text-slate-800">{file.name}</span>
                    <span className="text-[11px] text-slate-400">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              &larr; Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-lg bg-cmgc-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition"
            >
              Next: Select Doctor &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Doctor Selection */}
      {step === 4 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Step 4 — Select Consulting Specialist</h2>
            <p className="text-xs text-slate-500">Only active specialists assigned to your franchise are shown.</p>
          </div>

          {doctors.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No doctors assigned to this franchise. Please contact CMGC administration.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((d) => (
                <div
                  key={d.doctorId}
                  onClick={() => setSelectedDoctor(d)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    selectedDoctor?.doctorId === d.doctorId
                      ? "border-cmgc-primary bg-blue-50/70 ring-2 ring-cmgc-primary/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-cmgc-primary flex items-center justify-center shrink-0">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Dr. {d.name}</h3>
                    <p className="text-xs font-semibold text-cmgc-primary">{d.specialization}</p>
                    <p className="text-[11px] text-slate-500">{d.qualification}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Reg: {d.registrationNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!selectedDoctor}
              onClick={() => setStep(5)}
              className="rounded-lg bg-cmgc-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-40"
            >
              Next: Date & Time &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Requested Date & Time */}
      {step === 5 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Step 5 — Requested Appointment Slot</h2>
            <p className="text-xs text-slate-500">
              Select your preferred appointment date and time in Asia/Kolkata timezone (IST).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Requested Date (IST) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Preferred Time (IST) <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-200 text-slate-700">
            <span className="font-bold text-cmgc-primary block mb-1">
              Important Rescheduling Policy:
            </span>
            The requested time is submitted to Dr. {selectedDoctor?.name}. The doctor or administrator may confirm this requested time or propose a confirmed time that accommodates the doctor&apos;s active clinic schedule. Your franchise will receive an instant in-app notification if the time is adjusted.
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!requestedDate || !requestedTime}
              onClick={() => setStep(6)}
              className="rounded-lg bg-cmgc-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-40"
            >
              Next: Review & Confirm &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Review & Final Submission */}
      {step === 6 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Step 6 — Review Consultation Booking</h2>
            <p className="text-xs text-slate-500">
              Verify patient details, clinical complaint, consulting doctor, and fee snapshot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Patient</span>
              <div className="font-bold text-slate-900 text-sm">{selectedPatient?.name}</div>
              <div className="text-slate-500">
                {selectedPatient?.age} yrs • {selectedPatient?.gender}
              </div>
              <div className="text-slate-600 mt-1 font-mono">{selectedPatient?.phone}</div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Consulting Doctor
              </span>
              <div className="font-bold text-slate-900 text-sm">Dr. {selectedDoctor?.name}</div>
              <div className="text-cmgc-primary font-semibold">{selectedDoctor?.specialization}</div>
              <div className="text-slate-500">{selectedDoctor?.qualification}</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical Condition</span>
            <div className="font-bold text-slate-900">{disease}</div>
            <p className="text-slate-600 leading-relaxed pt-1">{diseaseDescription}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Requested Schedule
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {requestedDate} at {requestedTime} (IST)
              </div>
              <span className="text-[11px] text-slate-500">Duration: 30 minutes</span>
            </div>

            <div className="rounded-xl bg-purple-50 p-4 border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-700 block mb-1">
                Fee Snapshot (Historical)
              </span>
              <div className="font-extrabold text-purple-950 text-xl">
                {formatINR(pricing?.videoConsultationFee || 500)}
              </div>
              <span className="text-[11px] text-purple-700">Snapshotted into consultation record</span>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Attached Reports: </span>
              {selectedFiles.map((f) => f.name).join(", ")}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(5)}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cmgc-navy transition disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating Booking & Uploading Reports..." : "Confirm & Submit Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
        </div>
      }
    >
      <ConsultationBookingContent />
    </Suspense>
  );
}
