export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "ARCHIVE"
  | "STATUS_CHANGE"
  | "SESSION_REVOKED"
  | "PASSWORD_CHANGED"
  | "ACCOUNT_LOCKED";

export type AuditEntry = {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};
