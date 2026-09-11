import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { FranchiseDoctor, Doctor } from "@/types";
import { recordAuditLog } from "./auditService";
import { getDoctorById } from "./doctorService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export async function assignDoctorToFranchise(
  franchiseId: string,
  doctorId: string,
  adminUserId: string
): Promise<string> {
  if (!franchiseId || !doctorId) {
    throw new Error("Both franchise and doctor must be selected.");
  }

  const effectiveAdminId = adminUserId || "central-admin";
  const existing = await getFranchiseDoctorAssignment(franchiseId, doctorId);

  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new Error("This doctor is already actively assigned to this franchise.");
    } else {
      const assignmentId = existing.assignmentId || `ASG-${franchiseId}-${doctorId}`;
      try {
        await updateDoc(doc(db, "franchiseDoctors", assignmentId), {
          status: "ACTIVE",
          assignedAt: Timestamp.now(),
          assignedBy: effectiveAdminId,
        });
      } catch (error) {
        console.warn("Update assignment Firestore fallback:", error);
      }

      const dbStore = getLocalDb();
      if (!dbStore.franchiseDoctors) dbStore.franchiseDoctors = {};
      dbStore.franchiseDoctors[assignmentId] = {
        ...existing,
        assignmentId,
        status: "ACTIVE",
        assignedAt: Timestamp.now(),
        assignedBy: effectiveAdminId,
      };
      saveLocalDb(dbStore);

      await recordAuditLog({
        userId: effectiveAdminId,
        role: "ADMIN",
        action: "ASSIGN_DOCTOR",
        entityType: "FRANCHISE_DOCTOR",
        entityId: assignmentId,
        description: `Re-activated assignment for doctor ${doctorId} to franchise ${franchiseId}`,
      }).catch(() => {});

      return assignmentId;
    }
  }

  const assignmentId = `ASG-${franchiseId}-${doctorId}`;
  const newAssignment: FranchiseDoctor = {
    assignmentId,
    franchiseId,
    doctorId,
    status: "ACTIVE",
    assignedAt: Timestamp.now(),
    assignedBy: effectiveAdminId,
  };

  try {
    await setDoc(doc(db, "franchiseDoctors", assignmentId), newAssignment);
  } catch (error) {
    console.warn("Assignment write Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.franchiseDoctors) dbStore.franchiseDoctors = {};
  dbStore.franchiseDoctors[assignmentId] = newAssignment;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: effectiveAdminId,
    role: "ADMIN",
    action: "ASSIGN_DOCTOR",
    entityType: "FRANCHISE_DOCTOR",
    entityId: assignmentId,
    description: `Assigned doctor ${doctorId} to franchise ${franchiseId}`,
  }).catch(() => {});

  return assignmentId;
}

export async function removeDoctorFromFranchise(
  assignmentId: string,
  adminUserId: string
): Promise<void> {
  const effectiveAdminId = adminUserId || "central-admin";
  try {
    await updateDoc(doc(db, "franchiseDoctors", assignmentId), {
      status: "INACTIVE",
    });
  } catch (error) {
    console.warn("Remove doctor assignment Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.franchiseDoctors) dbStore.franchiseDoctors = {};
  if (dbStore.franchiseDoctors[assignmentId]) {
    dbStore.franchiseDoctors[assignmentId].status = "INACTIVE";
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: effectiveAdminId,
    role: "ADMIN",
    action: "REMOVE_DOCTOR_ASSIGNMENT",
    entityType: "FRANCHISE_DOCTOR",
    entityId: assignmentId,
    description: `Deactivated franchise doctor assignment ${assignmentId}`,
  }).catch(() => {});
}

export const deactivateAssignment = removeDoctorFromFranchise;

export async function getFranchiseDoctorAssignment(
  franchiseId: string,
  doctorId: string
): Promise<FranchiseDoctor | null> {
  try {
    const q = query(
      collection(db, "franchiseDoctors"),
      where("franchiseId", "==", franchiseId),
      where("doctorId", "==", doctorId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data() as FranchiseDoctor;
      return {
        ...data,
        assignmentId: data.assignmentId || snap.docs[0].id,
      };
    }
  } catch (error) {
    console.warn("Get assignment Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  const list = dbStore.franchiseDoctors ? Object.values(dbStore.franchiseDoctors) : [];
  return (
    list.find(
      (a) => a.franchiseId === franchiseId && a.doctorId === doctorId
    ) || null
  );
}

export async function getAssignedDoctorsForFranchise(franchiseId: string): Promise<Doctor[]> {
  let docIds: string[] = [];

  try {
    const q = query(
      collection(db, "franchiseDoctors"),
      where("franchiseId", "==", franchiseId),
      where("status", "==", "ACTIVE")
    );
    const snap = await getDocs(q);
    docIds = snap.docs.map((d) => (d.data() as FranchiseDoctor).doctorId);
  } catch (error) {
    console.warn("Get assigned doctors Firestore fallback:", error);
  }

  if (docIds.length === 0) {
    const dbStore = getLocalDb();
    const list = dbStore.franchiseDoctors ? Object.values(dbStore.franchiseDoctors) : [];
    docIds = list
      .filter((a) => a.franchiseId === franchiseId && a.status === "ACTIVE")
      .map((a) => a.doctorId);
  }

  const doctors: Doctor[] = [];
  for (const docId of docIds) {
    const doctor = await getDoctorById(docId);
    if (doctor && doctor.status === "ACTIVE") {
      doctors.push(doctor);
    }
  }

  return doctors;
}

export async function listAllAssignments(): Promise<FranchiseDoctor[]> {
  try {
    const snap = await getDocs(collection(db, "franchiseDoctors"));
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data() as FranchiseDoctor;
        return {
          ...data,
          assignmentId: data.assignmentId || d.id,
        };
      });
    }
  } catch (error) {
    console.warn("List all assignments Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.franchiseDoctors ? Object.values(dbStore.franchiseDoctors) : [];
}
