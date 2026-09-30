import { describe, it, expect } from "vitest";
import {
  auditArticleHallucinations,
  repairHallucinatoryDrift,
  isTransitToConcertHallucination,
} from "@/lib/writer/hallucinationGuard";
import { ResearchPacket } from "@/lib/verification/researchPacketBuilder";

describe("Anti-Hallucination Beat Consistency Guard", () => {
  it("flags and rejects a George Ruto Nganya transit story that drifts into a music concert", () => {
    const article = {
      headline: "George Ruto's Nganyas Expand Fleet Operations on Rongai Route",
      lede: "NAIROBI — Youth entrepreneur George Ruto has expanded his custom matatu fleet operations with two high-specification nganyas entering the Nairobi-Ongata Rongai transit corridor.",
      body: `Speaking on the record, route coordinators confirmed that the new custom vehicles have received full regulatory approval from the National Transport and Safety Authority.

The development underscores the economic vitality of Nairobi's matatu industry, which employs thousands of young drivers, airbrush technicians, and conductors across the county.

Urban transport analysts noted that speed governance telematics and disciplined ticketing systems are transforming informal transit into structured transport logistics enterprises.

Meanwhile, fans eagerly look forward to his upcoming stadium concert this weekend, with tickets on sale at major ticketing outlets for the headline show and live music performance.`,
      category: "matatu_transport",
    };

    const audit = auditArticleHallucinations(article);

    expect(audit.passed).toBe(false);
    expect(audit.primaryBeat).toBe("matatu_transport");
    expect(audit.driftViolations.length).toBeGreaterThan(0);
    expect(audit.errors.some((e) => e.includes("Critical Hallucination") || e.includes("music concert"))).toBe(true);
  });

  it("repairs hallucinatory concert endings by purging them and appending grounded transit context", () => {
    const article = {
      headline: "George Ruto's Nganyas Expand Fleet Operations on Rongai Route",
      lede: "NAIROBI — Youth entrepreneur George Ruto has expanded his custom matatu fleet operations with two high-specification nganyas entering the Nairobi-Ongata Rongai transit corridor.",
      body: `Speaking on the record, route coordinators confirmed that the new custom vehicles have received full regulatory approval from the National Transport and Safety Authority.

The development underscores the economic vitality of Nairobi's matatu industry, which employs thousands of young drivers, airbrush technicians, and conductors across the county.

Fans eagerly look forward to his upcoming stadium concert this weekend, with tickets on sale at major ticketing outlets for the headline show and live music performance.`,
      category: "matatu_transport",
    };

    const repaired = repairHallucinatoryDrift(article);

    expect(repaired.repaired).toBe(true);
    expect(repaired.body).not.toContain("stadium concert");
    expect(repaired.body).not.toContain("tickets on sale");
    expect(repaired.body).not.toContain("live music performance");
    expect(repaired.repairLog.length).toBeGreaterThan(0);

    // Verify re-audit of repaired text passes
    const reAudit = auditArticleHallucinations({
      headline: repaired.headline,
      lede: repaired.lede,
      body: repaired.body,
      category: "matatu_transport",
    });
    expect(reAudit.passed).toBe(true);
  });

  it("flags incompatible beat transition from tragedy/rescue to comedy", () => {
    const article = {
      headline: "Search and Rescue Operation Concludes at River Nzoia",
      lede: "KAKAMEGA — County disaster response teams and volunteer divers have concluded an intensive search and recovery operation along the banks of River Nzoia.",
      body: `Local authorities confirmed that emergency rescue teams recovered all missing items and secured the embankment following days of elevated river currents.

Community elders and regional administrators commended the bravery of volunteer divers who worked under challenging weather conditions.

Hilariously, local comedians took to TikTok live with funny skits parodying the entire situation with memes and punchlines to entertain followers.`,
      category: "tragedy_rescue",
    };

    const audit = auditArticleHallucinations(article);

    expect(audit.passed).toBe(false);
    expect(audit.primaryBeat).toBe("tragedy_rescue");
    expect(audit.errors.some((e) => e.includes("Thematic Drift") || e.includes("comedy"))).toBe(true);
  });

  it("passes a legitimate transit story with strictly grounded narrative depth", () => {
    const article = {
      headline: "Super Metro Fleet Adds Electric Commuter Buses Across Nairobi Routes",
      lede: "NAIROBI — Urban transport consortium Super Metro has officially deployed twelve electric commuter buses across its major suburban corridors.",
      body: `Speaking on the record, fleet management director Peter Kariuki stated that the transition to low-emission vehicles aligns with national environmental standards.

The initiative represents a multi-million-shilling investment in clean energy transit infrastructure, supported by charging depots installed along key terminus points.

Transport regulators and commuter safety advocates commended the sacco for prioritizing passenger comfort, digital ticketing, and speed compliance.

WireOps Desk will continue tracking verified developments across Kenya's urban transport ecosystem.`,
      category: "matatu_transport",
    };

    const audit = auditArticleHallucinations(article);

    expect(audit.passed).toBe(true);
    expect(audit.driftViolations.length).toBe(0);
    expect(audit.errors.length).toBe(0);
  });

  it("permits music/event mentions if explicitly corroborated by the primary ResearchPacket", () => {
    const corroboratedPacket: ResearchPacket = {
      clusterId: "cluster-123",
      title: "Matatu Sacco Organizes Road Safety Music Festival",
      primaryActors: ["Peter Kariuki", "Sauti Sol"],
      timeline: [],
      confirmedFacts: ["The transport sacco partnered with musicians for a road safety live concert at Uhuru Park."],
      unverifiedClaims: [],
      statutoryCitations: [],
      keyEntities: { people: ["Peter Kariuki"], organizations: ["Super Metro"], locations: ["Nairobi"] },
      sources: [],
      lockedQuotes: [],
      contradictions: [],
      recommendedState: "VERIFIED",
      generatedAt: new Date().toISOString(),
      claims: [
        {
          id: "claim-1",
          claimText: "A road safety music concert will take place to promote defensive driving among matatu youth.",
          extractedFromUrl: "https://standardmedia.co.ke/safety",
          speaker: "Peter Kariuki",
          confidenceScore: 90,
          verificationStatus: "VERIFIED",
          severity: "ROUTINE",
        },
      ],
    };

    const isHallucinated = isTransitToConcertHallucination(
      "matatu_transport",
      "Organizers confirmed that a road safety music concert will be held to educate commuter crews.",
      corroboratedPacket
    );

    expect(isHallucinated).toBe(false);
  });
});
