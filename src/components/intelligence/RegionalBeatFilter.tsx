/**
 * WireOps Desk: Regional Beat Filter Component
 * Location: src/components/intelligence/RegionalBeatFilter.tsx
 *
 * Provides dedicated filtering for:
 * - Kakamega County (Primary Headquarters & Hub)
 * - Western Kenya (Vihiga, Bungoma, Busia, Siaya, Trans Nzoia, Nandi)
 * - National Kenyan Wire
 *
 * Beats:
 * - County Governance & Assembly
 * - Agriculture & Sugar Belt
 * - Infrastructure & Matatu Transit
 * - Culture & Traditional Sports
 * - Crime & Public Safety
 *
 * Operational Standard: Zero-Emoji Workplace Standard
 */

import React from "react";
import { MapPin, Filter, Check } from "lucide-react";

export type RegionalLocation =
  | "all"
  | "kakamega"
  | "vihiga"
  | "bungoma"
  | "busia"
  | "siaya"
  | "trans_nzoia"
  | "nandi"
  | "national";

export type RegionalBeat =
  | "all"
  | "governance"
  | "agriculture"
  | "transit"
  | "culture"
  | "crime";

interface RegionalBeatFilterProps {
  selectedLocation: RegionalLocation;
  selectedBeat: RegionalBeat;
  onLocationChange: (loc: RegionalLocation) => void;
  onBeatChange: (beat: RegionalBeat) => void;
}

const REGION_OPTIONS: Array<{ id: RegionalLocation; label: string; isPrimary?: boolean }> = [
  { id: "all", label: "All Regions" },
  { id: "kakamega", label: "Kakamega County (Primary)", isPrimary: true },
  { id: "vihiga", label: "Vihiga County" },
  { id: "bungoma", label: "Bungoma County" },
  { id: "busia", label: "Busia County" },
  { id: "siaya", label: "Siaya County" },
  { id: "trans_nzoia", label: "Trans Nzoia County" },
  { id: "nandi", label: "Nandi County" },
  { id: "national", label: "National Kenyan Wire" },
];

const BEAT_OPTIONS: Array<{ id: RegionalBeat; label: string }> = [
  { id: "all", label: "All Beats" },
  { id: "governance", label: "County Governance & Assembly" },
  { id: "agriculture", label: "Agriculture & Sugar Belt" },
  { id: "transit", label: "Infrastructure & Matatu Transit" },
  { id: "culture", label: "Culture & Traditional Sports" },
  { id: "crime", label: "Crime & Public Safety" },
];

export const RegionalBeatFilter: React.FC<RegionalBeatFilterProps> = ({
  selectedLocation,
  selectedBeat,
  onLocationChange,
  onBeatChange,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Western Kenya Regional Intelligence Desk
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Filter size={12} />
          <span>Active Geographic Filter</span>
        </div>
      </div>

      {/* County / Location Selector */}
      <div className="mb-3">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
          Jurisdiction
        </label>
        <div className="flex flex-wrap gap-1.5">
          {REGION_OPTIONS.map((reg) => {
            const active = selectedLocation === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => onLocationChange(reg.id)}
                className={`text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : reg.isPrimary
                    ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {active && <Check size={12} />}
                {reg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editorial Beat Selector */}
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
          Editorial Beat
        </label>
        <div className="flex flex-wrap gap-1.5">
          {BEAT_OPTIONS.map((beat) => {
            const active = selectedBeat === beat.id;
            return (
              <button
                key={beat.id}
                onClick={() => onBeatChange(beat.id)}
                className={`text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
                  active
                    ? "bg-secondary text-secondary-foreground font-semibold shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {active && <Check size={12} />}
                {beat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
