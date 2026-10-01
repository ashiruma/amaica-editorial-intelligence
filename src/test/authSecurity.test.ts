import { describe, it, expect } from "vitest";
import {
  normalizeRole,
  getHighestRole,
  hasPermission,
  assertPermission,
  canPublishLive,
  canSignOffSingleSource,
  RbacAuthorizationError,
  ROLE_HIERARCHY,
} from "@/lib/security/rbacEngine";

describe("Newsroom RBAC Engine & Security Hierarchy", () => {
  describe("Role Normalization and Hierarchy", () => {
    it("maps strings to canonical 5-tier newsroom roles", () => {
      expect(normalizeRole("admin")).toBe("CHIEF_ADMIN");
      expect(normalizeRole("chief_admin")).toBe("CHIEF_ADMIN");
      expect(normalizeRole("superadmin")).toBe("CHIEF_ADMIN");

      expect(normalizeRole("chief_editor")).toBe("MANAGING_EDITOR");
      expect(normalizeRole("managing_editor")).toBe("MANAGING_EDITOR");
      expect(normalizeRole("desk_lead")).toBe("MANAGING_EDITOR");

      expect(normalizeRole("editor")).toBe("DESK_EDITOR");
      expect(normalizeRole("senior_editor")).toBe("DESK_EDITOR");
      expect(normalizeRole("desk_editor")).toBe("DESK_EDITOR");

      expect(normalizeRole("reporter")).toBe("REPORTER");
      expect(normalizeRole("correspondent")).toBe("REPORTER");

      expect(normalizeRole("writer")).toBe("INTERN_WRITER");
      expect(normalizeRole("intern")).toBe("INTERN_WRITER");
      expect(normalizeRole("guest")).toBe("INTERN_WRITER");
    });

    it("verifies strict monotonic role hierarchy values", () => {
      expect(ROLE_HIERARCHY.CHIEF_ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MANAGING_EDITOR);
      expect(ROLE_HIERARCHY.MANAGING_EDITOR).toBeGreaterThan(ROLE_HIERARCHY.DESK_EDITOR);
      expect(ROLE_HIERARCHY.DESK_EDITOR).toBeGreaterThan(ROLE_HIERARCHY.REPORTER);
      expect(ROLE_HIERARCHY.REPORTER).toBeGreaterThan(ROLE_HIERARCHY.INTERN_WRITER);
    });

    it("evaluates highest role from multiple role claims", () => {
      expect(getHighestRole(["writer", "editor"])).toBe("DESK_EDITOR");
      expect(getHighestRole(["editor", "admin"])).toBe("CHIEF_ADMIN");
      expect(getHighestRole(["reporter", "managing_editor"])).toBe("MANAGING_EDITOR");
      expect(getHighestRole([])).toBe("INTERN_WRITER");
    });
  });

  describe("Permission Matrix Enforcement", () => {
    it("restricts INTERN_WRITER from publishing or editing others' drafts", () => {
      const writer = "INTERN_WRITER";
      expect(hasPermission(writer, "CREATE_DRAFT")).toBe(true);
      expect(hasPermission(writer, "EDIT_OWN_DRAFT", { isOwner: true })).toBe(true);
      expect(hasPermission(writer, "EDIT_ANY_DRAFT")).toBe(false);
      expect(hasPermission(writer, "DELETE_OWN_DRAFT", { isOwner: true })).toBe(false);
      expect(hasPermission(writer, "PUBLISH_LIVE")).toBe(false);
      expect(hasPermission(writer, "SINGLE_SOURCE_SIGN_OFF")).toBe(false);
      expect(hasPermission(writer, "CONFIGURE_CREDENTIALS")).toBe(false);
    });

    it("allows REPORTER to delete own draft but denies live publishing", () => {
      const reporter = "REPORTER";
      expect(hasPermission(reporter, "CREATE_DRAFT")).toBe(true);
      expect(hasPermission(reporter, "DELETE_OWN_DRAFT", { isOwner: true })).toBe(true);
      expect(hasPermission(reporter, "PUBLISH_LIVE")).toBe(false);
      expect(hasPermission(reporter, "TRIGGER_HUMANIZER")).toBe(false);
    });

    it("allows DESK_EDITOR to edit any draft and verify stories, but denies publishing without Managing Editor sign-off", () => {
      const editor = "DESK_EDITOR";
      expect(hasPermission(editor, "EDIT_ANY_DRAFT")).toBe(true);
      expect(hasPermission(editor, "VERIFY_STORY")).toBe(true);
      expect(hasPermission(editor, "TRIGGER_HUMANIZER")).toBe(true);
      expect(hasPermission(editor, "VIEW_AUDIT_LOGS")).toBe(true);
      expect(hasPermission(editor, "PUBLISH_LIVE")).toBe(false);
      expect(hasPermission(editor, "SINGLE_SOURCE_SIGN_OFF")).toBe(false);
    });

    it("allows MANAGING_EDITOR to publish live and approve single-source sign-off", () => {
      const managing = "MANAGING_EDITOR";
      expect(canPublishLive(managing)).toBe(true);
      expect(canSignOffSingleSource(managing)).toBe(true);
      expect(hasPermission(managing, "MANAGE_SOURCES")).toBe(true);
      expect(hasPermission(managing, "ACCESS_SETTINGS")).toBe(true);
      expect(hasPermission(managing, "CONFIGURE_CREDENTIALS")).toBe(false);
    });

    it("allows CHIEF_ADMIN full privileges including credential configuration", () => {
      const admin = "CHIEF_ADMIN";
      expect(canPublishLive(admin)).toBe(true);
      expect(hasPermission(admin, "CONFIGURE_CREDENTIALS")).toBe(true);
      expect(hasPermission(admin, "DELETE_ANY_DRAFT")).toBe(true);
    });

    it("assertPermission throws RbacAuthorizationError on unauthorized action", () => {
      expect(() => {
        assertPermission("REPORTER", "PUBLISH_LIVE");
      }).toThrow(RbacAuthorizationError);

      expect(() => {
        assertPermission("INTERN_WRITER", "TRIGGER_HUMANIZER");
      }).toThrow("Access Denied: Role 'INTERN_WRITER' lacks permission for action 'TRIGGER_HUMANIZER'.");
    });
  });
});
