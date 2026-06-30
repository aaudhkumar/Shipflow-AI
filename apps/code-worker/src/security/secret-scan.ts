const SECRET_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{48}/,
  /AIza[0-9A-Za-z-_]{35}/,
  /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/,
];

// Simple entropy check for high entropy strings that might be secrets
function calculateEntropy(str: string): number {
  let entropy = 0;
  const chars = new Set(str);
  for (const char of chars) {
    const p = (str.split(char).length - 1) / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function scanForSecrets(content: string): boolean {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) return true;
  }
  
  // High entropy check for random alphanumeric strings > 20 chars
  const words = content.split(/[\s"'{}\[\]()=,;:]+/);
  for (const word of words) {
    if (word.length >= 20 && /^[A-Za-z0-9_-]+$/.test(word)) {
      if (calculateEntropy(word) > 4.5) return true;
    }
  }
  
  return false;
}
