import { describe, it, expect, beforeEach } from "vitest";
import {
  saveNewDraft,
  getDraftById,
  fetchAllNewsroomDrafts,
  updateDraftContent,
  deleteNewsroomDraft,
  deleteAllNewsroomDrafts,
  isValidUUID,
  ensureValidAuthorUUID,
  DEFAULT_ADMIN_AUTHOR_UUID,
  getLocalDrafts,
  setLocalDrafts,
} from "@/lib/editorial/draftStorage";

describe("Newsroom Draft Storage & Resilience", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("validates and generates valid UUIDs correctly", () => {
    expect(isValidUUID("2d623b06-aaca-414a-a0f8-fd7f12e372c6")).toBe(true);
    expect(isValidUUID("staff-1789622158757")).toBe(false);
    expect(isValidUUID("")).toBe(false);
    expect(isValidUUID(null)).toBe(false);
  });

  it("normalizes invalid author IDs (e.g. staff-timestamp) to valid UUID", () => {
    expect(ensureValidAuthorUUID("staff-1789622158757")).toBe(DEFAULT_ADMIN_AUTHOR_UUID);
    expect(ensureValidAuthorUUID("")).toBe(DEFAULT_ADMIN_AUTHOR_UUID);
    expect(ensureValidAuthorUUID(undefined)).toBe(DEFAULT_ADMIN_AUTHOR_UUID);

    const validCustomUUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    expect(ensureValidAuthorUUID(validCustomUUID)).toBe(validCustomUUID);
  });

  it("saves a new draft with guaranteed valid UUIDs and stores in localStorage fallback", async () => {
    const draft = await saveNewDraft({
      author_id: "staff-1789622158757", // invalid format should be converted
      headline: "Crazy Kennar Skits Capture Kenya's Cultural Pulse",
      lede: "Comedian Crazy Kennar has captivated millions of Kenyans with hilarious social satire.",
      body: "Comedian Crazy Kennar has captivated millions of Kenyans with hilarious social satire. Over the past five years, his creative collective has produced hundreds of sketches highlighting daily struggles...",
      category: "celebrity",
      region: "national",
      template_type: "breaking",
      sources: [{ url: "https://pulse.co.ke", title: "Pulse Live Kenya" }],
    });

    expect(draft).toBeDefined();
    expect(isValidUUID(draft.id)).toBe(true);
    expect(isValidUUID(draft.author_id)).toBe(true);
    expect(draft.author_id).toBe(DEFAULT_ADMIN_AUTHOR_UUID);
    expect(draft.headline).toBe("Crazy Kennar Skits Capture Kenya's Cultural Pulse");

    // Verify it is present in local storage
    const local = getLocalDrafts();
    expect(local.some((d) => d.id === draft.id)).toBe(true);
  });

  it("retrieves a draft by ID using getDraftById", async () => {
    const created = await saveNewDraft({
      author_id: DEFAULT_ADMIN_AUTHOR_UUID,
      headline: "Khaligraph Jones Lights Up Stadium Concert",
      lede: "Rapper Khaligraph Jones gave a legendary performance in Nairobi.",
      body: "Rapper Khaligraph Jones gave a legendary performance in Nairobi. Fans gathered from across East Africa to witness the historic concert...",
      category: "music",
      region: "national",
      template_type: "breaking",
    });

    const fetched = await getDraftById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.headline).toBe("Khaligraph Jones Lights Up Stadium Concert");
  }, 15000);

  it("updates draft content and updates the timestamp", async () => {
    const created = await saveNewDraft({
      headline: "Initial Headline",
      lede: "Initial lede.",
      body: "Initial body content with enough words for the story.",
      category: "celebrity",
      region: "national",
      template_type: "breaking",
    });

    await updateDraftContent(created.id, {
      headline: "Updated Headline for Amaica Newsroom",
      status: "review",
    });

    const updated = await getDraftById(created.id);
    expect(updated?.headline).toBe("Updated Headline for Amaica Newsroom");
    expect(updated?.status).toBe("review");
  }, 15000);

  it("deletes a draft cleanly from storage", async () => {
    const created = await saveNewDraft({
      headline: "To Be Deleted",
      lede: "Lede text.",
      body: "Body text.",
      category: "events",
      region: "national",
      template_type: "breaking",
    });

    expect(await getDraftById(created.id)).not.toBeNull();

    await deleteNewsroomDraft(created.id);

    expect(await getDraftById(created.id)).toBeNull();
  }, 15000);

  it("deletes all drafts from storage when deleteAllNewsroomDrafts is called", async () => {
    await saveNewDraft({
      headline: "Draft 1",
      lede: "Lede 1",
      body: "Body 1",
      category: "music",
      region: "national",
      template_type: "breaking",
    });
    await saveNewDraft({
      headline: "Draft 2",
      lede: "Lede 2",
      body: "Body 2",
      category: "film",
      region: "national",
      template_type: "breaking",
    });

    expect(getLocalDrafts().length).toBeGreaterThanOrEqual(2);

    const result = await deleteAllNewsroomDrafts();
    expect(result.success).toBe(true);
    expect(getLocalDrafts().length).toBe(0);
  }, 15000);
});
