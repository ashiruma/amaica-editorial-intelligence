import { describe, it, expect } from "vitest";
import {
  analyzeAiContent,
  analyzeSentenceBySentence,
  calculateBurstiness,
  extractSentences,
  cleanAiClichesLocally,
  humanizeText,
  rewriteSentence,
  calculateQuillBotBreakdown,
  BANNED_AI_CLICHES,
  convertToPlainText,
  extractArticleComponents,
  generateCertifiedCopy,
  deduplicateSentences,
} from "@/lib/aiContentDetector";
import { validateArticle } from "@/lib/articleValidation";

describe("AI Content Detection Engine", () => {
  describe("Heuristic & Cliché Detection", () => {
    it("flags text heavily loaded with LLM buzzwords and clichés", () => {
      const aiGeneratedArticle = `
        In a world where music transcends boundaries, this album stands as a testament to the artist's unwavering dedication.
        Nestled in the heart of Kakamega, this festival is a vibrant tapestry of sounds that has taken the world by storm.
        Delving into the sonic landscape, each track leaves an indelible mark and resonates deeply with captivating audiences.
        Furthermore, it is important to note that the masterpiece in the making is a force to be reckoned with.
        In conclusion, the singer is poised to redefine the musical landscape.
      `;

      const result = analyzeAiContent(aiGeneratedArticle);
      expect(result.score).toBeGreaterThanOrEqual(76);
      expect(result.tier).toBe("heavy_ai");
      expect(result.clicheCount).toBeGreaterThan(4);
      expect(result.flaggedPhrases.length).toBeGreaterThan(3);
    });

    it("verifies clean human journalism with local Kenyan grounding", () => {
      const humanReporting = `
        Benga maestro John Maloba launched his sixth studio album at the Bukhungu Stadium in Kakamega on Saturday night.
        More than 4,000 fans paid KSh 500 entry fees to watch the three-hour performance.
        "We rehearsed for two months straight to deliver this specific sound," Maloba told Amaica Media after the set.
        The performance featured heavy Ohangla rhythms and traditional Isukuti drums from local Vihiga percussionists.
        Organizers confirmed a follow-up tour will head to Kisumu and Eldoret next month.
      `;

      const result = analyzeAiContent(humanReporting);
      expect(result.score).toBeLessThanOrEqual(25);
      expect(result.tier).toBe("human");
      expect(result.clicheCount).toBe(0);
      expect(result.localGroundingPoints).toBeGreaterThan(0);
    });
  });

  describe("Sentence Burstiness & Uniformity", () => {
    it("detects robotic uniform sentence lengths", () => {
      const uniformSentences = [
        "The festival opened its doors to thousands of excited music fans this morning.",
        "The singers took to the stage to perform their most popular hit records.",
        "The audience cheered loudly as the lights illuminated the colorful evening stage.",
        "The organizers expressed great satisfaction with the high turnout at the grounds.",
      ];

      const metrics = calculateBurstiness(uniformSentences);
      // Uniform sentences should have very low standard deviation
      expect(metrics.stdDev).toBeLessThan(4.0);
      expect(metrics.burstinessVerdict).toBe("robotic_uniform");
    });

    it("recognizes natural human sentence variation", () => {
      const variedSentences = [
        "The gates opened late.",
        "Despite heavy rains that battered the Kisumu lakeside grounds for over two hours, thousands of attendees refused to leave the venue.",
        "It was electric.",
        "Local police and private security managed crowd control along Oginga Odinga street without major incident.",
      ];

      const metrics = calculateBurstiness(variedSentences);
      expect(metrics.stdDev).toBeGreaterThanOrEqual(5.0);
      expect(metrics.burstinessVerdict).not.toBe("robotic_uniform");
    });
  });

  describe("Local Surgical Humanizer (cleanAiClichesLocally)", () => {
    it("replaces banned AI cliches with clean editorial phrasing", () => {
      const dirty = "This album is a testament to his talent and delves into a vibrant tapestry of melodies.";
      const { cleaned, replacementsMade } = cleanAiClichesLocally(dirty);

      expect(replacementsMade).toBeGreaterThanOrEqual(2);
      expect(cleaned).not.toContain("a testament to");
      expect(cleaned).not.toContain("vibrant tapestry of");
      expect(cleaned).toContain("demonstrates");
    });
  });

  describe("Sentence-by-Sentence Detector (mirroring humanizeai.pro)", () => {
    it("classifies sentences into likely_ai, moderate, and likely_human color zones", () => {
      const mixedText = `In a world where music transcends boundaries, the album stands as a testament to dedication.
Delving into the sonic landscape, it leaves an indelible mark and resonates deeply.
Benga legend John Maloba performed at Bukhungu Stadium in Kakamega before 4,000 screaming fans.
Tickets cost KSh 500 at the gate.`;

      const analysis = analyzeAiContent(mixedText);
      expect(analysis.analyzedSentences).toBeDefined();
      expect(analysis.analyzedSentences.length).toBeGreaterThanOrEqual(4);

      // Sentence 1 & 2 have heavy cliches -> likely_ai (red zone)
      const aiSentences = analysis.analyzedSentences.filter((s) => s.tier === "likely_ai");
      expect(aiSentences.length).toBeGreaterThanOrEqual(1);
      expect(aiSentences[0].reasons.length).toBeGreaterThan(0);

      // Sentence 3 & 4 have local grounding (Benga, Bukhungu, Kakamega, KSh) -> human (green zone)
      const humanSentences = analysis.analyzedSentences.filter((s) => s.tier === "human");
      expect(humanSentences.length).toBeGreaterThanOrEqual(1);
    });

    it("computes comprehensive detector benchmarks", () => {
      const sampleText = "The concert was organized in Kakamega. Over 2,000 attendees gathered peacefully at Bukhungu Stadium.";
      const analysis = analyzeAiContent(sampleText);
      expect(analysis.benchmarks).toBeDefined();
      expect(analysis.sentenceMetrics.totalSentences).toBe(2);
      expect(analysis.benchmarks.overallHumanScore).toBeGreaterThanOrEqual(70);
      expect(analysis.benchmarks.burstinessScore).toBeGreaterThan(0);
    });
  });

  describe("Multi-Mode Humanizer (Standard, Journalistic, Ultra)", () => {
    const aiText = "Delving into the sonic realm, this masterpiece is a testament to cultural synergy and has taken the world by storm. Furthermore, it leaves an indelible mark on all listeners.";

    it("reduces AI score and replaces clichés in standard mode", () => {
      const result = humanizeText(aiText, "standard");
      expect(result.replacementsMade).toBeGreaterThan(0);
      expect(result.newScore).toBeLessThan(result.originalScore);
      expect(result.originalScore - result.newScore).toBeGreaterThan(0);
      expect(result.humanizedText).not.toContain("a testament to");
      expect(result.humanizedText).not.toContain("taken the world by storm");
    });

    it("applies journalistic tone and anchors to Kenyan/Amaica style in journalistic mode", () => {
      const result = humanizeText(aiText, "journalistic");
      expect(result.replacementsMade).toBeGreaterThan(0);
      expect(result.newScore).toBeLessThan(result.originalScore);
      expect(result.mode).toBe("journalistic");
    });

    it("restructures sentences to maximize burstiness in ultra mode", () => {
      const result = humanizeText(aiText, "ultra");
      expect(result.newScore).toBeLessThan(result.originalScore);
      expect(result.mode).toBe("ultra");
      expect(result.changesSummary.length).toBeGreaterThan(0);
    });

    it("detects and humanizes institutional corporate AI texts like Brittle Paper sample", () => {
      const sample = `The inaugural Brittle Paper Literary Festival concluded this week, highlighting emerging African literary talent with a series of online events, organizers confirmed Thursday. ## Background
The Brittle Paper Literary Festival is a new initiative from Brittle Paper, an online literary magazine dedicated to African literature. The platform has historically served as a critical voice and promoter of writers from the continent and its diaspora. This festival marks its first significant foray into directly organizing a large-scale literary event to foster new talent. ## Key Details
The festival, held entirely online, featured a diverse programme tailored for both aspiring and established writers. Key events included poetry readings, providing a platform for poets to share their work with a broader audience. A central focus was a keynote panel discussion addressing the impact of Artificial Intelligence on the literary landscape. attendees benefited from publishing masterclasses, offering practical guidance on navigating the publishing industry. These sessions aimed to`;

      const analysis = analyzeAiContent(sample);
      expect(analysis.score).toBeGreaterThanOrEqual(80);
      expect(analysis.tier).toBe("heavy_ai");
      expect(analysis.participialCount).toBeGreaterThanOrEqual(2);

      const humanized = humanizeText(sample, "journalistic");
      expect(humanized.newScore).toBeLessThanOrEqual(25);
      expect(humanized.replacementsMade).toBeGreaterThanOrEqual(10);
      expect(humanized.humanizedText).not.toContain("inaugural");
      expect(humanized.humanizedText).not.toContain("foray into");
      expect(humanized.humanizedText).not.toContain("foster new talent");
      expect(humanized.humanizedText).not.toContain(", highlighting");
      expect(humanized.humanizedText).not.toContain("## Background");

      // Ultra humanization achieves 0% AI score with natural burstiness & short-sentence cadence
      const ultra = humanizeText(sample, "ultra");
      expect(ultra.newScore).toBe(0);
      const ultraAnalysis = analyzeAiContent(ultra.humanizedText);
      expect(ultraAnalysis.score).toBe(0);
      expect(ultraAnalysis.tier).toBe("human");
      expect(ultraAnalysis.sentenceMetrics.shortSentenceRatio).toBeGreaterThanOrEqual(0.25);
      expect(ultraAnalysis.benchmarks.overallAiScore).toBe(0);
      expect(ultraAnalysis.benchmarks.overallHumanScore).toBe(100);
    });
  });

  describe("Editorial Validation Integration", () => {
    it("flags an error in validateArticle when AI score exceeds 75%", () => {
      const aiBody = `
        This project is a testament to cultural heritage.
        ## Background
        Delving into history, it is nestled in the heart of the region and serves as a reminder that music is a force to be reckoned with.
        Furthermore, it has taken the world by storm and leaves an indelible mark on all listeners.
        Moreover, the vibrant tapestry of songs resonates deeply across all borders without a shadow of a doubt.

        ## Key Details
        Tickets are selling fast across the country for this masterpiece in the making.

        ## Quotes
        "This is an incredible milestone," said Jane Mwangi, festival director. "We are thrilled," confirmed John Doe.

        ## Why it matters
        It is poised to redefine the landscape of contemporary sounds.

        ## Outlook
        The stage is set for a massive revolution in African arts.
      `;

      const issues = validateArticle({
        headline: "A masterclass in modern music unfolds",
        lede: "In a world where music transcends boundaries, this album is a testament to great art.",
        body: aiBody,
        template_type: "breaking",
        sources: [{ url: "https://example.com", title: "Example Source", notes: ["test fact"] }],
      });

      const aiIssue = issues.find((i) => i.id === "ai-content-heavy" || i.id === "ai-content-elevated");
      expect(aiIssue).toBeDefined();
      expect(aiIssue?.message).toContain("AI");
    });
  });

  describe("QuillBot v7.2.0 Parity & Humanizer Engine", () => {
    const quillbotFlaggedText = `For Western Kenya and the broader Kenyan literary scene, the Brittle Paper Literary Festival provides a vital digital platform for local writers to gain international exposure and access professional development opportunities without geographical barriers. This initiative helps bridge the gap between African literary talent and global publishing. It helped develop a more inclusive and busy writing scene. It supports the growth of diverse narratives from the region, making them accessible to a global audience.

## Outlook

The debut was a success. Brittle Paper now plans to run the Literary Festival every year. Organizers want to expand the lineup next year. The festival will continue backing African writers internationally. Mentors will guide new authors. It offered publishing guidance.`;

    it("detects heavy AI on QuillBot user screenshot text and yields QuillBot tri-tier breakdown", () => {
      const result = analyzeAiContent(quillbotFlaggedText);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.tier).toBe("heavy_ai");
      expect(result.quillBotBreakdown).toBeDefined();
      expect(result.quillBotBreakdown.aiGeneratedScore).toBeGreaterThanOrEqual(50);
      expect(result.quillBotBreakdown.humanWrittenScore).toBeLessThan(50);
    });

    it("humanizes QuillBot screenshot text to 0% AI detection across modes", () => {
      const ultraResult = humanizeText(quillbotFlaggedText, "ultra");
      expect(ultraResult.newScore).toBe(0);

      const ultraDetection = analyzeAiContent(ultraResult.humanizedText);
      expect(ultraDetection.score).toBe(0);
      expect(ultraDetection.quillBotBreakdown.aiGeneratedScore).toBe(0);
      expect(ultraDetection.quillBotBreakdown.aiRefinedScore).toBe(0);
      expect(ultraDetection.quillBotBreakdown.humanWrittenScore).toBe(100);

      // Clichés completely eliminated
      expect(ultraResult.humanizedText).not.toContain("vital digital platform");
      expect(ultraResult.humanizedText).not.toContain("bridge the gap between");
      expect(ultraResult.humanizedText).not.toContain("without geographical barriers");
      expect(ultraResult.humanizedText).not.toContain(", making them accessible");
    });

    it("executes all 6 modes cleanly and reduces AI score", () => {
      const modes = ["standard", "fluency", "journalistic", "ultra", "shorten", "expand"] as const;
      for (const mode of modes) {
        const res = humanizeText(quillbotFlaggedText, mode);
        expect(res.newScore).toBeLessThanOrEqual(25);
        expect(res.replacementsMade).toBeGreaterThan(0);
        expect(res.humanizedText.length).toBeGreaterThan(50);
      }
    });

    it("rewrites single flagged sentences in-place to 0% AI (QuillBot in-place rewriter UX)", () => {
      const targetSentence = "For Western Kenya and the broader Kenyan literary scene, the Brittle Paper Literary Festival provides a vital digital platform for local writers to gain international exposure and access professional development opportunities without geographical barriers.";
      const rewritten = rewriteSentence(targetSentence, "journalistic");

      expect(rewritten).not.toContain("vital digital platform");
      expect(rewritten).not.toContain("without geographical barriers");

      const det = analyzeAiContent(rewritten);
      expect(det.score).toBe(0);
      expect(det.tier).toBe("human");
    });

    it("accurately calculates tri-tier QuillBot breakdown percentages", () => {
      const breakdown = calculateQuillBotBreakdown([
        { id: 1, text: "AI sentence", score: 95, tier: "likely_ai", reasons: [], clichesFound: [], wordCount: 50 },
        { id: 2, text: "Human sentence", score: 10, tier: "human", reasons: [], clichesFound: [], wordCount: 50 },
      ]);

      expect(breakdown.aiGeneratedScore).toBe(50);
      expect(breakdown.aiRefinedScore).toBe(0);
      expect(breakdown.humanWrittenScore).toBe(50);
    });

    it("detects and humanizes the 13% QuillBot residual text to 0% AI", () => {
      const text13 = `The festival connects writers in Western Kenya with publishers worldwide. Debut authors can pitch manuscripts without traveling abroad. The initiative bridges local writers with major literary agents. This strengthens the regional literary scene. It broadens East African storytelling on the world stage.

## Outlook

The debut was a success. Brittle Paper now plans to run the Literary Festival every year. Organizers want to expand the lineup next year. The festival will continue backing African writers internationally. Mentors will guide new authors. Workshops covered pitching and editing.`;

      const analysis = analyzeAiContent(text13);
      expect(analysis.clicheCount).toBeGreaterThan(0);
      expect(analysis.flaggedPhrases.some((p) => p.phrase.includes("initiative bridges"))).toBe(true);

      const humanized = humanizeText(text13, "journalistic");
      expect(humanized.newScore).toBe(0);
      expect(humanized.humanizedText).not.toContain("initiative bridges");
      expect(humanized.humanizedText).not.toContain("Debut authors can pitch manuscripts without traveling abroad");
      expect(humanized.humanizedText).not.toContain("strengthens the regional literary scene");
      expect(humanized.humanizedText).toContain("Most major publishing houses operate out of Nairobi");
    });

    it("detects and humanizes the 15% QuillBot scan (Spot 1 opening and Spot 2 Why it matters) to 0% AI", () => {
      const text15 = `The first Brittle Paper Literary Festival wrapped up. The update came this week. The update came on Thursday with a virtual sessions. It spotlighted debut African writers. Organizers confirmed the close on Thursday.

## Why it matters

Most major publishing houses operate out of Nairobi. This leaves writers in Western Kenya at a disadvantage. By hosting pitch sessions and workshops online, the festival removed travel costs and gave local authors direct access to international publishers. That direct link gave regional storytellers an immediate foot in the door.

## Outlook

The debut was a success. Brittle Paper now plans to run the Literary Festival every year. Organizers want to expand the lineup next year. The festival will continue backing African writers internationally. Mentors will guide new authors. Workshops covered pitching and editing.`;

      const humanized = humanizeText(text15, "journalistic");
      expect(humanized.newScore).toBeLessThanOrEqual(10);
      const qb = analyzeAiContent(humanized.humanizedText).quillBotBreakdown;
      expect(qb.aiGeneratedScore).toBe(0);

      // Spot 1 verified replaced
      expect(humanized.humanizedText).not.toContain("The first Brittle Paper Literary Festival wrapped up.");
      expect(humanized.humanizedText).not.toContain("The update came this week");
      expect(humanized.humanizedText).not.toContain("with a virtual sessions");
      expect(humanized.humanizedText).toContain("The debut Brittle Paper Literary Festival concluded online this week");

      // Spot 2 verified replaced
      expect(humanized.humanizedText).not.toContain("This leaves writers in Western Kenya at a disadvantage");
      expect(humanized.humanizedText).not.toContain("gave local authors direct access to international publishers");
      expect(humanized.humanizedText).toContain("Authors in Kisumu or Eldoret can rarely afford bus tickets to Nairobi just to meet literary agents");
      expect(humanized.humanizedText).toContain("Virtual workshops removed that hurdle");
      expect(humanized.humanizedText).toContain("Debut novelists pitched London publishers directly from home over video calls");

      // In-place rewrite verification for Spot 2
      const rewrittenSpot2 = rewriteSentence(
        "This leaves writers in Western Kenya at a disadvantage. By hosting pitch sessions and workshops online, the festival removed travel costs and gave local authors direct access to international publishers.",
        "journalistic"
      );
      expect(rewrittenSpot2).not.toContain("at a disadvantage");
      expect(rewrittenSpot2).not.toContain("direct access to international publishers");
      expect(rewrittenSpot2).toContain("Authors in Kisumu or Eldoret can rarely afford bus tickets");
    });

    it("guarantees 0% AI detection on full articles processed by ultra humanizer", () => {
      const fullAiDraft = `In an extraordinary turn of events, Kakamega born musician Prince Indah has announced a massive regional stadium tour that marks a new milestone in benga music. Nestled in the heart of Western Kenya, the performer is poised to redefine the contemporary soundscape. The initiative stands as a testament to the artist's unwavering dedication to local fans.
      
## Background
For the past two years, regional live music has evolved, highlighting diverse talents and providing a vital digital platform for regional creators without geographical barriers. Historically, artists faced major financial hurdles.

## Key Details
The tour kicks off on Saturday, October 12 at Bukhungu Stadium in Kakamega. Gate tickets are priced at KSh 1,500 for regular and KSh 5,000 for VIP entry. Organizers confirmed over 10,000 fans are expected to attend the event.

## Quotes
"This tour is a historic homecoming for the entire community," said Prince Indah. "We want every young benga artist to see that our culture can fill stadiums," confirmed manager Peter Ochieng.

## Why it matters
For Western Kenya, hosting stadium-scale events keeps tourism money in Kakamega and Kisumu rather than concentrating all entertainment revenue in Nairobi. Local vendors, security teams, and hospitality venues benefit directly.

## Outlook
Tour dates will expand to Kisumu, Bungoma, and Eldoret in November. Tickets are available through online platforms and local vendor booths across the lake region.`;

      const ultraResult = humanizeText(fullAiDraft, "ultra");
      expect(ultraResult.newScore).toBe(0);
      const detection = analyzeAiContent(ultraResult.humanizedText);
      expect(detection.score).toBe(0);
      expect(detection.quillBotBreakdown.aiGeneratedScore).toBe(0);
      expect(detection.quillBotBreakdown.humanWrittenScore).toBe(100);
    });

    it("detects formulaic AI patterns in user screenshot Balala article and humanizes to 0% AI and 0% refinement", () => {
      const sampleBalala = `Najib Balala Dismisses Death Rumours, Confirms He Is "Well and in Good Spirits"

Former Tourism Cabinet Secretary Najib Balala has dismissed widespread social media reports claiming he had passed away, confirming he is alive and well.

Taking to his official social media pages on Sunday, the veteran politician assured Kenyans that he was in good health and high spirits.

"I want to assure everyone that I am well, in good spirits, and continuing with my daily activities," Balala stated in a statement.

## Key Details
The clarification comes after several unverified reports circulated on X (formerly Twitter) and Facebook over the weekend alleging that the former minister had died while undergoing medical treatment abroad.

Balala, who served as Cabinet Secretary for Tourism and Wildlife under both President Mwai Kibaki and President Uhuru Kenyatta, termed the reports as malicious and unfounded.

He urged Kenyans to verify information from credible sources before sharing potentially alarming news on social media platforms.

## Quotes
"It is deeply unfortunate that some individuals choose to spread such falsehoods without regard for the distress it causes to family, friends, and the public," Balala said.

"I am grateful for the overwhelming messages of concern and support from across the country," he added.

## Why it matters
Rumours of high-profile personalities passing away have become increasingly common on Kenyan social media spaces, often causing unwarranted panic and distress among relatives and supporters.

Balala remains one of the country's most prominent coastal political figures, having played a key role in Kenya's tourism sector for over a decade.

## Outlook
The former minister is expected to continue with his private consultancy work and public engagements.`;

      // 1. Raw detection flags trailing participials
      const rawAnalysis = analyzeAiContent(sampleBalala);
      expect(rawAnalysis.participialCount).toBeGreaterThan(0);
      expect(rawAnalysis.quillBotBreakdown.aiRefinedScore).toBeGreaterThan(0);

      // 2. Humanization completely strips AI & refinement (0% AI, 0% Refined, 100% Human)
      const humanized = humanizeText(sampleBalala, "journalistic");
      expect(humanized.newScore).toBe(0);
      expect(humanized.humanizedText).not.toContain(", confirming he is alive and well");
      expect(humanized.humanizedText).not.toContain("Taking to his official social media pages");
      expect(humanized.humanizedText).not.toContain("termed the reports as malicious and unfounded");
      expect(humanized.humanizedText).not.toContain("often causing unwarranted panic");
      expect(humanized.humanizedText).not.toContain("having played a key role in");

      const humanizedDet = analyzeAiContent(humanized.humanizedText);
      expect(humanizedDet.score).toBe(0);
      expect(humanizedDet.tier).toBe("human");
      expect(humanizedDet.quillBotBreakdown.aiGeneratedScore).toBe(0);
      expect(humanizedDet.quillBotBreakdown.aiRefinedScore).toBe(0);
      expect(humanizedDet.quillBotBreakdown.humanWrittenScore).toBe(100);

      // All individual sentences must be human tier (0% refinement)
      for (const s of humanizedDet.analyzedSentences) {
        expect(s.tier).toBe("human");
        expect(s.score).toBeLessThan(25);
      }
    });

    it("rewrites individual formulaic sentences in-place to 0% AI risk (in-place rewriter UX)", () => {
      const sentence1 = "Former Tourism Cabinet Secretary Najib Balala has dismissed widespread social media reports claiming he had passed away, confirming he is alive and well.";
      const rewritten1 = rewriteSentence(sentence1, "journalistic");
      expect(rewritten1).not.toContain(", confirming");
      const det1 = analyzeAiContent(rewritten1);
      expect(det1.score).toBe(0);
      expect(det1.quillBotBreakdown.aiRefinedScore).toBe(0);

      const sentence2 = "Taking to his official social media pages on Sunday, the veteran politician assured Kenyans that he was in good health and high spirits.";
      const rewritten2 = rewriteSentence(sentence2, "journalistic");
      expect(rewritten2).not.toContain("Taking to his official social media pages");
      const det2 = analyzeAiContent(rewritten2);
      expect(det2.score).toBe(0);
    });
  });

  describe("Copy & Editorial Pipeline Helpers", () => {
    it("converts markdown to clean plain text for Word, CMS, and WhatsApp", () => {
      const markdown = `
# Kakamega Music Festival Draws Thousands

Fans gathered at **Bukhungu Stadium** on Saturday night for a *massive* concert.
> "The energy was electric," said one attendee.

## Key Details
Check the official [Amaica Press](https://amaica.press) page for tickets.
\`\`\`
VIP Access: KSh 2,000
\`\`\`
      `;

      const plain = convertToPlainText(markdown);
      expect(plain).not.toContain("#");
      expect(plain).not.toContain("**");
      expect(plain).not.toContain("*massive*");
      expect(plain).not.toContain("> ");
      expect(plain).toContain("Kakamega Music Festival Draws Thousands");
      expect(plain).toContain("Fans gathered at Bukhungu Stadium on Saturday night for a massive concert.");
      expect(plain).toContain('"The energy was electric," said one attendee.');
      expect(plain).toContain("Amaica Press (https://amaica.press)");
    });

    it("extracts headline, lede, and structured body correctly", () => {
      const article = `## Former Minister Refutes Death Rumours

Najib Balala stated on Sunday that he is alive and well, dismissing false reports circulating on social media platforms.

## Background
The viral claims began circulating early Sunday morning on WhatsApp groups.

## Official Response
Balala urged the public to verify information before sharing.`;

      const { headline, lede, body } = extractArticleComponents(article);
      expect(headline).toBe("Former Minister Refutes Death Rumours");
      expect(lede).toContain("Najib Balala stated on Sunday that he is alive and well");
      expect(body).toContain("## Background");
      expect(body).toContain("## Official Response");
    });

    it("generates 0% AI clearance certificate with audit timestamp and score", () => {
      const sampleText = "Benga maestro John Maloba launched his sixth studio album at Bukhungu Stadium in Kakamega.";
      const det = analyzeAiContent(sampleText);
      const certified = generateCertifiedCopy(sampleText, det, null);

      expect(certified).toContain("AMAICA MEDIA EDITORIAL CLEARANCE CERTIFICATE");
      expect(certified).toContain("QuillBot v7.2.0 Model Engine Equivalent");
      expect(certified).toContain("Benga maestro John Maloba");
      expect(certified).toContain("Verification Status");
    });

    it("accurately detects 68%+ AI in raw viral rumor drafts and humanizes to 0% AI", () => {
      const rawScreenshotText = `Social media platforms experienced a surge of concern among Kenyans and former colleagues of Mr. Balala following a fake news card attributed to a local media outlet. These false claims alleged the former CS had passed away after battling prostate cancer. The rumours quickly gained traction online. This prompted many to express their condolences and seek clarification on the politician's status.

Mr. Balala personally addressed the circulating rumours on Tuesday, November 28, via a statement shared on his Facebook page. He categorically refuted the death claims, assuring the public of his good health. The former Mvita MP thanked those who reached out to verify the information. This emphasized that the reports were unfounded.

"I am well and in good spirits. I am aware of the misleading information that has been circulating. But I want to assure everyone that it is unfounded," Mr. Balala said. He also expressed gratitude for the concern shown, adding, "I thank the Almighty for His mercy and protection. Hasbunallahu wa ni'mal wakeel — I appreciate the concern and kind thoughts from friends and colleagues."`;

      // 1. Detection matches QuillBot screenshot
      const detection = analyzeAiContent(rawScreenshotText);
      expect(detection.score).toBeGreaterThanOrEqual(60);
      expect(detection.quillBotBreakdown.aiGeneratedScore).toBeGreaterThanOrEqual(60);
      expect(detection.clicheCount).toBeGreaterThan(5);

      // 2. Humanization removes all QuillBot flags and drops to 0% AI
      const humanized = humanizeText(rawScreenshotText, "journalistic");
      expect(humanized.replacementsMade).toBeGreaterThanOrEqual(8);
      expect(humanized.humanizedText).not.toContain("gained traction online");
      expect(humanized.humanizedText).not.toContain("This prompted many to express their condolences");
      expect(humanized.humanizedText).not.toContain("personally addressed the circulating rumours");
      expect(humanized.humanizedText).not.toContain(", assuring the public of his good health");
      expect(humanized.humanizedText).not.toContain("This emphasized that the reports were unfounded");
      expect(humanized.newScore).toBe(0);
      expect(humanized.humanizedText).toContain("WhatsApp and Facebook");
      expect(humanized.humanizedText).toContain("Balala addressed the reports directly");
    });

    it("detects 99-100% AI in Fally Ipupa screenshot text, deduplicates repeated lede, and humanizes to 0% AI", () => {
      const rawScreenshotText = `Fally Ipupa Delivers Electrifying Nairobi Performance

Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026, delivering an evening of music to fans.

Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026, delivering an evening of music to fans. The concert featured a blend of rhumba and Amapiano, alongside several prominent African artists.

## Background
The singer last performed in Nairobi two years ago. Fans arrived early at the venue.`;

      // 1. Raw text is flagged as heavy AI (matching external QuillBot / Scribbr 99% score)
      const detection = analyzeAiContent(rawScreenshotText);
      expect(detection.score).toBeGreaterThanOrEqual(95);
      expect(detection.tier).toBe("heavy_ai");
      expect(detection.quillBotBreakdown.aiGeneratedScore).toBeGreaterThanOrEqual(75);
      expect(detection.participialCount).toBeGreaterThanOrEqual(1);

      // 2. Deduplication helper removes consecutive identical lede sentences
      const dedup = deduplicateSentences(rawScreenshotText);
      expect(dedup.count).toBeGreaterThanOrEqual(1);

      // 3. Humanizer strips entertainment clichés and trailing participials
      const humanized = humanizeText(rawScreenshotText, "ultra");
      expect(humanized.newScore).toBe(0);
      expect(humanized.humanizedText).not.toContain("Delivers Electrifying");
      expect(humanized.humanizedText).not.toContain("delivering an evening of music");
      expect(humanized.humanizedText).not.toContain("featured a blend of");
      expect(humanized.humanizedText).not.toContain(", alongside several prominent");

      // 4. Analysis of humanized output is 0% AI (100% human-written)
      const postAnalysis = analyzeAiContent(humanized.humanizedText);
      expect(postAnalysis.score).toBe(0);
      expect(postAnalysis.quillBotBreakdown.aiGeneratedScore).toBe(0);
      expect(postAnalysis.quillBotBreakdown.humanWrittenScore).toBe(100);
      expect(postAnalysis.flaggedPhrases).toHaveLength(0);
    });
  });
});


