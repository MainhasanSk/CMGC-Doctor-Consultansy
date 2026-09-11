import { Timestamp } from "firebase/firestore";

export type UserRole = "ADMIN" | "FRANCHISE" | "DOCTOR";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  referenceId?: string; // franchiseId for FRANCHISE, doctorId for DOCTOR, omitted for ADMIN
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface Franchise {
  franchiseId: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Doctor {
  doctorId: string;
  userId: string;
  name: string;
  photoUrl?: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  experience?: number;
  phone: string;
  email: string;
  address?: string;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimeSlot {
  start: string; // HH:mm format, e.g. "09:00"
  end: string;   // HH:mm format, e.g. "13:00"
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DoctorAvailability {
  doctorId: string;
  timezone: "Asia/Kolkata";
  weeklySchedule: Record<DayOfWeek, TimeSlot[]>;
}

export interface FranchiseDoctor {
  assignmentId: string;
  franchiseId: string;
  doctorId: string;
  status: AccountStatus;
  assignedAt: Timestamp;
  assignedBy: string;
}

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  address: string;
  createdByFranchiseId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ConsultationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "MEETING_ADDED"
  | "READY_TO_JOIN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Consultation {
  consultationId: string; // CMGC-YYYYMMDD-XXXXX

  patientId: string;
  patientNameSnapshot: string;
  patientAgeSnapshot: number;
  patientAddressSnapshot: string;

  doctorId: string;
  franchiseId: string;

  disease: string;
  diseaseDescription: string;
  extraMessage?: string;

  // Requested date and time (Preserved forever)
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  requestedStartDateTime: Timestamp;
  requestedEndDateTime: Timestamp;

  // Actual confirmed appointment date and time
  consultationDate: string; // YYYY-MM-DD
  consultationTime: string; // HH:mm
  startDateTime: Timestamp;
  endDateTime: Timestamp;

  consultationFee: number;
  currency: "INR";

  status: ConsultationStatus;

  // Rescheduling tracking
  rescheduled: boolean;
  rescheduledAt?: Timestamp;
  rescheduledBy?: string;
  rescheduledByRole?: "ADMIN" | "DOCTOR";
  rescheduleReason?: string;

  // Google Meet link added manually by Admin
  meetLink?: string;
  meetAddedAt?: Timestamp;
  meetAddedBy?: string;

  createdAt: Timestamp;
  createdBy: string;

  confirmedAt?: Timestamp;
  confirmedBy?: string;

  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;

  completedAt?: Timestamp;
  completedBy?: string;

  cancelledAt?: Timestamp;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface ConsultationReport {
  reportId: string;
  consultationId: string;
  patientId: string;
  franchiseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryPublicId: string;
  secureUrl?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export type PrescriptionStatus = "DRAFT" | "FINALIZED";

export interface Prescription {
  prescriptionId: string; // RX-XXXXXX
  consultationId: string;
  patientId: string;
  doctorId: string;
  franchiseId: string;

  // Snapshots
  patientNameSnapshot: string;
  patientAgeSnapshot: number;
  patientAddressSnapshot: string;

  doctorNameSnapshot: string;
  doctorQualificationSnapshot: string;
  doctorSpecializationSnapshot: string;
  doctorRegistrationSnapshot: string;

  diagnosis: string;
  medicines: Medicine[];

  investigations?: string;
  advice?: string;

  followUpRequired: boolean;
  followUpDate?: string;

  status: PrescriptionStatus;

  pdfUrl?: string;
  pdfPublicId?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  finalizedAt?: Timestamp;
}

export type PaymentMethod = "CASH" | "UPI" | "CARD" | "OTHER";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";

export interface Payment {
  paymentId: string;
  consultationId: string;
  patientId: string;
  franchiseId: string;
  amount: number;
  currency: "INR";
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionReference?: string;
  notes?: string;
  paidAt?: Timestamp;
  recordedBy?: string;
  createdAt: Timestamp;
}

export type NotificationType =
  | "NEW_CONSULTATION"
  | "CONSULTATION_CONFIRMED"
  | "CONSULTATION_RESCHEDULED"
  | "CONSULTATION_REJECTED"
  | "MEETING_ADDED"
  | "CONSULTATION_READY"
  | "CONSULTATION_COMPLETED"
  | "PRESCRIPTION_FINALIZED"
  | "PAYMENT_RECORDED";

export interface Notification {
  notificationId: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  consultationId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface PricingSettings {
  videoConsultationFee: number;
  currency: "INR";
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface ConsultationSettings {
  defaultDurationMinutes: number;
  joinWindowMinutes: number;
  timezone: "Asia/Kolkata";
}

export interface AuditLog {
  logId: string;
  userId: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  timestamp: Timestamp;
}
