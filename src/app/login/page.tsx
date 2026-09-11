"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "ADMIN") router.push("/admin/dashboard");
      else if (user.role === "FRANCHISE") router.push("/franchise/dashboard");
      else if (user.role === "DOCTOR") router.push("/doctor/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const profile = await login(email.trim(), password);
      if (profile.role === "ADMIN") router.push("/admin/dashboard");
      else if (profile.role === "FRANCHISE") router.push("/franchise/dashboard");
      else if (profile.role === "DOCTOR") router.push("/doctor/dashboard");
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg mb-4 ring-4 ring-blue-100 border border-slate-100">
          <img src="/logo.png" alt="CMGC Logo" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Chennai Medical Guidance Centre
        </h1>
        <p className="mt-1.5 text-xs uppercase font-semibold text-cmgc-muted tracking-wider">
          Medical Video Consultation System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl ring-1 ring-black/5 sm:rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your role-specific dashboard with authorized credentials.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cmgc.org"
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-cmgc-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-cmgc-navy transition focus:outline-none disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-cmgc-primary hover:text-cmgc-navy transition inline-flex items-center gap-1.5"
            >
              &larr; Back to CMGC Home & Medical Consultancy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
