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
import { Doctor, DoctorAvailability, DayOfWeek, UserRole } from "@/types";
import { generateDoctorId } from "@/utils/formatters";
import { recordAuditLog } from "./auditService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

const DEFAULT_WEEKLY_SCHEDULE: DoctorAvailability["weeklySchedule"] = {
  monday: [
    { start: "09:00", end: "13:00" },
    { start: "15:00", end: "19:00" },
  ],
  tuesday: [
    { start: "09:00", end: "13:00" },
    { start: "15:00", end: "19:00" },
  ],
  wednesday: [
    { start: "09:00", end: "13:00" },
    { start: "15:00", end: "19:00" },
  ],
  thursday: [
    { start: "09:00", end: "13:00" },
    { start: "15:00", end: "19:00" },
  ],
  friday: [
    { start: "09:00", end: "13:00" },
    { start: "15:00", end: "19:00" },
  ],
  saturday: [
    { start: "09:00", end: "13:00" },
    { start: "15:00", end: "19:00" },
  ],
  sunday: [],
};

export async function createDoctor(
  data: Omit<Doctor, "doctorId" | "createdAt" | "updatedAt">,
  adminUserId: string,
  explicitDoctorId?: string
): Promise<string> {
  const doctorId = explicitDoctorId || generateDoctorId();

  const newDoctor: Doctor = {
    ...data,
    doctorId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const availability: DoctorAvailability = {
    doctorId,
    timezone: "Asia/Kolkata",
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  };

  try {
    const doctorRef = doc(db, "doctors", doctorId);
    await setDoc(doctorRef, newDoctor);

    const availRef = doc(db, "doctorAvailability", doctorId);
    await setDoc(availRef, availability);
  } catch (error) {
    console.warn("Doctor write to Firestore fallback to local DB:", error);
  }

  const dbStore = getLocalDb();
  dbStore.doctors[doctorId] = newDoctor;
  dbStore.doctorAvailability[doctorId] = availability;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: adminUserId,
    role: "ADMIN",
    action: "CREATE_DOCTOR",
    entityType: "DOCTOR",
    entityId: doctorId,
    description: `Created doctor profile for Dr. ${data.name} (${doctorId})`,
  });

  return doctorId;
}

export async function updateDoctor(
  doctorId: string,
  data: Partial<Doctor>,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  try {
    const doctorRef = doc(db, "doctors", doctorId);
    await updateDoc(doctorRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Update doctor Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.doctors[doctorId]) {
    dbStore.doctors[doctorId] = {
      ...dbStore.doctors[doctorId],
      ...data,
      updatedAt: Timestamp.now(),
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "UPDATE_DOCTOR",
    entityType: "DOCTOR",
    entityId: doctorId,
    description: `Updated doctor profile (${doctorId})`,
  });
}

export async function setDoctorStatus(
  doctorId: string,
  status: "ACTIVE" | "INACTIVE",
  adminUserId: string
): Promise<void> {
  try {
    const doctorRef = doc(db, "doctors", doctorId);
    await updateDoc(doctorRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Doctor status Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.doctors[doctorId]) {
    dbStore.doctors[doctorId].status = status;
    dbStore.doctors[doctorId].updatedAt = Timestamp.now();
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: adminUserId,
    role: "ADMIN",
    action: status === "ACTIVE" ? "ACTIVATE_DOCTOR" : "DEACTIVATE_DOCTOR",
    entityType: "DOCTOR",
    entityId: doctorId,
    description: `Doctor ${doctorId} status set to ${status}`,
  });
}

export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
  try {
    const snap = await getDoc(doc(db, "doctors", doctorId));
    if (snap.exists()) return snap.data() as Doctor;
  } catch (error) {
    console.warn("Get doctor Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.doctors[doctorId] || null;
}

export async function getDoctorByUserId(userId: string): Promise<Doctor | null> {
  try {
    const q = query(collection(db, "doctors"), where("userId", "==", userId));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as Doctor;
  } catch (error) {
    console.warn("Get doctor by userId Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return Object.values(dbStore.doctors).find((d) => d.userId === userId) || null;
}

export async function listAllDoctors(): Promise<Doctor[]> {
  try {
    const snap = await getDocs(collection(db, "doctors"));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Doctor);
    }
  } catch (error) {
    console.warn("List all doctors Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return Object.values(dbStore.doctors);
}

export async function getDoctorAvailability(doctorId: string): Promise<DoctorAvailability> {
  try {
    const snap = await getDoc(doc(db, "doctorAvailability", doctorId));
    if (snap.exists()) {
      return snap.data() as DoctorAvailability;
    }
  } catch (error) {
    console.warn("Availability doc read failed, returning local/default:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.doctorAvailability[doctorId]) {
    return dbStore.doctorAvailability[doctorId];
  }

  return {
    doctorId,
    timezone: "Asia/Kolkata",
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  };
}

export async function updateDoctorAvailability(
  doctorId: string,
  weeklySchedule: Record<DayOfWeek, { start: string; end: string }[]>,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  const availability: DoctorAvailability = {
    doctorId,
    timezone: "Asia/Kolkata",
    weeklySchedule,
  };

  try {
    const ref = doc(db, "doctorAvailability", doctorId);
    await setDoc(ref, availability);
  } catch (error) {
    console.warn("Update availability Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  dbStore.doctorAvailability[doctorId] = availability;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "UPDATE_AVAILABILITY",
    entityType: "DOCTOR",
    entityId: doctorId,
    description: `Updated weekly availability schedule for doctor ${doctorId}`,
  });
}
