import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application render error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleOpenNewsroom = () => {
    window.location.href = "/newsroom";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-card border border-border rounded-xl shadow-elevated p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                Amaica Editorial Intelligence
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Workspace Recovery Mode
              </h1>
              <p className="text-xs sm:text-sm text-ink-light max-w-sm mx-auto">
                A client render anomaly occurred. Your drafts, sources, and editorial sessions remain protected.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-muted/40 border border-border rounded p-3 text-left">
                <div className="text-[10px] font-mono text-ink-light uppercase mb-1">Diagnostic Detail:</div>
                <div className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded text-xs hover:bg-primary-mid transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw size={13} /> Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleOpenNewsroom}
                className="bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded text-xs hover:bg-accent/90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Open Newsroom
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="bg-muted text-ink-mid hover:text-foreground border border-border font-medium py-2.5 px-4 rounded text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home size={13} /> View Site
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
