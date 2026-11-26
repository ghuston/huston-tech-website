// The Worker entry named by wrangler.jsonc `main`. The forms (/api/*: the contact form and /api/forms/<id>, see api.ts)
// never depend on the editor. The owner's editor (spec, "Paths and modes") answers only on the site's own host in
// production, and only on its own paths; everything else is a plain 404. This is the one file that imports the OAuth library.
import { type OAuthHelpers, OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { siteConfig } from "../site.config.ts";
import { handleApi } from "./api.ts";
import { workerConfig } from "./config.ts";
import { log, type EditorEnv } from "./env.ts";
import { buildEditor } from "./editor/factory.ts";
import { editorActive, isEditorPath, missingBindings } from "./editor/gate.ts";
import { plainText } from "./http.ts";
import { handleMcp } from "./editor/mcp.ts";
import { handleOwner } from "./editor/owner-routes.ts";

type ProviderEnv = EditorEnv & { OAUTH_PROVIDER?: OAuthHelpers };

const AUTHORIZE_PATH = "/owner/connect";
const REGISTER_PATH = "/oauth/register";
const TOKEN_PATH = "/oauth/token";
const MCP_PATH = "/mcp";

const plain = (status: number, message: string): Response => plainText(status, `${message}\n`);

const notFound = (): Response => plain(404, "Not found.");

/** The owner's email from the token's grant props (set by the consent page), or null when the props are not what we wrote. */
function emailFrom(props: unknown): string | null {
  if (typeof props !== "object" || props === null) return null;
  const email = (props as { email?: unknown }).email;
  return typeof email === "string" && email !== "" ? email : null;
}

function createProvider(origin: string): OAuthProvider<ProviderEnv> {
  const { editor: config } = workerConfig;
  return new OAuthProvider<ProviderEnv>({
    apiRoute: MCP_PATH,
    apiHandler: {
      async fetch(request, env, ctx) {
        const email = emailFrom(ctx.props);
        if (email === null) {
          log("mcp_bad_grant");
          return plain(401, "This sign-in is not valid. Connect again from your AI app.");
        }
        return handleMcp(request, {
          editor: buildEditor(workerConfig, env),
          email,
          config,
          ...(env.EDITOR_RATE_LIMIT ? { rateLimit: env.EDITOR_RATE_LIMIT } : {}),
        });
      },
    },
    defaultHandler: {
      async fetch(request, env) {
        const { pathname } = new URL(request.url);
        if (pathname !== "/owner" && !pathname.startsWith("/owner/")) return notFound();
        const oauth = env.OAUTH_PROVIDER;
        if (!oauth) throw new Error("workers-oauth-provider did not supply its helpers.");
        return handleOwner(request, {
          editor: buildEditor(workerConfig, env),
          config,
          oauth,
          theme: siteConfig.editor.pageColors,
          ...(env.EDITOR_RATE_LIMIT ? { rateLimit: env.EDITOR_RATE_LIMIT } : {}),
        });
      },
    },
    authorizeEndpoint: AUTHORIZE_PATH,
    tokenEndpoint: TOKEN_PATH,
    clientRegistrationEndpoint: REGISTER_PATH,
    scopesSupported: ["site.edit"],
    accessTokenTTL: 3600,
    resourceMetadata: { resource: `${origin}${MCP_PATH}`, resource_name: `${config.siteName} site editor` },
    // Fixed fields only: the library's default logs the error description, which can quote what a client sent.
    onError: ({ code, status }) => {
      log("oauth_error", { code, status });
    },
  });
}

/** Names the pieces of one editor request: the two paths a stranger can call that write to OAUTH_KV are rate limited per IP. */
const RATE_LIMITED = new Set([REGISTER_PATH, AUTHORIZE_PATH]);

async function handleEditor(request: Request, env: ProviderEnv, ctx: ExecutionContext, url: URL): Promise<Response> {
  const missing = missingBindings(workerConfig, env);
  if (missing.length > 0) {
    log("editor_not_configured", { count: missing.length });
    return plain(500, "The site editor isn't set up yet.");
  }
  if (RATE_LIMITED.has(url.pathname) && env.EDITOR_RATE_LIMIT) {
    const { success } = await env.EDITOR_RATE_LIMIT.limit({ key: `ip:${request.headers.get("CF-Connecting-IP") ?? "unknown"}` });
    if (!success) {
      log("editor_rate_limited");
      const response = plain(429, "Too many requests. Wait a minute and try again.");
      response.headers.set("retry-after", "60");
      return response;
    }
  }
  // A copy of env: the library stores its helpers on the env it is given, and those belong to this request.
  return createProvider(url.origin).fetch(request, { ...env }, ctx);
}

export default {
  async fetch(request: Request, env: ProviderEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env);
    if (!editorActive(workerConfig, env, url) || !isEditorPath(url.pathname)) return notFound();
    return handleEditor(request, env, ctx, url);
  },
} satisfies ExportedHandler<ProviderEnv>;
