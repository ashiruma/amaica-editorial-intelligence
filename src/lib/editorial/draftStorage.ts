import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_ADMIN_AUTHOR_UUID = "2d623b06-aaca-414a-a0f8-fd7f12e372c6";
const LOCAL_DRAFTS_STORAGE_KEY = "amaica_newsroom_local_drafts";

export interface NewsroomDraft {
  id: string;
  author_id: string;
  source_story_id: string | null;
  headline: string;
  lede: string | null;
  body: string | null;
  category: string | null;
  region: string;
  template_type: string;
  hero_image_url: string | null;
  social_image_url: string | null;
  byline: string | null;
  whatsapp_post: string | null;
  twitter_post: string | null;
  instagram_post: string | null;
  facebook_post: string | null;
  status: string;
  auto_publish_enabled?: boolean | null;
  auto_publish_at?: string | null;
  published_at?: string | null;
  idempotency_key?: string | null;
  sources: Array<{ url?: string; title?: string; notes?: string[] }>;
  created_at: string;
  updated_at: string;
}

export interface NewDraftPayload {
  author_id?: string | null;
  source_story_id?: string | null;
  headline: string;
  lede: string | null;
  body: string | null;
  category: string | null;
  region: string;
  template_type: string;
  hero_image_url?: string | null;
  social_image_url?: string | null;
  byline?: string | null;
  whatsapp_post?: string | null;
  twitter_post?: string | null;
  instagram_post?: string | null;
  facebook_post?: string | null;
  status?: string;
  idempotency_key?: string | null;
  sources?: Array<{ url?: string; title?: string; notes?: string[] }>;
}

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function ensureValidAuthorUUID(authorId?: string | null): string {
  if (isValidUUID(authorId)) {
    return authorId!.trim();
  }
  return DEFAULT_ADMIN_AUTHOR_UUID;
}

/**
 * Retrieves all locally-cached drafts.
 */
export function getLocalDrafts(): NewsroomDraft[] {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Could not parse local drafts:", e);
    return [];
  }
}

/**
 * Saves the full list of local drafts.
 */
export function setLocalDrafts(drafts: NewsroomDraft[]): void {
  try {
    localStorage.setItem(LOCAL_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn("Could not save to local drafts storage:", e);
  }
}

/**
 * Persists a single draft to local storage (insert or update).
 */
export function upsertLocalDraft(draft: NewsroomDraft): void {
  const existing = getLocalDrafts();
  const index = existing.findIndex((d) => d.id === draft.id || (draft.idempotency_key && d.idempotency_key === draft.idempotency_key));
  if (index >= 0) {
    existing[index] = { ...existing[index], ...draft, updated_at: new Date().toISOString() };
  } else {
    existing.unshift(draft);
  }
  setLocalDrafts(existing);
}

/**
 * Creates a new draft, attempting Supabase insert first and seamlessly
 * falling back to client-side local draft storage if RLS/connectivity blocks it.
 */
export async function saveNewDraft(payload: NewDraftPayload): Promise<NewsroomDraft> {
  const authorId = ensureValidAuthorUUID(payload.author_id);
  const now = new Date().toISOString();
  const draftId = crypto.randomUUID();
  const idempotencyKey = payload.idempotency_key || `draft:${draftId}`;

  const draftRecord: NewsroomDraft = {
    id: draftId,
    author_id: authorId,
    source_story_id: isValidUUID(payload.source_story_id) ? payload.source_story_id! : null,
    headline: payload.headline,
    lede: payload.lede,
    body: payload.body,
    category: payload.category || "celebrity",
    region: payload.region || "national",
    template_type: payload.template_type || "breaking",
    hero_image_url: payload.hero_image_url || null,
    social_image_url: payload.social_image_url || null,
    byline: payload.byline || "Amaica Newsroom",
    whatsapp_post: payload.whatsapp_post || null,
    twitter_post: payload.twitter_post || null,
    instagram_post: payload.instagram_post || null,
    facebook_post: payload.facebook_post || null,
    status: payload.status || "review",
    idempotency_key: idempotencyKey,
    sources: payload.sources || [],
    created_at: now,
    updated_at: now,
  };

  // 1. First check if a draft with this idempotency_key already exists in local storage
  const localMatch = getLocalDrafts().find((d) => d.idempotency_key === idempotencyKey);
  if (localMatch) {
    return localMatch;
  }

  // 2. Attempt remote Supabase insert
  try {
    const { data: inserted, error: dbErr } = await supabase
      .from("drafts")
      .insert({
        author_id: authorId,
        source_story_id: draftRecord.source_story_id,
        template_type: draftRecord.template_type,
        headline: draftRecord.headline,
        lede: draftRecord.lede,
        body: draftRecord.body,
        category: draftRecord.category,
        region: draftRecord.region,
        hero_image_url: draftRecord.hero_image_url,
        social_image_url: draftRecord.social_image_url,
        byline: draftRecord.byline,
        twitter_post: draftRecord.twitter_post,
        instagram_post: draftRecord.instagram_post,
        facebook_post: draftRecord.facebook_post,
        status: draftRecord.status,
        idempotency_key: draftRecord.idempotency_key,
        sources: draftRecord.sources,
      } as any)
      .select()
      .maybeSingle();

    if (!dbErr && inserted) {
      const fullDraft: NewsroomDraft = {
        ...draftRecord,
        ...(inserted as unknown as NewsroomDraft),
      };
      upsertLocalDraft(fullDraft);
      return fullDraft;
    }

    // If duplicate key error in Supabase, fetch the existing one
    if (dbErr && (dbErr as { code?: string }).code === "23505") {
      const { data: existingRemote } = await supabase
        .from("drafts")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existingRemote) {
        const fullExisting = existingRemote as unknown as NewsroomDraft;
        upsertLocalDraft(fullExisting);
        return fullExisting;
      }
    }

    console.warn("Remote draft insert encountered error, preserving to local newsroom storage:", dbErr);
  } catch (err) {
    console.warn("Supabase draft insert threw exception, storing locally:", err);
  }

  // 3. Fallback: Save to resilient local newsroom storage
  upsertLocalDraft(draftRecord);
  return draftRecord;
}

/**
 * Fetches a draft by its ID from Supabase or local storage.
 */
export async function getDraftById(id: string): Promise<NewsroomDraft | null> {
  if (!id) return null;

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      const remoteDraft = data as unknown as NewsroomDraft;
      upsertLocalDraft(remoteDraft);
      return remoteDraft;
    }
  } catch (e) {
    console.warn("Could not query draft from Supabase:", e);
  }

  // 2. Fallback to local storage
  const local = getLocalDrafts().find((d) => d.id === id);
  return local || null;
}

/**
 * Fetches all newsroom drafts, combining Supabase and local storage.
 */
export async function fetchAllNewsroomDrafts(options?: {
  showPublished?: boolean;
}): Promise<NewsroomDraft[]> {
  const local = getLocalDrafts();
  let remote: NewsroomDraft[] = [];

  try {
    let q = supabase
      .from("drafts")
      .select("id, headline, lede, body, category, region, status, template_type, hero_image_url, updated_at, idempotency_key")
      .order("updated_at", { ascending: false });

    if (!options?.showPublished) {
      q = q.neq("status", "published");
    }

    const { data, error } = await q;
    if (!error && data) {
      remote = data as unknown as NewsroomDraft[];
    }
  } catch (e) {
    console.warn("Could not fetch remote drafts:", e);
  }

  // Merge remote and local, deduplicating by ID or idempotency_key
  const map = new Map<string, NewsroomDraft>();

  // Add remote drafts first
  for (const r of remote) {
    map.set(r.id, r);
  }

  // Add or override with local drafts
  for (const l of local) {
    if (!options?.showPublished && l.status === "published") continue;
    let key = l.id;
    if (l.idempotency_key) {
      for (const [existingId, val] of map.entries()) {
        if (val.idempotency_key === l.idempotency_key) {
          key = existingId;
          break;
        }
      }
    }
    map.set(key, { ...(map.get(key) || {}), ...l });
  }

  const all = Array.from(map.values());
  all.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
  return all;
}

/**
 * Updates a draft locally and remotely.
 */
export async function updateDraftContent(
  id: string,
  updates: Partial<NewsroomDraft>
): Promise<void> {
  const now = new Date().toISOString();
  const cleanUpdates = { ...updates, updated_at: now };

  // 1. Update local storage
  const local = getLocalDrafts();
  const index = local.findIndex((d) => d.id === id);
  if (index >= 0) {
    local[index] = { ...local[index], ...cleanUpdates };
    setLocalDrafts(local);
  }

  // 2. Update remote Supabase
  try {
    await supabase
      .from("drafts")
      .update(cleanUpdates as any)
      .eq("id", id);
  } catch (e) {
    console.warn("Remote draft update error:", e);
  }
}

/**
 * Deletes a draft locally and remotely.
 */
export async function deleteNewsroomDraft(id: string): Promise<void> {
  // 1. Delete from local storage
  const local = getLocalDrafts().filter((d) => d.id !== id);
  setLocalDrafts(local);

  // 2. Delete from Supabase
  try {
    await supabase.from("drafts").delete().eq("id", id);
  } catch (e) {
    console.warn("Remote draft delete error:", e);
  }
}
