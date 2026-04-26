/**
 * Wraps any DB query with a hard timeout.
 * Instead of hanging forever, throws a clear error after `ms` milliseconds.
 *
 * Usage:
 *   const users = await query(() => db.select().from(users), 'get-users')
 */
export async function query<T>(
  fn: () => Promise<T>,
  label: string,
  ms = 10000
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[DB TIMEOUT] "${label}" exceeded ${ms}ms`));
    }, ms);
  });

  try {
    const result = await Promise.race([fn(), timeout]);
    clearTimeout(timer!);
    return result;
  } catch (error) {
    clearTimeout(timer!);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[CareNova DB ERROR] ${label}:`, message);
    throw error;
  }
}
