// Whether a build is the production build. Import-free: the Next build and scripts/finish-build.mjs share this one rule.
// Drafts and the /blocks showcase are built everywhere except production.

/**
 * True on Workers Builds for the production branch, and on a Workers Builds build (WORKERS_CI set) that cannot name its
 * branch: it fails closed, so a build that misreports its branch hides drafts instead of showing them.
 */
export function isProductionBuild(env: Record<string, string | undefined>, productionBranch: string): boolean {
  const branch = env["WORKERS_CI_BRANCH"];
  const named = typeof productionBranch === "string" && productionBranch !== "" && branch === productionBranch;
  return named || (Boolean(env["WORKERS_CI"]) && !branch);
}
