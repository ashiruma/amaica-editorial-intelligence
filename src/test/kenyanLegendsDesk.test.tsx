import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { KenyanLegendsDesk } from "@/components/legends/KenyanLegendsDesk";

describe("WireOps Desk: Kenyan Legends Dedicated Desk", () => {
  it("renders canonical Kenyan icons exclusively", () => {
    render(<KenyanLegendsDesk />);

    expect(screen.getByText("Mekatilili wa Menza")).toBeDefined();
    expect(screen.getByText("Field Marshal Dedan Kimathi")).toBeDefined();
    expect(screen.getByText("Prof. Wangari Maathai")).toBeDefined();
    expect(screen.getByText("Eliud Kipchoge")).toBeDefined();
    expect(screen.getByText("Luanda Magere")).toBeDefined();
  });

  it("filters legends by category", () => {
    render(<KenyanLegendsDesk />);

    const athleticsBtn = screen.getByText("Athletic Pioneers");
    fireEvent.click(athleticsBtn);

    expect(screen.getByText("Eliud Kipchoge")).toBeDefined();
    expect(screen.getByText("Kipchoge Keino")).toBeDefined();
    // Non-athletics icon should be filtered out
    expect(screen.queryByText("Mekatilili wa Menza")).toBeNull();
  });

  it("allows proposing a new legend with locked country of Kenya", () => {
    render(<KenyanLegendsDesk />);

    const proposeBtn = screen.getByText("Propose Kenyan Legend");
    fireEvent.click(proposeBtn);

    expect(screen.getByText("Country: Kenya (Locked)")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Mekatilili wa Menza")).toBeDefined();
  });

  it("strictly complies with the Zero-Emoji Workplace Standard", () => {
    const { container } = render(<KenyanLegendsDesk />);

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.textContent || "")).toBe(false);
  });
});
