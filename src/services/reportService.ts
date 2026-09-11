import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { ConsultationReport } from "@/types";
import { generateReportId } from "@/utils/formatters";
import { getLocalDb, saveLocalDb } from "@/lib/mockStore";

export interface UploadResult {
  secureUrl: string;
  publicId: string;
}

/**
 * Calculates SHA-1 hex string using native browser Web Crypto API.
 */
async function generateSha1Hex(str: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-1", enc.encode(str));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Uploads a document/report file to Cloudinary.
 * Supports signed uploads (using API Key & Secret) or unsigned presets, with local dataURL fallback.
 */
export async function uploadFileToCloudinary(file: File): Promise<UploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "bjixtybb";
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "564966213268955";
  const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || "01VZNDy5hZLte-rZW-NNFdC_IgQ";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  try {
    // 1. Unsigned upload via upload_preset (Standard, fast client-side upload)
    if (cloudName && uploadPreset) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to upload file to Cloudinary via preset");
      }

      const data = await res.json();
      return {
        secureUrl: data.secure_url,
        publicId: data.public_id,
      };
    }

    // 2. Signed upload via API Key + API Secret (Authenticated fallback)
    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "cmgc_reports";
      const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = await generateSha1Hex(strToSign);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("folder", folder);
      formData.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Cloudinary signed upload failed with status ${res.status}`);
      }

      const data = await res.json();
      return {
        secureUrl: data.secure_url,
        publicId: data.public_id,
      };
    }
  } catch (cloudErr) {
    console.warn("Cloudinary upload failed, falling back to in-browser data URL:", cloudErr);
  }

  // 3. Resilient fallback: Convert to Base64 data URL if network/offline
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        secureUrl: reader.result as string,
        publicId: `local-${Date.now()}-${file.name}`,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function createConsultationReport(params: {
  consultationId: string;
  patientId: string;
  franchiseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  secureUrl: string;
  cloudinaryPublicId: string;
  uploadedBy: string;
}): Promise<string> {
  const reportId = generateReportId();
  const ref = doc(db, "consultationReports", reportId);

  const report: ConsultationReport = {
    reportId,
    consultationId: params.consultationId,
    patientId: params.patientId,
    franchiseId: params.franchiseId,
    fileName: params.fileName,
    fileType: params.fileType,
    fileSize: params.fileSize,
    cloudinaryPublicId: params.cloudinaryPublicId,
    secureUrl: params.secureUrl,
    uploadedBy: params.uploadedBy,
    uploadedAt: Timestamp.now(),
  };

  try {
    await setDoc(ref, report);
  } catch (error) {
    console.warn("Report setDoc Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (!dbStore.consultationReports) {
    dbStore.consultationReports = {};
  }
  dbStore.consultationReports[reportId] = report;
  saveLocalDb(dbStore);

  return reportId;
}

export async function getConsultationReports(
  consultationId: string
): Promise<ConsultationReport[]> {
  try {
    const q = query(
      collection(db, "consultationReports"),
      where("consultationId", "==", consultationId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as ConsultationReport);
    }
  } catch (error) {
    console.warn("Get reports Firestore fallback:", error);
  }

  const dbStore = getLocalDb();
  if (dbStore.consultationReports) {
    return Object.values(dbStore.consultationReports).filter(
      (r) => r.consultationId === consultationId
    );
  }

  return [];
}
