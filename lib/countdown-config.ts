/**
 * Countdown target configuration for the prelaunch page.
 *
 * The event start datetime is sourced from the `NEXT_PUBLIC_LAUNCH_AT` env var
 * (ISO 8601 with the Asia/Ho_Chi_Minh offset, UTC+7). The spec originally
 * called for an API endpoint (marked TODO in Figma); per clarification we use
 * an env/config constant instead — the site has no backend.
 *
 * When the env var is unset, LAUNCH_AT defaults to 8 seconds from module load
 * (evaluated in the browser at page load) — a local-testing convenience so the
 * launch fires almost immediately and the login flow's countdown→homepage
 * branch can be exercised without waiting.
 *
 * TODO: set NEXT_PUBLIC_LAUNCH_AT to the real launch datetime in any deployed
 * environment — the now+8s default is for development only.
 */
export const LAUNCH_AT = process.env.NEXT_PUBLIC_LAUNCH_AT ?? new Date(Date.now() + 8_000).toISOString();

/**
 * True while the event has not started yet (now is before LAUNCH_AT). Drives
 * post-login routing: countdown page while waiting, homepage once the event is
 * live. An unparseable LAUNCH_AT is treated as "already launched" (false) so
 * login never traps the user on the countdown page.
 */
export function isBeforeLaunch(now: number = Date.now()): boolean {
  const launchMs = new Date(LAUNCH_AT).getTime();
  return Number.isFinite(launchMs) && now < launchMs;
}
