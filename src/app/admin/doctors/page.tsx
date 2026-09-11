"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Doctor } from "@/types";
import { listAllDoctors, setDoctorStatus } from "@/services/doctorService";
import { useAuth } from "@/hooks/useAuth";
import { Stethoscope, Plus, CheckCircle2, Ban, Search } from "lucide-react";

export default function AdminDoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadDoctors = async () => {
    try {
      const list = await listAllDoctors();
      setDoctors(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleToggleStatus = async (doctor: Doctor) => {
    if (!user) return;
    const newStatus = doctor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmMsg = `Are you sure you want to ${newStatus.toLowerCase()} Dr. ${doctor.name}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await setDoctorStatus(doctor.doctorId, newStatus, user.uid);
      await loadDoctors();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified medical specialists, qualifications, registration credentials, and active statuses.
          </p>
        </div>
        <Link
          href="/admin/doctors/new"
          className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
        >
          <Plus className="h-4 w-4" /> Add Doctor
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors by name, specialization, registration number..."
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
                <th className="px-4 py-3">Doctor ID</th>
                <th className="px-4 py-3">Name & Qualifications</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Registration No.</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No doctors found.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {doc.doctorId}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">Dr. {doc.name}</div>
                      <div className="text-[11px] text-slate-500">{doc.qualification}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {doc.specialization}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {doc.registrationNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{doc.phone}</div>
                      <div className="text-[11px] text-slate-400">{doc.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {doc.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          <CheckCircle2 className="h-3 w-3 text-green-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                          <Ban className="h-3 w-3 text-red-600" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition ${
                          doc.status === "ACTIVE"
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {doc.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
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
