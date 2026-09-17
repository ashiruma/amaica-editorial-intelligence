import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RequireNewsroomAuthProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Route guard for Amaica Editorial Intelligence Newsroom.
 * Ensures unauthenticated public visitors cannot access internal newsroom tools,
 * drafts, scrapers, or AI intelligence studios.
 */
export function RequireNewsroomAuth({ children, requireAdmin = false }: RequireNewsroomAuthProps) {
  const { user, loading, isEditor, isAdmin } = useAuth();
  const location = useLocation();

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
    // Redirect unauthenticated visitor to the staff authentication portal
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">Admin Clearance Required</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          This newsroom section is restricted to Amaica Media executive editorial administrators.
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

  if (!isEditor && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">Editorial Access Restricted</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Your account does not have active editorial permissions. Contact the desk editor at editor@amaicamedia.com.
        </p>
        <a
          href="/"
          className="mt-6 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          View Public Site
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
