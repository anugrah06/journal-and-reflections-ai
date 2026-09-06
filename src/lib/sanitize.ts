/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Ensures no undefined values are passed to Firestore setDoc/updateDoc.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value);
      }
    }
    return clean as unknown as T;
  }
  return obj;
}
