import { ReactNode, useState, useEffect } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ShieldAlert, ShieldCheck, Loader2, Send, Clock, KeyRound, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  getRequestStatusForEmail,
  submitNewsroomAccessRequest,
  type AccessRequest,
} from "@/lib/accessRequests";

interface RequireNewsroomAuthProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Route guard for Amaica Editorial Intelligence Newsroom.
 * Ensures the newsroom stays guarded: only the admin (ashiruma) has direct access.
 * All other contributors must request permission from the admin to enter.
 */
export function RequireNewsroomAuth({ children, requireAdmin = false }: RequireNewsroomAuthProps) {
  const { user, loading, isEditor, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const [requestedRole, setRequestedRole] = useState<"reporter" | "editor" | "contributor">("reporter");
  const [beatReason, setBeatReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestInfo, setRequestInfo] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    request?: AccessRequest;
  }>({ status: "none" });

  useEffect(() => {
    if (user?.email) {
      setRequestInfo(getRequestStatusForEmail(user.email));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="font-display font-bold text-lg text-foreground">Verifying Newsroom Credentials</div>
        <p className="text-xs text-muted-foreground mt-1">Securing Amaica Editorial Intelligence workspace...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated visitor to the dedicated newsroom authentication portal
    return <Navigate to={`/newsroom/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">Admin Clearance Required</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          This newsroom section is restricted exclusively to Administrator (ashiruma).
        </p>
        <a
          href="/newsroom"
          className="mt-6 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Return to Newsroom
        </a>
      </div>
    );
  }

  // If user is not the admin and does not have approved editor clearance
  if (!isEditor && !isAdmin) {
    const handleSubmitRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!beatReason.trim()) {
        toast.error("Please provide the beats or coverage reason for your access request");
        return;
      }
      setSubmitting(true);
      try {
        const req = await submitNewsroomAccessRequest({
          userId: user.id,
          email: user.email || "",
          displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Contributor",
          requestedRole,
          beatReason,
        });
        setRequestInfo({ status: "pending", request: req });
        toast.success("Permission request submitted to Admin (ashiruma)!");
      } catch (err) {
        toast.error("Failed to submit request");
      } finally {
        setSubmitting(false);
      }
    };

    const handleRecheck = () => {
      const status = getRequestStatusForEmail(user.email);
      setRequestInfo(status);
      if (status.status === "approved") {
        toast.success("Access approved! Reloading newsroom workspace...");
        window.location.reload();
      } else if (status.status === "pending") {
        toast.info("Your request is still pending review by Admin (ashiruma).");
      } else if (status.status === "rejected") {
        toast.error("Your access request was not approved by the Administrator.");
      } else {
        toast.info("No active request found. Please submit your request below.");
      }
    };

    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <header className="bg-primary text-primary-foreground border-b-[3px] border-accent py-3 px-6 flex items-center justify-between">
          <div className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
            Amaica <span className="text-accent">NEWSROOM</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary-foreground/80 font-mono hidden sm:inline">
              Signed in: {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-xs bg-primary-foreground/10 hover:bg-primary-foreground/20 px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-12 w-full">
          <div className="bg-card border border-border rounded-xl shadow-card p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7" />
              </div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                Proprietary Newsroom Clearance Required
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Confidential Artifact Protection Gate
              </h1>
              <p className="text-xs text-ink-light max-w-md mx-auto">
                Amaica Editorial Intelligence contains private drafts, proprietary Turnitin-grade AI models, and real-time wire pipelines. Access is strictly guarded to protect these artifacts. Anyone seeking access must request clearance from Administrator (<strong>ashiruma</strong>).
              </p>
            </div>

            {/* Current Request Status Banner */}
            {requestInfo.status === "pending" ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
                  <Clock size={14} className="animate-spin" /> Permission Request Pending Review
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  Your request to access the newsroom as a <strong>{requestInfo.request?.requestedRole || "contributor"}</strong> is currently awaiting approval from Administrator (<strong>ashiruma</strong>).
                </p>
                {requestInfo.request?.createdAt && (
                  <div className="text-[11px] text-amber-700/70 dark:text-amber-300/60 font-mono">
                    Submitted on: {new Date(requestInfo.request.createdAt).toLocaleString("en-KE")}
                  </div>
                )}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleRecheck}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition cursor-pointer"
                  >
                    Check Approval Status
                  </button>
                  <Link
                    to="/"
                    className="text-xs text-ink-light hover:text-foreground px-2 py-1.5 inline-flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Visit Public News Site
                  </Link>
                </div>
              </div>
            ) : requestInfo.status === "rejected" ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-destructive font-semibold text-xs uppercase tracking-wider">
                  <ShieldAlert size={14} /> Request Declined by Administrator
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your previous clearance request was declined. If you feel this is an error or need specialized access, please contact the administrator directly.
                </p>
              </div>
            ) : (
              /* Request Access Form */
              <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Your Account Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full bg-muted/60 border border-border rounded px-3 py-2 text-xs font-mono text-ink-mid cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Role Requested
                  </label>
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as any)}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="reporter">Staff Reporter / Writer (Drafting & Sourcing)</option>
                    <option value="editor">Contributing Editor (Reviews & Forensics)</option>
                    <option value="contributor">Freelance Cultural Contributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Beat Coverage / Access Justification
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={beatReason}
                    onChange={(e) => setBeatReason(e.target.value)}
                    placeholder="Describe the entertainment beats you will cover (e.g. Western Kenya live events, Benga & Ohangla artists, Nairobi nightlife)..."
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-ink-light focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !beatReason.trim()}
                  className="w-full bg-primary hover:bg-primary-mid text-primary-foreground font-semibold px-4 py-2.5 rounded text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Permission Request to Admin (ashiruma)
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-ink-light">
              <span>Are you the administrator?</span>
              <button
                onClick={() => {
                  signOut();
                  window.location.href = "/auth";
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Sign in as Admin (ashiruma)
              </button>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-ink-light border-t border-border">
          Amaica Editorial Intelligence · Strictly Guarded Newsroom
        </footer>
      </div>
    );
  }

  return <>{children}</>;
}
