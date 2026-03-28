/**
 * Parse API error bodies (NestJS-style JSON or plain text) for user-facing messages.
 */
export function parseErrorFromResponseBody(text: string): string {
  if (!text || !text.trim()) {
    return 'Something went wrong. Please try again.';
  }
  try {
    const j = JSON.parse(text) as {
      message?: string | string[];
      error?: string;
    };
    if (j.message !== undefined) {
      return Array.isArray(j.message) ? j.message.join(', ') : String(j.message);
    }
    if (j.error) {
      return j.error;
    }
  } catch {
    /* plain text */
  }
  const t = text.trim();
  return t.length > 400 ? `${t.slice(0, 400)}…` : t;
}
