/**
 * Maps Firebase and application errors to user-friendly medical SaaS messages.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  if (typeof error === "string") return error;

  const err = error as { code?: string; message?: string };
  const code = err.code || "";
  const msg = err.message || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email address or password. Please verify your credentials.";
    case "auth/user-disabled":
      return "This account has been deactivated. Please contact CMGC administration.";
    case "auth/too-many-requests":
      return "Access temporarily blocked due to repeated failed attempts. Please try again later.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists.";
    case "permission-denied":
      return "You do not have permission to access or perform this operation.";
    case "not-found":
      return "The requested record was not found.";
    case "already-exists":
      return "This record already exists in the system.";
    case "failed-precondition":
      return "The operation could not be completed due to conflicting system state.";
    case "unavailable":
      return "Network connection issue. Please check your internet connection.";
    default:
      if (msg.includes("permission-denied")) {
        return "You do not have permission to perform this action.";
      }
      return msg || "An error occurred while processing your request.";
  }
}
