import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

// =============================================================================
// JWT Token Utilities
// Production-level JWT management with access and refresh tokens
// =============================================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-in-production";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

/**
 * JWT Payload structure for admin tokens
 */
export interface AdminTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  type: "access" | "refresh";
}

/**
 * Token pair returned after successful authentication
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: string,
  sessionId: string,
): TokenPair {
  const accessPayload: Omit<AdminTokenPayload, "iat" | "exp"> = {
    sub: userId,
    userId,
    email,
    role,
    sessionId,
    type: "access",
  };

  const refreshPayload: Omit<AdminTokenPayload, "iat" | "exp"> = {
    sub: userId,
    userId,
    email,
    role,
    sessionId,
    type: "refresh",
  };

  const accessOptions: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRY };
  const refreshOptions: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRY };

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, accessOptions);
  const refreshToken = jwt.sign(
    refreshPayload,
    JWT_REFRESH_SECRET,
    refreshOptions,
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    if (decoded.type !== "access") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as AdminTokenPayload;
    if (decoded.type !== "refresh") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Generate a password reset token (short-lived)
 */
export function generateResetToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: "reset" },
    JWT_SECRET,
    { expiresIn: "1h" }, // 1 hour expiry
  );
}

/**
 * Verify a password reset token
 */
export function verifyResetToken(
  token: string,
): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };
    if (decoded.type !== "reset") {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

/**
 * Generate a 2FA verification token (very short-lived)
 */
export function generateTwoFactorToken(
  userId: string,
  email: string,
  requestId: string,
): string {
  return jwt.sign(
    { userId, email, requestId, type: "2fa" },
    JWT_SECRET,
    { expiresIn: "5m" }, // 5 minute expiry
  );
}

/**
 * Verify a 2FA verification token
 */
export function verifyTwoFactorToken(
  token: string,
): { userId: string; email: string; requestId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      requestId: string;
      type: string;
    };
    if (decoded.type !== "2fa") {
      return null;
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      requestId: decoded.requestId,
    };
  } catch {
    return null;
  }
}
