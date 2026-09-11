/**
 * Generate human-readable business IDs matching CMGC spec:
 * Consultation: CMGC-YYYYMMDD-XXXXX
 * Patient: PAT-XXXXXX
 * Doctor: DOC-XXXX
 * Franchise: FR-XXXX
 * Prescription: RX-XXXXXX
 */

export function generateConsultationId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CMGC-${year}${month}${day}-${randomNum}`;
}

export function generatePatientId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PAT-${randomNum}`;
}

export function generateDoctorId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DOC-${randomNum}`;
}

export function generateFranchiseId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `FR-${randomNum}`;
}

export function generatePrescriptionId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `RX-${randomNum}`;
}

export function generateAssignmentId(): string {
  return `ASG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateReportId(): string {
  return `RPT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generatePaymentId(): string {
  return `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateNotificationId(): string {
  return `NOTIF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateAuditLogId(): string {
  return `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
