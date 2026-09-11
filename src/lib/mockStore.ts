import { 
  User, 
  Franchise, 
  Doctor, 
  FranchiseDoctor, 
  Patient, 
  Consultation, 
  Prescription, 
  Payment, 
  PricingSettings, 
  Notification, 
  AuditLog,
  DoctorAvailability,
  ConsultationReport
} from "@/types";
import { Timestamp } from "firebase/firestore";

// Helper to check if running in browser
const isBrowser = typeof window !== "undefined";

const STORAGE_KEY = "cmgc_local_database_v1";

interface CMGCDatabase {
  pricing: PricingSettings;
  users: Record<string, User>;
  franchises: Record<string, Franchise>;
  doctors: Record<string, Doctor>;
  doctorAvailability: Record<string, DoctorAvailability>;
  franchiseDoctors: Record<string, FranchiseDoctor>;
  patients: Record<string, Patient>;
  consultations: Record<string, Consultation>;
  consultationReports?: Record<string, ConsultationReport>;
  prescriptions: Record<string, Prescription>;
  payments: Record<string, Payment>;
  notifications: Record<string, Notification>;
  auditLogs: AuditLog[];
}

function getInitialData(): CMGCDatabase {
  const now = Timestamp.now();

  const adminUser: User = {
    uid: "mock-admin-uid-01",
    name: "CMGC Central Admin",
    email: "admin@cmgc.org",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const franchiseUser: User = {
    uid: "mock-franchise-uid-01",
    name: "CMGC Chennai Central Operator",
    email: "franchise@cmgc.org",
    role: "FRANCHISE",
    referenceId: "FR-1001",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const doctorUser: User = {
    uid: "mock-doctor-uid-01",
    name: "Dr. Amit Sharma",
    email: "doctor@cmgc.org",
    role: "DOCTOR",
    referenceId: "DOC-2001",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const franchise: Franchise = {
    franchiseId: "FR-1001",
    name: "CMGC Chennai Central",
    ownerName: "K. R. Sundaram",
    phone: "9840123456",
    email: "franchise@cmgc.org",
    address: "No. 45, Mount Road, Thousand Lights",
    city: "Chennai",
    state: "Tamil Nadu",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const doctor: Doctor = {
    doctorId: "DOC-2001",
    userId: "mock-doctor-uid-01",
    name: "Amit Sharma",
    qualification: "MBBS, MD (Internal Medicine)",
    specialization: "Diabetology & General Medicine",
    registrationNumber: "TNMC-84920",
    experience: 14,
    phone: "9840987654",
    email: "doctor@cmgc.org",
    address: "Apollo Clinic Consulting Room, Greams Road, Chennai",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const doctorAvailability: DoctorAvailability = {
    doctorId: "DOC-2001",
    timezone: "Asia/Kolkata",
    weeklySchedule: {
      monday: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }],
      tuesday: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }],
      wednesday: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }],
      thursday: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }],
      friday: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }],
      saturday: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }],
      sunday: [],
    },
  };

  const assignment: FranchiseDoctor = {
    assignmentId: "ASG-FR-1001-DOC-2001",
    franchiseId: "FR-1001",
    doctorId: "DOC-2001",
    status: "ACTIVE",
    assignedAt: now,
    assignedBy: "mock-admin-uid-01",
  };

  const patient: Patient = {
    patientId: "PAT-100001",
    name: "Rahul Das",
    age: 42,
    gender: "MALE",
    phone: "9876543210",
    address: "Anna Nagar, Chennai, Tamil Nadu",
    createdByFranchiseId: "FR-1001",
    createdAt: now,
    updatedAt: now,
  };

  return {
    pricing: {
      videoConsultationFee: 500,
      currency: "INR",
      updatedAt: now,
      updatedBy: "mock-admin-uid-01",
    },
    users: {
      "mock-admin-uid-01": adminUser,
      "mock-franchise-uid-01": franchiseUser,
      "mock-doctor-uid-01": doctorUser,
    },
    franchises: {
      "FR-1001": franchise,
    },
    doctors: {
      "DOC-2001": doctor,
    },
    doctorAvailability: {
      "DOC-2001": doctorAvailability,
    },
    franchiseDoctors: {
      "ASG-FR-1001-DOC-2001": assignment,
    },
    patients: {
      "PAT-100001": patient,
    },
    consultations: {},
    consultationReports: {},
    prescriptions: {},
    payments: {},
    notifications: {},
    auditLogs: [],
  };
}

let inMemoryDb: CMGCDatabase = getInitialData();

export function getLocalDb(): CMGCDatabase {
  if (!isBrowser) return inMemoryDb;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialData();
      saveLocalDb(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const initial = getInitialData();
    const merged: CMGCDatabase = {
      ...initial,
      ...parsed,
      pricing: { ...initial.pricing, ...(parsed.pricing || {}) },
      users: { ...initial.users, ...(parsed.users || {}) },
      franchises: { ...initial.franchises, ...(parsed.franchises || {}) },
      doctors: { ...initial.doctors, ...(parsed.doctors || {}) },
      doctorAvailability: { ...initial.doctorAvailability, ...(parsed.doctorAvailability || {}) },
      franchiseDoctors: { ...initial.franchiseDoctors, ...(parsed.franchiseDoctors || {}) },
      patients: { ...initial.patients, ...(parsed.patients || {}) },
      consultations: { ...initial.consultations, ...(parsed.consultations || {}) },
      consultationReports: { ...(initial.consultationReports || {}), ...(parsed.consultationReports || {}) },
      prescriptions: { ...initial.prescriptions, ...(parsed.prescriptions || {}) },
      payments: { ...initial.payments, ...(parsed.payments || {}) },
      notifications: { ...initial.notifications, ...(parsed.notifications || {}) },
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : initial.auditLogs,
    };
    return merged;
  } catch (err) {
    console.warn("Failed to load local DB, using in-memory:", err);
    return inMemoryDb;
  }
}

export function saveLocalDb(data: CMGCDatabase): void {
  inMemoryDb = data;
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to save local DB:", err);
  }
}

export function resetLocalDb(): void {
  const initial = getInitialData();
  saveLocalDb(initial);
}
