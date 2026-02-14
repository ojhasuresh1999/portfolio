import { AdminTokenPayload } from "./jwt.util";

// =============================================================================
// Audit Logger
// Structured logging for admin actions — production-ready for log aggregation
// (Datadog, CloudWatch, ELK, etc.)
// =============================================================================

export interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "2FA_VERIFY"
  | "PASSWORD_RESET"
  | "TOKEN_REFRESH"
  | "UPLOAD"
  | "SETTINGS_UPDATE";

class AuditLogger {
  private log(entry: AuditEntry): void {
    // Structured JSON log — easily parseable by log aggregation services
    const logEntry = {
      level: "AUDIT",
      ...entry,
    };

    // In production, this goes to stdout and is captured by the platform
    // (Vercel, Render, AWS, etc.)
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log a resource creation
   */
  create(
    admin: AdminTokenPayload,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>,
    ip?: string,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: "CREATE",
      userId: admin.userId,
      userEmail: admin.email,
      resource,
      resourceId,
      ip,
      details,
    });
  }

  /**
   * Log a resource update
   */
  update(
    admin: AdminTokenPayload,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>,
    ip?: string,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: "UPDATE",
      userId: admin.userId,
      userEmail: admin.email,
      resource,
      resourceId,
      ip,
      details,
    });
  }

  /**
   * Log a resource deletion
   */
  delete(
    admin: AdminTokenPayload,
    resource: string,
    resourceId: string,
    ip?: string,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: "DELETE",
      userId: admin.userId,
      userEmail: admin.email,
      resource,
      resourceId,
      ip,
    });
  }

  /**
   * Log an auth event
   */
  auth(
    action: Extract<
      AuditAction,
      | "LOGIN"
      | "LOGOUT"
      | "LOGIN_FAILED"
      | "2FA_VERIFY"
      | "PASSWORD_RESET"
      | "TOKEN_REFRESH"
    >,
    email: string,
    ip?: string,
    details?: Record<string, unknown>,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action,
      userId: "N/A",
      userEmail: email,
      resource: "auth",
      ip,
      details,
    });
  }

  /**
   * Log a file upload
   */
  upload(
    admin: AdminTokenPayload,
    resourceId: string,
    details?: Record<string, unknown>,
    ip?: string,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: "UPLOAD",
      userId: admin.userId,
      userEmail: admin.email,
      resource: "file",
      resourceId,
      ip,
      details,
    });
  }
}

export const auditLog = new AuditLogger();
