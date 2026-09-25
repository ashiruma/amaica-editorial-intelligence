import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegionalBeatFilter } from "@/components/intelligence/RegionalBeatFilter";

describe("WireOps Desk: Regional Beat Filter Component", () => {
  it("renders Kakamega County as the primary jurisdiction along with Western Kenya counties", () => {
    const onLocationChange = vi.fn();
    const onBeatChange = vi.fn();

    render(
      <RegionalBeatFilter
        selectedLocation="all"
        selectedBeat="all"
        onLocationChange={onLocationChange}
        onBeatChange={onBeatChange}
      />
    );

    // Primary Kakamega button
    expect(screen.getByText("Kakamega County (Primary)")).toBeDefined();
    expect(screen.getByText("Vihiga County")).toBeDefined();
    expect(screen.getByText("Bungoma County")).toBeDefined();
    expect(screen.getByText("Busia County")).toBeDefined();
    expect(screen.getByText("Siaya County")).toBeDefined();
    expect(screen.getByText("National Kenyan Wire")).toBeDefined();
  });

  it("calls onLocationChange when a county button is clicked", () => {
    const onLocationChange = vi.fn();
    const onBeatChange = vi.fn();

    render(
      <RegionalBeatFilter
        selectedLocation="all"
        selectedBeat="all"
        onLocationChange={onLocationChange}
        onBeatChange={onBeatChange}
      />
    );

    const kakamegaBtn = screen.getByText("Kakamega County (Primary)");
    fireEvent.click(kakamegaBtn);

    expect(onLocationChange).toHaveBeenCalledWith("kakamega");
  });

  it("calls onBeatChange when an editorial beat is clicked", () => {
    const onLocationChange = vi.fn();
    const onBeatChange = vi.fn();

    render(
      <RegionalBeatFilter
        selectedLocation="kakamega"
        selectedBeat="all"
        onLocationChange={onLocationChange}
        onBeatChange={onBeatChange}
      />
    );

    const transitBtn = screen.getByText("Infrastructure & Matatu Transit");
    fireEvent.click(transitBtn);

    expect(onBeatChange).toHaveBeenCalledWith("transit");
  });

  it("strictly complies with the Zero-Emoji Workplace Standard", () => {
    const { container } = render(
      <RegionalBeatFilter
        selectedLocation="all"
        selectedBeat="all"
        onLocationChange={vi.fn()}
        onBeatChange={vi.fn()}
      />
    );

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.textContent || "")).toBe(false);
  });
});
