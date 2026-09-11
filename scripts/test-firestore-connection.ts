import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const envVars: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...vals] = trimmed.split("=");
    envVars[key.trim()] = vals.join("=").trim();
  }
}

const firebaseConfig = {
  apiKey: envVars["NEXT_PUBLIC_FIREBASE_API_KEY"],
  authDomain: envVars["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  projectId: envVars["NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
  storageBucket: envVars["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: envVars["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"],
  appId: envVars["NEXT_PUBLIC_FIREBASE_APP_ID"],
};

async function testConnection() {
  console.log("Testing Firestore connection with project:", firebaseConfig.projectId);
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const testDoc = doc(db, "settings", "pricing");
    console.log("Fetching doc /settings/pricing...");
    const snap = await getDoc(testDoc);
    console.log("Snap exists:", snap.exists());
    if (snap.exists()) {
      console.log("Data:", snap.data());
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Firestore error:", error.name, error.message);
  }
}

testConnection();
