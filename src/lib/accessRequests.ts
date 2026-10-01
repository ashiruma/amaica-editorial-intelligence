/**
 * Amaica Editorial Intelligence Platform
 * Newsroom Access & Clearance Request Engine
 *
 * Ensures only the administrator (ashiruma) has default access.
 * All other contributors/staff must submit a permission request
 * that the admin reviews and approves before newsroom clearance is granted.
 *
 * Provides resilient multi-tier persistence:
 * 1. Live serverless API (/api/access-requests)
 * 2. Distributed cloud registry fallback (api.restful-api.dev)
 * 3. Supabase relational database (newsroom_access_requests table)
 * 4. Local safeStorage cache
 *
 * Strict Zero-Emoji Workplace Standard enforced.
 */

import { supabase } from "@/integrations/supabase/client";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

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
const REGISTRY_OBJECT_ID = "ff808181a09d98f701a0f78621bc570d";
const REGISTRY_CLOUD_URL = `https://api.restful-api.dev/objects/${REGISTRY_OBJECT_ID}`;

export function getLocalRequests(): AccessRequest[] {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalRequests(requests: AccessRequest[]) {
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {}
}

export function getApprovedEmails(): string[] {
  try {
    const raw = safeGetItem(APPROVED_USERS_KEY);
    if (!raw) return ["ashiruma", "ashirumaabala@gmail.com", "admin@amaicamedia.com"];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ["ashiruma", "ashirumaabala@gmail.com", "admin@amaicamedia.com"];
  } catch {
    return ["ashiruma", "ashirumaabala@gmail.com", "admin@amaicamedia.com"];
  }
}

export function addApprovedEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const current = getApprovedEmails();
  if (!current.includes(norm)) {
    current.push(norm);
    try {
      safeSetItem(APPROVED_USERS_KEY, JSON.stringify(current));
    } catch {}
  }
}

export function removeApprovedEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const current = getApprovedEmails().filter((e) => e !== norm);
  try {
    safeSetItem(APPROVED_USERS_KEY, JSON.stringify(current));
  } catch {}
}

/**
 * Checks whether a given user is approved by the admin.
 */
export function isUserApprovedByAdmin(email?: string | null): boolean {
  if (!email) return false;
  const norm = email.toLowerCase().trim();

  // The primary admin always has default access
  if (
    norm.includes("ashiruma") ||
    norm === "admin@amaicamedia.com" ||
    norm === "ashirumaabala@gmail.com"
  ) {
    return true;
  }

  const approved = getApprovedEmails();
  return approved.includes(norm);
}

/**
 * Direct cloud registry fallback fetch
 */
async function fetchDirectCloudRegistry(): Promise<{
  requests: AccessRequest[];
  approvedEmails: string[];
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(REGISTRY_CLOUD_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const body = await res.json();
      if (body?.data?.requests && Array.isArray(body.data.requests)) {
        return {
          requests: body.data.requests,
          approvedEmails: Array.isArray(body.data.approvedEmails)
            ? body.data.approvedEmails
            : ["ashiruma", "ashirumaabala@gmail.com", "admin@amaicamedia.com"],
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Direct cloud registry save fallback
 */
async function saveDirectCloudRegistry(
  requests: AccessRequest[],
  approvedEmails: string[]
): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(REGISTRY_CLOUD_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "wireops_desk_clearances_master_v1",
        data: {
          requests,
          approvedEmails,
          updatedAt: new Date().toISOString(),
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {}
}

/**
 * Fetches all newsroom access requests across devices.
 * Primary: /api/access-requests
 * Fallback: Direct cloud registry -> Local storage
 */
export async function fetchNewsroomAccessRequests(): Promise<AccessRequest[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("/api/access-requests", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.requests && Array.isArray(data.requests)) {
        // Cache to local storage
        saveLocalRequests(data.requests);

        if (Array.isArray(data.approvedEmails)) {
          safeSetItem(APPROVED_USERS_KEY, JSON.stringify(data.approvedEmails));
        }

        return data.requests;
      }
    }
  } catch {}

  // Fallback to direct cloud registry
  const cloudData = await fetchDirectCloudRegistry();
  if (cloudData && cloudData.requests.length > 0) {
    saveLocalRequests(cloudData.requests);
    safeSetItem(APPROVED_USERS_KEY, JSON.stringify(cloudData.approvedEmails));
    return cloudData.requests;
  }

  // Fallback to local storage
  return getLocalRequests();
}

/**
 * Checks the online status of an access clearance request for a specific email.
 */
export async function checkOnlineClearanceStatus(email?: string | null): Promise<{
  status: "none" | "pending" | "approved" | "rejected";
  approved: boolean;
  request?: AccessRequest;
}> {
  if (!email) return { status: "none", approved: false };
  const norm = email.toLowerCase().trim();

  // Fast path for admin
  if (isUserApprovedByAdmin(norm)) {
    return { status: "approved", approved: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`/api/access-requests?checkEmail=${encodeURIComponent(norm)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.status) {
        if (data.status === "approved" || data.approved) {
          addApprovedEmail(norm);
        }
        return {
          status: data.status,
          approved: data.approved || data.status === "approved",
          request: data.request,
        };
      }
    }
  } catch {}

  // Fallback to local / cloud check
  const local = getRequestStatusForEmail(norm);
  return {
    status: local.status,
    approved: local.status === "approved",
    request: local.request,
  };
}

/**
 * Synchronous local check for an email status.
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
 * Submits a new permission request to the admin with cross-device sync.
 */
export async function submitNewsroomAccessRequest(params: {
  userId?: string;
  email: string;
  displayName: string;
  requestedRole: "reporter" | "editor" | "contributor";
  beatReason: string;
}): Promise<AccessRequest> {
  const normEmail = params.email.trim().toLowerCase();
  const newReq: AccessRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    email: normEmail,
    displayName: params.displayName.trim() || normEmail.split("@")[0],
    requestedRole: params.requestedRole,
    beatReason: params.beatReason.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // 1. Optimistically save to local cache
  const current = getLocalRequests().filter((r) => r.email.toLowerCase() !== normEmail);
  current.unshift(newReq);
  saveLocalRequests(current);

  // 2. Submit to serverless API
  let serverlessSuccess = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: params.userId,
        email: normEmail,
        displayName: newReq.displayName,
        requestedRole: newReq.requestedRole,
        beatReason: newReq.beatReason,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.request) {
        serverlessSuccess = true;
      }
    }
  } catch {}

  // 3. If serverless API is unreachable (e.g. static dev), fallback to direct cloud sync
  if (!serverlessSuccess) {
    try {
      const existing = (await fetchDirectCloudRegistry()) || {
        requests: current,
        approvedEmails: getApprovedEmails(),
      };
      const filtered = existing.requests.filter((r) => r.email.toLowerCase() !== normEmail);
      filtered.unshift(newReq);
      await saveDirectCloudRegistry(filtered, existing.approvedEmails);
    } catch {}
  }

  // 4. Best-effort Supabase sync
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
    // Supabase table may not exist or host may be offline
  }

  return newReq;
}

/**
 * Admin action: approves an access request with cross-device sync.
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

  // 1. Sync via Serverless API
  let serverlessSuccess = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("/api/access-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        action: "approve",
        reviewerEmail,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      serverlessSuccess = true;
    }
  } catch {}

  // 2. Fallback to direct cloud registry sync
  if (!serverlessSuccess) {
    try {
      const existing = (await fetchDirectCloudRegistry()) || {
        requests,
        approvedEmails: getApprovedEmails(),
      };
      const updatedReqs = existing.requests.map((r) => (r.id === requestId ? req : r));
      const nextApproved = existing.approvedEmails.includes(req.email.toLowerCase())
        ? existing.approvedEmails
        : [...existing.approvedEmails, req.email.toLowerCase()];
      await saveDirectCloudRegistry(updatedReqs, nextApproved);
    } catch {}
  }

  // 3. Supabase sync if possible
  try {
    await supabase
      .from("newsroom_access_requests" as any)
      .update({
        status: "approved",
        reviewed_at: req.reviewedAt,
        reviewed_by: reviewerEmail,
      } as any)
      .eq("id", requestId);

    if (req.userId) {
      await supabase.from("user_roles").upsert(
        { user_id: req.userId, role: "editor" },
        { onConflict: "user_id,role" }
      );
    }
  } catch {}

  return true;
}

/**
 * Admin action: rejects or revokes an access request with cross-device sync.
 */
export async function rejectAccessRequest(
  requestId: string,
  reviewerEmail = "ashiruma"
): Promise<boolean> {
  const requests = getLocalRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = "rejected";
  req.reviewedAt = new Date().toISOString();
  req.reviewedBy = reviewerEmail;
  saveLocalRequests(requests);

  removeApprovedEmail(req.email);

  // 1. Sync via Serverless API
  let serverlessSuccess = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("/api/access-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        action: "reject",
        reviewerEmail,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      serverlessSuccess = true;
    }
  } catch {}

  // 2. Fallback to direct cloud registry sync
  if (!serverlessSuccess) {
    try {
      const existing = (await fetchDirectCloudRegistry()) || {
        requests,
        approvedEmails: getApprovedEmails(),
      };
      const updatedReqs = existing.requests.map((r) => (r.id === requestId ? req : r));
      const nextApproved = existing.approvedEmails.filter(
        (e) => e.toLowerCase() !== req.email.toLowerCase()
      );
      await saveDirectCloudRegistry(updatedReqs, nextApproved);
    } catch {}
  }

  // 3. Supabase sync if possible
  try {
    await supabase
      .from("newsroom_access_requests" as any)
      .update({
        status: "rejected",
        reviewed_at: req.reviewedAt,
        reviewed_by: reviewerEmail,
      } as any)
      .eq("id", requestId);
  } catch {}

  return true;
}
