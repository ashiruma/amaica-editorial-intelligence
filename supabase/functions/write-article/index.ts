import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchWithBackoff } from "../_shared/backoff.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_GUIDE = `You are a senior entertainment news writer for AMAICA MEDIA, a Western Kenya-focused entertainment publication. Follow this house style without exception.

THE FIVE LAWS:
1. Lead with the most important fact (the lede). Never bury it. The first sentence must answer "what happened?"
2. Every claim needs attribution. Use: said, confirmed, announced, told Amaica Media, according to.
3. Past tense for events that happened. Present tense for standing facts.
4. BURSTINESS & CADENCE (0% AI MANDATE): Never write uniform sentence lengths. Aggressively alternate sentence lengths: mix punchy 4–7 word sentences with medium 10–15 word sentences. Ensure at least 25% of all sentences are very short (under 6 words, e.g. "The event was virtual.", "Poets read live.", "The debut was a success.", "The stakes are high."). Never write more than two consecutive sentences of similar length.
5. Full name on first mention, last name after. "Sauti Sol" first, then "the group". Apply to every person and act.

STRUCTURE — INVERTED PYRAMID:
- Lede (1 sentence): what happened.
- Context paragraph: who, when, where.
- 1–2 direct quotes: emotion / opinion only — paraphrase facts.
- Body paragraphs: more detail, reaction.
- Background last (editors cut from the bottom).
- Answer the 5 Ws (Who, What, When, Where, Why) inside the first two paragraphs.

QUOTE RULE: Quote for emotion and opinion. Paraphrase for facts. Do not quote things you can say more efficiently yourself ("The show starts at 7 PM").

STYLE & LANGUAGE:
- Numbers: spell out one through nine; figures for 10+. Dates: "Saturday, June 14". Times: "7 PM". Currency: KSh.
- Titles: capitalize before a name (Director Jane Mwangi); lowercase after (Jane Mwangi, the festival director).
- Song/album titles in "quotes". Film/show titles in "quotes".
- Local anchor on first mention: "Bungoma-born comedian Mjango", "Nairobi-based producer X".
- Attribution verbs: said (default) · confirmed (verified) · told Amaica Media (exclusive) · announced (public declaration) · according to (other outlet/document) · alleged/claimed (unverified — sparingly).

ABSOLUTE BANS:
- NO trailing participial clauses (e.g. ", highlighting...", ", showcasing...", ", providing a platform...", ", offering practical guidance...", ", fostering...", ", ensuring...", ", underscoring...", ", confirming he is...", ", alleging that...", ", often causing...", ", having played a role..."). Split into separate, active sentences.
- NO formulaic AI social media declarations (e.g. "Taking to his official social media pages on Sunday...", "Taking to X (formerly Twitter)..."). Write direct human news: "[Person] posted online on Sunday: [quote/fact]."
- NO AI reaction clichés (e.g. "termed the reports as malicious and unfounded", "unwarranted panic and distress", "The clarification comes after", "urged Kenyans to verify information from credible sources before sharing").
- NO corporate PR or academic LLM clichés (e.g. "inaugural", "marks its foray into", "foster talent", "diverse programme tailored for", "broader audience", "central focus was", "navigate the industry", "landscape", "testament to", "delve into", "vibrant tapestry", "nestled in", "beacon of hope", "serves as a reminder", "is a new initiative from", "historically served as").
- NO hype words: amazing, incredible, stunning, slayed, shook, legendary king, absolutely.
- NO clickbait. NO emojis in the article body. NO copying source phrasing — rewrite from facts only.
- NO opinions presented as facts. NO vague time ("recently"). Be specific.
- NO unattributed quotes.

TEMPLATES & TARGET LENGTHS:
- breaking (350–550 words): [Artist/group] has [released/been announced/signed/performed] [what], [organization/spokesperson] confirmed [day]. Follow with immediate context, quote, background, reaction, what-it-means for fans, forward close.
- event_preview (500–800 words): [Event] returns to [location] on [date], featuring [headline act]. Lineup details, organizer quotes, ticket/venue logistics in KSh, local context, CTA close.
- profile (900–1400 words): Scene-setting lede, the angle (why now), artist backstory, recent milestones, direct quotes from subject and peers, cultural significance for Western Kenya / Kenyan entertainment scene, what's next.
- review (700–1100 words): Verdict-first lede, standout tracks or performances, production appraisal, highs and lows, comparative scene context, recommendation.

DEPTH REQUIREMENTS:
- Minimum 5–6 body paragraphs across the structured sections.
- Include at least TWO direct quotes with attribution ("…," said Jane Mwangi) where source supports them; otherwise paraphrase with attribution.
- Name specific venues (e.g. Carnivore, Alchemist, Kisumu Mega City, Kakamega Golf Club, Bukhungu), dates, ticket prices (KSh), and artists.
- NO filler or hallucinations. Expand on verified context, scene history, and audience impact.

STRUCTURE & FLOW (CONTINUOUS JOURNALISM — INVERTED PYRAMID):
- Do NOT use formulaic outline headings like "## Background", "## Key Details", "## Quotes", "## Why it matters", or "## Outlook". 
- Modern inverted-pyramid newsrooms weave background, official reactions, and broader significance naturally into continuous paragraphs.
- Paragraph 1 (Lede): Sharp, fact-first opening sentence answering who, what, where, when.
- Paragraph 2 (Immediate Context & Details): Developing facts, logistics, venues, figures, and dates.
- Paragraph 3 (Attributed Quotes & Reaction): At least two direct attributed quotes or public statements ("...," said Jane Mwangi) woven smoothly into the narrative.
- Paragraph 4 (Background & History): Historical context and scene background woven naturally without any "## Background" heading.
- Paragraph 5 (Regional Significance & Next Steps): Broader cultural/economic impact on Western Kenya / Kenyan entertainment industry and forward-looking outlook, concluding the piece smoothly.

The body field MUST be continuous journalistic prose across 5–6 well-developed paragraphs. Absolute ban on explicit markdown section headings ("## ").

COVERAGE PRIORITY: Western Kenya (Kakamega, Kisumu, Bungoma, Vihiga, Busia, Siaya, Homa Bay, Migori, Kisii, Eldoret) first, then national Kenyan, then East African / Pan-African.

SOURCES: Always return a sources[] array with the original wire URL plus any referenced links, with 2–4 factual bullet points.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    let apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    let authHeader = `Bearer ${GEMINI_API_KEY}`;
    let modelName = "gemini-1.5-flash";

    if (GEMINI_API_KEY) {
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      authHeader = `Bearer ${GEMINI_API_KEY}`;
      modelName = "gemini-1.5-flash";
    } else if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      authHeader = `Bearer ${OPENAI_API_KEY}`;
      modelName = "gpt-4o-mini";
    } else if (DEEPSEEK_API_KEY) {
      apiUrl = "https://api.deepseek.com/v1/chat/completions";
      authHeader = `Bearer ${DEEPSEEK_API_KEY}`;
      modelName = "deepseek-chat";
    } else {
      throw new Error("No AI API key configured (set GEMINI_API_KEY, OPENAI_API_KEY, or DEEPSEEK_API_KEY)");
    }

    const body = await req.json();
    const {
      source_title, source_excerpt, source_content, source_name, template_type, region,
      idempotency_key: clientKey, story_id, run_id,
    } = body;

    if (!source_title) throw new Error("Missing source_title");

    // Idempotency key: client-provided, else derive from story_id, else hash of source fields.
    const idempotency_key: string =
      (typeof clientKey === "string" && clientKey.trim()) ||
      (story_id ? `story:${story_id}` : `src:${(source_title || "").slice(0, 120)}:${(source_name || "")}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Cache hit: a prior successful attempt for this key — return its article without re-calling AI.
    const { data: priorSuccess } = await supabase
      .from("write_article_attempts")
      .select("article, attempt")
      .eq("idempotency_key", idempotency_key)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (priorSuccess?.article) {
      return new Response(JSON.stringify({
        success: true, article: priorSuccess.article, idempotency_key,
        retry: { attempts: priorSuccess.attempt ?? 1, cached: true },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine next attempt number for this key
    const { count: priorCount } = await supabase
      .from("write_article_attempts")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", idempotency_key);
    const startAttempt = (priorCount ?? 0) + 1;

    const userPrompt = `Rewrite this entertainment news lead in Amaica Media style.

SOURCE: ${source_name || "wire"}
REGION FOCUS: ${region || "national"}
REQUESTED TEMPLATE: ${template_type || "breaking"}

ORIGINAL HEADLINE: ${source_title}

ORIGINAL EXCERPT: ${source_excerpt || "(none)"}

FULL ARTICLE CONTENT:
${(source_content || source_excerpt || "").slice(0, 6000)}

Write a fresh, original Amaica Media article. Do NOT copy phrases from the source. Use only the FACTS to write a new piece following the Amaica style rules and inverted pyramid. Hit the target word range for the chosen template (e.g. 350-550 words for breaking news; 500-800 for event preview; 900-1400 for profiles). Include two attributed quotes where supported, background context, a "why it matters" section, and a forward-looking close.

Also produce social posts:
- WhatsApp Broadcast: 3-4 lines with bold headline (*Headline*), bulleted highlights, and CTA to read on amaicamedia.com
- Twitter/X: max 270 chars, punchy, 1-2 hashtags max
- Instagram: 3-4 short lines + 5 hashtags
- Facebook: 2-3 sentences, conversational, no hashtags

Return STRICT JSON only via the provided tool. The body MUST include the five mandatory headings (## Background, ## Key Details, ## Quotes, ## Why it matters, ## Outlook) in that exact order. Include sources[] with the wire URL and extracted notes used.`;

    const requestBody = JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: STYLE_GUIDE },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "publish_article",
            description: "Return the rewritten Amaica Media article and social posts",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "Sharp headline, max 80 chars, no clickbait" },
                lede: { type: "string", description: "First sentence answering 'what happened?'" },
                body: { type: "string", description: "Full article body in markdown. Starts with the lede as the opening paragraph, then MUST contain these five H2 headings in this exact order: '## Background', '## Key Details', '## Quotes', '## Why it matters', '## Outlook'. Each section has 1–3 paragraphs. Two attributed direct quotes in the Quotes section where the source supports them. Target the template word range." },
                category: { type: "string", enum: ["music", "film", "tv", "events", "celebrity", "culture", "gossip"] },
                template_used: { type: "string", enum: ["breaking", "event_preview", "profile", "review"] },
                whatsapp_post: { type: "string", description: "WhatsApp broadcast text with *bold* headlines and bullet points" },
                twitter_post: { type: "string" },
                instagram_post: { type: "string" },
                facebook_post: { type: "string" },
                sources: {
                  type: "array",
                  description: "Sources used. Include the original wire URL plus any URLs explicitly named in the content. For each, 2–4 short factual notes extracted from the source.",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      title: { type: "string" },
                      notes: { type: "array", items: { type: "string" } },
                    },
                    required: ["url", "title", "notes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["headline", "lede", "body", "category", "template_used", "twitter_post", "instagram_post", "facebook_post", "sources"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "publish_article" } },
    });

    let lastAttemptNum = startAttempt;
    const result = await fetchWithBackoff(
      apiUrl,
      {
        method: "POST",
        headers: { "Authorization": authHeader, "Content-Type": "application/json" },
        body: requestBody,
      },
      {
        maxAttempts: 4, baseMs: 1000, capMs: 8000,
        onRetry: async ({ attempt, status, delayMs, error }) => {
          const n = startAttempt + (attempt - 1);
          lastAttemptNum = n + 1;
          await supabase.from("write_article_attempts").insert({
            idempotency_key, run_id: run_id ?? null, story_id: story_id ?? null,
            attempt: n,
            status: status === 429 ? "rate_limited" : "error",
            http_code: status || null,
            error: error ?? null,
            retry_after_ms: delayMs,
            next_retry_at: new Date(Date.now() + delayMs).toISOString(),
            finished_at: new Date().toISOString(),
          });
        },
      },
    );
    const aiRes = result.response;
    if (!aiRes) {
      await supabase.from("write_article_attempts").insert({
        idempotency_key, run_id: run_id ?? null, story_id: story_id ?? null,
        attempt: lastAttemptNum, status: "error",
        http_code: result.lastStatus, error: result.lastError ?? "no response",
        finished_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({
        success: false, error: result.lastError ?? "AI gateway unreachable",
        idempotency_key, retry: { attempts: result.attempts, final_status: result.lastStatus, final_error: result.lastError },
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      await supabase.from("write_article_attempts").insert({
        idempotency_key, run_id: run_id ?? null, story_id: story_id ?? null,
        attempt: startAttempt + result.attempts - 1,
        status: aiRes.status === 429 ? "rate_limited" : "error",
        http_code: aiRes.status, error: errText.slice(0, 1000),
        finished_at: new Date().toISOString(),
      });
      const message = aiRes.status === 429
        ? "Rate limit reached. Please wait a moment and retry."
        : aiRes.status === 402
          ? "AI provider quota exceeded. Please check API billing and credits."
          : `AI gateway ${aiRes.status}`;
      return new Response(JSON.stringify({
        success: false, error: message, idempotency_key,
        retry: { attempts: result.attempts, final_status: aiRes.status, final_error: message },
      }), { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured output");

    const article = JSON.parse(toolCall.function.arguments);
    if (article.body) {
      article.body = article.body
        .replace(/([.!?])\s*(##+\s+[^\n]+)/g, "$1\n\n$2\n\n")
        .replace(/(^|\n)(##+\s+[^\n]+)(?!\n\n)/g, "$1$2\n\n");
    }

    await supabase.from("write_article_attempts").insert({
      idempotency_key, run_id: run_id ?? null, story_id: story_id ?? null,
      attempt: startAttempt + result.attempts - 1,
      status: "success", http_code: 200, article,
      finished_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true, article, idempotency_key,
      retry: { attempts: result.attempts, cached: false },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("write-article error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});