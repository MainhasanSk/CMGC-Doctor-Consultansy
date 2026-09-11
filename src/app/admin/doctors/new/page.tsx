"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createDoctor } from "@/services/doctorService";
import { createNewAuthUser } from "@/services/authService";
import { db } from "@/firebase/config";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { User } from "@/types";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { generateDoctorId } from "@/utils/formatters";
import { ArrowLeft, Stethoscope, Loader2, AlertCircle } from "lucide-react";

export default function NewDoctorPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Doctor@123");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [experience, setExperience] = useState<number>(5);
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const doctorId = generateDoctorId();

      // Create Firebase Auth user safely without kicking out Admin
      const doctorUid = await createNewAuthUser(email.trim(), password);

      // Create user profile in Firestore
      const userProfile: User = {
        uid: doctorUid,
        name: `Dr. ${name.trim()}`,
        email: email.trim(),
        role: "DOCTOR",
        referenceId: doctorId,
        status: "ACTIVE",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(doc(db, "users", doctorUid), userProfile);

      // Create doctor document
      await createDoctor(
        {
          userId: doctorUid,
          name: name.trim(),
          qualification: qualification.trim(),
          specialization: specialization.trim(),
          registrationNumber: registrationNumber.trim(),
          experience,
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          status: "ACTIVE",
        },
        user.uid,
        doctorId
      );

      router.push("/admin/doctors");
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/doctors"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New Doctor</h1>
          <p className="text-xs text-slate-500">
            Register a medical practitioner with license registration details.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name (without Dr. prefix) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Amit Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Registration Number (State Medical Council) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TNMC-84920"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diabetology & Endocrinology"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Qualifications <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MBBS, MD, FRCP"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Email Address (Login Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="doctor@cmgc.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Initial Password <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Years of Clinical Experience
              </label>
              <input
                type="number"
                min="0"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Clinic / Consulting Address</label>
            <input
              type="text"
              placeholder="e.g. Apollo Telemedicine Suite, Chennai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/admin/doctors"
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-5 py-2.5 font-bold text-white shadow-sm hover:bg-cmgc-navy transition disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating Doctor Profile..." : "Register Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
