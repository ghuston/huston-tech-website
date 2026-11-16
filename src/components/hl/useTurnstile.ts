import { useCallback, useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile for the contact form, loaded only when the visitor first focuses the form (or submits), so
 * page load never fetches the third-party script. Managed mode with "interaction-only": the widget stays invisible
 * unless Cloudflare needs a click. The origin is allowed in public/_headers (script-src and frame-src).
 */

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/** Cloudflare's published always-pass test key, used only on local hosts. https://developers.cloudflare.com/turnstile/troubleshooting/testing/ */
const LOCAL_TEST_SITE_KEY = "1x00000000000000000000AA";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** Long enough for a visitor to answer a challenge if Cloudflare shows one. */
const TOKEN_TIMEOUT_MS = 60_000;

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** The site key to use on this host: the test key locally, otherwise the configured one (null until it is set). */
export function turnstileSiteKey(configured: string | null): string | null {
  if (typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname)) return LOCAL_TEST_SITE_KEY;
  return configured;
}

export function useTurnstile(configuredSiteKey: string | null) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiting = useRef<((value: string | null) => void)[]>([]);

  const settle = useCallback((value: string | null) => {
    const resolvers = waiting.current;
    waiting.current = [];
    resolvers.forEach((resolve) => resolve(value));
  }, []);

  const start = useCallback(() => {
    const sitekey = turnstileSiteKey(configuredSiteKey);
    if (!sitekey || widgetId.current !== null) return;
    loadScript()
      .then((api) => {
        if (!container.current || widgetId.current !== null) return;
        widgetId.current = api.render(container.current, {
          sitekey,
          action: "contact",
          appearance: "interaction-only",
          "refresh-expired": "auto",
          "response-field": false,
          callback: (value: string) => {
            token.current = value;
            settle(value);
          },
          "expired-callback": () => {
            token.current = null;
          },
          "error-callback": () => {
            token.current = null;
            settle(null);
          },
        });
      })
      .catch(() => settle(null));
  }, [configuredSiteKey, settle]);

  /** Resolves with a fresh token, or null if Turnstile failed, couldn't load, or took too long. */
  const getToken = useCallback((): Promise<string | null> => {
    start();
    if (token.current) return Promise.resolve(token.current);
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        waiting.current = waiting.current.filter((r) => r !== done);
        resolve(null);
      }, TOKEN_TIMEOUT_MS);
      const done = (value: string | null) => {
        window.clearTimeout(timer);
        resolve(value);
      };
      waiting.current.push(done);
    });
  }, [start]);

  /** Tokens work once, so the widget is reset after every attempt that didn't leave the page. */
  const reset = useCallback(() => {
    token.current = null;
    if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
  }, []);

  useEffect(
    () => () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
    },
    [],
  );

  return { containerRef: container, start, getToken, reset };
}
