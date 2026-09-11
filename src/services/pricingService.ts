import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { PricingSettings } from "@/types";
import { recordAuditLog } from "./auditService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

const DEFAULT_PRICING: PricingSettings = {
  videoConsultationFee: 500,
  currency: "INR",
  updatedAt: Timestamp.now(),
  updatedBy: "system",
};

export async function getPricingSettings(): Promise<PricingSettings> {
  try {
    const ref = doc(db, "settings", "pricing");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as PricingSettings;
    }
  } catch (error) {
    console.warn("Pricing read from Firestore fallback to local DB:", error);
  }
  return getLocalDb().pricing || DEFAULT_PRICING;
}

export async function updatePricingFee(fee: number, adminUserId: string): Promise<void> {
  const updateData: PricingSettings = {
    videoConsultationFee: fee,
    currency: "INR",
    updatedAt: Timestamp.now(),
    updatedBy: adminUserId,
  };

  try {
    const ref = doc(db, "settings", "pricing");
    await setDoc(ref, updateData);
  } catch (error) {
    console.warn("Pricing write to Firestore fallback to local DB:", error);
  }

  const dbStore = getLocalDb();
  dbStore.pricing = updateData;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: adminUserId,
    role: "ADMIN",
    action: "CHANGE_PRICING",
    entityType: "SETTINGS",
    entityId: "pricing",
    description: `Updated consultation fee to ₹${fee}`,
  });
}
