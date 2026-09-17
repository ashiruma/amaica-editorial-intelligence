/**
 * Amaica Editorial Intelligence Platform
 * Newsroom Access & Clearance Request Engine
 *
 * Ensures only the administrator (ashiruma) has default access.
 * All other contributors/staff must submit a permission request
 * that the admin reviews and approves before newsroom clearance is granted.
 */

import { supabase } from "@/integrations/supabase/client";

export interface AccessRequest {
  id: string;
  userId?: string;
  email: string;
  displayName: string;
  requestedRole: "reporter" | "editor" | "contributor";
  beatReason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const STORAGE_KEY = "amaica_newsroom_access_requests";
const APPROVED_USERS_KEY = "amaica_approved_editorial_users";

export function getLocalRequests(): AccessRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalRequests(requests: AccessRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {}
}

export function getApprovedEmails(): string[] {
  try {
    const raw = localStorage.getItem(APPROVED_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addApprovedEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const current = getApprovedEmails();
  if (!current.includes(norm)) {
    current.push(norm);
    try {
      localStorage.setItem(APPROVED_USERS_KEY, JSON.stringify(current));
    } catch {}
  }
}

export function removeApprovedEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const current = getApprovedEmails().filter((e) => e !== norm);
  try {
    localStorage.setItem(APPROVED_USERS_KEY, JSON.stringify(current));
  } catch {}
}

/**
 * Checks whether a given user is approved by the admin.
 */
export function isUserApprovedByAdmin(email?: string | null): boolean {
  if (!email) return false;
  const norm = email.toLowerCase().trim();

  // The primary admin always has access
  if (norm.includes("ashiruma") || norm === "admin@amaicamedia.com") {
    return true;
  }

  const approved = getApprovedEmails();
  return approved.includes(norm);
}

/**
 * Checks the status of an access request for an email.
 */
export function getRequestStatusForEmail(email?: string | null): {
  status: "none" | "pending" | "approved" | "rejected";
  request?: AccessRequest;
} {
  if (!email) return { status: "none" };
  const norm = email.toLowerCase().trim();

  if (isUserApprovedByAdmin(norm)) {
    return { status: "approved" };
  }

  const requests = getLocalRequests();
  const match = requests.find((r) => r.email.toLowerCase().trim() === norm);
  if (!match) return { status: "none" };
  return { status: match.status, request: match };
}

/**
 * Submits a new permission request to the admin.
 */
export async function submitNewsroomAccessRequest(params: {
  userId?: string;
  email: string;
  displayName: string;
  requestedRole: "reporter" | "editor" | "contributor";
  beatReason: string;
}): Promise<AccessRequest> {
  const newReq: AccessRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    email: params.email.trim(),
    displayName: params.displayName.trim() || params.email.split("@")[0],
    requestedRole: params.requestedRole,
    beatReason: params.beatReason.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // 1. Save locally
  const current = getLocalRequests().filter((r) => r.email.toLowerCase() !== newReq.email.toLowerCase());
  current.unshift(newReq);
  saveLocalRequests(current);

  // 2. Best-effort Supabase sync (does not throw if table is not yet created)
  try {
    await supabase.from("newsroom_access_requests" as any).insert({
      id: newReq.id,
      user_id: newReq.userId,
      email: newReq.email,
      display_name: newReq.displayName,
      requested_role: newReq.requestedRole,
      beat_reason: newReq.beatReason,
      status: "pending",
    } as any);
  } catch (err) {
    console.warn("Could not sync access request to Supabase table:", err);
  }

  return newReq;
}

/**
 * Admin action: approves an access request.
 */
export async function approveAccessRequest(
  requestId: string,
  reviewerEmail = "ashiruma"
): Promise<boolean> {
  const requests = getLocalRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = "approved";
  req.reviewedAt = new Date().toISOString();
  req.reviewedBy = reviewerEmail;
  saveLocalRequests(requests);

  addApprovedEmail(req.email);

  // Sync to database if possible
  try {
    await supabase
      .from("newsroom_access_requests" as any)
      .update({ status: "approved", reviewed_at: req.reviewedAt, reviewed_by: reviewerEmail } as any)
      .eq("id", requestId);

    if (req.userId) {
      await supabase.from("user_roles").upsert(
        { user_id: req.userId, role: "editor" },
        { onConflict: "user_id,role" }
      );
    }
  } catch (err) {
    console.warn("Could not sync approval to database:", err);
  }

  return true;
}

/**
 * Admin action: rejects or revokes an access request.
 */
export async function rejectAccessRequest(requestId: string): Promise<boolean> {
  const requests = getLocalRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = "rejected";
  req.reviewedAt = new Date().toISOString();
  saveLocalRequests(requests);

  removeApprovedEmail(req.email);

  try {
    await supabase
      .from("newsroom_access_requests" as any)
      .update({ status: "rejected", reviewed_at: req.reviewedAt } as any)
      .eq("id", requestId);
  } catch (err) {
    console.warn("Could not sync rejection to database:", err);
  }

  return true;
}
