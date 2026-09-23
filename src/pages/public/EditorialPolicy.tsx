import { useState } from "react";
import { Link } from "react-router-dom";
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
  Sparkles,
  BookOpen,
  Calendar,
  Building,
  Check,
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
];

export default function EditorialPolicy() {
  const [checkedPrinciples, setCheckedPrinciples] = useState<Record<number, boolean>>({});

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
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Link to="/newsroom" className="inline-flex items-center gap-1.5 text-xs text-ink-light hover:text-primary transition font-medium">
            <ArrowLeft size={13} /> Return to Newsroom Desk
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link to="/newsroom/style-guide" className="text-primary hover:underline font-semibold flex items-center gap-1">
              <BookOpen size={12} /> View House Style Guide
            </Link>
          </div>
        </div>

        {/* Policy Document Header */}
        <div className="border-b border-border pb-8 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            <ShieldCheck size={16} className="text-accent" /> Official Editorial Governance
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-foreground">
            Amaica Media Editorial Policy
          </h1>
          <p className="text-lg text-ink-mid leading-relaxed font-light mb-6">
            The binding code of journalistic ethics, accuracy, independence, and professional standards governing all content across Amaica Media platforms.
          </p>

          {/* Official Document Metadata Box */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Calendar size={12} className="text-primary" /> Effective Date
              </div>
              <div className="font-semibold text-foreground text-sm">21st September 2027</div>
            </div>
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Award size={12} className="text-primary" /> Approved By
              </div>
              <div className="font-semibold text-foreground text-sm">Nelson Shitanda</div>
            </div>
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Building size={12} className="text-primary" /> Responsible Dept
              </div>
              <div className="font-semibold text-foreground text-sm">Editorial & QA</div>
            </div>
            <div>
              <div className="text-ink-light flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                <Globe size={12} className="text-primary" /> Scope of Policy
              </div>
              <div className="font-semibold text-foreground text-sm">Radio, TV, Web, Social</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-light">
            <span className="font-semibold text-foreground">Applies To:</span>
            <span className="bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1"><Radio size={10} /> Radio</span>
            <span className="bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1"><Tv size={10} /> Television</span>
            <span className="bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1"><Globe size={10} /> Website (amaicamedia.com)</span>
            <span className="bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1"><Share2 size={10} /> Social Media & Digital Channels</span>
          </div>
        </div>

        {/* 15 Core Policy Articles */}
        <div className="space-y-6 mb-12">
          {EDITORIAL_POLICY_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <section
                key={sec.num}
                id={`policy-${sec.num}`}
                className="bg-card border border-border rounded-lg p-6 shadow-sm hover:border-primary/40 transition"
              >
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-mono font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {sec.num}
                    </span>
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {sec.title}
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider bg-muted text-ink-mid px-2.5 py-1 rounded-full border border-border flex items-center gap-1.5">
                    <Icon size={12} className="text-primary" /> {sec.tag}
                  </span>
                </div>
                <p className="text-ink-mid text-[15px] leading-relaxed pl-11">
                  {sec.content}
                </p>
              </section>
            );
          })}
        </div>

        {/* Editorial Approval Principle (The 10 Questions) */}
        <section className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border-2 border-primary/20 rounded-xl p-6 sm:p-8 mb-12 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
            <Sparkles size={14} className="text-accent" /> Mandatory Gatekeeper Checklist
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Editorial Approval Principle
          </h2>
          <p className="text-sm text-ink-mid mb-6 leading-relaxed">
            Before any major story, programme segment, online article, video or social-media publication is released, the responsible editorial team must verify each of the following 10 golden principles:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {EDITORIAL_APPROVAL_PRINCIPLES.map((principle, idx) => {
              const isChecked = !!checkedPrinciples[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => togglePrinciple(idx)}
                  className={`text-left p-3 rounded-lg border text-sm flex items-start gap-3 transition ${
                    isChecked
                      ? "bg-primary/10 border-primary text-foreground font-medium shadow-xs"
                      : "bg-background border-border text-ink-mid hover:border-primary/50"
                  }`}
                >
                  <span className="mt-0.5 flex-shrink-0">
                    {isChecked ? (
                      <CheckSquare size={16} className="text-primary fill-primary/20" />
                    ) : (
                      <Square size={16} className="text-ink-light" />
                    )}
                  </span>
                  <span>
                    <strong className="text-xs font-mono text-primary mr-1.5">#{idx + 1}</strong>
                    {principle}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border flex-wrap text-xs">
            <span className="text-ink-light">
              Interactive Newsroom Verification: <strong className="text-foreground">{Object.values(checkedPrinciples).filter(Boolean).length} / 10</strong> verified
            </span>
            {allPrinciplesChecked ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> Full Editorial Approval Cleared
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const all: Record<number, boolean> = {};
                  EDITORIAL_APPROVAL_PRINCIPLES.forEach((_, i) => (all[i] = true));
                  setCheckedPrinciples(all);
                }}
                className="text-primary underline font-medium hover:text-primary-mid"
              >
                Mark all 10 principles as verified
              </button>
            )}
          </div>
        </section>

        {/* Compliance & Sign-off Box */}
        <section className="bg-card border border-border rounded-lg p-6 mb-12 shadow-sm text-sm">
          <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Scale size={16} className="text-primary" /> Statutory Compliance & Standards
          </h3>
          <p className="text-ink-mid leading-relaxed mb-4">
            All Amaica Media employees, correspondents, presenters, producers, editors, interns and contributors involved in editorial production are expected to comply with this policy.
          </p>
          <p className="text-ink-mid leading-relaxed mb-6">
            This policy shall be read together with the <strong>Media Council of Kenya Code of Conduct for Media Practice, 2025</strong>, applicable Kenyan laws, broadcasting requirements and other relevant professional standards.
          </p>

          <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <div className="text-ink-light uppercase">Prepared by:</div>
              <div className="font-bold text-foreground text-sm">Titus Wekesa</div>
              <div className="text-ink-light">Quality Assurance / Editorial Department</div>
            </div>
            <div>
              <div className="text-ink-light uppercase">Approved by:</div>
              <div className="font-bold text-foreground text-sm">Nelson Shitanda</div>
              <div className="text-ink-light">Date: 21/09/2026</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
