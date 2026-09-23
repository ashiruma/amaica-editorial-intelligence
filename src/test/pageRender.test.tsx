import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("Application Routing and Page Rendering", () => {
  it("renders PublicHome on '/' without crashing", async () => {
    window.history.pushState({}, "Test", "/");
    render(<App />);
    expect(screen.getAllByText(/Amaica/i).length).toBeGreaterThan(0);
  });

  it("renders EditorialPolicy on '/editorial-policy' without crashing", async () => {
    window.history.pushState({}, "Test", "/editorial-policy");
    render(<App />);
    expect(screen.getAllByText(/EDITORIAL INDEPENDENCE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nelson Shitanda/i).length).toBeGreaterThan(0);
  });

  it("renders StyleGuide on '/style-guide' without crashing", async () => {
    window.history.pushState({}, "Test", "/style-guide");
    render(<App />);
    expect(screen.getAllByText(/house style/i).length).toBeGreaterThan(0);
  });
});
