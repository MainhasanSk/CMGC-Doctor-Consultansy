"use client";

import React, { useState, useEffect } from "react";
import { Franchise } from "@/types";
import { getFranchiseById } from "@/services/franchiseService";
import { useAuth } from "@/hooks/useAuth";
import { Building2, User, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";

export default function FranchiseProfilePage() {
  const { user } = useAuth();
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);

  const franchiseId = user?.referenceId;

  useEffect(() => {
    async function load() {
      if (!franchiseId) return;
      try {
        const data = await getFranchiseById(franchiseId);
        setFranchise(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [franchiseId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Franchise Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Registered centre details, location coordinates, and operational credentials.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-cmgc-primary shrink-0">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{franchise?.name}</h2>
            <p className="text-xs font-mono text-slate-500">Franchise ID: {franchise?.franchiseId}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Active Operating Kiosk
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Centre Manager
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" /> {franchise?.ownerName}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Contact Phone
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-500" /> {franchise?.phone}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Registered Email
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-500" /> {franchise?.email}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              City & State
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" /> {franchise?.city}, {franchise?.state}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Physical Address
          </span>
          <p className="text-slate-700 leading-relaxed">{franchise?.address}</p>
        </div>
      </div>
    </div>
  );
}
