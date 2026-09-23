import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

import { isUserApprovedByAdmin } from "@/lib/accessRequests";

export type AppRole = "admin" | "editor" | "writer";

export interface LocalNewsroomUser {
  id: string;
  email: string;
  displayName: string;
  roles: AppRole[];
}

const LOCAL_STORAGE_KEY = "amaica_newsroom_user";

export const ADMIN_MASTER_PASSCODE = "Admin2026@Amaica";
export const DEFAULT_ADMIN_AUTHOR_UUID = "2d623b06-aaca-414a-a0f8-fd7f12e372c6";

export function verifyAdminPasscode(passcode: string): boolean {
  if (!passcode) return false;
  return passcode.trim() === ADMIN_MASTER_PASSCODE;
}

import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safeStorage";

export function isExplicitAdmin(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return (
    lower.includes("ashiruma") ||
    lower.includes("admin") ||
    lower.includes("amaica")
  );
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Check for an explicitly signed-in newsroom user (or localhost editorial admin)
  const checkLocalUser = (): LocalNewsroomUser | null => {
    try {
      const stored = safeGetItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.email) {
          // If stored ID is an old non-UUID format, auto-migrate to valid RFC4122 UUID
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id)) {
            parsed.id = DEFAULT_ADMIN_AUTHOR_UUID;
            try {
              safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            } catch {}
          }
          return parsed;
        }
      }

      // In local dev environment, initialize editorial admin session
      if (typeof window !== "undefined" && (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "" ||
        window.location.protocol === "file:"
      )) {
        const defaultAdmin: LocalNewsroomUser = {
          id: DEFAULT_ADMIN_AUTHOR_UUID,
          email: "ashiruma@amaicamedia.com",
          displayName: "Administrator",
          roles: ["admin", "editor"],
        };
        try {
          safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultAdmin));
        } catch {}
        return defaultAdmin;
      }

      return null;
    } catch {
      return null;
    }
  };

  const resolveRoles = (email?: string | null, dbRoles: AppRole[] = []): AppRole[] => {
    if (!email) return [];
    if (isExplicitAdmin(email)) {
      return ["admin", "editor"];
    }
    if (dbRoles.length > 0) return dbRoles;
    if (isUserApprovedByAdmin(email)) {
      return ["editor"];
    }
    return [];
  };

  useEffect(() => {
    // 1. Check if an existing local session exists
    const local = checkLocalUser();
    if (local) {
      const activeRoles = resolveRoles(local.email, local.roles);
      setUser({
        id: local.id,
        email: local.email,
        user_metadata: { display_name: local.displayName },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User);
      setRoles(activeRoles);
      setLoading(false);
    } else {
      setUser(null);
      setRoles([]);
    }

    // 2. Supabase auth listener
    let sub: any = null;
    try {
      const res = supabase.auth.onAuthStateChange((_event, sess) => {
        try {
          if (sess?.user) {
            setSession(sess);
            setUser(sess.user);
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", sess.user.id)
              .then(({ data }) => {
                const fetchedRoles = (data || []).map((r: { role: AppRole }) => r.role);
                setRoles(resolveRoles(sess.user.email, fetchedRoles));
              })
              .catch(() => {});
          } else {
            const fallback = checkLocalUser();
            if (fallback) {
              const activeRoles = resolveRoles(fallback.email, fallback.roles);
              setUser({
                id: fallback.id,
                email: fallback.email,
                user_metadata: { display_name: fallback.displayName },
                app_metadata: {},
                aud: "authenticated",
                created_at: new Date().toISOString(),
              } as unknown as User);
              setRoles(activeRoles);
            } else {
              setSession(null);
              setUser(null);
              setRoles([]);
            }
          }
        } catch { /* ignore */ }
      });
      sub = res.data;
    } catch { /* ignore */ }

    // 3. Initial session retrieval with robust catch
    try {
      supabase.auth.getSession()
        .then(({ data }) => {
          if (data?.session?.user) {
            setSession(data.session);
            setUser(data.session.user);
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", data.session.user.id)
              .then(({ data: rData }) => {
                const fetchedRoles = (rData || []).map((r: { role: AppRole }) => r.role);
                setRoles(resolveRoles(data.session.user.email, fetchedRoles));
              })
              .catch(() => {});
          } else {
            const fallback = checkLocalUser();
            if (fallback) {
              const activeRoles = resolveRoles(fallback.email, fallback.roles);
              setUser({
                id: fallback.id,
                email: fallback.email,
                user_metadata: { display_name: fallback.displayName },
                app_metadata: {},
                aud: "authenticated",
                created_at: new Date().toISOString(),
              } as unknown as User);
              setRoles(activeRoles);
            } else {
              setUser(null);
              setRoles([]);
            }
          }
        })
        .catch(() => {
          const fallback = checkLocalUser();
          if (fallback) {
            const activeRoles = resolveRoles(fallback.email, fallback.roles);
            setUser({
              id: fallback.id,
              email: fallback.email,
              user_metadata: { display_name: fallback.displayName },
              app_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            } as unknown as User);
            setRoles(activeRoles);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch {
      setLoading(false);
    }

    return () => {
      try {
        sub?.subscription?.unsubscribe();
      } catch {}
    };
  }, []);

  const signInAsLocal = (
    email = "admin@amaicamedia.com",
    role?: AppRole,
    displayName?: string
  ) => {
    const isAdminUser = isExplicitAdmin(email) || role === "admin";
    let assignedRoles: AppRole[] = [];
    if (isAdminUser) {
      assignedRoles = ["admin", "editor"];
    } else if (isUserApprovedByAdmin(email)) {
      assignedRoles = [role || "editor"];
    } else {
      assignedRoles = role === "admin" ? ["admin", "editor"] : [];
    }

    const localUser: LocalNewsroomUser = {
      id: DEFAULT_ADMIN_AUTHOR_UUID,
      email,
      displayName: displayName || (isAdminUser ? "Administrator" : email.split("@")[0]),
      roles: assignedRoles,
    };
    try {
      safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(localUser));
    } catch {}
    setUser({
      id: localUser.id,
      email: localUser.email,
      user_metadata: { display_name: localUser.displayName },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User);
    setRoles(assignedRoles);
  };

  const signInAsAdmin = (passcode: string, email = "admin@amaicamedia.com"): boolean => {
    if (!verifyAdminPasscode(passcode)) {
      return false;
    }
    signInAsLocal(email, "admin", "Administrator");
    return true;
  };

  const signOut = async () => {
    try {
      safeRemoveItem(LOCAL_STORAGE_KEY);
    } catch {}
    setUser(null);
    setSession(null);
    setRoles([]);
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  const isAdmin = Boolean(user && (roles.includes("admin") || isExplicitAdmin(user.email)));
  const isEditor = Boolean(user && (isAdmin || roles.includes("editor") || isUserApprovedByAdmin(user.email)));
  const isWriter = Boolean(user && (isEditor || roles.includes("writer")));

  return {
    session,
    user,
    roles,
    loading,
    isAuthenticated: Boolean(user),
    isEditor,
    isAdmin,
    isWriter,
    signInAsLocal,
    signInAsAdmin,
    signOut,
  };
}