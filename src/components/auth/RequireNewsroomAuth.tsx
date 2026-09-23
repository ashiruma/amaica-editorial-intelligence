import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  submitNewsroomAccessRequest,
  getRequestStatusForEmail,
  isUserApprovedByAdmin,
  type AccessRequest,
} from "@/lib/accessRequests";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface RequireNewsroomAuthProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RequireNewsroomAuth({ children, requireAdmin = false }: RequireNewsroomAuthProps) {
  const { user, loading, isEditor, isAdmin, signOut } = useAuth();

  // Permission request form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState<"reporter" | "editor" | "contributor">("contributor");
  const [beatReason, setBeatReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  // Status of request for current email
  const [requestInfo, setRequestInfo] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    request?: AccessRequest;
  }>({ status: "none" });

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      const status = getRequestStatusForEmail(user.email);
      setRequestInfo(status);
    }
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="font-display font-bold text-lg text-foreground">Opening Newsroom Workspace</div>
        <p className="text-xs text-muted-foreground mt-1">Securing Amaica Media newsroom...</p>
      </div>
    );
  }

  // 1. If requireAdmin is true, ensure user is administrator
  if (requireAdmin && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">Admin Clearance Required</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-md">
          This section is restricted to the Administrator. Enter your administrator master passcode to proceed.
        </p>
        <div className="flex gap-2 mt-5">
          <a
            href="/newsroom/auth?mode=admin"
            className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded text-xs hover:bg-primary-mid transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck size={14} /> Enter Admin Passcode
          </a>
          <a
            href="/newsroom"
            className="bg-muted text-ink-mid hover:text-foreground font-medium px-4 py-2 rounded text-xs border border-border transition"
          >
            Back to Newsroom
          </a>
        </div>
      </div>
    );
  }

  // 2. If user is authenticated and approved editor/admin, grant access
  if (user && (isEditor || isAdmin || isUserApprovedByAdmin(user.email))) {
    return <>{children}</>;
  }

  // 3. User is unauthenticated or not yet approved -> Render Permission Request Portal
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !beatReason.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!ndaAccepted) {
      toast.error("You must accept the confidentiality agreement.");
      return;
    }

    setSubmitting(true);
    try {
      const req = await submitNewsroomAccessRequest({
        userId: user?.id,
        email: email.trim(),
        displayName: name.trim(),
        requestedRole,
        beatReason,
      });
      setRequestInfo({ status: "pending", request: req });
      toast.success("Permission request submitted to the Administrator!");
    } catch {
      toast.error("Failed to submit clearance request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = () => {
    const status = getRequestStatusForEmail(email || user?.email);
    if (status.status === "approved") {
      toast.success("Access approved! Reloading newsroom workspace...");
      window.location.reload();
    } else if (status.status === "pending") {
      toast.info("Your request is still pending review by the Administrator.");
    } else if (status.status === "rejected") {
      toast.error("Your access request was declined by the Administrator.");
    } else {
      toast.info("No access request found for this email.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-primary text-primary-foreground border-b-[3px] border-accent py-3 px-6 flex items-center justify-between shadow-sm">
        <Link to="/" className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
          Amaica <span className="text-accent">MEDIA</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-primary-foreground/80 font-mono">
          <Lock size={13} className="text-accent" />
          <span>Private Newsroom Intelligence Desk</span>
        </div>
      </header>

      {/* Main Request Portal Card */}
      <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-xl shadow-elevated p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Newsroom Permission Portal
            </h1>
            <p className="text-xs text-ink-light max-w-md mx-auto leading-relaxed">
              This system is private and feeds <strong className="text-foreground">amaicamedia.com</strong>. Anyone seeking access must request permission from the Administrator.
            </p>
          </div>

          {requestInfo.status === "pending" ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Clock size={14} className="animate-spin" /> Permission Request Pending Review
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  Your request to access the newsroom as a <strong>{requestInfo.request?.requestedRole || "contributor"}</strong> is currently awaiting approval from the Administrator.
                </p>
                {requestInfo.request?.createdAt && (
                  <div className="text-[11px] text-amber-700/70 dark:text-amber-300/60 font-mono">
                    Submitted on: {new Date(requestInfo.request.createdAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded text-xs hover:bg-primary-mid transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Clock size={13} /> Check Approval Status
                </button>
                <button
                  type="button"
                  onClick={() => setRequestInfo({ status: "none" })}
                  className="bg-muted text-ink-mid hover:text-foreground font-medium py-2.5 px-4 rounded text-xs border border-border transition"
                >
                  Submit New Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">Full Name / Byline</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cynthia Nyong'o"
                    className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reporter@amaicamedia.com"
                    className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">Requested Role</label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as any)}
                      className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    >
                      <option value="contributor">Contributor</option>
                      <option value="reporter">Field Reporter</option>
                      <option value="editor">Desk Editor</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">Coverage Beat / Reason</label>
                    <input
                      type="text"
                      required
                      value={beatReason}
                      onChange={(e) => setBeatReason(e.target.value)}
                      placeholder="e.g. Kakamega Ohangla, Celeb Buzz"
                      className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="bg-muted/40 border border-border rounded-lg p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-tight">
                    <input
                      type="checkbox"
                      checked={ndaAccepted}
                      onChange={(e) => setNdaAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-ink-mid">
                      <strong className="text-foreground">Confidentiality Agreement:</strong> I acknowledge that access exposes proprietary drafts, AI forensics models, and unpublished media artifacts. I agree not to leak or export private content without explicit administrator authorization.
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !ndaAccepted}
                className="w-full bg-primary hover:bg-primary-mid text-primary-foreground font-semibold px-4 py-2.5 rounded text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit Permission Request to the Administrator
              </button>
            </form>
          )}

          {/* Administrator Clearance Gate Switch */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-ink-light flex-wrap gap-2">
            <span>Are you the administrator?</span>
            <a
              href="/newsroom/auth?mode=admin"
              className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck size={14} /> Administrator Clearance Gate <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-ink-light border-t border-border">
        Amaica Media · Private Newsroom Intelligence Desk
      </footer>
    </div>
  );
}
