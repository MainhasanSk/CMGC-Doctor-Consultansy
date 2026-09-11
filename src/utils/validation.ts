import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(2, "Patient name must be at least 2 characters"),
  age: z.coerce.number().int().min(0, "Age must be 0 or greater").max(130, "Please enter a valid age"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    errorMap: () => ({ message: "Please select a valid gender" }),
  }),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(3, "Address must be at least 3 characters"),
});

export const consultationBookingSchema = z.object({
  patientId: z.string().min(1, "Please select or create a patient"),
  doctorId: z.string().min(1, "Please select an assigned doctor"),
  disease: z.string().min(2, "Please enter the medical condition or disease"),
  diseaseDescription: z.string().min(5, "Please provide description of symptoms/condition"),
  extraMessage: z.string().optional(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm"),
});

export const rescheduleSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  newTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm"),
  reason: z.string().optional(),
});

export const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required (e.g. 500mg)"),
  frequency: z.string().min(1, "Frequency is required (e.g. 1-0-1)"),
  duration: z.string().min(1, "Duration is required (e.g. 5 days)"),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  diagnosis: z.string().min(2, "Diagnosis is required"),
  medicines: z.array(medicineSchema).min(0),
  investigations: z.string().optional(),
  advice: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
});

export const doctorSchema = z.object({
  name: z.string().min(2, "Doctor name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  qualification: z.string().min(2, "Qualification is required (e.g. MBBS, MD)"),
  specialization: z.string().min(2, "Specialization is required (e.g. Cardiology)"),
  registrationNumber: z.string().min(2, "Registration number is required"),
  experience: z.coerce.number().min(0).optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const franchiseSchema = z.object({
  name: z.string().min(2, "Franchise centre name is required"),
  ownerName: z.string().min(2, "Owner / Manager name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  paymentMethod: z.enum(["CASH", "UPI", "CARD", "OTHER"]),
  paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED"]),
  transactionReference: z.string().optional(),
});
