import { type StaffMember, PRIMARY_ADMIN_EMAIL, ROLE_PERMISSIONS, isPrimaryAdmin, toDisplayRole } from "../types/staff";
import { INITIAL_STAFF_MEMBERS, getDefaultPermissionsForRole } from "./staff";
import { supabase, isSupabaseConfigured, dbService } from "../lib/supabase";

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
    // Default initial active session for primary super admin
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
  password?: string
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

  // Supabase Auth Integration
  if (isSupabaseConfigured()) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password || "",
      });

      if (authError || !authData.user) {
        recordFailedAttempt(trimmedEmail);
        return { success: false, error: "Invalid email address or password." };
      }

      const profile = await dbService.getUserProfile(authData.user.id);
      if (!profile) {
        recordFailedAttempt(trimmedEmail);
        return { success: false, error: "Staff profile record not found." };
      }

      // Check account status
      const statusLower = (profile.status || "active").toLowerCase().trim();
      if (statusLower === "inactive") {
        await supabase.auth.signOut();
        return { success: false, error: "Your staff account is currently inactive." };
      }
      if (statusLower === "suspended") {
        await supabase.auth.signOut();
        return { success: false, error: "Your staff account has been suspended." };
      }
      if (statusLower !== "active") {
        await supabase.auth.signOut();
        return { success: false, error: "Access denied. Account is not active." };
      }

      // Role authorization check
      if (profile.role === "customer") {
        await supabase.auth.signOut();
        return { success: false, error: "Access denied. Customer accounts cannot access the staff portal." };
      }

      clearAttemptRecord(trimmedEmail);
      const displayRole = toDisplayRole(profile.role);
      const staffMember: StaffMember = {
        id: authData.user.id,
        name: profile.full_name || trimmedEmail.split("@")[0],
        email: profile.email || trimmedEmail,
        role: displayRole,
        status: "Active",
        lastActive: authData.user.last_sign_in_at ? new Date(authData.user.last_sign_in_at).toLocaleTimeString() : "Just now",
        createdAt: profile.created_at ? profile.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        isPrimaryAdmin: isPrimaryAdmin(profile.email || trimmedEmail),
        permissions: getDefaultPermissionsForRole(displayRole),
      };

      setCurrentStaff(staffMember);
      return { success: true, staff: staffMember };
    } catch (e: any) {
      recordFailedAttempt(trimmedEmail);
      return { success: false, error: e.message || "Authentication error." };
    }
  }

  // Local Staff List Fallback (when running local preview without Supabase)
  let staffList = INITIAL_STAFF_MEMBERS;
  try {
    const localStaff = localStorage.getItem("hm_signature_staff_list");
    if (localStaff) {
      staffList = JSON.parse(localStaff);
    }
  } catch (e) {
    // fallback
  }

  const existingStaff = staffList.find((s) => s.email.toLowerCase() === trimmedEmail);

  if (!existingStaff && trimmedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    const primaryStaff = INITIAL_STAFF_MEMBERS.find((s) => s.isPrimaryAdmin) || INITIAL_STAFF_MEMBERS[0];
    clearAttemptRecord(trimmedEmail);
    setCurrentStaff(primaryStaff);
    return { success: true, staff: primaryStaff };
  }

  if (!existingStaff) {
    recordFailedAttempt(trimmedEmail);
    return { success: false, error: "Invalid email address or password." };
  }

  const statusLower = (existingStaff.status || "Active").toLowerCase();
  if (statusLower === "inactive") {
    return { success: false, error: "Your staff account is currently inactive." };
  }
  if (statusLower === "suspended") {
    return { success: false, error: "Your staff account has been suspended." };
  }

  clearAttemptRecord(trimmedEmail);
  const updated = { ...existingStaff, lastActive: "Just now" };
  setCurrentStaff(updated);
  return { success: true, staff: updated };
}

export function logoutStaff(): void {
  if (isSupabaseConfigured()) {
    supabase.auth.signOut().catch(() => {});
  }
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
