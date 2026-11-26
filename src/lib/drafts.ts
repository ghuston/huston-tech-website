// Drafts are built everywhere except production (the same rule as the /blocks showcase). Server only.
import { siteConfig } from "../../site.config.ts";
import { isProductionBuild } from "./build-target.ts";

export function showDrafts(env: Record<string, string | undefined> = process.env, productionBranch: string = siteConfig.domain.productionBranch): boolean {
  return !isProductionBuild(env, productionBranch);
}
