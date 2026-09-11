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
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Prescription, Consultation, UserRole } from "@/types";
import { generatePrescriptionId } from "@/utils/formatters";
import { recordAuditLog } from "./auditService";
import { createNotification } from "./notificationService";
import { getDoctorById } from "./doctorService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export async function createDraftPrescription(params: {
  consultation: Consultation;
  diagnosis: string;
  medicines: Prescription["medicines"];
  investigations?: string;
  advice?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  actorUserId: string;
  actorRole: UserRole;
}): Promise<string> {
  const { consultation } = params;

  if (consultation.status !== "COMPLETED") {
    throw new Error("Prescriptions can only be created after the consultation is completed.");
  }

  const doctor = await getDoctorById(consultation.doctorId);

  const prescriptionId = generatePrescriptionId();

  const prescription: Prescription = {
    prescriptionId,
    consultationId: consultation.consultationId,
    patientId: consultation.patientId,
    doctorId: consultation.doctorId,
    franchiseId: consultation.franchiseId,

    // Snapshots
    patientNameSnapshot: consultation.patientNameSnapshot,
    patientAgeSnapshot: consultation.patientAgeSnapshot,
    patientAddressSnapshot: consultation.patientAddressSnapshot,

    doctorNameSnapshot: doctor ? `Dr. ${doctor.name}` : "Consulting Doctor",
    doctorQualificationSnapshot: doctor?.qualification || "",
    doctorSpecializationSnapshot: doctor?.specialization || "",
    doctorRegistrationSnapshot: doctor?.registrationNumber || "",

    diagnosis: params.diagnosis,
    medicines: params.medicines || [],
    investigations: params.investigations || "",
    advice: params.advice || "",
    followUpRequired: params.followUpRequired,
    followUpDate: params.followUpDate || "",

    status: "DRAFT",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const ref = doc(db, "prescriptions", prescriptionId);
    await setDoc(ref, prescription);
  } catch (error) {
    console.warn("Create prescription Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  dbStore.prescriptions[prescriptionId] = prescription;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: params.actorUserId,
    role: params.actorRole,
    action: "CREATE_PRESCRIPTION",
    entityType: "PRESCRIPTION",
    entityId: prescriptionId,
    description: `Created draft prescription ${prescriptionId} for consultation ${consultation.consultationId}`,
  });

  return prescriptionId;
}

export async function updateDraftPrescription(
  prescriptionId: string,
  data: Partial<Pick<Prescription, "diagnosis" | "medicines" | "investigations" | "advice" | "followUpRequired" | "followUpDate">>,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const existing = await getPrescriptionById(prescriptionId);
  if (!existing) {
    throw new Error("Prescription not found.");
  }
  if (existing.status === "FINALIZED") {
    throw new Error("Finalized prescriptions are immutable and cannot be edited.");
  }

  try {
    const ref = doc(db, "prescriptions", prescriptionId);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Update draft prescription Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.prescriptions[prescriptionId]) {
    dbStore.prescriptions[prescriptionId] = {
      ...dbStore.prescriptions[prescriptionId],
      ...data,
      updatedAt: Timestamp.now(),
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "UPDATE_PRESCRIPTION",
    entityType: "PRESCRIPTION",
    entityId: prescriptionId,
    description: `Updated draft prescription ${prescriptionId}`,
  });
}

export async function finalizePrescription(
  prescriptionId: string,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const existing = await getPrescriptionById(prescriptionId);
  if (!existing) {
    throw new Error("Prescription not found.");
  }
  if (existing.status === "FINALIZED") {
    return;
  }

  const updates = {
    status: "FINALIZED" as const,
    finalizedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const ref = doc(db, "prescriptions", prescriptionId);
    await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Finalize prescription Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.prescriptions[prescriptionId]) {
    dbStore.prescriptions[prescriptionId] = {
      ...dbStore.prescriptions[prescriptionId],
      ...updates,
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "FINALIZE_PRESCRIPTION",
    entityType: "PRESCRIPTION",
    entityId: prescriptionId,
    description: `Finalized prescription ${prescriptionId} for consultation ${existing.consultationId}`,
  });

  await createNotification({
    recipientUserId: existing.franchiseId,
    type: "PRESCRIPTION_FINALIZED",
    title: "Prescription Ready for Download",
    message: `Prescription for patient ${existing.patientNameSnapshot} (${existing.consultationId}) has been finalized and is ready to download.`,
    consultationId: existing.consultationId,
  });
}

export async function getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
  try {
    const snap = await getDoc(doc(db, "prescriptions", prescriptionId));
    if (snap.exists()) return snap.data() as Prescription;
  } catch (error) {
    console.warn("Get prescription Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.prescriptions[prescriptionId] || null;
}

export async function getPrescriptionByConsultationId(
  consultationId: string
): Promise<Prescription | null> {
  try {
    const q = query(
      collection(db, "prescriptions"),
      where("consultationId", "==", consultationId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as Prescription;
  } catch (error) {
    console.warn("Get prescription by consultation Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return (
    Object.values(dbStore.prescriptions).find((p) => p.consultationId === consultationId) || null
  );
}

export async function listFranchisePrescriptions(
  franchiseId: string
): Promise<Prescription[]> {
  try {
    const q = query(
      collection(db, "prescriptions"),
      where("franchiseId", "==", franchiseId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Prescription);
    }
  } catch (error) {
    console.warn("List franchise prescriptions Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return Object.values(dbStore.prescriptions).filter((p) => p.franchiseId === franchiseId);
}

export async function listDoctorPrescriptions(
  doctorId: string
): Promise<Prescription[]> {
  try {
    const q = query(
      collection(db, "prescriptions"),
      where("doctorId", "==", doctorId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Prescription);
    }
  } catch (error) {
    console.warn("List doctor prescriptions Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return Object.values(dbStore.prescriptions).filter((p) => p.doctorId === doctorId);
}

export async function listAllPrescriptions(): Promise<Prescription[]> {
  try {
    const snap = await getDocs(collection(db, "prescriptions"));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Prescription);
    }
  } catch (error) {
    console.warn("List all prescriptions Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return Object.values(dbStore.prescriptions);
}
