"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Consultation } from "@/types";
import { getDoctorConsultations } from "@/services/consultationService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate } from "@/utils/date";
import { Users, Search, Calendar, FileText } from "lucide-react";

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const doctorId = user?.referenceId;

  useEffect(() => {
    async function load() {
      if (!doctorId) return;
      try {
        const list = await getDoctorConsultations(doctorId);
        setConsultations(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  // Aggregate patients uniquely from this doctor's consultations
  const patientMap = new Map<
    string,
    {
      patientId: string;
      name: string;
      age: number;
      address: string;
      latestVisit: string;
      visitCount: number;
      conditions: string[];
    }
  >();

  for (const c of consultations) {
    if (!patientMap.has(c.patientId)) {
      patientMap.set(c.patientId, {
        patientId: c.patientId,
        name: c.patientNameSnapshot,
        age: c.patientAgeSnapshot,
        address: c.patientAddressSnapshot,
        latestVisit: formatISTDate(c.startDateTime),
        visitCount: 1,
        conditions: [c.disease],
      });
    } else {
      const existing = patientMap.get(c.patientId)!;
      existing.visitCount += 1;
      if (!existing.conditions.includes(c.disease)) {
        existing.conditions.push(c.disease);
      }
    }
  }

  const patientList = Array.from(patientMap.values()).filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.conditions.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assigned Patients</h1>
        <p className="text-xs text-slate-500 mt-1">
          Patients who have had consultations with you across authorized CMGC franchise centres.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, ID, or condition..."
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
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Clinical Conditions</th>
                <th className="px-4 py-3">Consultations</th>
                <th className="px-4 py-3">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patientList.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {p.patientId}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="px-4 py-3.5 text-slate-700">{p.age} yrs</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {p.conditions.join(", ")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {p.visitCount} {p.visitCount === 1 ? "visit" : "visits"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{p.address || "N/A"}</td>
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
