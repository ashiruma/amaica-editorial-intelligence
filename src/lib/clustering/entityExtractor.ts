/**
 * WireOps Desk: Kenyan Named Entity Recognition & Resolution Engine
 * Location: src/lib/clustering/entityExtractor.ts
 *
 * Extracts and normalizes Kenyan political figures, institutions, counties,
 * sub-counties (with deep Kakamega focus), transit sector entities, and landmarks.
 */

export type EntityCategory =
  | "person"
  | "county"
  | "sub_county"
  | "town"
  | "institution"
  | "transit_beat"
  | "cultural_landmark";

export interface ExtractedEntity {
  rawText: string;
  canonicalName: string;
  category: EntityCategory;
  relevanceWeight: number; // 1 to 10
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  canonicalNames: string[];
  primaryCounty?: string;
  primaryTown?: string;
  isWesternKenyaFocus: boolean;
  transitBeatDetected: boolean;
}

export class KenyanEntityExtractor {
  // Alias dictionary for political figures and leaders
  private static readonly PERSON_ALIASES: Record<string, string[]> = {
    "William Ruto": ["william ruto", "president ruto", "wsr", "dr william samoei ruto", "head of state"],
    "Raila Odinga": ["raila odinga", "baba", "tinga", "raila amolo odinga", "opposition leader odinga"],
    "Fernandes Barasa": ["fernandes barasa", "governor barasa", "fcpa fernandes barasa", "barasa"],
    "Musalia Mudavadi": ["musalia mudavadi", "prime cabinet secretary", "mudavadi", "pcs mudavadi"],
    "Moses Wetangula": ["moses wetangula", "speaker wetangula", "wetangula", "papa wa roma"],
    "George Natembeya": ["george natembeya", "governor natembeya", "natembeya", "rift valley rc natembeya"],
    "Johnson Sakaja": ["johnson sakaja", "governor sakaja", "sakaja", "arthur johnson sakaja"],
    "George Ruto": ["george ruto", "ruto's son george", "george kimutai ruto"],
    "Cleophas Malala": ["cleophas malala", "malala", "senator malala"],
    "Boni Khalwale": ["boni khalwale", "senator khalwale", "khalwale", "the bullfighter"],
    "Ayub Savula": ["ayub savula", "deputy governor savula", "savula"],
    "Paul Otuoma": ["paul otuoma", "governor otuoma", "dr paul nyongesa otuoma"],
    "Wilber Ottichilo": ["wilber ottichilo", "governor ottichilo", "dr ottichilo"],
    "Ken Lusaka": ["ken lusaka", "governor lusaka", "lusaka"],
    "James Orengo": ["james orengo", "governor orengo", "orengo"],
  };

  // Kakamega Sub-Counties
  private static readonly KAKAMEGA_SUB_COUNTIES = [
    "lurambi",
    "malava",
    "shinyalu",
    "butere",
    "mumias east",
    "mumias west",
    "matungu",
    "ikolomani",
    "khwisero",
    "navakholo",
    "lugari",
    "likuyani",
  ];

  // Western Kenya Counties
  private static readonly WESTERN_COUNTIES = [
    "kakamega",
    "vihiga",
    "bungoma",
    "busia",
    "siaya",
    "trans nzoia",
    "nandi",
  ];

  // Western Towns & Hubs
  private static readonly WESTERN_TOWNS = [
    "kakamega",
    "mbale",
    "bungoma",
    "busia",
    "kitale",
    "luanda",
    "mumias",
    "butere",
    "webuye",
    "chwele",
    "malava",
    "chawele",
    "khayega",
    "moi's bridge",
  ];

  // Regulatory & State Institutions
  private static readonly INSTITUTIONS: Record<string, string[]> = {
    "NTSA": ["ntsa", "national transport and safety authority"],
    "DCI": ["dci", "directorate of criminal investigations", "dci kenya"],
    "EACC": ["eacc", "ethics and anti-corruption commission"],
    "KRA": ["kra", "kenya revenue authority"],
    "IEBC": ["iebc", "independent electoral and boundaries commission"],
    "KNBS": ["knbs", "kenya national bureau of statistics"],
    "Judiciary of Kenya": ["judiciary", "supreme court", "high court", "court of appeal"],
    "Kakamega County Government": ["kakamega county government", "county government of kakamega"],
  };

  // Transit beat keywords
  private static readonly TRANSIT_KEYWORDS = [
    "matatu",
    "matatus",
    "nganya",
    "nganyas",
    "manyanga",
    "sacco",
    "saccos",
    "boda boda",
    "super metro",
    "speed governor",
    "ntsa inspection",
    "transit compliance",
    "route inspection",
  ];

  /**
   * Main entity extraction method
   */
  public static extractEntities(text: string): EntityExtractionResult {
    if (!text || typeof text !== "string") {
      return {
        entities: [],
        canonicalNames: [],
        isWesternKenyaFocus: false,
        transitBeatDetected: false,
      };
    }

    const lower = text.toLowerCase();
    const foundEntities: Map<string, ExtractedEntity> = new Map();
    let primaryCounty: string | undefined;
    let primaryTown: string | undefined;

    // 1. Political & Public Figures
    for (const [canonical, aliases] of Object.entries(this.PERSON_ALIASES)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, "i");
        if (regex.test(lower)) {
          foundEntities.set(`person:${canonical}`, {
            rawText: alias,
            canonicalName: canonical,
            category: "person",
            relevanceWeight: 9,
          });
          break;
        }
      }
    }

    // 2. Kakamega Sub-Counties (High priority weight: 10)
    for (const subCounty of this.KAKAMEGA_SUB_COUNTIES) {
      const regex = new RegExp(`\\b${this.escapeRegex(subCounty)}\\b`, "i");
      if (regex.test(lower)) {
        const titleCase = this.toTitleCase(subCounty);
        foundEntities.set(`sub_county:${titleCase}`, {
          rawText: subCounty,
          canonicalName: titleCase,
          category: "sub_county",
          relevanceWeight: 10,
        });
        if (!primaryCounty) primaryCounty = "Kakamega";
      }
    }

    // 3. Western Counties
    for (const county of this.WESTERN_COUNTIES) {
      const regex = new RegExp(`\\b${this.escapeRegex(county)}(?:\\s+county)?\\b`, "i");
      if (regex.test(lower)) {
        const titleCase = this.toTitleCase(county);
        foundEntities.set(`county:${titleCase}`, {
          rawText: county,
          canonicalName: titleCase,
          category: "county",
          relevanceWeight: titleCase === "Kakamega" ? 10 : 8,
        });
        if (!primaryCounty) primaryCounty = titleCase;
      }
    }

    // 4. Western Towns
    for (const town of this.WESTERN_TOWNS) {
      const regex = new RegExp(`\\b${this.escapeRegex(town)}\\b`, "i");
      if (regex.test(lower)) {
        const titleCase = this.toTitleCase(town);
        foundEntities.set(`town:${titleCase}`, {
          rawText: town,
          canonicalName: titleCase,
          category: "town",
          relevanceWeight: 7,
        });
        if (!primaryTown) primaryTown = titleCase;
      }
    }

    // 5. Institutions
    for (const [canonical, aliases] of Object.entries(this.INSTITUTIONS)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, "i");
        if (regex.test(lower)) {
          foundEntities.set(`institution:${canonical}`, {
            rawText: alias,
            canonicalName: canonical,
            category: "institution",
            relevanceWeight: 8,
          });
          break;
        }
      }
    }

    // 6. Transit Beat Detection
    let transitBeatDetected = false;
    for (const kw of this.TRANSIT_KEYWORDS) {
      const regex = new RegExp(`\\b${this.escapeRegex(kw)}\\b`, "i");
      if (regex.test(lower)) {
        transitBeatDetected = true;
        foundEntities.set(`transit:${kw}`, {
          rawText: kw,
          canonicalName: this.toTitleCase(kw),
          category: "transit_beat",
          relevanceWeight: 8,
        });
      }
    }

    const entities = Array.from(foundEntities.values());
    const canonicalNames = entities.map((e) => e.canonicalName);

    // Check Western Kenya focus
    const isWesternKenyaFocus =
      primaryCounty !== undefined ||
      entities.some(
        (e) =>
          e.category === "sub_county" ||
          (e.category === "county" && this.WESTERN_COUNTIES.includes(e.canonicalName.toLowerCase())) ||
          (e.category === "town" && this.WESTERN_TOWNS.includes(e.canonicalName.toLowerCase()))
      );

    return {
      entities,
      canonicalNames,
      primaryCounty: primaryCounty || (isWesternKenyaFocus ? "Kakamega" : undefined),
      primaryTown,
      isWesternKenyaFocus,
      transitBeatDetected,
    };
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  private static toTitleCase(str: string): string {
    return str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
}
