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
import { Patient, UserRole } from "@/types";
import { generatePatientId } from "@/utils/formatters";
import { recordAuditLog } from "./auditService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export async function createPatient(
  data: Omit<Patient, "patientId" | "createdAt" | "updatedAt">,
  franchiseId: string,
  actorUserId: string,
  explicitPatientId?: string
): Promise<string> {
  // Resolve franchiseId: prioritize valid "FR-" prefixed ID, or data.createdByFranchiseId
  const resolvedFranchiseId =
    (franchiseId && franchiseId.startsWith("FR-") ? franchiseId : null) ||
    (data.createdByFranchiseId && data.createdByFranchiseId.startsWith("FR-")
      ? data.createdByFranchiseId
      : null) ||
    franchiseId ||
    data.createdByFranchiseId ||
    "FR-1001";

  const resolvedActorUserId =
    actorUserId && actorUserId !== "FRANCHISE"
      ? actorUserId
      : franchiseId && !franchiseId.startsWith("FR-")
      ? franchiseId
      : "franchise-operator";

  const patientId = explicitPatientId || generatePatientId();

  const newPatient: Patient = {
    ...data,
    patientId,
    createdByFranchiseId: resolvedFranchiseId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const ref = doc(db, "patients", patientId);
    await setDoc(ref, newPatient);
  } catch (error) {
    console.warn("Create patient Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.patients) dbStore.patients = {};
  dbStore.patients[patientId] = newPatient;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: resolvedActorUserId,
    role: "FRANCHISE",
    action: "CREATE_PATIENT",
    entityType: "PATIENT",
    entityId: patientId,
    description: `Created patient record for ${data.name} (${patientId})`,
  }).catch(() => {});

  return patientId;
}

export async function updatePatient(
  patientId: string,
  data: Partial<Patient>,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  try {
    const ref = doc(db, "patients", patientId);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Update patient Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.patients) dbStore.patients = {};
  if (dbStore.patients[patientId]) {
    dbStore.patients[patientId] = {
      ...dbStore.patients[patientId],
      ...data,
      updatedAt: Timestamp.now(),
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "UPDATE_PATIENT",
    entityType: "PATIENT",
    entityId: patientId,
    description: `Updated patient details (${patientId})`,
  }).catch(() => {});
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  try {
    const snap = await getDoc(doc(db, "patients", patientId));
    if (snap.exists()) return snap.data() as Patient;
  } catch (error) {
    console.warn("Get patient Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.patients?.[patientId] || null;
}

export async function listPatientsForFranchise(franchiseId: string): Promise<Patient[]> {
  try {
    const q = query(
      collection(db, "patients"),
      where("createdByFranchiseId", "==", franchiseId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data() as Patient;
        return { ...data, patientId: data.patientId || d.id };
      });
    }
  } catch (error) {
    console.warn("List patients for franchise Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.patients) {
    let modified = false;
    // Auto-heal any legacy records saved with UID instead of franchise reference ID
    for (const p of Object.values(dbStore.patients)) {
      if (
        p.createdByFranchiseId === "mock-franchise-uid-01" ||
        p.createdByFranchiseId === "mock-franchise-uid"
      ) {
        p.createdByFranchiseId = "FR-1001";
        modified = true;
      }
    }
    if (modified) saveLocalDb(dbStore);
  }

  const list = dbStore.patients ? Object.values(dbStore.patients) : [];
  return list.filter(
    (p) =>
      p.createdByFranchiseId === franchiseId ||
      (franchiseId === "FR-1001" &&
        (p.createdByFranchiseId === "mock-franchise-uid-01" ||
          p.createdByFranchiseId === "mock-franchise-uid"))
  );
}

export const listFranchisePatients = listPatientsForFranchise;

export async function listAllPatients(): Promise<Patient[]> {
  try {
    const snap = await getDocs(collection(db, "patients"));
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data() as Patient;
        return { ...data, patientId: data.patientId || d.id };
      });
    }
  } catch (error) {
    console.warn("List all patients Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.patients ? Object.values(dbStore.patients) : [];
}

/**
 * Searches patients by query text and optional franchiseId.
 * Supports both signatures: (franchiseId, query) and (query, franchiseId).
 */
export async function searchPatients(
  arg1: string = "",
  arg2: string = ""
): Promise<Patient[]> {
  let franchiseId: string | undefined = undefined;
  let queryText = "";

  if (arg1.startsWith("FR-")) {
    franchiseId = arg1;
    queryText = arg2;
  } else if (arg2.startsWith("FR-")) {
    franchiseId = arg2;
    queryText = arg1;
  } else if (arg1 && !arg2) {
    queryText = arg1;
  } else {
    franchiseId = arg1 || undefined;
    queryText = arg2;
  }

  const all = franchiseId
    ? await listPatientsForFranchise(franchiseId)
    : await listAllPatients();

  const q = queryText.toLowerCase().trim();
  if (!q) return all;

  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.patientId.toLowerCase().includes(q)
  );
}
