import React from "react";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  PieChart,
  FileCheck,
} from "lucide-react";

export function ReportsWorkspaceView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded border border-border shadow-card p-5 space-y-1">
        <div className="label-eyebrow text-primary mb-0.5">Newsroom Intelligence · Analytics</div>
        <h2 className="text-xl font-bold font-display text-foreground">
          Newsroom Editorial Reports &amp; Analytics
        </h2>
        <p className="text-xs text-ink-light">
          Executive performance metrics covering articles analyzed, quality score trends, and editorial activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded border border-border p-4 shadow-card space-y-1">
          <span className="text-xs font-mono-amaica text-ink-light uppercase">Articles Analyzed (30d)</span>
          <div className="text-2xl font-bold text-foreground font-mono-amaica">142</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">↑ 18% vs prior month</span>
        </div>

        <div className="bg-card rounded border border-border p-4 shadow-card space-y-1">
          <span className="text-xs font-mono-amaica text-ink-light uppercase">Average Machine Signal</span>
          <div className="text-2xl font-bold text-primary font-mono-amaica">19.4%</div>
          <span className="text-[11px] text-ink-light">Industry benchmark: &lt; 25%</span>
        </div>

        <div className="bg-card rounded border border-border p-4 shadow-card space-y-1">
          <span className="text-xs font-mono-amaica text-ink-light uppercase">Fact Integrity Retention</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono-amaica">100.0%</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Zero unauthorized fact alterations</span>
        </div>

        <div className="bg-card rounded border border-border p-4 shadow-card space-y-1">
          <span className="text-xs font-mono-amaica text-ink-light uppercase">Average Editorial Quality</span>
          <div className="text-2xl font-bold text-foreground font-mono-amaica">87.6%</div>
          <span className="text-[11px] text-ink-light">High newsroom standards</span>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Common Editorial Issues */}
        <div className="lg:col-span-6 bg-card rounded border border-border shadow-card p-5 space-y-4">
          <h3 className="text-xs font-bold text-foreground font-mono-amaica uppercase tracking-wider">
            Most Common Flagged Issues
          </h3>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-foreground">
                <span>Formulaic Trailing Participials</span>
                <span className="font-mono-amaica">38%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "38%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium text-foreground">
                <span>Repetitive Sentence Openings</span>
                <span className="font-mono-amaica">27%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "27%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium text-foreground">
                <span>Robotic Connective Crutches ('Moreover')</span>
                <span className="font-mono-amaica">19%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "19%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium text-foreground">
                <span>Weak or Anonymous Attribution</span>
                <span className="font-mono-amaica">16%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "16%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Compliance */}
        <div className="lg:col-span-6 bg-card rounded border border-border shadow-card p-5 space-y-4">
          <h3 className="text-xs font-bold text-foreground font-mono-amaica uppercase tracking-wider">
            Desk Compliance Summary
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded border border-border">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Turnitin Commercial Compliance</span>
                <p className="text-[10px] text-ink-light">Under 25% academic risk threshold</p>
              </div>
              <span className="text-xs font-bold font-mono-amaica text-emerald-700 dark:text-emerald-400">97.2% Pass</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded border border-border">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Active Voice Inverted Pyramid</span>
                <p className="text-[10px] text-ink-light">Standard newsroom lead format</p>
              </div>
              <span className="text-xs font-bold font-mono-amaica text-primary">94.8% Pass</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded border border-border">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Local Regional Entities Preservation</span>
                <p className="text-[10px] text-ink-light">Kenyan currency, counties, locations</p>
              </div>
              <span className="text-xs font-bold font-mono-amaica text-emerald-700 dark:text-emerald-400">100.0% Pass</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
