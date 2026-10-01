/**
 * WireOps Desk / Amaica Media
 * Unified Multi-Channel Publisher Service
 *
 * Coordinates:
 * 1. Pre-Flight Publishing Gatekeeper (6 non-negotiable checks).
 * 2. Multi-channel dispatch (WordPress REST API, Ghost Admin API, Webhook, Internal).
 * 3. Cryptographic publication audit logging with SHA-256 verification.
 * 4. Zero-Emoji workplace standard enforcement.
 */

import {
  validatePreFlight,
  PreFlightGateError,
  type PreFlightCheckResult,
  type PreFlightInput,
  type SeniorEditorOverride,
} from "./preflightGatekeeper";
import {
  logPublicationAudit,
  type PublicationAuditRecord,
} from "./publicationAuditLogger";
import { publishToWordPress, type WordPressPublishOptions } from "./connectors/wordpressConnector";
import { publishToGhost, type GhostPublishPayload } from "./connectors/ghostConnector";
import { dispatchToWebhook, type WebhookPublishPayload } from "./connectors/webhookPublisher";
import { stripEmojis } from "@/lib/articleValidation";

export type DistributionChannel = "wordpress" | "ghost" | "webhook" | "internal";

export interface PublishArticleRequest {
  article: {
    id: string;
    headline: string;
    lede?: string | null;
    body: string;
    byline?: string | null;
    category?: string | null;
    region?: string | null;
    hero_image_url?: string | null;
    template_type?: string;
    min_word_count?: number;
    tags?: string[];
    sources?: any[];
  };
  channel: DistributionChannel;
  user: {
    id: string;
    displayName?: string;
    roles: string[];
  };
  verificationStatus?: string;
  plagiarismScore?: number | null;
  aiConsensusScore?: number | null;
  isHumanCertified?: boolean;
  seniorEditorOverride?: SeniorEditorOverride | null;
  channelOptions?: {
    wordpressStatus?: "pending" | "draft" | "publish";
    ghostStatus?: "draft" | "published" | "scheduled";
    seoTitle?: string;
    seoDescription?: string;
  };
}

export interface PublishArticleResponse {
  success: boolean;
  channel: DistributionChannel;
  postUrl?: string;
  postId?: string;
  auditRecord: PublicationAuditRecord;
  preflightSnapshot: PreFlightCheckResult;
  error?: string;
}

export class PublisherService {
  /**
   * Publishes an article after strictly passing all 6 pre-flight gatekeeper checks.
   */
  public static async publish(request: PublishArticleRequest): Promise<PublishArticleResponse> {
    // 1. Run Pre-Flight Gatekeeper
    const preflightInput: PreFlightInput = {
      article: request.article,
      user: request.user,
      verificationStatus: request.verificationStatus,
      plagiarismScore: request.plagiarismScore,
      aiConsensusScore: request.aiConsensusScore,
      isHumanCertified: request.isHumanCertified,
      seniorEditorOverride: request.seniorEditorOverride,
    };

    const preflightSnapshot = validatePreFlight(preflightInput);

    if (!preflightSnapshot.passed) {
      throw new PreFlightGateError(preflightSnapshot);
    }

    // 2. Strict Zero-Emoji Sanitization (Defense-in-depth)
    const cleanHeadline = stripEmojis(request.article.headline);
    const cleanLede = stripEmojis(request.article.lede || "");
    const cleanBody = stripEmojis(request.article.body);
    const cleanByline = stripEmojis(request.article.byline || "WireOps Desk");

    let postUrl: string | undefined;
    let postId: string | undefined;

    // 3. Dispatch to requested channel
    if (request.channel === "wordpress") {
      const wpResult = await publishToWordPress({
        headline: cleanHeadline,
        lede: cleanLede,
        body: cleanBody,
        byline: cleanByline,
        hero_image_url: request.article.hero_image_url,
        category: request.article.category,
        tags: request.article.tags,
        seoTitle: request.channelOptions?.seoTitle,
        seoDescription: request.channelOptions?.seoDescription,
        status: request.channelOptions?.wordpressStatus || "pending",
      });

      if (!wpResult.success) {
        throw new Error(wpResult.error || "WordPress publication dispatch failed.");
      }
      postUrl = wpResult.post_url;
      postId = wpResult.post_id;
    } else if (request.channel === "ghost") {
      const ghostResult = await publishToGhost({
        headline: cleanHeadline,
        lede: cleanLede,
        body: cleanBody,
        byline: cleanByline,
        hero_image_url: request.article.hero_image_url,
        tags: request.article.tags,
        status: request.channelOptions?.ghostStatus || "draft",
      });

      if (!ghostResult.success) {
        throw new Error(ghostResult.error || "Ghost CMS publication dispatch failed.");
      }
      postUrl = ghostResult.post_url;
      postId = ghostResult.post_id;
    } else if (request.channel === "webhook") {
      const webhookResult = await dispatchToWebhook({
        articleId: request.article.id,
        headline: cleanHeadline,
        lede: cleanLede,
        body: cleanBody,
        byline: cleanByline,
        category: request.article.category,
        region: request.article.region,
        hero_image_url: request.article.hero_image_url,
        publishedAt: new Date().toISOString(),
      });

      if (!webhookResult.success) {
        throw new Error(webhookResult.error || "Webhook publication dispatch failed.");
      }
      postUrl = webhookResult.post_url;
    } else {
      // Internal distribution channel
      postUrl = `/newsroom/published#${request.article.id}`;
      postId = request.article.id;
    }

    // 4. Record Cryptographic Audit Trail
    const auditRecord = await logPublicationAudit({
      articleId: request.article.id,
      headline: cleanHeadline,
      editorId: request.user.id,
      editorRole: request.user.roles.join(", ") || "editor",
      destinationChannel: request.channel,
      destinationUrl: postUrl,
      preflightSnapshot,
      articleContent: {
        headline: cleanHeadline,
        lede: cleanLede,
        body: cleanBody,
        byline: cleanByline,
      },
    });

    return {
      success: true,
      channel: request.channel,
      postUrl,
      postId,
      auditRecord,
      preflightSnapshot,
    };
  }
}
