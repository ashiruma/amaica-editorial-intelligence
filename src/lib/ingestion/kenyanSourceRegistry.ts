/**
 * WireOps Desk: Pre-Configured Kenyan News Source Registry
 * Location: src/lib/ingestion/kenyanSourceRegistry.ts
 *
 * Provides a structured directory of Kenyan news portals, regional county feeds,
 * regulatory bodies, and entertainment outlets with calibrated credibility tiers.
 *
 * Geographical Priority:
 * 1. Kakamega County (Primary Base)
 * 2. Western Kenya Regional (Vihiga, Bungoma, Busia, Siaya, Trans Nzoia, Nandi)
 * 3. National Kenyan Outlets
 */

import { SourceProfile, SourceCredibilityTier, GeographicScope } from "@/types/intelligence";

export const KENYAN_SOURCE_REGISTRY: Array<Omit<SourceProfile, "created_at" | "updated_at">> = [
  // ========================================================
  // WESTERN KENYA & KAKAMEGA (PRIMARY GEOGRAPHIC TIER)
  // ========================================================
  {
    id: "src-kakamega-county-portal",
    name: "Kakamega County Official Portal",
    domain: "kakamega.go.ke",
    homepage_url: "https://kakamega.go.ke",
    feed_url: "https://kakamega.go.ke/feed/",
    source_type: "government_portal",
    geography: "kakamega",
    primary_topics: ["county_governance", "agriculture", "infrastructure", "health"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.98,
    original_reporting_tendency: 0.95,
    syndication_tendency: 0.05,
    consecutive_failures: 0,
    is_active: true,
    admin_override_notes: "Primary Tier-1 official county authority for Kakamega.",
  },
  {
    id: "src-vihiga-county-portal",
    name: "Vihiga County Official Portal",
    domain: "vihiga.go.ke",
    homepage_url: "https://vihiga.go.ke",
    feed_url: "https://vihiga.go.ke/feed/",
    source_type: "government_portal",
    geography: "western_kenya",
    primary_topics: ["county_governance", "regional_development", "culture"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.96,
    original_reporting_tendency: 0.92,
    syndication_tendency: 0.08,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-bungoma-county-portal",
    name: "Bungoma County Official Portal",
    domain: "bungoma.go.ke",
    homepage_url: "https://bungoma.go.ke",
    feed_url: "https://bungoma.go.ke/feed/",
    source_type: "government_portal",
    geography: "western_kenya",
    primary_topics: ["county_governance", "agriculture", "sugar_industry"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.95,
    original_reporting_tendency: 0.90,
    syndication_tendency: 0.10,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-busia-county-portal",
    name: "Busia County Official Portal",
    domain: "busia.go.ke",
    homepage_url: "https://busia.go.ke",
    feed_url: "https://busia.go.ke/feed/",
    source_type: "government_portal",
    geography: "western_kenya",
    primary_topics: ["county_governance", "cross_border_trade", "fisheries"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.95,
    original_reporting_tendency: 0.90,
    syndication_tendency: 0.10,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-siaya-county-portal",
    name: "Siaya County Official Portal",
    domain: "siaya.go.ke",
    homepage_url: "https://siaya.go.ke",
    feed_url: "https://siaya.go.ke/feed/",
    source_type: "government_portal",
    geography: "western_kenya",
    primary_topics: ["county_governance", "lake_economy", "health"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.95,
    original_reporting_tendency: 0.90,
    syndication_tendency: 0.10,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-west-fm-kenya",
    name: "West FM Kenya",
    domain: "westfm.co.ke",
    homepage_url: "https://westfm.co.ke",
    feed_url: "https://westfm.co.ke/feed/",
    source_type: "rss",
    geography: "western_kenya",
    primary_topics: ["western_politics", "community", "culture", "bullfighting"],
    credibility_tier: "regional_established",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.88,
    original_reporting_tendency: 0.85,
    syndication_tendency: 0.15,
    consecutive_failures: 0,
    is_active: true,
  },

  // ========================================================
  // NATIONAL MAINSTREAM MEDIA (TIER 1)
  // ========================================================
  {
    id: "src-nation-africa",
    name: "Nation Africa",
    domain: "nation.africa",
    homepage_url: "https://nation.africa/kenya",
    feed_url: "https://nation.africa/kenya/rss",
    source_type: "rss",
    geography: "national",
    primary_topics: ["politics", "investigations", "business", "courts"],
    credibility_tier: "global_national_established",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.94,
    original_reporting_tendency: 0.92,
    syndication_tendency: 0.08,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-standard-media",
    name: "The Standard",
    domain: "standardmedia.co.ke",
    homepage_url: "https://www.standardmedia.co.ke",
    feed_url: "https://www.standardmedia.co.ke/rss/headlines.php",
    source_type: "rss",
    geography: "national",
    primary_topics: ["national_news", "opinion", "counties", "crime"],
    credibility_tier: "global_national_established",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.92,
    original_reporting_tendency: 0.89,
    syndication_tendency: 0.11,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-the-star",
    name: "The Star Kenya",
    domain: "the-star.co.ke",
    homepage_url: "https://www.the-star.co.ke",
    feed_url: "https://www.the-star.co.ke/rss",
    source_type: "rss",
    geography: "national",
    primary_topics: ["breaking_news", "politics", "corridors_of_power"],
    credibility_tier: "global_national_established",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.89,
    original_reporting_tendency: 0.84,
    syndication_tendency: 0.16,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-citizen-digital",
    name: "Citizen Digital",
    domain: "citizen.digital",
    homepage_url: "https://www.citizen.digital",
    feed_url: "https://www.citizen.digital/rss",
    source_type: "rss",
    geography: "national",
    primary_topics: ["broadcast_news", "wananchi_reporting", "politics"],
    credibility_tier: "global_national_established",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.93,
    original_reporting_tendency: 0.90,
    syndication_tendency: 0.10,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-capital-fm",
    name: "Capital FM Kenya",
    domain: "capitalfm.co.ke",
    homepage_url: "https://www.capitalfm.co.ke/news",
    feed_url: "https://www.capitalfm.co.ke/news/feed/",
    source_type: "rss",
    geography: "national",
    primary_topics: ["urban_news", "security", "business", "diplomacy"],
    credibility_tier: "global_national_established",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.90,
    original_reporting_tendency: 0.86,
    syndication_tendency: 0.14,
    consecutive_failures: 0,
    is_active: true,
  },

  // ========================================================
  // REGULATORY, JUDICIARY & OFFICIAL AUTHORITIES
  // ========================================================
  {
    id: "src-kenya-law-reports",
    name: "Kenya Law / Kenya Gazette",
    domain: "kenyalaw.org",
    homepage_url: "http://kenyalaw.org/kl/",
    feed_url: "http://kenyalaw.org/kl/rss",
    source_type: "government_portal",
    geography: "national",
    primary_topics: ["statutes", "gazette_notices", "court_rulings"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.99,
    original_reporting_tendency: 1.0,
    syndication_tendency: 0.0,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-dci-kenya",
    name: "Directorate of Criminal Investigations (DCI)",
    domain: "dci.go.ke",
    homepage_url: "https://www.dci.go.ke",
    feed_url: "https://www.dci.go.ke/feed/",
    source_type: "government_portal",
    geography: "national",
    primary_topics: ["crime", "forensics", "investigations", "arrests"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.97,
    original_reporting_tendency: 0.98,
    syndication_tendency: 0.02,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-eacc-kenya",
    name: "Ethics and Anti-Corruption Commission (EACC)",
    domain: "eacc.go.ke",
    homepage_url: "https://eacc.go.ke",
    feed_url: "https://eacc.go.ke/feed/",
    source_type: "government_portal",
    geography: "national",
    primary_topics: ["anti_corruption", "asset_recovery", "integrity"],
    credibility_tier: "official_source",
    manual_trust_status: "trusted",
    ai_confidence_score: 0.97,
    original_reporting_tendency: 0.98,
    syndication_tendency: 0.02,
    consecutive_failures: 0,
    is_active: true,
  },

  // ========================================================
  // ENTERTAINMENT & DIGITAL VIRAL PORTALS
  // ========================================================
  {
    id: "src-pulse-live-kenya",
    name: "Pulse Live Kenya",
    domain: "pulse.co.ke",
    homepage_url: "https://www.pulse.co.ke",
    feed_url: "https://www.pulse.co.ke/rss",
    source_type: "rss",
    geography: "national",
    primary_topics: ["entertainment", "celebrity", "lifestyle", "social_trends"],
    credibility_tier: "regional_established",
    manual_trust_status: "standard",
    ai_confidence_score: 0.78,
    original_reporting_tendency: 0.65,
    syndication_tendency: 0.35,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-mpasho",
    name: "Mpasho News",
    domain: "mpasho.co.ke",
    homepage_url: "https://mpasho.co.ke",
    feed_url: "https://mpasho.co.ke/feed",
    source_type: "rss",
    geography: "national",
    primary_topics: ["celebrity_gossip", "music", "lifestyle"],
    credibility_tier: "regional_established",
    manual_trust_status: "standard",
    ai_confidence_score: 0.72,
    original_reporting_tendency: 0.60,
    syndication_tendency: 0.40,
    consecutive_failures: 0,
    is_active: true,
  },
  {
    id: "src-tuko-news",
    name: "Tuko News",
    domain: "tuko.co.ke",
    homepage_url: "https://www.tuko.co.ke",
    feed_url: "https://www.tuko.co.ke/rss",
    source_type: "rss",
    geography: "national",
    primary_topics: ["viral_stories", "politics", "human_interest"],
    credibility_tier: "regional_established",
    manual_trust_status: "standard",
    ai_confidence_score: 0.74,
    original_reporting_tendency: 0.58,
    syndication_tendency: 0.42,
    consecutive_failures: 0,
    is_active: true,
  },
];

export class KenyanSourceRegistry {
  public static getAllSources() {
    return KENYAN_SOURCE_REGISTRY;
  }

  public static findByDomain(domain: string) {
    const clean = domain.toLowerCase().replace(/^www\./, "");
    return KENYAN_SOURCE_REGISTRY.find((s) => s.domain === clean);
  }

  public static getSourcesByGeography(geography: GeographicScope) {
    return KENYAN_SOURCE_REGISTRY.filter((s) => s.geography === geography);
  }

  public static getWesternKenyaSources() {
    return KENYAN_SOURCE_REGISTRY.filter(
      (s) => s.geography === "kakamega" || s.geography === "western_kenya"
    );
  }

  public static getOfficialSources() {
    return KENYAN_SOURCE_REGISTRY.filter((s) => s.credibility_tier === "official_source");
  }

  public static getCredibilityTier(domain: string): SourceCredibilityTier {
    const src = this.findByDomain(domain);
    return src ? src.credibility_tier : "unverified_source";
  }
}
