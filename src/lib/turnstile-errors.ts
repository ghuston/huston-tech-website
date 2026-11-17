/**
 * Turnstile error codes that mean the site itself is set up wrong, so no retry by the visitor can ever pass: an invalid
 * site key, a hostname missing from the widget, or a bad action or cData. The form reports these as "failed" (our
 * fault, with the email fallback), like the Worker does for a missing or refused secret. Every other code (challenge
 * failed, timed out, unsupported browser) stays a visitor-side "try again".
 * https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
 * It imports nothing, so the Worker tests can load it.
 */
const CONFIG_ERROR_CODES = new Set(["110100", "110110", "110200", "110420", "110430"]);

export function isTurnstileConfigError(code: unknown): boolean {
  return typeof code === "string" && CONFIG_ERROR_CODES.has(code.trim());
}
