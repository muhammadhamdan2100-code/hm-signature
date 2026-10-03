import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase, isSupabaseConfigured, dbService } from "../lib/supabase";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  type AddressRecord,
} from "../services/customerAddresses";
import { getCurrentStaff, setCurrentStaff, logoutStaff } from "../services/auth";
import { INITIAL_STAFF_MEMBERS, getDefaultPermissionsForRole } from "../services/staff";
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdmin, ROLE_PERMISSIONS, type StaffMember, type StaffRole } from "../types/staff";

export type UserRole = "customer" | "super_admin" | "admin" | "manager" | "order_manager" | "content_manager" | "support" | "Super Admin" | "Manager" | "Order Manager" | "Content Manager" | "Customer";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  permissions?: Record<string, boolean>;
  /** Mirrors profiles.is_primary_admin — the protected Super Admin identity. */
  isPrimaryAdmin?: boolean;
}

export interface UserAddress {
  id: string;
  title: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  type?: "shipping" | "billing" | "home" | "work" | "other";
  state?: string;
  fullName?: string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  addresses: UserAddress[];
  addressesLoading: boolean;
  addressesError: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; role?: UserRole; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  completePasswordReset: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  addAddress: (address: Omit<UserAddress, "id">) => Promise<boolean>;
  updateAddress: (id: string, address: Omit<UserAddress, "id">) => Promise<boolean>;
  removeAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  hasPermission: (permissionKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function isStaffRole(role?: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return normalized !== "customer";
}

export function isCustomerRole(role?: string): boolean {
  if (!role) return false;
  return role.toLowerCase().trim() === "customer";
}

const LOCKOUT_STORAGE_KEY = "hm_signature_login_attempts";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function checkLockout(email: string): { locked: boolean; minutesRemaining?: number } {
  try {
    const raw = localStorage.getItem(`${LOCKOUT_STORAGE_KEY}_${email.toLowerCase()}`);
    if (raw) {
      const record = JSON.parse(raw);
      if (Date.now() < record.resetAt && record.count >= MAX_FAILED_ATTEMPTS) {
        const mins = Math.ceil((record.resetAt - Date.now()) / (60 * 1000));
        return { locked: true, minutesRemaining: mins };
      }
    }
  } catch (e) {
    // fallback
  }
  return { locked: false };
}

function recordFailedAttempt(email: string) {
  try {
    const key = `${LOCKOUT_STORAGE_KEY}_${email.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    let count = 1;
    let resetAt = Date.now() + LOCKOUT_DURATION_MS;
    if (raw) {
      const record = JSON.parse(raw);
      count = record.count + 1;
      resetAt = record.resetAt;
    }
    localStorage.setItem(key, JSON.stringify({ count, resetAt }));
  } catch (e) {
    // fallback
  }
}

function clearLockout(email: string) {
  try {
    localStorage.removeItem(`${LOCKOUT_STORAGE_KEY}_${email.toLowerCase()}`);
  } catch (e) {
    // fallback
  }
}

// ---------------------------------------------------------------- addresses
// Rows written before this feature moved to Supabase. The previous build seeded
// a fabricated "Primary Residence" address on first render, so that particular
// row is never imported into a real account.
const LEGACY_ADDRESS_KEY = "hm_auth_addresses";

function isLegacyFixture(row: any): boolean {
  const line = String(row?.addressLine1 || "").trim().toLowerCase();
  const city = String(row?.city || "").trim().toLowerCase();
  return line === "boutique residence 42, gulberg iii" && city === "lahore";
}

function readLegacyAddresses(): UserAddress[] {
  try {
    const raw = localStorage.getItem(LEGACY_ADDRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row: any) => row?.addressLine1 && row?.city && row?.id && !isLegacyFixture(row)
    );
  } catch {
    return [];
  }
}

function toUserAddress(row: AddressRecord): UserAddress {
  return {
    id: row.id,
    title: row.label || (row.isDefault ? "Default address" : "Saved address"),
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    postalCode: row.postalCode || "",
    country: row.country,
    isDefault: row.isDefault,
    type: row.type,
    state: row.state,
    fullName: row.fullName,
    phone: row.phone,
  };
}

function toInput(addr: Omit<UserAddress, "id">) {
  return {
    type: addr.type,
    label: addr.title,
    fullName: addr.fullName,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    isDefault: addr.isDefault,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("hm_auth_user");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Check if staff session exists
    const currentStaff = getCurrentStaff();
    if (currentStaff) {
      return {
        id: currentStaff.id,
        email: currentStaff.email,
        fullName: currentStaff.name,
        role: currentStaff.role as UserRole,
        permissions: currentStaff.permissions,
      };
    }
    return null;
  });

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured());

  // Helper to synchronize UserProfile and StaffMember states from a Supabase session
  const syncUserFromSession = async (session: { user: { id: string; email?: string; user_metadata?: any } } | null) => {
    if (!session?.user) {
      setUser(null);
      setCurrentStaff(null);
      return null;
    }

    const sessionUser = session.user;
    const email = (sessionUser.email || "").toLowerCase().trim();
    const profile = await dbService.getUserProfile(sessionUser.id);

    let role: UserRole = "customer";
    let status = "active";
    let fullName = sessionUser.user_metadata?.full_name || (email ? email.split("@")[0] : "Client");
    let phone: string | undefined;
    let primaryAdmin = false;

    if (profile) {
      role = (profile.role || "customer") as UserRole;
      status = (profile.status || "active").toLowerCase().trim();
      fullName = profile.full_name || fullName;
      phone = profile.phone;
      primaryAdmin = Boolean(profile.is_primary_admin);
    } else {
      if (isPrimaryAdmin(email)) {
        role = "super_admin";
        status = "active";
        primaryAdmin = true;
      } else if (sessionUser.user_metadata?.role && sessionUser.user_metadata.role !== "customer") {
        role = sessionUser.user_metadata.role as UserRole;
        status = "active";
      }
    }

    // Auth holds the credential; profiles.email is only a copy for display. After an
    // email change is confirmed (or any drift), mirror it here so staff screens and the
    // customer account show the address the user actually signs in with. Row-level
    // security limits this to the owner's own row and to non-privileged columns.
    if (profile && email && isSupabaseConfigured() && (profile.email || "").toLowerCase() !== email) {
      await supabase
        .from("profiles")
        .update({ email, updated_at: new Date().toISOString() })
        .eq("id", sessionUser.id);
    }

    // Account status check: block inactive/suspended accounts
    if (status === "inactive" || status === "suspended") {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setCurrentStaff(null);
      return null;
    }

    const userObj: UserProfile = {
      id: sessionUser.id,
      email,
      fullName,
      phone,
      role,
      isPrimaryAdmin: primaryAdmin,
    };

    setUser(userObj);

    if (isStaffRole(role)) {
      const displayRole = (role === "super_admin" ? "Super Admin" : role === "order_manager" ? "Order Manager" : role === "content_manager" ? "Content Manager" : "Manager") as StaffRole;
      const staffObj: StaffMember = {
        id: sessionUser.id,
        name: fullName,
        email,
        role: displayRole,
        status: "Active",
        lastActive: "Just now",
        createdAt: profile?.created_at ? profile.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        isPrimaryAdmin: primaryAdmin || isPrimaryAdmin(email),
        permissions: getDefaultPermissionsForRole(displayRole),
      };
      setCurrentStaff(staffObj);
    } else {
      setCurrentStaff(null);
    }

    return userObj;
  };

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("hm_auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hm_auth_user");
    }
  }, [user]);

  // The database is the only source of truth. A device that saved addresses
  // while this feature lived in localStorage has those rows imported once, and
  // only while the account still has nothing stored.
  useEffect(() => {
    if (!user?.id) {
      setAddresses([]);
      return;
    }
    if (!isSupabaseConfigured()) return;
    let mounted = true;
    setAddressesLoading(true);
    setAddressesError(null);
    fetchCustomerAddresses()
      .then(async (rows) => {
        if (!mounted) return rows;
        if (rows.length === 0) {
          const legacy = readLegacyAddresses();
          for (const item of legacy) {
            await createCustomerAddress({
              label: item.title,
              addressLine1: item.addressLine1,
              addressLine2: item.addressLine2,
              city: item.city,
              postalCode: item.postalCode,
              country: item.country,
              isDefault: item.isDefault,
            });
          }
          if (legacy.length > 0) {
            const imported = await fetchCustomerAddresses();
            // Only drop the device copy once every row is confirmed in the
            // database, so an interrupted import can never lose an address.
            if (imported.length >= legacy.length) localStorage.removeItem(LEGACY_ADDRESS_KEY);
            return mounted ? imported : rows;
          }
          return rows;
        }
        return rows;
      })
      .then((rows) => {
        if (mounted) setAddresses(rows.map(toUserAddress));
      })
      .catch((e: any) => {
        if (mounted) setAddressesError(e?.message || "We could not load your saved addresses.");
      })
      .finally(() => {
        if (mounted) setAddressesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Supabase Auth session initialization & listener
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsLoading(true);

      // PKCE password-recovery links arrive as /login?code=... — exchange before reading session
      const bootParams = new URLSearchParams(window.location.search);
      const authCode = bootParams.get("code");
      const codeExchange = authCode
        ? supabase.auth
            .exchangeCodeForSession(authCode)
            .then(() => {
              window.history.replaceState({}, "", "/login?reset=1");
            })
            .catch((err) => console.error("Auth code exchange failed:", err))
        : Promise.resolve();

      // Restore session on boot/refresh
      codeExchange.then(() => supabase.auth.getSession()).then(async ({ data: { session } }) => {
        try {
          if (session) {
            await syncUserFromSession(session);
          } else {
            setUser(null);
            setCurrentStaff(null);
          }
        } catch (e) {
          console.error("Error retrieving Supabase session:", e);
        } finally {
          setIsLoading(false);
        }
      }).catch((err) => {
        console.error("Error initializing session:", err);
        setIsLoading(false);
      });

      // Subscribe to auth state changes (tab sync, refresh token, sign in / sign out)
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setCurrentStaff(null);
          setIsLoading(false);
        } else if (session) {
          await syncUserFromSession(session);
          setIsLoading(false);
        } else {
          setUser(null);
          setCurrentStaff(null);
          setIsLoading(false);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password?: string,
    _rememberMe: boolean = false
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    // Check rate limiting / security lock
    const lockStatus = checkLockout(trimmedEmail);
    if (lockStatus.locked) {
      setIsLoading(false);
      return {
        success: false,
        error: `Too many failed login attempts. Security lock active. Try again in ${lockStatus.minutesRemaining} minute(s).`,
      };
    }

    try {
      if (isSupabaseConfigured() && password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (authError || !authData.user) {
          recordFailedAttempt(trimmedEmail);
          setIsLoading(false);
          return { success: false, error: authError?.message || "Invalid email or password" };
        }

        clearLockout(trimmedEmail);
        const syncedUser = await syncUserFromSession(authData.session);

        if (!syncedUser) {
          setIsLoading(false);
          return { success: false, error: "Access denied. Account is inactive, suspended, or unverified." };
        }

        setIsLoading(false);
        return { success: true, role: syncedUser.role };
      }

      // Fallback / Demo Credentials login
      clearLockout(trimmedEmail);

      // Check if primary admin or staff
      if (trimmedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
        const primaryStaff = INITIAL_STAFF_MEMBERS.find((s) => s.isPrimaryAdmin) || INITIAL_STAFF_MEMBERS[0];
        const loggedUser: UserProfile = {
          id: primaryStaff.id,
          email: primaryStaff.email,
          fullName: primaryStaff.name,
          role: "super_admin",
          permissions: primaryStaff.permissions,
        };
        setUser(loggedUser);
        setCurrentStaff(primaryStaff);
        setIsLoading(false);
        return { success: true, role: "super_admin" };
      }

      // Check existing initial staff list
      const matchedStaff = INITIAL_STAFF_MEMBERS.find((s) => s.email.toLowerCase() === trimmedEmail);
      if (matchedStaff) {
        const mappedRole = matchedStaff.role === "Super Admin" ? "super_admin" : matchedStaff.role === "Order Manager" ? "order_manager" : matchedStaff.role === "Content Manager" ? "content_manager" : "manager";
        const loggedUser: UserProfile = {
          id: matchedStaff.id,
          email: matchedStaff.email,
          fullName: matchedStaff.name,
          role: mappedRole as UserRole,
          permissions: matchedStaff.permissions,
        };
        setUser(loggedUser);
        setCurrentStaff(matchedStaff);
        setIsLoading(false);
        return { success: true, role: mappedRole as UserRole };
      }

      // Customer demo login
      const customerUser: UserProfile = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        fullName: trimmedEmail.split("@")[0].toUpperCase(),
        role: "customer",
      };
      setUser(customerUser);
      logoutStaff();
      setIsLoading(false);
      return { success: true, role: "customer" };

    } catch (e) {
      recordFailedAttempt(trimmedEmail);
      setIsLoading(false);
      return { success: false, error: "Invalid email or password" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string; needsEmailConfirmation?: boolean }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: "customer" },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (!data.session) {
          // Email confirmation is enabled — user must verify before login
          setIsLoading(false);
          return { success: true, needsEmailConfirmation: true };
        }

        if (data.user) {
          await dbService.createOrUpdateProfile({
            id: data.user.id,
            email,
            full_name: fullName,
            role: "customer",
          });
          const syncedUser = await syncUserFromSession(data.session);
          setIsLoading(false);
          return { success: true, role: syncedUser?.role || "customer" };
        }
      }

      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        fullName,
        role: "customer",
      };

      setUser(newUser);
      logoutStaff();
      setIsLoading(false);
      return { success: true, role: "customer" };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || "Sign up failed." };
    }
  };

  const forgotPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Password reset requires Supabase to be configured." };
    }
    const redirectTo = `${window.location.origin}/login?reset=1`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const completePasswordReset = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) return { success: false, error: "Not connected." };
    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error during Supabase signout:", err);
    } finally {
      setUser(null);
      setCurrentStaff(null);
      localStorage.removeItem("hm_auth_user");
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    // Strictly prevent user from updating role
    const { role: _ignoredRole, ...allowedUpdates } = data;
    const updated = { ...user, ...allowedUpdates };
    setUser(updated);

    if (isSupabaseConfigured()) {
      await supabase.auth.updateUser({ data: { full_name: allowedUpdates.fullName } });
      await dbService.createOrUpdateProfile({
        id: user.id,
        email: user.email,
        full_name: allowedUpdates.fullName || user.fullName,
        phone: allowedUpdates.phone || user.phone,
        role: user.role, // role unchanged
      });
    }
    return true;
  };

  const refreshAddresses = async () => {
    try {
      setAddresses((await fetchCustomerAddresses()).map(toUserAddress));
      setAddressesError(null);
    } catch (e: any) {
      setAddressesError(e?.message || "We could not reload your saved addresses.");
    }
  };

  const addAddress = async (addr: Omit<UserAddress, "id">) => {
    const res = await createCustomerAddress(toInput(addr));
    if (res.success) await refreshAddresses();
    else setAddressesError(res.error || "The address was not saved.");
    return res.success;
  };

  const updateAddress = async (id: string, addr: Omit<UserAddress, "id">) => {
    const res = await updateCustomerAddress(id, toInput(addr));
    if (res.success) await refreshAddresses();
    else setAddressesError(res.error || "The address was not updated.");
    return res.success;
  };

  const removeAddress = async (id: string) => {
    const res = await deleteCustomerAddress(id);
    if (res.success) await refreshAddresses();
    else setAddressesError(res.error || "The address was not removed.");
    return res.success;
  };

  const setDefaultAddress = async (id: string) => {
    const res = await setDefaultCustomerAddress(id);
    if (res.success) await refreshAddresses();
    else setAddressesError(res.error || "That address could not be set as the default.");
    return res.success;
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    if (user.role === "super_admin" || user.role === "Super Admin" || isPrimaryAdmin(user.email)) {
      return true;
    }
    const mappedRole = user.role === "order_manager" ? "Order Manager" : user.role === "content_manager" ? "Content Manager" : user.role === "admin" || user.role === "manager" ? "Manager" : user.role;
    const rolePerms = ROLE_PERMISSIONS[mappedRole as StaffRole];
    if (rolePerms && rolePerms[permissionKey]) return true;
    return Boolean(user.permissions && user.permissions[permissionKey]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        addresses,
        addressesLoading,
        addressesError,
        isLoading,
        isAdmin: isStaffRole(user?.role),
        isCustomer: isCustomerRole(user?.role),
        login,
        signup,
        forgotPassword,
        completePasswordReset,
        logout,
        updateProfile,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
