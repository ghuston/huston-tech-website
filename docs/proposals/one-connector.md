# One connector per client

Write-up only; nothing built.

## The problem

A client with a site and the Pipeline app has two MCP connectors: one for the site's editor, and one for the Pipeline app. Claude's free plan allows one custom connector. So the owner cannot add both on the free plan. (MCP and the connector are described in [docs/EDITING.md](../EDITING.md).)

## The options

Each option has its build cost (the work to make it), its running cost (what it costs to keep going) and its trade-off.

| # | Option | Build | Running cost | Trade-off |
| --- | --- | --- | --- | --- |
| 1 | **The Pipeline app also offers the site's tools.** The Pipeline Worker forwards site tool calls to the site Worker's editor, server to server. It uses a per-client shared secret like `INTAKE_SECRET`, or a service binding, since both Workers run in Huston Logic's Cloudflare account. | About one run across both repos. | None extra. | A second way into the site's editor. Works only for clients who have the app. |
| 2 | **The site Worker offers the Pipeline tools.** The mirror of option 1. The site becomes the front door. | About one run across both repos. | None extra. | Works only for clients who have a site. |
| 3 | **A small gateway Worker per client,** with one connector address. It signs the owner in once, with the same Access and OAuth shape as the editor. It forwards each tool call to the site or the app through service bindings, so no secret crosses the internet. | About one run, plus a template for the gateway. | None extra on Workers Paid, well inside the included requests. | A third Worker per client to deploy and keep updated. |
| 4 | **Cloudflare's MCP server portals.** A Cloudflare One and Access feature that puts several MCP servers behind one address, with Access sign-in. | Configuration, plus an Access-token mode on both servers' MCP endpoints. | Part of Zero Trust. Its free plan covers up to 50 users across the account (the Pipeline app's docs note this limit). | Portal availability and pricing must be confirmed in Cloudflare's docs before anyone relies on it. |
| 5 | **The client uses a paid Claude plan,** which allows several connectors. | None. | The client's own subscription. The price follows Anthropic's current plans and must be confirmed before quoting. | A cost for the client. Other AI apps have their own limits. |

## Recommendation

**Option 3, the gateway Worker per client.** It keeps each product's own checks and credentials apart, and it works for any mix of products. Its one real cost is a third Worker per client to keep up to date.

## Not recommended

Merging the site and the Pipeline app into one Worker. It is a large rebuild, and it ties two products together.
