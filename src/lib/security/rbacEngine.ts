/**
 * WireOps Desk / Amaica Media
 * Role-Based Access Control (RBAC) Engine
 *
 * Operational Standard: Zero-Emoji Workplace Standard
 * Defines the 5 granular newsroom tiers and permission matrix:
 * 1. INTERN_WRITER: Can create and edit own drafts; submit for review.
 * 2. REPORTER: Can create/edit own drafts, access intelligence beats.
 * 3. DESK_EDITOR: Can edit any draft, run stylebook/humanizer, verify claims.
 * 4. MANAGING_EDITOR: Can publish live, approve single-source sign-off, manage sources.
 * 5. CHIEF_ADMIN: Full administrative and credential access.
 */

export type NewsroomRole =
  | "INTERN_WRITER"
  | "REPORTER"
  | "DESK_EDITOR"
  | "MANAGING_EDITOR"
  | "CHIEF_ADMIN";

export type NewsroomAction =
  | "CREATE_DRAFT"
  | "EDIT_OWN_DRAFT"
  | "EDIT_ANY_DRAFT"
  | "DELETE_OWN_DRAFT"
  | "DELETE_ANY_DRAFT"
  | "TRIGGER_HUMANIZER"
  | "TRIGGER_STYLEBOOK"
  | "VERIFY_STORY"
  | "SINGLE_SOURCE_SIGN_OFF"
  | "PUBLISH_LIVE"
  | "MANAGE_SOURCES"
  | "ACCESS_SETTINGS"
  | "VIEW_AUDIT_LOGS"
  | "CONFIGURE_CREDENTIALS";

export const ROLE_HIERARCHY: Record<NewsroomRole, number> = {
  INTERN_WRITER: 1,
  REPORTER: 2,
  DESK_EDITOR: 3,
  MANAGING_EDITOR: 4,
  CHIEF_ADMIN: 5,
};

export class RbacAuthorizationError extends Error {
  public role: NewsroomRole;
  public action: NewsroomAction;

  constructor(role: NewsroomRole, action: NewsroomAction) {
    super(`Access Denied: Role '${role}' lacks permission for action '${action}'.`);
    this.name = "RbacAuthorizationError";
    this.role = role;
    this.action = action;
  }
}

/**
 * Normalizes any legacy or database string role into the canonical NewsroomRole enum.
 */
export function normalizeRole(role: string): NewsroomRole {
  const r = (role || "").toLowerCase().trim();
  if (r === "admin" || r === "chief_admin" || r === "superadmin") {
    return "CHIEF_ADMIN";
  }
  if (r === "managing_editor" || r === "chief_editor" || r === "desk_lead") {
    return "MANAGING_EDITOR";
  }
  if (r === "editor" || r === "senior_editor" || r === "desk_editor" || r === "sub_editor") {
    return "DESK_EDITOR";
  }
  if (r === "reporter" || r === "correspondent" || r === "journalist") {
    return "REPORTER";
  }
  return "INTERN_WRITER";
}

/**
 * Returns the highest ranking role among the given list of user roles.
 */
export function getHighestRole(roles: string[] | string): NewsroomRole {
  const roleList = Array.isArray(roles) ? roles : [roles];
  if (roleList.length === 0) return "INTERN_WRITER";

  let highest: NewsroomRole = "INTERN_WRITER";
  for (const r of roleList) {
    const norm = normalizeRole(r);
    if (ROLE_HIERARCHY[norm] > ROLE_HIERARCHY[highest]) {
      highest = norm;
    }
  }
  return highest;
}

/**
 * Core permission matrix defining actions allowed per role.
 */
const PERMISSION_MATRIX: Record<NewsroomAction, NewsroomRole[]> = {
  CREATE_DRAFT: ["INTERN_WRITER", "REPORTER", "DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  EDIT_OWN_DRAFT: ["INTERN_WRITER", "REPORTER", "DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  EDIT_ANY_DRAFT: ["DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  DELETE_OWN_DRAFT: ["REPORTER", "DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  DELETE_ANY_DRAFT: ["MANAGING_EDITOR", "CHIEF_ADMIN"],
  TRIGGER_HUMANIZER: ["DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  TRIGGER_STYLEBOOK: ["INTERN_WRITER", "REPORTER", "DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  VERIFY_STORY: ["DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  SINGLE_SOURCE_SIGN_OFF: ["MANAGING_EDITOR", "CHIEF_ADMIN"],
  PUBLISH_LIVE: ["MANAGING_EDITOR", "CHIEF_ADMIN"],
  MANAGE_SOURCES: ["MANAGING_EDITOR", "CHIEF_ADMIN"],
  ACCESS_SETTINGS: ["MANAGING_EDITOR", "CHIEF_ADMIN"],
  VIEW_AUDIT_LOGS: ["DESK_EDITOR", "MANAGING_EDITOR", "CHIEF_ADMIN"],
  CONFIGURE_CREDENTIALS: ["CHIEF_ADMIN"],
};

/**
 * Checks if a given role (or array of roles) has permission to execute an action.
 */
export function hasPermission(
  roles: string[] | string,
  action: NewsroomAction,
  context?: { isOwner?: boolean }
): boolean {
  const highest = getHighestRole(roles);

  // If action is editing or deleting own draft and user is the author
  if (context?.isOwner) {
    if (action === "EDIT_OWN_DRAFT" || action === "EDIT_ANY_DRAFT") {
      return true;
    }
    if (action === "DELETE_OWN_DRAFT") {
      return ROLE_HIERARCHY[highest] >= ROLE_HIERARCHY.REPORTER;
    }
  }

  const allowed = PERMISSION_MATRIX[action];
  if (!allowed) return false;

  return allowed.includes(highest);
}

/**
 * Asserts that the role has permission or throws an RbacAuthorizationError.
 */
export function assertPermission(
  roles: string[] | string,
  action: NewsroomAction,
  context?: { isOwner?: boolean }
): void {
  if (!hasPermission(roles, action, context)) {
    throw new RbacAuthorizationError(getHighestRole(roles), action);
  }
}

/**
 * Helper: Can publish live news articles.
 */
export function canPublishLive(roles: string[] | string): boolean {
  return hasPermission(roles, "PUBLISH_LIVE");
}

/**
 * Helper: Can approve single-source verification override.
 */
export function canSignOffSingleSource(roles: string[] | string): boolean {
  return hasPermission(roles, "SINGLE_SOURCE_SIGN_OFF");
}
