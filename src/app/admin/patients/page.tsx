"use client";

import React, { useState, useEffect } from "react";
import { Patient } from "@/types";
import { listAllPatients } from "@/services/patientService";
import { formatISTDate } from "@/utils/date";
import { Users, Search } from "lucide-react";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const list = await listAllPatients();
        setPatients(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Registered patients across all CMGC regional franchise locations.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients by name, phone, or ID..."
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
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Age & Gender</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Franchise Origin</th>
                <th className="px-4 py-3">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
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
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      {p.createdByFranchiseId}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatISTDate(p.createdAt)}</td>
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
