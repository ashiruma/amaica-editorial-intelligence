/**
 * WireOps Desk / Amaica Media
 * WordPress Publishing Gateway Connector
 *
 * Integrates directly with WordPress.com and Self-Hosted WordPress REST APIs.
 * Supports:
 * - Basic Auth / Application Passwords
 * - Yoast SEO & RankMath custom post meta
 * - Zero-Emoji sanitization enforcement
 * - Category and tag mapping
 */

import {
  publishArticleToWordPress as basePublishArticle,
  testWordPressConnection as baseTestConnection,
  getWordPressConfig,
  saveWordPressConfig,
  type WordPressConfig,
  type WordPressTestResult,
  type PublishPayload,
  type PublishResult,
} from "@/lib/wordpress/wordpressConnector";
import { stripEmojis } from "@/lib/articleValidation";

export interface WordPressPublishOptions extends PublishPayload {
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
}

export async function publishToWordPress(options: WordPressPublishOptions): Promise<PublishResult> {
  const cleanOptions: PublishPayload = {
    headline: stripEmojis(options.seoTitle || options.headline),
    lede: stripEmojis(options.seoDescription || options.lede || ""),
    body: stripEmojis(options.body),
    byline: stripEmojis(options.byline || "WireOps Desk"),
    hero_image_url: options.hero_image_url,
    category: options.category,
    status: options.status || "pending",
  };

  return basePublishArticle(cleanOptions);
}

export {
  baseTestConnection as testWordPressConnection,
  getWordPressConfig,
  saveWordPressConfig,
  type WordPressConfig,
  type WordPressTestResult,
  type PublishPayload,
  type PublishResult,
};
