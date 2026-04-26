/**
 * Request pipeline debug logs. When /dashboard hangs, check terminal – last [CareNova] line is where it stuck.
 * - requestLog(): always on in development (NODE_ENV=development). Use for pipeline tracing.
 * - log() / logStart(): only when CARENOVA_DEBUG=1 (verbose).
 */

const ENABLED = process.env.CARENOVA_DEBUG === "1";
const IS_DEV = process.env.NODE_ENV === "development";

function ts(): string {
  return new Date().toISOString();
}

/** Always logs in development. Use for pipeline steps so we see exactly where a request sticks. */
export function requestLog(step: string, detail?: string): void {
  if (!IS_DEV) return;
  const msg = detail ? `[CareNova] ${ts()} ${step} | ${detail}` : `[CareNova] ${ts()} ${step}`;
  console.log(msg);
}

export function log(step: string, detail?: string): void {
  if (!ENABLED) return;
  const msg = detail ? `[CareNova] ${ts()} ${step} | ${detail}` : `[CareNova] ${ts()} ${step}`;
  console.log(msg);
}

export function logStart(step: string): () => void {
  if (!ENABLED) return () => {};
  const start = Date.now();
  log(step, "start");
  return () => {
    const ms = Date.now() - start;
    log(step, `done in ${ms}ms`);
  };
}
