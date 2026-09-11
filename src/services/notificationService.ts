import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Notification, NotificationType } from "@/types";
import { generateNotificationId } from "@/utils/formatters";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";
import { toDate } from "@/utils/date";

export async function createNotification(params: {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  consultationId?: string;
}): Promise<string> {
  const notificationId = generateNotificationId();
  const notification: Notification = {
    notificationId,
    recipientUserId: params.recipientUserId,
    type: params.type,
    title: params.title,
    message: params.message,
    consultationId: params.consultationId,
    isRead: false,
    createdAt: Timestamp.now(),
  };

  try {
    const notifRef = doc(db, "notifications", notificationId);
    await setDoc(notifRef, notification);
  } catch (error) {
    console.warn("Create notification Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.notifications) dbStore.notifications = {};
  dbStore.notifications[notificationId] = notification;
  saveLocalDb(dbStore);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cmgc-notifications-change"));
  }

  return notificationId;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, { isRead: true });
  } catch (error) {
    console.warn("Mark notification read Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.notifications) dbStore.notifications = {};
  if (dbStore.notifications[notificationId]) {
    dbStore.notifications[notificationId].isRead = true;
    saveLocalDb(dbStore);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cmgc-notifications-change"));
  }
}

export async function getUserNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientUserId", "==", userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ ...(d.data() as Notification), notificationId: d.id }))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
        .slice(0, limitCount);
    }
  } catch (error) {
    console.warn("Get user notifications Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  const list = dbStore.notifications ? Object.values(dbStore.notifications) : [];
  return list
    .filter((n) => n.recipientUserId === userId)
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(0, limitCount);
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const fetchLocal = () => {
    const dbStore = getLocalDb();
    const list = dbStore.notifications ? Object.values(dbStore.notifications) : [];
    const notifs = list
      .filter((n) => n.recipientUserId === userId)
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
      .slice(0, 30);
    callback(notifs);
  };

  const handleCustomChange = () => {
    fetchLocal();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("cmgc-notifications-change", handleCustomChange);
  }

  fetchLocal();

  let unsubscribeFirestore = () => {};
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientUserId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const notifs = snapshot.docs.map((doc) => doc.data() as Notification);
          callback(notifs);
        }
      },
      (error) => {
        console.warn("Firestore notification listener fallback to local:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach firestore snapshot:", err);
  }

  return () => {
    unsubscribeFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener("cmgc-notifications-change", handleCustomChange);
    }
  };
}
