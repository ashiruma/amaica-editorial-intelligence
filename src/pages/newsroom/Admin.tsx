import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { Masthead } from "@/components/Masthead";
import { toast } from "sonner";
import { useMinWordCount, DEFAULT_MIN_WORD_COUNT } from "@/hooks/useNewsroomSettings";
import { ShieldCheck, ShieldAlert, Clock, Check, X, UserCheck } from "lucide-react";
import {
  getLocalRequests,
  approveAccessRequest,
  rejectAccessRequest,
  type AccessRequest,
} from "@/lib/accessRequests";

type UserRow = {
  user_id: string;
  display_name: string | null;
  roles: AppRole[];
};

const ROLES: AppRole[] = ["admin", "editor", "writer"];

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const { minWordCount, refresh: refreshSettings } = useMinWordCount();
  const [minWordInput, setMinWordInput] = useState<string>("");
  const [savingSetting, setSavingSetting] = useState(false);

  useEffect(() => { setMinWordInput(String(minWordCount)); }, [minWordCount]);

  const saveMinWordCount = async () => {
    const n = Number(minWordInput);
    if (!Number.isFinite(n) || n < 100 || n > 10000) {
      toast.error("Enter a number between 100 and 10000");
      return;
    }
    setSavingSetting(true);
    try {
      const { error } = await supabase
        .from("newsroom_settings")
        .upsert({ key: "min_word_count", value: n, updated_by: user?.id ?? null }, { onConflict: "key" });
      if (error) throw error;
      toast.success(`Minimum word count set to ${n}`);
      await refreshSettings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingSetting(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate("/newsroom", { replace: true });
      return;
    }
    void load();
  }, [user, isAdmin, loading, navigate]);

  // Hard gate: never render admin UI for non-admins (defense in depth — RLS already blocks data)
  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Masthead />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-ink-light">
          Verifying access…
        </main>
      </div>
    );
  }

  const load = async () => {
    try {
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const byUser = new Map<string, AppRole[]>();
      (roles || []).forEach((r) => {
        const arr = byUser.get(r.user_id) || [];
        arr.push(r.role as AppRole);
        byUser.set(r.user_id, arr);
      });
      setRows(
        (profiles || []).map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          roles: byUser.get(p.user_id) || [],
        }))
      );
    } catch (err) {
      console.warn("Could not query profiles or user_roles:", err);
    }
    loadRequests();
  };

  const loadRequests = () => {
    setRequests(getLocalRequests());
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string, email: string) => {
    await approveAccessRequest(id, user?.email || "ashiruma");
    toast.success(`Approved newsroom clearance for ${email}!`);
    loadRequests();
    await load();
  };

  const handleReject = async (id: string, email: string) => {
    await rejectAccessRequest(id);
    toast.info(`Declined clearance for ${email}`);
    loadRequests();
    await load();
  };

  const toggleRole = async (uid: string, role: AppRole, has: boolean) => {
    setBusy(true);
    try {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
        if (error) throw error;
        toast.success(`Removed ${role}`);
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
        if (error) throw error;
        toast.success(`Granted ${role}`);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="label-eyebrow text-primary mb-1">Newsroom Administration</div>
          <h1 className="font-display text-3xl mb-1">Access Clearances &amp; Roles</h1>
          <p className="text-sm text-ink-light">
            You are signed in as Administrator. Manage permissions and approve contributor access.
          </p>
        </div>

        {/* 1. Newsroom Access Requests Section */}
        <div className="bg-card border border-border rounded-lg shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary w-5 h-5" />
              <h2 className="font-display text-lg font-bold text-foreground">
                Newsroom Permission Requests
              </h2>
              {pendingRequests.length > 0 ? (
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {pendingRequests.length} Pending
                </span>
              ) : (
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  All Clear
                </span>
              )}
            </div>
            <p className="text-xs text-ink-light">
              Only contributors you approve here can access the newsroom workspace.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-light italic">
              No permission requests submitted yet. The newsroom remains strictly guarded.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-muted/30 border border-border rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-semibold text-foreground">{req.displayName}</span>
                      <span className="font-mono text-ink-light text-[11px]">({req.email})</span>
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                        {req.requestedRole}
                      </span>
                      {req.status === "pending" ? (
                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                          <Clock size={10} /> Pending Review
                        </span>
                      ) : req.status === "approved" ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                          <Check size={10} /> Approved
                        </span>
                      ) : (
                        <span className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                          <X size={10} /> Declined
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-mid">
                      <strong className="text-foreground">Coverage Beat:</strong> {req.beatReason}
                    </p>
                    <div className="text-[10px] text-ink-light font-mono">
                      Requested on: {new Date(req.createdAt).toLocaleString("en-KE")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status !== "approved" ? (
                      <button
                        onClick={() => handleApprove(req.id, req.email)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Check size={13} /> Approve Access
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReject(req.id, req.email)}
                        className="bg-muted hover:bg-destructive/10 hover:text-destructive border border-border px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <X size={13} /> Revoke Clearance
                      </button>
                    )}
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleReject(req.id, req.email)}
                        className="bg-muted hover:bg-muted/80 text-ink-mid px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Editorial Standards Section */}
        <div className="bg-card border border-border rounded p-4">
          <div className="label-eyebrow text-primary mb-2">Editorial standards</div>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-ink-light mb-1">Minimum article word count</label>
              <input
                type="number"
                min={100}
                max={10000}
                value={minWordInput}
                onChange={(e) => setMinWordInput(e.target.value)}
                className="w-32 text-sm bg-background border border-border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={saveMinWordCount}
              disabled={savingSetting || minWordInput === String(minWordCount)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary-mid disabled:opacity-50"
            >
              {savingSetting ? "Saving…" : "Save"}
            </button>
            <span className="text-[11px] text-ink-light">Default is {DEFAULT_MIN_WORD_COUNT}. Applies to editor checks and bulk preview.</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Member</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-4 py-2 font-medium capitalize text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.display_name || "—"}</div>
                    <div className="text-[11px] text-ink-light font-mono">{u.user_id.slice(0, 8)}…</div>
                  </td>
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r);
                    return (
                      <td key={r} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={has}
                          disabled={busy}
                          onChange={() => toggleRole(u.user_id, r, has)}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-light">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}