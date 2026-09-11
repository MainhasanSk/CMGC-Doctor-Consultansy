"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createPatient } from "@/services/patientService";
import { Gender } from "@/types";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { ArrowLeft, UserPlus, Loader2, AlertCircle } from "lucide-react";

export default function NewPatientPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<Gender>("MALE");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const franchiseId = user?.referenceId || "FR-1001";
  const [actionAfterSave, setActionAfterSave] = useState<"book" | "list">("book");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be logged in to register a patient.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const patientId = await createPatient(
        {
          name: name.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          address: address.trim(),
          createdByFranchiseId: franchiseId,
        },
        franchiseId,
        user.uid
      );

      if (actionAfterSave === "list") {
        router.push(`/franchise/patients?registered=${patientId}`);
      } else {
        router.push(`/franchise/consultations/new?patientId=${patientId}`);
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/franchise/patients"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Register New Patient</h1>
          <p className="text-xs text-slate-500">
            Enter patient details for telemedicine consultation booking.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Patient Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Das"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Age (years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="130"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Contact Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Residential Address <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Anna Nagar, Chennai, Tamil Nadu"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/franchise/patients"
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setActionAfterSave("list")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
            >
              {loading && actionAfterSave === "list" && <Loader2 className="h-4 w-4 animate-spin" />}
              Save to Patient List
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setActionAfterSave("book")}
              className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-5 py-2.5 font-bold text-white shadow-sm hover:bg-cmgc-navy transition disabled:opacity-50"
            >
              {loading && actionAfterSave === "book" && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & Book Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
