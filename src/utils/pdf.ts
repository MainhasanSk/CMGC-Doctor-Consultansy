import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Prescription } from "@/types";

export function generatePrescriptionPdf(prescription: Prescription): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(10, 37, 64); // CMGC Navy
  doc.rect(0, 0, pageWidth, 32, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHENNAI MEDICAL GUIDANCE CENTRE", pageWidth / 2, 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Medical Video Consultation Management System", pageWidth / 2, 22, { align: "center" });

  // Doctor & Prescription Meta Sub-Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);

  const startY = 38;

  // Left Column: Doctor Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(prescription.doctorNameSnapshot || "Consulting Doctor", 14, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Qualification: ${prescription.doctorQualificationSnapshot || "MBBS"}`, 14, startY + 5);
  doc.text(`Specialization: ${prescription.doctorSpecializationSnapshot || "General"}`, 14, startY + 10);
  doc.text(`Reg. No: ${prescription.doctorRegistrationSnapshot || "N/A"}`, 14, startY + 15);

  // Right Column: Consultation Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Prescription ID: ${prescription.prescriptionId}`, pageWidth - 14, startY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Consultation ID: ${prescription.consultationId}`, pageWidth - 14, startY + 5, { align: "right" });
  doc.text(`Status: ${prescription.status}`, pageWidth - 14, startY + 10, { align: "right" });

  // Horizontal Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, startY + 20, pageWidth - 14, startY + 20);

  // Patient Card Box
  const patientY = startY + 25;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, patientY, pageWidth - 28, 22, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, patientY, pageWidth - 28, 22, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("PATIENT INFORMATION", 20, patientY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Name: ${prescription.patientNameSnapshot}`, 20, patientY + 14);
  doc.text(`Age: ${prescription.patientAgeSnapshot} yrs`, 90, patientY + 14);
  doc.text(`Address: ${prescription.patientAddressSnapshot || "N/A"}`, 130, patientY + 14);

  // Diagnosis Section
  let currentY = patientY + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(10, 37, 64);
  doc.text("DIAGNOSIS / CLINICAL ASSESSMENT", 14, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const diagLines = doc.splitTextToSize(prescription.diagnosis || "Not specified", pageWidth - 28);
  doc.text(diagLines, 14, currentY);
  currentY += diagLines.length * 5 + 4;

  // Medicines (Rx) Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(10, 37, 64);
  doc.text("Rx — MEDICATIONS", 14, currentY);
  currentY += 4;

  const tableData = (prescription.medicines || []).map((med, idx) => [
    (idx + 1).toString(),
    med.name,
    med.dosage,
    med.frequency,
    med.duration,
    med.instructions || "-",
  ]);

  if (tableData.length === 0) {
    tableData.push(["-", "No medicines prescribed", "-", "-", "-", "-"]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Medicine Name", "Dosage", "Frequency", "Duration", "Instructions"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 76, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 45 },
    },
    margin: { left: 14, right: 14 },
  });

  // Position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastAutoTable = (doc as any).lastAutoTable;
  currentY = lastAutoTable ? lastAutoTable.finalY + 10 : currentY + 30;

  // Investigations & Advice
  if (prescription.investigations) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 37, 64);
    doc.text("RECOMMENDED INVESTIGATIONS / TESTS", 14, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(prescription.investigations, pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.5 + 5;
  }

  if (prescription.advice) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 37, 64);
    doc.text("GENERAL ADVICE & INSTRUCTIONS", 14, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(prescription.advice, pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.5 + 5;
  }

  // Follow-up
  if (prescription.followUpRequired) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text(`Follow-Up Required: ${prescription.followUpDate || "As needed"}`, 14, currentY);
    currentY += 10;
  }

  // Signature Block
  const sigY = 250;
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(prescription.doctorNameSnapshot || "Consulting Doctor", pageWidth - 42, sigY + 5, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Medical Practitioner", pageWidth - 42, sigY + 9, {
    align: "center",
  });

  // Footer Banner
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 275, pageWidth, 22, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Chennai Medical Guidance Centre (CMGC) — Certified Telemedicine Consultation Record",
    pageWidth / 2,
    282,
    { align: "center" }
  );
  doc.text(
    "This electronic prescription was generated after a verified video consultation.",
    pageWidth / 2,
    288,
    { align: "center" }
  );

  return doc;
}
