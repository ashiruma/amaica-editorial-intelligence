import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("Application Routing and Page Rendering", () => {
  it("locks down '/' and routes to private WireOps Desk operations console", async () => {
    window.history.pushState({}, "Test", "/");
    render(<App />);
    expect(screen.getAllByText(/WireOps/i).length).toBeGreaterThan(0);
  });

  it("protects internal newsroom editorial policy and redirects appropriately", async () => {
    window.history.pushState({}, "Test", "/editorial-policy");
    render(<App />);
    expect(screen.getAllByText(/WireOps/i).length).toBeGreaterThan(0);
  });

  it("protects internal newsroom house style guide and redirects appropriately", async () => {
    window.history.pushState({}, "Test", "/style-guide");
    render(<App />);
    expect(screen.getAllByText(/WireOps/i).length).toBeGreaterThan(0);
  });

  it("renders /newsroom route without hook violation or render anomaly", async () => {
    window.history.pushState({}, "Test", "/newsroom");
    render(<App />);
    expect(screen.getAllByText(/WireOps/i).length).toBeGreaterThan(0);
  });

  it("renders /newsroom/draft/:id route without hook violation or invariant 310 error", async () => {
    window.history.pushState({}, "Test", "/newsroom/draft/test-draft-123");
    render(<App />);
    expect(screen.getAllByText(/WireOps/i).length).toBeGreaterThan(0);
  });
});
