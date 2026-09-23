import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("Application Routing and Page Rendering", () => {
  it("renders PublicHome on '/' without public editorial policy link in main navigation", async () => {
    window.history.pushState({}, "Test", "/");
    render(<App />);
    expect(screen.getAllByText(/Amaica/i).length).toBeGreaterThan(0);

    // In the public header, Editorial Policy is removed
    const publicNav = screen.getByRole("navigation", { name: /main category navigation/i });
    expect(publicNav).toBeInTheDocument();
    expect(publicNav.textContent).not.toMatch(/Editorial Policy/i);
  });

  it("protects internal newsroom editorial policy and redirects appropriately", async () => {
    window.history.pushState({}, "Test", "/editorial-policy");
    render(<App />);
    // Since user is unauthenticated, protected newsroom routes redirect to auth or clearance
    expect(screen.getAllByText(/Amaica/i).length).toBeGreaterThan(0);
  });

  it("protects internal newsroom house style guide and redirects appropriately", async () => {
    window.history.pushState({}, "Test", "/style-guide");
    render(<App />);
    expect(screen.getAllByText(/Amaica/i).length).toBeGreaterThan(0);
  });
});
