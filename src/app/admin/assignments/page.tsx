"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Doctor, Franchise, FranchiseDoctor } from "@/types";
import { listAllDoctors } from "@/services/doctorService";
import { listAllFranchises } from "@/services/franchiseService";
import {
  listAllAssignments,
  assignDoctorToFranchise,
  deactivateAssignment,
} from "@/services/assignmentService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDate } from "@/utils/date";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Ban,
  Search,
  Loader2,
  AlertCircle,
  RotateCcw,
  UserCheck,
  Building2,
  Stethoscope,
} from "lucide-react";

export default function AdminAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<FranchiseDoctor[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Assignment creation form
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const activeFranchises = useMemo(
    () => franchises.filter((f) => f.status === "ACTIVE"),
    [franchises]
  );
  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.status === "ACTIVE"),
    [doctors]
  );

  const loadData = async () => {
    try {
      const [aList, dList, fList] = await Promise.all([
        listAllAssignments(),
        listAllDoctors(),
        listAllFranchises(),
      ]);
      setAssignments(aList);
      setDoctors(dList);
      setFranchises(fList);

      const activeF = fList.filter((f) => f.status === "ACTIVE");
      const activeD = dList.filter((d) => d.status === "ACTIVE");

      const defaultFranchiseId =
        selectedFranchiseId && activeF.some((f) => f.franchiseId === selectedFranchiseId)
          ? selectedFranchiseId
          : activeF[0]?.franchiseId || "";

      if (defaultFranchiseId) {
        setSelectedFranchiseId(defaultFranchiseId);

        // Find doctors already assigned to this franchise
        const assignedDocIds = new Set(
          aList
            .filter((a) => a.franchiseId === defaultFranchiseId && a.status === "ACTIVE")
            .map((a) => a.doctorId)
        );

        // Prefer selecting an unassigned doctor
        const unassignedDoc = activeD.find((d) => !assignedDocIds.has(d.doctorId));
        if (unassignedDoc) {
          setSelectedDoctorId(unassignedDoc.doctorId);
        } else if (activeD.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(activeD[0].doctorId);
        }
      }
    } catch (err) {
      console.error("Error loading assignment data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When franchise selection changes, suggest an unassigned doctor if current doctor is already assigned
  const handleFranchiseChange = (frId: string) => {
    setSelectedFranchiseId(frId);
    setFeedback("");
    setErrorMessage("");

    const assignedDocIds = new Set(
      assignments
        .filter((a) => a.franchiseId === frId && a.status === "ACTIVE")
        .map((a) => a.doctorId)
    );

    if (assignedDocIds.has(selectedDoctorId)) {
      const unassignedDoc = activeDoctors.find((d) => !assignedDocIds.has(d.doctorId));
      if (unassignedDoc) {
        setSelectedDoctorId(unassignedDoc.doctorId);
      }
    }
  };

  const isSelectedDoctorAlreadyAssigned = useMemo(() => {
    if (!selectedFranchiseId || !selectedDoctorId) return false;
    return assignments.some(
      (a) =>
        a.franchiseId === selectedFranchiseId &&
        a.doctorId === selectedDoctorId &&
        a.status === "ACTIVE"
    );
  }, [assignments, selectedFranchiseId, selectedDoctorId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be logged in as an administrator to assign doctors.");
      return;
    }
    if (!selectedFranchiseId) {
      setErrorMessage("Please select a franchise centre.");
      return;
    }
    if (!selectedDoctorId) {
      setErrorMessage("Please select a doctor to assign.");
      return;
    }

    setAssigning(true);
    setFeedback("");
    setErrorMessage("");

    try {
      await assignDoctorToFranchise(selectedFranchiseId, selectedDoctorId, user.uid);
      setFeedback("Doctor successfully assigned to franchise centre!");
      await loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create assignment. Please check connectivity and try again.";
      setErrorMessage(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleDeactivate = async (assignmentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to deactivate this doctor-franchise assignment?")) return;
    setErrorMessage("");
    setFeedback("");

    try {
      await deactivateAssignment(assignmentId, user.uid);
      setFeedback("Doctor assignment deactivated successfully.");
      await loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to remove assignment. Please try again.";
      setErrorMessage(msg);
    }
  };

  const handleReactivate = async (franchiseId: string, doctorId: string) => {
    if (!user) return;
    setErrorMessage("");
    setFeedback("");

    try {
      await assignDoctorToFranchise(franchiseId, doctorId, user.uid);
      setFeedback("Doctor assignment successfully re-activated!");
      await loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to reactivate assignment. Please try again.";
      setErrorMessage(msg);
    }
  };

  const getDoctorName = (docId: string) => {
    const doc = doctors.find((d) => d.doctorId === docId);
    return doc ? `Dr. ${doc.name} (${doc.specialization})` : docId;
  };

  const getFranchiseName = (frId: string) => {
    const fr = franchises.find((f) => f.franchiseId === frId);
    return fr ? `${fr.name} (${fr.city})` : frId;
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      if (statusFilter !== "ALL" && asg.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const franchise = franchises.find((f) => f.franchiseId === asg.franchiseId);
      const doctor = doctors.find((d) => d.doctorId === asg.doctorId);

      return (
        asg.assignmentId.toLowerCase().includes(q) ||
        asg.franchiseId.toLowerCase().includes(q) ||
        asg.doctorId.toLowerCase().includes(q) ||
        (franchise &&
          (franchise.name.toLowerCase().includes(q) || franchise.city.toLowerCase().includes(q))) ||
        (doctor &&
          (doctor.name.toLowerCase().includes(q) ||
            doctor.specialization.toLowerCase().includes(q)))
      );
    });
  }, [assignments, franchises, doctors, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Doctor — Franchise Assignments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorize doctors to accept video consultations from specific franchise kiosks.
        </p>
      </div>

      {/* Assign Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-cmgc-primary" /> Create New Assignment
        </h2>

        {feedback && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-700 border border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback("")}
              className="text-green-600 hover:text-green-800 text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-red-500 hover:text-red-700 text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500" /> Select Franchise
            </label>
            <select
              value={selectedFranchiseId}
              onChange={(e) => handleFranchiseChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            >
              {activeFranchises.length === 0 ? (
                <option value="">No active franchises available</option>
              ) : (
                activeFranchises.map((f) => (
                  <option key={f.franchiseId} value={f.franchiseId}>
                    {f.name} ({f.city})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-slate-500" /> Select Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setFeedback("");
                setErrorMessage("");
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
            >
              {activeDoctors.length === 0 ? (
                <option value="">No active doctors available</option>
              ) : (
                activeDoctors.map((d) => {
                  const isAssigned = assignments.some(
                    (a) =>
                      a.franchiseId === selectedFranchiseId &&
                      a.doctorId === d.doctorId &&
                      a.status === "ACTIVE"
                  );
                  return (
                    <option key={d.doctorId} value={d.doctorId}>
                      Dr. {d.name} — {d.specialization} {isAssigned ? "✓ (Already Assigned)" : ""}
                    </option>
                  );
                })
              )}
            </select>

            {isSelectedDoctorAlreadyAssigned && (
              <p className="mt-1 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 inline" /> This doctor is already assigned to the
                selected franchise.
              </p>
            )}
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={
                assigning ||
                isSelectedDoctorAlreadyAssigned ||
                !selectedFranchiseId ||
                !selectedDoctorId
              }
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-cmgc-navy transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Assigning...
                </>
              ) : isSelectedDoctorAlreadyAssigned ? (
                <>
                  <UserCheck className="h-3.5 w-3.5" /> Doctor Already Assigned
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Assign Doctor to Franchise
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Assignments Table Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cmgc-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-400">Filter:</span>
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  statusFilter === status
                    ? "bg-cmgc-primary text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status === "ALL" ? "All" : status === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Assignment ID</th>
                <th className="px-4 py-3">Franchise Centre</th>
                <th className="px-4 py-3">Assigned Doctor</th>
                <th className="px-4 py-3">Assigned Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-cmgc-primary mb-2" />
                    Loading doctor assignments...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {searchQuery || statusFilter !== "ALL"
                      ? "No assignments matching your filters."
                      : "No doctor assignments recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg) => (
                  <tr key={asg.assignmentId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono text-slate-900">{asg.assignmentId}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {getFranchiseName(asg.franchiseId)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {getDoctorName(asg.doctorId)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatISTDate(asg.assignedAt)}</td>
                    <td className="px-4 py-3.5">
                      {asg.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                          <CheckCircle2 className="h-3 w-3 text-green-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          <Ban className="h-3 w-3 text-slate-500" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {asg.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleDeactivate(asg.assignmentId)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(asg.franchiseId, asg.doctorId)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                        </button>
                      )}
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
