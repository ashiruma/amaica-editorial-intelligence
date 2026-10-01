/**
 * WireOps Desk / Amaica Media
 * Test Suite: Access Clearance & Approval Pipeline Test
 * Location: src/test/accessClearancePipeline.test.ts
 *
 * Validates cross-device clearance submission, review, approval,
 * rejection, and RBAC permissions.
 *
 * Strict Zero-Emoji Workplace Standard enforced.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  submitNewsroomAccessRequest,
  fetchNewsroomAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  isUserApprovedByAdmin,
  getRequestStatusForEmail,
  addApprovedEmail,
  removeApprovedEmail,
  getLocalRequests,
  saveLocalRequests,
} from "@/lib/accessRequests";

describe("Newsroom Access Clearance & Approval Pipeline", () => {
  beforeEach(() => {
    // Reset local store for test isolation
    saveLocalRequests([]);
  });

  it("ensures default administrator has permanent access", () => {
    expect(isUserApprovedByAdmin("ashiruma")).toBe(true);
    expect(isUserApprovedByAdmin("ashirumaabala@gmail.com")).toBe(true);
    expect(isUserApprovedByAdmin("admin@amaicamedia.com")).toBe(true);
  });

  it("blocks unapproved contributors by default", () => {
    const contributorEmail = "kakamega.field.reporter@gmail.com";
    removeApprovedEmail(contributorEmail);
    expect(isUserApprovedByAdmin(contributorEmail)).toBe(false);
  });

  it("submits clearance request and saves with pending status", async () => {
    const email = "western.benga.critic@gmail.com";
    const req = await submitNewsroomAccessRequest({
      email,
      displayName: "Western Music Critic",
      requestedRole: "reporter",
      beatReason: "Covering live Benga concerts in Kakamega and Bungoma",
    });

    expect(req).toBeDefined();
    expect(req.id).toMatch(/^req-/);
    expect(req.email).toBe(email);
    expect(req.displayName).toBe("Western Music Critic");
    expect(req.requestedRole).toBe("reporter");
    expect(req.status).toBe("pending");

    const statusInfo = getRequestStatusForEmail(email);
    expect(statusInfo.status).toBe("pending");
    expect(statusInfo.request?.id).toBe(req.id);
  });

  it("processes administrator approval and unlocks access", async () => {
    const email = "vihiga.reporter@gmail.com";
    const req = await submitNewsroomAccessRequest({
      email,
      displayName: "Vihiga Beat Writer",
      requestedRole: "contributor",
      beatReason: "Reporting on cultural events in Mbale and Chavakali",
    });

    expect(isUserApprovedByAdmin(email)).toBe(false);

    const approved = await approveAccessRequest(req.id, "ashiruma");
    expect(approved).toBe(true);

    // Verify access is now granted
    expect(isUserApprovedByAdmin(email)).toBe(true);

    const localList = getLocalRequests();
    const updated = localList.find((r) => r.id === req.id);
    expect(updated?.status).toBe("approved");
    expect(updated?.reviewedBy).toBe("ashiruma");
    expect(updated?.reviewedAt).toBeDefined();
  });

  it("processes administrator rejection and revokes clearance", async () => {
    const email = "spam.applicant@unknown.net";
    const req = await submitNewsroomAccessRequest({
      email,
      displayName: "Suspicious User",
      requestedRole: "editor",
      beatReason: "Generic request without editorial background",
    });

    const rejected = await rejectAccessRequest(req.id, "ashiruma");
    expect(rejected).toBe(true);

    expect(isUserApprovedByAdmin(email)).toBe(false);

    const localList = getLocalRequests();
    const updated = localList.find((r) => r.id === req.id);
    expect(updated?.status).toBe("rejected");
  });

  it("retrieves newsroom access requests list without crashes", async () => {
    const list = await fetchNewsroomAccessRequests();
    expect(Array.isArray(list)).toBe(true);
  });
});
