import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import SeedPage from "@/app/seed/page";

// Layouts
import AdminLayout from "@/app/admin/layout";
import DoctorLayout from "@/app/doctor/layout";
import FranchiseLayout from "@/app/franchise/layout";

// Admin Pages
import AdminDashboardPage from "@/app/admin/dashboard/page";
import AdminConsultationsPage from "@/app/admin/consultations/page";
import AdminConsultationDetailPage from "@/app/admin/consultations/[id]/page";
import AdminDoctorsPage from "@/app/admin/doctors/page";
import AdminNewDoctorPage from "@/app/admin/doctors/new/page";
import AdminFranchisesPage from "@/app/admin/franchises/page";
import AdminNewFranchisePage from "@/app/admin/franchises/new/page";
import AdminPatientsPage from "@/app/admin/patients/page";
import AdminPaymentsPage from "@/app/admin/payments/page";
import AdminPricingPage from "@/app/admin/pricing/page";
import AdminReportsPage from "@/app/admin/reports/page";
import AdminSettingsPage from "@/app/admin/settings/page";
import AdminAssignmentsPage from "@/app/admin/assignments/page";
import AdminAuditLogsPage from "@/app/admin/audit-logs/page";

// Doctor Pages
import DoctorDashboardPage from "@/app/doctor/dashboard/page";
import DoctorUpcomingPage from "@/app/doctor/upcoming/page";
import DoctorRequestsPage from "@/app/doctor/requests/page";
import DoctorCompletedPage from "@/app/doctor/completed/page";
import DoctorPatientsPage from "@/app/doctor/patients/page";
import DoctorPrescriptionsPage from "@/app/doctor/prescriptions/page";
import DoctorNewPrescriptionPage from "@/app/doctor/prescriptions/new/page";
import DoctorEditPrescriptionPage from "@/app/doctor/prescriptions/[id]/page";
import DoctorProfilePage from "@/app/doctor/profile/page";

// Franchise Pages
import FranchiseDashboardPage from "@/app/franchise/dashboard/page";
import FranchiseConsultationsPage from "@/app/franchise/consultations/page";
import FranchiseNewConsultationPage from "@/app/franchise/consultations/new/page";
import FranchiseConsultationDetailPage from "@/app/franchise/consultations/[id]/page";
import FranchisePatientsPage from "@/app/franchise/patients/page";
import FranchiseNewPatientPage from "@/app/franchise/patients/new/page";
import FranchisePrescriptionsPage from "@/app/franchise/prescriptions/page";
import FranchiseDoctorsPage from "@/app/franchise/doctors/page";
import FranchiseProfilePage from "@/app/franchise/profile/page";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/seed" element={<SeedPage />} />

      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="consultations" element={<AdminConsultationsPage />} />
        <Route path="consultations/:id" element={<AdminConsultationDetailPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="doctors/new" element={<AdminNewDoctorPage />} />
        <Route path="franchises" element={<AdminFranchisesPage />} />
        <Route path="franchises/new" element={<AdminNewFranchisePage />} />
        <Route path="patients" element={<AdminPatientsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="pricing" element={<AdminPricingPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Doctor Protected Routes */}
      <Route path="/doctor" element={<DoctorLayout />}>
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="upcoming" element={<DoctorUpcomingPage />} />
        <Route path="requests" element={<DoctorRequestsPage />} />
        <Route path="completed" element={<DoctorCompletedPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="prescriptions/new" element={<DoctorNewPrescriptionPage />} />
        <Route path="prescriptions/:id" element={<DoctorEditPrescriptionPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>

      {/* Franchise Protected Routes */}
      <Route path="/franchise" element={<FranchiseLayout />}>
        <Route index element={<Navigate to="/franchise/dashboard" replace />} />
        <Route path="dashboard" element={<FranchiseDashboardPage />} />
        <Route path="consultations" element={<FranchiseConsultationsPage />} />
        <Route path="consultations/new" element={<FranchiseNewConsultationPage />} />
        <Route path="consultations/:id" element={<FranchiseConsultationDetailPage />} />
        <Route path="patients" element={<FranchisePatientsPage />} />
        <Route path="patients/new" element={<FranchiseNewPatientPage />} />
        <Route path="prescriptions" element={<FranchisePrescriptionsPage />} />
        <Route path="doctors" element={<FranchiseDoctorsPage />} />
        <Route path="profile" element={<FranchiseProfilePage />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
