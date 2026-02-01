import argon2 from "argon2";

// =============================================================================
// Argon2 Password Hashing Service
// Production-level password hashing using Argon2id variant
// =============================================================================

/**
 * Argon2 configuration options
 * Using recommended settings for password hashing
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id, // Hybrid of argon2i and argon2d - recommended for passwords
  memoryCost: 65536, // 64 MB memory
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel threads
  hashLength: 32, // 32 bytes hash length
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, ARGON2_OPTIONS);
  } catch (error) {
    console.error("[Argon2] Hash error:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against its hash
 * @param hash - Stored password hash
 * @param password - Plain text password to verify
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error("[Argon2] Verify error:", error);
    return false;
  }
}

/**
 * Check if a password hash needs rehashing
 * (e.g., if hashing parameters have changed)
 * @param hash - Stored password hash
 * @returns Boolean indicating if rehash is needed
 */
export async function needsRehash(hash: string): Promise<boolean> {
  try {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  } catch {
    return true;
  }
}
