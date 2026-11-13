export function runFromHash(): unknown {
  return eval(window.location.hash.slice(1));
}
