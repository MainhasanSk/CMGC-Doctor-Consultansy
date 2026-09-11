# CMGC_PROJECT_SPECIFICATION.md

# Chennai Medical Guidance Centre (CMGC)

## Medical Video Consultation Management System --- Complete Project Specification

**Document Version:** V1.1\
**Status:** Development Ready\
**Application Type:** Secure Multi-Tenant Web Application\
**Primary Users:** Admin, Franchise, Doctor\
**Timezone:** Asia/Kolkata (IST)\
**Currency:** INR\
**Primary Backend Infrastructure:** Firebase\
**Frontend:** Next.js + React + TypeScript + Tailwind CSS\
**File Storage:** Cloudinary\
**Video Consultation:** Google Meet, manual link in V1\
**Patient Login:** Not included in V1

------------------------------------------------------------------------

# 1. DOCUMENT PURPOSE

This document is the master functional, technical, database, security,
UI, workflow, and development specification for the CMGC Medical Video
Consultation Management System.

It is intended to be supplied to an AI coding agent or software
development team as the authoritative project specification.

The implementation must:

-   Follow the requirements in this document exactly.
-   Avoid inventing major business functionality.
-   Keep the architecture simple enough for V1.
-   Enforce authorization at the Firebase Security Rules level, not only
    in the frontend.
-   Preserve historical consultation, pricing, appointment,
    prescription, and audit information.
-   Maintain strict isolation between franchises and doctors.
-   Be responsive on desktop, tablet, and mobile.
-   Use reusable components and service-layer business logic.
-   Provide clear loading, error, empty, confirmation, and success
    states.
-   Never expose private credentials in client-side code.
-   Treat medical reports and prescriptions as sensitive information.

If a requirement is ambiguous, implement the safest and simplest
interpretation consistent with this specification rather than adding an
unrelated feature.

------------------------------------------------------------------------

# 2. PRODUCT OVERVIEW

CMGC operates a franchise-based medical video consultation service.

A patient physically visits a CMGC franchise. The franchise operator
enters the patient's details and requests a video consultation with a
doctor assigned to that franchise.

The workflow is:

**Franchise → Patient → Doctor Selection → Requested Appointment →
Doctor/Admin Review → Confirm or Reschedule → Meeting Link → 10-Minute
Join Window → Consultation → Completion → Prescription →
Revenue/Reports**

There is no separate patient account in V1.

The system replaces manual spreadsheets, WhatsApp coordination, paper
records, and fragmented appointment tracking with one centralized
application.

------------------------------------------------------------------------

# 3. V1 SCOPE

## 3.1 Included

### Authentication

-   Firebase Authentication.
-   Role-based login.
-   Admin login.
-   Franchise login.
-   Doctor login.
-   Account activation/deactivation.

### Admin

-   Dashboard.
-   Franchise management.
-   Doctor management.
-   Doctor-franchise assignments.
-   Patient management.
-   Consultation management.
-   Consultation rescheduling.
-   Google Meet link management.
-   Pricing management.
-   Payment tracking.
-   Revenue reports.
-   Prescription access.
-   Notification visibility.
-   Audit logs.
-   Account/status management.

### Franchise

-   Dashboard.
-   Assigned doctor list.
-   Doctor profile viewing.
-   Patient creation/search.
-   Patient history.
-   Consultation booking.
-   Medical report upload.
-   Consultation tracking.
-   Reschedule notifications.
-   Meeting access.
-   Prescription viewing/downloading.
-   Profile management.

### Doctor

-   Dashboard.
-   Consultation request queue.
-   Consultation confirmation.
-   Consultation rejection.
-   Consultation rescheduling while confirming.
-   Upcoming consultation list.
-   Patient information and reports.
-   Google Meet access during allowed window.
-   Consultation completion.
-   Prescription creation.
-   Prescription editing while draft.
-   Prescription finalization.
-   Prescription PDF generation/access.

### System

-   Doctor availability.
-   Double-booking prevention.
-   Historical price snapshot.
-   Appointment time snapshot/history.
-   Role-based access.
-   Franchise isolation.
-   Doctor isolation.
-   Notifications.
-   Audit logs.
-   PDF generation.
-   Cloudinary file storage.
-   CSV reporting/export where specified.

------------------------------------------------------------------------

# 4. V1 EXCLUSIONS

Do NOT implement these unless explicitly requested later:

-   Patient login.
-   Patient mobile application.
-   Automated Google Meet creation.
-   Google Meet attendance API.
-   Call recording.
-   Automatic recording storage.
-   Online payment gateway.
-   Razorpay/Stripe integration.
-   WhatsApp API.
-   SMS API.
-   AI diagnosis.
-   AI medical report interpretation.
-   AI prescription generation.
-   Pharmacy management.
-   Laboratory management.
-   Hospital management.
-   Insurance processing.
-   Automated patient WhatsApp prescription delivery.
-   Automatic doctor payout calculation unless separately specified.
-   Automatic franchise commission calculation unless separately
    specified.

------------------------------------------------------------------------

# 5. TECHNOLOGY STACK

## 5.1 Frontend

Use:

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   Responsive design

Use the current stable versions compatible with the project environment.

## 5.2 Backend Infrastructure

No separately managed Node.js/Express server is required for V1.

Firebase acts as the backend-as-a-service layer:

-   Firebase Authentication
-   Cloud Firestore
-   Firebase Security Rules

Important clarification:

This is not literally "backend-free." It means CMGC does not maintain a
custom application server in V1. Firebase provides the authentication,
database, authorization, and cloud infrastructure.

## 5.3 File Storage

Use Cloudinary for:

-   Medical reports.
-   Prescription PDFs.
-   Doctor profile photographs.

Medical files must not be exposed through uncontrolled public URLs.

Use appropriate private/signed delivery where the chosen Cloudinary
architecture supports it.

## 5.4 Video

Google Meet is used for video consultation.

V1 behavior:

-   Admin manually creates the Google Meet.
-   Admin pastes the meeting URL into CMGC.
-   System stores the URL.
-   System does not create the meeting automatically.

## 5.5 PDF

Generate professional CMGC prescription PDFs.

The PDF generator should use the same prescription data shown in the
prescription preview.

------------------------------------------------------------------------

# 6. CORE ARCHITECTURE

``` text
                        INTERNET
                           |
                           v
              NEXT.JS / REACT WEB APPLICATION
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
     Firebase Auth     Firestore        Cloudinary
          |                |                |
          +----------------+----------------+
                           |
                    CMGC APPLICATION
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
      ADMIN            FRANCHISE           DOCTOR
        |                  |                  |
        +------------------+------------------+
                           |
                           v
                     GOOGLE MEET
                    Manual V1 Link
```

------------------------------------------------------------------------

# 7. MULTI-TENANT DATA MODEL

The application is role-based and tenant-aware.

Every consultation belongs to:

-   Exactly one patient.
-   Exactly one doctor.
-   Exactly one franchise.

The consultation is the central business transaction.

Relationship:

``` text
USER
├── ADMIN
├── FRANCHISE
└── DOCTOR

FRANCHISE ──< FRANCHISE_DOCTOR >── DOCTOR

FRANCHISE ──< PATIENT

PATIENT ──< CONSULTATION >── DOCTOR

CONSULTATION ──< REPORTS
CONSULTATION ──1 PRESCRIPTION
CONSULTATION ──< PAYMENT
CONSULTATION ──< AUDIT EVENTS
```

A doctor may be assigned to multiple franchises.

A franchise may have multiple doctors.

A franchise may only see doctors currently assigned to it.

A doctor may only see consultations assigned to that doctor.

------------------------------------------------------------------------

# 8. USER ROLES AND PERMISSIONS

## 8.1 ADMIN

Admin has full system control.

Admin can:

-   Create franchise accounts.
-   Edit franchises.
-   Activate/deactivate franchises.
-   Create doctor accounts.
-   Edit doctor profiles.
-   Activate/deactivate doctors.
-   Assign doctors to franchises.
-   Remove assignments.
-   View all patients.
-   View all consultations.
-   Confirm/reschedule consultations.
-   Reject/cancel consultations where appropriate.
-   Add Google Meet links.
-   View reports.
-   View prescriptions.
-   View payments.
-   Record payments.
-   Configure consultation pricing.
-   View revenue.
-   View reports.
-   View audit logs.
-   Manage system settings.

Admin must not be blocked by franchise or doctor ownership restrictions.

## 8.2 FRANCHISE

A franchise user belongs to exactly one franchise.

Franchise can:

-   View own dashboard.
-   View active doctors assigned to its franchise.
-   View assigned doctor profiles.
-   Create/search patients.
-   View own patients.
-   Create consultations.
-   Upload medical reports.
-   View own consultation history.
-   Receive notifications.
-   See rescheduled appointment time.
-   Join a consultation during the allowed join window.
-   View/download finalized prescriptions.
-   View relevant consultation information.

Franchise cannot:

-   View other franchises.
-   Create doctors.
-   Create franchises.
-   Assign doctors.
-   Change consultation pricing.
-   Confirm doctor requests.
-   Reject doctor requests.
-   Edit finalized prescriptions.
-   Modify doctor details.
-   Modify another franchise's patient records.
-   Join another franchise's meeting.

## 8.3 DOCTOR

A doctor user belongs to exactly one doctor profile.

Doctor can:

-   View own dashboard.
-   View own consultation requests.
-   View patient details attached to own consultations.
-   View medical reports attached to own consultations.
-   Confirm consultations.
-   Reject consultations.
-   Change appointment date/time while confirming.
-   View upcoming consultations.
-   Join authorized consultations during the allowed window.
-   Mark consultation completed.
-   Create prescriptions after completion.
-   Edit draft prescriptions.
-   Finalize prescriptions.
-   View own prescription history.

Doctor cannot:

-   View other doctors' consultations.
-   Create franchises.
-   Create doctors.
-   Assign doctors.
-   Change pricing.
-   Edit finalized prescriptions.
-   Modify another doctor's consultation.
-   Access another doctor's patients unless the patient is legitimately
    attached to an authorized consultation.

------------------------------------------------------------------------

# 9. AUTHENTICATION

Use Firebase Authentication.

After login:

``` text
Firebase UID
   ↓
users/{uid}
   ↓
role
   ↓
referenceId
   ↓
role-specific dashboard
```

Redirect:

``` text
ADMIN      → /admin/dashboard
FRANCHISE  → /franchise/dashboard
DOCTOR     → /doctor/dashboard
```

Unauthenticated users:

``` text
Protected route → /login
```

Inactive users must not be allowed to use protected application
functions.

The frontend may redirect inactive users to an account-disabled screen,
but authorization must also be enforced through backend/database
security rules.

------------------------------------------------------------------------

# 10. FIRESTORE COLLECTIONS

Primary collections:

``` text
users
franchises
doctors
franchiseDoctors
patients
consultations
consultationReports
prescriptions
payments
notifications
settings
auditLogs
```

Optional supporting subcollections can be used if they simplify security
and querying, but the main business entities above should remain clearly
identifiable.

------------------------------------------------------------------------

# 11. USER SCHEMA

Collection:

``` text
users/{uid}
```

``` ts
interface User {
  uid: string;
  name: string;
  email: string;
  role: "ADMIN" | "FRANCHISE" | "DOCTOR";
  referenceId?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

`referenceId`:

-   Admin → null/omitted.
-   Franchise → franchiseId.
-   Doctor → doctorId.

The role must never be trusted merely from client-provided application
state.

------------------------------------------------------------------------

# 12. FRANCHISE SCHEMA

Collection:

``` text
franchises/{franchiseId}
```

``` ts
interface Franchise {
  franchiseId: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Deactivation must preserve historical consultations.

Do not hard-delete a franchise if historical records depend on it.

------------------------------------------------------------------------

# 13. DOCTOR SCHEMA

Collection:

``` text
doctors/{doctorId}
```

``` ts
interface Doctor {
  doctorId: string;
  userId: string;
  name: string;
  photoUrl?: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  experience?: number;
  phone: string;
  email: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Doctor registration number should be treated as professional information
and displayed where required on prescriptions.

------------------------------------------------------------------------

# 14. DOCTOR AVAILABILITY

Doctor availability must prevent bookings outside configured working
hours.

``` ts
interface TimeSlot {
  start: string;
  end: string;
}

interface DoctorAvailability {
  doctorId: string;
  timezone: "Asia/Kolkata";
  weeklySchedule: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
  };
}
```

The system must validate:

-   Doctor is active.
-   Doctor is assigned to franchise.
-   Requested appointment is in the future.
-   Requested appointment is within availability.
-   Requested appointment does not overlap another blocking
    consultation.

If business rules later allow admin override, it should be an explicit
admin action rather than silently bypassing availability.

------------------------------------------------------------------------

# 15. FRANCHISE-DOCTOR ASSIGNMENT

Collection:

``` text
franchiseDoctors/{assignmentId}
```

``` ts
interface FranchiseDoctor {
  assignmentId: string;
  franchiseId: string;
  doctorId: string;
  status: "ACTIVE" | "INACTIVE";
  assignedAt: Timestamp;
  assignedBy: string;
}
```

Only Admin can create, modify, activate, deactivate, or remove
assignments.

A franchise doctor selector must query only active assignments for that
franchise.

A deactivated assignment must not affect historical consultations.

------------------------------------------------------------------------

# 16. PATIENT MANAGEMENT

Patients do not have accounts in V1.

Collection:

``` text
patients/{patientId}
```

``` ts
interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  address: string;
  createdByFranchiseId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Patient Search

Preferred search key:

-   Phone number.

Secondary:

-   Name.

When a franchise enters a phone number:

1.  Search for an existing patient accessible to that franchise.
2.  If found, allow selecting the patient.
3.  If not found, create a new patient.

Patient records must never be exposed across franchise boundaries.

------------------------------------------------------------------------

# 17. CONSULTATION --- CENTRAL ENTITY

Collection:

``` text
consultations/{consultationId}
```

Recommended schema:

``` ts
interface Consultation {
  consultationId: string;

  patientId: string;
  patientNameSnapshot: string;
  patientAgeSnapshot: number;
  patientAddressSnapshot: string;

  doctorId: string;
  franchiseId: string;

  disease: string;
  diseaseDescription: string;
  extraMessage?: string;

  requestedDate: string;
  requestedTime: string;
  requestedStartDateTime: Timestamp;
  requestedEndDateTime: Timestamp;

  consultationDate: string;
  consultationTime: string;
  startDateTime: Timestamp;
  endDateTime: Timestamp;

  consultationFee: number;
  currency: "INR";

  status:
    | "PENDING"
    | "CONFIRMED"
    | "MEETING_ADDED"
    | "READY_TO_JOIN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED"
    | "NO_SHOW";

  rescheduled: boolean;
  rescheduledAt?: Timestamp;
  rescheduledBy?: string;
  rescheduledByRole?: "ADMIN" | "DOCTOR";
  rescheduleReason?: string;

  meetLink?: string;
  meetAddedAt?: Timestamp;
  meetAddedBy?: string;

  createdAt: Timestamp;
  createdBy: string;

  confirmedAt?: Timestamp;
  confirmedBy?: string;

  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;

  completedAt?: Timestamp;
  completedBy?: string;

  cancelledAt?: Timestamp;
  cancelledBy?: string;
  cancellationReason?: string;
}
```

------------------------------------------------------------------------

# 18. WHY REQUESTED AND CONFIRMED TIME ARE BOTH STORED

This is a critical requirement.

A franchise requests a preferred time, but the doctor or admin can
confirm the consultation at a different time.

Therefore:

### Requested appointment

``` text
requestedDate
requestedTime
requestedStartDateTime
requestedEndDateTime
```

represents what the franchise originally requested.

### Actual appointment

``` text
consultationDate
consultationTime
startDateTime
endDateTime
```

represents the currently confirmed appointment.

Never overwrite the original requested time.

This preserves a complete appointment history.

Example:

``` text
Original requested time:
10 September 2026, 5:00 PM

Final confirmed time:
10 September 2026, 6:00 PM
```

The system should display both in appropriate admin/audit views.

------------------------------------------------------------------------

# 19. CONSULTATION BOOKING FORM

Franchise route:

``` text
/franchise/consultations/new
```

Use a guided multi-step form.

## Step 1 --- Patient

Fields:

-   Existing patient search.
-   New patient option.
-   Patient name.
-   Age.
-   Gender.
-   Phone.
-   Address.

## Step 2 --- Medical Information

Fields:

-   Disease / Medical Problem.
-   Disease Description.
-   Extra Message.

## Step 3 --- Medical Reports

Upload:

-   PDF.
-   JPG.
-   JPEG.
-   PNG.

Multiple files allowed.

Recommended maximum:

-   10 MB per file.

## Step 4 --- Doctor

Show only:

-   Active doctors.
-   Doctors assigned to the current franchise.

Doctor card/selector:

-   Photo.
-   Name.
-   Qualification.
-   Specialization.
-   Experience.

## Step 5 --- Requested Date and Time

Franchise selects:

-   Consultation date.
-   Preferred consultation time.

System validates:

-   Future appointment.
-   Doctor availability.
-   No overlapping consultation.
-   Doctor is active.
-   Assignment is active.

## Step 6 --- Review

Show:

-   Patient.
-   Medical problem.
-   Reports.
-   Doctor.
-   Requested time.
-   Current consultation fee.

## Step 7 --- Confirm Booking

After submission:

-   Create consultation.
-   Snapshot current fee.
-   Store requested appointment time.
-   Initially set actual appointment time equal to requested time.
-   Status = PENDING.
-   Create notification for doctor.
-   Create notification for admin.
-   Create audit log.

------------------------------------------------------------------------

# 20. CONSULTATION PRICING

Collection:

``` text
settings/pricing
```

``` ts
interface PricingSettings {
  videoConsultationFee: number;
  currency: "INR";
  updatedAt: Timestamp;
  updatedBy: string;
}
```

Only Admin can change the consultation fee.

## Price Snapshot

When a consultation is created:

``` text
current pricing fee
        ↓
consultation.consultationFee
```

The consultation fee must never dynamically reference the current
pricing setting after booking.

Example:

``` text
January consultation = ₹500
February price changes = ₹600
January consultation remains ₹500
```

This is mandatory for historical revenue accuracy.

------------------------------------------------------------------------

# 21. DOUBLE-BOOKING PREVENTION

The system must prevent overlapping doctor consultations.

Blocking statuses:

``` text
PENDING
CONFIRMED
MEETING_ADDED
READY_TO_JOIN
IN_PROGRESS
```

Non-blocking statuses:

``` text
REJECTED
CANCELLED
```

`NO_SHOW` should be treated as non-booking for future scheduling after
the appointment has ended.

Use interval overlap logic:

``` text
newStart < existingEnd
AND
newEnd > existingStart
```

Do not rely only on matching start times.

Double-booking checks must happen when:

-   Franchise requests a consultation.
-   Doctor reschedules.
-   Admin reschedules.
-   Any appointment time is changed.

------------------------------------------------------------------------

# 22. NEW RESCHEDULING REQUIREMENT

## 22.1 Core Rule

When a Franchise requests a consultation, the requested time is not
necessarily final.

**Admin or Doctor can change the consultation date/time while confirming
the consultation.**

The action should be explicitly named:

**Confirm & Reschedule**

or:

**Confirm at New Time**

The system must not silently edit the appointment time.

------------------------------------------------------------------------

# 23. RESCHEDULING WORKFLOW

``` text
FRANCHISE
   |
   | Request: 5:00 PM
   v
PENDING
   |
   +----------------------------+
   |                            |
   v                            v
Confirm at 5 PM          Confirm & Reschedule
   |                            |
   v                            v
CONFIRMED                  Validate New Time
                                |
                                v
                           Save New Time
                                |
                                v
                             CONFIRMED
                                |
                                v
                      Notify Franchise
```

------------------------------------------------------------------------

# 24. WHO CAN RESCHEDULE

Both:

-   Admin.
-   Doctor assigned to the consultation.

can reschedule while confirming.

## Doctor

Doctor can only reschedule consultations where:

``` text
consultation.doctorId == currentDoctorId
```

and:

``` text
status == PENDING
```

## Admin

Admin can reschedule any valid pending consultation.

------------------------------------------------------------------------

# 25. RESCHEDULING UI

Doctor request detail page:

``` text
Patient
Medical Information
Reports
Franchise
Requested Date
Requested Time

[ Reject ]
[ Confirm at Requested Time ]
[ Confirm & Reschedule ]
```

When clicking **Confirm & Reschedule**, open a dialog:

``` text
Reschedule Consultation

Requested Time
10 September 2026
5:00 PM

New Date
[ 10 September 2026 ]

New Time
[ 6:00 PM ]

Reason (Optional)
[ Doctor schedule conflict ]

[ Cancel ]
[ Confirm & Reschedule ]
```

The system must validate the new appointment before saving.

------------------------------------------------------------------------

# 26. RESCHEDULING VALIDATION

New time must:

-   Be in the future.
-   Be within doctor availability.
-   Not overlap another blocking consultation.
-   Belong to the same doctor.
-   Preserve the same franchise.
-   Preserve the same patient.
-   Preserve the consultation fee.
-   Be a valid date/time.

If invalid:

``` text
This doctor already has another consultation during the selected time.
```

or:

``` text
The selected time is outside the doctor's availability.
```

Do not save invalid appointments.

------------------------------------------------------------------------

# 27. RESCHEDULING DATA UPDATE

Example:

``` text
requestedDate = 2026-09-10
requestedTime = 17:00

consultationDate = 2026-09-10
consultationTime = 18:00

rescheduled = true
rescheduledAt = current server timestamp
rescheduledBy = doctor/admin user ID
rescheduledByRole = DOCTOR or ADMIN
rescheduleReason = optional
```

The requested time remains unchanged.

------------------------------------------------------------------------

# 28. FRANCHISE RESCHEDULE NOTIFICATION

When Admin or Doctor confirms at a different time, create a notification
for the Franchise.

Example notification:

**Title:** \> Your Video Consultation has been Rescheduled

**Message:** \> Your Video Consultation with Dr. Amit Sharma has been
rescheduled to 10 September 2026 at 6:00 PM.

The notification must show the new time clearly.

Recommended expanded notification:

``` text
Your Video Consultation has been Rescheduled

Doctor:
Dr. Amit Sharma

New Date:
10 September 2026

New Time:
6:00 PM

Previous Requested Time:
5:00 PM
```

The franchise should see the notification in:

``` text
/franchise/dashboard
```

and in the notification panel.

------------------------------------------------------------------------

# 29. NOTIFICATION TYPES

Suggested types:

``` text
NEW_CONSULTATION
CONSULTATION_CONFIRMED
CONSULTATION_RESCHEDULED
CONSULTATION_REJECTED
MEETING_ADDED
CONSULTATION_READY
CONSULTATION_COMPLETED
PRESCRIPTION_FINALIZED
PAYMENT_RECORDED
```

Schema:

``` ts
interface Notification {
  notificationId: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  consultationId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

------------------------------------------------------------------------

# 30. CONFIRMATION WITHOUT RESCHEDULING

If Doctor/Admin confirms the originally requested time:

``` text
requested time = actual time
rescheduled = false
status = CONFIRMED
```

Create normal confirmation notification.

Example:

> Your video consultation with Dr. Amit Sharma has been confirmed for 10
> September 2026 at 5:00 PM.

------------------------------------------------------------------------

# 31. CONFIRMATION WITH RESCHEDULING

If Doctor/Admin changes the time:

``` text
requested time = original
actual time = new confirmed time
rescheduled = true
status = CONFIRMED
```

Create `CONSULTATION_RESCHEDULED` notification.

------------------------------------------------------------------------

# 32. REJECTION

Doctor can reject a pending consultation.

Optional reason:

``` text
rejectionReason
```

Update:

``` text
status = REJECTED
rejectedAt = server timestamp
rejectedBy = doctor UID
```

Notify:

-   Admin.
-   Franchise.

No meeting can be added after rejection.

------------------------------------------------------------------------

# 33. CANCELLATION

Cancellation should be supported for appropriate statuses.

Recommended allowed cancellation statuses:

``` text
PENDING
CONFIRMED
MEETING_ADDED
```

Store:

``` text
status = CANCELLED
cancelledAt
cancelledBy
cancellationReason
```

Hide meeting access.

Do not allow prescription creation.

Historical records remain.

------------------------------------------------------------------------

# 34. CONSULTATION STATUS MACHINE

Normal flow:

``` text
PENDING
   ↓
CONFIRMED
   ↓
MEETING_ADDED
   ↓
READY_TO_JOIN
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

Alternative:

``` text
PENDING → REJECTED
PENDING → CANCELLED
CONFIRMED → CANCELLED
MEETING_ADDED → CANCELLED
```

Rescheduling does not require a separate permanent status.

Instead:

``` text
PENDING
   ↓
Confirm & Reschedule
   ↓
CONFIRMED
```

with:

``` text
rescheduled = true
```

------------------------------------------------------------------------

# 35. READY_TO_JOIN STATE

The `READY_TO_JOIN` status represents the 10-minute join window.

Prefer deriving join eligibility from:

``` text
startDateTime - 10 minutes
```

rather than requiring a client to write a scheduled status at exactly 10
minutes.

The UI can display `READY_TO_JOIN` when the current time falls inside
the window.

This avoids needing a scheduled server job solely to update the status.

------------------------------------------------------------------------

# 36. GOOGLE MEET V1

No automatic Google Meet creation.

Admin workflow:

1.  Doctor confirms consultation.
2.  Admin opens consultation.
3.  Admin creates Google Meet manually.
4.  Admin copies Meet URL.
5.  Admin pastes URL into CMGC.
6.  Admin saves.
7.  System records:
    -   Meet URL.
    -   Time added.
    -   Admin UID.
8.  Status becomes `MEETING_ADDED`.

Schema fields:

``` text
meetLink
meetAddedAt
meetAddedBy
```

Validate URL format.

Prefer HTTPS.

Optionally restrict accepted host to Google Meet domains if business
rules require it.

The system does not verify:

-   Whether meeting exists.
-   Attendance.
-   Actual duration.
-   Recording.
-   Participant list.

------------------------------------------------------------------------

# 37. TEN-MINUTE MEETING VISIBILITY RULE

The meeting link must be hidden before the consultation's 10-minute
window.

Formula:

``` text
joinStart = startDateTime - 10 minutes
```

Eligibility:

``` text
meetLink exists
AND
current time >= joinStart
AND
current time <= endDateTime
AND
status is not REJECTED
AND
status is not CANCELLED
AND
current user is authorized
```

Example:

``` text
Consultation:
5:00 PM

Join opens:
4:50 PM

Join closes:
5:30 PM
```

Before 4:50 PM:

``` text
Meeting available in 22 minutes
```

At 4:50 PM:

``` text
[ Join Consultation ]
```

After 5:30 PM:

``` text
Consultation Ended
```

The displayed time must use Asia/Kolkata.

------------------------------------------------------------------------

# 38. JOIN ACCESS SECURITY

The frontend hiding the link is not sufficient security.

Firestore rules must prevent unauthorized users from reading
consultation data containing the Meet link.

Only:

-   Authorized franchise for the consultation.
-   Assigned doctor for the consultation.
-   Admin.

may access the consultation.

The application should additionally enforce the 10-minute join condition
before rendering/opening the meeting.

------------------------------------------------------------------------

# 39. CONSULTATION COMPLETION

Only the assigned doctor should mark the consultation completed.

Doctor clicks:

**Mark Consultation Completed**

Validation:

-   Doctor owns consultation.
-   Consultation is not cancelled/rejected.
-   Appointment is active.
-   Appropriate appointment lifecycle condition is met.

Update:

``` text
status = COMPLETED
completedAt = server timestamp
completedBy = doctor UID
```

Notify:

-   Franchise.
-   Admin.

Enable prescription creation.

------------------------------------------------------------------------

# 40. MEDICAL REPORTS

Collection:

``` text
consultationReports/{reportId}
```

``` ts
interface ConsultationReport {
  reportId: string;
  consultationId: string;
  patientId: string;
  franchiseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryPublicId: string;
  secureUrl?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}
```

Allowed:

-   PDF.
-   JPG.
-   JPEG.
-   PNG.

Recommended file limit:

``` text
10 MB per file
```

Multiple reports per consultation are allowed.

------------------------------------------------------------------------

# 41. REPORT UPLOAD WORKFLOW

``` text
Franchise selects file
        ↓
Client validation
        ↓
File type validation
        ↓
File size validation
        ↓
Cloudinary upload
        ↓
Receive secure metadata
        ↓
Create Firestore report metadata
        ↓
Display uploaded report
```

If Firestore metadata creation fails after upload, the implementation
should have an error/retry strategy to avoid orphaned files.

Do not put Cloudinary secret credentials in public browser code.

------------------------------------------------------------------------

# 42. REPORT ACCESS

Admin:

-   All authorized reports.

Franchise:

-   Reports belonging to its franchise consultations.

Doctor:

-   Reports belonging to consultations assigned to that doctor.

No cross-franchise or cross-doctor access.

------------------------------------------------------------------------

# 43. PRESCRIPTION

Prescription can only be created after:

``` text
consultation.status == COMPLETED
```

Collection:

``` text
prescriptions/{prescriptionId}
```

``` ts
interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  prescriptionId: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  franchiseId: string;

  patientNameSnapshot: string;
  patientAgeSnapshot: number;
  patientAddressSnapshot: string;

  doctorNameSnapshot: string;
  doctorQualificationSnapshot: string;
  doctorSpecializationSnapshot: string;
  doctorRegistrationSnapshot: string;

  diagnosis: string;
  medicines: Medicine[];

  investigations?: string;
  advice?: string;

  followUpRequired: boolean;
  followUpDate?: string;

  status: "DRAFT" | "FINALIZED";

  pdfUrl?: string;
  pdfPublicId?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  finalizedAt?: Timestamp;
}
```

------------------------------------------------------------------------

# 44. PRESCRIPTION AUTO-FILLED DATA

Automatically populate:

### Patient

-   Name.
-   Age.
-   Address.

### Consultation

-   Consultation ID.
-   Consultation date.

### Doctor

-   Name.
-   Qualification.
-   Specialization.
-   Registration number.

### Branding

-   CMGC logo.
-   Chennai Medical Guidance Centre.
-   Medical Video Consultation.

The doctor should not need to manually re-enter these details.

Snapshot doctor data into the prescription to preserve historical
accuracy.

------------------------------------------------------------------------

# 45. DOCTOR PRESCRIPTION FORM

Fields:

## Diagnosis

Required.

## Medicines

Multiple medicine rows.

Each row:

-   Medicine name.
-   Dosage.
-   Frequency.
-   Duration.
-   Instructions.

Actions:

``` text
+ Add Medicine
Remove
```

At least one medicine is not necessarily mandatory unless CMGC business
rules require it.

## Investigations

Optional.

## Advice

Optional.

## Follow-up

-   Follow-up required: Yes/No.
-   Follow-up date if required.

------------------------------------------------------------------------

# 46. PRESCRIPTION DRAFT AND FINALIZATION

Lifecycle:

``` text
COMPLETED CONSULTATION
        ↓
CREATE PRESCRIPTION
        ↓
DRAFT
        ↓
Doctor edits
        ↓
FINALIZE
        ↓
FINALIZED
        ↓
Generate/store PDF
```

Doctor may edit only `DRAFT`.

Once `FINALIZED`:

-   Doctor cannot silently edit.
-   Franchise cannot edit.
-   Admin should not silently edit.
-   Historical prescription remains immutable.

If corrections are required later, use a version/revision mechanism
rather than overwriting the finalized prescription.

------------------------------------------------------------------------

# 47. PRESCRIPTION PDF

The PDF must look professional and trustworthy.

Include:

``` text
CMGC LOGO

CHENNAI MEDICAL GUIDANCE CENTRE
Medical Video Consultation

Doctor:
Dr. [Name]

Qualification:
[Qualification]

Specialization:
[Specialization]

Registration No:
[Registration]

Patient:
[Name]

Age:
[Age]

Address:
[Address]

Consultation ID:
[ID]

Consultation Date:
[Date]

Diagnosis:
[Diagnosis]

Medicines:
1. Medicine
   Dosage
   Frequency
   Duration
   Instructions

Investigations:
[...]

Advice:
[...]

Follow-up:
[...]

Doctor Signature Area

CMGC Contact Information
```

Filename:

``` text
CMGC_Prescription_{consultationId}.pdf
```

Store the PDF in Cloudinary and save the URL/public ID in Firestore.

CMGC should verify any medical/legal prescription requirements before
production use.

The system is a management and documentation system and does not
independently diagnose patients.

------------------------------------------------------------------------

# 48. PAYMENTS

V1 uses manual payment tracking.

Collection:

``` text
payments/{paymentId}
```

``` ts
interface Payment {
  paymentId: string;
  consultationId: string;
  patientId: string;
  franchiseId: string;
  amount: number;
  currency: "INR";
  paymentMethod: "CASH" | "UPI" | "CARD" | "OTHER";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  transactionReference?: string;
  paidAt?: Timestamp;
  recordedBy?: string;
  createdAt: Timestamp;
}
```

No online payment gateway in V1.

------------------------------------------------------------------------

# 49. REVENUE

At minimum, admin dashboard should calculate:

``` text
Gross Revenue =
SUM(consultationFee for completed consultations)
```

However, if CMGC later requires actual CMGC share versus franchise
share, add explicit financial fields rather than guessing.

Possible future fields:

``` text
doctorShare
franchiseShare
cmgcShare
```

Do not implement commission logic without business approval.

Monthly revenue must use the consultation's historical
`consultationFee`.

------------------------------------------------------------------------

# 50. ADMIN DASHBOARD

Route:

``` text
/admin/dashboard
```

Cards:

-   Total Doctors.
-   Total Franchises.
-   Total Patients.
-   Total Consultations.
-   Today's Consultations.
-   Pending Requests.
-   Confirmed Consultations.
-   Completed Consultations.
-   Cancelled Consultations.
-   Current Consultation Fee.
-   Monthly Revenue.

Include:

-   Upcoming consultations.
-   Pending doctor requests.
-   Recent activity.
-   Rescheduled consultations.
-   Recent prescriptions.

------------------------------------------------------------------------

# 51. ADMIN CONSULTATION LIST

Route:

``` text
/admin/consultations
```

Columns:

-   Consultation ID.
-   Patient.
-   Doctor.
-   Franchise.
-   Requested date/time.
-   Confirmed date/time.
-   Fee.
-   Status.
-   Rescheduled.
-   Meet.
-   Prescription.
-   Actions.

Filters:

-   Date from.
-   Date to.
-   Doctor.
-   Franchise.
-   Status.
-   Patient.
-   Consultation ID.
-   Rescheduled yes/no.

Use pagination.

Do not load thousands of records at once.

------------------------------------------------------------------------

# 52. ADMIN CONSULTATION DETAIL

Route:

``` text
/admin/consultations/{id}
```

Sections:

1.  Consultation summary.
2.  Patient.
3.  Doctor.
4.  Franchise.
5.  Medical information.
6.  Medical reports.
7.  Requested appointment.
8.  Confirmed appointment.
9.  Reschedule history.
10. Google Meet.
11. Payment.
12. Prescription.
13. Audit history.

Admin must clearly see if an appointment was rescheduled.

------------------------------------------------------------------------

# 53. ADMIN FRANCHISE MANAGEMENT

Routes:

``` text
/admin/franchises
/admin/franchises/new
/admin/franchises/{id}
```

Features:

-   Create.
-   Edit.
-   Activate.
-   Deactivate.
-   View details.
-   View assigned doctors.
-   View consultations.
-   View historical activity.
-   View revenue-related records.

------------------------------------------------------------------------

# 54. ADMIN DOCTOR MANAGEMENT

Routes:

``` text
/admin/doctors
/admin/doctors/new
/admin/doctors/{id}
```

Features:

-   Create doctor.
-   Create/login account.
-   Edit profile.
-   Activate/deactivate.
-   Configure availability.
-   View assigned franchises.
-   View consultation history.
-   View performance.
-   View prescriptions.

------------------------------------------------------------------------

# 55. ASSIGNMENT MANAGEMENT

Route:

``` text
/admin/assignments
```

Admin can:

-   Assign doctor to franchise.
-   Remove/deactivate assignment.
-   Search by doctor.
-   Search by franchise.
-   View active assignments.

Avoid duplicate active assignments.

------------------------------------------------------------------------

# 56. ADMIN PRICING

Route:

``` text
/admin/pricing
```

Display:

-   Current fee.
-   Currency.
-   Last updated.
-   Updated by.

Admin can edit the fee.

Every new consultation snapshots the current fee.

------------------------------------------------------------------------

# 57. FRANCHISE DASHBOARD

Route:

``` text
/franchise/dashboard
```

Cards:

-   Today's Consultations.
-   Pending Requests.
-   Confirmed.
-   Upcoming.
-   Completed.
-   Total Consultations.

Also show:

-   Recent notifications.
-   Rescheduled consultations.
-   Upcoming consultation countdowns.

------------------------------------------------------------------------

# 58. FRANCHISE DOCTOR LIST

Route:

``` text
/franchise/doctors
```

Only active assigned doctors.

Doctor card:

-   Photo.
-   Name.
-   Qualification.
-   Specialization.
-   Experience.
-   View profile.
-   Book consultation.

Never show doctors belonging exclusively to other franchises.

------------------------------------------------------------------------

# 59. FRANCHISE PATIENT MANAGEMENT

Routes:

``` text
/franchise/patients
/franchise/patients/new
/franchise/patients/{id}
```

Features:

-   Search.
-   Create.
-   View.
-   Consultation history.
-   Reports through authorized consultations.
-   Prescription history through authorized consultations.

------------------------------------------------------------------------

# 60. FRANCHISE CONSULTATION HISTORY

Route:

``` text
/franchise/consultations
```

Columns:

-   Consultation ID.
-   Patient.
-   Doctor.
-   Requested time.
-   Confirmed time.
-   Status.
-   Rescheduled.
-   Meeting.
-   Prescription.

If rescheduled:

``` text
Requested:
5:00 PM

Confirmed:
6:00 PM
```

Make the new time visually clear.

------------------------------------------------------------------------

# 61. FRANCHISE NOTIFICATION CENTER

Include a notification icon in the franchise header.

Unread count:

``` text
Unread Notifications
```

Reschedule notification must be prominent.

Example:

``` text
Your Video Consultation has been Rescheduled

Dr. Amit Sharma

New Time:
10 September 2026, 6:00 PM
```

Clicking the notification should open the relevant consultation.

------------------------------------------------------------------------

# 62. DOCTOR DASHBOARD

Route:

``` text
/doctor/dashboard
```

Cards:

-   New Requests.
-   Today's Consultations.
-   Upcoming.
-   Completed.
-   Total.

Also show:

-   Pending requests.
-   Upcoming appointments.
-   Recent completed consultations.
-   Prescription tasks.

------------------------------------------------------------------------

# 63. DOCTOR REQUESTS

Route:

``` text
/doctor/requests
```

Show:

-   Patient.
-   Age.
-   Gender.
-   Disease.
-   Disease description.
-   Reports.
-   Franchise.
-   Requested date/time.
-   Current proposed time.
-   Actions.

Actions:

``` text
Confirm
Confirm & Reschedule
Reject
```

------------------------------------------------------------------------

# 64. DOCTOR UPCOMING

Route:

``` text
/doctor/upcoming
```

Show:

-   Patient.
-   Franchise.
-   Appointment date/time.
-   Status.
-   Meeting availability.

Before 10-minute window:

``` text
Meeting available in X minutes
```

Within window:

``` text
Join Consultation
```

After end:

``` text
Consultation Ended
```

------------------------------------------------------------------------

# 65. DOCTOR PATIENT VIEW

Route:

``` text
/doctor/patients/{patientId}
```

Only accessible if patient is associated with an authorized doctor
consultation.

Show:

-   Name.
-   Age.
-   Gender.
-   Address.
-   Relevant consultation history.
-   Medical reports.
-   Previous prescriptions where authorized.

Do not expose unrelated franchise patient data.

------------------------------------------------------------------------

# 66. NOTIFICATION EVENTS

## New consultation

Recipients:

-   Assigned doctor.
-   Admin.

## Doctor confirms

Recipients:

-   Admin.
-   Franchise.

## Doctor/Admin reschedules

Recipients:

-   Franchise.
-   Admin if doctor performed the reschedule.

## Doctor rejects

Recipients:

-   Franchise.
-   Admin.

## Admin adds meeting

Recipients:

-   Doctor.
-   Franchise.

## Consultation enters join window

Optional in-app readiness indicator; do not require a scheduled
notification job.

## Consultation completed

Recipients:

-   Franchise.
-   Admin.

## Prescription finalized

Recipients:

-   Franchise.
-   Admin.

------------------------------------------------------------------------

# 67. AUDIT LOGS

Collection:

``` text
auditLogs/{logId}
```

``` ts
interface AuditLog {
  logId: string;
  userId: string;
  role: "ADMIN" | "FRANCHISE" | "DOCTOR";
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  timestamp: Timestamp;
}
```

Important actions:

-   Login.
-   Create franchise.
-   Update franchise.
-   Deactivate franchise.
-   Create doctor.
-   Update doctor.
-   Deactivate doctor.
-   Assign doctor.
-   Remove assignment.
-   Create patient.
-   Create consultation.
-   Confirm consultation.
-   Reschedule consultation.
-   Reject consultation.
-   Cancel consultation.
-   Add meeting.
-   Complete consultation.
-   Create prescription.
-   Finalize prescription.
-   Record payment.
-   Change pricing.

Audit records must include who performed the action and when.

------------------------------------------------------------------------

# 68. SECURITY ARCHITECTURE

Security is a first-class requirement.

Do not rely on:

``` text
if (role === ADMIN) ...
```

in the UI as the only protection.

Use Firebase Security Rules.

## Admin

Authenticated user whose user profile role is ADMIN can access
system-wide data according to rules.

## Franchise

Access only when:

``` text
currentUser.referenceId == resource.data.franchiseId
```

or equivalent ownership relationship.

## Doctor

Access only when:

``` text
currentUser.referenceId == resource.data.doctorId
```

For reports and prescriptions, authorization should be derived from the
parent consultation/entity ownership.

------------------------------------------------------------------------

# 69. FIREBASE SECURITY RULE PRINCIPLES

Rules should provide helper functions such as:

``` text
isAuthenticated()
isAdmin()
isFranchise()
isDoctor()
currentFranchiseId()
currentDoctorId()
```

Do not trust arbitrary client-supplied:

-   role.
-   franchiseId.
-   doctorId.

Where possible, validate against the authenticated user's authoritative
`users/{uid}` record.

Rules should prevent:

-   Franchise A reading Franchise B.
-   Doctor A reading Doctor B.
-   Franchise changing prescription.
-   Doctor changing pricing.
-   Doctor modifying another doctor's consultation.
-   Unauthorized meeting access.
-   Unauthorized report access.
-   Unauthorized payment modification.

------------------------------------------------------------------------

# 70. PRIVILEGED OPERATIONS

Because V1 intentionally avoids a custom backend, client-side Firebase
services may perform many operations under Firestore rules.

If a future requirement requires stronger server-side guarantees,
introduce Firebase Cloud Functions for privileged operations such as:

-   Signed Cloudinary operations.
-   PDF generation.
-   Scheduled jobs.
-   Complex transactional workflows.
-   Server-only integrations.

Do not add Cloud Functions merely for architectural fashion.

------------------------------------------------------------------------

# 71. CLOUDINARY SECURITY

Do not expose:

-   Cloudinary API secret.
-   Firebase service account key.
-   Private signing credentials.

in the browser.

Public environment variables may contain only genuinely public
configuration.

Medical report and prescription delivery should use private/signed
access where required by the storage architecture.

------------------------------------------------------------------------

# 72. ROUTE PROTECTION

Routes:

``` text
/admin/*
    ADMIN only

/franchise/*
    FRANCHISE only

/doctor/*
    DOCTOR only
```

Unauthorized role:

``` text
403 / Access Denied
```

Unauthenticated:

``` text
/login
```

Do not rely only on hiding navigation links.

------------------------------------------------------------------------

# 73. DATA VALIDATION

Use centralized schema validation, preferably Zod.

## Patient

-   Name required.
-   Age positive.
-   Phone valid.
-   Address required.
-   Gender valid.

## Consultation

-   Doctor required.
-   Disease required.
-   Disease description required.
-   Date required.
-   Time required.
-   Fee positive.
-   Doctor assignment valid.
-   Availability valid.

## Reschedule

-   New date required.
-   New time required.
-   Future date/time.
-   Doctor availability.
-   No overlap.

## Prescription

-   Diagnosis required.
-   Medicine fields required if medicine row exists.
-   Follow-up date required if follow-up is enabled.

Validation must exist both:

-   In frontend UX.
-   In authorization/data integrity mechanisms.

------------------------------------------------------------------------

# 74. TRANSACTIONS AND DUPLICATE PREVENTION

Use Firestore transactions or batched writes where appropriate.

Critical operations:

-   Consultation creation.
-   Price snapshot.
-   Doctor confirmation.
-   Doctor/admin rescheduling.
-   Prescription finalization.
-   Payment recording.

Prevent duplicate submissions by:

-   Disabling buttons during processing.
-   Using transaction/idempotency strategies where appropriate.
-   Checking existing state before applying transitions.

Example:

If two clicks occur on:

``` text
Confirm & Reschedule
```

the system must not create two consultations or corrupt appointment
state.

------------------------------------------------------------------------

# 75. DATE AND TIME

Use:

``` text
Asia/Kolkata
```

for application display and business scheduling.

Store timestamps using Firebase Timestamp.

Avoid storing local time as the only source of truth.

Recommended:

``` text
startDateTime: Timestamp
endDateTime: Timestamp
```

and display:

``` text
10 Sep 2026, 6:00 PM
```

using Asia/Kolkata.

------------------------------------------------------------------------

# 76. CONSULTATION DURATION

Default V1 duration:

``` text
30 minutes
```

Therefore:

``` text
endDateTime = startDateTime + 30 minutes
```

The duration should be centralized in configuration rather than
duplicated throughout components.

------------------------------------------------------------------------

# 77. JOIN WINDOW

``` text
joinStart = startDateTime - 10 minutes
joinEnd = endDateTime
```

For a 6:00 PM consultation:

``` text
Join opens: 5:50 PM
Consultation ends: 6:30 PM
```

If appointment is rescheduled to 7:00 PM:

``` text
Join opens: 6:50 PM
Ends: 7:30 PM
```

The join window always uses the current confirmed appointment time.

------------------------------------------------------------------------

# 78. RESCHEDULING AND MEETING LINK

If an appointment is rescheduled before a Meet link is added:

-   Save the new time.
-   No special meeting update is needed.
-   Admin later adds the Meet link.

If an appointment is already associated with a Meet link and is
subsequently rescheduled under an allowed admin workflow:

-   The system must make the changed appointment time clear.
-   The administrator must verify whether the existing Meet link remains
    valid for the new appointment.
-   V1 does not automatically modify the Google Meet.
-   Audit the change.

For simplicity, doctor rescheduling should normally occur while the
consultation is `PENDING`, before a meeting is added.

------------------------------------------------------------------------

# 79. SEARCH AND FILTERING

All large tables must support:

-   Search.
-   Pagination.
-   Sorting.
-   Filtering.
-   Date range.

Never load the entire collection to the browser for large datasets.

Examples:

``` text
Consultations by franchise
Consultations by doctor
Consultations by status
Consultations by date
Notifications by user
Patients by franchise
```

Create Firestore indexes based on actual queries.

------------------------------------------------------------------------

# 80. RECOMMENDED FIRESTORE INDEXES

Likely indexes:

``` text
consultations:
  franchiseId + status + startDateTime

consultations:
  doctorId + status + startDateTime

consultations:
  franchiseId + consultationDate

consultations:
  doctorId + consultationDate

consultations:
  status + consultationDate

notifications:
  recipientUserId + isRead + createdAt
```

The exact Firebase-generated index requirements should be checked during
development.

Do not create unnecessary indexes for every field.

------------------------------------------------------------------------

# 81. UI DESIGN

Visual direction:

-   Professional.
-   Clean.
-   Healthcare-oriented.
-   Trustworthy.
-   Minimal.
-   Clear typography.
-   Good whitespace.
-   Accessible forms.
-   Responsive.
-   Avoid excessive animation.
-   Avoid excessive colors.
-   Avoid distracting popups.

Admin:

-   Desktop-first.

Franchise:

-   Desktop and mobile responsive.

Doctor:

-   Desktop and mobile responsive.

------------------------------------------------------------------------

# 82. LAYOUTS

## Admin

Sidebar:

``` text
Dashboard
Consultations
Patients
Doctors
Franchises
Assignments
Pricing
Payments
Reports
Settings
```

## Franchise

``` text
Dashboard
Doctors
Patients
New Consultation
Consultations
Prescriptions
Profile
```

## Doctor

``` text
Dashboard
Requests
Upcoming
Completed
Patients
Prescriptions
Profile
```

Header:

-   User name.
-   Role.
-   Notifications.
-   Logout.

------------------------------------------------------------------------

# 83. REUSABLE COMPONENTS

## Layout

``` text
AdminSidebar
FranchiseSidebar
DoctorSidebar
Header
UserMenu
```

## Dashboard

``` text
StatCard
RevenueCard
ConsultationCard
ActivityList
```

## Doctor

``` text
DoctorCard
DoctorProfile
DoctorSelector
AvailabilityEditor
```

## Franchise

``` text
FranchiseCard
FranchiseSelector
```

## Patient

``` text
PatientForm
PatientCard
PatientSearch
PatientHistory
```

## Consultation

``` text
ConsultationForm
ConsultationCard
ConsultationStatus
ConsultationDetails
AppointmentTimeCard
RescheduleDialog
MeetingButton
CountdownTimer
```

## Prescription

``` text
PrescriptionForm
MedicineRow
PrescriptionPreview
PrescriptionDownload
```

## Reports

``` text
ReportUploader
ReportViewer
ReportList
```

## Common

``` text
Modal
Table
Pagination
Search
Filter
DatePicker
TimePicker
Toast
ConfirmationDialog
EmptyState
LoadingState
ErrorState
```

------------------------------------------------------------------------

# 84. CONSULTATION TIME UI

Always distinguish:

``` text
Requested Time
Confirmed Time
```

If not rescheduled:

``` text
Appointment:
10 Sep 2026, 5:00 PM
```

If rescheduled:

``` text
Requested:
10 Sep 2026, 5:00 PM

Confirmed:
10 Sep 2026, 6:00 PM

Rescheduled
```

This distinction is especially important for franchise users.

------------------------------------------------------------------------

# 85. COUNTDOWN TIMER

Upcoming consultation should show:

``` text
Consultation starts in 01:42:35
```

When inside join window:

``` text
Join is now available
```

Join button must use the actual confirmed `startDateTime`.

If the appointment was rescheduled, the countdown must immediately
reflect the new time after Firestore data refresh.

------------------------------------------------------------------------

# 86. LOADING STATES

Every async action must provide feedback.

Examples:

``` text
Creating consultation...
Uploading report...
Confirming consultation...
Rescheduling consultation...
Saving meeting link...
Generating prescription...
Finalizing prescription...
Recording payment...
```

Disable the relevant action while processing.

------------------------------------------------------------------------

# 87. ERROR HANDLING

Never expose raw Firebase errors such as:

``` text
permission-denied
failed-precondition
```

directly to end users.

Map them to understandable messages.

Example:

``` text
You do not have permission to access this consultation.
```

or:

``` text
This appointment time is no longer available. Please select another time.
```

------------------------------------------------------------------------

# 88. CONFIRMATION DIALOGS

Use confirmation dialogs for destructive or consequential actions:

-   Deactivate doctor.
-   Deactivate franchise.
-   Reject consultation.
-   Cancel consultation.
-   Confirm & Reschedule.
-   Finalize prescription.
-   Record/refund payment where applicable.

------------------------------------------------------------------------

# 89. SOFT DELETE

Do not hard-delete core entities with historical dependencies.

Use:

``` text
status = INACTIVE
```

for:

-   Doctors.
-   Franchises.
-   Assignments.

Historical consultations and prescriptions must remain available.

------------------------------------------------------------------------

# 90. DOCTOR DEACTIVATION

When a doctor becomes inactive:

-   Do not allow new bookings.
-   Preserve old consultations.
-   Preserve prescriptions.
-   Preserve audit logs.
-   Review future scheduled consultations.
-   Admin should be warned about existing future appointments.

Do not automatically delete historical data.

------------------------------------------------------------------------

# 91. FRANCHISE DEACTIVATION

When a franchise becomes inactive:

-   Disable franchise login.
-   Prevent new bookings.
-   Preserve historical consultations.
-   Preserve patients.
-   Preserve reports.
-   Preserve prescriptions.
-   Preserve payments.
-   Preserve audit history.

------------------------------------------------------------------------

# 92. REPORTING

Admin reports should support:

-   Consultation count.
-   Completed consultation count.
-   Pending count.
-   Cancelled count.
-   Doctor-wise count.
-   Franchise-wise count.
-   Date-range count.
-   Revenue.

V1 can support CSV export.

PDF/Excel exports may be added later if explicitly required.

------------------------------------------------------------------------

# 93. MONTHLY REVENUE REPORT

Admin should be able to select:

``` text
Month
Year
```

and see:

-   Total consultations.
-   Completed consultations.
-   Gross consultation revenue.
-   Cancelled consultations.
-   Rescheduled consultations.

Revenue should use the consultation fee snapshot.

------------------------------------------------------------------------

# 94. PAYMENT REPORT

Show:

-   Consultation.
-   Patient.
-   Franchise.
-   Amount.
-   Method.
-   Status.
-   Transaction reference.
-   Paid date.
-   Recorded by.

Payment access:

-   Admin: all.
-   Franchise: own franchise payment records where required.
-   Doctor: normally no payment-management access unless later
    specified.

------------------------------------------------------------------------

# 95. ID FORMATS

Use human-readable IDs.

Consultation:

``` text
CMGC-YYYYMMDD-XXXXX
```

Example:

``` text
CMGC-20260910-00125
```

Patient:

``` text
PAT-XXXXXX
```

Doctor:

``` text
DOC-XXXX
```

Franchise:

``` text
FR-XXXX
```

Prescription:

``` text
RX-XXXXXX
```

IDs must be unique.

Firestore document IDs may remain random IDs; human-readable business
IDs can be stored as fields.

------------------------------------------------------------------------

# 96. SERVICE LAYER

Do not put raw Firestore queries throughout UI components.

Use services:

``` text
authService
userService
doctorService
franchiseService
assignmentService
patientService
consultationService
reportService
prescriptionService
paymentService
notificationService
pricingService
auditService
```

Example consultation methods:

``` text
createConsultation()
getConsultation()
getFranchiseConsultations()
getDoctorConsultations()
confirmConsultation()
confirmAndRescheduleConsultation()
rejectConsultation()
cancelConsultation()
completeConsultation()
addMeetingLink()
```

Prescription:

``` text
createPrescription()
updateDraftPrescription()
finalizePrescription()
generatePrescriptionPDF()
getPrescription()
```

------------------------------------------------------------------------

# 97. RECOMMENDED SERVICE CONTRACTS

## createConsultation

Input:

``` ts
{
  patientId: string;
  disease: string;
  diseaseDescription: string;
  extraMessage?: string;
  doctorId: string;
  requestedStartDateTime: Timestamp;
}
```

Server/database logic should determine:

-   franchise from authenticated user.
-   patient ownership.
-   active doctor.
-   active assignment.
-   availability.
-   overlap.
-   current pricing.

Output:

``` text
consultationId
```

## confirmAndRescheduleConsultation

Input:

``` ts
{
  consultationId: string;
  newStartDateTime: Timestamp;
  reason?: string;
}
```

Validation:

-   Authorized actor.
-   PENDING.
-   Doctor active.
-   New time future.
-   Availability.
-   No overlap.

Output:

``` text
updated consultation
```

------------------------------------------------------------------------

# 98. FIREBASE CONFIGURATION

Recommended files:

``` text
src/firebase/config.ts
src/firebase/auth.ts
src/firebase/firestore.ts
```

Environment variables:

``` text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

Only public client configuration belongs in `NEXT_PUBLIC_*`.

Never put private service-account credentials in these variables.

------------------------------------------------------------------------

# 99. FOLDER ARCHITECTURE

``` text
src/
  app/
    login/

    admin/
      dashboard/
      doctors/
      franchises/
      assignments/
      patients/
      consultations/
      pricing/
      payments/
      reports/
      settings/

    franchise/
      dashboard/
      doctors/
      patients/
      consultations/
      prescriptions/
      profile/

    doctor/
      dashboard/
      requests/
      upcoming/
      completed/
      patients/
      prescriptions/
      profile/

  components/
    layout/
    dashboard/
    doctor/
    franchise/
    patient/
    consultation/
    prescription/
    reports/
    common/

  services/
    authService.ts
    userService.ts
    doctorService.ts
    franchiseService.ts
    assignmentService.ts
    patientService.ts
    consultationService.ts
    reportService.ts
    prescriptionService.ts
    paymentService.ts
    notificationService.ts
    pricingService.ts
    auditService.ts

  firebase/
    config.ts
    auth.ts
    firestore.ts

  types/
    user.ts
    franchise.ts
    doctor.ts
    patient.ts
    consultation.ts
    prescription.ts
    payment.ts
    notification.ts
    audit.ts

  utils/
    date.ts
    validation.ts
    permissions.ts
    formatters.ts
    pdf.ts

  hooks/
    useAuth.ts
    useRole.ts
    useConsultations.ts
    useNotifications.ts

  lib/
    constants.ts
    errors.ts

  styles/
```

------------------------------------------------------------------------

# 100. FIRESTORE DATA DESIGN SUMMARY

``` text
users/{uid}

franchises/{franchiseId}

doctors/{doctorId}

franchiseDoctors/{assignmentId}

patients/{patientId}

consultations/{consultationId}

consultationReports/{reportId}

prescriptions/{prescriptionId}

payments/{paymentId}

notifications/{notificationId}

settings/pricing

auditLogs/{logId}
```

Relationships should be represented through IDs.

Do not duplicate entire relational objects unnecessarily.

Snapshots are intentional where historical accuracy matters.

------------------------------------------------------------------------

# 101. HISTORICAL SNAPSHOTS

Snapshot the following into consultation:

-   Patient name.
-   Patient age.
-   Patient address.
-   Consultation fee.
-   Requested appointment.
-   Confirmed appointment.

Snapshot the following into prescription:

-   Patient information.
-   Doctor information.
-   Consultation date.

This prevents later profile edits from changing historical documents.

------------------------------------------------------------------------

# 102. DATA INTEGRITY RULES

Never allow:

-   Consultation without valid patient.
-   Consultation without doctor.
-   Consultation without franchise.
-   Consultation with inactive doctor.
-   Consultation where doctor is not assigned to franchise.
-   Negative fee.
-   Past appointment.
-   Overlapping doctor appointment.
-   Prescription before completion.
-   Franchise editing finalized prescription.
-   Doctor accessing another doctor's consultation.

------------------------------------------------------------------------

# 103. NOTIFICATION READ STATE

When notification is displayed:

``` text
isRead = true
```

or allow the user to explicitly mark as read.

Unread count should be shown in header.

Notifications should be scoped to the authenticated user.

------------------------------------------------------------------------

# 104. AUDITABILITY OF RESCHEDULING

Every reschedule must produce an audit event:

``` text
Action:
RESCHEDULE_CONSULTATION

Entity:
CONSULTATION

Actor:
Doctor/Admin

Previous Time:
5:00 PM

New Time:
6:00 PM
```

This is important for operational accountability.

------------------------------------------------------------------------

# 105. RESCHEDULING ACCEPTANCE CRITERIA

The implementation is correct only if all are true:

1.  Franchise can request a preferred date/time.
2.  Requested time is stored separately.
3.  Actual appointment initially equals requested time.
4.  Doctor sees the request.
5.  Admin sees the request.
6.  Doctor can confirm without changing time.
7.  Doctor can confirm with a different time.
8.  Admin can confirm with a different time.
9.  New time is validated.
10. Double booking is prevented.
11. Doctor availability is checked.
12. Original requested time is preserved.
13. New confirmed time becomes actual appointment time.
14. `rescheduled = true`.
15. Actor and timestamp are stored.
16. Optional reason is stored.
17. Franchise receives notification.
18. Notification displays new time.
19. Consultation list shows new time.
20. Countdown uses new time.
21. Join window uses new time.
22. Historical audit shows old and new time.

------------------------------------------------------------------------

# 106. NOTIFICATION ACCEPTANCE CRITERIA

When rescheduled:

``` text
Franchise Notification Center
        ↓
"Your Video Consultation has been Rescheduled"
        ↓
New Date
New Time
Doctor
```

The notification must link to the consultation detail page.

------------------------------------------------------------------------

# 107. PRESCRIPTION ACCESS RULES

Admin:

-   View.
-   Download.

Doctor:

-   Create.
-   Edit draft.
-   Finalize.
-   View own.

Franchise:

-   View.
-   Download.

Franchise:

-   Cannot edit.

Finalized prescription:

-   Immutable.

------------------------------------------------------------------------

# 108. PATIENT DATA PRIVACY

Medical reports, disease information, prescriptions, and consultation
records are sensitive business/medical information.

Implementation should:

-   Restrict access by role.
-   Restrict access by franchise/doctor.
-   Avoid public file URLs where inappropriate.
-   Avoid logging medical report contents.
-   Avoid exposing medical information in browser console.
-   Avoid including sensitive medical information in unnecessary
    notifications.
-   Use HTTPS in production.
-   Protect authentication sessions.

------------------------------------------------------------------------

# 109. UI SECURITY VS DATA SECURITY

Frontend:

``` text
Hide unauthorized navigation
Disable unauthorized buttons
Redirect unauthorized users
```

Backend/Firebase:

``` text
Actually deny unauthorized reads/writes
```

Both are required.

Frontend UX must never be considered a security boundary.

------------------------------------------------------------------------

# 110. EMPTY STATES

Every list needs a useful empty state.

Examples:

``` text
No consultation requests found.

No doctors are currently assigned to this franchise.

No patients found.

No prescriptions available.

No notifications.

No medical reports uploaded.
```

------------------------------------------------------------------------

# 111. MOBILE RESPONSIVENESS

Doctor and Franchise interfaces should work well on mobile.

Important mobile considerations:

-   Large touch targets.
-   Sticky action buttons where useful.
-   Responsive tables or cards.
-   Easy report upload.
-   Readable consultation information.
-   Easy Google Meet join button.
-   Prescription download.
-   Notification access.

------------------------------------------------------------------------

# 112. ACCESSIBILITY

Use:

-   Proper labels.
-   Keyboard navigation.
-   Sufficient contrast.
-   Focus states.
-   Accessible dialogs.
-   Descriptive button labels.
-   Error messages linked to fields.

Do not rely only on color to communicate status.

------------------------------------------------------------------------

# 113. PERFORMANCE

Use:

-   Firestore pagination.
-   Query limits.
-   Lazy loading.
-   Optimized images.
-   Efficient queries.
-   Appropriate indexes.
-   Cached/static assets.
-   Minimal unnecessary listeners.

Avoid loading:

-   All patients.
-   All consultations.
-   All reports.

on initial dashboard load.

------------------------------------------------------------------------

# 114. REAL-TIME UPDATES

Firestore real-time listeners may be used for:

-   Notifications.
-   Doctor request count.
-   Upcoming consultation status.
-   Appointment changes.

Do not attach unnecessary real-time listeners to huge collections.

When an appointment is rescheduled, the franchise interface should
update promptly.

------------------------------------------------------------------------

# 115. ADMIN MANUAL MEETING WORKFLOW

``` text
Doctor confirms
       ↓
Admin receives notification
       ↓
Admin opens consultation
       ↓
Creates Google Meet manually
       ↓
Copies URL
       ↓
Pastes URL
       ↓
Save Meeting
       ↓
MEETING_ADDED
       ↓
Doctor + Franchise notified
```

The Meet URL remains hidden until the join window.

------------------------------------------------------------------------

# 116. MEETING BUTTON STATES

## No meeting

``` text
Meeting link not added yet
```

## Too early

``` text
Meeting available in 18 minutes
```

## Join window

``` text
[ Join Consultation ]
```

## Ended

``` text
Consultation Ended
```

## Cancelled

``` text
Consultation Cancelled
```

------------------------------------------------------------------------

# 117. DEVELOPMENT ORDER

Implement in this order:

1.  Project setup.
2.  Next.js/TypeScript/Tailwind.
3.  Firebase configuration.
4.  Authentication.
5.  User roles.
6.  Firestore models/types.
7.  Firebase Security Rules.
8.  Admin layout.
9.  Franchise management.
10. Doctor management.
11. Assignments.
12. Doctor availability.
13. Patient management.
14. Pricing.
15. Consultation booking.
16. Double-booking validation.
17. Doctor request queue.
18. Confirm/reject.
19. Confirm & Reschedule.
20. Franchise reschedule notifications.
21. Admin meeting link.
22. 10-minute join logic.
23. Consultation completion.
24. Medical reports.
25. Prescription.
26. Prescription PDF.
27. Payments.
28. Revenue.
29. Notifications.
30. Audit logs.
31. Reports.
32. Responsive optimization.
33. Security testing.
34. End-to-end testing.
35. Production deployment.

------------------------------------------------------------------------

# 118. DEVELOPMENT RULES FOR AI CODING AGENT

The coding agent must:

-   Use TypeScript.
-   Keep strict typing.
-   Avoid `any` unless absolutely unavoidable.
-   Use reusable components.
-   Use service-layer Firebase access.
-   Centralize validation.
-   Centralize date/time handling.
-   Centralize permission checks.
-   Use Firebase server timestamps where appropriate.
-   Use transactions for state-sensitive operations.
-   Implement security rules.
-   Never put private credentials in frontend.
-   Preserve historical snapshots.
-   Preserve franchise isolation.
-   Preserve doctor isolation.
-   Implement rescheduling exactly as specified.
-   Implement the 10-minute join rule.
-   Implement loading states.
-   Implement error states.
-   Implement empty states.
-   Implement confirmation dialogs.
-   Avoid duplicated business logic.
-   Avoid adding features outside V1.
-   Avoid placeholder business logic that silently violates
    requirements.

------------------------------------------------------------------------

# 119. AI CODING AGENT --- IMPLEMENTATION PRINCIPLE

Build the project incrementally.

After each major module:

1.  Compile.
2.  Type-check.
3.  Lint.
4.  Test.
5.  Verify Firebase rules.
6.  Verify role access.
7.  Verify responsive behavior.

Do not generate a visually complete frontend with missing
backend/security logic.

Do not mark functionality as complete merely because the UI exists.

------------------------------------------------------------------------

# 120. SECURITY TEST MATRIX

Test at minimum:

## Admin

-   Admin reads all consultations.
-   Admin manages doctors.
-   Admin manages franchises.
-   Admin changes price.

## Franchise A

-   Can read Franchise A consultations.
-   Cannot read Franchise B consultations.
-   Can read assigned doctors.
-   Cannot read unassigned doctor data where restricted.
-   Cannot edit prescription.
-   Cannot access Doctor B's unrelated consultation.

## Doctor A

-   Can read Doctor A consultations.
-   Cannot read Doctor B consultations.
-   Can confirm own request.
-   Can reschedule own pending request.
-   Cannot change price.
-   Can complete own consultation.
-   Can create prescription after completion.
-   Cannot edit finalized prescription.

## Unauthenticated

-   Cannot access any protected data.

------------------------------------------------------------------------

# 121. BUSINESS WORKFLOW TEST

Example:

``` text
Patient:
Rahul Das

Age:
42

Disease:
Diabetes

Franchise:
CMGC Chennai Central

Doctor:
Dr. Amit Sharma

Requested:
10 Sep 2026, 5:00 PM

Fee:
₹500
```

Workflow:

``` text
Franchise creates/selects patient
        ↓
Enters medical information
        ↓
Uploads medical report
        ↓
Selects Dr. Amit Sharma
        ↓
Requests 5:00 PM
        ↓
System checks availability
        ↓
Creates CMGC consultation
        ↓
Status PENDING
        ↓
Doctor receives notification
        ↓
Doctor cannot attend 5:00 PM
        ↓
Doctor chooses 6:00 PM
        ↓
Clicks Confirm & Reschedule
        ↓
System validates 6:00 PM
        ↓
Status CONFIRMED
        ↓
Original request remains 5:00 PM
        ↓
Confirmed time becomes 6:00 PM
        ↓
Franchise receives notification
        ↓
"Your Video Consultation has been Rescheduled
to 6:00 PM"
        ↓
Admin creates Google Meet
        ↓
Admin adds Meet link
        ↓
Status MEETING_ADDED
        ↓
Link hidden until 5:50 PM
        ↓
At 5:50 PM
        ↓
Doctor + Franchise can join
        ↓
Doctor conducts consultation
        ↓
Doctor marks COMPLETED
        ↓
Doctor creates prescription
        ↓
Prescription auto-fills patient/doctor data
        ↓
Doctor finalizes
        ↓
PDF generated
        ↓
Franchise downloads
        ↓
Admin sees completed consultation
        ↓
Monthly revenue includes ₹500
```

------------------------------------------------------------------------

# 122. EDGE CASES

## Doctor deactivated after booking

Historical consultation remains.

Admin must review future appointments.

## Franchise deactivated after booking

Historical consultation remains.

Future appointment requires admin review.

## Doctor reschedules to unavailable time

Reject the operation.

## Two consultations attempt same time

Only one may succeed.

## Admin changes price after booking

Old consultation retains original fee.

## Meet link added but consultation cancelled

Hide/disable join.

## Prescription attempted before completion

Deny.

## Franchise attempts another franchise URL

Deny through Firebase rules.

## Doctor attempts another doctor's consultation URL

Deny through Firebase rules.

## User opens old notification

Verify authorization again before showing data.

------------------------------------------------------------------------

# 123. PRODUCTION CONFIGURATION

Production must include:

-   HTTPS.
-   Firebase production project.
-   Firestore rules deployed.
-   Authentication configured.
-   Cloudinary production configuration.
-   Secure file delivery.
-   Domain configured.
-   Error monitoring.
-   Backup strategy.
-   Firebase/Cloudinary access review.

Never deploy development credentials into production.

------------------------------------------------------------------------

# 124. BACKUP AND DATA PROTECTION

Plan backups for:

-   Firestore.
-   Prescription PDFs.
-   Medical reports.
-   Critical configuration.

Historical data must be retained according to CMGC's business/legal
retention policy.

The development team should confirm retention and deletion requirements
with CMGC before production.

------------------------------------------------------------------------

# 125. SETTINGS

Suggested settings:

``` text
settings/
  pricing
  consultation
```

Consultation settings may contain:

``` ts
{
  defaultDurationMinutes: 30;
  joinWindowMinutes: 10;
  timezone: "Asia/Kolkata";
}
```

Centralize these values rather than hardcoding them in multiple
components.

------------------------------------------------------------------------

# 126. CONFIGURATION CONSTANTS

Example:

``` ts
const CONSULTATION_DURATION_MINUTES = 30;
const JOIN_WINDOW_MINUTES = 10;
const DEFAULT_CURRENCY = "INR";
const DEFAULT_TIMEZONE = "Asia/Kolkata";
const MAX_REPORT_SIZE_MB = 10;
```

If settings are editable later, move business-configurable values to
Firestore settings.

------------------------------------------------------------------------

# 127. ERROR MESSAGES

Examples:

### Unauthorized

> You do not have permission to access this information.

### Doctor unavailable

> The selected doctor is not available at this time.

### Double booking

> This doctor already has another consultation during the selected time.

### Reschedule failure

> The selected new time is no longer available. Please choose another
> time.

### Meeting unavailable

> The meeting link has not been added yet.

### Too early

> The consultation meeting will become available 10 minutes before the
> scheduled time.

### Prescription

> Prescription can only be created after the consultation is completed.

------------------------------------------------------------------------

# 128. FINAL ACCEPTANCE CRITERIA

The project is accepted only when:

### Authentication

-   [ ] Admin can log in.
-   [ ] Franchise can log in.
-   [ ] Doctor can log in.
-   [ ] Role-based redirects work.
-   [ ] Inactive accounts are blocked.

### Admin

-   [ ] Admin creates franchises.
-   [ ] Admin creates doctors.
-   [ ] Admin assigns doctors.
-   [ ] Admin configures availability.
-   [ ] Admin changes pricing.
-   [ ] Admin sees all consultations.
-   [ ] Admin adds Meet links.
-   [ ] Admin sees prescriptions.
-   [ ] Admin sees revenue.
-   [ ] Admin sees audit logs.

### Franchise

-   [ ] Franchise sees only assigned doctors.
-   [ ] Franchise creates/searches patients.
-   [ ] Franchise books consultation.
-   [ ] Franchise uploads reports.
-   [ ] Franchise sees consultation status.
-   [ ] Franchise receives reschedule notification.
-   [ ] Franchise sees the new appointment time.
-   [ ] Franchise joins during the 10-minute window.
-   [ ] Franchise downloads finalized prescription.
-   [ ] Franchise cannot edit prescription.

### Doctor

-   [ ] Doctor receives request.
-   [ ] Doctor sees reports.
-   [ ] Doctor confirms.
-   [ ] Doctor rejects.
-   [ ] Doctor can Confirm & Reschedule.
-   [ ] New time is validated.
-   [ ] Doctor sees only own consultations.
-   [ ] Doctor joins at correct time.
-   [ ] Doctor marks completed.
-   [ ] Doctor creates prescription.
-   [ ] Doctor finalizes prescription.
-   [ ] Finalized prescription cannot be edited.

### Consultation

-   [ ] Requested time is stored.
-   [ ] Confirmed time is stored.
-   [ ] Rescheduling is audited.
-   [ ] Franchise receives notification.
-   [ ] Double booking is prevented.
-   [ ] Historical fee remains unchanged.
-   [ ] Join link is hidden until 10 minutes before appointment.

### Prescription

-   [ ] Patient data auto-fills.
-   [ ] Doctor data auto-fills.
-   [ ] Multiple medicines supported.
-   [ ] PDF generated.
-   [ ] CMGC branding appears.
-   [ ] Franchise can download.
-   [ ] Admin can view/download.

### Security

-   [ ] Firebase rules enforce role.
-   [ ] Franchise isolation works.
-   [ ] Doctor isolation works.
-   [ ] Unauthorized Meet access is blocked.
-   [ ] Medical report access is restricted.
-   [ ] Private credentials are not exposed.

------------------------------------------------------------------------

# 129. FINAL PRODUCT FLOW

``` text
                    ADMIN
                      |
       +--------------+--------------+
       |              |              |
   FRANCHISE       DOCTOR         PRICING
       |              |
       |              |
       v              v
   PATIENT       AVAILABILITY
       |
       v
 CONSULTATION REQUEST
       |
       v
    PENDING
       |
       +------------------------------+
       |                              |
       v                              v
 CONFIRM                         CONFIRM &
 SAME TIME                       RESCHEDULE
       |                              |
       |                    Save New Appointment
       |                    Preserve Old Request
       |                              |
       +--------------+---------------+
                      |
                      v
                  CONFIRMED
                      |
              Notify Franchise
                      |
                      v
                MEET LINK ADDED
                      |
                      v
            Hidden Until T-10 Minutes
                      |
                      v
                JOIN CONSULTATION
                      |
                      v
                  COMPLETED
                      |
                      v
                PRESCRIPTION
                      |
                      v
                FINALIZED PDF
                      |
                      v
             FRANCHISE DOWNLOAD
                      |
                      v
             ADMIN REVENUE/REPORT
```

------------------------------------------------------------------------

# 130. MASTER ARCHITECTURE SUMMARY

``` text
CMGC WEB APP
|
+-- Authentication
|   +-- Firebase Auth
|   +-- Role Routing
|
+-- ADMIN
|   +-- Dashboard
|   +-- Doctors
|   +-- Franchises
|   +-- Assignments
|   +-- Patients
|   +-- Consultations
|   +-- Pricing
|   +-- Payments
|   +-- Reports
|   +-- Audit Logs
|
+-- FRANCHISE
|   +-- Dashboard
|   +-- Assigned Doctors
|   +-- Patients
|   +-- New Consultation
|   +-- Consultation History
|   +-- Notifications
|   +-- Prescriptions
|
+-- DOCTOR
|   +-- Dashboard
|   +-- Requests
|   +-- Confirm
|   +-- Confirm & Reschedule
|   +-- Upcoming
|   +-- Patients
|   +-- Complete Consultation
|   +-- Prescription
|
+-- FIREBASE
|   +-- Authentication
|   +-- Firestore
|   +-- Security Rules
|
+-- CLOUDINARY
|   +-- Medical Reports
|   +-- Prescription PDFs
|   +-- Doctor Images
|
+-- GOOGLE MEET
    +-- Manual Link V1
```

------------------------------------------------------------------------

# 131. FINAL IMPLEMENTATION RULE

This document is the source of truth for V1.

The AI coding agent or development team must not:

-   Remove required functionality.
-   Replace Firebase with another backend without approval.
-   Add a patient login.
-   Add automatic Meet creation.
-   Add an online payment gateway.
-   Add AI diagnosis.
-   Remove Firebase Security Rules.
-   Remove appointment-time history.
-   Remove rescheduling.
-   Remove the franchise notification.
-   Allow franchise users to edit prescriptions.
-   Allow doctors to access other doctors' consultations.
-   Allow franchises to access other franchises.
-   Change the historical consultation fee when pricing changes.

The critical appointment rule is:

> **The Franchise requests a preferred time. Admin or Doctor may confirm
> the requested time or confirm at a new time. If the time changes, the
> original requested time must be preserved, the new time becomes the
> confirmed appointment time, the change must be audited, and the
> Franchise must receive an in-app notification showing the new
> date/time.**

The critical meeting rule is:

> **The Google Meet link is manually added by Admin in V1 and must
> remain inaccessible/hidden to Franchise and Doctor until 10 minutes
> before the confirmed consultation start time.**

The critical security rule is:

> **Frontend restrictions are not security. Firebase Security Rules must
> enforce authorization and tenant/doctor isolation.**

The critical historical-data rule is:

> **Consultation fee, patient information used for historical records,
> doctor information used in prescriptions, requested appointment time,
> and confirmed appointment time must be preserved as snapshots where
> specified.**

------------------------------------------------------------------------

# 132. SUCCESS DEFINITION

CMGC V1 is successful when it replaces the core manual
consultation-management process:

``` text
Franchise
   ↓
Patient
   ↓
Doctor
   ↓
Requested Consultation
   ↓
Confirm / Reschedule
   ↓
Franchise Notification
   ↓
Google Meet
   ↓
Video Consultation
   ↓
Prescription
   ↓
Revenue
   ↓
Admin Reports
```

with a secure, centralized, auditable web application.

**END OF CMGC V1 PROJECT SPECIFICATION**
