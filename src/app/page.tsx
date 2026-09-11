"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  Award,
  Building2,
  Users,
  Stethoscope,
  Video,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
  Clock,
  Phone,
  Mail,
  MapPin,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  FileCheck,
  CalendarCheck,
  ChevronRight,
  Headphones,
} from "lucide-react";

export default function HomePage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getDashboardUrl = () => {
    if (user?.role === "ADMIN") return "/admin/dashboard";
    if (user?.role === "FRANCHISE") return "/franchise/dashboard";
    if (user?.role === "DOCTOR") return "/doctor/dashboard";
    return "/login";
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const profile = await login(email.trim(), password);
      if (profile.role === "ADMIN") router.push("/admin/dashboard");
      else if (profile.role === "FRANCHISE") router.push("/franchise/dashboard");
      else if (profile.role === "DOCTOR") router.push("/doctor/dashboard");
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const specialties = [
    { title: "Cardiology & Cardiac Surgery", desc: "Complex heart bypass, valve replacements, and pediatric cardiac interventions." },
    { title: "Oncology & Cancer Care", desc: "Precision chemotherapy, robotic surgical oncology, and advanced radiotherapy." },
    { title: "Neurology & Neurosurgery", desc: "Brain and spine surgery, stroke rehabilitation, and deep brain stimulation." },
    { title: "Orthopedics & Joint Replacement", desc: "Robotic knee and hip arthroplasty, spine surgery, and sports medicine." },
    { title: "Gastroenterology & Hepatology", desc: "Advanced liver care, organ transplants, and therapeutic GI endoscopies." },
    { title: "Nephrology & Renal Transplants", desc: "Comprehensive kidney disease management and successful transplant programs." },
    { title: "Organ Transplants", desc: "Heart, lung, liver, and kidney transplant coordination across top accredited centres." },
    { title: "Pediatric Super-Specialties", desc: "Dedicated pediatric surgery, neonatology, and congenital anomaly care." },
  ];

  const highlights = [
    {
      title: "10+ Years of Medical Guidance",
      desc: "A decade of dedicated healthcare advocacy, helping patients navigate critical medical decisions with total transparency.",
      icon: Award,
    },
    {
      title: "1,500+ Patients Guided",
      desc: "Over 1,500 families have trusted CMGC to find the right medical diagnosis, top specialists, and optimal treatment courses.",
      icon: Users,
    },
    {
      title: "200+ Partner Hospitals",
      desc: "Affiliated with NABH & JCI accredited multi-super-specialty hospital networks across Chennai and all major Indian hubs.",
      icon: Building2,
    },
    {
      title: "1,000+ Expert Doctors",
      desc: "Direct access to renowned department heads, professors, surgeons, and clinicians for primary and second opinions.",
      icon: Stethoscope,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-cmgc-primary selection:text-white">
      {/* Top Banner */}
      <div className="bg-cmgc-navy text-slate-200 text-[11px] sm:text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chennai Medical Guidance Centre — Telemedicine & Healthcare Advisory Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <a href="tel:+914420001000" className="hover:text-white flex items-center gap-1 transition">
              <Phone className="h-3 w-3 text-emerald-400" /> +91 44 2000 1000
            </a>
            <span className="hidden md:inline text-slate-600">|</span>
            <a href="mailto:info@cmgc.org" className="hover:text-white flex items-center gap-1 transition">
              <Mail className="h-3 w-3 text-emerald-400" /> info@cmgc.org
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-xs border border-slate-200 group-hover:border-cmgc-primary transition shrink-0">
              <img src="/logo.png" alt="CMGC Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight block leading-tight">
                CMGC
              </span>
              <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider hidden sm:block">
                Chennai Medical Guidance Centre
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#about" className="hover:text-cmgc-primary transition">About CMGC</a>
            <a href="#numbers" className="hover:text-cmgc-primary transition">Our Credentials</a>
            <a href="#specialties" className="hover:text-cmgc-primary transition">Specialties</a>
            <a href="#how-it-works" className="hover:text-cmgc-primary transition">How It Works</a>
            <a href="#contact" className="hover:text-cmgc-primary transition">Contact</a>
          </nav>

          {/* Portal Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={getDashboardUrl()}
                className="inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <a
                href="#portal-login"
                className="inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cmgc-navy transition"
              >
                <Lock className="h-3.5 w-3.5 text-emerald-300" />
                Sign In to Portal
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-cmgc-navy to-slate-900 text-white py-16 lg:py-24">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Mission & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                <span>10+ Years of Healthcare Excellence & Guidance</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Chennai Medical Guidance Centre
              </h1>
              
              <p className="text-lg sm:text-xl font-medium text-emerald-300">
                Your Trusted Medical Consultancy Across India
              </p>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                For over a decade, CMGC has been guiding patients through critical healthcare journeys. 
                We connect patients, families, and franchises directly with India’s foremost medical institutions 
                and distinguished super-specialists through secure telemedicine consultations and treatment roadmaps.
              </p>

              {/* Stat Highlights Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-black text-white">10+</div>
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mt-0.5">Years of Service</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-black text-white">1,500+</div>
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mt-0.5">Patients Guided</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-black text-white">200+</div>
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mt-0.5">Partner Hospitals</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-black text-white">1,000+</div>
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mt-0.5">Expert Doctors</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#portal-login"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition inline-flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Access Medical Portal
                </a>
                <a
                  href="#about"
                  className="rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3 text-xs font-bold border border-white/20 transition inline-flex items-center gap-2"
                >
                  Learn About Our Services
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right Column: Portal Login Box */}
            <div id="portal-login" className="lg:col-span-5 scroll-mt-24">
              <div className="rounded-2xl border border-white/20 bg-white/95 text-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3 pb-5 border-b border-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200 shrink-0">
                    <img src="/logo.png" alt="CMGC Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      CMGC Provider Portal
                    </h2>
                    <p className="text-xs text-slate-500">
                      Sign in for Doctors, Franchises & Admin
                    </p>
                  </div>
                </div>

                {user ? (
                  <div className="py-6 space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">You are signed in as</p>
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-cmgc-primary font-semibold uppercase mt-0.5">Role: {user.role}</p>
                    </div>
                    <Link
                      href={getDashboardUrl()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cmgc-primary px-4 py-3 text-xs font-extrabold text-white shadow-md hover:bg-cmgc-navy transition"
                    >
                      Enter {user.role} Dashboard &rarr;
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                    {errorMessage && (
                      <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                        <div>{errorMessage}</div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@cmgc.org"
                          className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-xs focus:border-cmgc-primary focus:ring-1 focus:ring-cmgc-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || authLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cmgc-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-cmgc-navy transition disabled:opacity-50"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {submitting ? "Signing In..." : "Sign In to Dashboard"}
                    </button>

                    <p className="text-[11px] text-center text-slate-400 pt-2">
                      Authorized medical personnel, operators, and administrators only.
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Credentials & Trust Statistics Section */}
      <section id="numbers" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cmgc-primary mb-2">
              Our Track Record
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              A Decade of Clinical Excellence & Patient Trust
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Measurable impact across critical care, telemedicine, and super-specialty treatment planning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 hover:shadow-md transition space-y-3 group hover:border-cmgc-primary/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-cmgc-primary group-hover:bg-cmgc-primary group-hover:text-white transition">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{h.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About CMGC Section */}
      <section id="about" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                About Our Medical Consultancy
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Navigating Complex Healthcare with Compassion, Expertise & Integrity
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When facing complex medical conditions or surgeries, patients and families often struggle to know 
                which hospital to choose, which doctor is genuinely experienced in their specific pathology, and what the real treatment costs should be.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Headquartered in Chennai — the medical capital of India — Chennai Medical Guidance Centre (CMGC) serves as an 
                independent, patient-first advisory network. We eliminate confusion, organize second opinions, and bring world-class specialist consultations to any district or town through our telemedicine franchise centers.
              </p>

              <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Unbiased doctor and hospital selection tailored to clinical needs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>High-definition video consultations with verified senior consultants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Direct hospital admission coordination, cost estimates & treatment timelines</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dedicated post-consultation prescription and follow-up tracking</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-cmgc-primary flex items-center justify-center">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Second Opinions</h4>
                <p className="text-xs text-slate-500">
                  Confirm complex diagnoses and surgical recommendations before proceeding with irreversible procedures.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Telemedicine Network</h4>
                <p className="text-xs text-slate-500">
                  Rural and suburban franchise clinics equipped with video suites and report upload capabilities.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FileCheck className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Digital Prescriptions</h4>
                <p className="text-xs text-slate-500">
                  Doctor-finalized PDF prescriptions with clinical notes, investigations, and verified digital signatures.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Hospital Admission</h4>
                <p className="text-xs text-slate-500">
                  Seamless priority admission, bed reservation, and transparent cost estimates across 200+ partner hospitals.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section id="specialties" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cmgc-primary mb-2">
              Clinical Coverage
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Specialized Care Across Major Disciplines
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Consult with board-certified super-specialists across all major departments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {specialties.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-cmgc-primary hover:shadow-xs transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-cmgc-primary" />
                  <h4 className="font-bold text-xs text-slate-900">{s.title}</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cmgc-primary mb-2">
              Telemedicine Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How Franchise Video Consultation Operates
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              A 4-step streamlined process connecting patients at local franchise centers directly with senior doctors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Patient Registration",
                desc: "The local franchise registers patient vitals, medical complaints, and medical history in the portal.",
              },
              {
                step: "02",
                title: "Report Upload & Booking",
                desc: "Lab reports, blood tests, and scans are uploaded to Cloudinary, and an appointment slot is requested.",
              },
              {
                step: "03",
                title: "Video Consultation",
                desc: "Doctor reviews files and conducts an HD video call via Google Meet directly from the portal.",
              },
              {
                step: "04",
                title: "Digital Prescription",
                desc: "Finalized diagnosis, medicines, and advice are instantly generated as a verified digital PDF.",
              },
            ].map((st, idx) => (
              <div key={idx} className="relative rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
                <div className="text-3xl font-black text-blue-100 mb-2 font-mono">{st.step}</div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">{st.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Footer Section */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
            
            {/* Column 1: Brand */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                  <img src="/logo.png" alt="CMGC Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="text-base font-extrabold text-white tracking-tight block">CMGC</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Chennai Medical Guidance Centre
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Leading medical consultancy and tele-health infrastructure partner for hospitals, doctors, and franchises across India. Guiding patients with care for over 10 years.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#about" className="hover:text-white transition">About Our Consultancy</a></li>
                <li><a href="#numbers" className="hover:text-white transition">Our Clinical Network</a></li>
                <li><a href="#specialties" className="hover:text-white transition">Departments & Specialties</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">Franchise Telemedicine</a></li>
                <li><a href="#portal-login" className="hover:text-white transition">Authorized Portal Login</a></li>
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Headquarters & Helpline</h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Chennai Medical Guidance Centre, Anna Salai, Chennai, Tamil Nadu, India — 600002</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>+91 44 2000 1000 / +91 98400 12345</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>admissions@cmgc.org / support@cmgc.org</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Support Available Mon – Sat: 8:00 AM – 9:00 PM IST</span>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Chennai Medical Guidance Centre (CMGC). All rights reserved.</p>
            <p className="text-[11px] text-slate-500">
              Designed for secure telemedicine video consultation, hospital advisory, and clinical second opinions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
