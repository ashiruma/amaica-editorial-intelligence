import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Award,
  Users,
  Eye,
  Scale,
  Lock,
  AlertTriangle,
  Bot,
  Radio,
  Globe,
  Share2,
  Tv,
  CheckSquare,
  Square,
  BookOpen,
  Calendar,
  Building,
  Check,
  Ban,
  FileText,
  AlignLeft,
  Layers,
  Sparkles,
} from "lucide-react";

export const EDITORIAL_POLICY_SECTIONS = [
  {
    num: "1",
    title: "EDITORIAL INDEPENDENCE",
    content:
      "Amaica Media shall maintain editorial independence in the gathering, production and publication of news and current-affairs content. Editorial decisions shall not be improperly influenced by advertisers, sponsors, owners, political interests, government officials, sources or other external parties.",
    tag: "Independence & Integrity",
    icon: ShieldCheck,
  },
  {
    num: "2",
    title: "ACCURACY AND FACT-CHECKING",
    content:
      "All news and editorial content must be accurate, factual and properly verified before publication or broadcast. Journalists and presenters shall confirm important information using reliable sources and shall not knowingly broadcast or publish false, misleading or unverified information.",
    tag: "Truth & Verification",
    icon: FileCheck,
  },
  {
    num: "3",
    title: "FAIRNESS AND BALANCE",
    content:
      "Amaica Media shall provide fair and balanced coverage of issues of public interest. Where a story involves allegations or competing positions, reasonable effort shall be made to give affected parties an opportunity to respond and relevant perspectives shall be presented.",
    tag: "Right of Reply",
    icon: Scale,
  },
  {
    num: "4",
    title: "SOURCE IDENTIFICATION AND CONFIDENTIALITY",
    content:
      "Journalists should identify their sources whenever possible and appropriate. Confidential sources may be protected where there is a legitimate journalistic reason to maintain confidentiality. Information obtained from anonymous sources must be independently assessed and verified before publication.",
    tag: "Source Protection",
    icon: Lock,
  },
  {
    num: "5",
    title: "CORRECTIONS AND RIGHT OF REPLY",
    content:
      "Amaica Media shall promptly correct significant factual errors once identified. Corrections should be clear and proportionate to the original error. Individuals or organisations directly affected by inaccurate reporting shall be given a reasonable opportunity to respond.",
    tag: "Accountability",
    icon: CheckCircle2,
  },
  {
    num: "6",
    title: "CONFLICTS OF INTEREST",
    content:
      "Staff shall disclose actual, potential or perceived conflicts of interest that may affect editorial decisions. Journalists and presenters shall not allow personal, financial, political, commercial or family interests to compromise professional reporting.",
    tag: "Professional Ethics",
    icon: Users,
  },
  {
    num: "7",
    title: "SEPARATION OF EDITORIAL AND COMMERCIAL CONTENT",
    content:
      "Advertising, sponsorship and paid content shall be clearly distinguished from independent editorial content. Commercial arrangements shall not determine the editorial position of Amaica Media. Sponsored programmes or features must be appropriately identified.",
    tag: "Commercial Transparency",
    icon: Award,
  },
  {
    num: "8",
    title: "POLITICAL AND ELECTION COVERAGE",
    content:
      "Political reporting shall be conducted fairly, accurately and independently. Candidates, parties and public officials should be covered according to legitimate news value rather than personal preference. During election periods, Amaica Media shall observe applicable Media Council of Kenya requirements and provide appropriate opportunities for relevant divergent views.",
    tag: "MCK Compliance",
    icon: Globe,
  },
  {
    num: "9",
    title: "PROTECTION OF CHILDREN AND VULNERABLE PERSONS",
    content:
      "Amaica Media shall take special care when reporting on children, survivors of sexual violence, victims of crime and other vulnerable persons. Their dignity, privacy and safety shall be protected, and identifying information shall not be published where doing so could expose them to harm.",
    tag: "Human Rights & Child Protection",
    icon: ShieldCheck,
  },
  {
    num: "10",
    title: "PRIVACY, DIGNITY AND HUMAN RIGHTS",
    content:
      "Journalists shall respect people's privacy and dignity. Intrusive methods of gathering information should only be used where justified by a clear and overriding public-interest consideration and where reasonable alternatives are unavailable.",
    tag: "Privacy & Dignity",
    icon: Eye,
  },
  {
    num: "11",
    title: "HATE SPEECH, INCITEMENT AND DISCRIMINATION",
    content:
      "Amaica Media shall not publish or broadcast content that promotes hatred, ethnic incitement, violence, discrimination or harmful stereotyping. User comments and audience contributions shall also be moderated in accordance with applicable law and professional media standards.",
    tag: "Zero-Tolerance Hate Speech",
    icon: AlertTriangle,
  },
  {
    num: "12",
    title: "USER-GENERATED AND SOCIAL MEDIA CONTENT",
    content:
      "Content obtained from Facebook, TikTok, WhatsApp, X, YouTube or other platforms must be verified before being presented as fact. Images, videos, audio recordings and social-media posts shall not automatically be treated as authentic merely because they are widely circulated.",
    tag: "Social Media Verification",
    icon: Share2,
  },
  {
    num: "13",
    title: "USE OF ARTIFICIAL INTELLIGENCE AND DIGITAL TOOLS",
    content:
      "AI tools may assist in research, transcription, translation, editing or production, but journalists remain responsible for the accuracy and integrity of the final content. AI-generated material shall not be presented as verified human reporting without appropriate checks.",
    tag: "AI Governance & Human Fact-Locking",
    icon: Bot,
  },
  {
    num: "14",
    title: "NEWSROOM PROFESSIONAL CONDUCT",
    content:
      "All editorial staff shall conduct themselves professionally when gathering information, interviewing sources and representing Amaica Media. Journalists should identify themselves when gathering news and must not use deception, misrepresentation or covert methods except where justified by overriding public interest and no reasonable alternative exists.",
    tag: "Newsroom Standards",
    icon: BookOpen,
  },
  {
    num: "15",
    title: "EDITORIAL ACCOUNTABILITY AND QUALITY ASSURANCE",
    content:
      "All editorial departments shall maintain appropriate checks before broadcast or publication. Editors, producers, presenters and journalists are responsible for the content they approve or broadcast. The Quality Assurance Department shall monitor compliance, document editorial gaps, recommend corrective action and submit periodic reports to management.",
    tag: "QA Oversight",
    icon: Award,
  },
  {
    num: "16",
    title: "STRICT ZERO-EMOJI WORKPLACE STANDARD",
    content:
      "No emojis are permitted anywhere in editorial work, drafts, headlines, ledes, body copy, or published articles. Journalism is solemn, rigorous, and professional. We are here to execute high-caliber professional work, not casual entertainment. Automated editorial compliance engines strictly enforce a zero-emoji clearance gate.",
    tag: "Zero-Emoji Mandate",
    icon: Ban,
  },
];

export const EDITORIAL_APPROVAL_PRINCIPLES = [
  "Is it accurate?",
  "Has it been verified?",
  "Is it fair and balanced?",
  "Is there a public-interest justification?",
  "Have the affected parties been given an opportunity to respond where appropriate?",
  "Does it protect privacy, dignity and vulnerable persons?",
  "Could it promote hate, violence or discrimination?",
  "Is any commercial or personal interest properly disclosed?",
  "Have photographs, videos, audio and user-generated content been authenticated?",
  "Would we be able to defend the editorial decision if challenged?",
  "Is it 100% free of emojis and unprofessional symbols?",
];

const STYLE_RULES = [
  {
    title: "Zero-Emoji Mandate (Rule 1)",
    desc: "Strictly zero emojis across all journalistic output. Headlines, ledes, continuous body copy, excerpts, and quotes must remain 100% professional and free of pictorial symbols.",
  },
  {
    title: "Inverted-Pyramid Structure",
    desc: "6 to 7 continuous paragraphs without formulaic outline headings (no '## Background' or '## Quotes'). Weave context, reactions, and impact naturally into narrative prose.",
  },
  {
    title: "18–25 Word Fact-First Lede",
    desc: "Open with a single crisp sentence answering what happened, who was involved, and the location. Lead with the core fact rather than speculative throat-clearing.",
  },
  {
    title: "Attributed Direct Quotes",
    desc: "Every article must feature at least 2 direct quotes with verified attribution verbs (said, told, confirmed, announced) anchored to real named persons or authorities.",
  },
  {
    title: "0% AI Clearance Gate",
    desc: "Humanized prose guaranteed to pass Turnitin, GPTZero, and Copyleaks. No robotic buzzwords (delve, testament, tapestry, pivotal, beacon, vibrant).",
  },
  {
    title: "Kenyan Currency & Localization",
    desc: "Standard notation: 'KSh 1,500' (space after KSh). Foreign currencies must include approximate local conversion. Spell out numbers below 10; use digits for 10 and above.",
  },
  {
    title: "Forward-Looking Close (Outlook)",
    desc: "Conclude with what happens next: upcoming dates, ongoing inquiries, venue logistics, or monitoring actions by authorities.",
  },
];

const EXAMPLES = [
  {
    slug: "kakamega-cultural-festival-returns",
    category: "EVENTS · WESTERN KENYA",
    region: "Kakamega",
    headline: "Kakamega Cultural Festival returns to Bukhungu Stadium on November 22 with Sauti Sol headlining",
    byline: "WireOps Newsroom",
    date: "October 4, 2026",
    lede: "The Kakamega Cultural Festival returns to Bukhungu Stadium on Saturday, November 22, with Sauti Sol headlining a 12-act lineup, organisers confirmed Thursday.",
    hero: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1600&q=80",
    body: `The Kakamega Cultural Festival returns to Bukhungu Stadium on Saturday, November 22, with Sauti Sol headlining a 12-act lineup, organisers confirmed Thursday.\n\nThe one-day festival opens at 2 PM. Early-bird tickets cost KSh 1,500 and regular tickets KSh 2,500, available through the festival's official site and at Naivas Kakamega.\n\nThe festival ran every November between 2018 and 2023 before pausing for two years over funding gaps. The county government and a private events company, Westside Live, revived it this year under a three-year partnership announced in July. Last year's edition was cancelled in October 2025 after a sponsor pulled out, leaving an estimated 8,000 ticket-holders to seek refunds. Organisers said this year's revival is fully funded for the full three-year cycle.\n\nThe lineup features Sauti Sol, Bensoul, Nyashinski, Bungoma-born comedian Mjango, Khaligraph Jones, Nadia Mukami, and six Western Kenya acts including Mejja's Luhya-language collaboration with rapper Breeder LW. Gates open at 1 PM. The main stage runs from 4 PM to 11 PM. Family zones, a food court with 24 vendors, and a crafts market will operate from 2 PM. Bukhungu Stadium holds 22,000 spectators.\n\n"We are back, and we are back at full strength," said Festival Director Caroline Shisanya. "Sauti Sol's confirmation was the signal that the festival is healthy again — and that Kakamega is on the national music map." Sauti Sol's Bien-Aimé Baraza told the newsroom the group rescheduled a Mombasa show to make the Kakamega date. "Western Kenya audiences sing every word back at you. That energy is the reason we said yes within a week," he said.\n\nFor Western Kenya's live-music scene, the festival's return restores the region's biggest single-night audience and the only stadium-scale stage between Nairobi and Kisumu. Local promoters said they expect at least KSh 80 million in direct spend across hotels, transport, and vendors over the festival weekend. It also gives six emerging Western Kenya acts a 22,000-seat platform that has historically been confined to Nairobi venues.\n\nTickets go on sale at 10 AM on Monday, October 7, through kakamegafest.co.ke and Naivas outlets in Kakamega, Kisumu, and Bungoma. The full schedule will be published on November 1. Organisers said a second 2026 edition is planned for March, with a four-act preview show at Muliro Gardens on November 21.`,
    sources: [
      { title: "Kakamega County press briefing, Oct 3 2026", url: "https://example.org/kakamega/festival-2026", notes: ["Festival date: Saturday, November 22", "Venue: Bukhungu Stadium, capacity 22,000", "Ticket prices: KSh 1,500 early, KSh 2,500 regular", "12 acts confirmed, Sauti Sol headlining"] },
      { title: "Westside Live statement", url: "https://example.org/westside-live/funding", notes: ["Three-year funding partnership with Kakamega County", "Confirmed financing for 2026–2028 editions"] },
      { title: "Newsroom interview, Bien-Aimé Baraza", url: "https://example.org/amaica/sauti-sol-interview", notes: ["Sauti Sol moved a Mombasa show to fit the Kakamega date", "Quote on Western Kenya audiences"] },
    ],
  },
];

export default function EditorialPolicy({ defaultTab = "policy" }: { defaultTab?: "policy" | "style" | "principles" | "exemplars" | "zero_emoji" }) {
  const [params, setParams] = useSearchParams();
  const currentTab = params.get("tab") || defaultTab;
  const [checkedPrinciples, setCheckedPrinciples] = useState<Record<number, boolean>>({});

  const setTab = (t: string) => {
    setParams({ tab: t });
  };

  const togglePrinciple = (idx: number) => {
    setCheckedPrinciples((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const allPrinciplesChecked =
    EDITORIAL_APPROVAL_PRINCIPLES.length > 0 &&
    EDITORIAL_APPROVAL_PRINCIPLES.every((_, i) => checkedPrinciples[i]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Masthead variant="newsroom" />
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 outline-none w-full">
        {/* Navigation & Return */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Link to="/newsroom" className="inline-flex items-center gap-1.5 text-xs text-ink-light hover:text-primary transition font-medium">
            <ArrowLeft size={13} /> Return to Operations Console
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-light">
            <ShieldCheck size={13} className="text-primary" /> WireOps Editorial Governance v2.6
          </div>
        </div>

        {/* Master Document Header */}
        <div className="border-b border-border pb-8 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            <ShieldCheck size={16} className="text-accent" /> Binding Governance &amp; Style Architecture
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-foreground">
            Editorial Policy &amp; House Style Guide
          </h1>
          <p className="text-lg text-ink-mid leading-relaxed font-light mb-6">
            The unified statutory code of journalistic ethics, Media Council of Kenya standards, AP inverted-pyramid style, and strict zero-emoji professionalism governing all operations.
          </p>

          {/* Official Document Metadata Box */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Calendar size={12} className="text-primary" /> Effective Date
              </div>
              <div className="font-semibold text-foreground text-sm">24th September 2026</div>
            </div>
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Award size={12} className="text-primary" /> Governance Body
              </div>
              <div className="font-semibold text-foreground text-sm">Editorial Board &amp; QA</div>
            </div>
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Building size={12} className="text-primary" /> Standard
              </div>
              <div className="font-semibold text-foreground text-sm">MCK Code &amp; AP Style</div>
            </div>
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Ban size={12} className="text-destructive" /> Core Rule
              </div>
              <div className="font-semibold text-foreground text-sm">Zero-Emoji Mandate</div>
            </div>
          </div>
        </div>

        {/* Cohesive Tab Switcher */}
        <div className="flex items-center gap-2 mb-8 border-b border-border overflow-x-auto pb-1">
          <button
            onClick={() => setTab("policy")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 -mb-1 ${
              currentTab === "policy"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-ink-mid hover:text-foreground"
            }`}
          >
            <ShieldCheck size={14} />
            Editorial Policy (16 Articles)
          </button>

          <button
            onClick={() => setTab("style")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 -mb-1 ${
              currentTab === "style"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-ink-mid hover:text-foreground"
            }`}
          >
            <BookOpen size={14} />
            House Style &amp; Prose Guide
          </button>

          <button
            onClick={() => setTab("zero_emoji")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 -mb-1 ${
              currentTab === "zero_emoji"
                ? "border-destructive text-destructive bg-destructive/5 font-bold"
                : "border-transparent text-ink-mid hover:text-foreground"
            }`}
          >
            <Ban size={14} />
            Zero-Emoji Mandate
          </button>

          <button
            onClick={() => setTab("principles")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 -mb-1 ${
              currentTab === "principles"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-ink-mid hover:text-foreground"
            }`}
          >
            <CheckCircle2 size={14} />
            10 Principles of Approval
          </button>

          <button
            onClick={() => setTab("exemplars")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 -mb-1 ${
              currentTab === "exemplars"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-ink-mid hover:text-foreground"
            }`}
          >
            <FileText size={14} />
            Verified Exemplars
          </button>
        </div>

        {/* TAB 1: 16 Core Policy Articles */}
        {currentTab === "policy" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-muted/40 p-4 rounded border border-border text-xs text-ink-mid mb-6 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Editorial Policy to Guide the Style:</strong> All writing mechanics (tone, attribution, sentence length, and fact-first structuring) are direct extensions of these 16 statutory standards. A draft cannot be approved if it violates any section.
              </div>
            </div>

            {EDITORIAL_POLICY_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.num}
                  id={`policy-${sec.num}`}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm hover:border-primary/40 transition"
                >
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center border border-primary/20">
                        {sec.num}
                      </span>
                      <h2 className="font-display font-bold text-lg text-foreground tracking-tight">
                        {sec.title}
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Icon size={11} /> {sec.tag}
                    </span>
                  </div>
                  <p className="text-sm text-ink-mid leading-relaxed pl-11">
                    {sec.content}
                  </p>
                </section>
              );
            })}
          </div>
        )}

        {/* TAB 2: House Style & Prose Architecture */}
        {currentTab === "style" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="font-display text-2xl font-bold mb-2 text-foreground">
                WireOps Desk House Style Guide
              </h2>
              <p className="text-sm text-ink-mid leading-relaxed mb-6">
                Our writing style is designed to deliver immediate factual clarity. We write continuous prose without gimmicks, outline headers, or promotional jargon.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {STYLE_RULES.map((rule, idx) => (
                  <div key={idx} className="p-4 rounded border border-border bg-muted/20">
                    <h3 className="font-display font-bold text-base text-foreground mb-1 flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                      {rule.title}
                    </h3>
                    <p className="text-xs text-ink-mid leading-relaxed pl-6">
                      {rule.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-xl text-foreground">Continuous Inverted-Pyramid Flow</h3>
              <p className="text-sm text-ink-mid leading-relaxed">
                Modern journalism eliminates rigid outline subheadings (like &apos;## Background&apos; or &apos;## Quotes&apos;). A story moves naturally across 6–7 paragraphs:
              </p>
              <ol className="list-decimal pl-5 text-xs text-ink-mid space-y-2">
                <li><strong>Paragraph 1 (The Lede):</strong> What happened, who did it, where, and when (18–25 words, fact-first).</li>
                <li><strong>Paragraph 2 (Primary Development):</strong> Core logistics, immediate context, and financial details in KSh.</li>
                <li><strong>Paragraph 3 (Historical Background):</strong> Prior events, context from previous years, and origins.</li>
                <li><strong>Paragraph 4 (Key Details &amp; Scope):</strong> Venues, capacities, transport, or institutional confirmations.</li>
                <li><strong>Paragraph 5 (Direct Quotes):</strong> Attributed statements with verified attribution verbs (said, told, confirmed).</li>
                <li><strong>Paragraph 6 (Significance / Why It Matters):</strong> Economic, cultural, or community impact.</li>
                <li><strong>Paragraph 7 (Forward Outlook):</strong> What happens next, dates, tickets, and scheduled updates.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 3: Zero-Emoji Mandate */}
        {currentTab === "zero_emoji" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 text-destructive mb-3">
                <Ban size={28} />
                <h2 className="font-display font-bold text-3xl">Strict Zero-Emoji Work Rule</h2>
              </div>
              <p className="text-base text-foreground font-semibold mb-3">
                &ldquo;I have one simple rule: NO EMOJIs anywhere in my work. I am not here to have fun but to work.&rdquo;
              </p>
              <p className="text-sm text-ink-mid leading-relaxed mb-6">
                This newsroom is built for serious, high-standard professional journalism. Casual social media pictorials, smileys, and decorative emojis degrade the dignity and authority of reporting.
              </p>

              <div className="bg-card border border-border rounded-lg p-5 space-y-3 text-xs">
                <div className="font-bold text-foreground text-sm border-b border-border pb-2">
                  Enforcement Protocols:
                </div>
                <ul className="space-y-2 text-ink-mid">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>Pre-Publication Blocker:</strong> Automated compliance scans reject any draft containing Unicode emoji characters with an approval error.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>Automated Purge Engine:</strong> The repurposing and auto-fix engines automatically strip all emojis from incoming wire leads and social posts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>WordPress Gateway Sanitization:</strong> All payloads pushed to WordPress are scrubbed so zero emojis ever reach the live site.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>UI Hygiene:</strong> All internal newsroom dashboards, buttons, selects, and status indicators use clean, professional iconography rather than decorative emojis.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 10 Principles of Approval */}
        {currentTab === "principles" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="font-display text-2xl font-bold mb-2 text-foreground">
                10 Principles of Approval (Pre-Publication Clearance)
              </h2>
              <p className="text-sm text-ink-mid leading-relaxed mb-6">
                Every story must satisfy all 10 principles before an editor or administrator authorizes publication.
              </p>

              <div className="space-y-2">
                {EDITORIAL_APPROVAL_PRINCIPLES.map((principle, idx) => {
                  const isChecked = !!checkedPrinciples[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => togglePrinciple(idx)}
                      className={`w-full text-left p-3.5 rounded border transition flex items-center justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? "bg-primary/10 border-primary text-foreground font-semibold"
                          : "bg-muted/20 border-border text-ink-mid hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-ink-light w-5">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm">{principle}</span>
                      </div>
                      {isChecked ? (
                        <CheckSquare size={16} className="text-primary flex-shrink-0" />
                      ) : (
                        <Square size={16} className="text-ink-light flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {allPrinciplesChecked && (
                <div className="mt-6 p-4 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check size={16} /> All 10 clearance principles satisfied. Story meets full editorial policy standards.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Verified Exemplars */}
        {currentTab === "exemplars" && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="font-display text-2xl font-bold mb-2 text-foreground">
                Verified Newsroom Exemplars
              </h2>
              <p className="text-sm text-ink-mid leading-relaxed mb-6">
                These reference stories satisfy 100% of our editorial policy, AP continuous prose structure, zero-emoji rule, and 0% AI clearance.
              </p>

              {EXAMPLES.map((ex) => (
                <article key={ex.slug} className="mb-12 pb-8 border-b border-border last:border-b-0">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold mb-2">{ex.category}</div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-2 text-foreground">{ex.headline}</h3>
                  <p className="text-base text-ink-mid leading-relaxed mb-4">{ex.lede}</p>
                  <div className="flex items-center gap-3 pb-3 mb-4 border-b border-border text-[11px] font-mono text-ink-light">
                    <span>By {ex.byline}</span><span>·</span><span>{ex.date}</span><span>·</span><span>{ex.region}</span>
                  </div>
                  <div className="text-ink-mid text-sm space-y-3 leading-relaxed">
                    {ex.body.split(/\n\n+/).map((p, i) => (
                      <p key={i}>{p.trim()}</p>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-muted/30 border border-border rounded text-xs space-y-2">
                    <div className="font-semibold text-foreground">Sources &amp; Verification Notes:</div>
                    <ul className="space-y-1.5 pl-4 list-disc text-ink-light">
                      {ex.sources.map((s, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{s.title}:</span> {s.notes.join("; ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
