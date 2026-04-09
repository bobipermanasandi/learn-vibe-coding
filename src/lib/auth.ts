export function parseBearerToken(authorizationHeader: unknown): string | null {
  if (typeof authorizationHeader !== "string") return null;

  const raw = authorizationHeader.trim();
  if (!raw) return null;

  // Case-insensitive "Bearer" is common in practice
  const match = /^Bearer\s+(.+)$/i.exec(raw);
  if (!match) return null;

  const token = match[1]?.trim();
  if (!token) return null;

  return token;
}

