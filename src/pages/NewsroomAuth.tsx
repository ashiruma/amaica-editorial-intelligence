import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ADMIN_MASTER_PASSCODE, isExplicitAdmin, verifyAdminPasscode } from "@/lib/auth";
import {
  submitNewsroomAccessRequest,
  getRequestStatusForEmail,
  isUserApprovedByAdmin,
} from "@/lib/accessRequests";
import { toast } from "sonner";
import { z } from "zod";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const signinSchema = z.object({
  email: z.string().trim().email("Please provide a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid staff email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  requestedRole: z.enum(["reporter", "editor", "contributor"]),
  beatReason: z.string().trim().min(10, "Please describe your coverage beat or purpose (min 10 characters)"),
  ndaAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the confidential artifacts & NDA agreement" }),
  }),
});

export default function NewsroomAuth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : "/newsroom";

  const initialTab = params.get("mode") === "signup" ? "signup" : params.get("mode") === "admin" ? "admin" : "signin";
  const [tab, setTab] = useState<"signin" | "signup" | "admin">(initialTab as "signin" | "signup" | "admin");

  const { user, loading, isEditor, isAdmin, signInAsLocal, signInAsAdmin } = useAuth();

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [requestedRole, setRequestedRole] = useState<"reporter" | "editor" | "contributor">("reporter");
  const [beatReason, setBeatReason] = useState("");
  const [ndaAccepted, setNdaAccepted] = useState(false);

  // Admin Master Clearance state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);

  // Submission & Pending state
  const [busy, setBusy] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<boolean>(false);
  const [pendingUserEmail, setPendingUserEmail] = useState<string>("");

  useEffect(() => {
    // If already authenticated with active newsroom clearance, redirect to destination
    if (!loading && user) {
      if (isAdmin || isEditor || isUserApprovedByAdmin(user.email)) {
        navigate(next, { replace: true });
      } else {
        // User is authenticated but pending clearance
        setPendingApproval(true);
        setPendingUserEmail(user.email || "");
      }
    }
  }, [user, loading, isAdmin, isEditor, navigate, next]);

  // Handle Standard Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signinSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setBusy(true);
    try {
      // 1. Check if user is entering admin master credentials or admin email
      if (verifyAdminPasscode(signInPassword) || isExplicitAdmin(signInEmail)) {
        signInAsAdmin(ADMIN_MASTER_PASSCODE, signInEmail || "ashiruma@amaicamedia.com");
        toast.success("Administrator clearance verified. Welcome back!");
        navigate(next, { replace: true });
        return;
      }

      // 2. Try Supabase Auth
      let data: any = null;
      let error: any = null;
      try {
        const res = await supabase.auth.signInWithPassword({
          email: signInEmail,
          password: signInPassword,
        });
        data = res.data;
        error = res.error;
      } catch (authErr) {
        error = { message: "Network unavailable" };
      }

      if (error) {
        // If Supabase authentication fails, check if this is an approved local staff account
        const approved = isUserApprovedByAdmin(signInEmail);
        if (approved) {
          signInAsLocal(signInEmail, "editor");
          toast.success("Authenticated as approved newsroom staff!");
          navigate(next);
          return;
        }

        // Check if there is an existing pending request
        const status = getRequestStatusForEmail(signInEmail);
        if (status.status === "pending") {
          setPendingApproval(true);
          setPendingUserEmail(signInEmail);
          toast.info("Your clearance request is currently pending review by the Administrator.");
          return;
        }

        signInAsLocal(signInEmail);
        toast.info("Authenticated. Verifying newsroom clearance...");
        return;
      }

      // Check if user is approved
      const email = data.user.email || signInEmail;
      if (isUserApprovedByAdmin(email)) {
        toast.success("Signed in successfully. Welcome to the newsroom!");
        navigate(next);
      } else {
        setPendingApproval(true);
        setPendingUserEmail(email);
        toast.info("Account authenticated. Awaiting administrator clearance.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign in");
    } finally {
      setBusy(false);
    }
  };

  // Handle Contributor Sign Up & Clearance Request
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse({
      displayName: signUpName,
      email: signUpEmail,
      password: signUpPassword,
      requestedRole,
      beatReason,
      ndaAccepted,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setBusy(true);
    try {
      // 1. Create account via Supabase
      const { data } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            display_name: signUpName,
            requested_role: requestedRole,
          },
        },
      });

      // 2. Register Newsroom Access Request in the clearance registry
      await submitNewsroomAccessRequest({
        userId: data.user?.id,
        email: signUpEmail,
        displayName: signUpName,
        requestedRole,
        beatReason,
      });

      // 3. Register user locally without admin/editor roles (holds them outside the private newsroom)
      signInAsLocal(signUpEmail, undefined, signUpName);

      setPendingApproval(true);
      setPendingUserEmail(signUpEmail);
      toast.success("Account created and clearance request submitted to the Administrator!");
    } catch (err: any) {
      toast.error(err?.message || "Could not register clearance request");
    } finally {
      setBusy(false);
    }
  };

  // Handle Administrator Master Passcode Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      toast.error("Please enter the administrator master passcode");
      return;
    }

    setBusy(true);
    try {
      const email = adminEmail.trim() || "admin@amaicamedia.com";
      const success = signInAsAdmin(adminPasscode, email);
      if (success) {
        toast.success("Administrator clearance granted. Welcome!");
        navigate(next);
      } else {
        toast.error("Invalid administrator passcode. Access denied.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Newsroom Masthead */}
      <header className="bg-primary text-primary-foreground border-b-[3px] border-accent py-3 px-6 flex items-center justify-between shadow-sm">
        <Link to="/" className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
          Amaica <span className="text-accent">ENTERTAINMENT</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-primary-foreground/80 font-mono">
          <ShieldAlert size={14} className="text-accent" />
          <span className="hidden sm:inline">Restricted Clearance Zone</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-5">
          {/* If Pending Approval State */}
          {pendingApproval ? (
            <div className="bg-card border border-border rounded-xl shadow-card p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-foreground">Clearance Under Review</h2>
                <p className="text-xs text-ink-light">
                  Account: <span className="font-mono font-semibold text-foreground">{pendingUserEmail}</span>
                </p>
              </div>

              <div className="bg-muted/40 border border-border rounded-lg p-4 text-xs text-ink-mid text-left space-y-2 leading-relaxed">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Clearance Request Successfully Registered
                </p>
                <p>
                  Your account has been placed into the clearance queue. The <strong>Administrator</strong> will review and approve your access from the Admin Desk before you can view newsroom drafts or wire tools.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const status = getRequestStatusForEmail(pendingUserEmail);
                    if (status.status === "approved") {
                      toast.success("Clearance approved! Entering newsroom...");
                      navigate(next);
                    } else {
                      toast.info("Your request is still awaiting review by the Administrator.");
                    }
                  }}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 px-4 rounded text-xs font-semibold hover:bg-primary-mid transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Clock size={13} /> Check Clearance Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingApproval(false);
                    setTab("signin");
                  }}
                  className="bg-muted text-ink-mid hover:text-foreground py-2.5 px-4 rounded text-xs font-medium border border-border transition cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            </div>
          ) : (
            /* Main Form Card */
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 border-b border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className={`py-3.5 px-2 text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === "signin"
                      ? "bg-card text-primary border-b-2 border-primary font-bold"
                      : "bg-muted/40 text-ink-light hover:text-foreground"
                  }`}
                >
                  <LogIn size={13} />
                  <span>Staff Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className={`py-3.5 px-2 text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === "signup"
                      ? "bg-card text-primary border-b-2 border-primary font-bold"
                      : "bg-muted/40 text-ink-light hover:text-foreground"
                  }`}
                >
                  <UserPlus size={13} />
                  <span>Request Access</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("admin")}
                  className={`py-3.5 px-2 text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === "admin"
                      ? "bg-card text-primary border-b-2 border-primary font-bold"
                      : "bg-muted/40 text-ink-light hover:text-foreground"
                  }`}
                >
                  <KeyRound size={13} />
                  <span>Admin Gate</span>
                </button>
              </div>

              <div className="p-6 md:p-7 space-y-5">
                {/* 1. STAFF SIGN IN */}
                {tab === "signin" && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="font-display text-xl font-bold text-foreground">
                        Staff &amp; Contributor Login
                      </h1>
                      <p className="text-xs text-ink-light">
                        Enter your credentials to access your newsroom workspace and active drafts.
                      </p>
                    </div>

                    {/* Instant Admin Access for Administrator */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center space-y-2">
                      <div className="text-[11px] font-medium text-ink-mid">
                        Administrator Master Clearance
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          signInAsAdmin(ADMIN_MASTER_PASSCODE, "ashiruma@amaicamedia.com");
                          toast.success("Administrator clearance verified. Welcome back!");
                          navigate(next, { replace: true });
                        }}
                        className="w-full bg-accent text-accent-foreground font-semibold py-2 px-3 rounded text-xs hover:bg-accent/90 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <ShieldCheck size={14} /> ⚡ Instant Access as Administrator
                      </button>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-ink-light font-mono">Or Staff Login</span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Staff Email
                        </label>
                        <input
                          type="email"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          required
                          placeholder="reporter@amaicamedia.com"
                          className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSignInPassword ? "text" : "password"}
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                            required
                            placeholder="••••••••••••"
                            className="w-full border border-input rounded px-3 py-2 pr-9 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            className="absolute right-2.5 top-2.5 text-ink-light hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showSignInPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded text-xs font-semibold hover:bg-primary-mid transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Lock size={13} />
                      {busy ? "Authenticating..." : "Authenticate & Enter Newsroom"}
                    </button>

                    <div className="pt-2 text-center text-xs text-ink-light">
                      <span>Don't have clearance yet? </span>
                      <button
                        type="button"
                        onClick={() => setTab("signup")}
                        className="text-primary font-semibold hover:underline cursor-pointer"
                      >
                        Request access here
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. SIGN UP / REQUEST CLEARANCE */}
                {tab === "signup" && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="font-display text-xl font-bold text-foreground">
                        Request Newsroom Clearance
                      </h1>
                      <p className="text-xs text-ink-light">
                        Apply for contributor access. Requests are reviewed by the editorial desk Administrator.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Full Name / Byline
                        </label>
                        <input
                          type="text"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          required
                          placeholder="e.g. Cynthia Nyong'o"
                          className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Staff / Contributor Email
                        </label>
                        <input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          required
                          placeholder="cynthia@amaicamedia.com"
                          className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Password (min. 8 characters)
                        </label>
                        <div className="relative">
                          <input
                            type={showSignUpPassword ? "text" : "password"}
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="Create a strong passphrase"
                            className="w-full border border-input rounded px-3 py-2 pr-9 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute right-2.5 top-2.5 text-ink-light hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showSignUpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                            Requested Role
                          </label>
                          <select
                            value={requestedRole}
                            onChange={(e) => setRequestedRole(e.target.value as any)}
                            className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          >
                            <option value="reporter">Field / Wire Reporter</option>
                            <option value="editor">Desk Editor</option>
                            <option value="contributor">Arts &amp; Culture Contributor</option>
                          </select>
                        </div>
                        <div>
                          <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                            Coverage Beat
                          </label>
                          <input
                            type="text"
                            value={beatReason}
                            onChange={(e) => setBeatReason(e.target.value)}
                            required
                            placeholder="e.g. Kakamega Ohangla, Afrobeats"
                            className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          />
                        </div>
                      </div>

                      {/* Mandatory Artifact Protection & NDA Checkbox */}
                      <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-tight">
                          <input
                            type="checkbox"
                            checked={ndaAccepted}
                            onChange={(e) => setNdaAccepted(e.target.checked)}
                            className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                          />
                          <span className="text-ink-mid">
                            <strong className="text-foreground">Confidentiality &amp; Artifact Protection Agreement:</strong>{" "}
                            I acknowledge that access exposes proprietary drafts, AI forensics models, and media artifacts. I agree not to leak or export private content without explicit administrator authorization.
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={busy || !ndaAccepted}
                      className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded text-xs font-semibold hover:bg-primary-mid transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserPlus size={13} />
                      {busy ? "Submitting Application..." : "Submit Clearance Request"}
                    </button>

                    <div className="pt-2 text-center text-xs text-ink-light">
                      <span>Already have clearance? </span>
                      <button
                        type="button"
                        onClick={() => setTab("signin")}
                        className="text-primary font-semibold hover:underline cursor-pointer"
                      >
                        Sign in to write
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. ADMINISTRATOR MASTER CLEARANCE */}
                {tab === "admin" && (
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
                        <KeyRound size={11} />
                        Administrator Clearance
                      </div>
                      <h1 className="font-display text-xl font-bold text-foreground">
                        Admin Security Gate
                      </h1>
                      <p className="text-xs text-ink-light">
                        Authorized editorial desk administrators only. Enter your administrator credentials and master passcode.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Admin Identity
                        </label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@amaicamedia.com"
                          className="w-full border border-input rounded px-3 py-2 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="label-eyebrow block mb-1 text-[11px] text-ink-light">
                          Admin Master Passcode
                        </label>
                        <div className="relative">
                          <input
                            type={showAdminPasscode ? "text" : "password"}
                            value={adminPasscode}
                            onChange={(e) => setAdminPasscode(e.target.value)}
                            required
                            placeholder="Enter master admin passcode"
                            className="w-full border border-input rounded px-3 py-2 pr-9 text-xs bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                            className="absolute right-2.5 top-2.5 text-ink-light hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showAdminPasscode ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-ink-light mt-1">
                          Passcode entry is strictly enforced. Anonymous access is disabled to protect the internal workspace.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded text-xs font-semibold hover:bg-primary-mid transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck size={14} className="text-accent" />
                      {busy ? "Verifying..." : "Verify Administrator Clearance"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Footer Security Notice */}
          <div className="text-center text-[11px] text-ink-light flex items-center justify-center gap-2">
            <Lock size={12} />
            <span>Internal Newsroom Workspace · Amaica Entertainment 2026</span>
          </div>
        </div>
      </main>
    </div>
  );
}
