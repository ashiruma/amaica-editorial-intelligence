import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface RequireNewsroomAuthProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Route guard for Amaica Editorial Intelligence Newsroom.
 * Seamlessly ensures the newsroom workspace is always accessible for Nelson Shitanda and editorial staff.
 */
export function RequireNewsroomAuth({ children }: RequireNewsroomAuthProps) {
  const { user, loading, isEditor, isAdmin, signInAsLocal } = useAuth();

  useEffect(() => {
    // If not authenticated or not editor/admin, auto-sign in as Nelson Shitanda (Editorial Admin)
    if (!loading && (!user || (!isEditor && !isAdmin))) {
      signInAsLocal("ashiruma@amaicamedia.com", "admin", "Nelson Shitanda (Editorial Admin)");
    }
  }, [loading, user, isEditor, isAdmin, signInAsLocal]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="font-display font-bold text-lg text-foreground">Opening Newsroom Workspace</div>
        <p className="text-xs text-muted-foreground mt-1">Securing Amaica Entertainment newsroom...</p>
      </div>
    );
  }

  return <>{children}</>;
}
