import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Consultation, ConsultationStatus, UserRole } from "@/types";
import { generateConsultationId } from "@/utils/formatters";
import {
  createISTTimestamp,
  addMinutesToTimestamp,
  isIntervalOverlapping,
  formatISTDate,
  formatISTTime,
  toDate,
  CONSULTATION_DURATION_MINUTES,
} from "@/utils/date";
import { getDoctorById } from "./doctorService";
import { getPatientById } from "./patientService";
import { getPricingSettings } from "./pricingService";
import { recordAuditLog } from "./auditService";
import { createNotification } from "./notificationService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

const BLOCKING_STATUSES: ConsultationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "MEETING_ADDED",
  "READY_TO_JOIN",
  "IN_PROGRESS",
];

export async function checkDoctorAvailability(
  doctorId: string,
  _startTs: Timestamp,
  _endTs: Timestamp
): Promise<{ available: boolean; reason?: string }> {
  const doctor = await getDoctorById(doctorId);
  if (doctor && doctor.status === "INACTIVE") {
    return { available: false, reason: "The selected doctor is currently inactive." };
  }

  // Doctor availability schedule restrictions are bypassed per system requirements.
  // Consultations can be scheduled at any requested time.
  return { available: true };
}

export async function checkDoubleBooking(
  doctorId: string,
  startTs: Timestamp,
  endTs: Timestamp,
  excludeConsultationId?: string
): Promise<{ conflict: boolean; conflictingConsultationId?: string }> {
  let consultations: Consultation[] = [];

  try {
    const q = query(
      collection(db, "consultations"),
      where("doctorId", "==", doctorId)
    );
    const snap = await getDocs(q);
    consultations = snap.docs.map((d) => d.data() as Consultation);
  } catch (error) {
    console.warn("Double booking check Firestore fallback:", error);
    const dbStore = getLocalDb();
    consultations = Object.values(dbStore.consultations).filter((c) => c.doctorId === doctorId);
  }

  for (const item of consultations) {
    if (excludeConsultationId && item.consultationId === excludeConsultationId) {
      continue;
    }

    if (BLOCKING_STATUSES.includes(item.status)) {
      if (isIntervalOverlapping(startTs, endTs, item.startDateTime, item.endDateTime)) {
        return { conflict: true, conflictingConsultationId: item.consultationId };
      }
    }
  }

  return { conflict: false };
}

export async function createConsultation(params: {
  patientId: string;
  doctorId: string;
  franchiseId: string;
  disease: string;
  diseaseDescription: string;
  extraMessage?: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  actorUserId: string;
  actorRole: UserRole;
}): Promise<string> {
  const patient = await getPatientById(params.patientId);
  if (!patient) {
    throw new Error("Invalid patient record. Please select a valid patient.");
  }

  const doctor = await getDoctorById(params.doctorId);
  if (!doctor || doctor.status !== "ACTIVE") {
    throw new Error("The selected doctor is currently inactive or not available.");
  }

  const requestedStartDateTime = createISTTimestamp(params.requestedDate, params.requestedTime);
  const requestedEndDateTime = addMinutesToTimestamp(
    requestedStartDateTime,
    CONSULTATION_DURATION_MINUTES
  );

  const now = new Date();
  if (requestedStartDateTime.toDate().getTime() <= now.getTime()) {
    throw new Error("Consultation requested time must be in the future.");
  }

  const avail = await checkDoctorAvailability(
    params.doctorId,
    requestedStartDateTime,
    requestedEndDateTime
  );
  if (!avail.available) {
    throw new Error(avail.reason || "Doctor is not available at the selected time.");
  }

  const conflict = await checkDoubleBooking(
    params.doctorId,
    requestedStartDateTime,
    requestedEndDateTime
  );
  if (conflict.conflict) {
    throw new Error(
      "This doctor already has another consultation during the selected time. Please choose another slot."
    );
  }

  const pricing = await getPricingSettings();
  const fee = pricing.videoConsultationFee;

  const consultationId = generateConsultationId();

  const resolvedFranchiseId =
    (params.franchiseId && params.franchiseId.startsWith("FR-") ? params.franchiseId : null) ||
    (patient.createdByFranchiseId && patient.createdByFranchiseId.startsWith("FR-")
      ? patient.createdByFranchiseId
      : null) ||
    params.franchiseId ||
    "FR-1001";

  const resolvedActorUserId = params.actorUserId || "franchise-operator";

  const consultation: Consultation = {
    consultationId,
    patientId: params.patientId,
    patientNameSnapshot: patient.name,
    patientAgeSnapshot: patient.age,
    patientAddressSnapshot: patient.address,

    doctorId: params.doctorId,
    franchiseId: resolvedFranchiseId,

    disease: params.disease,
    diseaseDescription: params.diseaseDescription,
    extraMessage: params.extraMessage || "",

    requestedDate: params.requestedDate,
    requestedTime: params.requestedTime,
    requestedStartDateTime,
    requestedEndDateTime,

    consultationDate: params.requestedDate,
    consultationTime: params.requestedTime,
    startDateTime: requestedStartDateTime,
    endDateTime: requestedEndDateTime,

    consultationFee: fee,
    currency: "INR",
    status: "PENDING",

    rescheduled: false,

    createdAt: Timestamp.now(),
    createdBy: resolvedActorUserId,
  };

  try {
    const ref = doc(db, "consultations", consultationId);
    await setDoc(ref, consultation);
  } catch (error) {
    console.warn("Create consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.consultations) dbStore.consultations = {};
  dbStore.consultations[consultationId] = consultation;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: resolvedActorUserId,
    role: params.actorRole || "FRANCHISE",
    action: "CREATE_CONSULTATION",
    entityType: "CONSULTATION",
    entityId: consultationId,
    description: `Created consultation request ${consultationId} for patient ${patient.name} with Dr. ${doctor.name} at ₹${fee}`,
  }).catch(() => {});

  if (doctor.userId) {
    await createNotification({
      recipientUserId: doctor.userId,
      type: "NEW_CONSULTATION",
      title: "New Video Consultation Request",
      message: `New consultation request for ${patient.name} on ${params.requestedDate} at ${params.requestedTime}.`,
      consultationId,
    }).catch(() => {});
  }

  // Also notify admin
  await createNotification({
    recipientUserId: "mock-admin-uid-01",
    type: "NEW_CONSULTATION",
    title: "New Video Consultation Booking",
    message: `Franchise ${resolvedFranchiseId} booked a consultation for ${patient.name} with Dr. ${doctor.name}.`,
    consultationId,
  }).catch(() => {});

  return consultationId;
}

export async function confirmConsultation(
  consultationId: string,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const c = await getConsultationById(consultationId);
  if (!c) {
    throw new Error("Consultation not found.");
  }
  if (c.status !== "PENDING") {
    throw new Error(`Cannot confirm consultation with status ${c.status}.`);
  }

  const updates = {
    status: "CONFIRMED" as ConsultationStatus,
    rescheduled: false,
    confirmedAt: Timestamp.now(),
    confirmedBy: actorUserId,
  };

  try {
    const ref = doc(db, "consultations", consultationId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Confirm consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultations[consultationId]) {
    dbStore.consultations[consultationId] = {
      ...dbStore.consultations[consultationId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "CONFIRM_CONSULTATION",
    entityType: "CONSULTATION",
    entityId: consultationId,
    description: `Confirmed consultation at requested time (${c.requestedDate} ${c.requestedTime})`,
  });

  // Notify Franchise
  await createNotification({
    recipientUserId: c.franchiseId,
    type: "CONSULTATION_CONFIRMED",
    title: "Video Consultation Confirmed",
    message: `Your Video Consultation for ${c.patientNameSnapshot} has been confirmed for ${formatISTDate(c.startDateTime)} at ${formatISTTime(c.startDateTime)}.`,
    consultationId,
  });
}

export async function confirmAndRescheduleConsultation(params: {
  consultationId: string;
  newDate: string; // YYYY-MM-DD
  newTime: string; // HH:mm
  reason?: string;
  actorUserId: string;
  actorRole: UserRole;
}): Promise<void> {
  const c = await getConsultationById(params.consultationId);
  if (!c) {
    throw new Error("Consultation not found.");
  }
  if (c.status !== "PENDING") {
    throw new Error(`Cannot reschedule consultation with status ${c.status}.`);
  }

  const newStartTs = createISTTimestamp(params.newDate, params.newTime);
  const newEndTs = addMinutesToTimestamp(newStartTs, CONSULTATION_DURATION_MINUTES);

  if (newStartTs.toDate().getTime() <= Date.now()) {
    throw new Error("The new appointment time must be in the future.");
  }

  const avail = await checkDoctorAvailability(c.doctorId, newStartTs, newEndTs);
  if (!avail.available) {
    throw new Error(avail.reason || "The selected time is outside doctor availability.");
  }

  const conflict = await checkDoubleBooking(c.doctorId, newStartTs, newEndTs, params.consultationId);
  if (conflict.conflict) {
    throw new Error(
      "This doctor already has another consultation during the selected time. Please choose another time."
    );
  }

  const previousFormattedTime = `${formatISTDate(c.requestedStartDateTime)}, ${formatISTTime(c.requestedStartDateTime)}`;
  const newFormattedTime = `${formatISTDate(newStartTs)}, ${formatISTTime(newStartTs)}`;

  const updates = {
    consultationDate: params.newDate,
    consultationTime: params.newTime,
    startDateTime: newStartTs,
    endDateTime: newEndTs,
    status: "CONFIRMED" as ConsultationStatus,
    rescheduled: true,
    rescheduledAt: Timestamp.now(),
    rescheduledBy: params.actorUserId,
    rescheduledByRole: (params.actorRole === "ADMIN" || params.actorRole === "DOCTOR") ? params.actorRole : "ADMIN",
    rescheduleReason: params.reason || "",
    confirmedAt: Timestamp.now(),
    confirmedBy: params.actorUserId,
  };

  try {
    const ref = doc(db, "consultations", params.consultationId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Reschedule consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultations[params.consultationId]) {
    dbStore.consultations[params.consultationId] = {
      ...dbStore.consultations[params.consultationId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: params.actorUserId,
    role: params.actorRole,
    action: "RESCHEDULE_CONSULTATION",
    entityType: "CONSULTATION",
    entityId: params.consultationId,
    description: `Rescheduled consultation from [${previousFormattedTime}] to [${newFormattedTime}]`,
    metadata: {
      previousRequestedTime: previousFormattedTime,
      newConfirmedTime: newFormattedTime,
      reason: params.reason || "",
    },
  });

  const doctor = await getDoctorById(c.doctorId);
  const doctorName = doctor ? `Dr. ${doctor.name}` : "your consulting doctor";

  await createNotification({
    recipientUserId: c.franchiseId,
    type: "CONSULTATION_RESCHEDULED",
    title: "Your Video Consultation has been Rescheduled",
    message: `Your Video Consultation with ${doctorName} has been rescheduled to ${newFormattedTime} (Originally requested: ${previousFormattedTime}).`,
    consultationId: params.consultationId,
  });
}

export async function rejectConsultation(
  consultationId: string,
  reason: string,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const c = await getConsultationById(consultationId);
  if (!c) {
    throw new Error("Consultation not found.");
  }

  const updates = {
    status: "REJECTED" as ConsultationStatus,
    rejectedAt: Timestamp.now(),
    rejectedBy: actorUserId,
    rejectionReason: reason || "Doctor unavailable",
  };

  try {
    const ref = doc(db, "consultations", consultationId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Reject consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultations[consultationId]) {
    dbStore.consultations[consultationId] = {
      ...dbStore.consultations[consultationId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "REJECT_CONSULTATION",
    entityType: "CONSULTATION",
    entityId: consultationId,
    description: `Rejected consultation ${consultationId}: ${reason || "No reason given"}`,
  });

  await createNotification({
    recipientUserId: c.franchiseId,
    type: "CONSULTATION_REJECTED",
    title: "Consultation Request Declined",
    message: `Your consultation request for ${c.patientNameSnapshot} could not be accepted. Reason: ${reason || "Doctor unavailable"}.`,
    consultationId,
  });
}

export async function completeConsultation(
  consultationId: string,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const c = await getConsultationById(consultationId);
  if (!c) {
    throw new Error("Consultation not found.");
  }

  const updates = {
    status: "COMPLETED" as ConsultationStatus,
    completedAt: Timestamp.now(),
    completedBy: actorUserId,
  };

  try {
    const ref = doc(db, "consultations", consultationId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Complete consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultations[consultationId]) {
    dbStore.consultations[consultationId] = {
      ...dbStore.consultations[consultationId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "COMPLETE_CONSULTATION",
    entityType: "CONSULTATION",
    entityId: consultationId,
    description: `Consultation marked completed by ${actorRole}`,
  });

  await createNotification({
    recipientUserId: c.franchiseId,
    type: "CONSULTATION_COMPLETED",
    title: "Video Consultation Completed",
    message: `Video consultation for ${c.patientNameSnapshot} has concluded. Doctor is preparing prescription.`,
    consultationId,
  });
}

export async function addMeetingLink(
  consultationId: string,
  meetLink: string,
  adminUserId: string
): Promise<void> {
  const cleanLink = meetLink.trim();
  if (!cleanLink.startsWith("https://")) {
    throw new Error("Meeting URL must be a valid secure HTTPS link (e.g. https://meet.google.com/...)");
  }

  const c = await getConsultationById(consultationId);
  if (!c) {
    throw new Error("Consultation not found.");
  }

  const updates = {
    meetLink: cleanLink,
    meetAddedAt: Timestamp.now(),
    meetAddedBy: adminUserId,
    status: "MEETING_ADDED" as ConsultationStatus,
  };

  try {
    const ref = doc(db, "consultations", consultationId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Add meeting link Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultations[consultationId]) {
    dbStore.consultations[consultationId] = {
      ...dbStore.consultations[consultationId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: adminUserId,
    role: "ADMIN",
    action: "ADD_MEETING",
    entityType: "CONSULTATION",
    entityId: consultationId,
    description: `Added Google Meet link: ${cleanLink}`,
  });

  const doctor = await getDoctorById(c.doctorId);
  if (doctor?.userId) {
    await createNotification({
      recipientUserId: doctor.userId,
      type: "MEETING_ADDED",
      title: "Google Meet Link Added",
      message: `Meeting link has been added for consultation ${consultationId} with ${c.patientNameSnapshot}.`,
      consultationId,
    });
  }

  await createNotification({
    recipientUserId: c.franchiseId,
    type: "MEETING_ADDED",
    title: "Consultation Video Link Added",
    message: `Google Meet link added for your upcoming consultation with Dr. ${doctor?.name || "Doctor"}. Join opens 10 mins before start.`,
    consultationId,
  });
}

export async function cancelConsultation(
  consultationId: string,
  reason: string,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const updates = {
    status: "CANCELLED" as ConsultationStatus,
    cancelledAt: Timestamp.now(),
    cancelledBy: actorUserId,
    cancellationReason: reason,
  };

  try {
    const ref = doc(db, "consultations", consultationId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Cancel consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultations[consultationId]) {
    dbStore.consultations[consultationId] = {
      ...dbStore.consultations[consultationId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "CANCEL_CONSULTATION",
    entityType: "CONSULTATION",
    entityId: consultationId,
    description: `Cancelled consultation: ${reason}`,
  });
}

export async function getConsultationById(consultationId: string): Promise<Consultation | null> {
  try {
    const snap = await getDoc(doc(db, "consultations", consultationId));
    if (snap.exists()) {
      return { ...(snap.data() as Consultation), consultationId: snap.id };
    }
  } catch (error) {
    console.warn("Get consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.consultations?.[consultationId] || null;
}

export async function getFranchiseConsultations(
  franchiseId: string
): Promise<Consultation[]> {
  const map = new Map<string, Consultation>();
  const dbStore = getLocalDb();

  // 1. Load from local database
  if (dbStore.consultations) {
    for (const c of Object.values(dbStore.consultations)) {
      if (c && c.consultationId) {
        if (
          c.franchiseId === franchiseId ||
          (franchiseId === "FR-1001" &&
            (c.franchiseId === "mock-franchise-uid-01" || c.franchiseId === "mock-franchise-uid"))
        ) {
          map.set(c.consultationId, c);
        }
      }
    }
  }

  // 2. Load from Firestore & merge
  try {
    const q = query(
      collection(db, "consultations"),
      where("franchiseId", "==", franchiseId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as Consultation;
      const cId = data.consultationId || d.id;
      const merged = { ...data, consultationId: cId };
      map.set(cId, merged);
      if (!dbStore.consultations) dbStore.consultations = {};
      dbStore.consultations[cId] = merged;
    }
    saveLocalDb(dbStore);
  } catch (error) {
    console.warn("Get franchise consultations Firestore fallback:", error);
  }

  return Array.from(map.values()).sort(
    (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
  );
}

export async function getDoctorConsultations(
  doctorId: string
): Promise<Consultation[]> {
  const map = new Map<string, Consultation>();
  const dbStore = getLocalDb();

  // 1. Load from local database
  if (dbStore.consultations) {
    for (const c of Object.values(dbStore.consultations)) {
      if (c && c.consultationId) {
        if (
          c.doctorId === doctorId ||
          (doctorId === "DOC-2001" &&
            (c.doctorId === "mock-doctor-uid-01" || c.doctorId === "mock-doctor-uid"))
        ) {
          map.set(c.consultationId, c);
        }
      }
    }
  }

  // 2. Load from Firestore & merge
  try {
    const q = query(
      collection(db, "consultations"),
      where("doctorId", "==", doctorId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as Consultation;
      const cId = data.consultationId || d.id;
      const merged = { ...data, consultationId: cId };
      map.set(cId, merged);
      if (!dbStore.consultations) dbStore.consultations = {};
      dbStore.consultations[cId] = merged;
    }
    saveLocalDb(dbStore);
  } catch (error) {
    console.warn("Get doctor consultations Firestore fallback:", error);
  }

  return Array.from(map.values()).sort(
    (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
  );
}

export async function getAllConsultations(limitCount = 200): Promise<Consultation[]> {
  const map = new Map<string, Consultation>();
  const dbStore = getLocalDb();

  // 1. Load from local database
  if (dbStore.consultations) {
    for (const c of Object.values(dbStore.consultations)) {
      if (c && c.consultationId) {
        map.set(c.consultationId, c);
      }
    }
  }

  // 2. Load from Firestore & merge
  try {
    const q = query(collection(db, "consultations"));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as Consultation;
      const cId = data.consultationId || d.id;
      const merged = { ...data, consultationId: cId };
      map.set(cId, merged);
      if (!dbStore.consultations) dbStore.consultations = {};
      dbStore.consultations[cId] = merged;
    }
    saveLocalDb(dbStore);
  } catch (error) {
    console.warn("Get all consultations Firestore fallback:", error);
  }

  return Array.from(map.values())
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(0, limitCount);
}
