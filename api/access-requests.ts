/**
 * Vercel Serverless Function: Newsroom Access Clearance Requests Engine
 * Location: api/access-requests.ts
 *
 * Provides cross-device synchronization and persistence for contributor
 * clearance requests and administrator approvals across browsers and locations.
 *
 * Adheres strictly to the Zero-Emoji Workplace Standard.
 */

import fs from "fs";
import path from "path";

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

interface ClearancesRegistryData {
  requests: AccessRequest[];
  approvedEmails: string[];
  updatedAt: string;
}

// Persistent cloud object reference for WireOps Desk clearances
const REGISTRY_OBJECT_ID = "ff808181a09d98f701a0f78621bc570d";
const REGISTRY_CLOUD_URL = `https://api.restful-api.dev/objects/${REGISTRY_OBJECT_ID}`;

// Ephemeral container /tmp backup file
const TMP_FILE_PATH = path.join(
  process.env.TEMP || process.env.TMPDIR || "/tmp",
  "wireops_clearances_store.json"
);

// In-memory container state
let memoryState: ClearancesRegistryData = {
  requests: [],
  approvedEmails: ["ashiruma", "ashirumaabala@gmail.com", "admin@amaicamedia.com"],
  updatedAt: new Date().toISOString(),
};

/**
 * Reads local /tmp cache if present
 */
function readTmpCache(): ClearancesRegistryData | null {
  try {
    if (fs.existsSync(TMP_FILE_PATH)) {
      const raw = fs.readFileSync(TMP_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

/**
 * Writes local /tmp cache
 */
function writeTmpCache(data: ClearancesRegistryData) {
  try {
    fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(data), "utf8");
  } catch {}
}

/**
 * Loads current state with cloud synchronization
 */
async function loadState(): Promise<ClearancesRegistryData> {
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
        memoryState = {
          requests: body.data.requests,
          approvedEmails: Array.isArray(body.data.approvedEmails)
            ? body.data.approvedEmails
            : memoryState.approvedEmails,
          updatedAt: body.data.updatedAt || new Date().toISOString(),
        };
        writeTmpCache(memoryState);
        return memoryState;
      }
    }
  } catch (err) {
    console.warn("Could not fetch remote clearances registry, falling back to local cache:", err);
  }

  // Fallback to /tmp cache
  const tmpData = readTmpCache();
  if (tmpData && Array.isArray(tmpData.requests)) {
    memoryState = tmpData;
  }

  return memoryState;
}

/**
 * Saves state to cloud and updates container cache
 */
async function saveState(data: ClearancesRegistryData): Promise<void> {
  memoryState = data;
  writeTmpCache(data);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(REGISTRY_CLOUD_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "wireops_desk_clearances_master_v1",
        data,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn("Could not save to remote clearances registry:", err);
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const state = await loadState();

    // 1. GET: Fetch requests or check a specific email
    if (req.method === "GET") {
      const { checkEmail } = req.query || {};

      if (checkEmail && typeof checkEmail === "string") {
        const norm = checkEmail.toLowerCase().trim();
        const isAdmin =
          norm.includes("ashiruma") ||
          norm === "admin@amaicamedia.com" ||
          state.approvedEmails.some((e) => e.toLowerCase() === norm);

        if (isAdmin) {
          return res.status(200).json({
            success: true,
            status: "approved",
            approved: true,
          });
        }

        const match = state.requests.find((r) => r.email.toLowerCase().trim() === norm);
        if (match) {
          return res.status(200).json({
            success: true,
            status: match.status,
            approved: match.status === "approved",
            request: match,
          });
        }

        return res.status(200).json({
          success: true,
          status: "none",
          approved: false,
        });
      }

      // Return complete list for admin
      return res.status(200).json({
        success: true,
        count: state.requests.length,
        requests: state.requests,
        approvedEmails: state.approvedEmails,
        updatedAt: state.updatedAt,
      });
    }

    // 2. POST: Submit a new access clearance request
    if (req.method === "POST") {
      const body = req.body || {};
      const { email, displayName, requestedRole = "contributor", beatReason, userId } = body;

      if (!email || !displayName || !beatReason) {
        return res.status(400).json({
          error: "Missing required fields: email, displayName, beatReason",
        });
      }

      const normEmail = String(email).toLowerCase().trim();
      const existingIdx = state.requests.findIndex(
        (r) => r.email.toLowerCase().trim() === normEmail
      );

      const newRequest: AccessRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: userId || undefined,
        email: normEmail,
        displayName: String(displayName).trim(),
        requestedRole: ["reporter", "editor", "contributor"].includes(requestedRole)
          ? requestedRole
          : "contributor",
        beatReason: String(beatReason).trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      let updatedRequests = [...state.requests];
      if (existingIdx >= 0) {
        // Update existing submission with new timestamp & reason
        updatedRequests[existingIdx] = {
          ...updatedRequests[existingIdx],
          displayName: newRequest.displayName,
          requestedRole: newRequest.requestedRole,
          beatReason: newRequest.beatReason,
          status: "pending",
          createdAt: newRequest.createdAt,
        };
      } else {
        updatedRequests.unshift(newRequest);
      }

      const nextState: ClearancesRegistryData = {
        ...state,
        requests: updatedRequests,
        updatedAt: new Date().toISOString(),
      };

      await saveState(nextState);

      return res.status(201).json({
        success: true,
        request: existingIdx >= 0 ? updatedRequests[existingIdx] : newRequest,
      });
    }

    // 3. PATCH: Approve or Reject a clearance request
    if (req.method === "PATCH") {
      const body = req.body || {};
      const { requestId, action, reviewerEmail = "ashiruma" } = body;

      if (!requestId || !action) {
        return res.status(400).json({
          error: "Missing required fields: requestId, action (approve | reject)",
        });
      }

      const target = state.requests.find((r) => r.id === requestId);
      if (!target) {
        return res.status(404).json({ error: "Access request not found" });
      }

      const normEmail = target.email.toLowerCase().trim();
      let nextApproved = [...state.approvedEmails];

      if (action === "approve") {
        target.status = "approved";
        target.reviewedAt = new Date().toISOString();
        target.reviewedBy = String(reviewerEmail).trim();
        if (!nextApproved.includes(normEmail)) {
          nextApproved.push(normEmail);
        }
      } else if (action === "reject") {
        target.status = "rejected";
        target.reviewedAt = new Date().toISOString();
        target.reviewedBy = String(reviewerEmail).trim();
        nextApproved = nextApproved.filter((e) => e.toLowerCase() !== normEmail);
      } else {
        return res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'." });
      }

      const nextState: ClearancesRegistryData = {
        ...state,
        requests: state.requests.map((r) => (r.id === requestId ? target : r)),
        approvedEmails: nextApproved,
        updatedAt: new Date().toISOString(),
      };

      await saveState(nextState);

      return res.status(200).json({
        success: true,
        request: target,
        approvedEmails: nextApproved,
      });
    }

    return res.status(405).json({ error: "Method not allowed. Use GET, POST, or PATCH." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Access Requests API Error:", error);
    return res.status(500).json({ success: false, error: message });
  }
}
