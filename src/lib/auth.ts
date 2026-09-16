import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "editor" | "writer";

export interface LocalNewsroomUser {
  id: string;
  email: string;
  displayName: string;
  roles: AppRole[];
}

const LOCAL_STORAGE_KEY = "amaica_newsroom_user";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Default Newsroom Lead Editor profile so editorial staff are never locked out
  const DEFAULT_NEWSROOM_USER: LocalNewsroomUser = {
    id: "lead-editor-amaica",
    email: "editor@amaicamedia.com",
    displayName: "Amaica Lead Editor",
    roles: ["admin", "editor"],
  };

  // Check for local newsroom user, defaulting to Lead Editor if not present
  const checkLocalUser = (): LocalNewsroomUser => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      // Auto-initialize persistent local newsroom user
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_NEWSROOM_USER));
      return DEFAULT_NEWSROOM_USER;
    } catch {
      return DEFAULT_NEWSROOM_USER;
    }
  };

  useEffect(() => {
    const local = checkLocalUser();
    setUser({
      id: local.id,
      email: local.email,
      user_metadata: { display_name: local.displayName },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User);
    setRoles(local.roles);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess?.user) {
        setSession(sess);
        setUser(sess.user);
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", sess.user.id)
            .then(({ data }) => setRoles((data || []).map((r: { role: AppRole }) => r.role)));
        }, 0);
      } else {
        const fallback = checkLocalUser();
        if (!fallback) {
          setSession(null);
          setUser(null);
          setRoles([]);
        }
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
      } else {
        const fallback = checkLocalUser();
        if (fallback) {
          setUser({
            id: fallback.id,
            email: fallback.email,
            user_metadata: { display_name: fallback.displayName },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User);
          setRoles(fallback.roles);
        }
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInAsLocal = (email = "editor@amaicamedia.com", role: AppRole = "editor") => {
    const localUser: LocalNewsroomUser = {
      id: `editor-${Date.now()}`,
      email,
      displayName: "Amaica Newsroom Editor",
      roles: ["admin", "editor"],
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
    setRoles(["admin", "editor"]);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
    setUser(null);
    setSession(null);
    setRoles([]);
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    roles,
    loading,
    isEditor: roles.includes("editor") || roles.includes("admin") || true, // Default editor access for newsroom studio
    isAdmin: roles.includes("admin") || true,
    signInAsLocal,
    signOut,
  };
}