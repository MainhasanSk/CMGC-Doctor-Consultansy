"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { User } from "@/types";
import { createNewAuthUser } from "@/services/authService";
import { ShieldCheck, Loader2, CheckCircle2, ArrowRight, UserPlus, Database, AlertCircle } from "lucide-react";
import Link from "next/link";
import { resetLocalDb, getLocalDb, saveLocalDb } from "@/lib/mockStore";

export default function SeedPage() {
  const [activeTab, setActiveTab] = useState<"seed" | "custom">("custom");

  // Seeder state
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  // Custom Admin state
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [customSuccess, setCustomSuccess] = useState(false);
  const [customError, setCustomError] = useState("");

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const createOrSignInUser = async (email: string, pass: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      return cred.user.uid;
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === "auth/email-already-in-use") {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        return cred.user.uid;
      }
      throw err;
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setLogs([]);
    setCompleted(false);

    try {
      addLog("Starting CMGC Environment Initializer...");

      let useLocalFallback = false;

      // 1. Franchise Auth
      addLog("1. Setting up Franchise credentials (franchise@cmgc.org)...");
      const franchiseId = "FR-1001";
      let franchiseUid = "mock-franchise-uid-01";
      try {
        franchiseUid = await createOrSignInUser("franchise@cmgc.org", "Franchise@123");
        await setDoc(doc(db, "users", franchiseUid), {
          uid: franchiseUid,
          name: "CMGC Chennai Central Operator",
          email: "franchise@cmgc.org",
          role: "FRANCHISE",
          referenceId: franchiseId,
          status: "ACTIVE",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        addLog("✓ Franchise cloud user registered (FR-1001)");
      } catch (err: unknown) {
        const error = err as { code?: string };
        addLog(`ℹ Cloud Auth: ${error.code || "provisioning required"} — enabling local session fallback`);
        useLocalFallback = true;
      }

      // 2. Doctor Auth
      addLog("2. Setting up Doctor credentials (doctor@cmgc.org)...");
      const doctorId = "DOC-2001";
      let doctorUid = "mock-doctor-uid-01";
      if (!useLocalFallback) {
        try {
          doctorUid = await createOrSignInUser("doctor@cmgc.org", "Doctor@123");
          await setDoc(doc(db, "users", doctorUid), {
            uid: doctorUid,
            name: "Dr. Amit Sharma",
            email: "doctor@cmgc.org",
            role: "DOCTOR",
            referenceId: doctorId,
            status: "ACTIVE",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          addLog("✓ Doctor cloud user registered (DOC-2001)");
        } catch {
          useLocalFallback = true;
        }
      }

      // 3. Admin Auth
      addLog("3. Setting up Admin credentials (admin@cmgc.org)...");
      let adminUid = "mock-admin-uid-01";
      if (!useLocalFallback) {
        try {
          adminUid = await createOrSignInUser("admin@cmgc.org", "Admin@123");
          await setDoc(doc(db, "users", adminUid), {
            uid: adminUid,
            name: "CMGC Central Admin",
            email: "admin@cmgc.org",
            role: "ADMIN",
            status: "ACTIVE",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          addLog("✓ Admin cloud user registered (admin@cmgc.org)");
        } catch {
          useLocalFallback = true;
        }
      }

      // Always populate/reset the local store to guarantee test stability
      resetLocalDb();
      addLog("✓ Initialized base records (Admin, Franchise FR-1001, Doctor DOC-2001, Schedule)");
      addLog("✓ Initialized Consultation Fee: ₹500 INR");
      addLog("✓ Initialized Patient: Rahul Das (PAT-100001)");
      addLog("✓ Linked Doctor Dr. Amit Sharma to CMGC Chennai Central");

      if (useLocalFallback) {
        addLog("✨ Ready for instant testing! Cloud Firebase project 'cmgcvideoconsultation' can have Auth & Firestore enabled anytime in Firebase Console without affecting tests.");
      } else {
        addLog("✨ Cloud and local synchronization complete!");
      }

      setCompleted(true);
    } catch (err: unknown) {
      const error = err as Error;
      addLog(`❌ Error during initialization: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError("");
    setCustomSuccess(false);

    if (!adminName.trim() || !adminEmail.trim() || !adminPassword) {
      setCustomError("All fields are required.");
      return;
    }

    if (adminPassword.length < 6) {
      setCustomError("Password must be at least 6 characters.");
      return;
    }

    setCustomLoading(true);

    try {
      const normalizedEmail = adminEmail.trim().toLowerCase();

      // Create Firebase Auth user
      const uid = await createNewAuthUser(normalizedEmail, adminPassword);

      const newAdmin: User = {
        uid,
        name: adminName.trim(),
        email: normalizedEmail,
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, "users", uid), newAdmin);
      } catch (err) {
        console.warn("Firestore save failed, saving to local store:", err);
      }

      // Also persist to local database for seamless offline & testing support
      const localDb = getLocalDb();
      localDb.users[uid] = newAdmin;
      saveLocalDb(localDb);

      setCustomSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setCustomError(error.message || "Failed to create Admin account. Please try again.");
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Setup & Initializer</h1>
              <p className="text-xs text-slate-500">
                Create a custom Admin or initialize demo environment.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold text-cmgc-primary hover:underline flex items-center gap-1"
          >
            &larr; Back to Login
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "custom"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Create Custom Admin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seed")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "seed"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="h-4 w-4" /> 1-Click Demo Seed
          </button>
        </div>

        {/* Tab 1: Create Custom Admin */}
        {activeTab === "custom" && (
          <div className="mt-6 space-y-4">
            <p className="text-xs text-slate-600">
              Create a new central Administrator with full system control over franchises, doctors, pricing, and audit logs.
            </p>

            {customError && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div>{customError}</div>
              </div>
            )}

            {customSuccess ? (
              <div className="rounded-xl bg-green-50 p-5 border border-green-200 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="text-sm font-bold text-green-900">Admin Account Created!</h3>
                <p className="text-xs text-green-700">
                  Account <strong>{adminEmail}</strong> has been registered with full <strong>ADMIN</strong> permissions.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-green-800 transition"
                >
                  Go to Login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateCustomAdmin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourdomain.com"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Password (min. 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={customLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {customLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {customLoading ? "Creating Admin..." : "Create Admin User"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: 1-Click Demo Seed */}
        {activeTab === "seed" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900">Preconfigured Demo Accounts:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Admin</strong>: admin@cmgc.org (Password: Admin@123)</li>
                <li><strong>Franchise</strong>: franchise@cmgc.org (Password: Franchise@123) — FR-1001</li>
                <li><strong>Doctor</strong>: doctor@cmgc.org (Password: Doctor@123) — DOC-2001</li>
                <li><strong>Initial Fee</strong>: ₹500 INR</li>
              </ul>
            </div>

            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Initializing..." : "Run Database Initializer"}
            </button>

            {logs.length > 0 && (
              <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 max-h-48 overflow-y-auto space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}

            {completed && (
              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4 border border-green-200">
                <div className="flex items-center gap-2 text-xs font-bold text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Initialization Complete!
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:underline"
                >
                  Go to Login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
