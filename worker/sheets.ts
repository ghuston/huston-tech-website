import { log, retryable, TIMEOUT_MS } from "./env.ts";

/**
 * Appends one row to Grant's Google Sheet as a service account, with no library: the OAuth JWT is signed with Web
 * Crypto (RS256) and exchanged for an access token, then the row goes in through the Sheets API.
 * https://developers.google.com/identity/protocols/oauth2/service-account
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

type ServiceAccount = { client_email: string; private_key: string };

let cachedToken: { value: string; expiresAt: number; account: string } | null = null;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlJson(value: object): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

function parseServiceAccount(json: string): ServiceAccount | null {
  try {
    const data = JSON.parse(json) as Partial<ServiceAccount>;
    if (typeof data.client_email === "string" && typeof data.private_key === "string") {
      return { client_email: data.client_email, private_key: data.private_key };
    }
  } catch {
    // Falls through to null; the caller logs a fixed event, never the value.
  }
  return null;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/** The signed JWT assertion for the token exchange. Exported for the tests. */
export async function signAssertion(account: ServiceAccount, now: number): Promise<string> {
  const header = base64urlJson({ alg: "RS256", typ: "JWT" });
  const claims = base64urlJson({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 });
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  return `${header}.${claims}.${base64url(new Uint8Array(signature))}`;
}

async function accessToken(account: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.account === account.client_email && cachedToken.expiresAt > now + 60) return cachedToken.value;
  try {
    const assertion = await signAssertion(account, now);
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      log("sheet_token_failed", { status: response.status });
      return null;
    }
    const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof data.access_token !== "string") return null;
    const lifetime = typeof data.expires_in === "number" ? data.expires_in : 3600;
    cachedToken = { value: data.access_token, expiresAt: now + lifetime, account: account.client_email };
    return data.access_token;
  } catch {
    log("sheet_token_unreachable");
    return null;
  }
}

/**
 * Cells starting with = + - @ (or a tab or carriage return) could run as formulas if the sheet is later exported and
 * opened elsewhere, so they get a leading apostrophe (OWASP CSV injection guidance). RAW input already stops Sheets
 * itself from parsing them.
 */
export function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Appends `row` to the given tab. Retries once on a rate limit, server error, expired token or network failure. */
export async function appendRow(keyJson: string | undefined, sheetId: string | undefined, tab: string, row: string[]): Promise<boolean> {
  const account = keyJson ? parseServiceAccount(keyJson) : null;
  if (!account || !sheetId) {
    log("sheet_config_missing");
    return false;
  }
  const range = encodeURIComponent(`${tab}!A:K`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const body = JSON.stringify({ values: [row.map(safeCell)] });
  for (let attempt = 1; attempt <= 2; attempt++) {
    const token = await accessToken(account);
    if (!token) return false;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.ok) return true;
      log("sheet_append_failed", { status: response.status, attempt });
      if (response.status === 401) cachedToken = null;
      else if (!retryable(response.status)) return false;
    } catch {
      log("sheet_unreachable", { attempt });
    }
  }
  return false;
}

/** Test helper: forget the cached access token. */
export function resetTokenCache(): void {
  cachedToken = null;
}
