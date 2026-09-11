"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Franchise } from "@/types";
import { listAllFranchises, setFranchiseStatus } from "@/services/franchiseService";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Plus, CheckCircle2, Ban, Search } from "lucide-react";

export default function AdminFranchisesPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      const list = await listAllFranchises();
      setFranchises(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (f: Franchise) => {
    if (!user) return;
    const newStatus = f.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} franchise ${f.name}?`)) return;

    try {
      await setFranchiseStatus(f.franchiseId, newStatus, user.uid);
      await loadData();
    } catch (err) {
      alert("Failed to update franchise status");
    }
  };

  const filtered = franchises.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.franchiseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Franchise Centres</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorized regional medical tele-consultation kiosks and franchise locations.
          </p>
        </div>
        <Link
          href="/admin/franchises/new"
          className="inline-flex items-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
        >
          <Plus className="h-4 w-4" /> Add Franchise
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by franchise name, city, owner, ID..."
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
                <th className="px-4 py-3">Franchise ID</th>
                <th className="px-4 py-3">Centre Name</th>
                <th className="px-4 py-3">Manager / Owner</th>
                <th className="px-4 py-3">City & Location</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No franchises found.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.franchiseId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                      {f.franchiseId}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-500">{f.address}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{f.ownerName}</td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {f.city}, {f.state}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{f.phone}</div>
                      <div className="text-[11px] text-slate-400">{f.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {f.status === "ACTIVE" ? (
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
                        onClick={() => handleToggleStatus(f)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition ${
                          f.status === "ACTIVE"
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {f.status === "ACTIVE" ? "Deactivate" : "Activate"}
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
