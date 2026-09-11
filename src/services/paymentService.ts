import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Payment, PaymentMethod, PaymentStatus, UserRole } from "@/types";
import { generatePaymentId } from "@/utils/formatters";
import { recordAuditLog } from "./auditService";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export async function recordPayment(params: {
  consultationId: string;
  patientId: string;
  franchiseId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionReference?: string;
  notes?: string;
  actorUserId: string;
  actorRole?: UserRole;
}): Promise<string> {
  const paymentId = generatePaymentId();

  const payment: Payment = {
    paymentId,
    consultationId: params.consultationId,
    patientId: params.patientId,
    franchiseId: params.franchiseId,
    amount: params.amount,
    currency: "INR",
    paymentMethod: params.paymentMethod,
    paymentStatus: params.paymentStatus || "PAID",
    transactionReference: params.transactionReference || "",
    notes: params.notes || "",
    paidAt: Timestamp.now(),
    recordedBy: params.actorUserId,
    createdAt: Timestamp.now(),
  };

  try {
    const ref = doc(db, "payments", paymentId);
    await setDoc(ref, payment);
  } catch (error) {
    console.warn("Record payment Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  dbStore.payments[paymentId] = payment;
  saveLocalDb(dbStore);

  await recordAuditLog({
    userId: params.actorUserId,
    role: params.actorRole || "ADMIN",
    action: "RECORD_PAYMENT",
    entityType: "PAYMENT",
    entityId: paymentId,
    description: `Recorded payment of ₹${params.amount} via ${params.paymentMethod} for consultation ${params.consultationId}`,
  });

  return paymentId;
}

export async function getConsultationPayment(consultationId: string): Promise<Payment | null> {
  try {
    const q = query(
      collection(db, "payments"),
      where("consultationId", "==", consultationId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Payment;
    }
  } catch (error) {
    console.warn("Get consultation payment Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return (
    Object.values(dbStore.payments).find((p) => p.consultationId === consultationId) || null
  );
}

import { toDate } from "@/utils/date";

export async function listPaymentsForFranchise(franchiseId: string): Promise<Payment[]> {
  try {
    const q = query(
      collection(db, "payments"),
      where("franchiseId", "==", franchiseId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ ...(d.data() as Payment), paymentId: d.id }))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
    }
  } catch (error) {
    console.warn("List payments for franchise Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  const list = dbStore.payments ? Object.values(dbStore.payments) : [];
  return list
    .filter((p) => p.franchiseId === franchiseId)
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
}

export async function listAllPayments(): Promise<Payment[]> {
  try {
    const q = query(collection(db, "payments"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ ...(d.data() as Payment), paymentId: d.id }))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
    }
  } catch (error) {
    console.warn("List all payments Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  const list = dbStore.payments ? Object.values(dbStore.payments) : [];
  return list.sort(
    (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
  );
}
