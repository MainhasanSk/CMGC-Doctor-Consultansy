"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Patient } from "@/types";
import { searchPatients, listFranchisePatients } from "@/services/patientService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate } from "@/utils/date";
import { Users, Plus, Search, Calendar, CheckCircle2, Loader2 } from "lucide-react";

export default function FranchisePatientsPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const franchiseId = user?.referenceId || "FR-1001";

  const loadData = async () => {
    if (!franchiseId && authLoading) return;
    try {
      const list = await listFranchisePatients(franchiseId);
      setPatients(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [franchiseId, authLoading]);

  useEffect(() => {
    const registeredId = searchParams.get("registered");
    if (registeredId) {
      setSuccessMessage(`Patient record (${registeredId}) successfully registered and saved!`);
    }
  }, [searchParams]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (!franchiseId) return;
    const res = await searchPatients(franchiseId, val);
    setPatients(res);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Franchise Patients</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search registered local patients or add a new patient record.
          </p>
        </div>
        <Link
          href="/franchise/patients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
        >
          <Plus className="h-4 w-4" /> Add New Patient
        </Link>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-bold text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-700 hover:text-green-900 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by phone number or patient name..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Age & Gender</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Registered On</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-cmgc-primary mb-2" />
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {searchTerm
                      ? "No patients matched your search query."
                      : "No patients found. Add a new patient to book consultations."}
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {p.patientId}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="px-4 py-3.5">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{p.phone}</td>
                    <td className="px-4 py-3.5 text-slate-600">{p.address}</td>
                    <td className="px-4 py-3.5 text-slate-500">{formatISTDate(p.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/franchise/consultations/new?patientId=${p.patientId}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-cmgc-primary/10 px-3 py-1.5 text-xs font-bold text-cmgc-primary hover:bg-cmgc-primary hover:text-white transition"
                      >
                        <Calendar className="h-3.5 w-3.5" /> Book Consultation
                      </Link>
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
