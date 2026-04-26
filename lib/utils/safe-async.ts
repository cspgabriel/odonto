/**
 * Safely execute a fire-and-forget async operation.
 * Catches ALL errors silently — use only for non-critical background tasks
 * (audit logging, session tracking, activity pings, cleanup).
 *
 * NEVER use this for operations the user depends on.
 * NEVER use this to hide real bugs — only for truly background work.
 */
export function fireAndForget(
  fn: () => Promise<unknown>,
  debugLabel?: string
): void {
  fn().catch((error) => {
    if (process.env.CARENOVA_DEBUG === "1" && debugLabel) {
      console.warn(
        `[CareNova] Background task failed (${debugLabel}):`,
        error
      );
    }
    // Never re-throw — this must not crash the process
  });
}
