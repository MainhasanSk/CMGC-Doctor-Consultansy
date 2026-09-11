import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Franchise, UserRole } from "@/types";
import { generateFranchiseId } from "@/utils/formatters";
import { recordAuditLog } from "./auditService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export async function createFranchise(
  data: Omit<Franchise, "franchiseId" | "createdAt" | "updatedAt">,
  adminUserId: string,
  explicitFranchiseId?: string
): Promise<string> {
  const franchiseId = explicitFranchiseId || generateFranchiseId();

  const newFranchise: Franchise = {
    ...data,
    franchiseId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const ref = doc(db, "franchises", franchiseId);
    await setDoc(ref, newFranchise);
  } catch (error) {
    console.warn("Franchise write to Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  dbStore.franchises[franchiseId] = newFranchise;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: adminUserId,
    role: "ADMIN",
    action: "CREATE_FRANCHISE",
    entityType: "FRANCHISE",
    entityId: franchiseId,
    description: `Created franchise ${data.name} (${franchiseId})`,
  });

  return franchiseId;
}

export async function updateFranchise(
  franchiseId: string,
  data: Partial<Franchise>,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  try {
    const ref = doc(db, "franchises", franchiseId);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Update franchise Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.franchises[franchiseId]) {
    dbStore.franchises[franchiseId] = {
      ...dbStore.franchises[franchiseId],
      ...data,
      updatedAt: Timestamp.now(),
    };
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: actorUserId,
    role: actorRole,
    action: "UPDATE_FRANCHISE",
    entityType: "FRANCHISE",
    entityId: franchiseId,
    description: `Updated franchise profile (${franchiseId})`,
  });
}

export async function setFranchiseStatus(
  franchiseId: string,
  status: "ACTIVE" | "INACTIVE",
  adminUserId: string
): Promise<void> {
  try {
    const ref = doc(db, "franchises", franchiseId);
    await updateDoc(ref, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Franchise status Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.franchises[franchiseId]) {
    dbStore.franchises[franchiseId].status = status;
    dbStore.franchises[franchiseId].updatedAt = Timestamp.now();
    saveLocalDb(dbStore);
  }

  await recordAuditLog({
    userId: adminUserId,
    role: "ADMIN",
    action: status === "ACTIVE" ? "ACTIVATE_FRANCHISE" : "DEACTIVATE_FRANCHISE",
    entityType: "FRANCHISE",
    entityId: franchiseId,
    description: `Franchise ${franchiseId} status set to ${status}`,
  });
}

export async function getFranchiseById(franchiseId: string): Promise<Franchise | null> {
  try {
    const snap = await getDoc(doc(db, "franchises", franchiseId));
    if (snap.exists()) return snap.data() as Franchise;
  } catch (error) {
    console.warn("Get franchise Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return dbStore.franchises[franchiseId] || null;
}

export async function listAllFranchises(): Promise<Franchise[]> {
  try {
    const snap = await getDocs(collection(db, "franchises"));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Franchise);
    }
  } catch (error) {
    console.warn("List all franchises Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return Object.values(dbStore.franchises);
}
