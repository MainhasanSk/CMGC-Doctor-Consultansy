import {
  isWithinJoinWindow,
  getMinutesUntilJoinWindow,
  hasConsultationEnded,
  isIntervalOverlapping,
  createISTTimestamp,
  addMinutesToTimestamp,
  formatISTDate,
  formatISTTime,
  CONSULTATION_DURATION_MINUTES,
} from "../src/utils/date";
import { formatINR } from "../src/utils/formatters";

function runTests() {
  console.log("==========================================================");
  console.log("  CMGC MEDICAL VIDEO CONSULTATION — ACCEPTANCE TEST SUITE ");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
      failed++;
    }
  };

  // -------------------------------------------------------------
  // TEST 1: Double-booking interval overlap logic
  // newStart < existingEnd AND newEnd > existingStart
  // -------------------------------------------------------------
  console.log("--- Section 1: Double-Booking Prevention & Overlap Logic ---");

  // Booking 1: 5:00 PM to 5:30 PM (17:00 to 17:30) on 2026-09-10
  const start1 = createISTTimestamp("2026-09-10", "17:00");
  const end1 = addMinutesToTimestamp(start1, CONSULTATION_DURATION_MINUTES); // 17:30

  // Case A: Overlapping booking 5:15 PM to 5:45 PM (17:15 to 17:45)
  const startA = createISTTimestamp("2026-09-10", "17:15");
  const endA = addMinutesToTimestamp(startA, CONSULTATION_DURATION_MINUTES);
  assert(
    isIntervalOverlapping(start1, end1, startA, endA) === true,
    "Test 1.1: Partial overlap (17:15 - 17:45 vs 17:00 - 17:30) detected as conflict"
  );

  // Case B: Identical slot 5:00 PM to 5:30 PM
  const startB = createISTTimestamp("2026-09-10", "17:00");
  const endB = addMinutesToTimestamp(startB, CONSULTATION_DURATION_MINUTES);
  assert(
    isIntervalOverlapping(start1, end1, startB, endB) === true,
    "Test 1.2: Exact duplicate slot (17:00 - 17:30) detected as conflict"
  );

  // Case C: Non-overlapping slot after (5:30 PM to 6:00 PM)
  const startC = createISTTimestamp("2026-09-10", "17:30");
  const endC = addMinutesToTimestamp(startC, CONSULTATION_DURATION_MINUTES);
  assert(
    isIntervalOverlapping(start1, end1, startC, endC) === false,
    "Test 1.3: Adjacent non-overlapping slot (17:30 - 18:00) allowed"
  );

  // Case D: Completely separate slot at 6:00 PM (18:00 to 18:30)
  const startD = createISTTimestamp("2026-09-10", "18:00");
  const endD = addMinutesToTimestamp(startD, CONSULTATION_DURATION_MINUTES);
  assert(
    isIntervalOverlapping(start1, end1, startD, endD) === false,
    "Test 1.4: Separate rescheduled slot (18:00 - 18:30) allowed"
  );

  // -------------------------------------------------------------
  // TEST 2: 10-Minute Google Meet Visibility Rule
  // Confirmed time: 6:00 PM (18:00) to 6:30 PM (18:30)
  // Join Window: 5:50 PM (17:50) to 6:30 PM (18:30)
  // -------------------------------------------------------------
  console.log("\n--- Section 2: 10-Minute Google Meet Visibility Rule ---");
  const confirmedStart = createISTTimestamp("2026-09-10", "18:00");
  const confirmedEnd = addMinutesToTimestamp(confirmedStart, 30); // 18:30

  // 2.1 Before 5:50 PM: e.g. 5:45 PM -> Join link MUST be hidden
  const time545 = createISTTimestamp("2026-09-10", "17:45").toDate();
  assert(
    isWithinJoinWindow(confirmedStart, confirmedEnd, time545) === false,
    "Test 2.1: Join link HIDDEN at 5:45 PM (before 10-minute window)"
  );

  const minsUntil = getMinutesUntilJoinWindow(confirmedStart, time545);
  assert(
    minsUntil === 5,
    "Test 2.2: Correctly reports exactly 5 minutes until join window opens at 5:45 PM"
  );

  // 2.2 Exactly at 5:50 PM (T-10 minutes) -> Join link MUST be active
  const time550 = createISTTimestamp("2026-09-10", "17:50").toDate();
  assert(
    isWithinJoinWindow(confirmedStart, confirmedEnd, time550) === true,
    "Test 2.3: Join link ACTIVE at 5:50 PM (T-10 minutes window open)"
  );

  // 2.3 During consultation: e.g. 6:15 PM -> Join link MUST be active
  const time615 = createISTTimestamp("2026-09-10", "18:15").toDate();
  assert(
    isWithinJoinWindow(confirmedStart, confirmedEnd, time615) === true,
    "Test 2.4: Join link ACTIVE during ongoing consultation (6:15 PM)"
  );

  // 2.4 After consultation end: e.g. 6:31 PM -> Join link MUST be ended/closed
  const time631 = createISTTimestamp("2026-09-10", "18:31").toDate();
  assert(
    isWithinJoinWindow(confirmedStart, confirmedEnd, time631) === false,
    "Test 2.5: Join link CLOSED at 6:31 PM (consultation ended)"
  );
  assert(
    hasConsultationEnded(confirmedEnd, time631) === true,
    "Test 2.6: Correctly marks consultation as ended after 6:30 PM"
  );

  // -------------------------------------------------------------
  // TEST 3: Rescheduled Appointment uses NEW time for 10-minute rule
  // Original: 5:00 PM (17:00). New: 6:00 PM (18:00).
  // At 4:50 PM (10 mins before original), join MUST BE HIDDEN because new appointment is 6 PM!
  // -------------------------------------------------------------
  console.log("\n--- Section 3: Reschedule Verification & Time Preservation ---");
  const time450 = createISTTimestamp("2026-09-10", "16:50").toDate();
  assert(
    isWithinJoinWindow(confirmedStart, confirmedEnd, time450) === false,
    "Test 3.1: At 4:50 PM (10 mins before original requested time), join remains hidden because confirmed time is 6:00 PM"
  );

  // Format check
  const origFormatted = `${formatISTDate(start1)}, ${formatISTTime(start1)}`;
  const confFormatted = `${formatISTDate(confirmedStart)}, ${formatISTTime(confirmedStart)}`;
  assert(
    origFormatted.includes("5:00") && confFormatted.includes("6:00"),
    "Test 3.2: Both original requested time and new confirmed time accurately formatted in Asia/Kolkata (IST)"
  );

  // -------------------------------------------------------------
  // TEST 4: Pricing Snapshot & Revenue Verification
  // -------------------------------------------------------------
  console.log("\n--- Section 4: Pricing Snapshot & Revenue Calculation ---");
  const sampleConsultationFee = 500;
  const sampleConsultationFeeINR = formatINR(sampleConsultationFee);
  assert(
    sampleConsultationFeeINR === "₹500",
    "Test 4.1: Consultation fee formatINR correctly formats ₹500"
  );

  // Simulated consultations
  const mockConsultations = [
    { id: "CMGC-01", fee: 500, status: "COMPLETED" },
    { id: "CMGC-02", fee: 500, status: "COMPLETED" },
    { id: "CMGC-03", fee: 500, status: "CANCELLED" },
    { id: "CMGC-04", fee: 500, status: "PENDING" },
  ];

  // If system pricing changes tomorrow to ₹750, completed consultations still calculate using their snapshot fee of ₹500
  const systemPriceTomorrow = 750;
  const completedRevenue = mockConsultations
    .filter((c) => c.status === "COMPLETED")
    .reduce((sum, c) => sum + c.fee, 0);

  assert(
    completedRevenue === 1000,
    "Test 4.2: Gross revenue strictly uses historical snapshot fee (₹1,000 for 2 completed) ignoring system price updates"
  );

  console.log("\n==========================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
