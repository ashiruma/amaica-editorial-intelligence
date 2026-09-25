import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LiveIntelligenceMonitor } from "@/components/intelligence/LiveIntelligenceMonitor";
import { StoryCluster } from "@/types/intelligence";

describe("WireOps Desk: Live Intelligence Monitor Component", () => {
  const mockClusters: StoryCluster[] = [
    {
      id: "cluster-1",
      story_code: "WOP-2026-0042",
      working_headline: "Kakamega County Commissions New Road Modernization Project",
      category: "transit",
      primary_location: "Kakamega",
      county: "Kakamega",
      town: "Lurambi",
      geographic_relevance_score: 95,
      momentum_score: 80,
      status: "VERIFIED",
      is_potential_exclusive: false,
      first_detected_at: new Date().toISOString(),
      last_signal_at: new Date().toISOString(),
      signal_count: 3,
      source_count: 3,
      independent_source_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      signals: [
        {
          id: "sig-1",
          source_id: "src-nation",
          external_url: "https://nation.africa/news/roads-kakamega",
          canonical_url: "https://nation.africa/news/roads-kakamega",
          raw_title: "Governor Barasa Launches Modernization Plan for Kakamega County Roads",
          raw_text: "Forty-five kilometres of tarmac across Malava.",
          content_hash: "hash-1",
          lineage_type: "original_report",
          detected_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: "cluster-2",
      story_code: "WOP-2026-0099",
      working_headline: "Vihiga County Assembly Debates Agricultural Subsidy Program",
      category: "agriculture",
      primary_location: "Mbale",
      county: "Vihiga",
      town: "Mbale",
      geographic_relevance_score: 80,
      momentum_score: 45,
      status: "DEVELOPING",
      is_potential_exclusive: false,
      first_detected_at: new Date().toISOString(),
      last_signal_at: new Date().toISOString(),
      signal_count: 1,
      source_count: 1,
      independent_source_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it("renders story clusters with codes, headlines, and verification badges", () => {
    const onDraft = vi.fn();
    render(<LiveIntelligenceMonitor clusters={mockClusters} onDraftCluster={onDraft} />);

    expect(screen.getByText("WOP-2026-0042")).toBeDefined();
    expect(screen.getByText("Kakamega County Commissions New Road Modernization Project")).toBeDefined();
    expect(screen.getByText("VERIFIED")).toBeDefined();

    expect(screen.getByText("WOP-2026-0099")).toBeDefined();
    expect(screen.getByText("Vihiga County Assembly Debates Agricultural Subsidy Program")).toBeDefined();
    expect(screen.getByText("DEVELOPING")).toBeDefined();
  });

  it("opens ClusterInspectorModal when Inspect Dossier is clicked", () => {
    const onDraft = vi.fn();
    render(<LiveIntelligenceMonitor clusters={mockClusters} onDraftCluster={onDraft} />);

    const inspectBtns = screen.getAllByText("Inspect Dossier");
    fireEvent.click(inspectBtns[0]);

    // Modal should now be open
    expect(screen.getByText("Signals Ingested")).toBeDefined();
    expect(screen.getByText("Reporting Outlets")).toBeDefined();
    expect(screen.getByText("Draft Continuous Article")).toBeDefined();
  });

  it("invokes onDraftCluster callback when Draft Article button is clicked", () => {
    const onDraft = vi.fn();
    render(<LiveIntelligenceMonitor clusters={mockClusters} onDraftCluster={onDraft} />);

    const draftBtns = screen.getAllByText("Draft Article");
    fireEvent.click(draftBtns[0]);

    expect(onDraft).toHaveBeenCalledWith(mockClusters[0]);
  });

  it("strictly enforces the Zero-Emoji Workplace Standard", () => {
    const { container } = render(
      <LiveIntelligenceMonitor clusters={mockClusters} onDraftCluster={vi.fn()} />
    );

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.textContent || "")).toBe(false);
  });
});
