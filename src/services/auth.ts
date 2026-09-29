import { type StaffMember, PRIMARY_ADMIN_EMAIL, ROLE_PERMISSIONS, isPrimaryAdmin } from "../types/staff";
import { INITIAL_STAFF_MEMBERS } from "./staff";

const MOCK_AUTH_STORAGE_KEY = "hm_signature_current_staff";
const LOGGED_OUT_KEY = "hm_signature_logged_out";
const LOCKOUT_STORAGE_KEY = "hm_signature_login_attempts";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  resetAt: number;
}

function getAttemptRecord(email: string): AttemptRecord {
  try {
    const raw = localStorage.getItem(`${LOCKOUT_STORAGE_KEY}_${email.toLowerCase()}`);
    if (raw) {
      const record: AttemptRecord = JSON.parse(raw);
      if (Date.now() > record.resetAt) {
        // Expired lockout window, reset
        return { count: 0, resetAt: Date.now() + LOCKOUT_DURATION_MS };
      }
      return record;
    }
  } catch (e) {
    // fallback
  }
  return { count: 0, resetAt: Date.now() + LOCKOUT_DURATION_MS };
}

function recordFailedAttempt(email: string): number {
  const current = getAttemptRecord(email);
  const updated: AttemptRecord = {
    count: current.count + 1,
    resetAt: current.count === 0 ? Date.now() + LOCKOUT_DURATION_MS : current.resetAt,
  };
  localStorage.setItem(`${LOCKOUT_STORAGE_KEY}_${email.toLowerCase()}`, JSON.stringify(updated));
  return updated.count;
}

function clearAttemptRecord(email: string): void {
  localStorage.removeItem(`${LOCKOUT_STORAGE_KEY}_${email.toLowerCase()}`);
}

export function getCurrentStaff(): StaffMember | null {
  try {
    if (localStorage.getItem(LOGGED_OUT_KEY) === "true") {
      return null;
    }
    const stored = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initial active session for primary admin before explicit logout
    return INITIAL_STAFF_MEMBERS[0];
  } catch (e) {
    console.error("Failed to parse stored staff auth", e);
    return null;
  }
}

export function setCurrentStaff(staff: StaffMember | null): void {
  if (staff) {
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(staff));
    localStorage.removeItem(LOGGED_OUT_KEY);
  } else {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    localStorage.setItem(LOGGED_OUT_KEY, "true");
  }
}

export async function loginStaff(
  email: string,
  _password?: string
): Promise<{ success: boolean; staff?: StaffMember; error?: string }> {
  const trimmedEmail = email.toLowerCase().trim();

  // Check rate limiting / lockout
  const attempts = getAttemptRecord(trimmedEmail);
  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    const minutesRemaining = Math.ceil((attempts.resetAt - Date.now()) / (60 * 1000));
    return {
      success: false,
      error: `Too many failed login attempts. Security lock active. Please try again in ${minutesRemaining} minute(s).`,
    };
  }

  // Load staff records from initial list or local storage
  let staffList = INITIAL_STAFF_MEMBERS;
  try {
    const localStaff = localStorage.getItem("hm_signature_staff_list");
    if (localStaff) {
      staffList = JSON.parse(localStaff);
    }
  } catch (e) {
    // fallback
  }

  // Find staff member by email (server-side role resolution)
  const existingStaff = staffList.find((s) => s.email.toLowerCase() === trimmedEmail);

  // Fallback for primary super admin email if not in list
  if (!existingStaff && trimmedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    const primaryStaff = INITIAL_STAFF_MEMBERS.find((s) => s.isPrimaryAdmin) || INITIAL_STAFF_MEMBERS[0];
    clearAttemptRecord(trimmedEmail);
    setCurrentStaff(primaryStaff);
    return { success: true, staff: primaryStaff };
  }

  // Generic credential failure if email not in staff repository
  if (!existingStaff) {
    recordFailedAttempt(trimmedEmail);
    return { success: false, error: "Invalid email address or password." };
  }

  // Account status check
  if (existingStaff.status === "Inactive" || existingStaff.status === "Suspended") {
    return { success: false, error: "This staff account has been deactivated. Access denied." };
  }

  // Successful login
  clearAttemptRecord(trimmedEmail);
  const updated = { ...existingStaff, lastActive: "Just now" };
  setCurrentStaff(updated);
  return { success: true, staff: updated };
}

export function logoutStaff(): void {
  setCurrentStaff(null);
}

export function isAuthenticated(): boolean {
  return getCurrentStaff() !== null;
}

export function hasPermission(staff: StaffMember | null, permissionKey: string): boolean {
  if (!staff) return false;
  if (isPrimaryAdmin(staff) || staff.role === "Super Admin") return true;
  const rolePerms = ROLE_PERMISSIONS[staff.role];
  if (rolePerms && rolePerms[permissionKey]) return true;
  return Boolean(staff.permissions && staff.permissions[permissionKey]);
}
