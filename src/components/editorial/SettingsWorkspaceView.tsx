import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsWorkspaceView() {
  const [preferredCurrency, setPreferredCurrency] = useState("ksh");
  const [activeVoiceEnforcement, setActiveVoiceEnforcement] = useState(true);
  const [quoteProtectionStrictness, setQuoteProtectionStrictness] = useState("strict");
  const [detectionSensitivity, setDetectionSensitivity] = useState(65);

  const handleSaveSettings = () => {
    toast.success("Amaica Newsroom editorial guidelines updated.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card rounded border border-border shadow-card p-5 space-y-1">
        <div className="label-eyebrow text-primary mb-0.5">Configuration · Newsroom Rules</div>
        <h2 className="text-xl font-bold font-display text-foreground">
          Amaica Newsroom Editorial Rules &amp; System Settings
        </h2>
        <p className="text-xs text-ink-light">
          Configure preferred terminology, headline standards, detection calibration, and fact locking strictness.
        </p>
      </div>

      <div className="bg-card rounded border border-border shadow-card p-6 space-y-6">
        {/* Preferred Terminology */}
        <div className="space-y-3 pb-4 border-b border-border">
          <h3 className="text-xs font-bold text-foreground font-mono-amaica uppercase tracking-wider">
            Preferred Local Terminology
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-foreground font-semibold block">Preferred Currency Symbol</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="ksh" className="bg-card text-foreground">Ksh (Kenyan Shillings)</option>
                <option value="kes" className="bg-card text-foreground">KES (ISO Standard)</option>
                <option value="shillings" className="bg-card text-foreground">Shillings</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-semibold block">Local Naming Conventions</label>
              <div className="p-2 bg-muted/40 border border-border rounded text-xs text-ink-mid">
                Standard: "Nairobi County", "Deputy President", "High Court"
              </div>
            </div>
          </div>
        </div>

        {/* Fact Locking Strictness */}
        <div className="space-y-3 pb-4 border-b border-border">
          <h3 className="text-xs font-bold text-foreground font-mono-amaica uppercase tracking-wider">
            Fact Locking &amp; Quote Protection
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activeVoiceEnforcement}
                onChange={(e) => setActiveVoiceEnforcement(e.target.checked)}
                className="rounded accent-primary"
              />
              <div>
                <span className="font-semibold text-foreground">Enforce Active Newsroom Attribution</span>
                <p className="text-ink-light">Converts passive phrases ('was stated by') into direct verbs ('told reporters').</p>
              </div>
            </label>

            <div className="space-y-1 pt-1">
              <label className="text-foreground font-semibold block">Quotation Protection Policy</label>
              <select
                value={quoteProtectionStrictness}
                onChange={(e) => setQuoteProtectionStrictness(e.target.value)}
                className="w-full sm:w-80 p-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="strict" className="bg-card text-foreground">Strict (Zero automated modifications inside quotes)</option>
                <option value="balanced" className="bg-card text-foreground">Balanced (Flag formatting differences only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Commercial Calibration Sensitivity */}
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground font-mono-amaica uppercase tracking-wider">
              Detection Calibration Sensitivity
            </h3>
            <span className="text-xs font-mono-amaica font-bold text-primary">{detectionSensitivity}% Threshold</span>
          </div>
          <div className="space-y-2 text-xs">
            <input
              type="range"
              min={30}
              max={90}
              value={detectionSensitivity}
              onChange={(e) => setDetectionSensitivity(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-light font-mono-amaica">
              <span>More Lenient (Fewer False Positives)</span>
              <span>Turnitin Academic Standard (65%)</span>
              <span>Strict Filter</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 bg-primary hover:bg-primary-mid text-primary-foreground text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
          >
            Save Newsroom Settings
          </button>
        </div>
      </div>
    </div>
  );
}
