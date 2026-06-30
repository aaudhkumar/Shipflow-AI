export function redactSecrets(input: unknown): unknown {
  if (typeof input === "string") {
    return input.replace(/([A-Za-z0-9_-]{20,})/g, "***REDACTED***"); // simplistic entropy scan
  }
  if (Array.isArray(input)) {
    return input.map(redactSecrets);
  }
  if (typeof input === "object" && input !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (key.toLowerCase().includes("secret") || key.toLowerCase().includes("key") || key.toLowerCase().includes("token")) {
        redacted[key] = "***REDACTED***";
      } else {
        redacted[key] = redactSecrets(value);
      }
    }
    return redacted;
  }
  return input;
}
