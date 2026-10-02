import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase, isSupabaseConfigured, dbService } from "../lib/supabase";
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
}

interface AuthContextType {
  user: UserProfile | null;
  addresses: UserAddress[];
  isLoading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; role?: UserRole; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  completePasswordReset: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  addAddress: (address: Omit<UserAddress, "id">) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
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

const DEFAULT_ADDRESSES: UserAddress[] = [
  {
    id: "addr-1",
    title: "Primary Residence",
    addressLine1: "Boutique Residence 42, Gulberg III",
    addressLine2: "Near M.M. Alam Road",
    city: "Lahore",
    postalCode: "54600",
    country: "Pakistan",
    isDefault: true,
  },
];

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

  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    const saved = localStorage.getItem("hm_auth_addresses");
    return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
  });

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

    if (profile) {
      role = (profile.role || "customer") as UserRole;
      status = (profile.status || "active").toLowerCase().trim();
      fullName = profile.full_name || fullName;
      phone = profile.phone;
    } else {
      if (isPrimaryAdmin(email)) {
        role = "super_admin";
        status = "active";
      } else if (sessionUser.user_metadata?.role && sessionUser.user_metadata.role !== "customer") {
        role = sessionUser.user_metadata.role as UserRole;
        status = "active";
      }
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
        isPrimaryAdmin: isPrimaryAdmin(email),
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

  useEffect(() => {
    localStorage.setItem("hm_auth_addresses", JSON.stringify(addresses));
  }, [addresses]);

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

  const addAddress = (addr: Omit<UserAddress, "id">) => {
    const newAddr: UserAddress = { ...addr, id: `addr-${Date.now()}` };
    if (addr.isDefault) {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: false })).concat(newAddr));
    } else {
      setAddresses((prev) => [...prev, newAddr]);
    }
  };

  const removeAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
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
