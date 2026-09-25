/**
 * WireOps Desk: Live Newsroom Intelligence Monitor
 * Location: src/components/intelligence/LiveIntelligenceMonitor.tsx
 *
 * Real-time monitoring console for clustered wire stories, incoming signals,
 * source verification status, and Western Kenya regional feeds.
 *
 * Operational Standard: Zero-Emoji Workplace Standard
 */

import React, { useState } from "react";
import { StoryCluster } from "@/types/intelligence";
import {
  RegionalBeatFilter,
  RegionalLocation,
  RegionalBeat,
} from "./RegionalBeatFilter";
import { ClusterInspectorModal } from "./ClusterInspectorModal";
import {
  Radio,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  MapPin,
  TrendingUp,
  Layers,
} from "lucide-react";

interface LiveIntelligenceMonitorProps {
  clusters: StoryCluster[];
  onDraftCluster: (cluster: StoryCluster) => void;
  onRefresh?: () => void;
}

export const LiveIntelligenceMonitor: React.FC<LiveIntelligenceMonitorProps> = ({
  clusters,
  onDraftCluster,
  onRefresh,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<RegionalLocation>("all");
  const [selectedBeat, setSelectedBeat] = useState<RegionalBeat>("all");
  const [inspectingCluster, setInspectingCluster] = useState<StoryCluster | null>(null);

  // Filter clusters based on location and beat
  const filteredClusters = clusters.filter((c) => {
    // Location filter
    if (selectedLocation !== "all") {
      const countyLower = (c.county || "").toLowerCase();
      const townLower = (c.town || "").toLowerCase();
      const headlineLower = c.working_headline.toLowerCase();

      if (selectedLocation === "kakamega") {
        if (!countyLower.includes("kakamega") && !headlineLower.includes("kakamega")) {
          return false;
        }
      } else if (selectedLocation === "vihiga") {
        if (!countyLower.includes("vihiga") && !headlineLower.includes("vihiga")) return false;
      } else if (selectedLocation === "bungoma") {
        if (!countyLower.includes("bungoma") && !headlineLower.includes("bungoma")) return false;
      } else if (selectedLocation === "busia") {
        if (!countyLower.includes("busia") && !headlineLower.includes("busia")) return false;
      } else if (selectedLocation === "siaya") {
        if (!countyLower.includes("siaya") && !headlineLower.includes("siaya")) return false;
      } else if (selectedLocation === "national") {
        if (c.geographic_relevance_score > 85 && countyLower.includes("kakamega")) return false;
      }
    }

    // Beat filter
    if (selectedBeat !== "all") {
      if (c.category.toLowerCase() !== selectedBeat.toLowerCase()) {
        const text = `${c.working_headline} ${c.category}`.toLowerCase();
        if (selectedBeat === "transit" && !text.includes("matatu") && !text.includes("transit")) return false;
        if (selectedBeat === "agriculture" && !text.includes("sugar") && !text.includes("farm") && !text.includes("maize")) return false;
        if (selectedBeat === "governance" && !text.includes("assembly") && !text.includes("governor")) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Regional Beat Selector */}
      <RegionalBeatFilter
        selectedLocation={selectedLocation}
        selectedBeat={selectedBeat}
        onLocationChange={setSelectedLocation}
        onBeatChange={setSelectedBeat}
      />

      {/* Monitor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-primary animate-pulse" />
          <h3 className="font-display text-base font-bold tracking-tight">
            Live Wire Clusters ({filteredClusters.length})
          </h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Poll Updates
          </button>
        )}
      </div>

      {/* Cluster Grid */}
      {filteredClusters.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg text-muted-foreground">
          <Layers size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No story clusters found for the active regional filter.</p>
          <p className="text-xs mt-1">Adjust the jurisdiction or editorial beat above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClusters.map((cluster) => {
            const isVerified = cluster.status === "VERIFIED" || cluster.independent_source_count >= 3;
            return (
              <div
                key={cluster.id}
                className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {cluster.story_code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isVerified
                            ? "bg-green-500/10 text-green-600 border border-green-500/30"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                        }`}
                      >
                        {cluster.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <TrendingUp size={11} className="text-primary" />
                        {cluster.momentum_score}%
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="font-display text-sm font-bold leading-snug mb-2 line-clamp-2">
                    {cluster.working_headline}
                  </h4>

                  {/* Meta Details */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {cluster.primary_location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={11} />
                      {cluster.source_count} Outlets ({cluster.independent_source_count} Independent)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(cluster.last_signal_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInspectingCluster(cluster)}
                    className="text-xs px-2.5 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    Inspect Dossier
                  </button>
                  <button
                    onClick={() => onDraftCluster(cluster)}
                    className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-1 rounded hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <FileText size={12} />
                    Draft Article
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cluster Inspector Modal */}
      <ClusterInspectorModal
        cluster={inspectingCluster}
        isOpen={inspectingCluster !== null}
        onClose={() => setInspectingCluster(null)}
        onDraftArticle={onDraftCluster}
      />
    </div>
  );
};
