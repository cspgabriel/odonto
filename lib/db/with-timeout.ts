/**
 * Wraps a database query promise with an application-level timeout.
 * This is a safety net ADDITIONAL to the DB-level statement_timeout.
 * Purpose: prevent queries from hanging indefinitely in the Node.js process
 * even if the DB-level timeout doesn't fire (e.g. network issues).
 *
 * Usage:
 * const result = await withTimeout(
 *   db.select().from(patients),
 *   { ms: 15000, label: 'patients-list' }
 * )
 */
export async function withTimeout<T>(
  queryPromise: Promise<T>,
  options: {
    ms?: number;
    label?: string;
  } = {}
): Promise<T> {
  const { ms = 25000, label = "query" } = options;

  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () =>
        reject(
          new Error(
            `[CareNova] Query timeout after ${ms}ms${
              label ? ` (${label})` : ""
            }`
          )
        ),
      ms
    );
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}
