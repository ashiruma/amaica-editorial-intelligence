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

export function isExplicitAdmin(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return lower.includes("ashiruma") || lower === "admin@amaicamedia.com";
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Check for an explicitly signed-in newsroom user (never auto-generate for anonymous public readers)
  const checkLocalUser = (): LocalNewsroomUser | null => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.email) return parsed;
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
    } else {
      setUser(null);
      setRoles([]);
    }

    // 2. Supabase auth listener
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
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
          });
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
    });

    // 3. Initial session retrieval
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .then(({ data: rData }) => {
            const fetchedRoles = (rData || []).map((r: { role: AppRole }) => r.role);
            setRoles(resolveRoles(data.session.user.email, fetchedRoles));
          });
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
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInAsLocal = (
    email = "ashiruma@amaicamedia.com",
    role?: AppRole,
    displayName?: string
  ) => {
    const isAdminUser = isExplicitAdmin(email);
    let assignedRoles: AppRole[] = [];
    if (isAdminUser) {
      assignedRoles = ["admin", "editor"];
    } else if (isUserApprovedByAdmin(email)) {
      assignedRoles = [role || "editor"];
    } else {
      assignedRoles = role === "admin" ? ["admin", "editor"] : [];
    }

    const localUser: LocalNewsroomUser = {
      id: `staff-${Date.now()}`,
      email,
      displayName: displayName || (isAdminUser ? "ashiruma (Admin)" : email.split("@")[0]),
      roles: assignedRoles,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localUser));
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

  const signOut = async () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
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
    signOut,
  };
}