import { collection, doc, setDoc, Timestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { AuditLog, UserRole } from "@/types";
import { generateAuditLogId } from "@/utils/formatters";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export async function recordAuditLog(params: {
  userId: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const logId = generateAuditLogId();
  const auditData: AuditLog = {
    logId,
    userId: params.userId,
    role: params.role,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    description: params.description || "",
    metadata: params.metadata || {},
    timestamp: Timestamp.now(),
  };

  try {
    const logRef = doc(db, "auditLogs", logId);
    await setDoc(logRef, auditData);
  } catch (error) {
    console.warn("Audit log Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  dbStore.auditLogs = [auditData, ...(dbStore.auditLogs || [])].slice(0, 500);
  saveLocalDb(dbStore);

  return logId;
}

export async function getAuditLogs(limitCount = 100): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, "auditLogs"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as AuditLog);
    }
  } catch (error) {
    console.warn("Get audit logs Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  return (dbStore.auditLogs || []).slice(0, limitCount);
}
