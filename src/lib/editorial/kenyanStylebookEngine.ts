/**
 * WireOps Desk / Amaica Media
 * Kenyan English Editorial Stylebook Engine
 *
 * Enforces Kenyan / Commonwealth English newsroom conventions,
 * official Kenyan governance terminology (2010 Constitution),
 * local currency formatting, and eliminates robotic AI clichés.
 */

export interface StylebookIssue {
  id: string;
  ruleTitle: string;
  category: "spelling" | "institutional" | "currency" | "cliche" | "voice";
  matchedText: string;
  preferredReplacement: string;
  explanation: string;
  index: number;
  length: number;
}

export interface StylebookAuditResult {
  score: number; // 0 - 100
  passed: boolean;
  totalIssues: number;
  issues: StylebookIssue[];
  categoryBreakdown: {
    spelling: number;
    institutional: number;
    currency: number;
    cliche: number;
    voice: number;
  };
}

/**
 * 1. Kenyan / Commonwealth English Spelling Dictionary
 * Maps US/informal spelling to standard Kenyan newsroom orthography.
 */
export const KENYAN_SPELLING_MAP: Record<string, string> = {
  // -our vs -or
  color: "colour",
  colors: "colours",
  colored: "coloured",
  coloring: "colouring",
  flavor: "flavour",
  flavors: "flavours",
  flavored: "flavoured",
  favor: "favour",
  favors: "favours",
  favored: "favoured",
  favoring: "favouring",
  favorite: "favourite",
  favorites: "favourites",
  honor: "honour",
  honors: "honours",
  honored: "honoured",
  honoring: "honouring",
  humor: "humour",
  humors: "humours",
  humored: "humoured",
  labor: "labour",
  labors: "labours",
  labored: "laboured",
  laborer: "labourer",
  laborers: "labourers",
  neighbor: "neighbour",
  neighbors: "neighbours",
  neighborhood: "neighbourhood",
  neighborhoods: "neighbourhoods",
  rumor: "rumour",
  rumors: "rumours",
  rumored: "rumoured",
  glamor: "glamour",
  harbor: "harbour",
  harbors: "harbours",
  vigor: "vigour",
  behavior: "behaviour",
  behaviors: "behaviours",
  savior: "saviour",
  saviors: "saviours",

  // -ise vs -ize
  organize: "organise",
  organizes: "organises",
  organized: "organised",
  organizing: "organising",
  organization: "organisation",
  organizations: "organisations",
  recognize: "recognise",
  recognizes: "recognises",
  recognized: "recognised",
  recognizing: "recognising",
  realize: "realise",
  realizes: "realises",
  realized: "realised",
  realizing: "realising",
  criticize: "criticise",
  criticizes: "criticises",
  criticized: "criticised",
  criticizing: "criticising",
  emphasize: "emphasise",
  emphasizes: "emphasises",
  emphasized: "emphasised",
  emphasizing: "emphasising",
  prioritize: "prioritise",
  prioritizes: "prioritises",
  prioritized: "prioritised",
  prioritizing: "prioritising",
  mobilize: "mobilise",
  mobilizes: "mobilises",
  mobilized: "mobilised",
  mobilizing: "mobilising",
  scrutinize: "scrutinise",
  scrutinizes: "scrutinises",
  scrutinized: "scrutinised",
  scrutinizing: "scrutinising",
  apologize: "apologise",
  apologizes: "apologises",
  apologized: "apologised",
  apologizing: "apologising",
  authorize: "authorise",
  authorizes: "authorises",
  authorized: "authorised",
  authorizing: "authorising",
  centralize: "centralise",
  centralized: "centralised",
  destabilize: "destabilise",
  destabilized: "destabilised",
  utilize: "use",
  utilizes: "uses",
  utilized: "used",
  utilizing: "using",

  // -re vs -er
  center: "centre",
  centers: "centres",
  centered: "centred",
  centering: "centring",
  theater: "theatre",
  theaters: "theatres",
  kilometer: "kilometre",
  kilometers: "kilometres",
  meter: "metre",
  meters: "metres",
  millimeter: "millimetre",
  millimiters: "millimetres",
  specter: "spectre",
  specters: "spectres",
  fiber: "fibre",
  fibers: "fibres",
  caliber: "calibre",

  // -ce vs -se & double L
  defense: "defence",
  defenses: "defences",
  offense: "offence",
  offenses: "offences",
  pretense: "pretence",
  traveled: "travelled",
  traveling: "travelling",
  traveler: "traveller",
  travelers: "travellers",
  canceled: "cancelled",
  canceling: "cancelling",
  cancellation: "cancellation",
  fueled: "fuelled",
  fueling: "fuelling",
  counseled: "counselled",
  counseling: "counselling",
  modeled: "modelled",
  modeling: "modelling",
  signaled: "signalled",
  signaling: "signalling",
  program: "programme",
  programs: "programmes",
  dialog: "dialogue",
  catalog: "catalogue",
  catalogs: "catalogues",
  analog: "analogue",

  // Transports / Everyday nouns
  airplane: "aeroplane",
  airplanes: "aeroplanes",
  tire: "tyre",
  tires: "tyres",
  gasoline: "petrol",
  sidewalk: "pavement",
  sidewalks: "pavements",
  kerb: "kerb",
  curb: "kerb", // roadside kerb; handled contextually if needed
};

/**
 * 2. Official Kenyan Governance & Institutional Standards (2010 Constitution)
 */
export interface InstitutionalRule {
  pattern: RegExp;
  replacement: string;
  ruleTitle: string;
  explanation: string;
}

export const KENYAN_INSTITUTIONAL_RULES: InstitutionalRule[] = [
  {
    pattern: /\b(?:Cabinet\s+Minister|Government\s+Minister)\b/gi,
    replacement: "Cabinet Secretary",
    ruleTitle: "Cabinet Secretary Nomenclature",
    explanation: "Under Kenya's 2010 Constitution, executive ministerial heads are designated as 'Cabinet Secretary' (CS), not 'Minister'.",
  },
  {
    pattern: /\b(?:Cabinet\s+Ministers|Government\s+Ministers)\b/gi,
    replacement: "Cabinet Secretaries",
    ruleTitle: "Cabinet Secretaries Plural",
    explanation: "Refer to ministerial leadership collectively as 'Cabinet Secretaries' or 'CSs'.",
  },
  {
    pattern: /\b(?:Assistant\s+Minister|Junior\s+Minister)\b/gi,
    replacement: "Principal Secretary",
    ruleTitle: "Principal Secretary Nomenclature",
    explanation: "Under Kenya's 2010 Constitution, administrative ministry heads are 'Principal Secretaries' (PS), not 'Assistant Ministers'.",
  },
  {
    pattern: /\b(?:Assistant\s+Ministers|Junior\s+Ministers)\b/gi,
    replacement: "Principal Secretaries",
    ruleTitle: "Principal Secretaries Plural",
    explanation: "Refer to ministry accounting officers as 'Principal Secretaries' (PSs).",
  },
  {
    pattern: /\b(?:Local\s+Council|Municipal\s+Council|City\s+Council)\b(?!\s+(?:of|in)\s+London)/gi,
    replacement: "County Assembly / County Government",
    ruleTitle: "County Devolution Terminology",
    explanation: "Local governments in Kenya are organized as County Governments and County Assemblies under the devolved system.",
  },
  {
    pattern: /\b(?:Councilors|Councillors)\b(?!\s+(?:of|in)\s+London)/gi,
    replacement: "Members of County Assembly (MCAs)",
    ruleTitle: "MCAs Plural Nomenclature",
    explanation: "Ward representatives are 'Members of County Assembly' (MCAs).",
  },
  {
    pattern: /\b(?:Councilor|Councillor)\b(?!\s+(?:of|in)\s+London)/gi,
    replacement: "Member of County Assembly (MCA)",
    ruleTitle: "MCA Nomenclature",
    explanation: "Ward representatives in devolved Kenya are 'Members of County Assembly' (MCAs), not councilors.",
  },
  {
    pattern: /\b(?:motorcycle\s+taxi|commercial\s+motorcyclist)\b/gi,
    replacement: "boda boda rider",
    ruleTitle: "Boda Boda Standard Terminology",
    explanation: "Kenyan journalism standards use 'boda boda' or 'boda boda rider' rather than 'motorcycle taxi'.",
  },
  {
    pattern: /\b(?:motorcycle\s+taxis)\b/gi,
    replacement: "boda bodas",
    ruleTitle: "Boda Bodas Plural",
    explanation: "Plural is 'boda bodas'.",
  },
  {
    pattern: /\b(?:matatu\s+company|matatu\s+syndicate|minibus\s+cooperative)\b/gi,
    replacement: "matatu sacco",
    ruleTitle: "Matatu SACCO Terminology",
    explanation: "Public service transport operators in Kenya are formally registered as Savings and Credit Cooperatives (SACCOs).",
  },
  {
    pattern: /\b(?:matatu\s+companies|matatu\s+syndicates)\b/gi,
    replacement: "matatu saccos",
    ruleTitle: "Matatu SACCOs Plural",
    explanation: "Refer to transport cooperatives as 'matatu saccos'.",
  },
];

/**
 * 3. Kenyan Currency Formatting
 */
export const KENYAN_CURRENCY_RULES: InstitutionalRule[] = [
  {
    pattern: /\b(?!KSh\s)(?:[kK][sS][hH][sS]?|[kK][eE][sS])\.?\s*(?=\d)/g,
    replacement: "KSh ",
    ruleTitle: "Kenyan Shilling Notation",
    explanation: "Kenya newsroom standard specifies 'KSh ' followed by the numeric figure (e.g. 'KSh 50,000' or 'KSh 2.5 million').",
  },
  {
    pattern: /\$\s*(\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|k|m|b))?)/gi,
    replacement: "USD $1 (approx. KSh equivalent)",
    ruleTitle: "Foreign Dollar Currency Context",
    explanation: "When citing US dollar figures, specify 'USD' and provide approximate local KSh conversion for local reader clarity.",
  },
];

/**
 * 4. Banned AI Clichés & Synthetic Journalistic Fillers
 */
export const AI_CLICHE_RULES: { pattern: RegExp; replacement: string; title: string; explanation: string }[] = [
  {
    pattern: /\b(?:testament\s+to|serves\s+as\s+a\s+testament\s+to)\b/gi,
    replacement: "evidence of / demonstration of",
    title: "AI Cliché: 'Testament to'",
    explanation: "Formulaic LLM cliché. Replace with concrete evidence verbs like 'demonstrates', 'illustrates', or 'reflects'.",
  },
  {
    pattern: /\b(?:delve\s+into|delving\s+into)\b/gi,
    replacement: "examine / investigate / explore",
    title: "AI Cliché: 'Delve into'",
    explanation: "Overused synthetic transition. Use direct verbs like 'examine', 'investigate', or 'report on'.",
  },
  {
    pattern: /\b(?:vibrant\s+tapestry|rich\s+tapestry|cultural\s+tapestry)\b/gi,
    replacement: "diverse community / cultural heritage",
    title: "AI Cliché: 'Tapestry'",
    explanation: "Stereotypical AI trope. Describe actual physical communities, cultural practices, or economic networks specifically.",
  },
  {
    pattern: /\b(?:beacon\s+of\s+hope)\b/gi,
    replacement: "notable model / respected initiative",
    title: "AI Cliché: 'Beacon of hope'",
    explanation: "Unsubstantiated sentimental hype. Report factual accomplishments and institutional results.",
  },
  {
    pattern: /\b(?:resonate\s+deeply|resonates\s+deeply|resonated\s+deeply)\b/gi,
    replacement: "connect strongly / draw strong support",
    title: "AI Cliché: 'Resonate deeply'",
    explanation: "Banned AI phrase. State clearly how audiences, voters, or listeners responded.",
  },
  {
    pattern: /\b(?:captivating\s+audiences|captivated\s+audiences)\b/gi,
    replacement: "drawing audiences / attracting viewers",
    title: "AI Cliché: 'Captivating audiences'",
    explanation: "Banned AI marketing phrase. State documented attendance, streaming metrics, or viewer responses.",
  },
  {
    pattern: /\b(?:paving\s+the\s+way|paved\s+the\s+way)\b/gi,
    replacement: "creating opportunities / setting precedents",
    title: "AI Cliché: 'Paving the way'",
    explanation: "Tired metaphorical cliché. Describe the precise operational or legal precedent established.",
  },
  {
    pattern: /\b(?:it\s+is\s+worth\s+noting\s+that|it\s+should\s+be\s+noted\s+that)\b/gi,
    replacement: "[Omit - state fact directly]",
    title: "AI Filler: 'It is worth noting that'",
    explanation: "Unnecessary padding. Eliminate throat-clearing and state the verified fact immediately.",
  },
  {
    pattern: /\b(?:in\s+summary|in\s+conclusion)\b/gi,
    replacement: "[Omit - use forward-looking outlook]",
    title: "AI Academic Marker: 'In summary'",
    explanation: "News stories follow the inverted pyramid structure, not school essays. Conclude with an outlook or verified next step.",
  },
];

/**
 * Audits a text string against the complete Kenyan English Editorial Stylebook.
 */
export function auditKenyanStylebook(text: string): StylebookAuditResult {
  const issues: StylebookIssue[] = [];
  const textLower = text.toLowerCase();

  // 1. Kenyan / Commonwealth Spelling Audit
  for (const [usWord, kenyanWord] of Object.entries(KENYAN_SPELLING_MAP)) {
    const regex = new RegExp(`\\b${usWord}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // Preserve original casing
      const matched = match[0];
      let replacement = kenyanWord;
      if (matched[0] === matched[0].toUpperCase()) {
        replacement = kenyanWord.charAt(0).toUpperCase() + kenyanWord.slice(1);
      }

      issues.push({
        id: `style-spelling-${usWord}-${match.index}`,
        ruleTitle: `Kenyan Spelling: ${replacement}`,
        category: "spelling",
        matchedText: matched,
        preferredReplacement: replacement,
        explanation: `Kenyan editorial standards follow Commonwealth orthography ('${replacement}' instead of US '${matched}').`,
        index: match.index,
        length: matched.length,
      });
    }
  }

  // 2. Institutional Terminology Audit
  for (const rule of KENYAN_INSTITUTIONAL_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: `style-inst-${rule.ruleTitle.toLowerCase().replace(/\s+/g, "-")}-${match.index}`,
        ruleTitle: rule.ruleTitle,
        category: "institutional",
        matchedText: match[0],
        preferredReplacement: rule.replacement,
        explanation: rule.explanation,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // 3. Currency Format Audit
  for (const rule of KENYAN_CURRENCY_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: `style-currency-${rule.ruleTitle.toLowerCase().replace(/\s+/g, "-")}-${match.index}`,
        ruleTitle: rule.ruleTitle,
        category: "currency",
        matchedText: match[0],
        preferredReplacement: rule.replacement,
        explanation: rule.explanation,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // 4. AI Clichés Audit
  for (const rule of AI_CLICHE_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: `style-cliche-${rule.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${match.index}`,
        ruleTitle: rule.title,
        category: "cliche",
        matchedText: match[0],
        preferredReplacement: rule.replacement,
        explanation: rule.explanation,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Sort issues by index
  issues.sort((a, b) => a.index - b.index);

  // Calculate score (100 minus penalty per issue, floored at 0)
  const penalty = issues.reduce((acc, issue) => {
    switch (issue.category) {
      case "institutional": return acc + 10;
      case "cliche": return acc + 8;
      case "currency": return acc + 5;
      case "spelling": return acc + 3;
      default: return acc + 2;
    }
  }, 0);

  const score = Math.max(0, 100 - penalty);
  const passed = issues.length === 0;

  const categoryBreakdown = {
    spelling: issues.filter((i) => i.category === "spelling").length,
    institutional: issues.filter((i) => i.category === "institutional").length,
    currency: issues.filter((i) => i.category === "currency").length,
    cliche: issues.filter((i) => i.category === "cliche").length,
    voice: issues.filter((i) => i.category === "voice").length,
  };

  return {
    score,
    passed,
    totalIssues: issues.length,
    issues,
    categoryBreakdown,
  };
}

/**
 * Applies approved stylebook corrections to the text.
 * Can apply all or selectively by rule IDs.
 */
export function applyStylebookCorrections(
  text: string,
  selectedIssueIds?: string[]
): { correctedText: string; appliedCount: number } {
  const audit = auditKenyanStylebook(text);
  if (audit.issues.length === 0) {
    return { correctedText: text, appliedCount: 0 };
  }

  const issuesToApply = selectedIssueIds
    ? audit.issues.filter((i) => selectedIssueIds.includes(i.id))
    : audit.issues;

  if (issuesToApply.length === 0) {
    return { correctedText: text, appliedCount: 0 };
  }

  // Apply backwards so indices remain valid
  const sorted = [...issuesToApply].sort((a, b) => b.index - a.index);
  let result = text;
  let appliedCount = 0;

  for (const issue of sorted) {
    // Only apply if preferredReplacement is not an advisory comment like [Omit]
    if (issue.preferredReplacement.startsWith("[") || issue.preferredReplacement.includes("/")) {
      continue;
    }
    const before = result.slice(0, issue.index);
    const after = result.slice(issue.index + issue.length);
    result = `${before}${issue.preferredReplacement}${after}`;
    appliedCount++;
  }

  return { correctedText: result, appliedCount };
}
