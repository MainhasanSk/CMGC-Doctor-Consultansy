"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (user.role === "FRANCHISE") {
        router.push("/franchise/dashboard");
      } else if (user.role === "DOCTOR") {
        router.push("/doctor/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cmgc-primary" />
        <p className="text-sm font-medium text-slate-500">Connecting to CMGC Medical Portal...</p>
      </div>
    </div>
  );
}
