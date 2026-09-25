/**
 * WireOps Desk: Multi-Source Story Clustering Engine
 * Location: src/lib/clustering/storyClusteringEngine.ts
 *
 * Clusters incoming StorySignal leads into unified StoryCluster events.
 * Prevents fragmented duplicates, groups developing wire stories,
 * tracks editorial momentum, and dynamically calculates independent source counts.
 */

import { StorySignal, StoryCluster, StoryLifecycleStatus } from "@/types/intelligence";
import { KenyanEntityExtractor } from "./entityExtractor";
import { SyndicateDetector } from "./syndicateDetector";

export interface ClusterMatchResult {
  clusterId?: string;
  isNewCluster: boolean;
  matchScore: number;
  cluster: StoryCluster;
}

export class StoryClusteringEngine {
  private static readonly MATCH_THRESHOLD = 0.45;
  private static readonly TEMPORAL_WINDOW_HOURS = 36;

  /**
   * Main entry point: Adds a new StorySignal to an existing array of StoryClusters,
   * either merging into the best matching cluster or creating a new one.
   */
  public static clusterSignal(
    signal: StorySignal,
    existingClusters: StoryCluster[]
  ): ClusterMatchResult {
    let bestCluster: StoryCluster | undefined;
    let highestScore = 0;

    const signalEntities = KenyanEntityExtractor.extractEntities(
      `${signal.raw_title} ${signal.raw_text || ""}`
    );

    // Evaluate against each existing cluster
    for (const cluster of existingClusters) {
      const score = this.calculateClusterSimilarity(signal, signalEntities.canonicalNames, cluster);
      if (score > highestScore && score >= this.MATCH_THRESHOLD) {
        highestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Merge signal into existing cluster
      const updatedCluster = this.mergeSignalIntoCluster(signal, bestCluster);
      return {
        clusterId: updatedCluster.id,
        isNewCluster: false,
        matchScore: Math.round(highestScore * 100) / 100,
        cluster: updatedCluster,
      };
    }

    // Create new cluster
    const newCluster = this.createNewCluster(signal, signalEntities);
    return {
      clusterId: newCluster.id,
      isNewCluster: true,
      matchScore: 1.0,
      cluster: newCluster,
    };
  }

  /**
   * Calculates similarity between a signal and a cluster (0.0 to 1.0)
   */
  public static calculateClusterSimilarity(
    signal: StorySignal,
    signalCanonicalEntities: string[],
    cluster: StoryCluster
  ): number {
    // 1. Temporal Window Check (36 hours)
    const signalTime = new Date(signal.published_at || signal.detected_at).getTime();
    const clusterLastTime = new Date(cluster.last_signal_at).getTime();
    const hoursDiff = Math.abs(signalTime - clusterLastTime) / (1000 * 60 * 60);

    if (hoursDiff > this.TEMPORAL_WINDOW_HOURS) {
      return 0.0; // Out of temporal window
    }

    // 2. Aggregate text from cluster
    const clusterText = [
      cluster.working_headline,
      ...(cluster.signals || []).map((s) => `${s.raw_title} ${s.excerpt || ""}`),
    ].join(" ");

    // 3. Title & summary token similarity
    const signalTokens = this.tokenizeText(`${signal.raw_title} ${signal.excerpt || ""}`);
    const clusterTokens = this.tokenizeText(clusterText);
    const tokenSimilarity = this.calculateJaccardSimilarity(signalTokens, clusterTokens);

    // 4. Entity Overlap
    const clusterEntities = KenyanEntityExtractor.extractEntities(clusterText);
    const clusterEntitySet = new Set(clusterEntities.canonicalNames);

    let sharedEntities = 0;
    for (const entity of signalCanonicalEntities) {
      if (clusterEntitySet.has(entity)) {
        sharedEntities++;
      }
    }

    let entityScore = 0.0;
    if (sharedEntities >= 3) {
      entityScore = 0.90;
    } else if (sharedEntities === 2) {
      entityScore = 0.70;
    } else if (sharedEntities === 1) {
      entityScore = 0.35;
    }

    // 5. Geographic alignment bonus
    let geoBonus = 0.0;
    if (
      cluster.county &&
      signal.raw_text &&
      signal.raw_text.toLowerCase().includes(cluster.county.toLowerCase())
    ) {
      geoBonus = 0.15;
    }

    // Weighted composite score: 35% tokens, 50% entities, 15% geographic alignment
    const totalScore = tokenSimilarity * 0.35 + entityScore * 0.50 + geoBonus;

    return Math.min(1.0, totalScore);
  }

  /**
   * Merges a signal into an existing cluster, recalculating momentum and source counts.
   */
  private static mergeSignalIntoCluster(
    signal: StorySignal,
    cluster: StoryCluster
  ): StoryCluster {
    const existingSignals = cluster.signals || [];
    const updatedSignals = [...existingSignals, signal];

    // Calculate unique domains
    const uniqueDomains = new Set<string>();
    for (const sig of updatedSignals) {
      try {
        const domain = new URL(sig.external_url).hostname.replace(/^www\./, "");
        uniqueDomains.add(domain);
      } catch {
        uniqueDomains.add("unknown");
      }
    }

    // Calculate independent sources using SyndicateDetector
    const independentDomains = new Set<string>();
    for (const sig of updatedSignals) {
      const sigDomain = this.extractDomain(sig.external_url);
      const otherSignals = updatedSignals
        .filter((s) => s.id !== sig.id)
        .map((s) => ({
          domain: this.extractDomain(s.external_url),
          text: s.raw_text || "",
          title: s.raw_title,
        }));

      const independence = SyndicateDetector.analyzeSignalIndependence(
        sig.raw_text || sig.raw_title,
        sigDomain,
        otherSignals
      );

      if (independence.independenceScore >= 0.7) {
        independentDomains.add(sigDomain);
      }
    }

    // At least 1 independent source if signals exist
    const independentCount = Math.max(1, independentDomains.size);

    // Determine status transition if eligible
    let newStatus: StoryLifecycleStatus = cluster.status;
    if (cluster.status === "SIGNAL") {
      newStatus = "DEVELOPING";
    }
    if (independentCount >= 3 && (cluster.status === "SIGNAL" || cluster.status === "DEVELOPING")) {
      newStatus = "VERIFIED";
    }

    // Momentum score: increases with new signals and velocity
    const momentum = Math.min(100, cluster.momentum_score + 15);

    return {
      ...cluster,
      signal_count: updatedSignals.length,
      source_count: uniqueDomains.size,
      independent_source_count: independentCount,
      momentum_score: momentum,
      last_signal_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: newStatus,
      signals: updatedSignals,
    };
  }

  /**
   * Creates a new cluster from a solitary initial StorySignal
   */
  private static createNewCluster(
    signal: StorySignal,
    entityResult = KenyanEntityExtractor.extractEntities(signal.raw_title)
  ): StoryCluster {
    const now = new Date().toISOString();
    const clusterId = `cluster-${signal.content_hash.slice(0, 12)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const storyCode = `WOP-${new Date().getFullYear()}-${randomSuffix}`;

    return {
      id: clusterId,
      story_code: storyCode,
      working_headline: signal.raw_title,
      category: entityResult.transitBeatDetected ? "transit" : "community",
      primary_location: entityResult.primaryTown || entityResult.primaryCounty || "Kakamega",
      county: entityResult.primaryCounty || "Kakamega",
      town: entityResult.primaryTown || null,
      geographic_relevance_score: entityResult.isWesternKenyaFocus ? 95 : 60,
      momentum_score: 25,
      status: "SIGNAL",
      is_potential_exclusive: false,
      first_detected_at: signal.published_at || signal.detected_at || now,
      last_signal_at: signal.published_at || signal.detected_at || now,
      signal_count: 1,
      source_count: 1,
      independent_source_count: 1,
      created_at: now,
      updated_at: now,
      signals: [signal],
    };
  }

  private static tokenizeText(text: string): Set<string> {
    const stopWords = new Set(["the", "and", "in", "to", "of", "for", "on", "at", "by", "a", "an", "is", "was", "has", "have", "with"]);
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  }

  private static calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  private static extractDomain(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  }
}
